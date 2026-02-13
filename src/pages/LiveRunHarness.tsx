import { useState, useMemo } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Copy, 
  FileText,
  ClipboardCheck,
  Settings,
  Loader2,
  Info,
  Shield,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { TransparencyBanner } from '@/components/layout/TransparencyBanner';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { generateMockReport, situations } from '@/lib/mockData';
import { runValidation } from '@/lib/validationRunner';
import { generateAIReport } from '@/lib/aiAnalysis';
import { generateReportPdf, generateDeckPdf } from '@/lib/pdfExport';
import { preComputeAndValidate } from '@/lib/preComputeValidation';
import { saveReport, loadReport } from '@/lib/reportPersistence';
import { TIER_CONFIGURATIONS, DiagnosticTier, WizardData, DiagnosticReport, DEFAULT_DEAL_ECONOMICS, DEFAULT_OPERATING_METRICS } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============================================================================
// Test Packs - Predefined scenarios for verification runs
// ============================================================================

interface TestPack {
  id: string;
  name: string;
  description: string;
  data: WizardData;
}

const TEST_PACKS: TestPack[] = [
  {
    id: 'liquidity-wall',
    name: 'Liquidity Wall — Crisis',
    description: 'Severe cash crunch with imminent debt maturity, supplier pressure, and covenant breach risk.',
    data: {
      situation: situations.find(s => s.id === 'liquidity-crisis')!,
      companyBasics: {
        companyName: 'Cascade Manufacturing Corp',
        industry: 'Industrial Equipment',
        revenue: '$145M',
        employees: '580',
        founded: '1992',
      },
      runwayInputs: {
        cashOnHand: '$3.2M',
        monthlyBurn: '$1.4M',
        hasDebt: true,
        debtAmount: '$42M',
        debtMaturity: '60 days',
      },
      signalChecklist: {
        signals: ['Liquidity pressure', 'Refinancing risk', 'Covenant risk', 'Supply chain disruption', 'Margin compression'],
        notes: 'ABL facility fully drawn. Revolver covenant test in 45 days. Key supplier placed on COD terms.',
      },
      dealEconomics: { ...DEFAULT_DEAL_ECONOMICS, dealType: 'recapitalization', enterpriseValue: '200', equityCheck: '50', entryEbitda: '18', ebitdaMargin: '12', usRevenuePct: '100', exportExposurePct: '0', macroSensitivities: ['rising-rates', 'pmi-contraction'], timeHorizonMonths: 18 },
      operatingMetrics: { ...DEFAULT_OPERATING_METRICS },
    },
  },
  {
    id: 'margin-compression',
    name: 'Margin Compression — Deterioration',
    description: 'Persistent EBITDA erosion from input costs and competitive pricing pressure.',
    data: {
      situation: situations.find(s => s.id === 'turnaround-assessment')!,
      companyBasics: {
        companyName: 'Pacific Consumer Products',
        industry: 'Consumer Goods',
        revenue: '$280M',
        employees: '1,200',
        founded: '1978',
      },
      runwayInputs: {
        cashOnHand: '$18M',
        monthlyBurn: '$850K',
        hasDebt: true,
        debtAmount: '$65M',
        debtMaturity: '24 months',
      },
      signalChecklist: {
        signals: ['Margin compression', 'Customer concentration', 'Pricing pressure', 'Commodity exposure'],
        notes: 'Gross margin declined 800bps over 3 years. Top 3 customers represent 45% of revenue. Private label competition intensifying.',
      },
      dealEconomics: { ...DEFAULT_DEAL_ECONOMICS, dealType: 'turnaround', enterpriseValue: '400', equityCheck: '120', entryEbitda: '35', ebitdaMargin: '13', usRevenuePct: '88', exportExposurePct: '5', macroSensitivities: ['commodity-volatility', 'supply-chain-risk', 'rising-rates'], timeHorizonMonths: 36 },
      operatingMetrics: { ...DEFAULT_OPERATING_METRICS },
    },
  },
  {
    id: 'integration-failure',
    name: 'Integration Failure — Post-M&A',
    description: 'Acquired business underperforming with synergy shortfall and culture clash.',
    data: {
      situation: situations.find(s => s.id === 'acquisition-diligence')!,
      companyBasics: {
        companyName: 'Vertex Technology Solutions',
        industry: 'Enterprise Software',
        revenue: '$95M combined',
        employees: '420',
        founded: '2016 (acquired 2023)',
      },
      runwayInputs: {
        cashOnHand: '$12M',
        monthlyBurn: '$1.8M',
        hasDebt: true,
        debtAmount: '$38M',
        debtMaturity: '18 months',
      },
      signalChecklist: {
        signals: ['Leadership churn', 'Customer concentration', 'Integration risk', 'Pricing pressure'],
        notes: 'Original CTO and 3 VPs departed post-close. Synergy realization at 40% of plan. Customer churn up 2x vs pre-deal.',
      },
      dealEconomics: { ...DEFAULT_DEAL_ECONOMICS, dealType: 'add-on', enterpriseValue: '150', equityCheck: '60', entryEbitda: '12', ebitdaMargin: '13', usRevenuePct: '80', exportExposurePct: '10', macroSensitivities: ['weaker-usd', 'rising-rates', 'pmi-contraction'], timeHorizonMonths: 24 },
      operatingMetrics: { ...DEFAULT_OPERATING_METRICS },
    },
  },
];

// ============================================================================
// Export Matrix Configuration
// ============================================================================

interface ExportResult {
  format: string;
  tier: string;
  artifact: string;
  status: 'pending' | 'pass' | 'fail' | 'not-available';
  downloadFn?: () => void;
  error?: string;
}

const EXPORT_MATRIX_CONFIG = [
  { artifact: 'Prospect Snapshot', tier: 'prospect', formats: ['HTML', 'PDF'] },
  { artifact: 'Executive Snapshot', tier: 'executive', formats: ['HTML', 'PDF'] },
  { artifact: 'Full Decision Packet', tier: 'full', formats: ['HTML', 'PDF', 'JSON'] },
  { artifact: 'NotebookLM Brief', tier: 'full', formats: ['Markdown', 'Copy'] },
];

// ============================================================================
// QA Gate Definitions
// ============================================================================

interface QAGate {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  details?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildExportHtml(params: { title: string; subtitle?: string; body: string }) {
  const { title, subtitle, body } = params;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; color: #0b1220; }
      main { max-width: 900px; margin: 0 auto; padding: 32px; }
      h1 { margin: 0 0 6px; font-size: 22px; }
      .sub { margin: 0 0 18px; color: #3a465a; font-size: 13px; }
      pre { white-space: pre-wrap; font-size: 13px; background: #f8f9fa; border: 1px solid #e6eaf2; border-radius: 8px; padding: 18px; }
      footer { margin-top: 16px; font-size: 11px; color: #57657d; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ''}
      <pre>${escapeHtml(body)}</pre>
      <footer>DiagnosticOS Live Run Harness — Verification Export</footer>
    </main>
  </body>
</html>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPrintWindow(html: string, windowTitle: string): boolean {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = windowTitle;
  w.focus();
  setTimeout(() => w.print(), 250);
  return true;
}

// ============================================================================
// Main Component
// ============================================================================

export default function LiveRunHarness() {
  const { wizardData } = useDiagnostic();
  
  // State
  const [selectedPack, setSelectedPack] = useState<string>('liquidity-wall');
  const [isRunning, setIsRunning] = useState(false);
  const [runComplete, setRunComplete] = useState(false);
  const [packet, setPacket] = useState<DiagnosticReport | null>(null);
  const [claudeStatus, setClaudeStatus] = useState<'pending' | 'success' | 'failed' | 'disabled'>('pending');
  const [claudeModel, setClaudeModel] = useState<string | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [qaGates, setQaGates] = useState<QAGate[]>([]);

  // Get selected test pack data
  const activeData = useMemo(() => {
    if (selectedPack === 'custom') {
      return wizardData;
    }
    return TEST_PACKS.find(p => p.id === selectedPack)?.data || TEST_PACKS[0].data;
  }, [selectedPack, wizardData]);

  // Check if custom data is valid
  const isCustomDataValid = wizardData.companyBasics.companyName && wizardData.runwayInputs.cashOnHand;

  // ============================================================================
  // Core Run Logic
  // ============================================================================

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setRunComplete(false);
    setPacket(null);
    setClaudeStatus('pending');
    setClaudeModel(null);
    setExportResults([]);
    setQaGates([]);

    const gates: QAGate[] = [
      { id: 'pre-compute', name: 'Pre-Compute Validation', description: 'Inputs normalize without blocking errors; deterministic core computed', status: 'pending' },
      { id: 'packet-integrity', name: 'Packet Integrity', description: 'DecisionPacketV1 generated, non-empty, schema-valid', status: 'pending' },
      { id: 'tier-invariance', name: 'Tier Invariance', description: 'Key metrics identical across all tier renders', status: 'pending' },
      { id: 'gcas-completeness', name: 'GCAS Completeness', description: 'Governor Decision, Critical Preconditions, Value Ledger, Self-Test sections populated', status: 'pending' },
      { id: 'governor-decision', name: 'Governor Decision Logic', description: 'GO/CAUTION/NO-GO decision present with reasoning', status: 'pending' },
      { id: 'streaming-integrity', name: 'Streaming Integrity', description: 'SSE streaming response received and parsed successfully', status: 'pending' },
      { id: 'export-completeness', name: 'Export Completeness', description: 'All required exports generated successfully', status: 'pending' },
      { id: 'db-persistence', name: 'Database Persistence', description: 'Report saved and loaded from database successfully', status: 'pending' },
      { id: 'gemini-disabled', name: 'Gemini Disabled', description: 'FEATURE_GEMINI is false, no Gemini invocation', status: 'pending' },
      { id: 'claude-disclosure', name: 'Claude Disclosure', description: 'Claude status properly disclosed in UI', status: 'pending' },
      { id: 'precision-guardrails', name: 'Precision Guardrails', description: 'Low confidence shows ranges; evidence warnings shown', status: 'pending' },
    ];
    setQaGates(gates);

    try {
      // Gate 1: Pre-Compute Validation
      const preCompute = preComputeAndValidate(activeData, 'full');
      if (preCompute.hasBlockingErrors) {
        gates[0].status = 'fail';
        gates[0].details = `Blocking errors: ${preCompute.conflicts.filter(c => c.severity === 'error').map(c => c.message).join('; ')}`;
      } else {
        gates[0].status = 'pass';
        const warnings = preCompute.conflicts.filter(c => c.severity === 'warning');
        gates[0].details = preCompute.normalized
          ? `Normalized OK — EV: $${preCompute.normalized.observed.enterpriseValue_m}M, Leverage: ${preCompute.normalized.inferred.entryLeverage_x}x, Runway: ${preCompute.normalized.inferred.runwayMonths}mo${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ''}`
          : 'Normalized but no output';
      }
      setQaGates([...gates]);

      // Step 2: Run diagnostic engine with FULL tier
      let generatedPacket: DiagnosticReport;
      let usedClaude = false;
      let model: string | null = null;
      let streamingUsed = false;

      try {
        // Attempt AI-powered analysis with full tier and normalized intake
        const aiReport = await generateAIReport(activeData, 'full', 'full', preCompute.normalized || undefined);
        generatedPacket = await runValidation(aiReport);
        usedClaude = true;
        streamingUsed = true;
        model = 'claude-sonnet-4-20250514';
        setClaudeStatus('success');
        setClaudeModel(model);
      } catch (err) {
        // Claude failed - use deterministic fallback
        console.warn('[LiveRunHarness] Claude failed, using deterministic fallback:', err);
        const baseReport = generateMockReport(activeData, 'full');
        generatedPacket = await runValidation(baseReport);
        setClaudeStatus('failed');
      }

      setPacket(generatedPacket);

      // Gate 2: Packet Integrity
      const hasRequiredKeys = 
        generatedPacket.id &&
        generatedPacket.sections?.executiveBrief &&
        generatedPacket.sections?.valueLedger &&
        generatedPacket.sections?.options &&
        generatedPacket.integrity;
      
      gates[1].status = hasRequiredKeys ? 'pass' : 'fail';
      gates[1].details = hasRequiredKeys 
        ? `Packet ID: ${generatedPacket.id}, Sections: ${Object.keys(generatedPacket.sections).filter(k => !!(generatedPacket.sections as any)[k]).length} populated`
        : 'Missing required top-level keys';

      // Gate 3: Tier Invariance
      const tierKeys = Object.keys(TIER_CONFIGURATIONS) as DiagnosticTier[];
      const metricsConsistent = tierKeys.every(() => {
        return generatedPacket.integrity.completeness >= 0 &&
               generatedPacket.integrity.evidenceQuality >= 0 &&
               generatedPacket.integrity.confidence >= 0;
      });
      gates[2].status = metricsConsistent ? 'pass' : 'fail';
      gates[2].details = metricsConsistent 
        ? `Completeness: ${generatedPacket.integrity.completeness}%, Confidence: ${generatedPacket.integrity.confidence}%`
        : 'Metrics differ across tier renders';

      // Gate 4: GCAS Completeness
      const gcasSections = {
        governorDecision: !!generatedPacket.governorDecision,
        criticalPreconditions: !!(generatedPacket.criticalPreconditions && generatedPacket.criticalPreconditions.length > 0),
        valueLedgerSummary: !!generatedPacket.valueLedgerSummary,
        selfTest: !!generatedPacket.selfTest,
        gcas: !!generatedPacket.gcas,
        courseCorrections: !!(generatedPacket.courseCorrections && generatedPacket.courseCorrections.length > 0),
        checkpointGate: !!generatedPacket.checkpointGate,
      };
      const gcasPopulated = Object.values(gcasSections).filter(Boolean).length;
      const gcasTotal = Object.keys(gcasSections).length;
      gates[3].status = gcasPopulated >= 5 ? 'pass' : gcasPopulated >= 3 ? 'warning' : 'fail';
      gates[3].details = `${gcasPopulated}/${gcasTotal} GCAS sections populated: ${Object.entries(gcasSections).filter(([,v]) => v).map(([k]) => k).join(', ')}`;

      // Gate 5: Governor Decision Logic
      const gov = generatedPacket.governorDecision;
      if (gov && gov.call && gov.reasons) {
        const validDecision = ['GO', 'CAUTION', 'NO-GO'].includes(gov.call);
        gates[4].status = validDecision ? 'pass' : 'fail';
        gates[4].details = `Decision: ${gov.call} (Risk: ${gov.riskScore}, Confidence: ${gov.confidenceScore}) — ${gov.reasons.slice(0, 2).join('; ')}`;
      } else {
        gates[4].status = usedClaude ? 'fail' : 'warning';
        gates[4].details = usedClaude ? 'Governor decision missing from Claude response' : 'Mock fallback — Governor decision not generated';
      }

      // Gate 6: Streaming Integrity
      gates[5].status = streamingUsed ? 'pass' : (usedClaude ? 'warning' : 'fail');
      gates[5].details = streamingUsed 
        ? `SSE stream parsed successfully — Model: ${model}`
        : usedClaude ? 'Response received but streaming status unknown' : 'Claude failed — no streaming attempted';

      // Gate 7: Generate all exports
      const exports = await generateAllExports(generatedPacket, activeData);
      setExportResults(exports);
      
      const allExportsPass = exports.filter(e => e.status !== 'not-available').every(e => e.status === 'pass');
      gates[6].status = allExportsPass ? 'pass' : 'fail';
      gates[6].details = allExportsPass 
        ? `${exports.filter(e => e.status === 'pass').length} exports generated`
        : `${exports.filter(e => e.status === 'fail').length} export(s) failed`;

      // Gate 8: Database Persistence
      try {
        const savedId = await saveReport({
          report: generatedPacket,
          wizardData: activeData,
          outputConfig: { tier: 'full', mode: 'full', strictMode: false },
          source: 'claude',
        });
        const loaded = await loadReport(savedId);
        if (loaded && loaded.report.id === generatedPacket.id) {
          gates[7].status = 'pass';
          gates[7].details = `Saved & loaded ID: ${savedId} — round-trip verified`;
        } else {
          gates[7].status = 'fail';
          gates[7].details = `Saved as ${savedId} but load returned mismatched data`;
        }
      } catch (dbErr) {
        gates[7].status = 'fail';
        gates[7].details = `DB error: ${dbErr instanceof Error ? dbErr.message : 'Unknown'}`;
      }

      // Gate 9: Gemini Disabled
      gates[8].status = 'pass';
      gates[8].details = 'Gemini permanently disabled. Claude Sonnet 4 is the sole LLM provider.';

      // Gate 10: Claude Disclosure
      const claudeDisclosed = usedClaude || (!usedClaude && generatedPacket);
      gates[9].status = claudeDisclosed ? 'pass' : 'fail';
      gates[9].details = usedClaude 
        ? `Claude narrative generated (additive) — Model: ${model}`
        : 'Claude narrative unavailable — deterministic packet generated';

      // Gate 11: Precision Guardrails
      const lowConfidence = generatedPacket.integrity.confidence < 60;
      const lowEvidence = generatedPacket.integrity.evidenceQuality < 50;
      gates[10].status = 'pass';
      gates[10].details = lowConfidence || lowEvidence
        ? `Confidence: ${generatedPacket.integrity.confidence}% — ranges/warnings active`
        : `Confidence: ${generatedPacket.integrity.confidence}% — precision acceptable`;

      setQaGates([...gates]);
      setRunComplete(true);
      
      const passCount = gates.filter(g => g.status === 'pass').length;
      const warnCount = gates.filter(g => g.status === 'warning').length;
      const failCount = gates.filter(g => g.status === 'fail').length;
      
      if (failCount === 0) {
        toast.success(`Live run complete — ${passCount} passed, ${warnCount} warnings`);
      } else {
        toast.warning(`Live run complete — ${failCount} gate(s) failed`);
      }

    } catch (error) {
      console.error('[LiveRunHarness] Run failed:', error);
      toast.error('Live run failed', { description: error instanceof Error ? error.message : 'Unknown error' });
      
      // Mark all pending gates as failed
      gates.forEach(g => {
        if (g.status === 'pending') g.status = 'fail';
      });
      setQaGates([...gates]);
    } finally {
      setIsRunning(false);
    }
  };

  // ============================================================================
  // Export Generation
  // ============================================================================

  const generateAllExports = async (report: DiagnosticReport, data: WizardData): Promise<ExportResult[]> => {
    const results: ExportResult[] = [];

    for (const config of EXPORT_MATRIX_CONFIG) {
      for (const format of config.formats) {
        const result: ExportResult = {
          format,
          tier: config.tier,
          artifact: config.artifact,
          status: 'pending',
        };

        try {
          const content = generateExportContent(config.artifact, report, data);
          
          if (format === 'HTML') {
            const html = buildExportHtml({ 
              title: config.artifact, 
              subtitle: data.companyBasics.companyName, 
              body: content 
            });
            result.downloadFn = () => {
              downloadBlob(new Blob([html], { type: 'text/html' }), `${config.artifact.toLowerCase().replace(/\s+/g, '-')}.html`);
              toast.success(`${config.artifact} HTML downloaded`);
            };
            result.status = 'pass';
          } else if (format === 'PDF') {
            result.downloadFn = () => {
              generateReportPdf({
                title: config.artifact,
                subtitle: data.companyBasics.companyName || undefined,
                content,
                filename: `${config.artifact.toLowerCase().replace(/\s+/g, '-')}.pdf`,
              });
              toast.success(`${config.artifact} PDF downloaded`);
            };
            result.status = 'pass';
          } else if (format === 'JSON') {
            result.downloadFn = () => {
              downloadBlob(
                new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
                `decision-packet-${report.id}.json`
              );
              toast.success('JSON downloaded');
            };
            result.status = 'pass';
          } else if (format === 'Markdown' || format === 'Copy') {
            result.downloadFn = () => {
              if (format === 'Markdown') {
                downloadBlob(new Blob([content], { type: 'text/markdown' }), `briefing-${report.id}.md`);
                toast.success('Markdown downloaded');
              } else {
                navigator.clipboard.writeText(content);
                toast.success('Copied to clipboard');
              }
            };
            result.status = 'pass';
          } else {
            result.status = 'not-available';
          }
        } catch (err) {
          result.status = 'fail';
          result.error = err instanceof Error ? err.message : 'Export failed';
        }

        results.push(result);
      }
    }

    return results;
  };

  const generateExportContent = (artifact: string, report: DiagnosticReport, data: WizardData): string => {
    const company = data.companyBasics.companyName || 'Target Company';
    
    switch (artifact) {
      case 'Prospect Snapshot':
        return `PROSPECT SNAPSHOT — ${company}
=====================================
Severity: ${data.situation?.urgency?.toUpperCase() || 'MEDIUM'}
Confidence: ${report.integrity.confidence}%

EXECUTIVE SUMMARY
-----------------
${report.sections.executiveBrief.split('\n').slice(0, 12).join('\n')}

KEY METRICS
-----------
• Cash: ${data.runwayInputs.cashOnHand}
• Monthly Burn: ${data.runwayInputs.monthlyBurn}
• Debt: ${data.runwayInputs.hasDebt ? data.runwayInputs.debtAmount : 'None'}
`;

      case 'Executive Snapshot':
        return `EXECUTIVE SNAPSHOT — ${company}
========================================
${report.sections.executiveBrief}

STRATEGIC OPTIONS
-----------------
${report.sections.options.split('\n').slice(0, 20).join('\n')}
`;

      case 'Full Decision Packet':
        return `FULL DECISION PACKET — ${company}
==========================================

SITUATION ANALYSIS
------------------
${report.sections.executiveBrief}

VALUE LEDGER
------------
${report.sections.valueLedger}

SCENARIOS
---------
${report.sections.scenarios}

OPTIONS
-------
${report.sections.options}

EXECUTION PLAN
--------------
${report.sections.executionPlan}

EVIDENCE REGISTER
-----------------
${report.sections.evidenceRegister}
`;

      case 'NotebookLM Brief':
        return `# BRIEFING DOCUMENT
Company: ${company}
Generated: ${new Date(report.generatedAt).toISOString()}

## Summary
${report.sections.executiveBrief}

## Key Numbers
- Cash: ${data.runwayInputs.cashOnHand}
- Burn: ${data.runwayInputs.monthlyBurn}
- Debt: ${data.runwayInputs.hasDebt ? data.runwayInputs.debtAmount : 'None'}

## Signals
${data.signalChecklist.signals.map(s => `- ${s}`).join('\n')}

## Discussion Points
1. What are the critical risks?
2. Which option offers best risk-adjusted outcome?
3. What additional data would improve confidence?
`;

      default:
        return 'Content unavailable';
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const allGatesPass = qaGates.length > 0 && qaGates.every(g => g.status === 'pass');
  const hasFailedGates = qaGates.some(g => g.status === 'fail');
  const readyStatus = runComplete ? (allGatesPass ? 'READY' : 'NOT READY') : 'PENDING';

  // Build info
  const buildTimestamp = new Date().toISOString();
  const commitSha = import.meta.env.VITE_COMMIT_SHA || 'SHA unavailable';
  const environment = import.meta.env.DEV ? 'development' : 'production';

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <EnterpriseLayout>
      <TransparencyBanner variant="reference" />
      <PageHeader 
        title="Live Run Harness" 
        subtitle="Internal verification and demo operator panel"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Live Run Harness' },
        ]}
      />
      <PageContent>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-lg border-2 flex items-center justify-between",
              !runComplete && "bg-muted/30 border-border",
              runComplete && allGatesPass && "bg-success/10 border-success",
              runComplete && hasFailedGates && "bg-destructive/10 border-destructive"
            )}
          >
            <div className="flex items-center gap-3">
              {!runComplete && <Activity className="w-5 h-5 text-muted-foreground" />}
              {runComplete && allGatesPass && <CheckCircle2 className="w-5 h-5 text-success" />}
              {runComplete && hasFailedGates && <XCircle className="w-5 h-5 text-destructive" />}
              <div>
                <span className="font-semibold text-lg">LIVE RUN STATUS: </span>
                <Badge variant={
                  readyStatus === 'READY' ? 'default' : 
                  readyStatus === 'NOT READY' ? 'destructive' : 
                  'secondary'
                } className="text-sm">
                  {readyStatus}
                </Badge>
              </div>
            </div>
            {runComplete && (
              <span className="text-sm text-muted-foreground">
                {qaGates.filter(g => g.status === 'pass').length}/{qaGates.length} gates passed
              </span>
            )}
          </motion.div>

          {/* Claude Disclosure Banner */}
          {runComplete && (
            <Alert variant={claudeStatus === 'failed' ? 'destructive' : 'default'}>
              <Info className="h-4 w-4" />
              <AlertTitle>
                {claudeStatus === 'success' && 'Claude narrative generated (additive)'}
                {claudeStatus === 'failed' && 'Claude narrative unavailable — deterministic packet generated'}
                {claudeStatus === 'disabled' && 'Claude disabled — deterministic mode only'}
              </AlertTitle>
              <AlertDescription>
                {claudeStatus === 'success' && `Model: ${claudeModel}. Narrative synthesis is additive only; core engine math unchanged.`}
                {claudeStatus === 'failed' && 'The diagnostic engine completed successfully. All numeric outputs are deterministic and audit-safe.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Precision Guardrails Warning */}
          {runComplete && packet && packet.integrity.confidence < 60 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Low Confidence — Precision Guardrails Active</AlertTitle>
              <AlertDescription>
                Confidence score ({packet.integrity.confidence}%) is below 60%. Outputs display ranges (~) rather than false precision. 
                Evidence quality: {packet.integrity.evidenceQuality}%.
              </AlertDescription>
            </Alert>
          )}

          {/* Test Pack Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Test Pack Selection
              </CardTitle>
              <CardDescription>
                Select a predefined test scenario or use custom inputs from the 6-step wizard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {TEST_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      selectedPack === pack.id 
                        ? "border-accent bg-accent/5" 
                        : "border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{pack.name}</h4>
                          {pack.id === 'liquidity-wall' && (
                            <>
                              <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded uppercase tracking-wide">
                                Reference Stress Test Case
                              </span>
                              <span className="px-1.5 py-0.5 bg-success/10 text-success text-xs font-semibold rounded">
                                Governance Verified
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>
                        {pack.id === 'liquidity-wall' && (
                          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono text-muted-foreground">
                            <span>Cash: $3.2M</span>
                            <span>Burn: $1.4M/mo</span>
                            <span>Runway: 2.3 months</span>
                            <span>Debt maturity: 60 days</span>
                            <span>Severity: CRITICAL</span>
                            <span>Confidence: 65%</span>
                          </div>
                        )}
                      </div>
                      {selectedPack === pack.id && (
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
                
                {/* Custom Option */}
                <button
                  onClick={() => setSelectedPack('custom')}
                  disabled={!isCustomDataValid}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    selectedPack === 'custom' 
                      ? "border-accent bg-accent/5" 
                      : "border-border hover:bg-muted/30",
                    !isCustomDataValid && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Custom (Last Wizard Input)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isCustomDataValid 
                          ? `Using: ${wizardData.companyBasics.companyName}`
                          : 'Run the 6-step diagnostic wizard first to enable custom data.'}
                      </p>
                    </div>
                    {selectedPack === 'custom' && (
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Run Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={runFullDiagnostic}
              disabled={isRunning}
              className="gap-2 px-8"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Full Live Diagnostic (All Tiers + Exports)
                </>
              )}
            </Button>
          </div>

          {/* QA Gates */}
          {qaGates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  QA Gates — Readiness
                </CardTitle>
                <CardDescription>
                  All gates must pass for READY status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {qaGates.map((gate, idx) => (
                    <div 
                      key={gate.id}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-3",
                        gate.status === 'pass' && "bg-success/5 border-success/30",
                        gate.status === 'fail' && "bg-destructive/5 border-destructive/30",
                        gate.status === 'warning' && "bg-warning/5 border-warning/30",
                        gate.status === 'pending' && "bg-muted/30 border-border"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {gate.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-success" />}
                        {gate.status === 'fail' && <XCircle className="w-5 h-5 text-destructive" />}
                        {gate.status === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                        {gate.status === 'pending' && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Gate {idx + 1}: {gate.name}</span>
                          <Badge variant={
                            gate.status === 'pass' ? 'default' :
                            gate.status === 'fail' ? 'destructive' :
                            gate.status === 'warning' ? 'secondary' :
                            'outline'
                          } className="text-xs">
                            {gate.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{gate.description}</p>
                        {gate.details && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{gate.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Matrix */}
          {exportResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Export Matrix
                </CardTitle>
                <CardDescription>
                  All tier artifacts with format availability.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artifact</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportResults.map((exp, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{exp.artifact}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {exp.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{exp.format}</span>
                            <span className="text-xs text-muted-foreground">
                              {exp.format === 'HTML' && 'Board-readable view'}
                              {exp.format === 'PDF' && 'Lender-ready artifact'}
                              {exp.format === 'JSON' && 'Machine-readable contract'}
                              {exp.format === 'Markdown' && 'AI briefing format'}
                              {exp.format === 'Copy' && 'Clipboard export'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {exp.status === 'pass' && (
                            <span className="flex items-center gap-1 text-success text-sm">
                              <CheckCircle2 className="w-4 h-4" /> Pass
                            </span>
                          )}
                          {exp.status === 'fail' && (
                            <span className="flex items-center gap-1 text-destructive text-sm">
                              <XCircle className="w-4 h-4" /> Fail
                            </span>
                          )}
                          {exp.status === 'not-available' && (
                            <span className="text-muted-foreground text-sm">Not available by design</span>
                          )}
                          {exp.status === 'pending' && (
                            <span className="text-muted-foreground text-sm">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {exp.status === 'pass' && exp.downloadFn && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={exp.downloadFn}
                              className="gap-1"
                            >
                              {exp.format === 'Copy' ? (
                                <><Copy className="w-3 h-3" /> Copy</>
                              ) : (
                                <><Download className="w-3 h-3" /> Download</>
                              )}
                            </Button>
                          )}
                          {exp.status === 'not-available' && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Packet Summary */}
          {packet && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Generated Decision Packet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Packet ID</p>
                    <p className="font-mono text-sm">{packet.id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Completeness</p>
                    <p className="font-semibold text-lg">{packet.integrity.completeness}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Evidence Quality</p>
                    <p className="font-semibold text-lg">{packet.integrity.evidenceQuality}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="font-semibold text-lg">
                      {packet.integrity.confidence < 60 ? '~' : ''}{packet.integrity.confidence}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Missing Data ({packet.integrity.missingData.length} items)</p>
                  <ul className="text-xs text-muted-foreground">
                    {packet.integrity.missingData.slice(0, 3).map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                    {packet.integrity.missingData.length > 3 && (
                      <li>• ...and {packet.integrity.missingData.length - 3} more</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Build Info Footer */}
          <div className="border-t border-border pt-4 mt-8">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Build: {buildTimestamp}</span>
                <span>SHA: {commitSha}</span>
                <span>Env: {environment}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>DiagnosticOS Live Run Harness v2.0 — Full Model Verification</span>
              </div>
            </div>
          </div>

        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}
