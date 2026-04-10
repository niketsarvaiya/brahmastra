/**
 * BOQ Auto-Sync — iframe bridge subscriber
 * ────────────────────────────────────────
 * Embeds BOQ Builder's sync-bridge.html as a hidden iframe.
 * On startup: requests all current BOQ projects.
 * On change: receives live pushes from BOQ Builder.
 *
 * BOQ Builder is the SOURCE OF TRUTH:
 *   - Every BOQ project is automatically imported into Brahmastra
 *   - Updates to existing projects sync silently in the background
 *   - Brahmastra never creates projects from scratch
 */

import { useEffect, useState, useCallback } from 'react';
import type { BrahmastraProject } from '../types';
import { loadProjects, saveProject } from './projectStorage';
import { parseBOQForProject } from './boqProjectImport';

// ─── Config ──────────────────────────────────────────────────────
const BOQ_BUILDER_ORIGINS: string[] = [
  'http://localhost:5175',
  'https://boq-builder.vercel.app',
];

export const BOQ_BRIDGE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5175/sync-bridge.html'
    : 'https://boq-builder.vercel.app/sync-bridge.html';

export const BOQ_BUILDER_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5175'
    : 'https://boq-builder.vercel.app';

interface BOQProject {
  id: string;
  name: string;
  client: string;
  location: string;
  projectCode: string;
  createdAt: string;
  updatedAt: string;
  rooms: unknown[];
  lineItems: unknown[];
}

export interface AutoSyncState {
  connected: boolean;
  lastSyncAt: string | null;
}

/**
 * Sync all BOQ projects into Brahmastra storage.
 * - New BOQ project → auto-create BrahmastraProject
 * - Existing linked project → update boqData silently
 * Returns total change count.
 */
function syncBOQProjects(boqProjects: BOQProject[]): number {
  const existing = loadProjects();
  const existingByBOQId = new Map<string, BrahmastraProject>();

  for (const p of existing) {
    const bid = p.boqProjectId ?? p.boqData?.id;
    if (bid) existingByBOQId.set(bid, p);
  }

  let changes = 0;

  for (const boqProject of boqProjects) {
    const linked = existingByBOQId.get(boqProject.id);

    if (linked) {
      // Update existing project's BOQ data silently
      const updatedProject: BrahmastraProject = {
        ...linked,
        boqData: boqProject as BrahmastraProject['boqData'],
        boqProjectId: boqProject.id,
        boqSyncOrigin: linked.boqSyncOrigin ?? BOQ_BUILDER_URL,
        boqLastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveProject(updatedProject);
      changes++;
    } else {
      // Auto-import new project — BOQ Builder is the source of truth
      const project = parseBOQForProject(JSON.stringify(boqProject));
      if (project) {
        saveProject(project);
        changes++;
      }
    }
  }

  return changes;
}

export function useBOQAutoSync(onRefresh: () => void): AutoSyncState {
  const [connected, setConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const processProjects = useCallback((projects: BOQProject[]) => {
    const changes = syncBOQProjects(projects);
    if (changes > 0) onRefresh();
    setLastSyncAt(new Date().toISOString());
  }, [onRefresh]);

  useEffect(() => {
    // Create hidden iframe pointed at BOQ Builder's sync bridge
    const iframe = document.createElement('iframe');
    iframe.src = BOQ_BRIDGE_URL;
    iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    document.body.appendChild(iframe);

    function handleMessage(event: MessageEvent) {
      if (!BOQ_BUILDER_ORIGINS.includes(event.origin)) return;

      const data = event.data as { type: string; projects?: BOQProject[] } | null;
      if (!data) return;

      if (data.type === 'boq-bridge-ready') {
        setConnected(true);
        // Request full project list now that bridge is ready
        iframe.contentWindow?.postMessage({ type: 'boq-bridge-request' }, event.origin);
      }

      if (data.type === 'boq-bridge-response' || data.type === 'boq-projects-changed') {
        setConnected(true);
        processProjects((data.projects ?? []) as BOQProject[]);
      }
    }

    window.addEventListener('message', handleMessage);

    // Fallback request after 1.5s (bridge may have loaded before listener was ready)
    const timer = setTimeout(() => {
      BOQ_BUILDER_ORIGINS.forEach((origin) => {
        try { iframe.contentWindow?.postMessage({ type: 'boq-bridge-request' }, origin); } catch { /* ignore */ }
      });
    }, 1500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
      iframe.remove();
    };
  }, [processProjects]);

  return { connected, lastSyncAt };
}
