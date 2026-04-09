import type { ToolMeta } from '../../types';
import { Printer, Download, Info, Menu } from 'lucide-react';

interface TopBarProps {
  tool: ToolMeta;
  onPrint?: () => void;
  onExport?: () => void;
  showActions?: boolean;
  onMobileMenuOpen?: () => void;
  isMobile?: boolean;
}

export function TopBar({
  tool,
  onPrint,
  onExport,
  showActions = true,
  onMobileMenuOpen,
  isMobile = false,
}: TopBarProps) {
  return (
    <header
      className="flex items-center px-4 gap-3 shrink-0"
      style={{
        height: '60px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0b0f',
      }}
    >
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={onMobileMenuOpen}
          style={{
            color: '#8b8fa8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '8px',
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8b8fa8')}
        >
          <Menu size={18} />
        </button>
      )}

      {/* Breadcrumb / title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!isMobile && (
          <>
            <span className="text-[12px] text-[#3a3d52] font-medium uppercase tracking-widest">
              Brahmastra
            </span>
            <span className="text-[#2a2d3a]">/</span>
          </>
        )}
        <h1
          className="font-semibold text-white truncate"
          style={{ fontSize: isMobile ? '15px' : '15px' }}
        >
          {tool.name}
        </h1>
        {tool.category === 'future' && (
          <span
            className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {isMobile ? 'Soon' : 'Coming Soon'}
          </span>
        )}
      </div>

      {/* Tags — desktop only */}
      {!isMobile && (
        <div className="hidden lg:flex items-center gap-1.5 min-w-0">
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
      )}

      {/* Actions */}
      {showActions && tool.category === 'active' && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-lg text-[12px] font-medium
                       text-[#8b8fa8] hover:text-white transition-colors"
            style={{
              padding: isMobile ? '6px 8px' : '6px 12px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Printer size={13} />
            {!isMobile && <span>Print</span>}
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg text-[12px] font-medium
                       text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              padding: isMobile ? '6px 8px' : '6px 12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            <Download size={13} />
            {!isMobile && <span>Export PDF</span>}
          </button>
        </div>
      )}

      {tool.category === 'future' && (
        <div className="flex items-center gap-1.5 text-[12px] text-[#565a72] shrink-0">
          <Info size={13} />
          {!isMobile && <span>In development</span>}
        </div>
      )}
    </header>
  );
}
