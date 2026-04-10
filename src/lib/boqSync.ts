/**
 * BOQ Live Sync — cross-origin postMessage bridge
 * ──────────────────────────────────────────────────
 * Flow:
 *   1. Brahmastra calls requestBOQSync(project) → opens BOQ Builder in popup
 *      with ?sync-request=<boqProjectId>&callback=<currentOrigin>
 *   2. BOQ Builder detects the URL param, finds the project, calls
 *      window.opener.postMessage({ type: 'boq-sync', project: ... }, callbackOrigin)
 *   3. Brahmastra's useBOQMessageListener receives the event, validates origin,
 *      and fires onUpdate(boqData)
 */

import type { BOQProject } from '../types';
import { useEffect } from 'react';

// ─── Known BOQ Builder origins ──────────────────────────────────
export const ALLOWED_BOQ_ORIGINS: string[] = [
  'http://localhost:5175',
  'https://boq-builder.vercel.app',
  // Production URL — add when known
];

export interface BOQSyncMessage {
  type: 'boq-sync';
  boqProject: BOQProject;
  syncedAt: string;
}

/**
 * Open BOQ Builder in a popup window requesting a sync export.
 * BOQ Builder will detect ?sync-request and postMessage the data back.
 */
export function requestBOQSync(boqProjectId: string, boqSyncOrigin: string): void {
  const callbackOrigin = window.location.origin;
  const url = `${boqSyncOrigin}?sync-request=${encodeURIComponent(boqProjectId)}&callback=${encodeURIComponent(callbackOrigin)}`;
  const popup = window.open(url, 'boq-sync-popup', 'width=600,height=400,scrollbars=yes');
  if (!popup) {
    alert('Popup blocked. Please allow popups for this site and try again.');
  }
}

/**
 * React hook: listen for postMessage events from BOQ Builder.
 * Call inside a component that needs live BOQ updates.
 */
export function useBOQMessageListener(
  onUpdate: (boqProject: BOQProject) => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    function handleMessage(event: MessageEvent) {
      // Validate origin
      if (!ALLOWED_BOQ_ORIGINS.includes(event.origin)) return;

      const data = event.data as BOQSyncMessage;
      if (!data || data.type !== 'boq-sync' || !data.boqProject) return;

      onUpdate(data.boqProject);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdate, enabled]);
}
