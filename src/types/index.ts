export type StatusLevel = 'good' | 'warning' | 'critical' | 'info' | 'neutral';

export interface StatusClassification {
  level: StatusLevel;
  label: string;
  description: string;
}

export interface Insight {
  title: string;
  body: string;
  level: StatusLevel;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
}

export interface ToolResult {
  status: StatusClassification;
  metrics: Record<string, MetricValue>;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
}

export interface MetricValue {
  value: number | string;
  unit?: string;
  label: string;
  status?: StatusLevel;
}

export type ToolId =
  | 'home'
  | 'visual-calibration'
  | 'thermal-load'
  | 'airflow'
  | 'speaker-calibration'
  | 'wifi-signal'
  | 'system-responsiveness'
  | 'reliability-score'
  | 'av-commissioning'
  | 'network-quality';

export interface ToolMeta {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  category: 'active' | 'future';
  tags: string[];
}

// ─── Project Types ────────────────────────────────────────────────

export interface BrahmastraProject {
  id: string
  name: string
  client: string
  location: string
  projectCode: string
  createdAt: string
  updatedAt: string
  boqData?: BOQProject
  activeToolIds: ToolId[]  // manually toggled tools (overrides or supplements BOQ detection)
  boqProjectId?: string       // original BOQ Builder project ID for live sync
  boqSyncOrigin?: string      // e.g. 'http://localhost:5175'
  boqLastSyncAt?: string      // ISO timestamp
}

export interface BOQProject {
  boqVersion?: string
  id: string
  name: string
  client: string
  location: string
  projectCode: string
  rooms: BOQRoom[]
  lineItems: BOQLineItem[]
}

export interface BOQRoom {
  id: string
  name: string
  order: number
}

export interface BOQLineItem {
  id: string
  scope: string
  product: string
  brand: string
  modelNumber: string
  specs: string
  notes: string
  canonicalKey?: string
  included: boolean
  isCustom?: boolean
  roomAllocations: Array<{ roomId: string; qty: number }>
}
