import { FlaskConical, AlertTriangle, Lightbulb, XCircle } from 'lucide-react';
import { SelfTest } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SelfTestPanelProps {
  selfTest: SelfTest;
  className?: string;
}

export function SelfTestPanel({ selfTest, className }: SelfTestPanelProps) {
  const items = [
    {
      icon: FlaskConical,
      label: 'Most Uncertain Area',
      value: selfTest.mostUncertainArea,
      color: 'text-warning',
    },
    {
      icon: AlertTriangle,
      label: 'Most Fragile Assumption',
      value: selfTest.mostFragileAssumption,
      color: 'text-destructive',
    },
    {
      icon: XCircle,
      label: 'What Triggers NO-GO Tomorrow',
      value: selfTest.noGoTrigger,
      color: 'text-destructive',
    },
    {
      icon: Lightbulb,
      label: 'Single Mitigation That Improves Decision Most',
      value: selfTest.singleMitigation,
      color: 'text-success',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-4 h-4', item.color)} />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
            </div>
            <p className="text-sm text-foreground">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
