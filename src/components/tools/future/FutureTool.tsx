import type { ToolMeta } from '../../../types';
import type { LucideIcon } from 'lucide-react';
import {
  Speaker,
  Wifi,
  Zap,
  ShieldCheck,
  CheckSquare,
  Network,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface FutureToolProps {
  tool: ToolMeta;
}

const TOOL_DETAIL: Record<string, {
  icon: LucideIcon;
  color: string;
  colorDim: string;
  description: string;
  inputs: string[];
  outputs: string[];
  status: string;
}> = {
  'speaker-calibration': {
    icon: Speaker,
    color: '#8b5cf6',
    colorDim: 'rgba(139,92,246,0.1)',
    description: 'Balance SPL levels, match channel delays, and validate subwoofer integration for a consistent listening experience across all positions.',
    inputs: ['Speaker channels & SPL readings', 'Distance from listening position', 'Crossover settings'],
    outputs: ['Channel imbalance detection', 'Delay mismatch warnings', 'Sub integration score'],
    status: 'Q3 2026',
  },
  'wifi-signal': {
    icon: Wifi,
    color: '#06b6d4',
    colorDim: 'rgba(6,182,212,0.1)',
    description: 'Map network coverage across rooms, identify dead zones, validate roaming thresholds, and surface overlap conflicts between access points.',
    inputs: ['RSSI values per AP', 'Access point locations', 'Room mapping data'],
    outputs: ['Dead zone identification', 'Overlap conflict detection', 'Roaming efficiency score'],
    status: 'Q3 2026',
  },
  'system-responsiveness': {
    icon: Zap,
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.1)',
    description: 'Measure end-to-end system latency from command trigger to device response. Classify performance and identify bottlenecks in the control chain.',
    inputs: ['Command trigger timestamps', 'Device response timestamps', 'Control system type'],
    outputs: ['System lag analysis', 'Performance classification', 'Bottleneck identification'],
    status: 'Q4 2026',
  },
  'reliability-score': {
    icon: ShieldCheck,
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.1)',
    description: 'Aggregate outputs from all active tools into a single system health score (0–100). Identify the highest-risk areas and prioritise corrective actions before handover.',
    inputs: ['Visual calibration result', 'Thermal load result', 'Airflow result', 'Network & responsiveness data'],
    outputs: ['Overall system score (0–100)', 'Risk classification by domain', 'Priority fix list'],
    status: 'Q4 2026',
  },
  'av-commissioning': {
    icon: CheckSquare,
    color: '#3b82f6',
    colorDim: 'rgba(59,130,246,0.1)',
    description: 'Execute a structured final commissioning checklist — sources, scenes, control validation, and client sign-off. Generate a completion certificate.',
    inputs: ['Source checks', 'Scene sequence validation', 'Control system verification'],
    outputs: ['Commissioning completion status', 'Punch list generation', 'Handover certificate'],
    status: 'Q1 2027',
  },
  'network-quality': {
    icon: Network,
    color: '#ef4444',
    colorDim: 'rgba(239,68,68,0.1)',
    description: 'Advanced network diagnostics beyond signal strength — measure latency, packet loss, and bandwidth stability to validate infrastructure readiness for AV-over-IP.',
    inputs: ['Latency measurements', 'Packet loss data', 'Bandwidth readings'],
    outputs: ['Network stability rating', 'Bottleneck detection', 'AV-over-IP readiness score'],
    status: 'Q1 2027',
  },
};

export function FutureTool({ tool }: FutureToolProps) {
  const detail = TOOL_DETAIL[tool.id];
  if (!detail) return null;

  const Icon = detail.icon;

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto">
      {/* Hero */}
      <div
        className="rounded-[20px] p-8 mb-6 flex flex-col items-center text-center gap-4"
        style={{
          background: detail.colorDim,
          border: `1px solid ${detail.color}25`,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${detail.color}20`, border: `1px solid ${detail.color}30` }}
        >
          <Icon size={28} style={{ color: detail.color }} />
        </div>

        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: detail.color }}
          >
            Coming {detail.status}
          </div>
          <h2 className="text-[24px] font-bold text-white mb-2">{tool.name}</h2>
          <p className="text-[14px] leading-relaxed max-w-[540px]" style={{ color: '#8b8fa8' }}>
            {detail.description}
          </p>
        </div>
      </div>

      {/* Inputs / Outputs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          className="rounded-[14px] p-5"
          style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              📥
            </div>
            <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: '#565a72' }}>
              Inputs
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {detail.inputs.map((input, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: detail.color, opacity: 0.6 }}
                />
                <span className="text-[13px]" style={{ color: '#c4c6d4' }}>{input}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-[14px] p-5"
          style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              📤
            </div>
            <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: '#565a72' }}>
              Outputs
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {detail.outputs.map((output, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight
                  size={12}
                  className="mt-0.5 shrink-0"
                  style={{ color: detail.color }}
                />
                <span className="text-[13px]" style={{ color: '#c4c6d4' }}>{output}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Under construction note */}
      <div
        className="rounded-[14px] p-5 flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Lock size={20} style={{ color: '#3a3d52' }} />
        <div>
          <div className="text-[13px] font-semibold text-white mb-0.5">Module Locked</div>
          <div className="text-[12px]" style={{ color: '#565a72' }}>
            This tool is under active development and will unlock in a future platform update.
            All active tools are fully operational now.
          </div>
        </div>
      </div>
    </div>
  );
}
