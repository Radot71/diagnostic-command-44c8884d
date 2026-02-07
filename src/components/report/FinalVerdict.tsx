/**
 * Final Governance Verdict Panel
 * 
 * Displays the end-of-run GO/NO-GO verdict with required conversion steps.
 * Severity-driven, deterministic, no invented numbers.
 */

import { AlertOctagon, CheckCircle2, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinalVerdictProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  completeness: number;
  hasDebt: boolean;
  debtMaturity?: string;
  className?: string;
}

type VerdictPosture = 'NO-GO' | 'CONDITIONAL-GO' | 'GO';

function deriveVerdict(severity: string, confidence: number, completeness: number): VerdictPosture {
  if (severity === 'critical' || severity === 'high') return 'NO-GO';
  if (confidence < 60 || completeness < 50) return 'CONDITIONAL-GO';
  return 'GO';
}

function getConversionSteps(severity: string, hasDebt: boolean): string[] {
  if (severity === 'critical') {
    const steps = [
      '90-day standstill signed',
      'Liquidity injection secured',
    ];
    if (hasDebt) {
      steps.push('Covenant waiver obtained');
    }
    steps.push('Supplier terms normalized');
    return steps;
  }
  if (severity === 'high') {
    const steps = [
      'Cash preservation plan activated',
      'Lender communication initiated',
    ];
    if (hasDebt) {
      steps.push('Covenant compliance confirmed or waiver requested');
    }
    steps.push('Operational cost reduction identified');
    return steps;
  }
  if (severity === 'medium') {
    return [
      'Risk monitoring framework established',
      'Contingency plan documented',
      'Quarterly review cadence set',
    ];
  }
  return ['Continue current trajectory with periodic monitoring'];
}

const verdictConfig = {
  'NO-GO': {
    icon: AlertOctagon,
    color: 'text-destructive',
    bg: 'bg-destructive/5 border-destructive/30',
    indicator: '🔴',
    label: 'NO-GO (Current State)',
  },
  'CONDITIONAL-GO': {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/5 border-warning/30',
    indicator: '🟡',
    label: 'CONDITIONAL-GO',
  },
  'GO': {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/5 border-success/30',
    indicator: '🟢',
    label: 'GO',
  },
};

export function FinalVerdict({
  severity,
  confidence,
  completeness,
  hasDebt,
  debtMaturity,
  className,
}: FinalVerdictProps) {
  const verdict = deriveVerdict(severity, confidence, completeness);
  const config = verdictConfig[verdict];
  const Icon = config.icon;
  const conversionSteps = getConversionSteps(severity, hasDebt);

  return (
    <Card className={cn("border-2", config.bg, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className={cn("w-5 h-5", config.color)} />
          <span className="text-sm font-bold uppercase tracking-wide">Final Verdict</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Verdict Display */}
        <div className={cn("flex items-center gap-3 p-3 rounded-lg", config.bg)}>
          <Icon className={cn("w-6 h-6", config.color)} />
          <span className={cn("text-lg font-bold", config.color)}>
            {config.indicator} {config.label}
          </span>
        </div>

        {/* Conversion Steps (for non-GO verdicts) */}
        {verdict !== 'GO' && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Required to convert to GO:
            </p>
            <ol className="space-y-1.5">
              {conversionSteps.map((step, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-xs font-bold text-muted-foreground min-w-[18px] mt-0.5">
                    {index + 1})
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Confidence note */}
        {confidence < 75 && (
          <p className="text-[11px] text-muted-foreground italic pt-2 border-t border-border">
            Verdict is directional, not precise — constrained by evidence quality ({confidence}% confidence).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
