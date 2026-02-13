import { WizardData, DiagnosticReport, OutputMode, DiagnosticTier, GCASAssessment, CausalImpactRow, SegmentBreakdown, CourseCorrection, CheckpointGate, PortfolioRecommendation, FinancingLeverage, ValueLedgerSummary, CriticalPrecondition, GovernorDecision, SelfTest, ReportProvenance } from './types';

interface AnalysisResult {
  executiveBrief: string;
  valueLedger: string;
  scenarios: string;
  options: string;
  executionPlan: string;
  evidenceRegister: string;
  patternAnalysis?: string;
  causalImpactTable?: string;
  gcasNarrative?: string;
  segmentValueMath?: string;
  courseCorrection?: string;
  checkpointRule?: string;
  financingNarrative?: string;
  preconditionsNarrative?: string;
  governorNarrative?: string;
  selfTestNarrative?: string;
  gcasAssessment?: GCASAssessment;
  causalImpactRows?: CausalImpactRow[];
  segmentBreakdown?: SegmentBreakdown;
  courseCorrections?: CourseCorrection[];
  checkpointGate?: CheckpointGate;
  portfolioRecommendation?: PortfolioRecommendation;
  financingLeverage?: FinancingLeverage;
  valueLedgerSummary?: ValueLedgerSummary;
  criticalPreconditions?: CriticalPrecondition[];
  governorDecision?: GovernorDecision;
  selfTest?: SelfTest;
  integrity: {
    completeness: number;
    evidenceQuality: number;
    confidence: number;
    missingData: string[];
  };
}
// ReportProvenance imported from types.ts

/**
 * Read SSE stream from the edge function and assemble the full text response.
 * Now also captures provenance metadata.
 */
async function readStream(response: Response): Promise<{ text: string; model?: string; usage?: Record<string, unknown>; provenance?: ReportProvenance }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let model: string | undefined;
  let usage: Record<string, unknown> | undefined;
  let provenance: ReportProvenance | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload);
        // Check for error events forwarded from the edge function
        if (parsed.error) {
          console.error('[readStream] Server error:', parsed.error);
          // If we have provenance, attach it to the error so caller can use it
          const err = new Error(`Analysis engine error: ${parsed.error}`);
          (err as any).provenance = provenance;
          throw err;
        }
        if (parsed.provenance) {
          provenance = parsed.provenance;
        }
        if (parsed.text) {
          fullText += parsed.text;
        }
        if (parsed.meta?.model) {
          model = parsed.meta.model;
        }
        if (parsed.usage) {
          usage = parsed.usage;
        }
      } catch (e) {
        // Re-throw known errors, skip parse errors
        if (e instanceof Error && e.message.startsWith('Analysis engine error:')) throw e;
      }
    }
  }

  return { text: fullText, model, usage, provenance };
}

/**
 * Parse a JSON string from Claude's response, handling code-fenced and raw JSON.
 */
function parseAnalysisJson(content: string): AnalysisResult {
  // Step 1: Remove markdown code blocks
  let cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Step 2: Find JSON boundaries
  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  // Step 3: Attempt parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Step 4: Try to fix common issues
    cleaned = cleaned
      .replace(/,\s*}/g, "}") // Remove trailing commas
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, ""); // Remove control characters

    return JSON.parse(cleaned);
  }
}

export async function generateAIReport(
  wizardData: WizardData, 
  outputMode: OutputMode,
  tier: DiagnosticTier = 'full',
  normalizedIntake?: object,
  simulateOverload?: boolean
): Promise<DiagnosticReport> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-diagnostic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ wizardData, outputMode, tier, normalizedIntake, simulateOverload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  let analysis: AnalysisResult;
  let provenance: ReportProvenance | undefined;

  if (contentType.includes('text/event-stream')) {
    const streamResult = await readStream(response);
    provenance = streamResult.provenance;
    
    if (!streamResult.text) {
      // AI failed but we have provenance — throw with provenance attached
      const err = new Error('Empty response from analysis engine');
      (err as any).provenance = provenance;
      throw err;
    }
    try {
      analysis = parseAnalysisJson(streamResult.text);
    } catch (parseError) {
      console.error('Failed to parse streamed response as JSON:', parseError);
      const err = new Error('Analysis completed but response could not be parsed. Please retry.');
      (err as any).provenance = provenance;
      throw err;
    }
  } else {
    const data = await response.json();
    if (!data.success || !data.analysis) {
      throw new Error(data.error || 'Failed to generate analysis');
    }
    analysis = data.analysis;
  }

  return {
    id: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    outputMode,
    provenance: provenance || {
      ai_status: 'STREAM_OK',
      model_used: 'unknown',
      retry_count: 0,
      fail_reason: 'none',
      timestamp: new Date().toISOString(),
      tier: tier.toUpperCase(),
    },
    integrity: {
      completeness: analysis.integrity.completeness,
      evidenceQuality: analysis.integrity.evidenceQuality,
      confidence: analysis.integrity.confidence,
      missingData: analysis.integrity.missingData,
    },
    sections: {
      executiveBrief: analysis.executiveBrief,
      valueLedger: analysis.valueLedger,
      scenarios: analysis.scenarios,
      options: analysis.options,
      executionPlan: analysis.executionPlan,
      evidenceRegister: analysis.evidenceRegister,
      patternAnalysis: analysis.patternAnalysis,
      causalImpactTable: analysis.causalImpactTable,
      gcasNarrative: analysis.gcasNarrative,
      segmentValueMath: analysis.segmentValueMath,
      courseCorrection: analysis.courseCorrection,
      checkpointRule: analysis.checkpointRule,
      financingNarrative: analysis.financingNarrative,
      preconditionsNarrative: analysis.preconditionsNarrative,
      governorNarrative: analysis.governorNarrative,
      selfTestNarrative: analysis.selfTestNarrative,
    },
    gcas: analysis.gcasAssessment,
    causalImpactRows: analysis.causalImpactRows,
    segmentBreakdown: analysis.segmentBreakdown,
    courseCorrections: analysis.courseCorrections,
    checkpointGate: analysis.checkpointGate,
    portfolioRecommendation: analysis.portfolioRecommendation,
    financingLeverage: analysis.financingLeverage,
    valueLedgerSummary: analysis.valueLedgerSummary,
    criticalPreconditions: analysis.criticalPreconditions,
    governorDecision: analysis.governorDecision,
    selfTest: analysis.selfTest,
    inputSummary: generateInputSummary(wizardData),
    rawJson: wizardData,
  };
}

function generateInputSummary(wizardData: WizardData): string {
  const de = wizardData.dealEconomics;
  const ev = parseFloat(de.enterpriseValue || '0');
  const eq = parseFloat(de.equityCheck || '0');
  const ebitda = parseFloat(de.entryEbitda || '1');
  const debt = ev > 0 && eq > 0 ? ev - eq : 0;
  const leverage = debt > 0 && ebitda > 0 ? (debt / ebitda).toFixed(2) : '?';
  const multiple = ev > 0 && ebitda > 0 ? (ev / ebitda).toFixed(2) : '?';
  const cash = parseFloat(wizardData.runwayInputs.cashOnHand || '0');
  const burn = parseFloat(wizardData.runwayInputs.monthlyBurn || '0');
  const runway = burn > 0 ? (cash / burn).toFixed(1) : '?';

  return `**Company**: ${wizardData.companyBasics.companyName || 'Not specified'}
**Industry**: ${wizardData.companyBasics.industry || 'Not specified'}
**Revenue**: ${wizardData.companyBasics.revenue || 'Not specified'}
**Employees**: ${wizardData.companyBasics.employees || 'Not specified'}
**Founded**: ${wizardData.companyBasics.founded || 'Not specified'}

**Situation**: ${wizardData.situation?.title || 'Not specified'}
**Urgency**: ${wizardData.situation?.urgency || 'Not specified'}

**Financial Position (Observed)**:
- Cash on Hand: $${wizardData.runwayInputs.cashOnHand || '?'}M
- Monthly Burn: $${wizardData.runwayInputs.monthlyBurn || '?'}M
- Debt: ${wizardData.runwayInputs.hasDebt ? `$${wizardData.runwayInputs.debtAmount || debt.toFixed(1)}M (${wizardData.runwayInputs.debtMaturity || '?'} months to maturity)` : 'None'}

**Deal Economics (Observed)**:
- Deal Type: ${de.dealType || 'Not specified'}${de.dealType === 'other' ? ` (${de.dealTypeOther})` : ''}
- Enterprise Value: $${de.enterpriseValue || '?'}M
- Equity Check: $${de.equityCheck || '?'}M
- Entry EBITDA: $${de.entryEbitda || '?'}M
- EBITDA Margin: ${de.ebitdaMargin || '?'}%

**Computed (Deterministic)**:
- Total Debt: $${debt.toFixed(1)}M (EV − Equity)
- Entry Leverage: ${leverage}x (Debt ÷ EBITDA)
- Entry Multiple: ${multiple}x (EV ÷ EBITDA)
- Runway: ${runway} months (Cash ÷ Burn)
- US Revenue: ${de.usRevenuePct || '?'}%
- Non-US Revenue: ${100 - parseFloat(de.usRevenuePct || '0')}%
- Export Exposure: ${de.exportExposurePct || '?'}%
- Macro Sensitivities: ${de.macroSensitivities?.join(', ') || 'None'}
- Time Horizon: ${de.timeHorizonMonths || 36} months

**Signals Identified**: ${wizardData.signalChecklist.signals.join(', ') || 'None selected'}

**Additional Notes**: ${wizardData.signalChecklist.notes || 'None provided'}`;
}
