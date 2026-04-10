import type { BrahmastraProject } from '../types';

const STORAGE_KEY = 'brahmastra_projects';

export function loadProjects(): BrahmastraProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BrahmastraProject[];
  } catch {
    return [];
  }
}

export function saveProject(project: BrahmastraProject): void {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.unshift(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function loadProject(id: string): BrahmastraProject | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}
