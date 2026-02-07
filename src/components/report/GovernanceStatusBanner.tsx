/**
 * Governance Status Banner
 * 
 * Persistent GO/NO-GO governance banner that appears at the top of all diagnostic views.
 * Dynamically updates based on severity and displays path-to-GO requirements for NO-GO states.
 */

import { Shield, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GovernanceStatusBannerProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  completeness: number;
  confidence: number;
  className?: string;
}

type GovernancePosture = 'GO' | 'NO-GO' | 'CONDITIONAL';

function derivePosture(severity: string, completeness: number, confidence: number): GovernancePosture {
  if (severity === 'critical' || severity === 'high') return 'NO-GO';
  if (completeness < 60 || confidence < 50) return 'CONDITIONAL';
  return 'GO';
}

const PATH_TO_GO_REQUIREMENTS = [
  'Standstill agreement',
  'Liquidity injection',
  'Covenant waiver',
  'Supplier stabilization',
];

const postureConfig = {
  'GO': {
    label: 'GO',
    bg: 'bg-success/10 border-success/30',
    textColor: 'text-success',
    icon: CheckCircle2,
  },
  'NO-GO': {
    label: 'NO-GO',
    bg: 'bg-destructive/10 border-destructive/40',
    textColor: 'text-destructive',
    icon: AlertOctagon,
  },
  'CONDITIONAL': {
    label: 'CONDITIONAL',
    bg: 'bg-warning/10 border-warning/30',
    textColor: 'text-warning',
    icon: Shield,
  },
};

export function GovernanceStatusBanner({
  severity,
  completeness,
  confidence,
  className,
}: GovernanceStatusBannerProps) {
  const posture = derivePosture(severity, completeness, confidence);
  const config = postureConfig[posture];
  const Icon = config.icon;

  return (
    <div className={cn(
      "border-b px-6 py-3",
      config.bg,
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5 flex-shrink-0", config.textColor)} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Governance Status:
              </span>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                severity === 'critical' ? 'text-destructive' :
                severity === 'high' ? 'text-warning' :
                severity === 'medium' ? 'text-accent' :
                'text-success'
              )}>
                {severity}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className={cn("text-sm font-bold", config.textColor)}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {posture === 'NO-GO' && (
        <div className="mt-2 ml-8">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Path to GO requires:
          </p>
          <ul className="space-y-0.5">
            {PATH_TO_GO_REQUIREMENTS.map((req, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 flex-shrink-0 text-destructive/60" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {posture === 'CONDITIONAL' && (
        <div className="mt-2 ml-8">
          <p className="text-xs text-muted-foreground">
            Evidence completeness or confidence below threshold. Provide additional data to achieve GO status.
          </p>
        </div>
      )}
    </div>
  );
}
