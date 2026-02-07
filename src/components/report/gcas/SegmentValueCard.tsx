import { SegmentBreakdown } from '@/lib/types';

export function SegmentValueCard({ segment }: { segment: SegmentBreakdown }) {
  const rows = [
    { label: 'U.S. Revenue Impact', value: segment.usRevenue },
    { label: 'International Revenue', value: segment.internationalRevenue },
    { label: 'Export Impact', value: segment.exportImpact },
    { label: 'Commodity Cost Impact', value: segment.commodityCost },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((r, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{r.label}</span>
            <p className="text-sm font-medium text-foreground mt-1">{r.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Net EBITDA Range</span>
        <p className="text-lg font-bold text-foreground mt-1">{segment.netEbitdaRange}</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Leverage Impact</span>
        <p className="text-sm font-medium text-foreground mt-1">{segment.leverageImpact}</p>
      </div>
    </div>
  );
}
