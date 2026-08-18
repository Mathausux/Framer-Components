import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { PageBuilderProject } from "./schema";
import { ProjectSummary } from "./store";

/**
 * Driver de armazenamento local em disco, usado apenas quando GITHUB_TOKEN /
 * GITHUB_OWNER não estão configurados. Simula a mesma interface do driver
 * GitHub (incluindo um "sha" para concorrência otimista) para permitir rodar
 * e testar o editor sem depender de um repositório real.
 */

const STORAGE_DIR = path.join(process.cwd(), ".local-projects");

function projectFilePath(projectId: string): string {
  return path.join(STORAGE_DIR, projectId, "project.json");
}

function computeSha(content: string): string {
  return crypto.createHash("sha1").update(content).digest("hex");
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true });

  const summaries = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry): Promise<ProjectSummary | null> => {
        try {
          const raw = await fs.readFile(projectFilePath(entry.name), "utf-8");
          const project = JSON.parse(raw) as PageBuilderProject;
          const stat = await fs.stat(projectFilePath(entry.name));
          return {
            repo: entry.name,
            name: project.name,
            description: "Projeto local (sem GitHub configurado)",
            updatedAt: project.updatedAt ?? stat.mtime.toISOString(),
            htmlUrl: "#",
          };
        } catch {
          return null;
        }
      })
  );

  return summaries.filter((s): s is ProjectSummary => s !== null);
}

export async function createProject(
  projectId: string,
  project: PageBuilderProject
): Promise<ProjectSummary> {
  const dir = path.join(STORAGE_DIR, projectId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(projectFilePath(projectId), JSON.stringify(project, null, 2), "utf-8");

  return {
    repo: projectId,
    name: project.name,
    description: "Projeto local (sem GitHub configurado)",
    updatedAt: project.updatedAt ?? new Date().toISOString(),
    htmlUrl: "#",
  };
}

export async function getProject(
  projectId: string
): Promise<{ project: PageBuilderProject; sha: string }> {
  const raw = await fs.readFile(projectFilePath(projectId), "utf-8");
  return { project: JSON.parse(raw) as PageBuilderProject, sha: computeSha(raw) };
}

export async function saveProject(
  projectId: string,
  project: PageBuilderProject,
  previousSha: string
): Promise<{ sha: string }> {
  const raw = await fs.readFile(projectFilePath(projectId), "utf-8");
  const currentSha = computeSha(raw);
  if (currentSha !== previousSha) {
    throw new Error("Conflito: o projeto foi alterado por outra sessão desde o último carregamento.");
  }

  const updated: PageBuilderProject = { ...project, updatedAt: new Date().toISOString() };
  const nextRaw = JSON.stringify(updated, null, 2);
  await fs.writeFile(projectFilePath(projectId), nextRaw, "utf-8");

  return { sha: computeSha(nextRaw) };
}

export async function writeFiles(
  projectId: string,
  basePath: string,
  files: Record<string, string>
): Promise<{ paths: string[] }> {
  const paths: string[] = [];

  for (const [relPath, content] of Object.entries(files)) {
    const fullRelPath = `${basePath}/${relPath}`;
    const fullPath = path.join(STORAGE_DIR, projectId, fullRelPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
    paths.push(fullRelPath);
  }

  return { paths };
}
