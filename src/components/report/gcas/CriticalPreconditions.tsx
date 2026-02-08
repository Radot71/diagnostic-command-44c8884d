import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { CriticalPrecondition } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CriticalPreconditionsProps {
  preconditions: CriticalPrecondition[];
  className?: string;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'PASS':
      return <ShieldCheck className="w-5 h-5 text-success" />;
    case 'FAIL':
      return <ShieldAlert className="w-5 h-5 text-destructive" />;
    default:
      return <ShieldQuestion className="w-5 h-5 text-warning" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PASS: 'bg-success/15 text-success border-success/30',
    FAIL: 'bg-destructive/15 text-destructive border-destructive/30',
    UNKNOWN: 'bg-warning/15 text-warning border-warning/30',
  };
  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider',
      colorMap[status] ?? colorMap.UNKNOWN
    )}>
      {status}
    </span>
  );
}

export function CriticalPreconditions({ preconditions, className }: CriticalPreconditionsProps) {
  const unknownCount = preconditions.filter(p => p.status === 'UNKNOWN').length;
  const failCount = preconditions.filter(p => p.status === 'FAIL').length;
  const hasGoBlocker = unknownCount >= 2;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Warning banner if GO is blocked */}
      {hasGoBlocker && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive font-medium">
            {unknownCount} critical preconditions are UNKNOWN — Governor Decision cannot be GO.
          </p>
        </div>
      )}

      {/* Preconditions table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-8"></th>
              <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Precondition</th>
              <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-left py-2 pl-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Why It Matters</th>
            </tr>
          </thead>
          <tbody>
            {preconditions.map((p, i) => (
              <tr key={i} className={cn(
                'border-b border-border/50 last:border-0',
                p.status === 'FAIL' && 'bg-destructive/5',
                p.status === 'UNKNOWN' && 'bg-warning/5'
              )}>
                <td className="py-3 pr-2"><StatusIcon status={p.status} /></td>
                <td className="py-3 pr-4 font-medium text-foreground">{p.name}</td>
                <td className="py-3 px-3 text-center"><StatusBadge status={p.status} /></td>
                <td className="py-3 pl-3 text-muted-foreground text-xs">{p.whyItMatters}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-success" />
          {preconditions.filter(p => p.status === 'PASS').length} PASS
        </span>
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-destructive" />
          {failCount} FAIL
        </span>
        <span className="flex items-center gap-1">
          <ShieldQuestion className="w-3 h-3 text-warning" />
          {unknownCount} UNKNOWN
        </span>
      </div>
    </div>
  );
}
