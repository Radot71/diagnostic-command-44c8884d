import { Check, FileText, Briefcase, BookOpen, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiagnosticTier, TIER_CONFIGURATIONS } from '@/lib/types';
import { motion } from 'framer-motion';

interface TierSelectionProps {
  selectedTier: DiagnosticTier;
  onSelectTier: (tier: DiagnosticTier) => void;
}

const tierIcons: Record<DiagnosticTier, React.ElementType> = {
  prospect: FileText,
  executive: Briefcase,
  full: BookOpen,
};

export function TierSelection({ selectedTier, onSelectTier }: TierSelectionProps) {
  const tiers = Object.values(TIER_CONFIGURATIONS);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Select Diagnostic Tier</h3>
        <p className="text-sm text-muted-foreground">
          Choose the analysis depth appropriate for this engagement. The diagnostic engine evaluates a complete analytical model in all cases. Tier selection determines the scope of analysis surfaced in deliverables.
        </p>
      </div>

      <div className="grid gap-4">
        {tiers.map((tier, index) => {
          const isSelected = selectedTier === tier.id;
          const Icon = tierIcons[tier.id];

          return (
            <motion.button
              key={tier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => onSelectTier(tier.id)}
              className={cn(
                "relative flex items-start gap-4 p-5 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
              )}
            >
              {/* Selection indicator */}
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                isSelected
                  ? "border-accent bg-accent"
                  : "border-muted-foreground/40"
              )}>
                {isSelected && <Check className="w-3 h-3 text-accent-foreground" />}
              </div>

              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                isSelected ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-foreground">{tier.name}</span>
                  <span className="text-sm font-medium text-accent">{tier.price}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {tier.pageCount}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {tier.description}
                </p>

                {/* Included sections */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground uppercase tracking-wide">Included:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tier.includedSections.slice(0, 4).map((section) => (
                      <span
                        key={section}
                        className="text-xs px-2 py-1 rounded bg-success/10 text-success border border-success/20"
                      >
                        {section}
                      </span>
                    ))}
                    {tier.includedSections.length > 4 && (
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        +{tier.includedSections.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Excluded sections */}
                {tier.excludedSections.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Not included at this tier (evaluated but not fully surfaced):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.excludedSections.slice(0, 3).map((section) => (
                        <span
                          key={section}
                          className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          {section}
                        </span>
                      ))}
                      {tier.excludedSections.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                          +{tier.excludedSections.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Institutional note */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> All tiers apply the same diagnostic methodology and computational rigor. Tier selection determines the scope of analysis surfaced in reports, not the completeness of the underlying assessment.
        </p>
      </div>

      {/* Tier-specific guidance */}
      {selectedTier === 'prospect' && (
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">If you do only one thing this week, start here.</span>{' '}
            This snapshot surfaces the highest-leverage findings for initial review. Additional analysis exists but is not fully surfaced at this depth.
          </p>
        </div>
      )}
      
      {selectedTier === 'executive' && (
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-sm text-muted-foreground">
            This artifact is structured for executive and board-level discussion, focusing on trade-offs, time pressure, and decision sequencing.
            The kill list highlights actions that appear attractive but increase risk or reduce optionality.
          </p>
        </div>
      )}
      
      {selectedTier === 'full' && (
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-sm text-muted-foreground">
            This diagnostic includes full scenario analysis, sensitivity ranges, assumptions, and evidence lineage suitable for investment committee or diligence review.
            No additional computation is required to support the conclusions shown.
          </p>
        </div>
      )}
    </div>
  );
}

/** Compact tier badge for display in headers/summaries */
export function TierBadge({ tier }: { tier: DiagnosticTier }) {
  const config = TIER_CONFIGURATIONS[tier];
  const Icon = tierIcons[tier];

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
      <Icon className="w-4 h-4 text-accent" />
      <span className="text-sm font-medium text-accent">{config.name}</span>
      <span className="text-xs text-muted-foreground">({config.price})</span>
    </div>
  );
}
