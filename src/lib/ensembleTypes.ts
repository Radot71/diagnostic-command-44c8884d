/**
 * Ensemble Validation Types
 * 
 * Type definitions for the multi-pass diagnostic validation system.
 * These types extend the existing Decision Packet schema without breaking it.
 */

import { DiagnosticReport, IntegrityMetrics } from './types';
import { EnsembleMode } from './ensembleConfig';

/**
 * Role lens identifiers for multi-pass execution
 */
export type RoleLens = 
  | 'CORE_DIAGNOSTIC'
  | 'RISK_AUDIT'
  | 'VALUE_LENS'
  | 'AUDIT_LENS'
  | 'SYNTHESIS';

/**
 * Pass definition for ensemble execution
 */
export interface PassDefinition {
  id: RoleLens;
  name: string;
  description: string;
  systemPromptModifier: string;
}

/**
 * Result from a single pass execution
 */
export interface PassResult {
  passId: RoleLens;
  success: boolean;
  report: DiagnosticReport | null;
  error?: string;
  executionTimeMs: number;
}

/**
 * Validation metadata - OPTIONAL extension to Decision Packet
 * Safe to ignore by UI, stored alongside report
 */
export interface ValidationMetadata {
  ensemble_mode: EnsembleMode;
  consensus_score: number; // 0..1
  evidence_score: number; // 0..1
  material_disagreement: boolean;
  disagreement_notes: string[];
  pass_count: number;
  passes_completed: number;
  fallback_used: boolean;
  execution_time_total_ms: number;
}

/**
 * Field comparison result for merge reconciliation
 */
export interface FieldComparison {
  field: string;
  values: string[];
  variance: number;
  agreementScore: number;
  selectedValue: string;
  selectionReason: string;
}

/**
 * Merge result containing reconciled data and analysis
 */
export interface MergeResult {
  finalReport: DiagnosticReport;
  validation: ValidationMetadata;
  fieldComparisons: FieldComparison[];
}

/**
 * Developer QA output for console/panel
 */
export interface EnsembleQAOutput {
  timestamp: string;
  config: {
    mode: EnsembleMode;
    passCount: number;
  };
  validation: ValidationMetadata;
  keyFieldDiffs: FieldComparison[];
  passResults: Array<{
    passId: RoleLens;
    success: boolean;
    timeMs: number;
  }>;
}

/**
 * Extended report with validation metadata
 * The base DiagnosticReport schema is preserved - validation is additive
 */
export interface ValidatedDiagnosticReport extends DiagnosticReport {
  validation?: ValidationMetadata;
}

/**
 * 3-Pass lens configuration
 */
export const THREE_PASS_LENSES: PassDefinition[] = [
  {
    id: 'CORE_DIAGNOSTIC',
    name: 'Core Diagnostic',
    description: 'Neutral baseline diagnosis and recommendations',
    systemPromptModifier: `You are performing the CORE DIAGNOSTIC pass.
Focus on: Objective situation assessment, primary diagnosis, key metrics, and baseline recommendations.
Cite all evidence explicitly. Label uncertain items as [ASSUMED].
Output must follow the exact Decision Packet structure.`,
  },
  {
    id: 'RISK_AUDIT',
    name: 'Risk Audit',
    description: 'Failure modes, weak assumptions, missing evidence, governance issues',
    systemPromptModifier: `You are performing the RISK AUDIT pass.
Focus on: Failure modes, weak assumptions in prior analysis, missing evidence gaps, governance risks, downside scenarios.
Challenge optimistic assumptions. Identify what could go wrong.
Output must follow the exact Decision Packet structure.`,
  },
  {
    id: 'SYNTHESIS',
    name: 'Synthesis',
    description: 'Reconcile perspectives, finalize output, assess confidence',
    systemPromptModifier: `You are performing the SYNTHESIS pass.
Focus on: Reconciling different perspectives, selecting final recommendations, resolving contradictions.
If evidence is insufficient for a claim, note it explicitly.
Downgrade confidence when disagreement is detected.
Output must follow the exact Decision Packet structure with appropriate confidence levels.`,
  },
];

/**
 * 5-Pass lens configuration
 */
export const FIVE_PASS_LENSES: PassDefinition[] = [
  {
    id: 'CORE_DIAGNOSTIC',
    name: 'Core Diagnostic',
    description: 'Neutral baseline diagnosis and recommendations',
    systemPromptModifier: `You are performing the CORE DIAGNOSTIC pass.
Focus on: Objective situation assessment, primary diagnosis, key metrics, and baseline recommendations.
Cite all evidence explicitly. Label uncertain items as [ASSUMED].
Output must follow the exact Decision Packet structure.`,
  },
  {
    id: 'RISK_AUDIT',
    name: 'Risk Lens',
    description: 'Failure modes, risk factors, threat assessment',
    systemPromptModifier: `You are performing the RISK LENS pass.
Focus on: All risk factors, failure modes, threats to value, execution risks.
Identify vulnerabilities and worst-case implications.
Output must follow the exact Decision Packet structure.`,
  },
  {
    id: 'VALUE_LENS',
    name: 'Value Lens',
    description: 'Recoverable value, levers, Value Ledger impact',
    systemPromptModifier: `You are performing the VALUE LENS pass.
Focus on: Recoverable value, value creation levers, Value Ledger optimization, upside scenarios.
Quantify value opportunities and their probability.
Output must follow the exact Decision Packet structure.`,
  },
  {
    id: 'AUDIT_LENS',
    name: 'Audit Lens',
    description: 'Assumptions review, evidence sufficiency',
    systemPromptModifier: `You are performing the AUDIT LENS pass.
Focus on: Evidence quality, assumption validation, data gaps, audit trail integrity.
Flag all [ASSUMED] items and assess their materiality.
Output must follow the exact Decision Packet structure.`,
  },
  {
    id: 'SYNTHESIS',
    name: 'Synthesis',
    description: 'Final reconciliation and output',
    systemPromptModifier: `You are performing the SYNTHESIS pass.
Focus on: Reconciling all prior passes, producing final Decision Packet, confidence scoring.
Resolve contradictions explicitly. If evidence is insufficient, request follow-up data.
Output must follow the exact Decision Packet structure with integrated findings.`,
  },
];
