import { DollarSign, AlertTriangle } from 'lucide-react';
import { ValueLedgerSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ValueLedgerTableProps {
  summary: ValueLedgerSummary;
  className?: string;
}

function LikelihoodBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    Low: 'bg-success/15 text-success border-success/30',
    Medium: 'bg-warning/15 text-warning border-warning/30',
    High: 'bg-destructive/15 text-destructive border-destructive/30',
    UNKNOWN: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider',
      colorMap[value] ?? colorMap.UNKNOWN
    )}>
      {value}
    </span>
  );
}

export function ValueLedgerTable({ summary, className }: ValueLedgerTableProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Scenario Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Item</th>
              <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Base</th>
              <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-warning">Bear</th>
              <th className="text-center py-2 pl-3 text-xs font-bold uppercase tracking-wider text-destructive">Tail</th>
            </tr>
          </thead>
          <tbody>
            {summary.entries.map((entry, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-4 font-medium text-foreground">{entry.item}</td>
                <td className="py-2 px-3 text-center text-muted-foreground">{entry.base}</td>
                <td className="py-2 px-3 text-center text-warning font-medium">{entry.bear}</td>
                <td className="py-2 pl-3 text-center text-destructive font-medium">{entry.tail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Downside at Risk (Equity)</p>
          <p className="text-sm font-bold text-foreground">{summary.downsideAtRisk}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Expected Drawdown Band</p>
          <p className="text-sm font-bold text-foreground">{summary.expectedDrawdownBand}</p>
        </div>
      </div>

      {/* Risk Likelihoods */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Covenant Breach Likelihood</span>
          <LikelihoodBadge value={summary.covenantBreachLikelihood} />
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Refi Risk Likelihood</span>
          <LikelihoodBadge value={summary.refiRiskLikelihood} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Exit Multiple Compression Risk</span>
          <LikelihoodBadge value={summary.exitMultipleCompressionRisk} />
        </div>
      </div>
    </div>
  );
}
