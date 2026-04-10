import type { BrahmastraProject, ToolMeta } from '../types';
import { Folder, MapPin, Hash, Calendar, Package, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  MonitorPlay, Thermometer, Wind, Speaker, Wifi, Zap, ShieldCheck, CheckSquare, Network,
} from 'lucide-react';
import type { ToolId } from '../types';

const TOOL_ICONS: Partial<Record<ToolId, LucideIcon>> = {
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

const TOOL_COLORS: Partial<Record<ToolId, string>> = {
  'visual-calibration': '#6366f1',
  'thermal-load': '#f97316',
  airflow: '#06b6d4',
  'speaker-calibration': '#8b5cf6',
  'wifi-signal': '#22c55e',
  'system-responsiveness': '#eab308',
  'reliability-score': '#10b981',
  'av-commissioning': '#f59e0b',
  'network-quality': '#3b82f6',
};

interface ProjectHomeProps {
  project: BrahmastraProject;
  tools: ToolMeta[];
  onToolSelect: (id: ToolId) => void;
}

export function ProjectHome({ project, tools, onToolSelect }: ProjectHomeProps) {
  const activeScopeTools = tools.filter((t) => t.id !== 'home');

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const boqScopes = project.boqData
    ? Array.from(new Set(project.boqData.lineItems.filter((i) => i.included).map((i) => i.scope)))
    : [];

  const totalUnits = project.boqData
    ? project.boqData.lineItems
        .filter((i) => i.included)
        .reduce((sum, item) => sum + item.roomAllocations.reduce((s, r) => s + (r.qty || 0), 0), 0)
    : 0;

  return (
    <div style={{ padding: '32px 28px', maxWidth: '900px' }}>
      {/* Project Info Card */}
      <div style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Folder size={22} color="#6366f1" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.4px', marginBottom: '4px' }}>{project.name}</h2>
            {project.client && <div style={{ fontSize: '13px', color: '#8b8fa8', marginBottom: '12px' }}>{project.client}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {project.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#565a72' }}>
                  <MapPin size={12} />{project.location}
                </div>
              )}
              {project.projectCode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#565a72' }}>
                  <Hash size={12} />{project.projectCode}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#565a72' }}>
                <Calendar size={12} />Updated {formatDate(project.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* BOQ summary strip */}
        {project.boqData && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{project.boqData.rooms.length}</div>
              <div style={{ fontSize: '10px', color: '#565a72', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rooms</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{boqScopes.length}</div>
              <div style={{ fontSize: '10px', color: '#565a72', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scopes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{project.boqData.lineItems.filter((i) => i.included).length}</div>
              <div style={{ fontSize: '10px', color: '#565a72', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Products</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{totalUnits}</div>
              <div style={{ fontSize: '10px', color: '#565a72', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Units</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {boqScopes.map((scope) => (
                <span key={scope} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}>
                  {scope}
                </span>
              ))}
            </div>
          </div>
        )}

        {!project.boqData && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#3a3d52', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={13} color="#3a3d52" />
            No BOQ linked — tools are available in default mode.
          </div>
        )}
      </div>

      {/* Tools Section */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Available Tools</h3>
          <p style={{ fontSize: '12px', color: '#565a72' }}>
            {project.boqData ? 'Tools enabled based on your BOQ scope.' : 'All tools are available in manual mode.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {activeScopeTools.map((tool) => {
            const Icon = TOOL_ICONS[tool.id as ToolId];
            const color = TOOL_COLORS[tool.id as ToolId] ?? '#6366f1';
            const isFuture = tool.category === 'future';

            return (
              <button
                key={tool.id}
                onClick={() => !isFuture && onToolSelect(tool.id as ToolId)}
                disabled={isFuture}
                style={{
                  background: '#0f1117',
                  border: `1px solid ${isFuture ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px',
                  padding: '18px',
                  textAlign: 'left',
                  cursor: isFuture ? 'default' : 'pointer',
                  transition: 'border-color 0.15s',
                  opacity: isFuture ? 0.45 : 1,
                }}
                onMouseEnter={(e) => { if (!isFuture) e.currentTarget.style.borderColor = `${color}55`; }}
                onMouseLeave={(e) => { if (!isFuture) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Icon && <Icon size={16} color={color} />}
                  </div>
                  {isFuture ? (
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a3d52', background: 'rgba(255,255,255,0.04)', padding: '3px 7px', borderRadius: '4px' }}>Soon</span>
                  ) : (
                    <ChevronRight size={14} color="#565a72" />
                  )}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isFuture ? '#565a72' : '#fff', marginBottom: '4px' }}>{tool.name}</div>
                <div style={{ fontSize: '11px', color: '#565a72', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tool.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
