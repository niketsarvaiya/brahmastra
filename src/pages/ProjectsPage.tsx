import { useState, useRef } from 'react';
import { Plus, Folder, Trash2, ChevronRight, Upload, Activity, X, Calendar, MapPin, Hash } from 'lucide-react';
import type { BrahmastraProject } from '../types';
import { saveProject, deleteProject } from '../lib/projectStorage';
import { parseBOQForProject } from '../lib/boqProjectImport';

interface ProjectsPageProps {
  projects: BrahmastraProject[];
  onOpenProject: (project: BrahmastraProject) => void;
  onProjectsChange: () => void;
}

interface NewProjectForm {
  name: string;
  client: string;
  location: string;
  projectCode: string;
}

const EMPTY_FORM: NewProjectForm = { name: '', client: '', location: '', projectCode: '' };

export function ProjectsPage({ projects, onOpenProject, onProjectsChange }: ProjectsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM);
  const [boqDragOver, setBoqDragOver] = useState(false);
  const [boqParsed, setBoqParsed] = useState<BrahmastraProject | null>(null);
  const [boqError, setBoqError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleBOQFile(file: File) {
    setBoqError('');
    if (!file.name.endsWith('.json')) {
      setBoqError('Please upload a JSON file exported from BOQ Builder.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const parsed = parseBOQForProject(json);
      if (!parsed) {
        setBoqError('Invalid BOQ file. Export from BOQ Builder and try again.');
        return;
      }
      setBoqParsed(parsed);
      setForm({
        name: parsed.name || '',
        client: parsed.client || '',
        location: parsed.location || '',
        projectCode: parsed.projectCode || '',
      });
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setBoqDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleBOQFile(file);
  }

  function handleCreateProject() {
    if (!form.name.trim()) return;
    const project: BrahmastraProject = boqParsed
      ? { ...boqParsed, name: form.name, client: form.client, location: form.location, projectCode: form.projectCode, updatedAt: new Date().toISOString() }
      : {
          id: crypto.randomUUID(),
          name: form.name,
          client: form.client,
          location: form.location,
          projectCode: form.projectCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activeToolIds: [],
        };
    saveProject(project);
    onProjectsChange();
    setShowModal(false);
    setForm(EMPTY_FORM);
    setBoqParsed(null);
    setBoqError('');
  }

  function handleDelete(id: string) {
    deleteProject(id);
    onProjectsChange();
    setDeleteConfirmId(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const scopeCount = (p: BrahmastraProject) => {
    if (!p.boqData) return 0;
    return new Set(p.boqData.lineItems.filter((i) => i.included).map((i) => i.scope)).size;
  };


  return (
    <div style={{ minHeight: '100svh', background: '#0a0b0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f1117' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>Brahmastra</div>
            <div style={{ fontSize: '10px', color: '#3a3d52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>by Beyond Alliance</div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
          >
            <Plus size={15} />
            New Project
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', marginBottom: '6px' }}>Projects</h1>
          <p style={{ fontSize: '14px', color: '#565a72' }}>Select a project to access its calibration and audit tools.</p>
        </div>

        {projects.length === 0 ? (
          <div style={{ border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Folder size={24} color="#6366f1" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#8b8fa8', marginBottom: '8px' }}>No projects yet</div>
            <div style={{ fontSize: '13px', color: '#3a3d52', marginBottom: '24px' }}>Create a new project or import a BOQ to get started.</div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
            >
              <Plus size={14} /> Create First Project
            </button>
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
                      <MapPin size={11} color="#565a72" />
                      {project.location}
                    </div>
                  )}
                  {project.projectCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#565a72' }}>
                      <Hash size={11} color="#565a72" />
                      {project.projectCode}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#565a72' }}>
                    <Calendar size={11} color="#565a72" />
                    {formatDate(project.updatedAt)}
                  </div>
                </div>

                {/* Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {project.boqData ? (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      BOQ Linked • {scopeCount(project)} scopes
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: '#565a72', border: '1px solid rgba(255,255,255,0.06)' }}>
                      No BOQ
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
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(EMPTY_FORM); setBoqParsed(null); setBoqError(''); } }}
        >
          <div style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>New Project</h2>
                <p style={{ fontSize: '12px', color: '#565a72' }}>Import a BOQ or create manually.</p>
              </div>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setBoqParsed(null); setBoqError(''); }} style={{ color: '#565a72', padding: '4px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: 'transparent' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')} onMouseLeave={(e) => (e.currentTarget.style.color = '#565a72')}>
                <X size={18} />
              </button>
            </div>

            {/* BOQ Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setBoqDragOver(true); }}
              onDragLeave={() => setBoqDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${boqDragOver ? '#6366f1' : boqParsed ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '20px',
                background: boqDragOver ? 'rgba(99,102,241,0.05)' : boqParsed ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBOQFile(f); }} />
              {boqParsed ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '4px' }}>✓ BOQ Imported</div>
                  <div style={{ fontSize: '12px', color: '#565a72' }}>{boqParsed.name} — {new Set(boqParsed.boqData?.lineItems.filter(i => i.included).map(i => i.scope)).size} scopes detected</div>
                </div>
              ) : (
                <div>
                  <Upload size={20} color="#565a72" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#8b8fa8', marginBottom: '4px' }}>Drop BOQ JSON here</div>
                  <div style={{ fontSize: '11px', color: '#3a3d52' }}>or click to browse • exported from BOQ Builder</div>
                </div>
              )}
            </div>
            {boqError && <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px', marginTop: '-12px' }}>{boqError}</div>}

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {[
                { key: 'name', label: 'Project Name *', placeholder: 'e.g. Bandra Residence' },
                { key: 'client', label: 'Client', placeholder: 'e.g. Mr. Sharma' },
                { key: 'location', label: 'Location', placeholder: 'e.g. Mumbai' },
                { key: 'projectCode', label: 'Project Code', placeholder: 'e.g. BA-2024-001' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#565a72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof NewProjectForm]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setBoqParsed(null); setBoqError(''); }} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8fa8', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!form.name.trim()}
                style={{ padding: '9px 20px', borderRadius: '8px', background: form.name.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.3)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: form.name.trim() ? 'pointer' : 'default', border: 'none' }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f1117', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Delete Project?</div>
            <div style={{ fontSize: '13px', color: '#565a72', marginBottom: '20px' }}>This action cannot be undone. All project data will be lost.</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8fa8', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
