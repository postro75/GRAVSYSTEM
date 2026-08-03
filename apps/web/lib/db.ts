import Dexie, { type EntityTable } from 'dexie';
import { Project } from '@gravsystem/core';

interface ProjectRecord {
  id: string;
  data: Project;
  createdAt: string;
  updatedAt: string;
}

interface SettingRecord {
  key: string;
  value: unknown;
}

const db = new Dexie('GravSystemDB') as Dexie & {
  projects: EntityTable<ProjectRecord, 'id'>;
  settings: EntityTable<SettingRecord, 'key'>;
};

db.version(1).stores({
  projects: 'id, createdAt, updatedAt',
  settings: 'key',
});

export async function loadProjects(): Promise<Project[]> {
  if (typeof window === 'undefined') return [];
  const records = await db.projects.orderBy('updatedAt').reverse().toArray();
  return records.map((r) => r.data);
}

export async function saveProject(project: Project): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.projects.put({
    id: project.id,
    data: project,
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.projects.delete(id);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.projects.bulkPut(
    projects.map((p) => ({
      id: p.id,
      data: p,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );
}

export async function loadLastProjectId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const record = await db.settings.get('lastProjectId');
  return (record?.value as string | undefined) ?? null;
}

export async function saveLastProjectId(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.settings.put({ key: 'lastProjectId', value: id });
}

export async function exportProjectsJson(): Promise<string> {
  const projects = await loadProjects();
  return JSON.stringify(projects, null, 2);
}

export async function importProjectsJson(json: string): Promise<Project[]> {
  const parsed = JSON.parse(json) as Project[];
  await saveProjects(parsed);
  return parsed;
}

export { db };
