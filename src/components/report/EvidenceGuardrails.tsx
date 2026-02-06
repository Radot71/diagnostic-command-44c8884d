/**
 * Evidence Guardrails Component
 * 
 * Displays evidence quality constraints and missing data.
 * Clarifies that higher tiers add governance, not different math.
 */

import { AlertCircle, FileWarning, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EvidenceGuardrailsProps {
  missingData: string[];
  evidenceQuality: 'low' | 'medium' | 'high';
  confidence: number;
  className?: string;
}

export function EvidenceGuardrails({
  missingData,
  evidenceQuality,
  confidence,
  className,
}: EvidenceGuardrailsProps) {
  const topGaps = missingData.slice(0, 3);
  const hasConstraints = missingData.length > 0 || evidenceQuality === 'low' || confidence < 60;
  
  if (!hasConstraints) {
    return null;
  }
  
  return (
    <Card className={cn("border-warning/30 bg-warning/5", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-warning">
          <FileWarning className="w-4 h-4" />
          Evidence Quality & Limits
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Constraint Statement */}
        <p className="text-sm text-muted-foreground">
          This analysis is constrained by missing data.
        </p>
        
        {/* Top Data Gaps */}
        {topGaps.length > 0 && (
          <ul className="space-y-1.5">
            {topGaps.map((gap, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Confidence Warning */}
        {confidence < 60 && (
          <div className="text-xs text-warning bg-warning/10 px-2.5 py-1.5 rounded">
            Confidence below 60% — numeric outputs shown as approximations (~).
          </div>
        )}
        
        {/* Tier Clarification */}
        <div className="pt-2 border-t border-warning/20">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <ArrowRight className="w-3 h-3 flex-shrink-0" />
            <span>
              Higher tiers do not change the math — they add governance, execution detail, and board materials.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
