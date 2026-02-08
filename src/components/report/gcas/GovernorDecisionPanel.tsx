import { Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { GovernorDecision } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GovernorDecisionPanelProps {
  decision: GovernorDecision;
  className?: string;
}

function CallBadge({ call }: { call: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    GO: { label: 'GO', className: 'bg-success/15 text-success border-success/30', icon: CheckCircle2 },
    CAUTION: { label: 'CAUTION', className: 'bg-warning/15 text-warning border-warning/30', icon: AlertTriangle },
    'NO-GO': { label: 'NO-GO', className: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  };
  const c = config[call] ?? config['NO-GO'];
  const Icon = c.icon;

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border text-lg font-bold', c.className)}>
      <Icon className="w-6 h-6" />
      {c.label}
    </div>
  );
}

function ScoreGauge({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 7 ? 'bg-success' : value >= 4 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-foreground">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function GovernorDecisionPanel({ decision, className }: GovernorDecisionPanelProps) {
  const borderColor = decision.call === 'GO'
    ? 'border-success/30'
    : decision.call === 'CAUTION'
    ? 'border-warning/30'
    : 'border-destructive/30';

  return (
    <div className={cn('border-2 rounded-lg p-5 space-y-4', borderColor, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-foreground" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Governor Decision</h3>
        </div>
        <CallBadge call={decision.call} />
      </div>

      {/* Scores */}
      <div className="flex gap-6">
        <ScoreGauge label="Risk Score" value={decision.riskScore} />
        <ScoreGauge label="Confidence Score" value={decision.confidenceScore} />
      </div>

      {/* Reasons */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rationale</p>
        <ul className="space-y-1.5">
          {decision.reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-muted-foreground font-mono text-xs mt-0.5">{i + 1}.</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
