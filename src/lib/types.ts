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
    description: 'Initial diagnostic summary designed for early screening, qualification, and outreach assessment.',
    includedExports: ['prospect'],
    includedSections: [
      'Executive brief',
      'Key financial indicators',
      'Situation classification',
      'Recommended next steps',
    ],
    excludedSections: [
      'Full value ledger analysis',
      'Scenario modeling',
      'Strategic options matrix',
    ],
  },
  executive: {
    id: 'executive',
    name: 'Executive Snapshot',
    price: '$10,000',
    pageCount: '2–5 pages',
    description: 'Board-ready diagnostic summary highlighting key findings, material risks, and primary strategic considerations.',
    includedExports: ['prospect', 'executive'],
    includedSections: [
      'Executive brief',
      'Value ledger summary',
      'Top scenario outcomes',
      'Strategic options overview',
    ],
    excludedSections: [
      'Full scenario modeling (expanded scenario set)',
      'Detailed execution timeline',
      'Complete evidence register',
    ],
  },
  full: {
    id: 'full',
    name: 'Full Decision Packet',
    price: '$20,000',
    pageCount: '20–40 pages',
    description: 'Comprehensive diagnostic report including full analytical depth, supporting evidence, and execution-level decision documentation.',
    includedExports: ['prospect', 'executive', 'full', 'notebooklm'],
    includedSections: [
      'Executive brief',
      'Complete value ledger',
      'Full scenario modeling',
      'Strategic options matrix',
      'Evidence register',
      'Execution roadmap',
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
