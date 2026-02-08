import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntakeConflict } from '@/lib/preComputeValidation';
import { cn } from '@/lib/utils';

interface PreComputeGateProps {
  conflicts: IntakeConflict[];
  onFixInputs: () => void;
  onConfirmWarnings: () => void;
  hasWarningsOnly: boolean;
}

export function PreComputeGate({
  conflicts,
  onFixInputs,
  onConfirmWarnings,
  hasWarningsOnly,
}: PreComputeGateProps) {
  const errors = conflicts.filter(c => c.severity === 'error');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Pre-Compute Validation</h3>
        <p className="text-sm text-muted-foreground">
          The system detected issues that must be resolved before running the diagnostic.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Blocking Errors ({errors.length})
          </h4>
          <div className="space-y-1.5">
            {errors.map((conflict, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded border border-destructive/30 bg-destructive/5 text-sm"
              >
                <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{conflict.field}:</span>{' '}
                  <span className="text-muted-foreground">{conflict.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnings ({warnings.length})
          </h4>
          <div className="space-y-1.5">
            {warnings.map((conflict, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded border border-warning/30 bg-warning/5 text-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{conflict.field}:</span>{' '}
                  <span className="text-muted-foreground">{conflict.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onFixInputs}>
          ← Fix Inputs
        </Button>
        {hasWarningsOnly && (
          <Button onClick={onConfirmWarnings}>
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Acknowledge & Proceed
          </Button>
        )}
      </div>
    </div>
  );
}
