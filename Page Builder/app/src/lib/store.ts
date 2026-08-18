import { PageBuilderProject } from "./schema";
import * as github from "./github";
import * as local from "./localStore";

export interface ProjectSummary {
  repo: string;
  name: string;
  description: string | null;
  updatedAt: string;
  htmlUrl: string;
}

export interface ProjectStore {
  listProjects(): Promise<ProjectSummary[]>;
  createProject(projectId: string, project: PageBuilderProject): Promise<ProjectSummary>;
  getProject(projectId: string): Promise<{ project: PageBuilderProject; sha: string }>;
  saveProject(
    projectId: string,
    project: PageBuilderProject,
    sha: string
  ): Promise<{ sha: string }>;
  /**
   * Grava múltiplos arquivos de uma vez (ex: saída da exportação de
   * Fase 5), cada um sob `basePath/<caminho>`. Retorna os caminhos escritos.
   */
  writeFiles(
    projectId: string,
    basePath: string,
    files: Record<string, string>
  ): Promise<{ paths: string[] }>;
}

/**
 * Escolhe o driver de armazenamento: GitHub quando GITHUB_TOKEN e GITHUB_OWNER
 * estão configurados, ou um driver local em disco (para rodar/testar o editor
 * sem precisar de um Personal Access Token). O driver local NUNCA deve ser
 * usado em produção — serve só para desenvolvimento e testes manuais.
 */
export function getStore(): ProjectStore {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER) {
    return {
      listProjects: github.listProjectRepos,
      createProject: github.createProjectRepo,
      getProject: github.getProjectFile,
      saveProject: (id, project, sha) => github.saveProjectFile(id, project, sha),
      writeFiles: github.writeFiles,
    };
  }

  return {
    listProjects: local.listProjects,
    createProject: local.createProject,
    getProject: local.getProject,
    saveProject: local.saveProject,
    writeFiles: local.writeFiles,
  };
}
