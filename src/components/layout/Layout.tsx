import { useState } from 'react';
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
  const [sidebarCollapsed] = useState(false);
  const activeTool = tools.find((t) => t.id === activeToolId)!;

  return (
    <div className="flex h-svh overflow-hidden" style={{ background: '#0a0b0f' }}>
      <Sidebar
        activeToolId={activeToolId}
        onToolSelect={onToolSelect}
        tools={tools}
      />

      {/* Main content area — offset by sidebar width */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '60px' : '230px' }}
      >
        <TopBar
          tool={activeTool}
          onPrint={onPrint}
          onExport={onExport}
          showActions={activeToolId !== 'home'}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
