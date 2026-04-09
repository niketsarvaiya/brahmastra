import { useState, useMemo } from 'react';
import { FormField, NumberInput, SelectInput, SectionHeader } from '../../ui/FormField';
import { MetricCard } from '../../ui/MetricCard';
import { StatusBadge } from '../../ui/StatusBadge';
import { InsightPanel, RecommendationPanel, SummaryPanel } from '../../ui/InsightPanel';
import { calculateAirflow } from '../../../lib/calculations/airflow';
import type { AirflowInputs } from '../../../lib/calculations/airflow';

const AIRFLOW_DIRECTIONS = [
  { value: 'front-to-back', label: 'Front to Back (Recommended)' },
  { value: 'bottom-to-top', label: 'Bottom to Top' },
  { value: 'side-to-side', label: 'Side to Side' },
  { value: 'unmanaged', label: 'Unmanaged / Mixed' },
];

const RACK_TYPES = [
  { value: 'open-frame', label: 'Open Frame Rack' },
  { value: '2-post', label: '2-Post Relay Rack' },
  { value: '4-post-enclosed', label: '4-Post Enclosed Cabinet' },
  { value: 'wall-mount', label: 'Wall Mount Cabinet' },
];

const DEFAULT_INPUTS: AirflowInputs = {
  btuHr: 0,
  fanCount: 2,
  cfmPerFan: 150,
  airflowDirection: 'front-to-back',
  rackType: '4-post-enclosed',
  hasVentilation: true,
  ambientTempC: 23,
};

export function AirflowTool() {
  const [inputs, setInputs] = useState<AirflowInputs>(DEFAULT_INPUTS);

  const result = useMemo(() => calculateAirflow(inputs), [inputs]);

  const hasData = inputs.btuHr > 0 || inputs.fanCount > 0;

  function set<K extends keyof AirflowInputs>(key: K, value: AirflowInputs[K]) {
    setInputs((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-[22px] font-semibold text-white">Airflow Optimisation</h2>
          {hasData && (
            <StatusBadge level={result.overallStatus} label={result.overallLabel} variant="pill" size="sm" />
          )}
        </div>
        <p className="text-[13px]" style={{ color: '#8b8fa8' }}>
          Validate rack cooling against actual heat load. Calculate required vs available CFM,
          estimate internal temperature rise, and optimise airflow strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-4">
          {/* Heat Load Input */}
          <div className="card p-5">
            <SectionHeader
              title="Heat Load"
              subtitle="From thermal load analysis or specification"
            />
            <div className="flex flex-col gap-4">
              <FormField label="Total BTU / Hour" sublabel="from thermal load tool or spec sheet">
                <NumberInput
                  value={inputs.btuHr || ''}
                  onChange={(v) => set('btuHr', v)}
                  min={0}
                  max={200000}
                  step={100}
                  placeholder="e.g. 10240"
                  unit="BTU/hr"
                />
              </FormField>

              {/* Quick convert helper */}
              <div
                className="p-3 rounded-[10px] text-[12px]"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
              >
                <div className="font-semibold mb-1" style={{ color: '#6366f1' }}>Quick Convert</div>
                <div style={{ color: '#8b8fa8' }}>
                  Watts × 3.412 = BTU/hr
                  {inputs.btuHr > 0 && (
                    <span className="block mt-0.5 font-medium" style={{ color: '#c4c6d4' }}>
                      → {Math.round(inputs.btuHr / 3.412)}W equivalent
                    </span>
                  )}
                </div>
              </div>

              <FormField label="Ambient Temperature">
                <NumberInput
                  value={inputs.ambientTempC}
                  onChange={(v) => set('ambientTempC', v)}
                  min={10}
                  max={45}
                  step={1}
                  placeholder="23"
                  unit="°C"
                />
              </FormField>
            </div>
          </div>

          {/* Fan Configuration */}
          <div className="card p-5">
            <SectionHeader title="Fan Configuration" subtitle="Active cooling provision" />
            <div className="flex flex-col gap-4">
              <FormField label="Number of Fans">
                <NumberInput
                  value={inputs.fanCount}
                  onChange={(v) => set('fanCount', Math.max(0, Math.round(v)))}
                  min={0}
                  max={20}
                  step={1}
                  placeholder="2"
                />
              </FormField>

              <FormField label="CFM per Fan" sublabel="from manufacturer spec">
                <NumberInput
                  value={inputs.cfmPerFan}
                  onChange={(v) => set('cfmPerFan', v)}
                  min={0}
                  max={2000}
                  step={10}
                  placeholder="150"
                  unit="CFM"
                />
              </FormField>

              {/* Total CFM display */}
              {inputs.fanCount > 0 && inputs.cfmPerFan > 0 && (
                <div
                  className="p-3 rounded-[10px] flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-[12px]" style={{ color: '#8b8fa8' }}>Total Available CFM</span>
                  <span className="text-[16px] font-semibold text-white tabular-nums">
                    {(inputs.fanCount * inputs.cfmPerFan).toLocaleString()} CFM
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Airflow Strategy */}
          <div className="card p-5">
            <SectionHeader title="Airflow Strategy" subtitle="Physical layout and direction" />
            <div className="flex flex-col gap-4">
              <FormField label="Rack Type">
                <SelectInput
                  value={inputs.rackType}
                  onChange={(v) => set('rackType', v)}
                  options={RACK_TYPES}
                />
              </FormField>

              <FormField label="Airflow Direction">
                <SelectInput
                  value={inputs.airflowDirection}
                  onChange={(v) => set('airflowDirection', v as AirflowInputs['airflowDirection'])}
                  options={AIRFLOW_DIRECTIONS}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-4">
          {!hasData ? (
            <EmptyState />
          ) : (
            <>
              {/* Primary metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                  label="Required CFM"
                  value={result.requiredCFM > 0 ? result.requiredCFM : '—'}
                  unit={result.requiredCFM > 0 ? 'CFM' : ''}
                  status="neutral"
                  sublabel="Calculated minimum"
                />
                <MetricCard
                  label="Available CFM"
                  value={result.availableCFM}
                  unit="CFM"
                  status={result.adequacyStatus}
                  sublabel={result.adequacyLabel}
                  large
                />
                <MetricCard
                  label="Temp Rise ΔT"
                  value={result.estimatedTempRiseC > 0 ? result.estimatedTempRiseC : '—'}
                  unit={result.estimatedTempRiseC > 0 ? '°C' : ''}
                  status={result.estimatedTempRiseC <= 10 ? 'good' : result.estimatedTempRiseC <= 18 ? 'warning' : 'critical'}
                  sublabel="Est. inlet → outlet"
                />
                <MetricCard
                  label="Airflow Direction"
                  value=""
                  status={result.directionStatus}
                  sublabel={result.directionLabel}
                />
              </div>

              {/* CFM coverage visual */}
              {result.requiredCFM > 0 && (
                <CFMCoverageBar
                  required={result.requiredCFM}
                  available={result.availableCFM}
                  ratio={result.cfmRatio}
                />
              )}

              {/* Direction diagram */}
              <AirflowDirectionDiagram
                direction={inputs.airflowDirection}
              />

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

function CFMCoverageBar({ required, available, ratio }: { required: number; available: number; ratio: number }) {
  const surplus = available - required;
  const isDeficit = surplus < 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#565a72' }}>
          CFM Coverage
        </span>
        <span
          className="text-[12px] font-semibold"
          style={{ color: ratio >= 1.3 ? '#10b981' : ratio >= 1.0 ? '#f59e0b' : '#ef4444' }}
        >
          {Math.round(ratio * 100)}% of requirement
        </span>
      </div>

      {/* Stacked bar */}
      <div className="relative h-4 rounded-full overflow-hidden" style={{ background: '#0f1117' }}>
        {/* Required zone */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            width: `${Math.min((required / Math.max(available, required)) * 100, 100)}%`,
            background: isDeficit ? '#ef4444' : '#10b98140',
          }}
        />
        {/* Available fill */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((available / Math.max(available, required * 1.3)) * 100, 100)}%`,
            background: ratio >= 1.3 ? '#10b981' : ratio >= 1.0 ? '#f59e0b' : '#ef4444',
            opacity: 0.8,
          }}
        />
        {/* 130% marker */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${(1 / 1.3) * 100}%`,
            background: 'rgba(255,255,255,0.15)',
          }}
        />
      </div>

      <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: '#565a72' }}>
        <span>0 CFM</span>
        <span style={{ color: '#10b981' }}>Target: {Math.round(required * 1.3)} CFM (+30%)</span>
        <span>Available: {Math.round(available)} CFM</span>
      </div>

      {/* Surplus/deficit callout */}
      <div
        className="mt-3 p-2 rounded-lg text-[11px] font-medium text-center"
        style={{
          background: isDeficit ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          color: isDeficit ? '#ef4444' : '#10b981',
          border: `1px solid ${isDeficit ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
        }}
      >
        {isDeficit
          ? `⚠ Deficit: ${Math.round(Math.abs(surplus))} CFM below requirement`
          : `✓ Surplus: ${Math.round(surplus)} CFM above requirement`}
      </div>
    </div>
  );
}

function AirflowDirectionDiagram({
  direction,
}: {
  direction: AirflowInputs['airflowDirection'];
}) {
  const config = {
    'front-to-back': { label: 'Front → Back', desc: 'Cold air enters front, hot air exhausted at rear. Industry standard.', arrow: '→', color: '#10b981' },
    'bottom-to-top': { label: 'Bottom → Top', desc: 'Thermal convection-assisted. Effective for enclosed cabinets with top exhaust.', arrow: '↑', color: '#10b981' },
    'side-to-side': { label: 'Side → Side', desc: 'Cross-flow cooling. Equipment alignment must match intake/exhaust sides.', arrow: '→', color: '#f59e0b' },
    'unmanaged': { label: 'Unmanaged', desc: 'No defined airflow path. Hot air recirculation likely. Reconfigure before commissioning.', arrow: '↕', color: '#ef4444' },
  };

  const cfg = config[direction];

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#565a72' }}>
        Airflow Direction
      </div>
      <div className="flex items-center gap-4">
        {/* Rack illustration */}
        <div
          className="w-24 h-20 rounded-lg flex items-center justify-center text-[28px] shrink-0 font-mono font-bold"
          style={{
            background: `${cfg.color}10`,
            border: `1px solid ${cfg.color}30`,
            color: cfg.color,
          }}
        >
          {cfg.arrow}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-white mb-1">{cfg.label}</div>
          <div className="text-[12px] leading-relaxed" style={{ color: '#8b8fa8' }}>{cfg.desc}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-4"
      style={{ background: '#161820', border: '1px dashed rgba(255,255,255,0.08)', minHeight: '300px' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(16,185,129,0.1)' }}
      >
        🌬️
      </div>
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">Awaiting Input</div>
        <div className="text-[13px] max-w-[300px]" style={{ color: '#565a72' }}>
          Enter your BTU/hr heat load (from the Thermal Load tool) and fan configuration to analyse airflow adequacy.
        </div>
      </div>
    </div>
  );
}
