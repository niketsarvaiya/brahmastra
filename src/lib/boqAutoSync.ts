/**
 * BOQ Auto-Sync — iframe bridge subscriber
 * ────────────────────────────────────────
 * Embeds BOQ Builder's sync-bridge.html as a hidden iframe.
 * On startup: requests all current BOQ projects.
 * On change: receives updates pushed by BOQ Builder when projects are saved.
 *
 * For each BOQ project received:
 *   - If already in Brahmastra (matched by boqData.id) → update boqData
 *   - If new → auto-create a BrahmastraProject from the BOQ data
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BrahmastraProject } from '../types';
import { loadProjects, saveProject } from './projectStorage';
import { parseBOQForProject } from './boqProjectImport';

// ─── Config ──────────────────────────────────────────────────────
const BOQ_BUILDER_ORIGINS: string[] = [
  'http://localhost:5175',
  'https://boq-builder.vercel.app',
];

// Prefer local, fall back to deployed
export const BOQ_BRIDGE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5175/sync-bridge.html'
    : 'https://boq-builder.vercel.app/sync-bridge.html';

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
  newCount: number;       // BOQ projects not yet in Brahmastra
  lastSyncAt: string | null;
  importAll: () => void;
  dismiss: () => void;
}

function syncBOQProjects(boqProjects: BOQProject[]): { imported: number; updated: number } {
  const existing = loadProjects();
  const existingByBOQId = new Map<string, BrahmastraProject>();

  for (const p of existing) {
    const bid = p.boqProjectId ?? p.boqData?.id;
    if (bid) existingByBOQId.set(bid, p);
  }

  let imported = 0;
  let updated = 0;

  for (const boqProject of boqProjects) {
    const linked = existingByBOQId.get(boqProject.id);
    if (linked) {
      // Update boqData on existing project
      const updatedProject: BrahmastraProject = {
        ...linked,
        boqData: boqProject as BrahmastraProject['boqData'],
        boqProjectId: boqProject.id,
        boqSyncOrigin: linked.boqSyncOrigin ?? BOQ_BRIDGE_URL.replace('/sync-bridge.html', ''),
        boqLastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveProject(updatedProject);
      updated++;
    }
    // New project — don't auto-create here; return count so UI can prompt
  }

  return { imported, updated };
}

function countNewProjects(boqProjects: BOQProject[]): number {
  const existing = loadProjects();
  const existingBOQIds = new Set<string>();
  for (const p of existing) {
    const bid = p.boqProjectId ?? p.boqData?.id;
    if (bid) existingBOQIds.add(bid);
  }
  return boqProjects.filter((p) => !existingBOQIds.has(p.id)).length;
}

function importNewProjects(boqProjects: BOQProject[]): number {
  const existing = loadProjects();
  const existingBOQIds = new Set<string>();
  for (const p of existing) {
    const bid = p.boqProjectId ?? p.boqData?.id;
    if (bid) existingBOQIds.add(bid);
  }

  let count = 0;
  for (const boqProject of boqProjects) {
    if (existingBOQIds.has(boqProject.id)) continue;
    const json = JSON.stringify(boqProject);
    const project = parseBOQForProject(json);
    if (project) {
      saveProject(project);
      count++;
    }
  }
  return count;
}

export function useBOQAutoSync(onRefresh: () => void): AutoSyncState {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const latestBOQProjects = useRef<BOQProject[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const processProjects = useCallback((projects: BOQProject[]) => {
    latestBOQProjects.current = projects;
    const { updated } = syncBOQProjects(projects);
    const newOnes = countNewProjects(projects);
    if (updated > 0) onRefresh();
    setNewCount(dismissed ? 0 : newOnes);
    setLastSyncAt(new Date().toISOString());
  }, [onRefresh, dismissed]);

  useEffect(() => {
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.src = BOQ_BRIDGE_URL;
    iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    function handleMessage(event: MessageEvent) {
      const origin = event.origin;
      if (!BOQ_BUILDER_ORIGINS.includes(origin)) return;

      const data = event.data as { type: string; projects?: BOQProject[] } | null;
      if (!data) return;

      if (data.type === 'boq-bridge-ready' || data.type === 'boq-bridge-response') {
        setConnected(true);
        if (data.projects) processProjects(data.projects);
        // On ready, request full project list
        if (data.type === 'boq-bridge-ready') {
          iframe.contentWindow?.postMessage({ type: 'boq-bridge-request' }, origin);
        }
      }

      if (data.type === 'boq-projects-changed') {
        processProjects((data.projects ?? []) as BOQProject[]);
      }
    }

    window.addEventListener('message', handleMessage);

    // Request initial data after brief delay for iframe to load
    const timer = setTimeout(() => {
      BOQ_BUILDER_ORIGINS.forEach((origin) => {
        try { iframe.contentWindow?.postMessage({ type: 'boq-bridge-request' }, origin); } catch { /* ignore */ }
      });
    }, 1500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
      iframe.remove();
      iframeRef.current = null;
    };
  }, [processProjects]);

  const importAll = useCallback(() => {
    const count = importNewProjects(latestBOQProjects.current);
    if (count > 0) onRefresh();
    setNewCount(0);
  }, [onRefresh]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setNewCount(0);
  }, []);

  return { connected, newCount: dismissed ? 0 : newCount, lastSyncAt, importAll, dismiss };
}
