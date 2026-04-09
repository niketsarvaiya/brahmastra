import type { StatusLevel } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, Circle } from 'lucide-react';

interface StatusBadgeProps {
  level: StatusLevel;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'pill' | 'dot';
}

const CONFIG: Record<StatusLevel, {
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ size?: number }>;
  dot: string;
}> = {
  good: {
    bg: 'rgba(16,185,129,0.1)',
    text: '#10b981',
    border: 'rgba(16,185,129,0.25)',
    icon: CheckCircle2,
    dot: '#10b981',
  },
  warning: {
    bg: 'rgba(245,158,11,0.1)',
    text: '#f59e0b',
    border: 'rgba(245,158,11,0.25)',
    icon: AlertTriangle,
    dot: '#f59e0b',
  },
  critical: {
    bg: 'rgba(239,68,68,0.1)',
    text: '#ef4444',
    border: 'rgba(239,68,68,0.25)',
    icon: XCircle,
    dot: '#ef4444',
  },
  info: {
    bg: 'rgba(59,130,246,0.1)',
    text: '#3b82f6',
    border: 'rgba(59,130,246,0.25)',
    icon: Info,
    dot: '#3b82f6',
  },
  neutral: {
    bg: 'rgba(255,255,255,0.04)',
    text: '#8b8fa8',
    border: 'rgba(255,255,255,0.1)',
    icon: Circle,
    dot: '#8b8fa8',
  },
};

const SIZE_CONFIG = {
  sm: { text: '10px', iconSize: 11, px: '6px', py: '2px', gap: '4px' },
  md: { text: '12px', iconSize: 13, px: '10px', py: '5px', gap: '5px' },
  lg: { text: '14px', iconSize: 15, px: '12px', py: '7px', gap: '6px' },
};

export function StatusBadge({ level, label, size = 'md', variant = 'badge' }: StatusBadgeProps) {
  const cfg = CONFIG[level];
  const sz = SIZE_CONFIG[size];
  const Icon = cfg.icon;

  if (variant === 'dot') {
    return (
      <span className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}80` }}
        />
        <span style={{ fontSize: sz.text, color: cfg.text, fontWeight: 500 }}>{label}</span>
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className="flex items-center font-semibold tracking-wide uppercase rounded-full"
        style={{
          background: cfg.bg,
          color: cfg.text,
          border: `1px solid ${cfg.border}`,
          fontSize: '10px',
          paddingInline: sz.px,
          paddingBlock: sz.py,
          gap: sz.gap,
          letterSpacing: '0.06em',
        }}
      >
        <Icon size={sz.iconSize} />
        {label}
      </span>
    );
  }

  return (
    <span
      className="flex items-center font-medium rounded-md"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        fontSize: sz.text,
        paddingInline: sz.px,
        paddingBlock: sz.py,
        gap: sz.gap,
      }}
    >
      <Icon size={sz.iconSize} />
      {label}
    </span>
  );
}
