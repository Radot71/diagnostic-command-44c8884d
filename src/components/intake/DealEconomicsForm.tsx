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
import { AlertCircle, Calculator } from 'lucide-react';
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

function parseNumVal(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function DealEconomicsForm({ data, onChange }: DealEconomicsFormProps) {
  // Auto-calc: Total Debt = EV - Equity (if blank)
  const computedDebt = useMemo(() => {
    if (data.totalDebt) return null;
    const ev = parseNumVal(data.enterpriseValue);
    const eq = parseNumVal(data.equityCheck);
    if (ev > 0 && eq > 0) return (ev - eq).toFixed(1);
    return null;
  }, [data.enterpriseValue, data.equityCheck, data.totalDebt]);

  // Auto-calc: Leverage = Debt / EBITDA
  const computedLeverage = useMemo(() => {
    const debt = data.totalDebt ? parseNumVal(data.totalDebt) : (computedDebt ? parseFloat(computedDebt) : 0);
    const ebitda = parseNumVal(data.entryEbitda);
    if (debt > 0 && ebitda > 0) return (debt / ebitda).toFixed(1);
    return null;
  }, [data.totalDebt, data.entryEbitda, computedDebt]);

  // Auto-calc: Non-US = 100 - US
  const computedNonUs = useMemo(() => {
    if (!data.usRevenuePct && data.usRevenuePct !== '0') return null;
    const us = parseNumVal(data.usRevenuePct);
    if (us >= 0 && us <= 100) return (100 - us).toString();
    return null;
  }, [data.usRevenuePct]);

  // Validation
  const marginVal = parseNumVal(data.ebitdaMargin);
  const marginWarning = data.ebitdaMargin && (marginVal < 1 || marginVal > 40);
  const evVal = parseNumVal(data.enterpriseValue);
  const eqVal = parseNumVal(data.equityCheck);
  const debtWarning = evVal > 0 && eqVal > 0 && eqVal > evVal;

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
          These inputs feed directly into the PE Governor engine for segment-level value math, leverage analysis, and GCAS scoring.
        </p>
      </div>

      {/* 1) Transaction Structure */}
      <div className="grid gap-2">
        <Label>Deal Type *</Label>
        <Select
          value={data.dealType}
          onValueChange={(v) => onChange('dealType', v)}
        >
          <SelectTrigger>
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
          />
        )}
      </div>

      {/* 2) Valuation & Capital Stack */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Valuation & Capital Stack</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ev">Enterprise Value ($m) *</Label>
            <Input
              id="ev"
              type="number"
              min="0"
              step="0.1"
              value={data.enterpriseValue}
              onChange={(e) => onChange('enterpriseValue', e.target.value)}
              placeholder="e.g., 500"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="equity">Equity Check ($m) *</Label>
            <Input
              id="equity"
              type="number"
              min="0"
              step="0.1"
              value={data.equityCheck}
              onChange={(e) => onChange('equityCheck', e.target.value)}
              placeholder="e.g., 200"
            />
          </div>
        </div>

        {debtWarning && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            Equity cannot exceed Enterprise Value
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="debt">Total Debt ($m)</Label>
            <Input
              id="debt"
              type="number"
              min="0"
              step="0.1"
              value={data.totalDebt}
              onChange={(e) => onChange('totalDebt', e.target.value)}
              placeholder={computedDebt ? `Auto: ${computedDebt}` : 'Auto-calculated'}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ebitda">Entry EBITDA ($m) *</Label>
            <Input
              id="ebitda"
              type="number"
              min="0"
              step="0.1"
              value={data.entryEbitda}
              onChange={(e) => onChange('entryEbitda', e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="leverage">Entry Leverage (x)</Label>
            <Input
              id="leverage"
              type="text"
              value={data.entryLeverage || (computedLeverage ? `${computedLeverage}x` : '')}
              onChange={(e) => onChange('entryLeverage', e.target.value)}
              placeholder={computedLeverage ? `Auto: ${computedLeverage}x` : 'Auto: Debt ÷ EBITDA'}
              readOnly={!data.entryLeverage && !!computedLeverage}
              className={cn(!data.entryLeverage && computedLeverage && "bg-muted/50")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="margin">EBITDA Margin (%) *</Label>
            <Input
              id="margin"
              type="number"
              min="1"
              max="40"
              step="0.1"
              value={data.ebitdaMargin}
              onChange={(e) => onChange('ebitdaMargin', e.target.value)}
              placeholder="e.g., 20"
            />
            {marginWarning && (
              <p className="text-xs text-warning">Expected range: 1–40%</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          If you leave Total Debt blank, it will be inferred as EV – Equity.
        </p>
      </div>

      {/* 3) Revenue Mix */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Revenue Mix</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="usRev">US Revenue (%) *</Label>
            <Input
              id="usRev"
              type="number"
              min="0"
              max="100"
              value={data.usRevenuePct}
              onChange={(e) => onChange('usRevenuePct', e.target.value)}
              placeholder="e.g., 75"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nonUsRev">Non-US Revenue (%)</Label>
            <Input
              id="nonUsRev"
              type="number"
              value={computedNonUs !== null ? computedNonUs : data.nonUsRevenuePct}
              readOnly
              className="bg-muted/50"
              placeholder="Auto-calculated"
            />
          </div>
        </div>
      </div>

      {/* 4) Export Exposure */}
      <div className="grid gap-1.5">
        <Label htmlFor="export">Export Exposure (% of revenue) *</Label>
        <Input
          id="export"
          type="number"
          min="0"
          max="100"
          value={data.exportExposurePct}
          onChange={(e) => onChange('exportExposurePct', e.target.value)}
          placeholder="e.g., 15"
        />
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
              className="flex items-center gap-3 p-2.5 rounded border border-border hover:bg-muted/30 cursor-pointer transition-colors"
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

  if (!data.dealType) errors.push('Deal Type');
  if (data.dealType === 'other' && !data.dealTypeOther.trim()) errors.push('Deal Type (other description)');

  const ev = parseNumVal(data.enterpriseValue);
  const eq = parseNumVal(data.equityCheck);
  const ebitda = parseNumVal(data.entryEbitda);
  const margin = parseNumVal(data.ebitdaMargin);

  if (ev <= 0) errors.push('Enterprise Value');
  if (eq <= 0) errors.push('Equity Check');
  if (eq > ev && ev > 0) errors.push('Equity cannot exceed EV');
  if (ebitda <= 0) errors.push('Entry EBITDA');
  if (margin < 1 || margin > 40) errors.push('EBITDA Margin (1–40%)');

  if (data.usRevenuePct === '' || parseNumVal(data.usRevenuePct) < 0 || parseNumVal(data.usRevenuePct) > 100) errors.push('US Revenue %');
  if (data.exportExposurePct === '') errors.push('Export Exposure %');
  if (data.macroSensitivities.length === 0) errors.push('Macro Sensitivity (select ≥1)');

  return errors;
}

/** Validation: returns true if all required Deal Economics fields are filled */
export function isDealEconomicsComplete(data: DealEconomics): boolean {
  return getDealEconomicsErrors(data).length === 0;
}
