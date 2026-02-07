import { AlertTriangle, TrendingDown, Zap, Calendar, DollarSign, ArrowUpRight, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { WizardData, DiagnosticReport } from '@/lib/types';
import { cn } from '@/lib/utils';
import { parseCurrency, formatCurrency, calcRunwayMonths } from '@/lib/currencyUtils';
import { EvidenceGuardrails } from './EvidenceGuardrails';

interface ExecutiveCardProps {
  report: DiagnosticReport;
  wizardData: WizardData;
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Tier 1 — Prospect Snapshot: Initial Governance Signal
 * 1-page executive triage on top of DecisionPacket
 */
export function ExecutiveCard({ report, wizardData, onUpgrade, className }: ExecutiveCardProps) {
  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );
  
  // Derive stage from urgency
  const stage = wizardData.situation?.urgency === 'critical' ? 'Crisis' 
    : wizardData.situation?.urgency === 'high' ? 'Degraded' 
    : 'Stable';
  
  // Calculate days to critical (from runway)
  const burnRaw = parseCurrency(wizardData.runwayInputs.monthlyBurn);
  const runwayMonths = calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn);
  const daysToCritical = Math.round(runwayMonths * 30);
  const annualizedBurn = burnRaw * 12;
  
  // Low confidence indicator
  const lowConfidence = confidenceScore < 60;
  const formatValue = (value: string | number) => lowConfidence ? `~${value}` : `${value}`;
  
  // Extract key risks from signals
  const topRisks = wizardData.signalChecklist.signals.slice(0, 3);
  
  // Extract urgent actions from execution plan (first 5 bullets)
  const urgentActions = report.sections.executionPlan
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .slice(0, 5)
    .map(line => line.replace(/^[-•]\s*/, '').trim());
  
  // Evidence quality assessment
  const evidenceQuality: 'low' | 'medium' | 'high' = 
    report.integrity.evidenceQuality < 40 ? 'low' 
    : report.integrity.evidenceQuality < 70 ? 'medium' 
    : 'high';

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-accent/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Tier 1 — Prospect Snapshot
              </p>
              <CardTitle className="text-lg">Initial Governance Signal</CardTitle>
            </div>
            <span className={cn(
              "px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide",
              stage === 'Crisis' && "bg-destructive/10 text-destructive",
              stage === 'Degraded' && "bg-warning/10 text-warning",
              stage === 'Stable' && "bg-success/10 text-success"
            )}>
              {stage}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {wizardData.companyBasics.companyName || 'Target Company'}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Metrics Panel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cash</p>
              <p className="text-lg font-semibold text-foreground">{wizardData.runwayInputs.cashOnHand || 'TBD'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Burn</p>
              <p className="text-lg font-semibold text-foreground">{wizardData.runwayInputs.monthlyBurn || 'TBD'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Runway</p>
              <p className="text-lg font-semibold text-foreground">{formatValue(runwayMonths.toFixed(1))} months</p>
            </div>
            {wizardData.runwayInputs.hasDebt && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Debt Maturity</p>
                <p className="text-lg font-semibold text-foreground">{wizardData.runwayInputs.debtMaturity || 'TBD'}</p>
              </div>
            )}
          </div>
          
          {/* Section 1: Situation in Plain English */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Situation in Plain English
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Current stage: <span className="font-medium text-foreground">{stage}</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Time pressure: <span className="font-medium text-foreground">{formatValue(daysToCritical)} days to critical</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Biggest risk: <span className="font-medium text-foreground">{topRisks[0] || 'Runway exhaustion'}</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Biggest opportunity: <span className="font-medium text-foreground">Preserve optionality through early intervention</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Cost of inaction: <span className="font-medium text-foreground">{burnRaw > 0 ? `${formatValue(formatCurrency(annualizedBurn))}/year` : 'TBD'}</span> (annualized burn)</span>
              </li>
            </ul>
          </div>
          
          <Separator />
          
          {/* Section 2: If You Do Nothing */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              If You Do Nothing
            </h4>
            <p className="text-sm font-medium text-warning mb-3">
              Inaction compounds risk trajectory. Window for low-cost intervention is narrowing.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>Cash runway depletes to zero in {formatValue(runwayMonths.toFixed(1))} months at current burn</span>
              </li>
              {topRisks.slice(0, 2).map((risk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Separator />
          
          {/* Section 3: First 7 Days */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              First 7 Days (Urgent Moves)
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {urgentActions.length > 0 ? (
                urgentActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent font-medium mt-0.5">{i + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-medium mt-0.5">1.</span>
                    <span>Stabilize cash position and validate runway assumptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-medium mt-0.5">2.</span>
                    <span>Identify and address highest-severity risks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-medium mt-0.5">3.</span>
                    <span>Assess strategic options for preserving optionality</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* What You Don't Yet See */}
      <Card className="border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            What You Don't Yet See
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Not included:</p>
          <ul className="space-y-1.5">
            <li className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/50">—</span>
              <span>Full value ledger with scenario modeling</span>
            </li>
            <li className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/50">—</span>
              <span>Lender strategy or execution plan</span>
            </li>
          </ul>
          
          {onUpgrade && (
            <>
              <Separator />
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-center gap-2 border-accent/50 hover:bg-accent/5"
                onClick={onUpgrade}
              >
                <ArrowUpRight className="w-4 h-4" />
                Unlock Executive Snapshot ($10,000)
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Evidence Guardrails */}
      <EvidenceGuardrails
        missingData={report.integrity.missingData}
        evidenceQuality={evidenceQuality}
        confidence={confidenceScore}
      />
      
      {/* Footer Note */}
      <div className="px-4 py-3 bg-muted/30 border border-border rounded text-xs text-muted-foreground italic">
        Use this snapshot to decide whether this situation merits deeper diligence.
      </div>
    </div>
  );
}
