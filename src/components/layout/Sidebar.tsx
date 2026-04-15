import type { ToolId, ToolMeta, BrahmastraProject } from '../../types';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  MonitorPlay,
  Thermometer,
  Wind,
  Speaker,
  Wifi,
  Zap,
  ShieldCheck,
  CheckSquare,
  Network,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Activity,
} from 'lucide-react';

const TOOL_ICONS: Record<ToolId, LucideIcon> = {
  home: LayoutDashboard,
  'visual-calibration': MonitorPlay,
  'thermal-load': Thermometer,
  airflow: Wind,
  'speaker-calibration': Speaker,
  'wifi-signal': Wifi,
  'system-responsiveness': Zap,
  'reliability-score': ShieldCheck,
  'av-commissioning': CheckSquare,
  'network-quality': Network,
  'scene-intelligence': Sparkles,
};

interface SidebarProps {
  activeToolId: ToolId;
  onToolSelect: (id: ToolId) => void;
  tools: ToolMeta[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
  project?: BrahmastraProject;
  onBack?: () => void;
}

export function Sidebar({
  activeToolId,
  onToolSelect,
  tools,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  isMobile,
  project,
  onBack,
}: SidebarProps) {
  // On mobile: always full-width drawer, translated in/out
  // On desktop: fixed sidebar, width based on collapsed
  const isCollapsed = isMobile ? false : collapsed;
  const sidebarWidth = isCollapsed ? '60px' : '230px';
  const transform = isMobile
    ? mobileOpen ? 'translateX(0)' : 'translateX(-100%)'
    : 'translateX(0)';

  // Separate home from other tools for nav grouping
  const homeTool = tools.find((t) => t.id === 'home');
  const otherTools = tools.filter((t) => t.id !== 'home');

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            opacity: mobileOpen ? 1 : 0,
            pointerEvents: mobileOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 30,
          height: '100%',
          width: sidebarWidth,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface-1)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transform,
          transition: 'transform 0.3s ease, width 0.3s ease',
        }}
      >
        {/* Logo / header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 14px',
            height: '60px',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            <Activity size={15} className="text-white" />
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                Brahmastra
              </div>
              {project ? (
                <div style={{ fontSize: '10px', color: '#565a72', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {project.name}
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: '#565a72', marginTop: '3px', whiteSpace: 'nowrap', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  by Beyond Alliance
                </div>
              )}
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={isMobile ? onMobileClose : onToggleCollapse}
            style={{
              marginLeft: isCollapsed ? 'auto' : undefined,
              color: '#565a72',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '6px',
              transition: 'color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#565a72')}
          >
            {isMobile ? <X size={16} /> : collapsed ? <ChevronRight size={16} /> : <Menu size={15} />}
          </button>
        </div>

        {/* Back to Projects button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              margin: '8px 8px 0',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#565a72',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'color 0.15s, background 0.15s',
              justifyContent: isCollapsed ? 'center' : undefined,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#565a72'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <ChevronLeft size={14} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>All Projects</span>}
          </button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Dashboard / Home */}
          {homeTool && (
            <div style={{ marginBottom: '4px' }}>
              {!isCollapsed && (
                <div style={{ padding: '10px 14px 4px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3a3d52' }}>
                  Overview
                </div>
              )}
              {renderNavItem(homeTool)}
            </div>
          )}

          {/* Tools */}
          {otherTools.length > 0 && (
            <div>
              {!isCollapsed && (
                <div style={{ padding: '10px 14px 4px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3a3d52' }}>
                  Tools
                </div>
              )}
              {otherTools.map((tool) => renderNavItem(tool))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {!isCollapsed ? (
            <div style={{ fontSize: '10px', color: '#3a3d52', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 500, color: '#565a72' }}>v1.0.0 — Internal</div>
              <div>Beyond Alliance © 2026</div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>
          )}
        </div>
      </aside>
    </>
  );

  function renderNavItem(tool: ToolMeta) {
    const id = tool.id as ToolId;
    const Icon = TOOL_ICONS[id];
    const isActive = activeToolId === id;
    const isFuture = tool.category === 'future';

    return (
      <button
        key={id}
        onClick={() => !isFuture && onToolSelect(id)}
        disabled={isFuture}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 14px',
          textAlign: 'left',
          position: 'relative',
          justifyContent: isCollapsed ? 'center' : undefined,
          color: isActive ? '#fff' : isFuture ? '#3a3d52' : '#8b8fa8',
          cursor: isFuture ? 'default' : 'pointer',
          transition: 'color 0.15s',
          background: 'transparent',
          border: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isFuture) e.currentTarget.style.color = '#c4c6d4';
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isFuture) e.currentTarget.style.color = '#8b8fa8';
        }}
      >
        {/* Active bar */}
        {isActive && (
          <span style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3px',
            height: '20px',
            borderRadius: '0 2px 2px 0',
            background: '#6366f1',
          }} />
        )}
        {/* Active bg */}
        {isActive && (
          <span style={{
            position: 'absolute',
            inset: '2px 8px',
            borderRadius: '8px',
            background: 'rgba(99,102,241,0.1)',
          }} />
        )}

        <span style={{ position: 'relative', zIndex: 1, flexShrink: 0, display: 'flex' }}>
          {Icon && <Icon size={15} />}
        </span>

        {!isCollapsed && (
          <span style={{ position: 'relative', zIndex: 1, fontSize: '13px', fontWeight: 500, lineHeight: 1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tool.name}
          </span>
        )}

        {!isCollapsed && isFuture && (
          <span style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.04)',
            color: '#3a3d52',
            flexShrink: 0,
          }}>
            Soon
          </span>
        )}

        {/* Tooltip when icon-only collapsed desktop */}
        {isCollapsed && (
          <div style={{
            position: 'absolute',
            left: '52px',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            background: '#252830',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f0f1f3',
            whiteSpace: 'nowrap',
            zIndex: 50,
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.15s',
          }}
            className="group-tooltip"
          >
            {tool.name}
            {isFuture && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#565a72' }}>Soon</span>}
          </div>
        )}
      </button>
    );
  }
}
