import { useState, useEffect } from 'react';
import { calcRunwayMonths } from '@/lib/currencyUtils';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Download, Printer, FileJson, FileText, Clock, 
  ArrowLeft, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { loadReport } from '@/lib/reportPersistence';
import { generateReportPdf } from '@/lib/pdfExport';
import { ReportSidebar, SeverityIndicator, ConfidenceScore, IntegrityMeter, reportSections } from '@/components/report/ReportNavigation';
import { ReportContent } from '@/components/report/ReportContent';
import { ValidationBadge } from '@/components/report/ValidationBadge';
import { DevQAPanel } from '@/components/report/DevQAPanel';
import { DecisionFrame } from '@/components/report/DecisionFrame';
import { DecisionPosture, derivePosture } from '@/components/report/DecisionPosture';
import { SystemStatusPanel, AIUsageInfoPanel, ValidationPassDisclosure } from '@/components/report/SystemStatusPanel';
import { ResultHeadline } from '@/components/report/ResultHeadline';
import { UpgradeNudgeBanner } from '@/components/report/UpgradeNudgeBanner';
import { ExecutiveCard } from '@/components/report/ExecutiveCard';
import { BoardMemo } from '@/components/report/BoardMemo';
import { StakeholderPack, ExecutionRoadmap } from '@/components/report/StakeholderPack';
import { GovernanceHeader } from '@/components/report/GovernanceHeader';
import { GovernanceStatusBanner } from '@/components/report/GovernanceStatusBanner';
import { UrgencyBanner } from '@/components/report/UrgencyBanner';
import { EvidenceGuardrails } from '@/components/report/EvidenceGuardrails';
import { EvidenceGate } from '@/components/report/EvidenceGate';
import { OtherSideReasoning } from '@/components/report/OtherSideReasoning';
import { FinalVerdict } from '@/components/report/FinalVerdict';
import { ConfidenceDisplay } from '@/components/report/ConfidenceDisplay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type ViewMode = 'executive' | 'board' | 'prospect';
type ArtifactView = 'report' | 'executive-card' | 'board-memo' | 'stakeholder-pack' | 'roadmap';

export default function DiagnosticReview() {
  const navigate = useNavigate();
  const { id: reportId } = useParams<{ id: string }>();
  const { 
    report, wizardData, resetWizard, outputConfig, 
    setReport, setWizardData, setOutputConfig, 
    reportSource, setReportSource, setReportId 
  } = useDiagnostic();
  const [activeSection, setActiveSection] = useState('situation');
  const [viewMode, setViewMode] = useState<ViewMode>('executive');
  const [artifactView, setArtifactView] = useState<ArtifactView>('report');
  const [isLoading, setIsLoading] = useState(!report);
  const currentTier = outputConfig.tier;

  // Load from database if no report in context
  useEffect(() => {
    if (report) {
      setIsLoading(false);
      return;
    }
    if (!reportId) {
      navigate('/');
      return;
    }
    loadReport(reportId).then(result => {
      if (result) {
        setReport(result.report);
        setWizardData(result.wizardData);
        setOutputConfig(result.outputConfig);
        setReportSource(result.source);
        setReportId(reportId);
      } else {
        toast.error('Report not found');
        navigate('/');
      }
      setIsLoading(false);
    }).catch(() => {
      toast.error('Failed to load report');
      navigate('/');
      setIsLoading(false);
    });
  }, [reportId]);

  if (isLoading) {
    return (
      <EnterpriseLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  if (!report) {
    navigate('/');
    return null;
  }

  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );

  // Calculate fields needed for next confidence milestone
  const nextMilestone = confidenceScore < 50 ? 50 : confidenceScore < 70 ? 70 : confidenceScore < 80 ? 80 : 90;
  const fieldsToNext = Math.ceil((nextMilestone - confidenceScore) / 10);

  const handleExportPDF = () => {
    generateReportPdf({
      title: wizardData.companyBasics.companyName || 'Diagnostic Report',
      subtitle: `Report ID: ${report.id} — ${new Date(report.generatedAt).toLocaleDateString()}`,
      content: Object.values(report.sections).join('\n\n---\n\n'),
      filename: `diagnostic-${report.id}.pdf`,
    });
    toast.success('PDF exported');
  };

  const handleExportHTML = () => {
    const htmlContent = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${wizardData.companyBasics.companyName || 'Diagnostic Report'}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;color:#0b1220}main{max-width:900px;margin:0 auto;padding:32px}h1{font-size:22px}pre{white-space:pre-wrap;font-size:13px;background:#f8f9fa;border:1px solid #e6eaf2;border-radius:8px;padding:18px}footer{margin-top:16px;font-size:11px;color:#57657d}</style>
</head><body><main>
<h1>${wizardData.companyBasics.companyName || 'Diagnostic Report'}</h1>
<p style="color:#3a465a;font-size:13px">Report ID: ${report.id}</p>
<pre>${Object.values(report.sections).join('\n\n---\n\n').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<footer>DiagnosticOS — The selected report reflects the analytical scope surfaced at the chosen diagnostic tier.</footer>
</main></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${report.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML exported');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  const handleNewDiagnostic = () => {
    resetWizard();
    navigate('/');
  };

  const getSectionContent = () => {
    switch (activeSection) {
      case 'situation':
      case 'value':
        return report.sections.executiveBrief;
      case 'failures':
      case 'scenarios':
        return report.sections.scenarios;
      case 'options':
      case 'recommendation':
        return report.sections.options;
      case 'execution':
        return report.sections.executionPlan;
      case 'evidence':
        return report.sections.evidenceRegister;
      default:
        return report.sections.executiveBrief;
    }
  };

  // Evidence quality assessment
  const evidenceQuality: 'low' | 'medium' | 'high' = 
    report.integrity.evidenceQuality < 40 ? 'low' 
    : report.integrity.evidenceQuality < 70 ? 'medium' 
    : 'high';
  
  // Calculate days to action for urgency banner
  const daysToAction = Math.round(calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn) * 30);
  
  // Handle tier upgrade
  const handleUpgrade = (tier: 'executive' | 'full') => {
    toast.info(`Upgrade to ${tier === 'executive' ? 'Executive Snapshot ($10,000)' : 'Full Decision Packet ($20,000)'}`, {
      description: 'Contact your account representative to upgrade.',
    });
  };

  // Determine banner variant based on report source
  const bannerVariant = reportSource === 'claude' ? 'live' as const
    : reportSource === 'demo' ? 'demo' as const
    : reportSource === 'upload' || reportSource === 'reference' ? 'reference' as const
    : 'default' as const;

  return (
    <EnterpriseLayout showTransparencyBanner bannerVariant={bannerVariant}>
      {/* Governance Status Banner - GO / NO-GO */}
      <GovernanceStatusBanner
        severity={wizardData.situation?.urgency || 'medium'}
        completeness={report.integrity.completeness}
        confidence={confidenceScore}
      />

      {/* Urgency Banner - Sticky for CRITICAL severity */}
      <UrgencyBanner
        severity={wizardData.situation?.urgency || 'medium'}
        daysToAction={daysToAction}
        currentTier={currentTier}
        onUpgrade={() => handleUpgrade(currentTier === 'prospect' ? 'executive' : 'full')}
      />
      
      {/* Governance Header */}
      <GovernanceHeader
        severity={wizardData.situation?.urgency || 'medium'}
        confidence={confidenceScore}
        completeness={report.integrity.completeness}
        evidenceQuality={evidenceQuality}
        companyName={wizardData.companyBasics.companyName}
      />
      
      <PageHeader
        title={wizardData.companyBasics.companyName || 'Diagnostic Review'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Diagnostic Review' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewDiagnostic}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Diagnostic
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <motion.aside 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-56 border-r border-border bg-card p-4 flex-shrink-0 overflow-auto"
        >
          <ReportSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar - Indicators */}
          <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Severity:</span>
                <SeverityIndicator level={wizardData.situation?.urgency || 'medium'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <Tooltip>
                  <TooltipTrigger>
                    <ConfidenceScore score={confidenceScore} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Confidence Score: {confidenceScore}%</p>
                    {confidenceScore < 70 && (
                      <p className="text-xs text-muted-foreground">
                        Below 70% threshold. Add {fieldsToNext} more fields to reach {nextMilestone}%.
                      </p>
                    )}
                    {report.integrity.missingData.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Missing: {report.integrity.missingData.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {wizardData.situation?.urgency === 'critical' ? 'Immediate Action Required' : 'Standard Timeline'}
                </span>
              </div>
              {/* Validation Badge - only shows when ensemble active */}
              <ValidationBadge report={report} />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded p-1" role="tablist">
              {(['executive', 'board', 'prospect'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  role="tab"
                  aria-selected={viewMode === mode}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize",
                    viewMode === mode 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode} View
                </button>
              ))}
            </div>
          </div>

          {/* Artifact Tabs - Tier-based */}
          <div className="h-10 border-b border-border bg-muted/30 px-6 flex items-center gap-1">
            <button
              onClick={() => setArtifactView('report')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                artifactView === 'report' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Report
            </button>
            <button
              onClick={() => setArtifactView('executive-card')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                artifactView === 'executive-card' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Executive Card
            </button>
            {(currentTier === 'executive' || currentTier === 'full') && (
              <button
                onClick={() => setArtifactView('board-memo')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  artifactView === 'board-memo' 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Board Memo
              </button>
            )}
            {currentTier === 'full' && (
              <>
                <button
                  onClick={() => setArtifactView('stakeholder-pack')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                    artifactView === 'stakeholder-pack' 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Stakeholder Pack
                </button>
                <button
                  onClick={() => setArtifactView('roadmap')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                    artifactView === 'roadmap' 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  30/90 Roadmap
                </button>
              </>
            )}
          </div>

          {/* Report Content */}
          <motion.div 
            key={`${activeSection}-${artifactView}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto p-6"
          >
            <div className="max-w-4xl">
              {/* Upgrade Nudge Banner - for non-full tiers */}
              {currentTier !== 'full' && artifactView === 'report' && (
                <UpgradeNudgeBanner 
                  currentTier={currentTier}
                  stage={wizardData.situation?.urgency === 'critical' ? 'Crisis' : wizardData.situation?.urgency === 'high' ? 'Degraded' : 'Stable'}
                   daysToCritical={Math.round(calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn) * 30)}
                  className="mb-4"
                />
              )}
              
              {/* Artifact Views */}
              {artifactView === 'executive-card' && (
                <ExecutiveCard 
                  report={report} 
                  wizardData={wizardData} 
                  onUpgrade={() => handleUpgrade('executive')}
                />
              )}
              
              {artifactView === 'board-memo' && (
                <BoardMemo 
                  report={report} 
                  wizardData={wizardData} 
                  onUpgrade={() => handleUpgrade('full')}
                />
              )}
              
              {artifactView === 'stakeholder-pack' && (
                <StakeholderPack report={report} wizardData={wizardData} />
              )}
              
              {artifactView === 'roadmap' && (
                <ExecutionRoadmap report={report} wizardData={wizardData} />
              )}
              
              {artifactView === 'report' && (
                <>
                  {/* Result Headline - Every artifact */}
                  <ResultHeadline className="mb-4" />

                  {/* Evidence Gate - for low completeness */}
                  <EvidenceGate
                    completeness={report.integrity.completeness}
                    confidence={confidenceScore}
                    missingData={report.integrity.missingData}
                    className="mb-4"
                  />
                  
                  {/* Decision Frame - Top of every artifact view */}
                  {activeSection === 'situation' && (
                    <DecisionFrame 
                      whatWeKnowOverride={
                        confidenceScore >= 70 
                          ? 'Based on the inputs provided, the system can reliably identify the primary drivers, constraints, and near-term risks.'
                          : 'Based on available inputs, the system has identified directionally material findings. Confidence is constrained by missing data inputs.'
                      }
                      whyItMattersOverride={
                        wizardData.situation?.urgency === 'critical'
                          ? 'Time pressure is acute. Window for intervention is narrowing. Delayed action materially increases risk trajectory.'
                          : 'Time pressure is increasing. If no action is taken, risk becomes harder and more expensive to reverse.'
                      }
                    />
                  )}

                  {/* Other-Side Reasoning — all tiers, depth varies */}
                  <OtherSideReasoning
                    report={report}
                    wizardData={wizardData}
                    currentTier={currentTier}
                    className="mb-6"
                  />

                  {/* Section Header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground">
                      {reportSections.find(s => s.id === activeSection)?.label}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === 'executive' && 'Structured for executive and board-level discussion, focusing on trade-offs, time pressure, and decision sequencing.'}
                      {viewMode === 'board' && 'Summary format for board presentation. Emphasizes key findings, material risks, and primary strategic considerations.'}
                      {viewMode === 'prospect' && 'Condensed summary suitable for initial review and outreach assessment.'}
                    </p>
                  </div>
                  
                  <ReportContent content={getSectionContent()} section={activeSection} />

                  {/* Final Governance Verdict — end of report */}
                  {activeSection === 'evidence' && (
                    <FinalVerdict
                      severity={wizardData.situation?.urgency || 'medium'}
                      confidence={confidenceScore}
                      completeness={report.integrity.completeness}
                      hasDebt={wizardData.runwayInputs.hasDebt}
                      debtMaturity={wizardData.runwayInputs.debtMaturity}
                      className="mt-6"
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar - Export & Summary */}
        <motion.aside 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-72 border-l border-border bg-card p-4 flex-shrink-0 overflow-auto"
        >
          {/* Decision Posture Module */}
          <DecisionPosture
            posture={derivePosture(
              wizardData.situation?.urgency,
              wizardData.runwayInputs.hasDebt,
              wizardData.signalChecklist.signals.length,
              confidenceScore
            )}
            reason={
              wizardData.situation?.urgency === 'critical'
                ? 'Multiple risk factors require immediate attention to preserve optionality.'
                : wizardData.signalChecklist.signals.length > 0
                  ? 'Warning signals indicate elevated risk requiring active management.'
                  : 'Current position allows for measured response with monitoring.'
            }
            riskIfDelayed={
              wizardData.situation?.urgency === 'critical'
                ? 'Window for intervention is narrowing. Each week of delay compounds exposure.'
                : 'Delayed action reduces available options and increases remediation cost.'
            }
            nextAction={
              wizardData.runwayInputs.hasDebt
                ? 'Review debt position and covenant status to assess near-term constraints.'
                : 'Assess cash position and runway to establish baseline for scenario planning.'
            }
            className="mb-4"
          />

          {/* Final Verdict in sidebar */}
          <FinalVerdict
            severity={wizardData.situation?.urgency || 'medium'}
            confidence={confidenceScore}
            completeness={report.integrity.completeness}
            hasDebt={wizardData.runwayInputs.hasDebt}
            debtMaturity={wizardData.runwayInputs.debtMaturity}
            className="mb-4"
          />

          {/* Export Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Export & Delivery</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Available formats reflect the selected artifact depth. All exports are generated from the same underlying diagnostic.
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportPDF}>
                <Printer className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportHTML}>
                <FileText className="w-4 h-4 mr-2" />
                Export HTML
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportJSON}>
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/briefings')}>
                <Download className="w-4 h-4 mr-2" />
                Briefing Document
              </Button>
            </div>
          </div>

          {/* System Status Panel */}
          <SystemStatusPanel 
            report={report} 
            sessionId={report.id}
            className="mb-4"
          />
          
          {/* How AI is Used */}
          <AIUsageInfoPanel className="mb-4" />
          
          {/* Validation Pass Disclosure */}
          <ValidationPassDisclosure validation={report.validation} className="mb-4" />

          {/* Enhanced Confidence Display */}
          <ConfidenceDisplay
            confidence={confidenceScore}
            missingDataCount={report.integrity.missingData.length}
            evidenceQuality={report.integrity.evidenceQuality}
            className="mb-6"
          />

          {/* Integrity Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Data Integrity</h3>
            <div className="space-y-3">
              <IntegrityMeter label="Completeness" value={report.integrity.completeness} />
              <IntegrityMeter label="Evidence Quality" value={report.integrity.evidenceQuality} />
              <IntegrityMeter label="Confidence" value={report.integrity.confidence} />
            </div>
          </div>

          {/* Missing Data */}
          {report.integrity.missingData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Missing Data</h3>
              <ul className="space-y-1.5">
                {report.integrity.missingData.slice(0, 5).map((item, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <button 
                      onClick={() => navigate('/diagnostic')}
                      className="text-left hover:text-accent underline underline-offset-2"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
              {report.integrity.missingData.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{report.integrity.missingData.length - 5} more...
                </p>
              )}
            </div>
          )}

          {/* Dev QA Panel - only in dev mode */}
          <DevQAPanel report={report} className="mb-6" />

          {/* Advanced JSON */}
          <Accordion type="single" collapsible>
            <AccordionItem value="json" className="border-none">
              <AccordionTrigger className="text-xs text-muted-foreground hover:text-foreground py-2">
                Advanced: View Raw JSON
              </AccordionTrigger>
              <AccordionContent>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(report.rawJson, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.aside>
      </div>
    </EnterpriseLayout>
  );
}
