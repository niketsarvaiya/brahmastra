import type { ToolMeta } from '../../types';
import { Printer, Download, Info } from 'lucide-react';

interface TopBarProps {
  tool: ToolMeta;
  onPrint?: () => void;
  onExport?: () => void;
  showActions?: boolean;
}

export function TopBar({ tool, onPrint, onExport, showActions = true }: TopBarProps) {
  return (
    <header
      className="h-[60px] flex items-center px-6 gap-4 shrink-0"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0b0f',
      }}
    >
      {/* Breadcrumb / title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[12px] text-[#3a3d52] font-medium uppercase tracking-widest hidden sm:block">
          Brahmastra
        </span>
        <span className="text-[#2a2d3a] hidden sm:block">/</span>
        <h1 className="text-[15px] font-semibold text-white truncate">{tool.name}</h1>
        {tool.category === 'future' && (
          <span
            className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            Coming Soon
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md"
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

      {/* Actions */}
      {showActions && tool.category === 'active' && (
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                       text-[#8b8fa8] hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                       text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      )}

      {tool.category === 'future' && (
        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-[#565a72]">
          <Info size={13} />
          <span className="hidden sm:inline">In development</span>
        </div>
      )}
    </header>
  );
}
