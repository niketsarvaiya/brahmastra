/**
 * BOQ Auto-Sync — popup-based (replaces broken iframe approach)
 * ─────────────────────────────────────────────────────────────
 * Uses window.open() to request all projects from Beyond BOQ.
 * Popup runs in first-party context → reads localStorage correctly.
 * Data is postMessage'd back to this window, popup closes.
 *
 * Why popup instead of iframe:
 * Chrome 115+ partitions localStorage for cross-site iframes.
 * boq-builder-cyan.vercel.app embedded in beyond-finesse-tools.vercel.app
 * reads from a partitioned (empty) bucket, not the real projects.
 * window.open() popups are NOT subject to this restriction.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BrahmastraProject } from '../types';
import { loadProjects, saveProject } from './projectStorage';
import { parseBOQForProject } from './boqProjectImport';

// ─── Config ──────────────────────────────────────────────────────
const BOQ_BUILDER_ORIGINS: string[] = [
  'http://localhost:5175',
  'https://boq-builder-cyan.vercel.app',
];

export const BOQ_BUILDER_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5175'
    : 'https://boq-builder-cyan.vercel.app';

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
  refresh: () => void;
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
  const popupRef = useRef<Window | null>(null);

  const processProjects = useCallback((projects: BOQProject[]) => {
    const changes = syncBOQProjects(projects);
    if (changes > 0) onRefresh();
    setConnected(true);
    setLastSyncAt(new Date().toISOString());
  }, [onRefresh]);

  // Listen for postMessage from the popup
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!BOQ_BUILDER_ORIGINS.includes(event.origin)) return;
      const data = event.data as { type: string; projects?: BOQProject[] } | null;
      if (!data) return;

      // Popup sent all projects
      if (data.type === 'boq-sync-all' && data.projects) {
        processProjects(data.projects);
        popupRef.current = null;
      }

      // Legacy single-project sync (from manual per-project sync)
      if (data.type === 'boq-sync' && data.projects) {
        processProjects(data.projects);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [processProjects]);

  // Open popup to request all projects from Beyond BOQ
  const refresh = useCallback(() => {
    const callbackOrigin = encodeURIComponent(window.location.origin);
    const url = `${BOQ_BUILDER_URL}?sync-request=all&callback=${callbackOrigin}`;
    // Close any existing popup first
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    popupRef.current = window.open(url, 'boq-sync-popup', 'width=480,height=560,noopener=no');
  }, []);

  return { connected, lastSyncAt, refresh };
}
