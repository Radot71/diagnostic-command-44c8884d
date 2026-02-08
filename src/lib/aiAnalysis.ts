import { WizardData, DiagnosticReport, OutputMode, DiagnosticTier, GCASAssessment, CausalImpactRow, SegmentBreakdown, CourseCorrection, CheckpointGate, PortfolioRecommendation, FinancingLeverage, ValueLedgerSummary, CriticalPrecondition, GovernorDecision, SelfTest } from './types';

interface AnalysisResponse {
  success: boolean;
  analysis?: {
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
  };
  error?: string;
  rawContent?: string;
}

export async function generateAIReport(
  wizardData: WizardData, 
  outputMode: OutputMode,
  tier: DiagnosticTier = 'full'
): Promise<DiagnosticReport> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-diagnostic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ wizardData, outputMode, tier }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
  }

  const data: AnalysisResponse = await response.json();

  if (!data.success || !data.analysis) {
    throw new Error(data.error || 'Failed to generate analysis');
  }

  const analysis = data.analysis;

  return {
    id: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    outputMode,
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
  const debtDisplay = de.totalDebt || (parseFloat(de.enterpriseValue || '0') - parseFloat(de.equityCheck || '0')).toFixed(1);
  const leverageDisplay = de.entryLeverage || (parseFloat(debtDisplay || '0') / parseFloat(de.entryEbitda || '1')).toFixed(1);

  return `**Company**: ${wizardData.companyBasics.companyName || 'Not specified'}
**Industry**: ${wizardData.companyBasics.industry || 'Not specified'}
**Revenue**: ${wizardData.companyBasics.revenue || 'Not specified'}
**Employees**: ${wizardData.companyBasics.employees || 'Not specified'}
**Founded**: ${wizardData.companyBasics.founded || 'Not specified'}

**Situation**: ${wizardData.situation?.title || 'Not specified'}
**Urgency**: ${wizardData.situation?.urgency || 'Not specified'}

**Financial Position**:
- Cash on Hand: ${wizardData.runwayInputs.cashOnHand || 'Not specified'}
- Monthly Burn: ${wizardData.runwayInputs.monthlyBurn || 'Not specified'}
- Debt: ${wizardData.runwayInputs.hasDebt ? `${wizardData.runwayInputs.debtAmount} (${wizardData.runwayInputs.debtMaturity} to maturity)` : 'None'}

**Deal Economics**:
- Deal Type: ${de.dealType || 'Not specified'}${de.dealType === 'other' ? ` (${de.dealTypeOther})` : ''}
- Enterprise Value: $${de.enterpriseValue || '?'}M
- Equity Check: $${de.equityCheck || '?'}M
- Total Debt: $${debtDisplay}M
- Entry EBITDA: $${de.entryEbitda || '?'}M
- Entry Leverage: ${leverageDisplay}x
- EBITDA Margin: ${de.ebitdaMargin || '?'}%
- US Revenue: ${de.usRevenuePct || '?'}%
- Non-US Revenue: ${100 - parseFloat(de.usRevenuePct || '0')}%
- Export Exposure: ${de.exportExposurePct || '?'}%
- Macro Sensitivities: ${de.macroSensitivities?.join(', ') || 'None'}
- Time Horizon: ${de.timeHorizonMonths || 36} months

**Signals Identified**: ${wizardData.signalChecklist.signals.join(', ') || 'None selected'}

**Additional Notes**: ${wizardData.signalChecklist.notes || 'None provided'}`;
}
