import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Calculator, Lock } from 'lucide-react';
import { DealEconomics, DealType, MacroSensitivity, TimeHorizonMonths } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DealEconomicsFormProps {
  data: DealEconomics;
  onChange: (field: keyof DealEconomics, value: string | boolean | MacroSensitivity[] | TimeHorizonMonths) => void;
}

const DEAL_TYPE_OPTIONS: { value: DealType; label: string }[] = [
  { value: 'add-on', label: 'Add-on Acquisition' },
  { value: 'platform-buyout', label: 'Platform Buyout' },
  { value: 'carve-out', label: 'Carve-out' },
  { value: 'recapitalization', label: 'Recapitalization' },
  { value: 'turnaround', label: 'Turnaround' },
  { value: 'growth-investment', label: 'Growth Investment' },
  { value: 'other', label: 'Other' },
];

const MACRO_OPTIONS: { value: MacroSensitivity; label: string }[] = [
  { value: 'weaker-usd', label: 'Weaker USD' },
  { value: 'stronger-usd', label: 'Stronger USD' },
  { value: 'rising-rates', label: 'Rising Rates' },
  { value: 'falling-rates', label: 'Falling Rates' },
  { value: 'pmi-contraction', label: 'PMI Contraction' },
  { value: 'pmi-expansion', label: 'PMI Expansion' },
  { value: 'supply-chain-risk', label: 'Supply Chain Risk' },
  { value: 'commodity-volatility', label: 'Commodity Volatility' },
];

const TIME_HORIZON_OPTIONS: TimeHorizonMonths[] = [18, 24, 36, 48];

function parseNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Enforce strict numeric input — strip non-numeric characters on change */
function sanitizeNumericInput(value: string): string {
  // Allow digits, one decimal point, optional leading minus
  return value.replace(/[^0-9.\-]/g, '');
}

/** Returns border class for a required field that needs attention */
function needsInput(value: string | undefined, valid = true): string {
  if (!value || value.trim() === '') return 'border-destructive/60 bg-destructive/5';
  if (!valid) return 'border-warning/60 bg-warning/5';
  // Check if value is a valid number
  if (!/^-?\d+(\.\d+)?$/.test(value.trim())) return 'border-destructive/60 bg-destructive/5';
  return '';
}

/** Strict numeric input field — no units, no text */
function NumericInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  min,
  max,
  step,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(sanitizeNumericInput(e.target.value))}
      placeholder={placeholder}
      className={className}
      min={min}
      max={max}
      step={step}
    />
  );
}

/** Computed field display — read-only with lock icon */
function ComputedField({
  label,
  value,
  suffix,
  tooltip,
}: {
  label: string;
  value: string | null;
  suffix?: string;
  tooltip?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="flex items-center gap-1.5 text-muted-foreground">
        <Lock className="w-3 h-3" />
        {label}
        <span className="text-xs font-normal">(computed)</span>
      </Label>
      <div className="flex h-10 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground items-center">
        {value !== null ? (
          <span className="font-mono">
            {value}{suffix || ''}
          </span>
        ) : (
          <span className="text-muted-foreground italic">—</span>
        )}
      </div>
      {tooltip && (
        <p className="text-xs text-muted-foreground">{tooltip}</p>
      )}
    </div>
  );
}

export function DealEconomicsForm({ data, onChange }: DealEconomicsFormProps) {
  // === Computed values (display only, never editable) ===

  const computedDebt = useMemo(() => {
    const ev = parseNum(data.enterpriseValue);
    const eq = parseNum(data.equityCheck);
    if (ev > 0 && eq > 0) return (ev - eq).toFixed(1);
    return null;
  }, [data.enterpriseValue, data.equityCheck]);

  const computedLeverage = useMemo(() => {
    const debt = computedDebt ? parseFloat(computedDebt) : 0;
    const ebitda = parseNum(data.entryEbitda);
    if (debt > 0 && ebitda > 0) return (debt / ebitda).toFixed(2);
    return null;
  }, [data.entryEbitda, computedDebt]);

  const computedMultiple = useMemo(() => {
    const ev = parseNum(data.enterpriseValue);
    const ebitda = parseNum(data.entryEbitda);
    if (ev > 0 && ebitda > 0) return (ev / ebitda).toFixed(2);
    return null;
  }, [data.enterpriseValue, data.entryEbitda]);

  const computedNonUs = useMemo(() => {
    const us = parseNum(data.usRevenuePct);
    if (data.usRevenuePct !== '' && us >= 0 && us <= 100) return (100 - us).toFixed(0);
    return null;
  }, [data.usRevenuePct]);

  // Validation
  const marginVal = parseNum(data.ebitdaMargin);
  const marginWarning = data.ebitdaMargin && (marginVal < 1 || marginVal > 40);
  const evVal = parseNum(data.enterpriseValue);
  const eqVal = parseNum(data.equityCheck);
  const debtWarning = evVal > 0 && eqVal > 0 && eqVal > evVal;

  // Format validation
  const isValidNum = (val: string) => !val || /^-?\d+(\.\d+)?$/.test(val.trim());

  const toggleMacro = (macro: MacroSensitivity, checked: boolean) => {
    const current = data.macroSensitivities;
    const next = checked ? [...current, macro] : current.filter(m => m !== macro);
    onChange('macroSensitivities', next);
  };

  return (
    <div className="space-y-6 mt-8 pt-6 border-t border-border">
      <div>
        <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calculator className="w-4 h-4 text-accent" />
          Deal Economics — Required for Deterministic Analysis
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          Enter raw numbers only (no $, M, K suffixes). Computed fields are auto-derived and locked.
        </p>
      </div>

      {/* 1) Transaction Structure */}
      <div className="grid gap-2">
        <Label>Deal Type *</Label>
        <Select
          value={data.dealType}
          onValueChange={(v) => onChange('dealType', v)}
        >
          <SelectTrigger className={cn(needsInput(data.dealType))}>
            <SelectValue placeholder="Select deal type" />
          </SelectTrigger>
          <SelectContent>
            {DEAL_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data.dealType === 'other' && (
          <Input
            value={data.dealTypeOther}
            onChange={(e) => onChange('dealTypeOther', e.target.value)}
            placeholder="Describe the deal type"
            className="mt-1"
            maxLength={200}
          />
        )}
      </div>

      {/* 2) Valuation & Capital Stack */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Valuation & Capital Stack</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ev">Enterprise Value ($M) *</Label>
            <NumericInput
              id="ev"
              value={data.enterpriseValue}
              onChange={(v) => onChange('enterpriseValue', v)}
              placeholder="e.g., 120"
              className={cn(needsInput(data.enterpriseValue))}
            />
            {data.enterpriseValue && !isValidNum(data.enterpriseValue) && (
              <p className="text-xs text-destructive">Must be a number</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="equity">Equity Check ($M) *</Label>
            <NumericInput
              id="equity"
              value={data.equityCheck}
              onChange={(v) => onChange('equityCheck', v)}
              placeholder="e.g., 45"
              className={cn(needsInput(data.equityCheck))}
            />
            {data.equityCheck && !isValidNum(data.equityCheck) && (
              <p className="text-xs text-destructive">Must be a number</p>
            )}
          </div>
        </div>

        {debtWarning && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            Equity cannot exceed Enterprise Value
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Total Debt — COMPUTED, read-only */}
          <ComputedField
            label="Total Debt ($M)"
            value={computedDebt}
            tooltip="EV − Equity"
          />
          <div className="grid gap-1.5">
            <Label htmlFor="ebitda">Entry EBITDA ($M) *</Label>
            <NumericInput
              id="ebitda"
              value={data.entryEbitda}
              onChange={(v) => onChange('entryEbitda', v)}
              placeholder="e.g., 26.7"
              className={cn(needsInput(data.entryEbitda))}
            />
            {data.entryEbitda && !isValidNum(data.entryEbitda) && (
              <p className="text-xs text-destructive">Must be a number</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Entry Leverage — COMPUTED, read-only */}
          <ComputedField
            label="Entry Leverage"
            value={computedLeverage}
            suffix="x"
            tooltip="Debt ÷ EBITDA"
          />
          {/* Entry Multiple — COMPUTED, read-only */}
          <ComputedField
            label="Entry Multiple"
            value={computedMultiple}
            suffix="x"
            tooltip="EV ÷ EBITDA"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="margin">EBITDA Margin (%) *</Label>
          <NumericInput
            id="margin"
            value={data.ebitdaMargin}
            onChange={(v) => onChange('ebitdaMargin', v)}
            placeholder="e.g., 12"
            className={cn(needsInput(data.ebitdaMargin, !marginWarning))}
          />
          {marginWarning && (
            <p className="text-xs text-warning">Expected range: 1–40%</p>
          )}
          {data.ebitdaMargin && !isValidNum(data.ebitdaMargin) && (
            <p className="text-xs text-destructive">Must be a number</p>
          )}
        </div>
      </div>

      {/* 3) Revenue Mix */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Revenue Mix</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="usRev">US Revenue (%) *</Label>
            <NumericInput
              id="usRev"
              value={data.usRevenuePct}
              onChange={(v) => onChange('usRevenuePct', v)}
              placeholder="e.g., 75"
              className={cn(needsInput(data.usRevenuePct))}
            />
            {data.usRevenuePct && !isValidNum(data.usRevenuePct) && (
              <p className="text-xs text-destructive">Must be a number (0–100)</p>
            )}
          </div>
          {/* Non-US Revenue — COMPUTED, read-only */}
          <ComputedField
            label="Non-US Revenue (%)"
            value={computedNonUs}
            tooltip="100 − US Revenue %"
          />
        </div>
      </div>

      {/* 4) Export Exposure */}
      <div className="grid gap-1.5">
        <Label htmlFor="export">Export Exposure (% of revenue) *</Label>
        <NumericInput
          id="export"
          value={data.exportExposurePct}
          onChange={(v) => onChange('exportExposurePct', v)}
          placeholder="e.g., 20"
          className={cn(needsInput(data.exportExposurePct))}
        />
        {data.exportExposurePct && !isValidNum(data.exportExposurePct) && (
          <p className="text-xs text-destructive">Must be a number (0–100)</p>
        )}
      </div>

      {/* 5) Macro Sensitivity */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Macro Sensitivity * <span className="font-normal">(select at least 1)</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {MACRO_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded border hover:bg-muted/30 cursor-pointer transition-colors",
                data.macroSensitivities.length === 0 ? "border-destructive/60 bg-destructive/5" : "border-border"
              )}
            >
              <Checkbox
                checked={data.macroSensitivities.includes(opt.value)}
                onCheckedChange={(checked) => toggleMacro(opt.value, !!checked)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        {data.macroSensitivities.length === 0 && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Select at least one macro sensitivity
          </p>
        )}
      </div>

      {/* 6) Time Horizon */}
      <div className="grid gap-2">
        <Label>Time Horizon *</Label>
        <Select
          value={String(data.timeHorizonMonths)}
          onValueChange={(v) => onChange('timeHorizonMonths', parseInt(v) as TimeHorizonMonths)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_HORIZON_OPTIONS.map(m => (
              <SelectItem key={m} value={String(m)}>{m} months</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Returns a list of missing/invalid field names. Empty = complete. */
export function getDealEconomicsErrors(data: DealEconomics): string[] {
  const errors: string[] = [];
  const isValidNum = (val: string) => /^-?\d+(\.\d+)?$/.test(val.trim());

  if (!data.dealType) errors.push('Deal Type');
  if (data.dealType === 'other' && !data.dealTypeOther.trim()) errors.push('Deal Type (other description)');

  const ev = parseNum(data.enterpriseValue);
  const eq = parseNum(data.equityCheck);
  const ebitda = parseNum(data.entryEbitda);
  const margin = parseNum(data.ebitdaMargin);

  if (!data.enterpriseValue || !isValidNum(data.enterpriseValue) || ev <= 0) errors.push('Enterprise Value');
  if (!data.equityCheck || !isValidNum(data.equityCheck) || eq <= 0) errors.push('Equity Check');
  if (eq > ev && ev > 0) errors.push('Equity cannot exceed EV');
  if (!data.entryEbitda || !isValidNum(data.entryEbitda) || ebitda <= 0) errors.push('Entry EBITDA');
  if (!data.ebitdaMargin || !isValidNum(data.ebitdaMargin) || margin < 1 || margin > 40) errors.push('EBITDA Margin (1–40%)');

  if (data.usRevenuePct === '' || !isValidNum(data.usRevenuePct) || parseNum(data.usRevenuePct) < 0 || parseNum(data.usRevenuePct) > 100) errors.push('US Revenue %');
  if (data.exportExposurePct === '' || !isValidNum(data.exportExposurePct)) errors.push('Export Exposure %');
  if (data.macroSensitivities.length === 0) errors.push('Macro Sensitivity (select ≥1)');

  return errors;
}

/** Validation: returns true if all required Deal Economics fields are filled */
export function isDealEconomicsComplete(data: DealEconomics): boolean {
  return getDealEconomicsErrors(data).length === 0;
}
