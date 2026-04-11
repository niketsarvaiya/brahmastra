import { useState } from 'react';
import { Folder, Trash2, ChevronRight, Activity, Calendar, MapPin, Hash, ExternalLink, RefreshCw, RotateCcw } from 'lucide-react';
import type { BrahmastraProject } from '../types';
import { deleteProject } from '../lib/projectStorage';

// Resolve Beyond BOQ URL based on current environment
const BOQ_BUILDER_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5175'
    : 'https://boq-builder-cyan.vercel.app';

interface ProjectsPageProps {
  projects: BrahmastraProject[];
  onOpenProject: (project: BrahmastraProject) => void;
  onProjectsChange: () => void;
  syncConnected?: boolean;
  syncLastAt?: string | null;
  onSyncRefresh?: () => void;
}

export function ProjectsPage({
  projects,
  onOpenProject,
  onProjectsChange,
  syncConnected = false,
  syncLastAt,
  onSyncRefresh,
}: ProjectsPageProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function handleDelete(id: string) {
    deleteProject(id);
    onProjectsChange();
    setDeleteConfirmId(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  const scopeCount = (p: BrahmastraProject) => {
    if (!p.boqData) return 0;
    return new Set(p.boqData.lineItems.filter((i) => i.included).map((i) => i.scope)).size;
  };

  function openBOQBuilder() {
    window.open(BOQ_BUILDER_URL, '_blank', 'noopener');
  }

  return (
    <div style={{ minHeight: '100svh', background: '#0a0b0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f1117' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>Beyond Brahmastra</div>
            <div style={{ fontSize: '10px', color: '#3a3d52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>by Beyond Alliance</div>
          </div>
          <div style={{ flex: 1 }} />

          {/* Sync status + refresh button */}
          {onSyncRefresh && (
            <button
              onClick={onSyncRefresh}
              title="Sync all projects from Beyond BOQ"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '8px', background: syncConnected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${syncConnected ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`, color: syncConnected ? '#22c55e' : '#8b8fa8', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {syncConnected
                ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                : <RotateCcw size={11} />
              }
              {syncConnected ? `Synced · ${syncLastAt ? formatTime(syncLastAt) : ''}` : 'Sync from Beyond BOQ'}
            </button>
          )}

          {/* Open Beyond BOQ */}
          <button
            onClick={openBOQBuilder}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
          >
            <ExternalLink size={14} />
            Beyond BOQ
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', marginBottom: '6px' }}>Projects</h1>
            <p style={{ fontSize: '14px', color: '#565a72' }}>
              Projects are synced automatically from Beyond BOQ.
              {syncLastAt && (
                <span style={{ marginLeft: '6px', color: '#3a3d52' }}>Last updated {formatTime(syncLastAt)}</span>
              )}
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          /* ── Empty state ── */
          <div style={{ border: '2px dashed rgba(255,255,255,0.06)', borderRadius: '20px', padding: '80px 24px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Folder size={28} color="#6366f1" />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No projects yet</div>
            <div style={{ fontSize: '13px', color: '#565a72', lineHeight: 1.6, marginBottom: '28px' }}>
              Projects are created in Beyond BOQ and automatically appear here.<br />
              Start by creating your first project in Beyond BOQ.
            </div>

            {/* CTA: open Beyond BOQ */}
            <button
              onClick={openBOQBuilder}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', marginBottom: '12px' }}
            >
              <ExternalLink size={15} />
              Create Project in Beyond BOQ
            </button>

            {!syncConnected && (
              <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: '#3a3d52', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <RefreshCw size={12} color="#3a3d52" />
                Connecting to Beyond BOQ sync…
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                onClick={() => onOpenProject(project)}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Folder size={18} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
                    <div style={{ fontSize: '12px', color: '#565a72' }}>{project.client || 'No client'}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(project.id); }}
                    style={{ color: '#3a3d52', padding: '4px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: 'transparent', transition: 'color 0.15s', flexShrink: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#3a3d52')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                  {project.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#565a72' }}>
                      <MapPin size={11} color="#565a72" />{project.location}
                    </div>
                  )}
                  {project.projectCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#565a72' }}>
                      <Hash size={11} color="#565a72" />{project.projectCode}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#565a72' }}>
                    <Calendar size={11} color="#565a72" />{formatDate(project.updatedAt)}
                  </div>
                </div>

                {/* Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {project.boqData ? (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      BOQ • {scopeCount(project)} scopes
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: '#565a72', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Syncing…
                    </span>
                  )}
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {project.activeToolIds.length} tools
                  </span>
                </div>

                {/* Open arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6366f1', fontWeight: 500 }}>
                    Open <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* "Want a new project?" nudge when projects exist */}
        {projects.length > 0 && (
          <div style={{ marginTop: '32px', padding: '16px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b8fa8', marginBottom: '2px' }}>Need to add a new project?</div>
              <div style={{ fontSize: '12px', color: '#3a3d52' }}>Create it in Beyond BOQ — it will appear here automatically.</div>
            </div>
            <button
              onClick={openBOQBuilder}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            >
              <ExternalLink size={13} />
              Open Beyond BOQ
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f1117', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Remove from Beyond Brahmastra?</div>
            <div style={{ fontSize: '13px', color: '#565a72', marginBottom: '20px' }}>This removes the project from Brahmastra. The original BOQ in Beyond BOQ is unaffected and will re-sync automatically.</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8fa8', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
