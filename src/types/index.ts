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
