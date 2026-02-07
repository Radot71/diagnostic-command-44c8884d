/**
 * Evidence Gate Component
 * 
 * Displays a governance warning when evidence completeness is below threshold.
 * Includes missing document list and governance override checkbox.
 */

import { useState } from 'react';
import { AlertOctagon, FileX, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EvidenceGateProps {
  completeness: number;
  confidence: number;
  missingData: string[];
  className?: string;
}

export function EvidenceGate({
  completeness,
  confidence,
  missingData,
  className,
}: EvidenceGateProps) {
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);

  // Only show when completeness is below 60%
  if (completeness >= 60) return null;

  return (
    <Card className={cn("border-destructive/40 bg-destructive/5", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
          <ShieldAlert className="w-4 h-4" />
          DECISION MADE UNDER PARTIAL DATA — CONFIDENCE CAPPED
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Evidence completeness is {completeness}%, below the 60% governance threshold.
          Recommendations are directionally material but precision is constrained.
        </p>

        {/* Missing documents in red */}
        {missingData.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
              <FileX className="w-3.5 h-3.5" />
              Missing inputs ({missingData.length}):
            </p>
            <ul className="space-y-1">
              {missingData.slice(0, 6).map((item, index) => (
                <li key={index} className="text-xs text-destructive/80 flex items-start gap-2 pl-5">
                  <AlertOctagon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
              {missingData.length > 6 && (
                <li className="text-xs text-destructive/60 pl-5">
                  +{missingData.length - 6} additional items
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Governance override checkbox */}
        <div className="pt-2 border-t border-destructive/20">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox
              checked={overrideAcknowledged}
              onCheckedChange={(checked) => setOverrideAcknowledged(!!checked)}
              className="mt-0.5"
            />
            <Label className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              Proceed with partial data (governance override). I acknowledge that
              confidence is capped and outputs are constrained by missing inputs.
            </Label>
          </label>
        </div>

        {/* Confidence disclaimer */}
        <p className="text-[11px] text-muted-foreground/70 italic">
          Confidence reflects data quality, not model certainty.
        </p>
      </CardContent>
    </Card>
  );
}
