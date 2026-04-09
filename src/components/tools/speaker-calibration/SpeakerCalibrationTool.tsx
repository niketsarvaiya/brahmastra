import { useState, useMemo } from 'react';
import { FormField, NumberInput, SelectInput } from '../../ui/FormField';
import { MetricCard } from '../../ui/MetricCard';
import { StatusBadge } from '../../ui/StatusBadge';
import { InsightPanel, RecommendationPanel, SummaryPanel } from '../../ui/InsightPanel';
import { calculateSpeakerCalibration } from '../../../lib/calculations/speaker-calibration';
import type { SpeakerCalibrationInputs, ChannelId, ChannelData } from '../../../lib/calculations/speaker-calibration';
import { SYSTEM_CHANNELS, CHANNEL_SHORT, isSub, isAtmos, isSurround } from '../../../lib/calculations/speaker-calibration';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SYSTEM_TYPES = [
  { value: 'stereo', label: 'Stereo (2.0)' },
  { value: '3.1', label: '3.1' },
  { value: '5.1', label: '5.1' },
  { value: '5.1.2', label: '5.1.2 (Atmos)' },
  { value: '7.1', label: '7.1' },
  { value: '7.1.2', label: '7.1.2 (Atmos)' },
  { value: '7.2.4', label: '7.2.4 (Atmos)' },
  { value: 'custom', label: 'Custom' },
];

const DISTANCE_UNITS = [
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'm', label: 'Meters (m)' },
];

const PHASE_OPTIONS = [
  { value: '0', label: '0°' },
  { value: '180', label: '180°' },
  { value: 'unknown', label: 'Variable / Unknown' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'large', label: 'Large' },
];

function makeDefaultChannel(): ChannelData {
  return { spl: '', distance: '', crossover: '', speakerSize: 'small' };
}

function makeDefaultInputs(): SpeakerCalibrationInputs {
  return {
    projectName: '', location: '', techName: '',
    systemType: '5.1',
    avrBrand: '', avrModel: '',
    distanceUnit: 'm',
    targetSPL: 75,
    channels: {},
    subCount: 1, subPhase: '0', subTrimDb: '', subNotes: '',
    frontCrossover: 80, centerCrossover: 80, surroundCrossover: 80,
    rearCrossover: 80, atmosCrossover: 100, subLPF: 80,
    obs: { dialogueWeak: false, bassBoomy: false, bassWeak: false, surroundsLoud: false, surroundsSoft: false, atmosNotNoticeable: false, frontHarsh: false, overallBalanced: false },
    notes: '',
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  good:    { bg: 'rgba(16,185,129,0.08)',  text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  warning: { bg: 'rgba(245,158,11,0.08)',  text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  critical:{ bg: 'rgba(239,68,68,0.08)',   text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  neutral: { bg: 'rgba(255,255,255,0.03)', text: '#565a72', border: 'rgba(255,255,255,0.08)' },
};

export function SpeakerCalibrationTool() {
  const [inputs, setInputs] = useState<SpeakerCalibrationInputs>(makeDefaultInputs());
  const [openSections, setOpenSections] = useState({ project: false, system: true, spl: true, distance: true, crossover: false, sub: false, obs: false });

  const result = useMemo(() => calculateSpeakerCalibration(inputs), [inputs]);
  const activeChannels = SYSTEM_CHANNELS[inputs.systemType] ?? [];

  function set<K extends keyof SpeakerCalibrationInputs>(key: K, value: SpeakerCalibrationInputs[K]) {
    setInputs(p => ({ ...p, [key]: value }));
  }

  function setChannel(ch: ChannelId, field: keyof ChannelData, value: ChannelData[keyof ChannelData]) {
    setInputs(p => ({
      ...p,
      channels: { ...p.channels, [ch]: { ...makeDefaultChannel(), ...(p.channels[ch] ?? {}), [field]: value } },
    }));
  }

  function setObs(key: keyof SpeakerCalibrationInputs['obs'], value: boolean) {
    setInputs(p => ({ ...p, obs: { ...p.obs, [key]: value } }));
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(p => ({ ...p, [key]: !p[key] }));
  }

  const mainChannels = activeChannels.filter(ch => !isSub(ch));
  const subChannels = activeChannels.filter(ch => isSub(ch));

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-[22px] font-semibold text-white">Speaker Calibration</h2>
          {result.hasData && <StatusBadge level={result.overallStatus} label={result.overallLabel} variant="pill" size="sm" />}
        </div>
        <p className="text-[13px]" style={{ color: '#8b8fa8' }}>
          Channel balance, delay alignment, crossover review, and sub integration assessment for home theatre systems.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        {/* ── LEFT: Inputs ── */}
        <div className="flex flex-col gap-3">

          {/* Project Details */}
          <Collapsible title="Project Details" open={openSections.project} onToggle={() => toggleSection('project')}>
            <div className="flex flex-col gap-3">
              <FormField label="Project Name">
                <input className="input-field" value={inputs.projectName} onChange={e => set('projectName', e.target.value)} placeholder="e.g. The Thompson Residence" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Location">
                  <input className="input-field" value={inputs.location} onChange={e => set('location', e.target.value)} placeholder="City" />
                </FormField>
                <FormField label="Technician">
                  <input className="input-field" value={inputs.techName} onChange={e => set('techName', e.target.value)} placeholder="Name" />
                </FormField>
              </div>
            </div>
          </Collapsible>

          {/* System Configuration */}
          <Collapsible title="System Configuration" open={openSections.system} onToggle={() => toggleSection('system')}>
            <div className="flex flex-col gap-3">
              <FormField label="System Type">
                <SelectInput value={inputs.systemType} onChange={v => set('systemType', v)} options={SYSTEM_TYPES} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="AVR / Processor Brand">
                  <input className="input-field" value={inputs.avrBrand} onChange={e => set('avrBrand', e.target.value)} placeholder="e.g. Denon" />
                </FormField>
                <FormField label="Model">
                  <input className="input-field" value={inputs.avrModel} onChange={e => set('avrModel', e.target.value)} placeholder="e.g. AVC-X6800H" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Distance Unit">
                  <SelectInput value={inputs.distanceUnit} onChange={v => set('distanceUnit', v as 'ft' | 'm')} options={DISTANCE_UNITS} />
                </FormField>
                <FormField label="Target SPL">
                  <NumberInput value={inputs.targetSPL} onChange={v => set('targetSPL', v)} min={60} max={90} step={1} unit="dB" />
                </FormField>
              </div>
            </div>
          </Collapsible>

          {/* Channel SPL */}
          <Collapsible title="Channel SPL Measurements" open={openSections.spl} onToggle={() => toggleSection('spl')}>
            <div className="flex flex-col gap-2">
              {mainChannels.map(ch => {
                const chData = inputs.channels[ch] ?? makeDefaultChannel();
                const cat = isAtmos(ch) ? '#8b5cf6' : isSurround(ch) ? '#3b82f6' : '#6366f1';
                return (
                  <div key={ch} className="flex items-center gap-2">
                    <div
                      className="text-[9px] font-bold uppercase tracking-wider w-8 text-center shrink-0 py-1 rounded"
                      style={{ background: `${cat}15`, color: cat }}
                    >{CHANNEL_SHORT[ch]}</div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        className="input-field"
                        value={chData.spl === '' ? '' : chData.spl}
                        onChange={e => setChannel(ch, 'spl', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder={`${inputs.targetSPL}`}
                        step="0.5" min="40" max="110"
                        style={{ paddingRight: '36px' }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#565a72' }}>dB</span>
                    </div>
                    {/* Inline deviation indicator */}
                    {chData.spl !== '' && typeof chData.spl === 'number' && (
                      <DeviationPip deviation={chData.spl - inputs.targetSPL} />
                    )}
                  </div>
                );
              })}
              <div className="mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#3a3d52' }}>Subwoofer(s)</div>
                {subChannels.map(ch => {
                  const chData = inputs.channels[ch] ?? makeDefaultChannel();
                  return (
                    <div key={ch} className="flex items-center gap-2 mb-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider w-8 text-center shrink-0 py-1 rounded" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        {CHANNEL_SHORT[ch]}
                      </div>
                      <div className="flex-1 relative">
                        <input type="number" className="input-field" value={chData.spl === '' ? '' : chData.spl}
                          onChange={e => setChannel(ch, 'spl', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder={`${inputs.targetSPL + 5}`} step="0.5" min="40" max="110" style={{ paddingRight: '36px' }} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#565a72' }}>dB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Collapsible>

          {/* Distances */}
          <Collapsible title={`Speaker Distances (${inputs.distanceUnit})`} open={openSections.distance} onToggle={() => toggleSection('distance')}>
            <div className="flex flex-col gap-2">
              {activeChannels.map(ch => {
                const chData = inputs.channels[ch] ?? makeDefaultChannel();
                const cat = isSub(ch) ? '#f59e0b' : isAtmos(ch) ? '#8b5cf6' : isSurround(ch) ? '#3b82f6' : '#6366f1';
                return (
                  <div key={ch} className="flex items-center gap-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider w-8 text-center shrink-0 py-1 rounded" style={{ background: `${cat}15`, color: cat }}>
                      {CHANNEL_SHORT[ch]}
                    </div>
                    <div className="flex-1 relative">
                      <input type="number" className="input-field" value={chData.distance === '' ? '' : chData.distance}
                        onChange={e => setChannel(ch, 'distance', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0.0" step="0.1" min="0" style={{ paddingRight: `${inputs.distanceUnit.length * 10 + 20}px` }} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#565a72' }}>{inputs.distanceUnit}</span>
                    </div>
                    <div className="w-20 shrink-0">
                      <SelectInput value={chData.speakerSize} onChange={v => setChannel(ch, 'speakerSize', v as 'small' | 'large')} options={SIZE_OPTIONS} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Collapsible>

          {/* Crossover */}
          <Collapsible title="Crossover Settings" open={openSections.crossover} onToggle={() => toggleSection('crossover')}>
            <div className="flex flex-col gap-3">
              {['FL', 'FR', 'C'].some(c => activeChannels.includes(c as ChannelId)) && (
                <FormField label="Front Crossover">
                  <NumberInput value={inputs.frontCrossover === '' ? '' : inputs.frontCrossover} onChange={v => set('frontCrossover', v)} min={40} max={250} step={5} unit="Hz" placeholder="80" />
                </FormField>
              )}
              {activeChannels.includes('C') && (
                <FormField label="Center Crossover">
                  <NumberInput value={inputs.centerCrossover === '' ? '' : inputs.centerCrossover} onChange={v => set('centerCrossover', v)} min={40} max={250} step={5} unit="Hz" placeholder="80" />
                </FormField>
              )}
              {activeChannels.some(c => isSurround(c)) && (
                <>
                  <FormField label="Surround Crossover">
                    <NumberInput value={inputs.surroundCrossover === '' ? '' : inputs.surroundCrossover} onChange={v => set('surroundCrossover', v)} min={40} max={250} step={5} unit="Hz" placeholder="80" />
                  </FormField>
                  <FormField label="Rear Crossover">
                    <NumberInput value={inputs.rearCrossover === '' ? '' : inputs.rearCrossover} onChange={v => set('rearCrossover', v)} min={40} max={250} step={5} unit="Hz" placeholder="80" />
                  </FormField>
                </>
              )}
              {activeChannels.some(c => isAtmos(c) && !isSub(c)) && (
                <FormField label="Atmos / Height Crossover">
                  <NumberInput value={inputs.atmosCrossover === '' ? '' : inputs.atmosCrossover} onChange={v => set('atmosCrossover', v)} min={40} max={250} step={5} unit="Hz" placeholder="100" />
                </FormField>
              )}
              {subChannels.length > 0 && (
                <FormField label="Subwoofer LPF">
                  <NumberInput value={inputs.subLPF === '' ? '' : inputs.subLPF} onChange={v => set('subLPF', v)} min={40} max={200} step={5} unit="Hz" placeholder="80" />
                </FormField>
              )}
            </div>
          </Collapsible>

          {/* Subwoofer */}
          {subChannels.length > 0 && (
            <Collapsible title="Subwoofer Configuration" open={openSections.sub} onToggle={() => toggleSection('sub')}>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Phase">
                    <SelectInput value={inputs.subPhase} onChange={v => set('subPhase', v as '0' | '180' | 'unknown')} options={PHASE_OPTIONS} />
                  </FormField>
                  <FormField label="Sub Trim">
                    <NumberInput value={inputs.subTrimDb === '' ? '' : inputs.subTrimDb} onChange={v => set('subTrimDb', v)} min={-12} max={12} step={0.5} unit="dB" placeholder="0" />
                  </FormField>
                </div>
                <FormField label="Placement Notes" sublabel="optional">
                  <input className="input-field" value={inputs.subNotes} onChange={e => set('subNotes', e.target.value)} placeholder="Corner / front wall / false floor…" />
                </FormField>
              </div>
            </Collapsible>
          )}

          {/* Observations */}
          <Collapsible title="Observational Inputs" open={openSections.obs} onToggle={() => toggleSection('obs')}>
            <div className="flex flex-col gap-2">
              {([
                ['dialogueWeak', 'Dialogue feels weak'],
                ['bassBoomy', 'Bass feels boomy'],
                ['bassWeak', 'Bass feels weak'],
                ['surroundsLoud', 'Surrounds feel too loud'],
                ['surroundsSoft', 'Surrounds feel too soft'],
                ['atmosNotNoticeable', 'Atmos effect not noticeable'],
                ['frontHarsh', 'Front soundstage feels harsh'],
                ['overallBalanced', 'Overall sound feels balanced'],
              ] as [keyof SpeakerCalibrationInputs['obs'], string][]).map(([key, label]) => (
                <ObsToggle key={key} label={label} value={inputs.obs[key]} onChange={v => setObs(key, v)} positive={key === 'overallBalanced'} />
              ))}
              <FormField label="Notes" sublabel="optional">
                <textarea className="input-field resize-none" rows={2} value={inputs.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional observations…" />
              </FormField>
            </div>
          </Collapsible>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="flex flex-col gap-4">
          {!result.hasData ? (
            <EmptyState />
          ) : (
            <>
              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Target SPL" value={inputs.targetSPL} unit="dB" status="neutral" sublabel="Reference level" />
                <MetricCard
                  label="Avg Deviation"
                  value={result.avgDeviation !== null ? `${result.avgDeviation > 0 ? '+' : ''}${result.avgDeviation.toFixed(1)}` : '—'}
                  unit={result.avgDeviation !== null ? 'dB' : ''}
                  status={Math.abs(result.avgDeviation ?? 0) <= 1 ? 'good' : Math.abs(result.avgDeviation ?? 0) <= 2 ? 'warning' : 'critical'}
                  sublabel="Across all channels"
                  large
                />
                <MetricCard
                  label="Out of Tolerance"
                  value={result.outOfToleranceCount}
                  unit="ch"
                  status={result.outOfToleranceCount === 0 ? 'good' : result.outOfToleranceCount <= 2 ? 'warning' : 'critical'}
                  sublabel="Exceeding ±2 dB"
                />
                <MetricCard
                  label="Balance Rating"
                  value=""
                  status={result.balanceStatus}
                  sublabel={result.balanceLabel}
                />
              </div>

              {/* Channel table */}
              <ChannelTable channelResults={result.channelResults} target={inputs.targetSPL} />

              {/* Sub + Crossover status cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatusCard title="Crossover Review" status={result.crossoverStatus} label={result.crossoverLabel} flags={result.crossoverFlags} emptyMessage="No crossover issues detected." />
                <StatusCard title="Sub Integration" status={result.subStatus} label={result.subLabel}
                  flags={[
                    inputs.subPhase === 'unknown' ? 'Phase setting is unknown — verify before sign-off.' : '',
                    inputs.obs.bassBoomy ? 'Bass bloom reported — review phase / placement / LPF.' : '',
                    inputs.obs.bassWeak ? 'Weak bass reported — check polarity, gain, and crossover continuity.' : '',
                    inputs.subTrimDb !== '' && Math.abs(Number(inputs.subTrimDb)) > 8 ? `Sub trim (${inputs.subTrimDb} dB) is outside normal ±6 dB window.` : '',
                  ].filter(Boolean)}
                  emptyMessage="Sub integration looks acceptable." />
              </div>

              {/* Delay flags */}
              {result.delayFlags.length > 0 && (
                <FlagCard title="Distance / Delay Review" flags={result.delayFlags} level="warning" />
              )}

              <InsightPanel insights={result.insights} />
              <RecommendationPanel recommendations={result.recommendations} />
              <SummaryPanel summary={result.summary} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Collapsible({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-[13px] font-semibold text-white">{title}</span>
        {open ? <ChevronUp size={14} style={{ color: '#565a72' }} /> : <ChevronDown size={14} style={{ color: '#565a72' }} />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function ObsToggle({ label, value, onChange, positive }: { label: string; value: boolean; onChange: (v: boolean) => void; positive?: boolean }) {
  return (
    <label
      className="flex items-center gap-2.5 py-2 px-3 rounded-[8px] cursor-pointer select-none transition-colors"
      style={{ background: value ? (positive ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)') : 'rgba(255,255,255,0.02)' }}
    >
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="w-3.5 h-3.5 rounded shrink-0" style={{ accentColor: positive ? '#10b981' : '#f59e0b' }} />
      <span className="text-[12px]" style={{ color: value ? (positive ? '#10b981' : '#f59e0b') : '#8b8fa8' }}>{label}</span>
    </label>
  );
}

function DeviationPip({ deviation }: { deviation: number }) {
  const abs = Math.abs(deviation);
  const color = abs <= 1 ? '#10b981' : abs <= 2 ? '#f59e0b' : '#ef4444';
  const sign = deviation > 0 ? '+' : '';
  return (
    <div
      className="w-14 text-center text-[10px] font-bold rounded shrink-0 py-1"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
    >
      {sign}{deviation.toFixed(1)}
    </div>
  );
}

function ChannelTable({ channelResults, target }: { channelResults: ReturnType<typeof calculateSpeakerCalibration>['channelResults']; target: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[12px] font-semibold text-white">Channel Balance Table</div>
        <div className="text-[11px] mt-0.5" style={{ color: '#565a72' }}>Target: {target} dB SPL · Tolerance: ±2 dB</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Channel', 'Measured', 'Target', 'Deviation', 'Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-widest text-[10px]" style={{ color: '#3a3d52' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channelResults.map(ch => {
              const sc = STATUS_COLORS[ch.status] ?? STATUS_COLORS.neutral;
              return (
                <tr key={ch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#c4c6d4' }}>{ch.label}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold" style={{ color: ch.measured !== '' ? '#f0f1f3' : '#3a3d52' }}>
                    {ch.measured !== '' ? `${ch.measured} dB` : '—'}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: '#565a72' }}>{target} dB</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {ch.deviation !== null ? (
                      <span className="font-semibold" style={{ color: sc.text }}>
                        {ch.deviation > 0 ? '+' : ''}{ch.deviation.toFixed(1)} dB
                      </span>
                    ) : <span style={{ color: '#3a3d52' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {ch.status !== 'neutral' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {ch.status === 'good' ? 'Excellent' : ch.status === 'warning' ? 'Acceptable' : 'Needs Correction'}
                      </span>
                    ) : <span style={{ color: '#3a3d52', fontSize: '10px' }}>No data</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusCard({ title, status, label, flags, emptyMessage }: { title: string; status: string; label: string; flags: string[]; emptyMessage: string }) {
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.neutral;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-white">{title}</div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{label}</span>
      </div>
      {flags.filter(Boolean).length === 0 ? (
        <div className="text-[12px]" style={{ color: '#565a72' }}>{emptyMessage}</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {flags.filter(Boolean).map((f, i) => (
            <li key={i} className="flex gap-2 items-start text-[11px]" style={{ color: '#8b8fa8' }}>
              <span style={{ color: sc.text, flexShrink: 0 }}>›</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FlagCard({ title, flags, level }: { title: string; flags: string[]; level: string }) {
  const sc = STATUS_COLORS[level] ?? STATUS_COLORS.neutral;
  return (
    <div className="card p-5" style={{ borderColor: sc.border }}>
      <div className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: sc.text }}>{title}</div>
      <ul className="flex flex-col gap-2">
        {flags.map((f, i) => (
          <li key={i} className="flex gap-2 items-start text-[12px]" style={{ color: '#8b8fa8' }}>
            <span style={{ color: sc.text, flexShrink: 0 }}>→</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-4" style={{ background: '#161820', border: '1px dashed rgba(255,255,255,0.08)', minHeight: '300px' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'rgba(139,92,246,0.1)' }}>🔊</div>
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">Awaiting Measurements</div>
        <div className="text-[13px] max-w-[300px]" style={{ color: '#565a72' }}>Enter SPL readings for at least one channel to generate channel balance analysis and engineering insights.</div>
      </div>
    </div>
  );
}
