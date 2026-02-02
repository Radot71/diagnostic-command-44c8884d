import { FileText, TrendingUp, GitBranch, Target, Calendar, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WizardData, DiagnosticReport } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BoardMemoProps {
  report: DiagnosticReport;
  wizardData: WizardData;
  className?: string;
}

/**
 * Tier 2 — Executive Snapshot: 2-5 page Board Memo
 * Narrative layer on top of the DecisionPacket
 */
export function BoardMemo({ report, wizardData, className }: BoardMemoProps) {
  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );
  
  // Derive stage from urgency
  const stage = wizardData.situation?.urgency === 'critical' ? 'Crisis' 
    : wizardData.situation?.urgency === 'high' ? 'Degraded' 
    : 'Stable';
  
  // Calculate days to critical
  const cash = parseFloat(wizardData.runwayInputs.cashOnHand?.replace(/[^0-9.-]/g, '') || '0');
  const burn = parseFloat(wizardData.runwayInputs.monthlyBurn?.replace(/[^0-9.-]/g, '') || '1');
  const runwayMonths = burn > 0 ? cash / burn : 99;
  const daysToCritical = Math.round(runwayMonths * 30);
  
  // Mock options for demo (in production, pulled from DecisionPacket)
  const options = [
    { name: 'Operational Restructuring', impact: 'High', cost: 'Medium', time: '30-60 days', risk: 'Medium', confidence: '75%' },
    { name: 'Strategic Partnership', impact: 'Medium', cost: 'Low', time: '60-90 days', risk: 'Low', confidence: '60%' },
    { name: 'Capital Raise', impact: 'High', cost: 'High', time: '90-120 days', risk: 'High', confidence: '50%' },
    { name: 'Managed Wind-Down', impact: 'Low', cost: 'Low', time: '30 days', risk: 'Low', confidence: '90%' },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Page 1: Executive Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <FileText className="w-4 h-4" />
            Page 1 of 5
          </div>
          <CardTitle className="text-xl">Executive Summary</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {wizardData.companyBasics.companyName || 'Target Company'} • Board Memo
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Headline */}
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-lg font-semibold text-foreground">
              Company is in <span className="text-accent">{stage}</span> with{' '}
              <span className="text-accent">{daysToCritical} days</span> to critical threshold.
            </p>
          </div>
          
          {/* Three paragraphs */}
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">What's Happening</h4>
              <p>{report.sections.executiveBrief.split('\n')[0] || 'The company is experiencing operational and financial pressure that requires executive attention.'}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Why It Matters</h4>
              <p>Time pressure is increasing. Current trajectory indicates {runwayMonths.toFixed(1)} months of runway at present burn rate. Delayed action materially increases remediation cost and reduces available options.</p>
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
              <p className="text-2xl font-bold text-destructive">${burn > 0 ? Math.round(burn * 12).toLocaleString() : 'TBD'}</p>
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
                  <TableCell>{option.risk}</TableCell>
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
          
          <Separator />
          
          {/* Upgrade teaser */}
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Upgrade to Full Decision Packet</span> for a detailed 30/90 plan + board materials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
