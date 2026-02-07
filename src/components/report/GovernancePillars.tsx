/**
 * Governance Pillars
 * 
 * Displays the three institutional pillars: Deterministic, Auditable, CFO-grade.
 * Used on the diagnostic intake page beneath the tier selector.
 */

import { Calculator, FileSearch, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GovernancePillarsProps {
  className?: string;
}

const pillars = [
  {
    icon: Calculator,
    label: 'Deterministic',
    description: 'Reproducible numeric outputs with zero model variance.',
  },
  {
    icon: FileSearch,
    label: 'Auditable',
    description: 'Every conclusion traced to an evidence source.',
  },
  {
    icon: Briefcase,
    label: 'CFO-grade',
    description: 'Board-ready framing with institutional vocabulary.',
  },
];

export function GovernancePillars({ className }: GovernancePillarsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground text-center">
        All tiers use the same diagnostic rigor. Higher tiers surface more decision artifacts — not more computation.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.label}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/30 border border-border"
          >
            <pillar.icon className="w-5 h-5 text-accent mb-2" />
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">
              {pillar.label}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 leading-tight">
              {pillar.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
