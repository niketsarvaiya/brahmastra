import type { ToolMeta, ToolId } from '../types';
import type { LucideIcon } from 'lucide-react';
import {
  MonitorPlay,
  Thermometer,
  Wind,
  Speaker,
  Wifi,
  Zap,
  ShieldCheck,
  CheckSquare,
  Network,
  ArrowRight,
  Activity,
  Layers,
  TrendingUp,
} from 'lucide-react';

const TOOL_ICONS: Record<ToolId, LucideIcon> = {
  home: Activity,
  'visual-calibration': MonitorPlay,
  'thermal-load': Thermometer,
  airflow: Wind,
  'speaker-calibration': Speaker,
  'wifi-signal': Wifi,
  'system-responsiveness': Zap,
  'reliability-score': ShieldCheck,
  'av-commissioning': CheckSquare,
  'network-quality': Network,
};

const TOOL_COLORS: Partial<Record<ToolId, { color: string; dim: string }>> = {
  'visual-calibration': { color: '#6366f1', dim: 'rgba(99,102,241,0.12)' },
  'thermal-load': { color: '#f59e0b', dim: 'rgba(245,158,11,0.12)' },
  airflow: { color: '#10b981', dim: 'rgba(16,185,129,0.12)' },
  'speaker-calibration': { color: '#8b5cf6', dim: 'rgba(139,92,246,0.10)' },
  'wifi-signal': { color: '#06b6d4', dim: 'rgba(6,182,212,0.10)' },
  'system-responsiveness': { color: '#f59e0b', dim: 'rgba(245,158,11,0.10)' },
  'reliability-score': { color: '#10b981', dim: 'rgba(16,185,129,0.10)' },
  'av-commissioning': { color: '#3b82f6', dim: 'rgba(59,130,246,0.10)' },
  'network-quality': { color: '#ef4444', dim: 'rgba(239,68,68,0.10)' },
};

interface HomeProps {
  tools: ToolMeta[];
  onToolSelect: (id: ToolId) => void;
}

export function Home({ tools, onToolSelect }: HomeProps) {
  const activeTools = tools.filter((t) => t.id !== 'home' && t.category === 'active');
  const futureTools = tools.filter((t) => t.category === 'future');

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
      {/* Hero section */}
      <div
        className="rounded-[16px] md:rounded-[20px] p-5 md:p-8 mb-6 md:mb-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #161820 0%, #1a1b26 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />

        <div className="relative">
          {/* Logo + brand */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: '#6366f1' }}>
                Beyond Alliance
              </div>
              <div className="text-[20px] font-bold text-white leading-none">
                Brahmastra
              </div>
            </div>
          </div>

          <h1 className="text-[24px] md:text-[32px] font-bold text-white leading-tight mb-3 md:mb-4">
            Engineering intelligence
            <br />
            <span style={{ color: '#6366f1' }}>embedded into execution.</span>
          </h1>

          <p className="text-[13px] md:text-[15px] leading-relaxed mb-5 md:mb-6" style={{ color: '#8b8fa8' }}>
            Brahmastra Tools is the internal platform for validating system performance on-site.
            Capture real-world data, surface hidden issues, and generate engineering reports —
            before handover, not after.
          </p>

          {/* Philosophy pillars */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Layers, label: 'Execution completes projects' },
              { icon: TrendingUp, label: 'Engineering ensures performance' },
              { icon: Activity, label: 'Finesse creates unforgettable experiences' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#c4c6d4',
                }}
              >
                <Icon size={13} style={{ color: '#6366f1' }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active tools */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-1.5 h-4 rounded-full"
            style={{ background: '#6366f1' }}
          />
          <h2 className="text-[16px] font-semibold text-white">Active Tools</h2>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            {activeTools.length} Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {activeTools.map((tool) => (
            <ActiveToolCard
              key={tool.id}
              tool={tool}
              onSelect={() => onToolSelect(tool.id)}
            />
          ))}
        </div>
      </div>

      {/* Future tools */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-1.5 h-4 rounded-full"
            style={{ background: '#3a3d52' }}
          />
          <h2 className="text-[16px] font-semibold" style={{ color: '#8b8fa8' }}>
            Coming Soon
          </h2>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#3a3d52', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {futureTools.length} In Development
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {futureTools.map((tool) => (
            <FutureToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div
        className="mt-8 p-4 rounded-[14px] text-center text-[12px]"
        style={{ color: '#3a3d52', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        Brahmastra — Internal Engineering Platform · v1.0.0 · Beyond Alliance © 2026
      </div>
    </div>
  );
}

function ActiveToolCard({
  tool,
  onSelect,
}: {
  tool: ToolMeta;
  onSelect: () => void;
}) {
  const Icon = TOOL_ICONS[tool.id];
  const colors = TOOL_COLORS[tool.id] ?? { color: '#6366f1', dim: 'rgba(99,102,241,0.12)' };

  return (
    <button
      onClick={onSelect}
      className="group text-left rounded-[16px] p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: '#161820',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: colors.dim }}
      >
        <Icon size={18} style={{ color: colors.color }} />
      </div>

      {/* Text */}
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-white">
          {tool.name}
        </div>
        <div className="text-[12px] leading-relaxed" style={{ color: '#565a72' }}>
          {tool.description}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-md font-medium"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: '#565a72',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Open CTA */}
      <div
        className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
        style={{ color: colors.color }}
      >
        Open Tool
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function FutureToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = TOOL_ICONS[tool.id];
  const colors = TOOL_COLORS[tool.id] ?? { color: '#3a3d52', dim: 'rgba(255,255,255,0.04)' };

  return (
    <div
      className="rounded-[14px] p-4 flex flex-col gap-3 opacity-60"
      style={{
        background: '#0f1117',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: colors.dim }}
        >
          <Icon size={14} style={{ color: colors.color }} />
        </div>
        <div className="text-[13px] font-semibold" style={{ color: '#565a72' }}>
          {tool.name}
        </div>
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: '#3a3d52' }}>
        {tool.description}
      </div>
      <span
        className="self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
        style={{ background: 'rgba(255,255,255,0.04)', color: '#3a3d52' }}
      >
        Coming Soon
      </span>
    </div>
  );
}
