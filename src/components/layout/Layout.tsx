import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { ToolId, ToolMeta } from '../../types';

interface LayoutProps {
  children: ReactNode;
  activeToolId: ToolId;
  onToolSelect: (id: ToolId) => void;
  tools: ToolMeta[];
  onPrint?: () => void;
  onExport?: () => void;
}

export function Layout({
  children,
  activeToolId,
  onToolSelect,
  tools,
  onPrint,
  onExport,
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleToolSelect = (id: ToolId) => {
    onToolSelect(id);
    if (isMobile) setMobileOpen(false);
  };

  const activeTool = tools.find((t) => t.id === activeToolId)!;
  const contentMarginLeft = isMobile ? 0 : sidebarCollapsed ? '60px' : '230px';

  return (
    <div className="flex h-svh overflow-hidden" style={{ background: '#0a0b0f' }}>
      <Sidebar
        activeToolId={activeToolId}
        onToolSelect={handleToolSelect}
        tools={tools}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: contentMarginLeft }}
      >
        <TopBar
          tool={activeTool}
          onPrint={onPrint}
          onExport={onExport}
          showActions={activeToolId !== 'home'}
          onMobileMenuOpen={() => setMobileOpen(true)}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
