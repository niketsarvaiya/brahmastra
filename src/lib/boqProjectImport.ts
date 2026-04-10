import type { BrahmastraProject, BOQProject } from '../types';
import { getToolsForProject } from './scopeToolMap';

interface BOQExportFile {
  boqVersion: string;
  exportedAt?: string;
  id: string;
  name: string;
  client: string;
  location: string;
  projectCode: string;
  createdAt: string;
  updatedAt: string;
  rooms: BOQProject['rooms'];
  lineItems: BOQProject['lineItems'];
}

/**
 * Parse a BOQ Builder JSON export → BrahmastraProject.
 * Pre-computes activeToolIds from BOQ scope/canonicalKey data.
 */
export function parseBOQForProject(json: string): BrahmastraProject | null {
  try {
    const data = JSON.parse(json) as BOQExportFile;
    if (!data.id || !data.lineItems || !data.rooms) return null;

    const boqData: BOQProject = {
      boqVersion: data.boqVersion,
      id: data.id,
      name: data.name,
      client: data.client,
      location: data.location,
      projectCode: data.projectCode,
      rooms: data.rooms,
      lineItems: data.lineItems,
    };

    const partial: BrahmastraProject = {
      id: crypto.randomUUID(),
      name: data.name,
      client: data.client ?? '',
      location: data.location ?? '',
      projectCode: data.projectCode ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boqData,
      activeToolIds: [],
    };

    // Compute tools from BOQ scope
    partial.activeToolIds = getToolsForProject(partial).filter((t) => t !== 'home');

    return partial;
  } catch {
    return null;
  }
}
