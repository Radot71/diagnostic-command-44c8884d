import { Users, Building2, DollarSign, FileText, Presentation, Calendar, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { WizardData, DiagnosticReport } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StakeholderPackProps {
  report: DiagnosticReport;
  wizardData: WizardData;
  className?: string;
}

/**
 * Tier 3 — Full Decision Packet: Stakeholder Pack
 * Board Memo, Investor Update, CFO Briefing templates
 */
export function StakeholderPack({ report, wizardData, className }: StakeholderPackProps) {
  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );
  
  const stage = wizardData.situation?.urgency === 'critical' ? 'Crisis' 
    : wizardData.situation?.urgency === 'high' ? 'Degraded' 
    : 'Stable';
  
  const cash = parseFloat(wizardData.runwayInputs.cashOnHand?.replace(/[^0-9.-]/g, '') || '0');
  const burn = parseFloat(wizardData.runwayInputs.monthlyBurn?.replace(/[^0-9.-]/g, '') || '1');
  const runwayMonths = burn > 0 ? cash / burn : 99;
  
  const companyName = wizardData.companyBasics.companyName || 'Target Company';

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Stakeholder Pack</h2>
      </div>
      
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Board Memo
          </TabsTrigger>
          <TabsTrigger value="investor" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Investor Update
          </TabsTrigger>
          <TabsTrigger value="cfo" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            CFO Briefing
          </TabsTrigger>
        </TabsList>
        
        {/* Board Memo Template */}
        <TabsContent value="board" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Board Memo Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/30 border border-border font-mono text-xs">
                <p className="font-bold mb-2">CONFIDENTIAL — BOARD OF DIRECTORS</p>
                <p className="mb-4">Date: {new Date().toLocaleDateString()}</p>
                <p className="mb-4">Re: Strategic Situation Assessment — {companyName}</p>
                
                <p className="font-bold mb-1">SITUATION SUMMARY</p>
                <p className="mb-4">The company is currently in a {stage.toLowerCase()} state with approximately {runwayMonths.toFixed(1)} months of runway at current burn rate. Immediate board attention is required to authorize a strategic response.</p>
                
                <p className="font-bold mb-1">KEY METRICS</p>
                <ul className="mb-4 space-y-1">
                  <li>• Cash Position: {wizardData.runwayInputs.cashOnHand || 'TBD'}</li>
                  <li>• Monthly Burn: {wizardData.runwayInputs.monthlyBurn || 'TBD'}</li>
                  <li>• Runway: {runwayMonths.toFixed(1)} months</li>
                  <li>• Diagnostic Confidence: {confidenceScore}%</li>
                </ul>
                
                <p className="font-bold mb-1">RECOMMENDED ACTION</p>
                <p className="mb-4">Authorize management to proceed with [SELECTED OPTION] within the next 30 days to preserve optionality and minimize value erosion.</p>
                
                <p className="font-bold mb-1">NEXT STEPS</p>
                <p>Schedule follow-up board session in 14 days to review progress and adjust as needed.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Investor Update Template */}
        <TabsContent value="investor" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Investor Update Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/30 border border-border font-mono text-xs">
                <p className="font-bold mb-2">INVESTOR UPDATE — {companyName.toUpperCase()}</p>
                <p className="mb-4">Q{Math.ceil((new Date().getMonth() + 1) / 3)} {new Date().getFullYear()}</p>
                
                <p className="font-bold mb-1">EXECUTIVE SUMMARY</p>
                <p className="mb-4">We are writing to provide an update on the company's current situation and the strategic actions being taken to address near-term challenges while preserving long-term value.</p>
                
                <p className="font-bold mb-1">CURRENT STATE</p>
                <p className="mb-4">Status: {stage} | Runway: {runwayMonths.toFixed(1)} months | Confidence: {confidenceScore}%</p>
                
                <p className="font-bold mb-1">STRATEGIC RESPONSE</p>
                <p className="mb-4">Management has completed a comprehensive diagnostic assessment and identified [X] strategic options. The board has authorized pursuit of [SELECTED OPTION] with an expected execution timeline of [X] days.</p>
                
                <p className="font-bold mb-1">CAPITAL IMPLICATIONS</p>
                <p className="mb-4">Current runway supports execution of the selected strategy. [Additional capital requirements / No additional capital expected at this time.]</p>
                
                <p className="font-bold mb-1">NEXT UPDATE</p>
                <p>We will provide a follow-up communication in [30/60/90] days with progress metrics and any material developments.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* CFO Briefing Template */}
        <TabsContent value="cfo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                CFO Briefing Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/30 border border-border font-mono text-xs">
                <p className="font-bold mb-2">CFO INTERNAL BRIEFING</p>
                <p className="mb-4">Prepared: {new Date().toLocaleDateString()}</p>
                
                <p className="font-bold mb-1">FINANCIAL POSITION</p>
                <ul className="mb-4 space-y-1">
                  <li>• Cash on Hand: {wizardData.runwayInputs.cashOnHand || 'TBD'}</li>
                  <li>• Monthly Cash Burn: {wizardData.runwayInputs.monthlyBurn || 'TBD'}</li>
                  <li>• Calculated Runway: {runwayMonths.toFixed(1)} months</li>
                  <li>• Outstanding Debt: {wizardData.runwayInputs.hasDebt ? wizardData.runwayInputs.debtAmount : 'None'}</li>
                  {wizardData.runwayInputs.hasDebt && (
                    <li>• Debt Maturity: {wizardData.runwayInputs.debtMaturity || 'TBD'}</li>
                  )}
                </ul>
                
                <p className="font-bold mb-1">RISK FACTORS</p>
                <ul className="mb-4 space-y-1">
                  {wizardData.signalChecklist.signals.slice(0, 4).map((signal, i) => (
                    <li key={i}>• {signal}</li>
                  ))}
                  {wizardData.signalChecklist.signals.length === 0 && (
                    <li>• No specific risk signals identified</li>
                  )}
                </ul>
                
                <p className="font-bold mb-1">SCENARIO SENSITIVITY</p>
                <p className="mb-4">Base case assumes current burn rate continues. Downside scenario (burn +20%) reduces runway to {(runwayMonths * 0.83).toFixed(1)} months. Upside scenario (burn -20%) extends runway to {(runwayMonths * 1.25).toFixed(1)} months.</p>
                
                <p className="font-bold mb-1">RECOMMENDED ACTIONS</p>
                <ul className="space-y-1">
                  <li>1. Validate all cash flow assumptions within 7 days</li>
                  <li>2. Identify immediate cost reduction opportunities</li>
                  <li>3. Prepare 13-week cash flow forecast</li>
                  <li>4. Review covenant compliance status</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      {/* Additional Artifacts */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-accent/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Presentation className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm">Board Deck</h4>
              <p className="text-xs text-muted-foreground">10-slide PDF presentation</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-accent/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm">30/90 Roadmap</h4>
              <p className="text-xs text-muted-foreground">Execution timeline PDF</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * 30/90 Day Execution Roadmap component
 */
export function ExecutionRoadmap({ report, wizardData, className }: StakeholderPackProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">30/90 Day Execution Roadmap</h2>
      </div>
      
      {/* 30 Days */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">First 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <h4 className="font-medium text-sm mb-2">Week 1: Stabilize</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Validate cash position</li>
                <li>• Assess immediate risks</li>
                <li>• Stakeholder communication</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-medium text-sm mb-2">Week 2: Remove Top Risk</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Address highest-severity issue</li>
                <li>• Implement quick wins</li>
                <li>• Establish monitoring</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-medium text-sm mb-2">Week 3: Implement Option A</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Begin primary strategy</li>
                <li>• Resource allocation</li>
                <li>• Track leading indicators</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-medium text-sm mb-2">Week 4: Validate Results</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Measure progress vs. plan</li>
                <li>• Adjust as needed</li>
                <li>• Board update</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 90 Days */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">90-Day Horizon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <h4 className="font-medium text-sm mb-2">Month 1: Stabilize</h4>
              <p className="text-xs text-muted-foreground">Achieve operational stability and address critical risks. Establish baseline metrics.</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-medium text-sm mb-2">Month 2: Optimize</h4>
              <p className="text-xs text-muted-foreground">Implement efficiency improvements. Drive toward sustainable unit economics.</p>
            </div>
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <h4 className="font-medium text-sm mb-2">Month 3: Scale</h4>
              <p className="text-xs text-muted-foreground">Resume growth initiatives. Evaluate strategic alternatives. Position for next phase.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
