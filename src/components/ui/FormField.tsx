import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  sublabel?: string;
  children: ReactNode;
  required?: boolean;
}

interface NumberInputProps {
  value: number | string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  disabled?: boolean;
}

interface SelectInputProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function FormField({ label, sublabel, children, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label flex items-center gap-1">
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
        {sublabel && (
          <span className="ml-1 normal-case" style={{ color: '#3a3d52', fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '11px' }}>
            — {sublabel}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  placeholder,
  unit,
  disabled = false,
}: NumberInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        className="input-field"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        style={unit ? { paddingRight: `${unit.length * 10 + 24}px` } : undefined}
      />
      {unit && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium pointer-events-none"
          style={{ color: '#565a72' }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

export function SelectInput({ value, onChange, options, disabled = false }: SelectInputProps) {
  return (
    <select
      className="input-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23565a72' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '36px',
        cursor: 'pointer',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: '#8b8fa8' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
