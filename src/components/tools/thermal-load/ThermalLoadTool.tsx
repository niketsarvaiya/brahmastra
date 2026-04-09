import { useState, useMemo } from 'react';
import { FormField, NumberInput, SelectInput, SectionHeader } from '../../ui/FormField';
import { MetricCard } from '../../ui/MetricCard';
import { StatusBadge } from '../../ui/StatusBadge';
import { InsightPanel, RecommendationPanel, SummaryPanel } from '../../ui/InsightPanel';
import { calculateThermalLoad } from '../../../lib/calculations/thermal-load';
import type { Equipment, ThermalLoadInputs } from '../../../lib/calculations/thermal-load';
import { Plus, Trash2, Thermometer } from 'lucide-react';

const RACK_TYPES = [
  { value: 'open-frame', label: 'Open Frame Rack' },
  { value: '2-post', label: '2-Post Relay Rack' },
  { value: '4-post-enclosed', label: '4-Post Enclosed Cabinet' },
  { value: 'wall-mount', label: 'Wall Mount Cabinet' },
  { value: 'floor-standing', label: 'Floor Standing Cabinet' },
];

const EQUIPMENT_CATEGORIES = [
  { value: 'amplifier', label: 'Amplifier' },
  { value: 'av-processor', label: 'AV Processor / DSP' },
  { value: 'matrix-switcher', label: 'Matrix Switcher' },
  { value: 'media-player', label: 'Media Player' },
  { value: 'control-processor', label: 'Control Processor' },
  { value: 'network-switch', label: 'Network Switch' },
  { value: 'ups', label: 'UPS / Power Conditioner' },
  { value: 'display-processor', label: 'Display Processor' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_INPUTS: ThermalLoadInputs = {
  equipment: [],
  rackType: '4-post-enclosed',
  roomVolume: 30,
  hasAirConditioning: true,
  acBtuCapacity: 12000,
};

let nextId = 1;

function newEquipment(): Equipment {
  return { id: String(nextId++), name: '', wattage: 0, quantity: 1, category: 'other' };
}

export function ThermalLoadTool() {
  const [inputs, setInputs] = useState<ThermalLoadInputs>(DEFAULT_INPUTS);

  const result = useMemo(() => calculateThermalLoad(inputs), [inputs]);

  const hasData = inputs.equipment.some((e) => e.wattage > 0 && e.name);

  function addEquipment() {
    setInputs((p) => ({ ...p, equipment: [...p.equipment, newEquipment()] }));
  }

  function removeEquipment(id: string) {
    setInputs((p) => ({ ...p, equipment: p.equipment.filter((e) => e.id !== id) }));
  }

  function updateEquipment(id: string, field: keyof Equipment, value: string | number) {
    setInputs((p) => ({
      ...p,
      equipment: p.equipment.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-[22px] font-semibold text-white">Thermal Load Analysis</h2>
          {hasData && (
            <StatusBadge level={result.overallStatus} label={result.overallLabel} variant="pill" size="sm" />
          )}
        </div>
        <p className="text-[13px]" style={{ color: '#8b8fa8' }}>
          Calculate total rack heat dissipation in watts and BTU/hr. Validate cooling system adequacy
          before finalising rack layout and installation.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-4">
          {/* Rack config */}
          <div className="card p-5">
            <SectionHeader title="Rack Configuration" subtitle="Installation environment" />
            <div className="flex flex-col gap-4">
              <FormField label="Rack Type">
                <SelectInput
                  value={inputs.rackType}
                  onChange={(v) => setInputs((p) => ({ ...p, rackType: v }))}
                  options={RACK_TYPES}
                />
              </FormField>
              <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <input
                  type="checkbox"
                  id="hasAC"
                  checked={inputs.hasAirConditioning}
                  onChange={(e) => setInputs((p) => ({ ...p, hasAirConditioning: e.target.checked }))}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#6366f1' }}
                />
                <label htmlFor="hasAC" className="text-[13px] font-medium text-white cursor-pointer select-none">
                  Air conditioning present in rack room
                </label>
              </div>
              {inputs.hasAirConditioning && (
                <FormField label="AC Capacity">
                  <NumberInput
                    value={inputs.acBtuCapacity}
                    onChange={(v) => setInputs((p) => ({ ...p, acBtuCapacity: v }))}
                    min={1000}
                    max={100000}
                    step={500}
                    placeholder="12000"
                    unit="BTU/hr"
                  />
                </FormField>
              )}
            </div>
          </div>

          {/* Equipment list */}
          <div className="card p-5">
            <SectionHeader
              title="Equipment List"
              subtitle="Add all devices installed in the rack"
              action={
                <button
                  onClick={addEquipment}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  <Plus size={13} />
                  Add Device
                </button>
              }
            />

            {inputs.equipment.length === 0 ? (
              <button
                onClick={addEquipment}
                className="w-full py-8 rounded-[10px] flex flex-col items-center gap-2 transition-all hover:opacity-80"
                style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}
              >
                <Plus size={20} style={{ color: '#3a3d52' }} />
                <span className="text-[12px]" style={{ color: '#3a3d52' }}>Click to add your first device</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {inputs.equipment.map((eq, idx) => (
                  <EquipmentRow
                    key={eq.id}
                    equipment={eq}
                    index={idx}
                    onChange={(field, value) => updateEquipment(eq.id, field, value)}
                    onRemove={() => removeEquipment(eq.id)}
                  />
                ))}
                <button
                  onClick={addEquipment}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[12px] font-medium transition-all hover:opacity-80"
                  style={{ border: '1px dashed rgba(255,255,255,0.06)', color: '#565a72' }}
                >
                  <Plus size={12} />
                  Add another device
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-4">
          {!hasData ? (
            <EmptyState onAdd={addEquipment} />
          ) : (
            <>
              {/* Primary metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <MetricCard
                  label="Total Heat Load"
                  value={result.totalWatts.toLocaleString()}
                  unit="W"
                  status={result.classification}
                  sublabel={result.classificationLabel}
                  large
                />
                <MetricCard
                  label="BTU / Hour"
                  value={result.totalBtuHr.toLocaleString()}
                  unit="BTU/hr"
                  status={result.classification}
                  sublabel="Thermal output"
                />
                <MetricCard
                  label="Cooling Status"
                  value={inputs.hasAirConditioning ? `${Math.round(inputs.acBtuCapacity).toLocaleString()}` : 'None'}
                  unit={inputs.hasAirConditioning ? 'BTU/hr' : ''}
                  status={result.acAdequacy}
                  sublabel={result.acAdequacyLabel}
                />
              </div>

              {/* Watts needed + margin visual */}
              {inputs.hasAirConditioning && (
                <ACCapacityBar
                  required={result.totalBtuHr}
                  available={inputs.acBtuCapacity}
                />
              )}

              {/* Equipment breakdown */}
              {result.equipmentBreakdown.length > 0 && (
                <EquipmentBreakdownChart breakdown={result.equipmentBreakdown} total={result.totalWatts} />
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

function EquipmentRow({
  equipment,
  index,
  onChange,
  onRemove,
}: {
  equipment: Equipment;
  index: number;
  onChange: (field: keyof Equipment, value: string | number) => void;
  onRemove: () => void;
}) {
  const totalW = equipment.wattage * equipment.quantity;

  return (
    <div
      className="p-3 rounded-[10px] flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
          {index + 1}
        </span>
        <input
          className="input-field flex-1"
          value={equipment.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Device name (e.g. Crown XTi 4002)"
        />
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:text-red-400"
          style={{ color: '#565a72' }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <FormField label="Category">
          <SelectInput
            value={equipment.category}
            onChange={(v) => onChange('category', v)}
            options={EQUIPMENT_CATEGORIES}
          />
        </FormField>
        <FormField label="Wattage">
          <NumberInput
            value={equipment.wattage || ''}
            onChange={(v) => onChange('wattage', v)}
            min={0}
            max={10000}
            step={10}
            placeholder="0"
            unit="W"
          />
        </FormField>
        <FormField label="Qty">
          <NumberInput
            value={equipment.quantity}
            onChange={(v) => onChange('quantity', Math.max(1, Math.round(v)))}
            min={1}
            max={100}
            step={1}
            placeholder="1"
          />
        </FormField>
      </div>

      {totalW > 0 && (
        <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Thermometer size={11} style={{ color: '#f59e0b' }} />
          <span className="text-[11px]" style={{ color: '#8b8fa8' }}>
            {totalW}W · {Math.round(totalW * 3.412).toLocaleString()} BTU/hr
            {equipment.quantity > 1 && ` (${equipment.quantity}× ${equipment.wattage}W)`}
          </span>
        </div>
      )}
    </div>
  );
}

function ACCapacityBar({ required, available }: { required: number; available: number }) {
  const pct = Math.min((required / available) * 100, 120);
  const isOver = required > available;
  const margin = available - required;
  const marginPct = ((margin / available) * 100).toFixed(0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#565a72' }}>
          Cooling Capacity Utilisation
        </span>
        <span
          className="text-[11px] font-semibold"
          style={{ color: isOver ? '#ef4444' : pct > 77 ? '#f59e0b' : '#10b981' }}
        >
          {Math.round(pct)}% used
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: '#0f1117' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: isOver ? '#ef4444' : pct > 77 ? '#f59e0b' : '#10b981',
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px]" style={{ color: '#565a72' }}>
          Required: {Math.round(required).toLocaleString()} BTU/hr
        </span>
        <span className="text-[10px]" style={{ color: isOver ? '#ef4444' : '#565a72' }}>
          {isOver
            ? `Deficit: ${Math.round(Math.abs(margin)).toLocaleString()} BTU/hr`
            : `Headroom: ${Math.round(margin).toLocaleString()} BTU/hr (${marginPct}%)`}
        </span>
      </div>
    </div>
  );
}

function EquipmentBreakdownChart({
  breakdown,
  total,
}: {
  breakdown: { name: string; watts: number; btu: number; pct: number }[];
  total: number;
}) {
  const colors = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#565a72' }}>
        Heat Load by Device
      </div>
      <div className="flex flex-col gap-2">
        {breakdown.slice(0, 8).map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: colors[i % colors.length] }}
            />
            <div className="text-[12px] truncate flex-1" style={{ color: '#c4c6d4' }}>
              {item.name || `Device ${i + 1}`}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] tabular-nums" style={{ color: '#8b8fa8' }}>
                {item.watts}W
              </span>
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#0f1117' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.pct}%`, background: colors[i % colors.length] }}
                />
              </div>
              <span className="text-[11px] tabular-nums w-8 text-right" style={{ color: '#565a72' }}>
                {Math.round(item.pct)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-3 pt-3 flex justify-between text-[11px] font-semibold"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#8b8fa8' }}
      >
        <span>Total</span>
        <span className="text-white">{total.toLocaleString()}W</span>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="rounded-[14px] p-12 flex flex-col items-center justify-center text-center gap-4"
      style={{ background: '#161820', border: '1px dashed rgba(255,255,255,0.08)', minHeight: '300px' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(245,158,11,0.1)' }}
      >
        🔥
      </div>
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">No Equipment Added</div>
        <div className="text-[13px] max-w-[280px]" style={{ color: '#565a72' }}>
          Add your rack equipment on the left to calculate total heat load and validate cooling requirements.
        </div>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90"
        style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <Plus size={14} />
        Add First Device
      </button>
    </div>
  );
}
