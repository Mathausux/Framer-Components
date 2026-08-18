import { Octokit } from "@octokit/rest";
import { PageBuilderProject } from "./schema";

const PROJECT_FILE_PATH = "project.json";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function getOctokit(): Octokit {
  return new Octokit({ auth: getEnv("GITHUB_TOKEN") });
}

function getOwner(): string {
  return getEnv("GITHUB_OWNER");
}

function getRepoTopic(): string {
  return process.env.PAGE_BUILDER_REPO_TOPIC || "page-builder-project";
}

export interface ProjectSummary {
  repo: string;
  name: string;
  description: string | null;
  updatedAt: string;
  htmlUrl: string;
}

/**
 * Lista repositórios do dono configurado que carregam o topic do Page Builder.
 */
export async function listProjectRepos(): Promise<ProjectSummary[]> {
  const octokit = getOctokit();
  const owner = getOwner();
  const topic = getRepoTopic();

  const { data } = await octokit.repos.listForUser({ username: owner, per_page: 100 });

  const withTopics = await Promise.all(
    data.map(async (repo) => {
      const { data: topicsData } = await octokit.repos.getAllTopics({
        owner,
        repo: repo.name,
      });
      return { repo, topics: topicsData.names };
    })
  );

  return withTopics
    .filter(({ topics }) => topics.includes(topic))
    .map(({ repo }) => ({
      repo: repo.name,
      name: repo.name,
      description: repo.description,
      updatedAt: repo.updated_at ?? repo.created_at ?? "",
      htmlUrl: repo.html_url,
    }));
}

/**
 * Cria um novo repositório para um projeto e commita o project.json inicial.
 */
export async function createProjectRepo(
  repoName: string,
  project: PageBuilderProject
): Promise<ProjectSummary> {
  const octokit = getOctokit();
  const topic = getRepoTopic();

  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description: `Projeto Page Builder: ${project.name}`,
    private: true,
    auto_init: true,
  });

  await octokit.repos.replaceAllTopics({
    owner: repo.owner.login,
    repo: repo.name,
    names: [topic],
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: repo.owner.login,
    repo: repo.name,
    path: PROJECT_FILE_PATH,
    message: "chore: inicializar project.json",
    content: Buffer.from(JSON.stringify(project, null, 2), "utf-8").toString("base64"),
  });

  return {
    repo: repo.name,
    name: repo.name,
    description: repo.description,
    updatedAt: repo.updated_at ?? repo.created_at ?? "",
    htmlUrl: repo.html_url,
  };
}

/**
 * Lê o project.json de um repositório existente.
 */
export async function getProjectFile(
  repoName: string
): Promise<{ project: PageBuilderProject; sha: string }> {
  const octokit = getOctokit();
  const owner = getOwner();

  const { data } = await octokit.repos.getContent({
    owner,
    repo: repoName,
    path: PROJECT_FILE_PATH,
  });

  if (Array.isArray(data) || data.type !== "file" || !data.content) {
    throw new Error(`${PROJECT_FILE_PATH} não encontrado ou inválido em ${repoName}`);
  }

  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  return { project: JSON.parse(raw) as PageBuilderProject, sha: data.sha };
}

/**
 * Salva (commita) o project.json de um repositório existente.
 */
export async function saveProjectFile(
  repoName: string,
  project: PageBuilderProject,
  previousSha: string,
  commitMessage = "chore: atualizar project.json"
): Promise<{ sha: string }> {
  const octokit = getOctokit();
  const owner = getOwner();

  const updated: PageBuilderProject = { ...project, updatedAt: new Date().toISOString() };

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: PROJECT_FILE_PATH,
    message: commitMessage,
    content: Buffer.from(JSON.stringify(updated, null, 2), "utf-8").toString("base64"),
    sha: previousSha,
  });

  if (!data.content?.sha) {
    throw new Error("GitHub não retornou o sha do arquivo atualizado.");
  }

  return { sha: data.content.sha };
}

/**
 * Grava múltiplos arquivos sob `basePath/` no repositório (usado pela
 * exportação de Fase 5). Cada arquivo vira um commit separado via Contents
 * API — simples e suficiente para o volume de arquivos de uma exportação,
 * mas não é atômico entre arquivos (uma falha no meio deixa parte já
 * commitada).
 */
export async function writeFiles(
  repoName: string,
  basePath: string,
  files: Record<string, string>
): Promise<{ paths: string[] }> {
  const octokit = getOctokit();
  const owner = getOwner();
  const paths: string[] = [];

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = `${basePath}/${relPath}`;
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo: repoName, path: fullPath });
      if (!Array.isArray(data) && data.type === "file") sha = data.sha;
    } catch {
      // Arquivo ainda não existe — segue sem sha (cria em vez de atualizar).
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: fullPath,
      message: `chore: exportar ${fullPath}`,
      content: Buffer.from(content, "utf-8").toString("base64"),
      sha,
    });
    paths.push(fullPath);
  }

  return { paths };
}
