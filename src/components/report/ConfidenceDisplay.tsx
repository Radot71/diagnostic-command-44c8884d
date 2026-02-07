/**
 * Enhanced Confidence Display
 * 
 * Ties confidence visually to missing data with color coding.
 * Caps confidence at 70% when 6+ critical items are missing.
 * Shows "Confidence reflects data quality, not model certainty."
 */

import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceDisplayProps {
  confidence: number;
  missingDataCount: number;
  evidenceQuality: number;
  className?: string;
}

export function ConfidenceDisplay({
  confidence,
  missingDataCount,
  evidenceQuality,
  className,
}: ConfidenceDisplayProps) {
  // Visual cap: if 6+ critical items missing, display is capped
  const isCriticallyConstrained = missingDataCount >= 6;
  const displayConfidence = isCriticallyConstrained
    ? Math.min(confidence, 70)
    : confidence;

  // Color logic tied to missing data
  const getConfidenceColor = () => {
    if (isCriticallyConstrained) return 'text-warning';
    if (missingDataCount >= 3) return 'text-[hsl(var(--severity-orange))]';
    if (displayConfidence >= 70) return 'text-success';
    if (displayConfidence >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getBgColor = () => {
    if (isCriticallyConstrained) return 'bg-warning/10 border-warning/20';
    if (missingDataCount >= 3) return 'bg-[hsl(var(--severity-orange))]/10 border-[hsl(var(--severity-orange))]/20';
    if (displayConfidence >= 70) return 'bg-success/10 border-success/20';
    if (displayConfidence >= 50) return 'bg-warning/10 border-warning/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  return (
    <div className={cn("p-3 rounded-lg border", getBgColor(), className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">Overall Confidence</span>
        <div className="flex items-center gap-1.5">
          {displayConfidence < 60 && <span className="text-muted-foreground text-sm">~</span>}
          <span className={cn("text-lg font-bold", getConfidenceColor())}>
            {displayConfidence}%
          </span>
          {isCriticallyConstrained && (
            <AlertCircle className="w-4 h-4 text-warning" />
          )}
        </div>
      </div>

      {isCriticallyConstrained && (
        <div className="flex items-start gap-1.5 text-xs text-warning mb-1.5">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Capped at 70% — {missingDataCount} critical inputs missing.
          </span>
        </div>
      )}

      {!isCriticallyConstrained && displayConfidence < 70 && (
        <div className="flex items-start gap-1.5 text-xs text-warning mb-1.5">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Magnitude is directionally material but constrained by missing inputs.</span>
        </div>
      )}

      {displayConfidence >= 70 && !isCriticallyConstrained && (
        <div className="flex items-center gap-1.5 text-xs text-success mb-1.5">
          <Info className="w-3 h-3" />
          <span>Sufficient input data for reliable assessment.</span>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
        <Info className="w-3 h-3 flex-shrink-0" />
        Confidence reflects data quality, not model certainty.
      </p>
    </div>
  );
}
