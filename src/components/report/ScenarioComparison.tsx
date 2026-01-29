import { useState } from 'react';
import { X, GitCompare, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  title: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW';
  situation: string;
  description: string;
  metrics?: {
    cashPosition?: string;
    runway?: string;
    riskLevel?: string;
    urgency?: string;
  };
}

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  selectedIds: string[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

function SeverityIndicator({ severity }: { severity: 'RED' | 'ORANGE' | 'YELLOW' }) {
  const colors = {
    RED: 'bg-[hsl(var(--severity-red))]',
    ORANGE: 'bg-[hsl(var(--severity-orange))]',
    YELLOW: 'bg-[hsl(var(--severity-yellow))]',
  };
  
  return (
    <div className={cn('w-3 h-3 rounded-full', colors[severity])} title={severity} />
  );
}

export function ScenarioComparison({ 
  scenarios, 
  selectedIds, 
  onClose,
  onSelect 
}: ScenarioComparisonProps) {
  const selectedScenarios = scenarios.filter(s => selectedIds.includes(s.id));
  
  if (selectedScenarios.length < 2) {
    return null;
  }

  const comparisonMetrics = [
    { key: 'severity', label: 'Severity Level' },
    { key: 'situation', label: 'Situation' },
    { key: 'cashPosition', label: 'Cash Position' },
    { key: 'runway', label: 'Runway' },
    { key: 'riskLevel', label: 'Risk Level' },
    { key: 'urgency', label: 'Time Pressure' },
  ];

  return (
    <Dialog open={selectedIds.length >= 2} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Scenario Comparison
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide p-3 border-b border-border bg-muted/30 w-40">
                    Metric
                  </th>
                  {selectedScenarios.map(scenario => (
                    <th 
                      key={scenario.id} 
                      className="text-left text-sm font-semibold text-foreground p-3 border-b border-border bg-muted/30 min-w-[200px]"
                    >
                      <div className="flex items-center gap-2">
                        <SeverityIndicator severity={scenario.severity} />
                        {scenario.title}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map(metric => (
                  <tr key={metric.key} className="hover:bg-muted/20">
                    <td className="text-sm font-medium text-muted-foreground p-3 border-b border-border">
                      {metric.label}
                    </td>
                    {selectedScenarios.map(scenario => {
                      let value: string | JSX.Element = '—';
                      
                      if (metric.key === 'severity') {
                        value = (
                          <span className={cn(
                            'severity-badge text-xs',
                            scenario.severity === 'RED' && 'severity-red',
                            scenario.severity === 'ORANGE' && 'severity-orange',
                            scenario.severity === 'YELLOW' && 'severity-yellow',
                          )}>
                            {scenario.severity}
                          </span>
                        );
                      } else if (metric.key === 'situation') {
                        value = scenario.situation;
                      } else if (scenario.metrics) {
                        value = scenario.metrics[metric.key as keyof typeof scenario.metrics] || '—';
                      }
                      
                      return (
                        <td key={scenario.id} className="text-sm text-foreground p-3 border-b border-border">
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Comparing {selectedScenarios.length} scenarios
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close Comparison
              </Button>
              <Button onClick={() => onSelect(selectedScenarios[0].id)}>
                Open Primary Scenario
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Scenario selection checkbox for comparison mode
export function ScenarioSelectBadge({ 
  selected, 
  onToggle,
  disabled 
}: { 
  selected: boolean; 
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      className={cn(
        "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
        selected 
          ? "bg-accent border-accent text-accent-foreground" 
          : "border-border hover:border-accent/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={selected ? "Remove from comparison" : "Add to comparison"}
    >
      {selected && <Check className="w-4 h-4" />}
    </button>
  );
}
