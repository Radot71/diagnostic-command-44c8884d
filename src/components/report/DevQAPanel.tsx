/**
 * Developer QA Panel
 * 
 * Developer-only panel for viewing ensemble validation details.
 * Only visible in development mode or when explicitly enabled.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Bug, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEnsembleConfig, isEnsembleActive, setEnsembleConfig, EnsembleMode } from '@/lib/ensembleConfig';
import type { DiagnosticReport } from '@/lib/types';

interface DevQAPanelProps {
  report: DiagnosticReport;
  className?: string;
}

export function DevQAPanel({ report, className }: DevQAPanelProps) {
  const config = getEnsembleConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localMode, setLocalMode] = useState<EnsembleMode>(config.mode);
  
  // Only show in dev mode
  if (!config.enableDevPanel) return null;
  
  const validation = report.validation;
  
  const handleModeChange = (mode: EnsembleMode) => {
    setLocalMode(mode);
    setEnsembleConfig({ mode });
    console.log(`[DiagnosticOS:Dev] Ensemble mode changed to: ${mode}`);
  };
  
  return (
    <div className={cn(
      "border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20",
      className
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Dev: Ensemble QA</span>
          {validation && validation.ensemble_mode !== 'off' && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              validation.material_disagreement 
                ? "bg-warning/20 text-warning" 
                : "bg-success/20 text-success"
            )}>
              {validation.material_disagreement ? 'Disagreement' : 'Consensus'}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4">
          {/* Mode Selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
              Ensemble Mode (Kill Switch)
            </label>
            <div className="flex gap-1">
              {(['off', '3pass', '5pass'] as EnsembleMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    localMode === mode 
                      ? "bg-accent text-accent-foreground" 
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Changes apply to next diagnostic run
            </p>
          </div>
          
          {/* Validation Details */}
          {validation && validation.ensemble_mode !== 'off' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/50 p-2 rounded">
                  <div className="text-[10px] text-muted-foreground">Consensus</div>
                  <div className={cn(
                    "text-lg font-bold",
                    validation.consensus_score >= 0.7 ? "text-success" : "text-warning"
                  )}>
                    {(validation.consensus_score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <div className="text-[10px] text-muted-foreground">Evidence</div>
                  <div className={cn(
                    "text-lg font-bold",
                    validation.evidence_score >= 0.7 ? "text-success" : "text-warning"
                  )}>
                    {(validation.evidence_score * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Mode:</span>
                  <code className="bg-muted px-1 rounded">{validation.ensemble_mode}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Passes:</span>
                  <span>{validation.passes_completed}/{validation.pass_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Execution:</span>
                  <span>{validation.execution_time_total_ms}ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Fallback:</span>
                  <span>{validation.fallback_used ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              {/* Disagreement Notes */}
              {validation.disagreement_notes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-warning mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Disagreement Notes</span>
                  </div>
                  <ul className="text-[10px] text-muted-foreground space-y-1">
                    {validation.disagreement_notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-warning">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {!validation.material_disagreement && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All passes reached consensus</span>
                </div>
              )}
            </>
          )}
          
          {(!validation || validation.ensemble_mode === 'off') && (
            <p className="text-xs text-muted-foreground italic">
              Ensemble mode is off. Run a new diagnostic with 3pass or 5pass mode enabled to see validation details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
