import { useState } from 'react';
import { calcRunwayMonths } from '@/lib/currencyUtils';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Printer, Upload, Settings, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { ExportPreview } from '@/components/report/ExportPreview';
import { TierBadge } from '@/components/intake/TierSelection';
import { TierEntitlements, ExportNotIncludedMessage } from '@/components/report/TierEntitlements';
import { DecisionFrame } from '@/components/report/DecisionFrame';
import { TIER_CONFIGURATIONS, DiagnosticTier } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  formats: string[];
  type: 'prospect' | 'executive' | 'full' | 'notebooklm';
  requiredTier: DiagnosticTier;
}

const exportOptions: ExportOption[] = [
  {
    id: 'prospect',
    title: 'Prospect Snapshot',
    description: 'Condensed executive summary suitable for initial review and outreach.',
    formats: ['Preview', 'PDF'],
    type: 'prospect',
    requiredTier: 'prospect',
  },
  {
    id: 'executive',
    title: 'Executive Snapshot',
    description: 'Expanded summary highlighting key findings, risks, and strategic considerations.',
    formats: ['Preview', 'PDF', 'HTML'],
    type: 'executive',
    requiredTier: 'executive',
  },
  {
    id: 'full',
    title: 'Full Decision Packet',
    description: 'Comprehensive diagnostic documentation including full analysis, assumptions, and execution guidance.',
    formats: ['Preview', 'PDF', 'HTML', 'JSON'],
    type: 'full',
    requiredTier: 'full',
  },
  {
    id: 'deck',
    title: 'Board Slide Deck',
    description: '10-slide PDF presentation structured for board or investment committee review.',
    formats: ['PDF'],
    type: 'full',
    requiredTier: 'full',
  },
  {
    id: 'notebooklm',
    title: 'Briefing Document',
    description: 'Structured diagnostic output formatted for downstream briefing, narration, or audio/video synthesis.',
    formats: ['Preview', 'TXT', 'DOC'],
    type: 'notebooklm',
    requiredTier: 'full',
  },
];

/** Check if an export is available at the given tier */
function isExportAvailable(exportType: 'prospect' | 'executive' | 'full' | 'notebooklm', currentTier: DiagnosticTier): boolean {
  const config = TIER_CONFIGURATIONS[currentTier];
  return config.includedExports.includes(exportType);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildPrintableHtmlDocument(params: { title: string; subtitle?: string; bodyPre: string }) {
  const { title, subtitle, bodyPre } = params;
  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : '';
  const safeBody = escapeHtml(bodyPre);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0b1220; }
      main { max-width: 900px; margin: 0 auto; padding: 32px 28px 48px; }
      h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: -0.01em; }
      p.sub { margin: 0 0 18px; color: #3a465a; font-size: 13px; }
      pre { white-space: pre-wrap; line-height: 1.45; font-size: 13px; background: #ffffff; border: 1px solid #e6eaf2; border-radius: 10px; padding: 18px; }
      footer { margin-top: 16px; font-size: 11px; color: #57657d; }
      @media print { main { padding: 0; } pre { border: none; } }
    </style>
  </head>
  <body>
    <main>
      <h1>${safeTitle}</h1>
      ${subtitle ? `<p class="sub">${safeSubtitle}</p>` : ''}
      <pre>${safeBody}</pre>
      <footer>
        The selected report reflects the analytical scope surfaced at the chosen diagnostic tier. Additional analysis has been evaluated but is not included in this deliverable.
      </footer>
    </main>
  </body>
</html>`;
}

function openPrintWindow(html: string, windowTitle: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return false;

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = windowTitle;
  w.focus();

  // Allow the browser a moment to layout before printing.
  setTimeout(() => {
    w.print();
  }, 250);

  return true;
}

export default function ExportDelivery() {
  const navigate = useNavigate();
  const { report, wizardData, outputConfig } = useDiagnostic();
  const currentTier = outputConfig.tier;
  const tierConfig = TIER_CONFIGURATIONS[currentTier];
  const [brandName, setBrandName] = useState(wizardData.companyBasics.companyName || '');
  const [includeCover, setIncludeCover] = useState(true);

  if (!report) {
    return (
      <EnterpriseLayout>
        <PageHeader title="Reports & Exports" />
        <PageContent>
          <div className="max-w-2xl mx-auto text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Reports Available</h2>
            <p className="text-muted-foreground mb-6">
              Run a diagnostic first to generate exportable reports.
            </p>
            <Button onClick={() => navigate('/diagnostic')}>
              Run New Diagnostic
            </Button>
          </div>
        </PageContent>
      </EnterpriseLayout>
    );
  }

  const handleExport = (option: ExportOption, format: string) => {
    if (format === 'Preview') return;

    const filenameBase = `diagnostic-${option.id}-${report.id}`;

    if (format === 'JSON') {
      const dataStr = JSON.stringify(report, null, 2);
      downloadBlob(new Blob([dataStr], { type: 'application/json' }), `${filenameBase}.json`);
      toast.success('JSON exported successfully');
      return;
    }

    const getPlainText = () => {
      if (option.id === 'deck') {
        // Plaintext fallback if someone ever adds non-PDF formats.
        return `BOARD DECK\n==========\n\n${report.sections.executiveBrief}\n\n${report.sections.scenarios}\n\n${report.sections.options}`;
      }
      if (option.type === 'notebooklm') return generateBriefingDocument();
      return generatePreviewContent(option.type);
    };

    const buildHtmlForOption = () => {
      if (option.id === 'deck') {
        const companyName = wizardData.companyBasics.companyName || 'Target Company';
        const situation = wizardData.situation?.title || 'General Assessment';
        const urgency = wizardData.situation?.urgency || 'medium';
        const stage = urgency === 'critical' ? 'Crisis' : urgency === 'high' ? 'Degraded' : 'Stable';

        const daysToCritical = Math.round(calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn) * 30);

        const slides: Array<{ title: string; body: string }> = [
          {
            title: `Title — ${companyName}`,
            body: `${stage} posture • ${daysToCritical} days to critical threshold\n\nReport ID: ${report.id}\nGenerated: ${new Date(report.generatedAt).toLocaleDateString()}`,
          },
          { title: 'Situation', body: report.sections.executiveBrief },
          { title: 'Financial Impact', body: report.sections.valueLedger || 'Value ledger not available in this run.' },
          { title: 'Scenarios', body: report.sections.scenarios },
          { title: 'Options', body: report.sections.options },
          { title: 'Risks', body: `Severity: ${urgency.toUpperCase()}\n\nSignals:\n${wizardData.signalChecklist.signals.map((s) => `- ${s}`).join('\n') || '- None identified'}` },
          { title: '30-Day Roadmap', body: report.sections.executionPlan },
          { title: '90-Day Roadmap', body: 'See full roadmap artifact in the workbench for narrative scaffolding.' },
          { title: 'KPIs', body: 'KPIs are derived from existing inputs; include finance + execution leading indicators as applicable.' },
          { title: 'Evidence Summary', body: report.sections.evidenceRegister },
        ];

        const safeCompany = escapeHtml(companyName);
        const slideHtml = slides
          .map((s) => {
            const title = escapeHtml(s.title);
            const body = escapeHtml(s.body);
            return `
<section class="slide">
  <header>
    <h2>${title}</h2>
    <div class="meta">${safeCompany} • Board Slide Deck</div>
  </header>
  <pre>${body}</pre>
</section>`;
          })
          .join('\n');

        return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(companyName)} — Board Deck</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0b1220; }
      .slide { page-break-after: always; padding: 44px 44px 52px; }
      header { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
      h2 { margin: 0; font-size: 26px; letter-spacing: -0.01em; }
      .meta { font-size: 12px; color: #3a465a; }
      pre { margin: 0; white-space: pre-wrap; line-height: 1.45; font-size: 13px; background: #ffffff; border: 1px solid #e6eaf2; border-radius: 12px; padding: 18px; }
      @media print { .slide { padding: 0; } pre { border: none; } }
    </style>
  </head>
  <body>
    ${slideHtml}
  </body>
</html>`;
      }

      return buildPrintableHtmlDocument({
        title: option.title,
        subtitle: wizardData.companyBasics.companyName || undefined,
        bodyPre: getPlainText(),
      });
    };

    if (format === 'HTML') {
      const html = buildHtmlForOption();
      downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${filenameBase}.html`);
      toast.success('HTML exported successfully');
      return;
    }

    if (format === 'TXT') {
      downloadBlob(new Blob([getPlainText()], { type: 'text/plain;charset=utf-8' }), `${filenameBase}.txt`);
      toast.success('TXT exported successfully');
      return;
    }

    if (format === 'DOC') {
      // Basic Word-compatible export (HTML wrapped as .doc works well across clients)
      const html = buildHtmlForOption();
      downloadBlob(new Blob([html], { type: 'application/msword' }), `${filenameBase}.doc`);
      toast.success('DOC exported successfully');
      return;
    }

    if (format === 'PDF') {
      const ok = openPrintWindow(buildHtmlForOption(), `${option.title} — ${report.id}`);
      if (!ok) {
        toast.error('Popup blocked', { description: 'Allow popups to print / save as PDF.' });
        return;
      }
      toast.success('Print dialog opened', { description: 'Choose “Save as PDF” to download.' });
      return;
    }

    toast.error('Unsupported export format');
  };

  const generateBriefingDocument = () => {
    return `DIAGNOSTICOS BRIEFING DOCUMENT
================================

Company: ${wizardData.companyBasics.companyName || 'Target Company'}
Situation: ${wizardData.situation?.title || 'General Assessment'}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}
Report ID: ${report.id}

---

EXECUTIVE SUMMARY
-----------------
${report.sections.executiveBrief}

---

KEY NUMBERS
-----------
Cash on Hand: ${wizardData.runwayInputs.cashOnHand || 'Not specified'}
Monthly Burn: ${wizardData.runwayInputs.monthlyBurn || 'Not specified'}
Debt Position: ${wizardData.runwayInputs.hasDebt ? wizardData.runwayInputs.debtAmount : 'No significant debt'}

---

RISK ASSESSMENT
---------------
Severity: ${wizardData.situation?.urgency?.toUpperCase() || 'MEDIUM'}
Confidence Score: ${Math.round((report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3)}%

Key Signals Identified:
${wizardData.signalChecklist.signals.map(s => `- ${s}`).join('\n') || '- None identified'}

---

DECISION RECOMMENDATION
-----------------------
${report.sections.options}

---

DISCUSSION QUESTIONS
--------------------
1. What are the most critical risks identified?
2. Which strategic option offers the best risk-adjusted outcome?
3. What additional information would improve confidence?
4. What is the recommended timeline for action?

---

DATA GAPS
---------
${report.integrity.missingData.map(item => `- ${item}`).join('\n')}

---

This document is designed for upload to NotebookLM or similar platforms
for audio/video briefing generation.
`;
  };

  const generatePreviewContent = (type: string) => {
    const companyName = wizardData.companyBasics.companyName || 'Target Company';
    const situation = wizardData.situation?.title || 'General Assessment';
    const confidenceScore = Math.round(
      (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
    );

    switch (type) {
      case 'prospect':
        return `PROSPECT SNAPSHOT
==================
${companyName}

SITUATION: ${situation}
SEVERITY: ${wizardData.situation?.urgency?.toUpperCase() || 'MEDIUM'}
CONFIDENCE: ${confidenceScore}%

EXECUTIVE SUMMARY
-----------------
${report.sections.executiveBrief.split('\n').slice(0, 10).join('\n')}

KEY METRICS
-----------
• Cash Position: ${wizardData.runwayInputs.cashOnHand || 'N/A'}
• Monthly Burn: ${wizardData.runwayInputs.monthlyBurn || 'N/A'}
• Runway: Computed from inputs

RECOMMENDED ACTION
------------------
Proceed with full diagnostic for detailed analysis.
`;

      case 'executive':
        return `EXECUTIVE SNAPSHOT
==================
${companyName}

SITUATION OVERVIEW
------------------
${report.sections.executiveBrief}

STRATEGIC OPTIONS
-----------------
${report.sections.options.split('\n').slice(0, 15).join('\n')}

EXECUTION PRIORITIES
--------------------
${report.sections.executionPlan.split('\n').slice(0, 10).join('\n')}
`;

      case 'full':
        return `FULL DECISION PACKET
====================
${companyName}

[Full 20-40 page document includes:]

1. SITUATION ANALYSIS
${report.sections.executiveBrief}

2. SCENARIO MODELING
${report.sections.scenarios}

3. STRATEGIC OPTIONS
${report.sections.options}

4. EXECUTION PLAN
${report.sections.executionPlan}

5. EVIDENCE REGISTER
${report.sections.evidenceRegister}
`;

      case 'notebooklm':
        return generateBriefingDocument();

      default:
        return 'Preview not available';
    }
  };

  return (
    <EnterpriseLayout showTransparencyBanner>
      <PageHeader 
        title="Reports & Exports" 
        subtitle="Access diagnostic outputs formatted for executive review, decision support, and downstream briefing."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Reports & Exports' },
        ]}
      />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          {/* Decision Frame */}
          <DecisionFrame 
            whatWeKnowOverride="Available formats reflect the selected artifact depth. All exports are generated from the same underlying diagnostic."
            whyItMattersOverride="Expanded artifacts provide additional synthesis, context, and documentation — not additional computation."
            whatToDoOverride="Select the format appropriate for your intended audience and distribution channel."
          />

          {/* Current Tier Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg border border-accent/30 bg-accent/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TierBadge tier={currentTier} />
                <span className="text-sm text-muted-foreground">
                  {tierConfig.includedExports.length} export format{tierConfig.includedExports.length !== 1 ? 's' : ''} available
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/diagnostic')}>
                Change Tier
              </Button>
            </div>
          </motion.div>

          {/* Export Options */}
          <div className="grid gap-4 mb-8">
            {exportOptions.map((option, index) => {
              const isAvailable = isExportAvailable(option.type, currentTier);
              const actionableFormats = option.formats.filter((f) => f !== 'Preview');

              return (
                <motion.div 
                  key={option.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "enterprise-card p-5",
                    !isAvailable && "opacity-60"
                  )}
                >
                  {isAvailable ? (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExportPreview
                          title={option.title}
                          type={option.type}
                          content={generatePreviewContent(option.type)}
                           formats={actionableFormats}
                           onExport={(format) => handleExport(option, format)}
                        />
                         {actionableFormats.map((format) => (
                          <Button
                            key={format}
                            variant="outline"
                            size="sm"
                             onClick={() => handleExport(option, format)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {format}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{option.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Not included at {tierConfig.name} tier.</span>
                          {' '}This deliverable is available at {TIER_CONFIGURATIONS[option.requiredTier].name} ({TIER_CONFIGURATIONS[option.requiredTier].price}).
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Export Confirmation Text */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="mb-6 p-4 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                The selected report reflects the analytical scope surfaced at the chosen diagnostic tier. 
                Additional analysis has been evaluated but is not included in this deliverable.
              </p>
            </div>
          </motion.div>

          {/* Tier Entitlements Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="enterprise-card p-6 mb-6"
          >
            <TierEntitlements currentTier={currentTier} />
          </motion.div>

          {/* Branding Options */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="enterprise-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Branding Options</h3>
            </div>

            <div className="grid gap-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company name (cover page)</Label>
                <Input 
                  id="companyName" 
                  placeholder="Company Name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logo">Logo Upload</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload logo"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Optional. Used for branded cover page inclusion.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="coverPage" 
                  className="rounded" 
                  checked={includeCover}
                  onChange={(e) => setIncludeCover(e.target.checked)}
                />
                <Label htmlFor="coverPage" className="text-sm cursor-pointer">
                  Include branded cover page
                </Label>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => navigate('/report')}>
              Back to Review
            </Button>
            <Button
              onClick={() => {
                const fullOption = exportOptions.find((o) => o.id === 'full');
                if (!fullOption) return;
                handleExport(fullOption, 'PDF');
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Full Packet
            </Button>
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}
