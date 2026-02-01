export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type SituationCategory = 'distress' | 'transaction' | 'growth' | 'governance';

export interface Situation {
  id: string;
  title: string;
  description: string;
  category: SituationCategory;
  urgency: UrgencyLevel;
  icon: string;
}

export interface CompanyBasics {
  companyName: string;
  industry: string;
  revenue: string;
  employees: string;
  founded: string;
}

export interface RunwayInputs {
  cashOnHand: string;
  monthlyBurn: string;
  hasDebt: boolean;
  debtAmount: string;
  debtMaturity: string;
}

export interface SignalChecklist {
  signals: string[];
  notes: string;
}

export interface WizardData {
  situation: Situation | null;
  companyBasics: CompanyBasics;
  runwayInputs: RunwayInputs;
  signalChecklist: SignalChecklist;
}

export type OutputMode = 'snapshot' | 'rapid' | 'full';

/** Commercial diagnostic tiers */
export type DiagnosticTier = 'prospect' | 'executive' | 'full';

export interface TierConfig {
  id: DiagnosticTier;
  name: string;
  price: string;
  pageCount: string;
  description: string;
  includedExports: ('prospect' | 'executive' | 'full' | 'notebooklm')[];
  includedSections: string[];
  excludedSections: string[];
}

export const TIER_CONFIGURATIONS: Record<DiagnosticTier, TierConfig> = {
  prospect: {
    id: 'prospect',
    name: 'Prospect Snapshot',
    price: '$2,500',
    pageCount: '1 page',
    description: 'Initial assessment for deal screening and outreach qualification',
    includedExports: ['prospect'],
    includedSections: [
      'Executive Brief',
      'Key Financial Indicators',
      'Situation Classification',
      'Recommended Next Steps',
    ],
    excludedSections: [
      'Full Value Ledger Analysis',
      'Scenario Modeling',
      'Strategic Options Matrix',
      'Detailed Execution Plan',
      'Complete Evidence Register',
      'NotebookLM Briefing',
    ],
  },
  executive: {
    id: 'executive',
    name: 'Executive Snapshot',
    price: '$10,000',
    pageCount: '2–5 pages',
    description: 'Board-ready summary with key findings, risks, and strategic options',
    includedExports: ['prospect', 'executive'],
    includedSections: [
      'Executive Brief',
      'Value Ledger Summary',
      'Top 3 Scenarios',
      'Strategic Options Overview',
      'Key Evidence Citations',
      'Execution Priorities',
    ],
    excludedSections: [
      'Full Scenario Modeling (10+ scenarios)',
      'Detailed Execution Timeline',
      'Complete Evidence Register',
      'NotebookLM Briefing',
      'Raw JSON Export',
    ],
  },
  full: {
    id: 'full',
    name: 'Full Decision Packet',
    price: '$20,000',
    pageCount: '20–40 pages',
    description: 'Comprehensive diagnostic with full analysis, evidence, and execution roadmap',
    includedExports: ['prospect', 'executive', 'full', 'notebooklm'],
    includedSections: [
      'Executive Brief',
      'Complete Value Ledger',
      'Full Scenario Modeling',
      'Strategic Options Matrix',
      'Detailed Execution Plan',
      'Complete Evidence Register',
      'NotebookLM Briefing Document',
      'Raw JSON Data Export',
    ],
    excludedSections: [],
  },
};

export interface OutputConfig {
  mode: OutputMode;
  strictMode: boolean;
  tier: DiagnosticTier;
}

export interface IntegrityMetrics {
  completeness: number;
  evidenceQuality: number;
  confidence: number;
  missingData: string[];
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
}

/** Field diff for validation findings */
export interface FieldDiff {
  field: string;
  issue: string;
  expected?: string;
  actual?: string;
}

/** Validation metadata schema - additive to Decision Packet */
export interface ValidationMetadata {
  ensembleMode: 'off' | '3pass' | '5pass';
  consensusScore: number; // 0..1
  evidenceScore: number; // 0..1
  materialDisagreement: boolean;
  disagreementNotes: string[];
  followUpQuestions: string[];
  fieldDiffs: FieldDiff[];
}

export interface DiagnosticReport {
  id: string;
  generatedAt: string;
  outputMode: OutputMode;
  integrity: IntegrityMetrics;
  sections: {
    executiveBrief: string;
    valueLedger: string;
    scenarios: string;
    options: string;
    executionPlan: string;
    evidenceRegister: string;
  };
  inputSummary: string;
  rawJson: object;
  /** Optional validation metadata from ValidationRunner - safe to ignore */
  validation?: ValidationMetadata;
}
