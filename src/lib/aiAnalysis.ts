import { WizardData, DiagnosticReport, OutputMode, DiagnosticTier } from './types';

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
    gcasNarrative?: string;
    courseCorrection?: string;
    gcasAssessment?: {
      score: 'HIGH' | 'MEDIUM' | 'LOW';
      revenueOutsideUS: boolean | null;
      emergingMarketExposure: boolean | null;
      weakerDollarImpact: 'help' | 'hurt' | 'neutral' | null;
      ebitdaRiskRange?: string;
      financingRisk?: string;
      exitMultipleRisk?: string;
    };
    courseCorrections?: Array<{
      what: string;
      why: string;
      owner: 'CFO' | 'CRO' | 'COO' | 'CEO';
      timeline: '30 days' | '60 days' | '90 days';
    }>;
    portfolioRecommendation?: {
      action: 'Reposition' | 'Accelerate exit' | 'Restructure';
      rationale: string;
    };
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
      gcasNarrative: analysis.gcasNarrative,
      courseCorrection: analysis.courseCorrection,
    },
    gcas: analysis.gcasAssessment,
    courseCorrections: analysis.courseCorrections,
    portfolioRecommendation: analysis.portfolioRecommendation,
    inputSummary: generateInputSummary(wizardData),
    rawJson: wizardData,
  };
}

function generateInputSummary(wizardData: WizardData): string {
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

**Signals Identified**: ${wizardData.signalChecklist.signals.join(', ') || 'None selected'}

**Additional Notes**: ${wizardData.signalChecklist.notes || 'None provided'}`;
}
