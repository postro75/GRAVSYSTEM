import { Project } from '@gravsystem/core';

const STORAGE_KEY = 'gravsystem:projects';
const LAST_PROJECT_KEY = 'gravsystem:lastProjectId';

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // ignore storage errors
  }
}

export function loadLastProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_PROJECT_KEY);
}

export function saveLastProjectId(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_PROJECT_KEY, id);
}
