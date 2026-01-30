/**
 * Developer QA Panel
 * 
 * Developer-only panel for viewing validation details.
 * Only visible in development mode or when explicitly enabled.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Bug, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
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
          <span className="text-xs font-medium text-muted-foreground">Dev: Validation QA</span>
          {validation && validation.ensembleMode !== 'off' && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              validation.materialDisagreement 
                ? "bg-warning/20 text-warning" 
                : "bg-success/20 text-success"
            )}>
              {validation.materialDisagreement ? 'Disagreement' : 'Consensus'}
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
          {validation && validation.ensembleMode !== 'off' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/50 p-2 rounded">
                  <div className="text-[10px] text-muted-foreground">Consensus</div>
                  <div className={cn(
                    "text-lg font-bold",
                    validation.consensusScore >= 0.7 ? "text-success" : "text-warning"
                  )}>
                    {Math.round(validation.consensusScore * 100)}%
                  </div>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <div className="text-[10px] text-muted-foreground">Evidence</div>
                  <div className={cn(
                    "text-lg font-bold",
                    validation.evidenceScore >= 0.7 ? "text-success" : "text-warning"
                  )}>
                    {Math.round(validation.evidenceScore * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Mode:</span>
                  <code className="bg-muted px-1 rounded">{validation.ensembleMode}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Field Diffs:</span>
                  <span>{validation.fieldDiffs.length}</span>
                </div>
              </div>
              
              {/* Disagreement Notes */}
              {validation.disagreementNotes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-warning mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Disagreement Notes</span>
                  </div>
                  <ul className="text-[10px] text-muted-foreground space-y-1">
                    {validation.disagreementNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-warning">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Questions */}
              {validation.followUpQuestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-accent mb-1">
                    <HelpCircle className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Follow-up Questions</span>
                  </div>
                  <ul className="text-[10px] text-muted-foreground space-y-1">
                    {validation.followUpQuestions.map((question, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-accent">?</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {!validation.materialDisagreement && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All validation passes reached consensus</span>
                </div>
              )}
            </>
          )}
          
          {(!validation || validation.ensembleMode === 'off') && (
            <p className="text-xs text-muted-foreground italic">
              Ensemble mode is off. Run a new diagnostic with 3pass or 5pass mode enabled to see validation details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
