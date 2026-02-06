/**
 * Governance Header Component
 * 
 * Institutional headline framing for all diagnostic artifacts.
 * Displays severity, confidence, completeness, and AI disclosure.
 */

import { Shield, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GovernanceHeaderProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  completeness: number;
  evidenceQuality: 'low' | 'medium' | 'high';
  companyName?: string;
  className?: string;
}

const severityConfig = {
  critical: { label: 'CRITICAL', color: 'text-destructive', bg: 'bg-destructive/10' },
  high: { label: 'HIGH', color: 'text-warning', bg: 'bg-warning/10' },
  medium: { label: 'MEDIUM', color: 'text-accent', bg: 'bg-accent/10' },
  low: { label: 'LOW', color: 'text-success', bg: 'bg-success/10' },
};

export function GovernanceHeader({
  severity,
  confidence,
  completeness,
  evidenceQuality,
  companyName,
  className,
}: GovernanceHeaderProps) {
  const severityStyle = severityConfig[severity];
  
  // Determine if we need to show ranges (low confidence)
  const showRanges = confidence < 60;
  const confidenceDisplay = showRanges ? `~${confidence}%` : `${confidence}%`;
  
  return (
    <div className={cn("border-b border-border bg-card", className)}>
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
          <Shield className="w-3.5 h-3.5" />
          DIAGNOSTICOS — LIVE GOVERNANCE READOUT
        </div>
        <p className="text-xs text-muted-foreground">
          Deterministic analysis • Auditable evidence • Board-ready outputs
          {companyName && <span className="text-foreground font-medium ml-2">— {companyName}</span>}
        </p>
      </div>
      
      {/* Metrics Bar */}
      <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          {/* Severity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Severity:</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide",
              severityStyle.bg,
              severityStyle.color
            )}>
              {severityStyle.label}
            </span>
          </div>
          
          {/* Confidence */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <span className={cn(
                  "text-sm font-semibold",
                  confidence >= 70 ? "text-success" : confidence >= 50 ? "text-warning" : "text-destructive"
                )}>
                  {confidenceDisplay}
                </span>
                {confidence < 60 && (
                  <AlertCircle className="w-3.5 h-3.5 text-warning" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                {confidence < 60 
                  ? 'Low confidence — values shown as approximations (~). Missing inputs constrain precision.'
                  : confidence < 70
                    ? 'Moderate confidence — directionally material findings. Additional inputs would increase precision.'
                    : 'High confidence — sufficient input data for reliable assessment.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
          
          {/* Completeness */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <span className="text-xs text-muted-foreground">Completeness:</span>
                <span className={cn(
                  "text-sm font-semibold",
                  completeness >= 70 ? "text-success" : completeness >= 50 ? "text-warning" : "text-destructive"
                )}>
                  {completeness}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Data completeness relative to optimal input set. Missing data flagged in Evidence Register.
              </p>
            </TooltipContent>
          </Tooltip>
          
          {/* Evidence Quality */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Evidence:</span>
            <span className={cn(
              "text-xs font-medium uppercase",
              evidenceQuality === 'high' ? "text-success" 
                : evidenceQuality === 'medium' ? "text-accent" 
                : "text-warning"
            )}>
              {evidenceQuality}
            </span>
          </div>
        </div>
        
        {/* AI Disclosure */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5" />
          <span>Numbers computed by deterministic engine; AI used only for narrative synthesis.</span>
        </div>
      </div>
    </div>
  );
}
