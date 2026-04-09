import { useState, useMemo } from 'react';
import { FormField, NumberInput, SelectInput } from '../../ui/FormField';
import { MetricCard } from '../../ui/MetricCard';
import { StatusBadge } from '../../ui/StatusBadge';
import { InsightPanel, RecommendationPanel, SummaryPanel } from '../../ui/InsightPanel';
import { calculateNetworkAudit } from '../../../lib/calculations/network-audit';
import type { NetworkAuditInputs, WifiZone } from '../../../lib/calculations/network-audit';
import { Plus, Trash2, ChevronDown, ChevronUp, Wifi } from 'lucide-react';

const BAND_OPTIONS = [
  { value: '2.4GHz', label: '2.4 GHz' },
  { value: '5GHz', label: '5 GHz' },
  { value: '6GHz', label: '6 GHz' },
  { value: 'unknown', label: 'Unknown' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  good:    { bg: 'rgba(16,185,129,0.08)',  text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  warning: { bg: 'rgba(245,158,11,0.08)',  text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  critical:{ bg: 'rgba(239,68,68,0.08)',   text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  neutral: { bg: 'rgba(255,255,255,0.03)', text: '#565a72', border: 'rgba(255,255,255,0.08)' },
};

let nextZoneId = 1;
function newZone(): WifiZone {
  return { id: String(nextZoneId++), room: '', rssi: '', band: '5GHz', speedMbps: '', roamingIssue: false, streamingIssue: false, voiceIssue: false };
}

function makeDefault(): NetworkAuditInputs {
  return {
    projectName: '', location: '', techName: '',
    ispName: '', planDown: '', planUp: '', actualDown: '', actualUp: '', pingMs: '', jitterMs: '', packetLossPct: '',
    routerBrand: '', switchBrand: '', managedSwitch: false, apCount: '', apBrand: '', controllerWifi: false, meshWifi: false, vlansImplemented: false, upsForNetwork: false,
    zones: [],
    wired: { apsWired: true, wirelessUplinks: false, cctvWired: true, avWired: true, rackLabelled: false, poeBudgetVerified: false, loopObserved: false, randomDrops: false },
    profile: { automation: false, avStreaming: false, cctv: false, vdp: false, voiceAssistants: false, wfh: false, gaming: false, multiRoomAudio: false, remoteAccess: false },
    obs: { deadZones: false, slowApp: false, cameraBuffering: false, intercomDelay: false, wifiDropsRoaming: false, slowStreaming: false, voiceInconsistent: false, networkRestartsNeeded: false, overallStable: false },
    notes: '',
  };
}

export function NetworkAuditTool() {
  const [inputs, setInputs] = useState<NetworkAuditInputs>(makeDefault());
  const [openSections, setOpenSections] = useState({ project: false, internet: true, infra: true, zones: true, wired: false, profile: false, obs: false });

  const result = useMemo(() => calculateNetworkAudit(inputs), [inputs]);

  function set<K extends keyof NetworkAuditInputs>(key: K, value: NetworkAuditInputs[K]) {
    setInputs(p => ({ ...p, [key]: value }));
  }
  function setWired(key: keyof NetworkAuditInputs['wired'], v: boolean) {
    setInputs(p => ({ ...p, wired: { ...p.wired, [key]: v } }));
  }
  function setProfile(key: keyof NetworkAuditInputs['profile'], v: boolean) {
    setInputs(p => ({ ...p, profile: { ...p.profile, [key]: v } }));
  }
  function setObs(key: keyof NetworkAuditInputs['obs'], v: boolean) {
    setInputs(p => ({ ...p, obs: { ...p.obs, [key]: v } }));
  }
  function addZone() { setInputs(p => ({ ...p, zones: [...p.zones, newZone()] })); }
  function removeZone(id: string) { setInputs(p => ({ ...p, zones: p.zones.filter(z => z.id !== id) })); }
  function updateZone(id: string, field: keyof WifiZone, value: WifiZone[keyof WifiZone]) {
    setInputs(p => ({ ...p, zones: p.zones.map(z => z.id === id ? { ...z, [field]: value } : z) }));
  }
  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(p => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="p-6 max-w-[1300px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-[22px] font-semibold text-white">Network Audit</h2>
          {result.hasData && <StatusBadge level={result.overallStatus} label={result.overallLabel} variant="pill" size="sm" />}
        </div>
        <p className="text-[13px]" style={{ color: '#8b8fa8' }}>
          Signal coverage, internet quality, infrastructure review, and smart home readiness assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-3">

          {/* Project */}
          <Collapsible title="Project Details" open={openSections.project} onToggle={() => toggleSection('project')}>
            <div className="flex flex-col gap-3">
              <FormField label="Project Name">
                <input className="input-field" value={inputs.projectName} onChange={e => set('projectName', e.target.value)} placeholder="e.g. The Thompson Residence" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Location"><input className="input-field" value={inputs.location} onChange={e => set('location', e.target.value)} placeholder="City" /></FormField>
                <FormField label="Technician"><input className="input-field" value={inputs.techName} onChange={e => set('techName', e.target.value)} placeholder="Name" /></FormField>
              </div>
            </div>
          </Collapsible>

          {/* Internet / WAN */}
          <Collapsible title="Internet / WAN" open={openSections.internet} onToggle={() => toggleSection('internet')}>
            <div className="flex flex-col gap-3">
              <FormField label="ISP"><input className="input-field" value={inputs.ispName} onChange={e => set('ispName', e.target.value)} placeholder="e.g. Jio Fiber" /></FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Plan Download"><NumberInput value={inputs.planDown} onChange={v => set('planDown', v)} min={0} max={10000} step={10} unit="Mbps" placeholder="1000" /></FormField>
                <FormField label="Plan Upload"><NumberInput value={inputs.planUp} onChange={v => set('planUp', v)} min={0} max={10000} step={10} unit="Mbps" placeholder="500" /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Actual Download"><NumberInput value={inputs.actualDown} onChange={v => set('actualDown', v)} min={0} max={10000} step={1} unit="Mbps" placeholder="0" /></FormField>
                <FormField label="Actual Upload"><NumberInput value={inputs.actualUp} onChange={v => set('actualUp', v)} min={0} max={10000} step={1} unit="Mbps" placeholder="0" /></FormField>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Ping"><NumberInput value={inputs.pingMs} onChange={v => set('pingMs', v)} min={0} max={500} step={1} unit="ms" placeholder="15" /></FormField>
                <FormField label="Jitter"><NumberInput value={inputs.jitterMs} onChange={v => set('jitterMs', v)} min={0} max={200} step={0.5} unit="ms" placeholder="2" /></FormField>
                <FormField label="Packet Loss"><NumberInput value={inputs.packetLossPct} onChange={v => set('packetLossPct', v)} min={0} max={100} step={0.1} unit="%" placeholder="0" /></FormField>
              </div>
            </div>
          </Collapsible>

          {/* Infrastructure */}
          <Collapsible title="Network Infrastructure" open={openSections.infra} onToggle={() => toggleSection('infra')}>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Router Brand / Model"><input className="input-field" value={inputs.routerBrand} onChange={e => set('routerBrand', e.target.value)} placeholder="e.g. Ubiquiti USG" /></FormField>
                <FormField label="Switch Brand / Model"><input className="input-field" value={inputs.switchBrand} onChange={e => set('switchBrand', e.target.value)} placeholder="e.g. UniFi 24-port" /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="AP Count"><NumberInput value={inputs.apCount} onChange={v => set('apCount', Math.round(v))} min={0} max={50} step={1} placeholder="3" /></FormField>
                <FormField label="AP Brand / Model"><input className="input-field" value={inputs.apBrand} onChange={e => set('apBrand', e.target.value)} placeholder="e.g. UniFi U6 Pro" /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['managedSwitch', 'Managed Switch'],
                  ['controllerWifi', 'Controller-based WiFi'],
                  ['meshWifi', 'Mesh WiFi'],
                  ['vlansImplemented', 'VLANs Implemented'],
                  ['upsForNetwork', 'UPS for Network Rack'],
                ] as [keyof NetworkAuditInputs, string][]).map(([key, label]) => (
                  <YesNoToggle key={key} label={label} value={inputs[key] as boolean} onChange={v => set(key, v)} />
                ))}
              </div>
            </div>
          </Collapsible>

          {/* WiFi Zones */}
          <Collapsible title="WiFi Zone Measurements" open={openSections.zones} onToggle={() => toggleSection('zones')}>
            <div className="flex flex-col gap-3">
              {inputs.zones.length === 0 ? (
                <button onClick={addZone} className="w-full py-6 rounded-[10px] flex flex-col items-center gap-2 transition-all hover:opacity-80" style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
                  <Wifi size={18} style={{ color: '#3a3d52' }} />
                  <span className="text-[12px]" style={{ color: '#3a3d52' }}>Add your first zone</span>
                </button>
              ) : (
                inputs.zones.map((zone, i) => (
                  <ZoneRow key={zone.id} zone={zone} index={i} onChange={(field, v) => updateZone(zone.id, field, v)} onRemove={() => removeZone(zone.id)} />
                ))
              )}
              <button onClick={addZone} className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[12px] font-medium transition-all hover:opacity-80" style={{ border: '1px dashed rgba(255,255,255,0.06)', color: '#565a72' }}>
                <Plus size={12} /> Add zone / room
              </button>
            </div>
          </Collapsible>

          {/* Wired Checks */}
          <Collapsible title="Wired Network Checks" open={openSections.wired} onToggle={() => toggleSection('wired')}>
            <div className="grid grid-cols-1 gap-2">
              {([
                ['apsWired', 'All APs wired on ethernet', true],
                ['wirelessUplinks', 'Wireless uplinks present', false],
                ['cctvWired', 'CCTV on wired network', true],
                ['avWired', 'AV/media players on wired where possible', true],
                ['rackLabelled', 'Rack patching labelled', true],
                ['poeBudgetVerified', 'PoE budget verified', true],
                ['loopObserved', 'Loop / instability observed', false],
                ['randomDrops', 'Random device drop-offs reported', false],
              ] as [keyof NetworkAuditInputs['wired'], string, boolean][]).map(([key, label, goodWhenTrue]) => (
                <YesNoToggle key={key} label={label} value={inputs.wired[key]} onChange={v => setWired(key, v)}
                  goodWhenTrue={goodWhenTrue} />
              ))}
            </div>
          </Collapsible>

          {/* Smart Home Profile */}
          <Collapsible title="Smart Home Usage Profile" open={openSections.profile} onToggle={() => toggleSection('profile')}>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['automation', 'Automation System'],
                ['avStreaming', 'AV Streaming'],
                ['cctv', 'CCTV'],
                ['vdp', 'VDP / Intercom'],
                ['voiceAssistants', 'Voice Assistants'],
                ['wfh', 'Work From Home'],
                ['gaming', 'Gaming'],
                ['multiRoomAudio', 'Multi-Room Audio'],
                ['remoteAccess', 'Remote Access'],
              ] as [keyof NetworkAuditInputs['profile'], string][]).map(([key, label]) => (
                <YesNoToggle key={key} label={label} value={inputs.profile[key]} onChange={v => setProfile(key, v)} />
              ))}
            </div>
          </Collapsible>

          {/* Observations */}
          <Collapsible title="Observational Inputs" open={openSections.obs} onToggle={() => toggleSection('obs')}>
            <div className="flex flex-col gap-1.5">
              {([
                ['deadZones', 'Dead zones noticed', false],
                ['slowApp', 'Slow app response', false],
                ['cameraBuffering', 'Camera buffering', false],
                ['intercomDelay', 'Intercom delay', false],
                ['wifiDropsRoaming', 'WiFi drops while roaming', false],
                ['slowStreaming', 'Slow Apple TV / OTT streaming', false],
                ['voiceInconsistent', 'Alexa / Google Home inconsistent', false],
                ['networkRestartsNeeded', 'Network restarts required often', false],
                ['overallStable', 'Overall network feels stable', true],
              ] as [keyof NetworkAuditInputs['obs'], string, boolean][]).map(([key, label, goodWhenTrue]) => (
                <YesNoToggle key={key} label={label} value={inputs.obs[key]} onChange={v => setObs(key, v)} goodWhenTrue={goodWhenTrue} />
              ))}
              <FormField label="Notes" sublabel="optional">
                <textarea className="input-field resize-none" rows={2} value={inputs.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional observations…" />
              </FormField>
            </div>
          </Collapsible>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-4">
          {!result.hasData ? (
            <EmptyState onAdd={addZone} />
          ) : (
            <>
              {/* Top metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Internet" value="" status={result.internetStatus} sublabel={result.internetLabel} />
                <MetricCard label="WiFi Coverage" value="" status={result.coverageStatus} sublabel={result.coverageLabel} />
                <MetricCard label="Infrastructure" value="" status={result.infraStatus} sublabel={result.infraLabel} />
                <MetricCard label="Smart Home Ready" value="" status={result.readinessStatus} sublabel={result.readinessLabel} large />
              </div>

              {/* Internet detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MetricCard label="Ping / Latency" value={result.pingStatus !== 'neutral' ? inputs.pingMs : '—'} unit={result.pingStatus !== 'neutral' ? 'ms' : ''} status={result.pingStatus} sublabel={result.pingLabel} />
                <MetricCard label="Packet Loss" value={result.packetLossStatus !== 'neutral' ? inputs.packetLossPct : '—'} unit={result.packetLossStatus !== 'neutral' ? '%' : ''} status={result.packetLossStatus} sublabel={result.packetLossLabel} />
                <MetricCard label="Speed vs Plan" value={result.speedStatus !== 'neutral' ? inputs.actualDown : '—'} unit={result.speedStatus !== 'neutral' ? 'Mbps' : ''} status={result.speedStatus} sublabel={result.speedLabel} />
              </div>

              {/* Speed bar */}
              {inputs.planDown !== '' && inputs.actualDown !== '' && Number(inputs.planDown) > 0 && (
                <SpeedBar planDown={Number(inputs.planDown)} actualDown={Number(inputs.actualDown)} planUp={Number(inputs.planUp) || 0} actualUp={Number(inputs.actualUp) || 0} />
              )}

              {/* RSSI summary cards */}
              {result.avgRssi !== null && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <MetricCard label="Avg RSSI" value={result.avgRssi} unit="dBm" status={result.avgRssi >= -67 ? 'good' : result.avgRssi >= -72 ? 'warning' : 'critical'} sublabel="Across all zones" />
                  <MetricCard label="Worst Zone" value={result.worstRssi ?? '—'} unit={result.worstRssi ? 'dBm' : ''} status={result.worstRssi && result.worstRssi >= -67 ? 'good' : result.worstRssi && result.worstRssi >= -72 ? 'warning' : 'critical'} sublabel={result.worstZone} />
                  <MetricCard label="Zones Audited" value={result.zoneResults.length} unit="" status="neutral" sublabel={`${result.zoneResults.filter(z => z.signalStatus === 'critical').length} weak, ${result.zoneResults.filter(z => z.signalStatus === 'warning').length} fair`} />
                </div>
              )}

              {/* Zone table */}
              {result.zoneResults.length > 0 && <ZoneTable zones={result.zoneResults} />}

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
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity">
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

function YesNoToggle({ label, value, onChange, goodWhenTrue = true }: { label: string; value: boolean; onChange: (v: boolean) => void; goodWhenTrue?: boolean }) {
  const isGood = value === goodWhenTrue;
  const color = isGood ? '#10b981' : '#565a72';
  return (
    <label className="flex items-center gap-2.5 py-1.5 px-2 rounded-[8px] cursor-pointer select-none" style={{ background: value ? `${color}08` : 'transparent' }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="w-3.5 h-3.5 rounded shrink-0" style={{ accentColor: color }} />
      <span className="text-[12px]" style={{ color: value ? color : '#8b8fa8' }}>{label}</span>
    </label>
  );
}

function ZoneRow({ zone, index, onChange, onRemove }: { zone: WifiZone; index: number; onChange: (f: keyof WifiZone, v: WifiZone[keyof WifiZone]) => void; onRemove: () => void }) {
  const rssiColor = zone.rssi === '' ? '#3a3d52' : Number(zone.rssi) >= -67 ? '#10b981' : Number(zone.rssi) >= -72 ? '#f59e0b' : '#ef4444';
  return (
    <div className="p-3 rounded-[10px] flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>{index + 1}</span>
        <input className="input-field flex-1" value={zone.room} onChange={e => onChange('room', e.target.value)} placeholder="Room / Area name" />
        <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 hover:text-red-400 transition-colors" style={{ color: '#565a72' }}>
          <Trash2 size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <FormField label="RSSI">
          <div className="relative">
            <input type="number" className="input-field" value={zone.rssi === '' ? '' : zone.rssi}
              onChange={e => onChange('rssi', e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="-65" min={-100} max={-20} style={{ paddingRight: '40px', color: zone.rssi !== '' ? rssiColor : undefined }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#565a72' }}>dBm</span>
          </div>
        </FormField>
        <FormField label="Band">
          <SelectInput value={zone.band} onChange={v => onChange('band', v)} options={BAND_OPTIONS} />
        </FormField>
        <FormField label="Speed">
          <div className="relative">
            <input type="number" className="input-field" value={zone.speedMbps === '' ? '' : zone.speedMbps}
              onChange={e => onChange('speedMbps', e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="opt." min={0} style={{ paddingRight: '44px' }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#565a72' }}>Mbps</span>
          </div>
        </FormField>
      </div>
      <div className="flex gap-3">
        {([['roamingIssue', 'Roaming'], ['streamingIssue', 'Streaming'], ['voiceIssue', 'Voice']] as [keyof WifiZone, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={zone[key] as boolean} onChange={e => onChange(key, e.target.checked)} className="w-3 h-3 rounded" style={{ accentColor: '#ef4444' }} />
            <span className="text-[11px]" style={{ color: zone[key] ? '#ef4444' : '#565a72' }}>{label} issue</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SpeedBar({ planDown, actualDown, planUp, actualUp }: { planDown: number; actualDown: number; planUp: number; actualUp: number }) {
  const downPct = Math.min((actualDown / planDown) * 100, 100);
  const upPct = planUp > 0 ? Math.min((actualUp / planUp) * 100, 100) : 0;
  const downColor = downPct >= 80 ? '#10b981' : downPct >= 60 ? '#f59e0b' : '#ef4444';
  const upColor = upPct >= 80 ? '#10b981' : upPct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#565a72' }}>Speed vs Plan</div>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span style={{ color: '#8b8fa8' }}>Download</span>
            <span style={{ color: downColor }}>{actualDown} / {planDown} Mbps ({Math.round(downPct)}%)</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#0f1117' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${downPct}%`, background: downColor }} />
          </div>
        </div>
        {planUp > 0 && (
          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span style={{ color: '#8b8fa8' }}>Upload</span>
              <span style={{ color: upColor }}>{actualUp} / {planUp} Mbps ({Math.round(upPct)}%)</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#0f1117' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${upPct}%`, background: upColor }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneTable({ zones }: { zones: ReturnType<typeof calculateNetworkAudit>['zoneResults'] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[12px] font-semibold text-white">Zone-by-Zone Audit</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Zone', 'RSSI', 'Band', 'Signal', 'Speed', 'Issues'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-widest text-[10px]" style={{ color: '#3a3d52' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map(z => {
              const sc = STATUS_COLORS[z.signalStatus] ?? STATUS_COLORS.neutral;
              return (
                <tr key={z.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#c4c6d4' }}>{z.room}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold" style={{ color: z.rssi !== '' ? sc.text : '#3a3d52' }}>
                    {z.rssi !== '' ? `${z.rssi} dBm` : '—'}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: '#565a72' }}>{z.band}</td>
                  <td className="px-4 py-2.5">
                    {z.signalStatus !== 'neutral' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {z.signalLabel}
                      </span>
                    ) : <span style={{ color: '#3a3d52', fontSize: '10px' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: '#565a72' }}>{z.speedMbps !== '' ? `${z.speedMbps} Mbps` : '—'}</td>
                  <td className="px-4 py-2.5">
                    {z.flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {z.flags.map((f, i) => (
                          <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{f}</span>
                        ))}
                      </div>
                    ) : <span style={{ color: '#3a3d52', fontSize: '10px' }}>—</span>}
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-4" style={{ background: '#161820', border: '1px dashed rgba(255,255,255,0.08)', minHeight: '300px' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'rgba(6,182,212,0.1)' }}>📶</div>
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">Awaiting Audit Data</div>
        <div className="text-[13px] max-w-[300px]" style={{ color: '#565a72' }}>Enter internet speed data and add WiFi zones to begin the network readiness assessment.</div>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
        <Plus size={14} /> Add First Zone
      </button>
    </div>
  );
}
