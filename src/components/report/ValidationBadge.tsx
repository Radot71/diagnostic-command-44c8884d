/**
 * Validation Badge Component
 * 
 * Minimal UI indicator for validation status.
 * Only shows when ensemble mode is active.
 */

import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getValidationBadge } from '@/lib/validationRunner';
import type { DiagnosticReport } from '@/lib/types';

interface ValidationBadgeProps {
  report: DiagnosticReport;
  className?: string;
}

export function ValidationBadge({ report, className }: ValidationBadgeProps) {
  const badge = getValidationBadge(report.validation);
  
  if (!badge.show) return null;
  
  const Icon = badge.variant === 'success' ? ShieldCheck : 
               badge.variant === 'warning' ? ShieldAlert : Shield;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
            badge.variant === 'success' && "bg-success/10 text-success border border-success/20",
            badge.variant === 'warning' && "bg-warning/10 text-warning border border-warning/20",
            badge.variant === 'default' && "bg-muted text-muted-foreground border border-border",
            className
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{badge.tooltip}</p>
        {report.validation && report.validation.ensembleMode !== 'off' && (
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>Mode: {report.validation.ensembleMode}</p>
            <p>Consensus: {Math.round(report.validation.consensusScore * 100)}%</p>
            <p>Evidence: {Math.round(report.validation.evidenceScore * 100)}%</p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
