import { Lock, Check, AlertCircle } from 'lucide-react';
import { DiagnosticTier, TIER_CONFIGURATIONS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TierEntitlementsProps {
  currentTier: DiagnosticTier;
  className?: string;
}

/** Displays what is included/excluded at the current tier */
export function TierEntitlements({ currentTier, className }: TierEntitlementsProps) {
  const config = TIER_CONFIGURATIONS[currentTier];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Analysis Scope</span>
        <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
          {config.name}
        </span>
      </div>

      {/* Included */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Surfaced in this tier
        </p>
        <div className="grid gap-1">
          {config.includedSections.map((section) => (
            <div
              key={section}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span>{section}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Excluded */}
      {config.excludedSections.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Evaluated but not surfaced at this tier
          </p>
          <div className="grid gap-1">
            {config.excludedSections.map((section) => (
              <div
                key={section}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>{section}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline message for unavailable exports */
export function ExportNotIncludedMessage({ 
  exportType, 
  currentTier,
  className 
}: { 
  exportType: string; 
  currentTier: DiagnosticTier;
  className?: string;
}) {
  const config = TIER_CONFIGURATIONS[currentTier];
  const nextTier = currentTier === 'prospect' ? 'executive' : 'full';
  const nextTierConfig = TIER_CONFIGURATIONS[nextTier];

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border",
      className
    )}>
      <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">
          {exportType} not surfaced at {config.name} tier
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This deliverable is available at the {nextTierConfig.name} ({nextTierConfig.price}) tier.
          The selected report reflects the analytical scope surfaced at the chosen diagnostic tier. Additional analysis has been evaluated but is not included in this deliverable.
        </p>
      </div>
    </div>
  );
}

/** Summary card showing tier entitlements at a glance */
export function TierSummaryCard({ tier }: { tier: DiagnosticTier }) {
  const config = TIER_CONFIGURATIONS[tier];

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-foreground">{config.name}</h4>
          <p className="text-xs text-muted-foreground">{config.pageCount}</p>
        </div>
        <span className="text-lg font-semibold text-accent">{config.price}</span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check className="w-3 h-3 text-success" />
          {config.includedSections.length} sections
        </span>
        <span className="flex items-center gap-1">
          {config.includedExports.length} export formats
        </span>
      </div>
    </div>
  );
}
