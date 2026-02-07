import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { CausalImpactRow } from '@/lib/types';
import { cn } from '@/lib/utils';

// ---------- GCAS Score Badge ----------

export type GCASScore = 'HIGH' | 'MEDIUM' | 'LOW';

export function GCASScoreBadge({ score }: { score: GCASScore }) {
  const config: Record<GCASScore, { label: string; className: string }> = {
    HIGH: { label: 'HIGH', className: 'bg-success/15 text-success border-success/30' },
    MEDIUM: { label: 'MEDIUM', className: 'bg-warning/15 text-warning border-warning/30' },
    LOW: { label: 'LOW', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  };
  const c = config[score] ?? config.LOW;
  return (
    <span className={cn('px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider', c.className)}>
      GCAS: {c.label}
    </span>
  );
}

// ---------- Screening Question ----------

export function ScreeningQuestion({ label, value }: { label: string; value: boolean | string | null }) {
  const isPositive = value === true || value === 'help';
  const isNegative = value === false || value === 'hurt';
  const Icon = isPositive ? CheckCircle2 : isNegative ? XCircle : MinusCircle;
  const display = value === null ? 'N/A'
    : typeof value === 'boolean' ? (value ? 'Yes' : 'No')
    : value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1.5 text-sm font-medium',
        isPositive && 'text-success',
        isNegative && 'text-destructive',
        !isPositive && !isNegative && 'text-muted-foreground'
      )}>
        <Icon className="w-4 h-4" />
        {display}
      </span>
    </div>
  );
}

// ---------- Causal Impact Table ----------

export function CausalImpactTable({ rows }: { rows: CausalImpactRow[] }) {
  const dirColor: Record<string, string> = {
    Tailwind: 'text-success',
    Headwind: 'text-destructive',
    Mixed: 'text-warning',
  };
  const marginColor: Record<string, string> = {
    Expanding: 'text-success',
    Compressing: 'text-destructive',
    Stable: 'text-muted-foreground',
  };
  const pressureColor: Record<string, string> = {
    Low: 'text-success',
    Moderate: 'text-warning',
    High: 'text-destructive',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Type</th>
            <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Direction</th>
            <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Margin</th>
            <th className="text-center py-2 pl-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Financing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="py-2 pr-4 font-medium text-foreground">{row.businessType}</td>
              <td className={cn('py-2 px-3 text-center font-medium', dirColor[row.direction])}>{row.direction}</td>
              <td className={cn('py-2 px-3 text-center font-medium', marginColor[row.marginDirection])}>{row.marginDirection}</td>
              <td className={cn('py-2 pl-3 text-center font-medium', pressureColor[row.financingPressure])}>{row.financingPressure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
