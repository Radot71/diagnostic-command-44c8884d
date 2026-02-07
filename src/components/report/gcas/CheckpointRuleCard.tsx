import { CheckpointGate } from '@/lib/types';
import { cn } from '@/lib/utils';

export function CheckpointRuleCard({ gate, className }: { gate: CheckpointGate; className?: string }) {
  return (
    <div className={cn('border-2 border-accent/30 rounded-lg p-5 bg-accent/5', className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-accent-foreground mb-3">
        {gate.timeframe} Decision Gate
      </h3>
      <div className="space-y-3">
        <div className="bg-success/5 rounded-lg p-3 border border-success/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-success">Stay / Reinvest If</span>
          <p className="text-sm font-medium text-foreground mt-1">{gate.stayCondition}</p>
        </div>
        <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Exit / Reposition If</span>
          <p className="text-sm font-medium text-foreground mt-1">{gate.exitCondition}</p>
        </div>
        {gate.metrics.length > 0 && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground">Key Metrics to Track:</span>
            <ul className="mt-1 space-y-1">
              {gate.metrics.map((m, i) => (
                <li key={i} className="text-sm text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
