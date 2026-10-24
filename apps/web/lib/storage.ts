import { Project } from '@gravsystem/core';
import {
  loadProjects as loadProjectsDb,
  saveProjects as saveProjectsDb,
  saveProject as saveProjectDb,
  loadLastProjectId as loadLastProjectIdDb,
  saveLastProjectId as saveLastProjectIdDb,
  exportProjectsJson,
  importProjectsJson,
} from './db';

export function loadProjects(): Promise<Project[]> {
  return loadProjectsDb();
}

export function saveProjects(projects: Project[]): Promise<void> {
  return saveProjectsDb(projects);
}

export function saveProject(project: Project): Promise<void> {
  return saveProjectDb(project);
}

export function loadLastProjectId(): Promise<string | null> {
  return loadLastProjectIdDb();
}

export function saveLastProjectId(id: string): Promise<void> {
  return saveLastProjectIdDb(id);
}

export function exportProjectJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export { exportProjectsJson, importProjectsJson };
