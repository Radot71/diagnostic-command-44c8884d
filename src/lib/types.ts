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

export type DealType = 'add-on' | 'platform-buyout' | 'carve-out' | 'recapitalization' | 'turnaround' | 'growth-investment' | 'other';

export type MacroSensitivity =
  | 'weaker-usd'
  | 'stronger-usd'
  | 'rising-rates'
  | 'falling-rates'
  | 'pmi-contraction'
  | 'pmi-expansion'
  | 'supply-chain-risk'
  | 'commodity-volatility';

export type TimeHorizonMonths = 18 | 24 | 36 | 48;

export interface DealEconomics {
  dealType: DealType | '';
  dealTypeOther: string;
  enterpriseValue: string;
  equityCheck: string;
  totalDebt: string;
  entryEbitda: string;
  entryLeverage: string;
  ebitdaMargin: string;
  usRevenuePct: string;
  nonUsRevenuePct: string;
  exportExposurePct: string;
  macroSensitivities: MacroSensitivity[];
  timeHorizonMonths: TimeHorizonMonths;
}

export interface OperatingMetrics {
  annualEbitda: string;
  grossMargin: string;
  revenueGrowthYoY: string;
}

export const DEFAULT_OPERATING_METRICS: OperatingMetrics = {
  annualEbitda: '',
  grossMargin: '',
  revenueGrowthYoY: '',
};

export interface WizardData {
  situation: Situation | null;
  companyBasics: CompanyBasics;
  runwayInputs: RunwayInputs;
  signalChecklist: SignalChecklist;
  dealEconomics: DealEconomics;
  operatingMetrics: OperatingMetrics;
}

export const DEFAULT_DEAL_ECONOMICS: DealEconomics = {
  dealType: '',
  dealTypeOther: '',
  enterpriseValue: '',
  equityCheck: '',
  totalDebt: '',
  entryEbitda: '',
  entryLeverage: '',
  ebitdaMargin: '',
  usRevenuePct: '',
  nonUsRevenuePct: '',
  exportExposurePct: '',
  macroSensitivities: [],
  timeHorizonMonths: 36,
};

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

/** GCAS v2 (Global Currency & Asset Sensitivity) score */
export type GCASScore = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GCASAssessment {
  score: GCASScore;
  revenueOutsideUS: boolean | null;
  emergingMarketExposure: boolean | null;
  weakerDollarImpact: 'help' | 'hurt' | 'neutral' | null;
  /** One-sentence GCAS explanation */
  explanation?: string;
  /** Risk warning (only if LOW) */
  riskWarning?: string | null;
  /** @deprecated v1 fields kept for backward compat */
  ebitdaRiskRange?: string;
  financingRisk?: string;
  exitMultipleRisk?: string;
}

/** ROOM 3 — Causal Impact row for a business type */
export interface CausalImpactRow {
  businessType: string;
  direction: 'Tailwind' | 'Headwind' | 'Mixed';
  marginDirection: 'Expanding' | 'Compressing' | 'Stable';
  financingPressure: 'Low' | 'Moderate' | 'High';
}

/** Upgrade A+B — Segment-level EBITDA breakdown */
export interface SegmentBreakdown {
  usRevenue: string;
  internationalRevenue: string;
  exportImpact: string;
  commodityCost: string;
  netEbitdaRange: string;
  leverageImpact: string;
}

/** Upgrade D — 6-12 month checkpoint gate */
export interface CheckpointGate {
  timeframe: string;
  stayCondition: string;
  exitCondition: string;
  metrics: string[];
}

export interface CourseCorrection {
  what: string;
  why: string;
  owner: 'CFO' | 'CRO' | 'COO' | 'CEO';
  timeline: '30 days' | '60 days' | '90 days';
  /** v2: Measurable outcome */
  kpi?: string;
  /** v2: % of revenue or cost base affected */
  scope?: string;
}

export interface PortfolioRecommendation {
  action: 'Reposition' | 'Accelerate exit' | 'Restructure';
  rationale: string;
  conditionalFollowOn?: string;
}

/** SECTION 7 — CFO-Grade Value Ledger */
export interface ValueLedgerEntry {
  item: string;
  base: string;
  bear: string;
  tail: string;
}

export interface ValueLedgerSummary {
  entries: ValueLedgerEntry[];
  downsideAtRisk: string;
  expectedDrawdownBand: string;
  covenantBreachLikelihood: 'Low' | 'Medium' | 'High' | 'UNKNOWN';
  refiRiskLikelihood: 'Low' | 'Medium' | 'High' | 'UNKNOWN';
  exitMultipleCompressionRisk: 'Low' | 'Medium' | 'High' | 'UNKNOWN';
}

/** SECTION 6 — Financing & Leverage */
export interface FinancingLeverage {
  refiCostIncreaseBps: string;
  covenantPressure: 'Low' | 'Medium' | 'High';
  leverageImpact: string;
  exitMultipleTurnsImpact: string;
}

/** SECTION 8 — Critical Preconditions */
export interface CriticalPrecondition {
  name: string;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  whyItMatters: string;
}

/** SECTION 12 — Governor Decision */
export interface GovernorDecision {
  call: 'GO' | 'CAUTION' | 'NO-GO';
  riskScore: number;
  confidenceScore: number;
  reasons: string[];
}

/** SECTION 13 — Self-Test */
export interface SelfTest {
  mostUncertainArea: string;
  mostFragileAssumption: string;
  noGoTrigger: string;
  singleMitigation: string;
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
    /** ROOM 2 — Patterns (historical precedents) */
    patternAnalysis?: string;
    /** ROOM 3 — Causal impact table (markdown) */
    causalImpactTable?: string;
    /** ROOM 4 — GCAS narrative */
    gcasNarrative?: string;
    /** Upgrade A+B — Segment-level value math + leverage */
    segmentValueMath?: string;
    /** Upgrade C — 90-day course correction narrative */
    courseCorrection?: string;
    /** Upgrade D — 6-12 month checkpoint rule */
    checkpointRule?: string;
    /** SECTION 6 — Financing & leverage narrative */
    financingNarrative?: string;
    /** SECTION 8 — Critical preconditions narrative */
    preconditionsNarrative?: string;
    /** SECTION 12 — Governor decision narrative */
    governorNarrative?: string;
    /** SECTION 13 — Self-test narrative */
    selfTestNarrative?: string;
  };
  /** Structured GCAS assessment */
  gcas?: GCASAssessment;
  /** Structured causal impact rows (ROOM 3) */
  causalImpactRows?: CausalImpactRow[];
  /** Structured segment breakdown (Upgrade A+B) */
  segmentBreakdown?: SegmentBreakdown;
  /** Structured course corrections with KPI/scope */
  courseCorrections?: CourseCorrection[];
  /** Structured checkpoint gate (Upgrade D) */
  checkpointGate?: CheckpointGate;
  /** Portfolio recommendation */
  portfolioRecommendation?: PortfolioRecommendation;
  /** SECTION 6 — Structured financing & leverage */
  financingLeverage?: FinancingLeverage;
  /** SECTION 7 — CFO-grade value ledger */
  valueLedgerSummary?: ValueLedgerSummary;
  /** SECTION 8 — Critical preconditions */
  criticalPreconditions?: CriticalPrecondition[];
  /** SECTION 12 — Governor decision */
  governorDecision?: GovernorDecision;
  /** SECTION 13 — Self-test */
  selfTest?: SelfTest;
  inputSummary: string;
  rawJson: object;
  /** Optional validation metadata from ValidationRunner - safe to ignore */
  validation?: ValidationMetadata;
}

/** Source of the diagnostic report */
export type ReportSource = 'claude' | 'demo' | 'upload' | 'reference';
