import { AlertTriangle, TrendingDown, Zap, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WizardData, DiagnosticReport } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExecutiveCardProps {
  report: DiagnosticReport;
  wizardData: WizardData;
  className?: string;
}

/**
 * Tier 1 — Prospect Snapshot: 1-page Executive Card
 * Auto-generated presentation layer on top of DecisionPacket
 */
export function ExecutiveCard({ report, wizardData, className }: ExecutiveCardProps) {
  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );
  
  // Derive stage from urgency
  const stage = wizardData.situation?.urgency === 'critical' ? 'Crisis' 
    : wizardData.situation?.urgency === 'high' ? 'Degraded' 
    : 'Stable';
  
  // Calculate days to critical (from runway)
  const cash = parseFloat(wizardData.runwayInputs.cashOnHand?.replace(/[^0-9.-]/g, '') || '0');
  const burn = parseFloat(wizardData.runwayInputs.monthlyBurn?.replace(/[^0-9.-]/g, '') || '1');
  const runwayMonths = burn > 0 ? cash / burn : 99;
  const daysToCritical = Math.round(runwayMonths * 30);
  
  // Extract key risks from signals
  const topRisks = wizardData.signalChecklist.signals.slice(0, 3);
  
  // Extract urgent actions from execution plan (first 5 bullets)
  const urgentActions = report.sections.executionPlan
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .slice(0, 5)
    .map(line => line.replace(/^[-•]\s*/, '').trim());

  return (
    <Card className={cn("border-accent/20", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Executive Card</CardTitle>
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            stage === 'Crisis' && "bg-destructive/10 text-destructive",
            stage === 'Degraded' && "bg-warning/10 text-warning",
            stage === 'Stable' && "bg-success/10 text-success"
          )}>
            {stage}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {wizardData.companyBasics.companyName || 'Target Company'} • Prospect Snapshot
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
              <span>Time pressure: <span className="font-medium text-foreground">{daysToCritical} days to critical</span></span>
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
              <span>Cost of inaction: <span className="font-medium text-foreground">${burn > 0 ? Math.round(burn * 12).toLocaleString() : 'TBD'}/year</span> (annualized burn)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Recoverable value: <span className="font-medium text-foreground">Contingent on intervention timing</span></span>
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
              <span>Cash runway depletes to zero in {runwayMonths.toFixed(1)} months at current burn</span>
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
        
        <Separator />
        
        {/* Section 4: Decision Teaser */}
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-accent" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Upgrade to Executive Snapshot</span> for a 2–5 page board memo + options analysis.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
