import { FileText, TrendingUp, GitBranch, Target, Calendar, ArrowUpRight, Clock, BarChart3, Shield, Map, Users, CheckCircle2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { WizardData, DiagnosticReport } from '@/lib/types';
import { cn } from '@/lib/utils';
import { parseCurrency, formatCurrency, calcRunwayMonths } from '@/lib/currencyUtils';
import { EvidenceGuardrails } from './EvidenceGuardrails';

interface BoardMemoProps {
  report: DiagnosticReport;
  wizardData: WizardData;
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Tier 2 — Executive Snapshot: C-Suite Briefing
 * 2-5 page board-ready memo with scenarios and options
 */
export function BoardMemo({ report, wizardData, onUpgrade, className }: BoardMemoProps) {
  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );
  
  // Derive stage from urgency
  const stage = wizardData.situation?.urgency === 'critical' ? 'Crisis' 
    : wizardData.situation?.urgency === 'high' ? 'Degraded' 
    : 'Stable';
  
  // Calculate days to critical
  const burnRaw = parseCurrency(wizardData.runwayInputs.monthlyBurn);
  const runwayMonths = calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn);
  const daysToCritical = Math.round(runwayMonths * 30);
  const annualizedBurn = burnRaw * 12;
  
  // Low confidence indicator
  const lowConfidence = confidenceScore < 60;
  const formatValue = (value: string | number) => lowConfidence ? `~${value}` : `${value}`;
  
  // Evidence quality assessment
  const evidenceQuality: 'low' | 'medium' | 'high' = 
    report.integrity.evidenceQuality < 40 ? 'low' 
    : report.integrity.evidenceQuality < 70 ? 'medium' 
    : 'high';
  
  // Mock options for demo (in production, pulled from DecisionPacket)
  const options = [
    { name: 'Operational Restructuring', impact: 'High', cost: 'Medium', time: '30-60 days', risk: 'Medium', confidence: '75%' },
    { name: 'Strategic Partnership', impact: 'Medium', cost: 'Low', time: '60-90 days', risk: 'Low', confidence: '60%' },
    { name: 'Capital Raise', impact: 'High', cost: 'High', time: '90-120 days', risk: 'High', confidence: '50%' },
    { name: 'Managed Wind-Down', impact: 'Low', cost: 'Low', time: '30 days', risk: 'Low', confidence: '90%' },
  ];
  
  // Timeline urgency visualization
  const urgencyDays = [45, 60, 90];
  const currentUrgency = daysToCritical <= 45 ? 0 : daysToCritical <= 60 ? 1 : 2;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Card */}
      <Card className="border-accent/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Tier 2 — Executive Snapshot
              </p>
              <CardTitle className="text-xl">C-Suite Briefing</CardTitle>
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
          <p className="text-sm text-muted-foreground mt-1">
            {wizardData.companyBasics.companyName || 'Target Company'} • Board Memo
          </p>
        </CardHeader>
      </Card>
      
      {/* Page 1: Executive Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <FileText className="w-4 h-4" />
            Page 1 of 5
          </div>
          <CardTitle className="text-lg">Executive Summary</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Headline */}
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-lg font-semibold text-foreground">
              Company is in <span className="text-accent">{stage}</span> with{' '}
              <span className="text-accent">{formatValue(daysToCritical)} days</span> to critical threshold.
            </p>
          </div>
          
          {/* Timeline Urgency Visual */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Timeline Urgency</span>
            </div>
            <div className="flex items-center gap-2">
              {urgencyDays.map((days, index) => (
                <div 
                  key={days}
                  className={cn(
                    "flex-1 text-center py-2 rounded text-xs font-medium transition-colors",
                    index <= currentUrgency 
                      ? index === 0 
                        ? "bg-destructive/20 text-destructive border border-destructive/30" 
                        : index === 1 
                          ? "bg-warning/20 text-warning border border-warning/30"
                          : "bg-accent/20 text-accent border border-accent/30"
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {days} days
                </div>
              ))}
            </div>
          </div>
          
          {/* Three paragraphs */}
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">What's Happening</h4>
              <p>{report.sections.executiveBrief.split('\n')[0] || 'The company is experiencing operational and financial pressure that requires executive attention.'}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Why It Matters</h4>
              <p>Time pressure is increasing. Current trajectory indicates {formatValue(runwayMonths.toFixed(1))} months of runway at present burn rate. Delayed action materially increases remediation cost and reduces available options.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">What Leadership Must Decide Now</h4>
              <p>Select and initiate a strategic path within the next 30 days to preserve optionality. Key decision: prioritize operational efficiency vs. external capital vs. strategic alternatives.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Page 2: Financial Impact */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <TrendingUp className="w-4 h-4" />
            Page 2 of 5
          </div>
          <CardTitle className="text-lg">Financial Impact</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cost of Inaction</p>
              <p className="text-2xl font-bold text-destructive">{burnRaw > 0 ? formatValue(formatCurrency(annualizedBurn)) : 'TBD'}</p>
              <p className="text-xs text-muted-foreground">Annualized at current burn</p>
            </div>
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Recoverable Value</p>
              <p className="text-2xl font-bold text-success">TBD</p>
              <p className="text-xs text-muted-foreground">Contingent on intervention</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">P10 (Downside)</p>
              <p className="text-lg font-semibold text-destructive">-40%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">P50 (Base)</p>
              <p className="text-lg font-semibold text-foreground">0%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">P90 (Upside)</p>
              <p className="text-lg font-semibold text-success">+25%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Page 3: Scenarios */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <GitBranch className="w-4 h-4" />
            Page 3 of 5
          </div>
          <CardTitle className="text-lg">Scenarios</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
            <h4 className="font-medium text-foreground mb-1">Downside Scenario</h4>
            <p className="text-sm text-muted-foreground mb-2">What it looks like: Continued cash burn, delayed action, covenant breach or insolvency.</p>
            <p className="text-xs text-muted-foreground">Trigger: No intervention within 60 days</p>
          </div>
          
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <h4 className="font-medium text-foreground mb-1">Base Scenario</h4>
            <p className="text-sm text-muted-foreground mb-2">What it looks like: Stabilization achieved, runway extended, optionality preserved.</p>
            <p className="text-xs text-muted-foreground">Trigger: Decisive action within 30 days</p>
          </div>
          
          <div className="p-3 rounded-lg border border-success/20 bg-success/5">
            <h4 className="font-medium text-foreground mb-1">Upside Scenario</h4>
            <p className="text-sm text-muted-foreground mb-2">What it looks like: Successful turnaround, value recovery, growth resumption.</p>
            <p className="text-xs text-muted-foreground">Trigger: Early intervention + favorable market conditions</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Page 4: Options */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <Target className="w-4 h-4" />
            Page 4 of 5
          </div>
          <CardTitle className="text-lg">Strategic Options</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{option.name}</TableCell>
                  <TableCell>{option.impact}</TableCell>
                  <TableCell>{option.cost}</TableCell>
                  <TableCell>{option.time}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs",
                      option.risk === 'High' && "bg-destructive/10 text-destructive",
                      option.risk === 'Medium' && "bg-warning/10 text-warning",
                      option.risk === 'Low' && "bg-success/10 text-success",
                    )}>
                      {option.risk}
                    </span>
                  </TableCell>
                  <TableCell>{option.confidence}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Page 5: Next 30 Days */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <Calendar className="w-4 h-4" />
            Page 5 of 5
          </div>
          <CardTitle className="text-lg">Next 30 Days (High-Level)</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <h4 className="font-medium text-foreground mb-2">Week 1–2: Stabilize</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Validate cash position and runway assumptions</li>
              <li>• Identify immediate cost reduction opportunities</li>
              <li>• Engage key stakeholders on situation</li>
            </ul>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <h4 className="font-medium text-foreground mb-2">Week 3–4: Execute</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Implement priority cost actions</li>
              <li>• Initiate selected strategic option</li>
              <li>• Establish KPI tracking and reporting cadence</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Evidence Guardrails */}
      <EvidenceGuardrails
        missingData={report.integrity.missingData}
        evidenceQuality={evidenceQuality}
        confidence={confidenceScore}
      />
      
      {/* What Full Packet Adds */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-accent" />
            What the Full Decision Packet Adds
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: BarChart3, label: '13-week cash forecast' },
              { icon: Map, label: 'Week-by-week execution plan' },
              { icon: Shield, label: 'Lender negotiation playbook' },
              { icon: FileText, label: 'Evidence register' },
              { icon: CheckCircle2, label: 'Audit trail for every number' },
              { icon: BookOpen, label: 'Board-ready PDF + NotebookLM brief' },
            ].map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <item.icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          
          {onUpgrade && (
            <>
              <Separator />
              <Button 
                variant="default" 
                size="sm" 
                className="w-full justify-center gap-2"
                onClick={onUpgrade}
              >
                <ArrowUpRight className="w-4 h-4" />
                Upgrade to Full Decision Packet ($20,000)
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Note */}
      <div className="px-4 py-3 bg-muted/30 border border-border rounded text-xs text-muted-foreground italic">
        Use this briefing to align leadership and prepare for board discussion.
      </div>
    </div>
  );
}
