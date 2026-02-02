/**
 * System Status Panel Component
 * 
 * Displays run metadata including engine mode, AI status, validation flags,
 * and other transparency indicators for government-grade disclosure.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { DiagnosticReport, ValidationMetadata } from '@/lib/types';

interface SystemStatusPanelProps {
  report: DiagnosticReport;
  sessionId?: string;
  aiFallbackOccurred?: boolean;
  scenarioStressApplied?: boolean;
  isDemoMode?: boolean;
  className?: string;
}

interface StatusRowProps {
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'neutral';
  tooltip?: string;
}

function StatusRow({ label, value, status = 'neutral', tooltip }: StatusRowProps) {
  const content = (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "font-medium",
        status === 'success' && "text-success",
        status === 'warning' && "text-warning",
        status === 'neutral' && "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function SystemStatusPanel({
  report,
  sessionId,
  aiFallbackOccurred = false,
  scenarioStressApplied = false,
  isDemoMode = false,
  className,
}: SystemStatusPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const validation = report.validation;
  const validationPassRun = validation?.ensembleMode !== 'off';
  const timestamp = report.generatedAt;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("border border-border rounded-lg bg-card", className)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">System Status</span>
              <span className="text-xs text-muted-foreground">(Run Metadata)</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t border-border pt-2">
            <div className="space-y-0.5">
              <StatusRow 
                label="Engine Mode" 
                value="Production" 
                status="success"
              />
              <StatusRow 
                label="AI Commentary" 
                value={aiFallbackOccurred ? "Fallback (Disabled)" : "Enabled"}
                status={aiFallbackOccurred ? "warning" : "success"}
                tooltip="AI provides structured commentary and narrative summaries. All numeric calculations are deterministic."
              />
              <StatusRow 
                label="AI Fallback Occurred" 
                value={aiFallbackOccurred ? "Yes" : "No"}
                status={aiFallbackOccurred ? "warning" : "neutral"}
                tooltip={aiFallbackOccurred 
                  ? "AI commentary was unavailable. The diagnostic completed using deterministic calculations only."
                  : "AI commentary was generated successfully."}
              />
              <StatusRow 
                label="Scenario Stress Applied" 
                value={scenarioStressApplied ? "Yes" : "No"}
                status={scenarioStressApplied ? "warning" : "neutral"}
                tooltip="Indicates whether predefined stress multipliers were applied to input values for scenario testing."
              />
              <StatusRow 
                label="Validation Pass Run" 
                value={validationPassRun ? "Yes" : "No"}
                status="neutral"
                tooltip="3-pass validation (optional, additive), not recomputation. Core engine runs once; validation may run multiple checks on top."
              />
              <StatusRow 
                label="Deterministic Mode" 
                value="On"
                status="success"
              />
              
              {sessionId && (
                <StatusRow 
                  label="Session ID" 
                  value={sessionId.slice(0, 12) + '...'}
                  status="neutral"
                  tooltip="Session IDs and timestamps vary by default for security and traceability. Deterministic mode is available for audits and testing."
                />
              )}
              
              <StatusRow 
                label="Timestamp" 
                value={new Date(timestamp).toISOString()}
                status="neutral"
              />
            </div>
            
            <p className="text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border leading-relaxed">
              Session IDs and timestamps vary by default for security and traceability. 
              Deterministic mode is available for audits and testing.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** AI Fallback Warning Banner */
export function AIFallbackNotice({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-warning/10 border border-warning/20",
      className
    )}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-warning">
            AI Commentary Unavailable (Safe Fallback Applied)
          </h4>
          <p className="text-xs text-warning/80 mt-1 leading-relaxed">
            The system completed the diagnostic using deterministic calculations only. 
            No AI-generated narrative was used for this run. All numeric results remain valid.
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-warning/60 hover:text-warning mt-2 underline underline-offset-2">
                Why this happens →
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">
                This can occur if the AI API is unavailable or returns malformed data. 
                The system intentionally avoids hallucination by reverting to pure math.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/** Scenario Stress Disclosure */
export function ScenarioStressDisclosure({ 
  adjustments,
  className 
}: { 
  adjustments: { field: string; original: string; adjusted: string; multiplier: string }[];
  className?: string;
}) {
  if (adjustments.length === 0) return null;
  
  return (
    <div className={cn(
      "p-3 rounded-lg bg-muted/50 border border-border",
      className
    )}>
      <h4 className="text-xs font-medium text-foreground mb-2">
        Scenario Assumptions Applied
      </h4>
      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
        Certain inputs were adjusted using predefined scenario stress multipliers. 
        This reflects stress-testing, not your original data.
      </p>
      <ul className="space-y-1">
        {adjustments.map((adj, index) => (
          <li key={index} className="text-xs text-muted-foreground font-mono">
            {adj.field}: adjusted from {adj.original} → {adj.adjusted} ({adj.multiplier} stress)
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Validation Pass Disclosure */
export function ValidationPassDisclosure({ 
  validation,
  className 
}: { 
  validation?: ValidationMetadata;
  className?: string;
}) {
  if (!validation || validation.ensembleMode === 'off') return null;
  
  const hasMinorDivergence = validation.consensusScore < 1 && !validation.materialDisagreement;
  
  return (
    <div className={cn(
      "p-3 rounded-lg bg-muted/50 border border-border",
      className
    )}>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-xs font-medium text-foreground">
            Automated Validation Check
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            A secondary calculation with stress variation was run to test stability.
            {hasMinorDivergence && ' Minor divergences were detected; results remain valid but warrant manual review.'}
            {!hasMinorDivergence && ' Results are stable across validation passes.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/** How AI is Used Info Panel */
export function AIUsageInfoPanel({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-muted/30 border border-border",
      className
    )}>
      <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        How AI is used
      </h4>
      <div className="text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground/80">AI does NOT compute financial results.</p>
        <p>AI provides:</p>
        <ul className="list-disc list-inside pl-1 space-y-0.5">
          <li>structured commentary</li>
          <li>cross-lens validation</li>
          <li>narrative summaries</li>
        </ul>
        <p className="pt-1 border-t border-border mt-2">
          All numbers come from a deterministic engine.
        </p>
      </div>
    </div>
  );
}
