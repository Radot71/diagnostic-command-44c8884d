import { Landmark, TrendingDown, ArrowUpDown, BarChart } from 'lucide-react';
import { FinancingLeverage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FinancingLeveragePanelProps {
  financing: FinancingLeverage;
  className?: string;
}

function PressureBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    Low: 'bg-success/15 text-success border-success/30',
    Medium: 'bg-warning/15 text-warning border-warning/30',
    High: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider',
      colorMap[value] ?? colorMap.Medium
    )}>
      {value}
    </span>
  );
}

export function FinancingLeveragePanel({ financing, className }: FinancingLeveragePanelProps) {
  const items = [
    {
      icon: TrendingDown,
      label: 'Refi Cost Increase',
      value: financing.refiCostIncreaseBps,
    },
    {
      icon: Landmark,
      label: 'Covenant Pressure',
      value: null,
      badge: financing.covenantPressure,
    },
    {
      icon: ArrowUpDown,
      label: 'Leverage Impact',
      value: financing.leverageImpact,
    },
    {
      icon: BarChart,
      label: 'Exit Multiple Impact',
      value: financing.exitMultipleTurnsImpact,
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
            </div>
            {item.badge ? (
              <PressureBadge value={item.badge} />
            ) : (
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
