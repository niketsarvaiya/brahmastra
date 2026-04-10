import type { BrahmastraProject, ToolId } from '../types';

// ─── Canonical key → ToolId rules ───────────────────────────────
// visual-calibration  : any AV display/projection item
// speaker-calibration : any AV audio item
// network-quality     : any Networking scope item
// thermal-load        : backend rack / server room items
// airflow             : same backend rack items
// wifi-signal         : access points
// system-responsiveness: automation processors
// reliability-score   : always available if any BOQ linked
// av-commissioning    : any AV item

const VISUAL_KEYS = new Set([
  'av.projector',
  'av.motorized-screen',
  'av.fixed-screen',
  'av.proj-lift',
  'av.display-tv',
  'av.video-wall',
  'av.led-display',
  'av.tv',
]);

const AUDIO_KEYS = new Set([
  'av.speakers',
  'av.ceiling-speakers',
  'av.outdoor-speakers',
  'av.in-wall-speakers',
  'av.amplifier',
  'av.subwoofer',
  'av.avr-streamer',
  'av.soundbar',
]);

// AV_KEYS_PREFIXES reserved for future use

const BACKEND_KEYS = new Set([
  'backend.networking-rack',
  'backend.av-rack',
  'backend.server-rack',
  'backend.automation-db',
  'backend.ups',
  'backend.patch-panel',
]);

const AUTOMATION_KEYS = new Set([
  'processors.crestron',
  'processors.control4',
  'processors.savant',
  'processors.lutron',
  'processors.rako',
  'processors.basalte',
  'processors.parriot',
  'processors.cue',
  'general.basalte-processor',
]);

function hasAnyKey(
  canonicalKeys: Set<string>,
  check: Set<string> | string[]
): boolean {
  const checkSet = check instanceof Set ? check : new Set(check);
  for (const k of canonicalKeys) {
    if (checkSet.has(k)) return true;
  }
  return false;
}

function hasKeyWithPrefix(canonicalKeys: Set<string>, prefix: string): boolean {
  for (const k of canonicalKeys) {
    if (k.startsWith(prefix)) return true;
  }
  return false;
}


export function getToolsForProject(project: BrahmastraProject): ToolId[] {
  // If no BOQ, return default active tools
  if (!project.boqData) {
    return [
      'home',
      'visual-calibration',
      'thermal-load',
      'airflow',
      'speaker-calibration',
      'wifi-signal',
      'system-responsiveness',
      'reliability-score',
      'av-commissioning',
      'network-quality',
    ];
  }

  const activeItems = project.boqData.lineItems.filter((i) => i.included);
  const canonicalKeys = new Set(
    activeItems.map((i) => i.canonicalKey).filter(Boolean) as string[]
  );
  const scopes = new Set(activeItems.map((i) => i.scope));

  const tools: ToolId[] = ['home'];

  // visual-calibration — any projection/display items
  if (hasAnyKey(canonicalKeys, VISUAL_KEYS)) {
    tools.push('visual-calibration');
  }

  // speaker-calibration — any audio items
  if (hasAnyKey(canonicalKeys, AUDIO_KEYS)) {
    tools.push('speaker-calibration');
  }

  // network-quality + wifi-signal — Networking scope
  if (scopes.has('Networking') || hasKeyWithPrefix(canonicalKeys, 'networking.')) {
    tools.push('network-quality');
    tools.push('wifi-signal');
  }

  // thermal-load + airflow — backend rack items
  if (hasAnyKey(canonicalKeys, BACKEND_KEYS) || scopes.has('Backend') || scopes.has('Infrastructure')) {
    tools.push('thermal-load');
    tools.push('airflow');
  }

  // system-responsiveness — automation processors
  if (hasAnyKey(canonicalKeys, AUTOMATION_KEYS) || scopes.has('Processors') || scopes.has('Automation')) {
    tools.push('system-responsiveness');
  }

  // system-responsiveness — also triggered by lighting/AC automation (implies processor)
  if (
    hasKeyWithPrefix(canonicalKeys, 'lighting.') ||
    hasKeyWithPrefix(canonicalKeys, 'ac.') ||
    scopes.has('Backend Lighting') ||
    scopes.has('Temp / AC')
  ) {
    if (!tools.includes('system-responsiveness')) tools.push('system-responsiveness');
    // lighting/AC automation also implies a backend rack for the DB
    if (!tools.includes('thermal-load')) tools.push('thermal-load');
    if (!tools.includes('airflow')) tools.push('airflow');
  }

  // av-commissioning — any AV items
  if (
    hasAnyKey(canonicalKeys, VISUAL_KEYS) ||
    hasAnyKey(canonicalKeys, AUDIO_KEYS) ||
    hasKeyWithPrefix(canonicalKeys, 'av.') ||
    scopes.has('AV') ||
    scopes.has('Audio Visual')
  ) {
    tools.push('av-commissioning');
  }

  // reliability-score — always if BOQ is linked
  tools.push('reliability-score');

  // Merge with manually toggled tools
  const merged = new Set([...tools, ...project.activeToolIds]);
  return Array.from(merged);
}

// Ordered display list (controls sidebar order)
export const TOOL_ORDER: ToolId[] = [
  'home',
  'visual-calibration',
  'speaker-calibration',
  'network-quality',
  'wifi-signal',
  'thermal-load',
  'airflow',
  'system-responsiveness',
  'av-commissioning',
  'reliability-score',
];

export function getSortedTools(toolIds: ToolId[]): ToolId[] {
  const set = new Set(toolIds);
  return TOOL_ORDER.filter((id) => set.has(id));
}

// Security scope: no dedicated tool yet, but flag presence for ProjectHome display
export const SECURITY_KEYS = new Set([
  'security.cctv',
  'security.vdp',
  'security.ipbx',
  'security.readers',
  'security.locks',
]);

export function getSecurityItems(project: BrahmastraProject): string[] {
  if (!project.boqData) return [];
  return project.boqData.lineItems
    .filter((i) => i.included && i.canonicalKey && SECURITY_KEYS.has(i.canonicalKey))
    .map((i) => i.product);
}
