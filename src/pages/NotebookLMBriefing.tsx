import { useNavigate } from 'react-router-dom';
import { Download, Headphones, FileText, Volume2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { toast } from 'sonner';

export default function NotebookLMBriefing() {
  const navigate = useNavigate();
  const { report, wizardData } = useDiagnostic();

  if (!report) {
    return (
      <EnterpriseLayout>
        <PageHeader title="Briefings (NotebookLM)" />
        <PageContent>
          <div className="max-w-2xl mx-auto text-center py-12">
            <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Briefing Available</h2>
            <p className="text-muted-foreground mb-6">
              Run a diagnostic first to generate a briefing document.
            </p>
            <Button onClick={() => navigate('/diagnostic')}>
              Run New Diagnostic
            </Button>
          </div>
        </PageContent>
      </EnterpriseLayout>
    );
  }

  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );

  const generateBriefingDocument = () => {
    return `DIAGNOSTICOS EXECUTIVE BRIEFING
================================

Company: ${wizardData.companyBasics.companyName || 'Target Company'}
Situation: ${wizardData.situation?.title || 'General Assessment'}
Severity: ${wizardData.situation?.urgency?.toUpperCase() || 'MEDIUM'}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}

---

SITUATION OVERVIEW
------------------
${report.sections.executiveBrief.split('\n').slice(0, 20).join('\n')}

---

KEY FINANCIAL METRICS
---------------------
• Cash on Hand: ${wizardData.runwayInputs.cashOnHand || 'Not specified'}
• Monthly Cash Burn: ${wizardData.runwayInputs.monthlyBurn || 'Not specified'}
• Debt Position: ${wizardData.runwayInputs.hasDebt ? `${wizardData.runwayInputs.debtAmount} (${wizardData.runwayInputs.debtMaturity} to maturity)` : 'No significant debt identified'}
• Confidence Score: ${confidenceScore}%

---

IDENTIFIED RISK SIGNALS
-----------------------
${wizardData.signalChecklist.signals.length > 0 
  ? wizardData.signalChecklist.signals.map(s => `• ${s}`).join('\n')
  : '• No specific risk signals identified'}

${wizardData.signalChecklist.notes ? `\nAdditional Context:\n${wizardData.signalChecklist.notes}` : ''}

---

STRATEGIC OPTIONS SUMMARY
-------------------------
${report.sections.options.split('\n').slice(0, 30).join('\n')}

---

RECOMMENDED ACTIONS
-------------------
${report.sections.executionPlan.split('\n').slice(0, 20).join('\n')}

---

KEY DISCUSSION QUESTIONS
------------------------
1. What are the most critical risks requiring immediate attention?
2. Which strategic option offers the best risk-adjusted outcome?
3. What additional information would improve decision confidence?
4. What is the recommended timeline for board action?

---

EVIDENCE GAPS (for further investigation)
------------------------------------------
${report.integrity.missingData.map(item => `• ${item}`).join('\n')}

---

This document is formatted for upload to NotebookLM or similar 
AI platforms to generate audio or video executive briefings.

Report ID: ${report.id}
Confidence Level: ${confidenceScore}%
`;
  };

  const handleDownload = () => {
    const brief = generateBriefingDocument();
    const blob = new Blob([brief], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing-${wizardData.companyBasics.companyName?.replace(/\s+/g, '-') || 'diagnostic'}-${report.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Briefing document downloaded', {
      description: 'Ready to upload to NotebookLM'
    });
  };

  return (
    <EnterpriseLayout>
      <PageHeader 
        title="NotebookLM Briefing" 
        subtitle={wizardData.companyBasics.companyName || 'Current Diagnostic'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Briefings' },
        ]}
      />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          {/* Info Banner */}
          <div className="enterprise-card p-5 mb-6 bg-accent/5 border-accent/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Audio/Video Briefing Generation</h3>
                <p className="text-sm text-muted-foreground">
                  This document is designed to be uploaded to NotebookLM to generate an audio or video 
                  executive briefing. The format is optimized for AI consumption and summary generation.
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="enterprise-card mb-6">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Briefing Preview</h3>
              <span className="text-sm text-muted-foreground">
                {wizardData.situation?.title || 'General Assessment'}
              </span>
            </div>
            <div className="p-5 space-y-6">
              {/* Executive Narrative */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Executive Narrative
                </h4>
                <p className="text-foreground leading-relaxed">
                  {wizardData.companyBasics.companyName || 'The target company'} is facing a{' '}
                  <span className="font-medium">{wizardData.situation?.title?.toLowerCase() || 'strategic assessment'}</span>{' '}
                  situation. Based on the diagnostic inputs, the current cash position of{' '}
                  {wizardData.runwayInputs.cashOnHand || 'undisclosed'} with a monthly burn of{' '}
                  {wizardData.runwayInputs.monthlyBurn || 'undisclosed'} indicates a runway that requires attention.
                  {wizardData.signalChecklist.signals.length > 0 && (
                    <> Key warning signals include {wizardData.signalChecklist.signals.slice(0, 2).join(' and ').toLowerCase()}.</>
                  )}
                </p>
              </div>

              {/* Key Numbers */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Key Numbers
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Cash Position</p>
                    <p className="font-semibold text-foreground">{wizardData.runwayInputs.cashOnHand || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Burn</p>
                    <p className="font-semibold text-foreground">{wizardData.runwayInputs.monthlyBurn || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Debt</p>
                    <p className="font-semibold text-foreground">
                      {wizardData.runwayInputs.hasDebt ? wizardData.runwayInputs.debtAmount : 'None'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="font-semibold text-foreground">{confidenceScore}%</p>
                  </div>
                </div>
              </div>

              {/* Risks */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Identified Risks
                </h4>
                {wizardData.signalChecklist.signals.length > 0 ? (
                  <ul className="space-y-1.5">
                    {wizardData.signalChecklist.signals.map((signal, index) => (
                      <li key={index} className="text-sm text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific risks identified</p>
                )}
              </div>

              {/* Decision Recommendation */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Decision Recommendation
                </h4>
                <p className="text-foreground leading-relaxed">
                  Based on the analysis, immediate focus should be on stabilizing the financial position 
                  while developing strategic options for stakeholder consideration. The recommended approach 
                  includes operational restructuring, potential recapitalization, and contingency planning 
                  for various scenarios.
                </p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/report')}>
              Back to Review
            </Button>
            <Button size="lg" onClick={handleDownload}>
              <Download className="w-5 h-5 mr-2" />
              Download Briefing Document
            </Button>
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}