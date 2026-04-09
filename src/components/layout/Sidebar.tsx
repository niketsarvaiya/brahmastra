import { useState } from 'react';
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

export function Sidebar({ activeToolId, onToolSelect, tools }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toolMap = new Map(tools.map((t) => [t.id, t]));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-200 ${
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setCollapsed(true)}
      />

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[60px]' : 'w-[230px]'}
        `}
        style={{
          background: '#0f1117',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-4 h-[60px] shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Activity size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-[13px] font-semibold text-white leading-none tracking-tight whitespace-nowrap">
                Brahmastra
              </div>
              <div className="text-[10px] text-[#565a72] mt-0.5 whitespace-nowrap tracking-widest uppercase">
                by Beyond Alliance
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-[#565a72] hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <Menu size={15} />}
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-1">
              {!collapsed && (
                <div className="px-4 pb-1 pt-3">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-[#3a3d52]">
                    {section.label}
                  </span>
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
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-all duration-150 relative group
                      ${collapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'text-white'
                          : isFuture
                          ? 'text-[#3a3d52] cursor-default'
                          : 'text-[#8b8fa8] hover:text-[#c4c6d4]'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                        style={{ background: '#6366f1' }}
                      />
                    )}

                    {/* Active row bg */}
                    {isActive && (
                      <span
                        className="absolute inset-x-2 inset-y-0.5 rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.1)' }}
                      />
                    )}

                    {/* Hover bg */}
                    {!isActive && !isFuture && (
                      <span className="absolute inset-x-2 inset-y-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    )}

                    <span className="relative z-10 shrink-0">
                      <Icon size={15} />
                    </span>

                    {!collapsed && (
                      <span className="relative z-10 text-[13px] font-medium leading-none truncate flex-1">
                        {tool.name}
                      </span>
                    )}

                    {!collapsed && isFuture && (
                      <span
                        className="relative z-10 text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: '#3a3d52',
                        }}
                      >
                        Soon
                      </span>
                    )}

                    {/* Tooltip on collapsed */}
                    {collapsed && (
                      <div
                        className="absolute left-[52px] px-2.5 py-1.5 rounded-md text-xs font-medium
                                   opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                                   whitespace-nowrap z-50"
                        style={{
                          background: '#252830',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#f0f1f3',
                        }}
                      >
                        {tool.name}
                        {isFuture && (
                          <span className="ml-1.5 text-[10px] text-[#565a72]">Coming Soon</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {!collapsed ? (
            <div className="text-[10px] text-[#3a3d52] leading-relaxed">
              <div className="font-medium text-[#565a72]">v1.0.0 — Internal</div>
              <div>Beyond Alliance © 2026</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-5 h-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
