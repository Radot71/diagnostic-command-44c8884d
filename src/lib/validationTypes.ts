/**
 * Validation Types for Multi-Pass Diagnostic Validation
 * 
 * These types define the validation layer that wraps existing Decision Packets.
 * The validation layer ONLY adds metadata - it does not modify the core schema.
 */

import { EnsembleMode } from './ensembleConfig';
import { DiagnosticReport } from './types';

/**
 * Validation lens identifiers for multi-pass execution
 * These analyze an existing Decision Packet rather than generating new content
 */
export type ValidationLens = 
  | 'CONSISTENCY_LENS'
  | 'AUDIT_LENS'
  | 'SYNTHESIS_LENS'
  | 'RISK_LENS'
  | 'VALUE_LENS';

/**
 * Lens definition for validation passes
 */
export interface ValidationLensDefinition {
  id: ValidationLens;
  name: string;
  description: string;
  checkInstructions: string;
}

/**
 * Result from a single validation lens pass
 */
export interface ValidationLensResult {
  lensId: ValidationLens;
  success: boolean;
  findings: ValidationFinding[];
  score: number; // 0..1 for this lens
  executionTimeMs: number;
  error?: string;
}

/**
 * Individual finding from a validation lens
 */
export interface ValidationFinding {
  type: 'consistency' | 'citation' | 'evidence' | 'risk' | 'value';
  severity: 'info' | 'warning' | 'error';
  field: string;
  message: string;
  relatedFields?: string[];
}

/**
 * Field diff for tracking disagreements
 */
export interface FieldDiff {
  field: string;
  issue: string;
  expected?: string;
  actual?: string;
}

/**
 * Validation metadata - ADDITIVE to meta object
 * This is the ONLY change to the Decision Packet schema
 */
export interface ValidationMetadata {
  ensembleMode: EnsembleMode;
  consensusScore: number; // 0..1
  evidenceScore: number; // 0..1
  materialDisagreement: boolean;
  disagreementNotes: string[];
  followUpQuestions: string[];
  fieldDiffs: FieldDiff[];
}

/**
 * Developer QA output for console/panel
 */
export interface ValidationQAOutput {
  timestamp: string;
  config: {
    mode: EnsembleMode;
    passCount: number;
  };
  validation: ValidationMetadata;
  lensResults: Array<{
    lensId: ValidationLens;
    success: boolean;
    score: number;
    findingsCount: number;
    timeMs: number;
  }>;
}

/**
 * 3-Pass validation lenses
 */
export const THREE_PASS_VALIDATION_LENSES: ValidationLensDefinition[] = [
  {
    id: 'CONSISTENCY_LENS',
    name: 'Consistency Check',
    description: 'Verify internal consistency across all Decision Packet sections',
    checkInstructions: `Check internal consistency across:
- situation.whyNow aligns with timePressureDays
- valueLedger numbers are referenced in decisionRationale
- constraints.dataGaps are acknowledged in recommendations
- decision.recommendedOptionIds match options actually defined
- executionPlan references correct option IDs`,
  },
  {
    id: 'AUDIT_LENS',
    name: 'Audit Check',
    description: 'Verify claims have proper evidence citations',
    checkInstructions: `Verify evidence provenance:
- Every major claim in sections references source data
- Identify statements marked [ASSUMED] vs [OBSERVED] vs [COMPUTED]
- Flag claims without clear data lineage
- Check if provenance tags match actual evidence quality
- Identify "invented" claims not supported by inputs`,
  },
  {
    id: 'SYNTHESIS_LENS',
    name: 'Synthesis Check',
    description: 'Produce final validation scores and follow-up questions',
    checkInstructions: `Synthesize validation findings:
- Calculate consensus score based on consistency findings
- Calculate evidence score based on citation coverage
- Determine if material disagreement exists
- Generate targeted follow-up questions for data gaps
- Produce final validation metadata`,
  },
];

/**
 * 5-Pass validation lenses (adds RISK_LENS and VALUE_LENS)
 */
export const FIVE_PASS_VALIDATION_LENSES: ValidationLensDefinition[] = [
  ...THREE_PASS_VALIDATION_LENSES.slice(0, 2), // CONSISTENCY and AUDIT
  {
    id: 'RISK_LENS',
    name: 'Risk Alignment Check',
    description: 'Verify risks are properly addressed in options and constraints',
    checkInstructions: `Check risk alignment:
- Risks listed are addressed by at least one option
- Constraints properly limit available options
- Risk severity matches recommended action urgency
- Downside scenarios reflect stated risks
- Missing risk coverage is flagged`,
  },
  {
    id: 'VALUE_LENS',
    name: 'Value Alignment Check',
    description: 'Verify decision aligns with value metrics and data gaps',
    checkInstructions: `Check value alignment:
- Recommended options align with recoverableValue potential
- ROI calculations reference actual valueLedger figures
- Data gaps in value-critical areas are acknowledged
- Upside scenarios reflect value creation levers
- Decision rationale references value metrics`,
  },
  THREE_PASS_VALIDATION_LENSES[2], // SYNTHESIS
];

/**
 * Data gap field mappings for follow-up question generation
 */
export const DATA_GAP_FIELD_MAP: Record<string, string> = {
  'financials.revenue': 'What is the current annual revenue and monthly trend?',
  'financials.costs': 'What is the current cost structure breakdown (fixed vs variable)?',
  'financials.cash': 'What is the current cash position and burn rate?',
  'financials.debt': 'What are the outstanding debt obligations and covenants?',
  'operational.headcount': 'What is the current headcount and organizational structure?',
  'operational.focusTime': 'What percentage of management time is available for strategic initiatives?',
  'operational.systems': 'What are the critical operational systems and their condition?',
  'market.competition': 'Who are the primary competitors and what is the competitive position?',
  'market.customers': 'What is the customer concentration and churn rate?',
  'market.pricing': 'What is the pricing power and margin trajectory?',
  'governance.board': 'What is the board composition and decision-making process?',
  'governance.management': 'What is management tenure and succession readiness?',
};
