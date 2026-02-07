import { CourseCorrection } from '@/lib/types';
import { cn } from '@/lib/utils';

export function CourseCorrectionCard({ item, index }: { item: CourseCorrection; index: number }) {
  const ownerColor: Record<string, string> = {
    CFO: 'bg-primary/10 text-primary',
    CRO: 'bg-accent/10 text-accent-foreground',
    COO: 'bg-warning/10 text-warning',
    CEO: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Action {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded', ownerColor[item.owner] || 'bg-muted text-muted-foreground')}>
            {item.owner}
          </span>
          <span className="text-xs text-muted-foreground">{item.timeline}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{item.what}</p>
      <p className="text-xs text-muted-foreground mb-2">{item.why}</p>

      {/* v2 fields: KPI + Scope */}
      {(item.kpi || item.scope) && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          {item.kpi && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">KPI:</span>
              <span className="text-xs font-medium text-foreground">{item.kpi}</span>
            </div>
          )}
          {item.scope && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scope:</span>
              <span className="text-xs font-medium text-foreground">{item.scope}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
