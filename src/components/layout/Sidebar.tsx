import type { ToolId, ToolMeta } from '../../types';
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
  ChevronRight,
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
}

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: ['home'] as ToolId[],
  },
  {
    label: 'Active Tools',
    items: ['visual-calibration', 'thermal-load', 'airflow', 'speaker-calibration', 'network-quality'] as ToolId[],
  },
  {
    label: 'Coming Soon',
    items: [
      'wifi-signal',
      'system-responsiveness',
      'reliability-score',
      'av-commissioning',
    ] as ToolId[],
  },
];

export function Sidebar({
  activeToolId,
  onToolSelect,
  tools,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  isMobile,
}: SidebarProps) {
  const toolMap = new Map(tools.map((t) => [t.id, t]));

  // On mobile: always full-width drawer, translated in/out
  // On desktop: fixed sidebar, width based on collapsed
  const isCollapsed = isMobile ? false : collapsed;
  const sidebarWidth = isCollapsed ? '60px' : '230px';
  const transform = isMobile
    ? mobileOpen ? 'translateX(0)' : 'translateX(-100%)'
    : 'translateX(0)';

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
          background: '#0f1117',
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
            gap: '12px',
            padding: '0 16px',
            height: '60px',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            <Activity size={16} className="text-white" />
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                Brahmastra
              </div>
              <div style={{ fontSize: '10px', color: '#565a72', marginTop: '3px', whiteSpace: 'nowrap', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                by Beyond Alliance
              </div>
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

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: '4px' }}>
              {!isCollapsed && (
                <div style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3a3d52' }}>
                  {section.label}
                </div>
              )}
              {section.items.map((id) => {
                const tool = toolMap.get(id);
                if (!tool) return null;
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
                      gap: '12px',
                      padding: '10px 16px',
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
                      <Icon size={15} />
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
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
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
}
