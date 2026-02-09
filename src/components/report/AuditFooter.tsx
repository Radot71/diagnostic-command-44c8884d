import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface AuditFooterProps {
  tier: string;
  generatedAt: string;
}

export function AuditFooter({ tier, generatedAt }: AuditFooterProps) {
  return (
    <div className="mt-8 border-t border-border pt-4 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Shield className="w-3.5 h-3.5" />
        Audit Trail
      </div>
      <div className="grid gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-accent shrink-0" />
          <span>Deterministic core computed by system (EV, Debt, Leverage, Multiple, Runway). Not modifiable by AI.</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
          <span>Unknowns flagged as UNKNOWN; GO blocked if ≥2 critical preconditions are UNKNOWN.</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 shrink-0" />
          <span>Tier: <strong className="text-foreground">{tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> — Generated: {new Date(generatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
