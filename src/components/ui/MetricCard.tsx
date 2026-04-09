import type { StatusLevel } from '../../types';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  status?: StatusLevel;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  large?: boolean;
}

const STATUS_COLORS: Record<StatusLevel, { value: string; glow: string; bar: string }> = {
  good: { value: '#10b981', glow: 'rgba(16,185,129,0.15)', bar: '#10b981' },
  warning: { value: '#f59e0b', glow: 'rgba(245,158,11,0.15)', bar: '#f59e0b' },
  critical: { value: '#ef4444', glow: 'rgba(239,68,68,0.15)', bar: '#ef4444' },
  info: { value: '#3b82f6', glow: 'rgba(59,130,246,0.15)', bar: '#3b82f6' },
  neutral: { value: '#8b8fa8', glow: 'transparent', bar: '#8b8fa8' },
};

export function MetricCard({
  label,
  value,
  unit,
  status = 'neutral',
  sublabel,
  large = false,
}: MetricCardProps) {
  const colors = STATUS_COLORS[status];

  return (
    <div
      className="relative overflow-hidden rounded-[14px] p-5 flex flex-col gap-3"
      style={{
        background: '#161820',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top status bar */}
      {status !== 'neutral' && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: colors.bar, opacity: 0.7 }}
        />
      )}

      {/* Glow effect */}
      {status !== 'neutral' && (
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${colors.glow}, transparent)`,
          }}
        />
      )}

      <div className="relative">
        <div
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: '#565a72' }}
        >
          {label}
        </div>
      </div>

      <div className="relative flex items-end gap-1.5">
        <span
          className={`font-semibold leading-none tabular-nums ${large ? 'text-4xl' : 'text-2xl'}`}
          style={{ color: status !== 'neutral' ? colors.value : '#f0f1f3' }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-[13px] font-medium mb-0.5"
            style={{ color: '#565a72' }}
          >
            {unit}
          </span>
        )}
      </div>

      {sublabel && (
        <div className="relative text-[12px]" style={{ color: '#8b8fa8' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
