import type { Insight, Recommendation } from '../../types';
import { StatusBadge } from './StatusBadge';
import { ArrowRight, Lightbulb, Wrench } from 'lucide-react';

interface InsightPanelProps {
  insights: Insight[];
}

interface RecommendationPanelProps {
  recommendations: Recommendation[];
}

interface SummaryPanelProps {
  summary: string;
}

export function InsightPanel({ insights }: InsightPanelProps) {
  if (!insights.length) return null;

  return (
    <div
      className="rounded-[14px] p-5"
      style={{
        background: '#161820',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)' }}
        >
          <Lightbulb size={13} style={{ color: '#6366f1' }} />
        </div>
        <h3 className="text-[13px] font-semibold text-white">Engineering Insights</h3>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-[10px]"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="shrink-0 mt-0.5">
              <StatusBadge level={insight.level} label="" variant="dot" size="sm" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="text-[13px] font-medium text-white">{insight.title}</div>
              <div className="text-[12px] leading-relaxed" style={{ color: '#8b8fa8' }}>
                {insight.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  if (!recommendations.length) return null;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const priorityConfig = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'High Priority' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Medium Priority' },
    low: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Low Priority' },
  };

  return (
    <div
      className="rounded-[14px] p-5"
      style={{
        background: '#161820',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.12)' }}
        >
          <Wrench size={13} style={{ color: '#f59e0b' }} />
        </div>
        <h3 className="text-[13px] font-semibold text-white">Recommendations</h3>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#565a72',
          }}
        >
          {sorted.length} action{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((rec, i) => {
          const cfg = priorityConfig[rec.priority];
          return (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-[10px] group"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.color}18`,
              }}
            >
              <ArrowRight
                size={14}
                className="shrink-0 mt-0.5"
                style={{ color: cfg.color }}
              />
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-white">{rec.action}</span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      background: `${cfg.color}18`,
                      color: cfg.color,
                    }}
                  >
                    {rec.priority}
                  </span>
                </div>
                <div className="text-[12px] leading-relaxed" style={{ color: '#8b8fa8' }}>
                  {rec.rationale}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <div
      className="rounded-[14px] p-5"
      style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-[18px]">📋</div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#6366f1' }}>
            Report Summary
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: '#c4c6d4' }}>
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
