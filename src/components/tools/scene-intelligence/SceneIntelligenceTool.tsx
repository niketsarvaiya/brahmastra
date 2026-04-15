import { useState } from 'react';
import { Sparkles, Loader2, Copy, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

type ClientProfile = 'Basic' | 'Premium' | 'Ultra Luxury';

interface LightGroup {
  label: string;
  items: string[];
}

interface ParsedSection {
  partNumber: number;
  title: string;
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────

const ROOM_TYPES = [
  'Living Room',
  'Master Bedroom',
  'Guest Bedroom',
  'Dining Room',
  'Kitchen',
  'Home Theatre',
  'Passage / Corridor',
  'Bathroom',
  'Outdoor / Landscape',
];

const LIGHT_GROUPS: LightGroup[] = [
  {
    label: 'AMBIENT LAYER',
    items: ['Cove / Indirect', 'Panel / Downlights', 'General Ceiling'],
  },
  {
    label: 'ACCENT LAYER',
    items: ['Art / Wall Wash', 'Strip Lighting', 'Spotlights'],
  },
  {
    label: 'TASK LAYER',
    items: ['Reading Lights', 'Mirror / Vanity', 'Counter / Work'],
  },
  {
    label: 'DECORATIVE',
    items: ['Chandelier', 'Pendant / Feature', 'Sconces'],
  },
];

const PART_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  2: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  3: { bg: 'rgba(6,182,212,0.12)', text: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
  4: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  5: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
};

// ─── Helpers ─────────────────────────────────────────────────────

function parseResponse(text: string): ParsedSection[] {
  const parts = text.split(/(?=## PART \d+:)/);
  const sections: ParsedSection[] = [];

  for (const part of parts) {
    const match = part.match(/^## PART (\d+):\s*(.+)\n([\s\S]*)/);
    if (match) {
      sections.push({
        partNumber: parseInt(match[1]),
        title: match[2].trim(),
        content: match[3].trim(),
      });
    }
  }

  return sections;
}

function renderContentLine(line: string, idx: number) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={idx} style={{ height: '8px' }} />;

  // Skip ## headers (already used as section title)
  if (trimmed.startsWith('## ')) return null;

  // Bold lines: **text** or lines containing **...**
  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
    const inner = trimmed.slice(2, -2);
    return (
      <div key={idx} style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '13px', marginTop: '10px', marginBottom: '4px' }}>
        {inner}
      </div>
    );
  }

  // Inline bold: contains **...**
  if (trimmed.includes('**')) {
    const parts = trimmed.split(/\*\*(.+?)\*\*/g);
    return (
      <div key={idx} style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <strong key={i} style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{p}</strong>
            : p
        )}
      </div>
    );
  }

  // Bullet lines
  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
    const content = trimmed.replace(/^[-•]\s+/, '');
    return (
      <div key={idx} className="flex gap-2" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.6', paddingLeft: '8px' }}>
        <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '2px' }}>•</span>
        <span>{content}</span>
      </div>
    );
  }

  // Regular text
  return (
    <div key={idx} style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
      {trimmed}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function SceneIntelligenceTool() {
  const [roomType, setRoomType] = useState('Living Room');
  const [clientProfile, setClientProfile] = useState<ClientProfile>('Premium');
  const [selectedLights, setSelectedLights] = useState<Set<string>>(new Set());
  const [auditEnabled, setAuditEnabled] = useState(false);
  const [currentSceneSetup, setCurrentSceneSetup] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleLight(light: string) {
    setSelectedLights(prev => {
      const next = new Set(prev);
      if (next.has(light)) next.delete(light);
      else next.add(light);
      return next;
    });
  }

  async function generate() {
    if (selectedLights.size === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scene-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType,
          clientProfile,
          lightsAvailable: Array.from(selectedLights),
          currentSceneSetup: auditEnabled && currentSceneSetup.trim() ? currentSceneSetup.trim() : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Something went wrong');
      } else {
        setResult(data.result ?? '');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sections = result ? parseResponse(result) : [];
  const canGenerate = selectedLights.size > 0 && !loading;

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Sparkles size={20} style={{ color: '#f59e0b' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'white', margin: 0 }}>Scene Intelligence</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
          AI-powered luxury lighting scene design — by room type, light layers, and client profile.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(320px, 380px, 100%) 1fr', gap: '24px', alignItems: 'start' }}
        className="scene-grid">
        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Room Setup Card */}
          <div style={{ background: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Room Setup
              </span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Room Type */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={e => setRoomType(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  {ROOM_TYPES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Client Profile */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Client Profile
                </label>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px' }}>
                  {(['Basic', 'Premium', 'Ultra Luxury'] as ClientProfile[]).map(profile => (
                    <button
                      key={profile}
                      onClick={() => setClientProfile(profile)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: clientProfile === profile ? 600 : 400,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: clientProfile === profile ? 'var(--color-accent)' : 'transparent',
                        color: clientProfile === profile ? 'white' : 'var(--color-text-muted)',
                      }}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lights Available Card */}
          <div style={{ background: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Lights Available
              </span>
              {selectedLights.size > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '10px', padding: '1px 7px' }}>
                  {selectedLights.size} selected
                </span>
              )}
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {LIGHT_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {group.items.map(item => {
                      const checked = selectedLights.has(item);
                      return (
                        <label
                          key={item}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 8px',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            background: checked ? 'rgba(245,158,11,0.07)' : 'transparent',
                            transition: 'background 0.12s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLight(item)}
                            style={{ accentColor: '#f59e0b', width: '13px', height: '13px', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '13px', color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectedLights.size === 0 && (
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                  Select at least one light type to generate scenes.
                </p>
              )}
            </div>
          </div>

          {/* Scene Audit Card */}
          <div style={{ background: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            <button
              onClick={() => setAuditEnabled(p => !p)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  Scene Audit
                </span>
                <span style={{
                  fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
                  background: auditEnabled ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                  color: auditEnabled ? '#f59e0b' : 'var(--color-text-muted)',
                }}>
                  {auditEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              {auditEnabled
                ? <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
              }
            </button>
            {auditEnabled && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ paddingTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Current Scene Setup
                  </label>
                  <textarea
                    className="input-field"
                    rows={6}
                    value={currentSceneSetup}
                    onChange={e => setCurrentSceneSetup(e.target.value)}
                    placeholder={'e.g.\nEvening Scene:\n  - Cove: 80%  Fade: 2s\n  - Chandelier: 100%  Fade: 1s'}
                    style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', margin: '6px 0 0' }}>
                    Claude will score your existing setup and identify issues (Part 4).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={!canGenerate}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '10px',
              border: 'none',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              background: canGenerate
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'rgba(255,255,255,0.05)',
              color: canGenerate ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.15s, transform 0.1s',
              opacity: canGenerate ? 1 : 0.5,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Analysing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Scenes →
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ minWidth: 0 }}>
          {/* Empty state */}
          {!loading && !result && !error && (
            <div style={{
              background: 'rgba(22,24,32,0.6)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: '14px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '48px 32px',
              textAlign: 'center',
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '6px' }}>Scene Intelligence</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '280px' }}>
                  Configure your room on the left, then generate your scene design.
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{
              background: 'rgba(22,24,32,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              padding: '48px 32px',
              textAlign: 'center',
            }}>
              <Loader2 size={28} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>Designing your scenes...</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Claude is analysing your room setup.</div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Generation Failed</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{error}</div>
              <button
                onClick={generate}
                style={{
                  alignSelf: 'flex-start',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Result state */}
          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Result toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {sections.length} sections generated for <strong style={{ color: 'var(--color-text-secondary)' }}>{roomType}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={copyOutput}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)', color: copied ? '#34d399' : 'var(--color-text-secondary)',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy Output'}
                  </button>
                  <button
                    onClick={generate}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-secondary)',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <RotateCcw size={13} /> Regenerate
                  </button>
                </div>
              </div>

              {/* Section cards */}
              {sections.length > 0
                ? sections.map(section => {
                    const colors = PART_COLORS[section.partNumber] ?? PART_COLORS[1];
                    const lines = section.content.split('\n');
                    return (
                      <div
                        key={section.partNumber}
                        style={{
                          background: 'var(--color-surface-1)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Section header */}
                        <div style={{
                          padding: '12px 18px',
                          background: colors.bg,
                          borderBottom: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}>
                          <span style={{
                            fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px',
                            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                          }}>
                            Part {section.partNumber}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>
                            {section.title}
                          </span>
                        </div>

                        {/* Section content */}
                        <div style={{ padding: '16px 18px', background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {lines.map((line, i) => renderContentLine(line, i))}
                        </div>
                      </div>
                    );
                  })
                : (
                  // Fallback: raw text if parsing fails
                  <div style={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '20px',
                  }}>
                    <pre style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {result}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 900px) {
          .scene-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
