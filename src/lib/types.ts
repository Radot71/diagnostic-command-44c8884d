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
    description: '1-page executive triage that tells you whether you are at risk, how much it is costing you, and what to do first.',
    includedExports: ['prospect'],
    includedSections: [
      'Situation in Plain English',
      'If You Do Nothing (3 quantified risks)',
      'First 7 Days (Urgent Moves)',
      'Key financial indicators',
    ],
    excludedSections: [
      'Full scenario modeling',
      '30/90-day roadmap',
      'Board deck',
      'Stakeholder materials',
    ],
  },
  executive: {
    id: 'executive',
    name: 'Executive Snapshot',
    price: '$10,000',
    pageCount: '2–5 pages',
    description: '2–5 page board-ready briefing with scenarios, quantified options, and a 30-day action plan.',
    includedExports: ['prospect', 'executive'],
    includedSections: [
      'Executive summary',
      'Financial impact (valueLedger)',
      'Scenarios in plain English',
      'Options comparison table',
      '30-day high-level plan',
    ],
    excludedSections: [
      'Full 90-day roadmap',
      'Board slide deck',
      'Stakeholder pack templates',
    ],
  },
  full: {
    id: 'full',
    name: 'Full Decision Packet',
    price: '$20,000',
    pageCount: '20–40 pages',
    description: 'Comprehensive institutional diagnostic including full audit trail, 30/90 roadmap, board deck, and stakeholder materials.',
    includedExports: ['prospect', 'executive', 'full', 'notebooklm'],
    includedSections: [
      'Full board deck (10 slides)',
      '30/90-day execution roadmap',
      'Stakeholder pack (Board, Investor, CFO)',
      'Complete evidence register',
      'Full scenario modeling',
      'Strategic options matrix',
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

/** Source of the diagnostic report */
export type ReportSource = 'claude' | 'demo' | 'upload' | 'reference';
