import { useState, useMemo } from 'react';
import { FormField, NumberInput, SelectInput, SectionHeader } from '../../ui/FormField';
import { MetricCard } from '../../ui/MetricCard';
import { StatusBadge } from '../../ui/StatusBadge';
import { InsightPanel, RecommendationPanel, SummaryPanel } from '../../ui/InsightPanel';
import {
  calculateVisualCalibration,
} from '../../../lib/calculations/visual-calibration';
import type { VisualCalibrationInputs } from '../../../lib/calculations/visual-calibration';

const SCREEN_TYPES = [
  { value: 'fixed-frame', label: 'Fixed Frame' },
  { value: 'ambient-light-rejection', label: 'Ambient Light Rejection (ALR)' },
  { value: 'grey', label: 'Grey Screen' },
  { value: 'perforated', label: 'Perforated / AT' },
  { value: 'roller-blind', label: 'Motorised Roller Blind' },
];

const DEFAULT_INPUTS: VisualCalibrationInputs = {
  screenSize: 120,
  screenGain: 0.8,
  screenType: 'fixed-frame',
  projectorLumens: 5000,
  projectorModel: '',
  throwDistance: 4.5,
  luxReadings: [0, 0, 0, 0, 0],
};

const LUX_LABELS = ['Centre', 'Top Left', 'Top Right', 'Bottom Left', 'Bottom Right'];

export function VisualCalibrationTool() {
  const [inputs, setInputs] = useState<VisualCalibrationInputs>(DEFAULT_INPUTS);

  const result = useMemo(() => calculateVisualCalibration(inputs), [inputs]);

  const hasData = inputs.luxReadings.some((v) => v > 0);

  function setLux(index: number, value: number) {
    const updated = [...inputs.luxReadings] as VisualCalibrationInputs['luxReadings'];
    updated[index] = value;
    setInputs((prev) => ({ ...prev, luxReadings: updated }));
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-[22px] font-semibold text-white">Visual Calibration</h2>
          {hasData && (
            <StatusBadge
              level={result.overallStatus}
              label={result.overallLabel}
              variant="pill"
              size="sm"
            />
          )}
        </div>
        <p className="text-[13px]" style={{ color: '#8b8fa8' }}>
          Measure and validate projector screen performance against SMPTE 196M standards.
          Enter your 5-point lux readings to generate an engineering report.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        {/* ── LEFT: Input panel ── */}
        <div className="flex flex-col gap-4">
          {/* Screen configuration */}
          <div className="card p-5">
            <SectionHeader
              title="Screen Configuration"
              subtitle="Physical screen parameters"
            />
            <div className="flex flex-col gap-4">
              <FormField label="Screen Size" sublabel="diagonal">
                <NumberInput
                  value={inputs.screenSize}
                  onChange={(v) => setInputs((p) => ({ ...p, screenSize: v }))}
                  min={30}
                  max={300}
                  step={1}
                  placeholder="120"
                  unit="inch"
                />
              </FormField>

              <FormField label="Screen Type">
                <SelectInput
                  value={inputs.screenType}
                  onChange={(v) => setInputs((p) => ({ ...p, screenType: v }))}
                  options={SCREEN_TYPES}
                />
              </FormField>

              <FormField label="Screen Gain" sublabel="default 0.8 for matte white">
                <NumberInput
                  value={inputs.screenGain}
                  onChange={(v) => setInputs((p) => ({ ...p, screenGain: v }))}
                  min={0.3}
                  max={3.0}
                  step={0.05}
                  placeholder="0.8"
                />
              </FormField>
            </div>
          </div>

          {/* Projector details */}
          <div className="card p-5">
            <SectionHeader
              title="Projector Details"
              subtitle="Source device parameters"
            />
            <div className="flex flex-col gap-4">
              <FormField label="Projector Model" sublabel="optional">
                <input
                  className="input-field"
                  value={inputs.projectorModel}
                  onChange={(e) => setInputs((p) => ({ ...p, projectorModel: e.target.value }))}
                  placeholder="e.g. Sony VPL-FHZ85"
                />
              </FormField>

              <FormField label="Rated Output">
                <NumberInput
                  value={inputs.projectorLumens}
                  onChange={(v) => setInputs((p) => ({ ...p, projectorLumens: v }))}
                  min={500}
                  max={50000}
                  step={100}
                  placeholder="5000"
                  unit="ANSI lm"
                />
              </FormField>

              <FormField label="Throw Distance">
                <NumberInput
                  value={inputs.throwDistance}
                  onChange={(v) => setInputs((p) => ({ ...p, throwDistance: v }))}
                  min={0.5}
                  max={20}
                  step={0.1}
                  placeholder="4.5"
                  unit="m"
                />
              </FormField>
            </div>
          </div>

          {/* 5-point lux readings */}
          <div className="card p-5">
            <SectionHeader
              title="5-Point Lux Readings"
              subtitle="Measured on-screen with meter at lens position"
            />

            {/* Grid diagram */}
            <div
              className="relative mb-4 rounded-[10px] aspect-video flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="absolute inset-3 grid grid-cols-3 grid-rows-3">
                {/* TL */}
                <div className="flex items-start justify-start">
                  <MeasurePoint label="TL" value={inputs.luxReadings[1]} />
                </div>
                {/* Top center empty */}
                <div />
                {/* TR */}
                <div className="flex items-start justify-end">
                  <MeasurePoint label="TR" value={inputs.luxReadings[2]} />
                </div>
                {/* Mid left empty */}
                <div />
                {/* Centre */}
                <div className="flex items-center justify-center">
                  <MeasurePoint label="CTR" value={inputs.luxReadings[0]} highlight />
                </div>
                {/* Mid right empty */}
                <div />
                {/* BL */}
                <div className="flex items-end justify-start">
                  <MeasurePoint label="BL" value={inputs.luxReadings[3]} />
                </div>
                {/* Bottom center empty */}
                <div />
                {/* BR */}
                <div className="flex items-end justify-end">
                  <MeasurePoint label="BR" value={inputs.luxReadings[4]} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {LUX_LABELS.map((label, i) => (
                <FormField key={i} label={label}>
                  <NumberInput
                    value={inputs.luxReadings[i] || ''}
                    onChange={(v) => setLux(i, v)}
                    min={0}
                    max={5000}
                    step={0.1}
                    placeholder="0.0"
                    unit="lux"
                  />
                </FormField>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results panel ── */}
        <div className="flex flex-col gap-4">
          {!hasData ? (
            <EmptyState />
          ) : (
            <>
              {/* Primary metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <MetricCard
                  label="Avg Lux"
                  value={result.averageLux}
                  unit="lx"
                  status="neutral"
                  sublabel="On-screen measured"
                />
                <MetricCard
                  label="Foot-Lamberts"
                  value={result.footLamberts}
                  unit="fL"
                  status={result.brightnessClassification}
                  sublabel={result.brightnessLabel}
                  large
                />
                <MetricCard
                  label="Uniformity"
                  value={result.uniformityPercent}
                  unit="%"
                  status={result.uniformityClassification}
                  sublabel={result.uniformityLabel}
                />
              </div>

              {/* Reference bar */}
              <FLReferenceBar value={result.footLamberts} />

              {/* Uniformity heatmap */}
              <UniformityMap readings={inputs.luxReadings} avg={result.averageLux} />

              {/* Intelligence panels */}
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

function MeasurePoint({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg"
      style={{
        background: highlight ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
        minWidth: '42px',
      }}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: highlight ? '#6366f1' : '#565a72' }}>
        {label}
      </span>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color: value > 0 ? '#f0f1f3' : '#3a3d52' }}>
        {value > 0 ? value : '—'}
      </span>
    </div>
  );
}

function FLReferenceBar({ value }: { value: number }) {
  const max = 40;
  const clampedPct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#565a72' }}>
        SMPTE 196M Brightness Reference
      </div>
      <div className="relative h-5 rounded-full overflow-hidden" style={{ background: '#0f1117' }}>
        {/* Zone coloring */}
        <div className="absolute inset-0 flex">
          <div className="h-full" style={{ width: `${(8 / 40) * 100}%`, background: '#ef444440' }} />
          <div className="h-full" style={{ width: `${(4 / 40) * 100}%`, background: '#f59e0b30' }} />
          <div className="h-full" style={{ width: `${(2 / 40) * 100}%`, background: '#f59e0b20' }} />
          <div className="h-full" style={{ width: `${(8 / 40) * 100}%`, background: '#10b98130' }} />
          <div className="h-full" style={{ width: `${(6 / 40) * 100}%`, background: '#f59e0b25' }} />
          <div className="flex-1" style={{ background: '#ef444430' }} />
        </div>
        {/* Target range markers */}
        <div className="absolute top-0 bottom-0 border-l border-dashed" style={{ left: `${(14 / 40) * 100}%`, borderColor: '#10b98160' }} />
        <div className="absolute top-0 bottom-0 border-r border-dashed" style={{ left: `${(22 / 40) * 100}%`, borderColor: '#10b98160' }} />
        {/* Value indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full transition-all duration-500"
          style={{
            left: `${clampedPct}%`,
            background: value >= 14 && value <= 22 ? '#10b981' : value >= 12 && value <= 28 ? '#f59e0b' : '#ef4444',
            boxShadow: `0 0 8px ${value >= 14 && value <= 22 ? '#10b981' : '#ef4444'}`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px]" style={{ color: '#3a3d52' }}>0 fL</span>
        <span className="text-[10px] font-medium" style={{ color: '#10b981' }}>14–22 fL target</span>
        <span className="text-[10px]" style={{ color: '#3a3d52' }}>40+ fL</span>
      </div>
    </div>
  );
}

function UniformityMap({
  readings,
  avg,
}: {
  readings: VisualCalibrationInputs['luxReadings'];
  avg: number;
}) {
  if (!readings.some((r) => r > 0)) return null;
  const max = Math.max(...readings.filter((r) => r > 0));

  function cellOpacity(val: number) {
    if (!val || !max) return 0.05;
    return 0.1 + (val / max) * 0.6;
  }

  const positions = [
    { label: 'TL', idx: 1, col: 1, row: 1 },
    { label: 'CTR', idx: 0, col: 2, row: 1 },
    { label: 'TR', idx: 2, col: 3, row: 1 },
    { label: 'BL', idx: 3, col: 1, row: 2 },
    { label: 'BR', idx: 4, col: 3, row: 2 },
  ];

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#565a72' }}>
        Uniformity Heatmap
      </div>
      <div
        className="relative rounded-[10px] aspect-video"
        style={{ background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 p-2">
          {positions.map((pos) => {
            const val = readings[pos.idx];
            const opacity = cellOpacity(val);
            const pct = avg > 0 ? Math.round((val / avg) * 100) : 0;
            return (
              <div
                key={pos.label}
                className="rounded-lg flex flex-col items-center justify-center gap-0.5"
                style={{
                  background: `rgba(99,102,241,${opacity})`,
                  border: '1px solid rgba(99,102,241,0.1)',
                }}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#565a72' }}>
                  {pos.label}
                </span>
                <span className="text-[14px] font-semibold tabular-nums text-white">
                  {val > 0 ? val.toFixed(1) : '—'}
                </span>
                {val > 0 && (
                  <span className="text-[10px] tabular-nums" style={{ color: '#8b8fa8' }}>
                    {pct}%
                  </span>
                )}
              </div>
            );
          })}
          {/* Empty center-bottom cell */}
          <div
            className="rounded-lg"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
          />
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px]" style={{ color: '#3a3d52' }}>Darker = Lower Lux</span>
        <span className="text-[10px]" style={{ color: '#3a3d52' }}>Lighter = Higher Lux</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-4"
      style={{
        background: '#161820',
        border: '1px dashed rgba(255,255,255,0.08)',
        minHeight: '300px',
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(99,102,241,0.1)' }}
      >
        📐
      </div>
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">Awaiting Measurements</div>
        <div className="text-[13px] max-w-[280px]" style={{ color: '#565a72' }}>
          Enter at least one lux reading to begin analysis. Results update in real time.
        </div>
      </div>
    </div>
  );
}
