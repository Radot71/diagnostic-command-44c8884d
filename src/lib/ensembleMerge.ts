/**
 * Ensemble Merge & Reconciliation Logic
 * 
 * Handles merging multiple pass results into a single validated Decision Packet.
 * Implements consensus scoring and material disagreement detection.
 */

import { DiagnosticReport, IntegrityMetrics } from './types';
import { 
  PassResult, 
  ValidationMetadata, 
  FieldComparison, 
  MergeResult,
  RoleLens 
} from './ensembleTypes';
import { getEnsembleConfig } from './ensembleConfig';

/**
 * Extract comparable values from a report section
 */
function extractKeyValues(report: DiagnosticReport): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  
  // Extract from integrity metrics
  values['confidence'] = report.integrity.confidence;
  values['completeness'] = report.integrity.completeness;
  values['evidenceQuality'] = report.integrity.evidenceQuality;
  values['missingDataCount'] = report.integrity.missingData.length;
  
  // Extract key patterns from sections using regex
  const executiveBrief = report.sections.executiveBrief;
  
  // Try to extract runway months
  const runwayMatch = executiveBrief.match(/runway is approximately (\d+)/i);
  if (runwayMatch) {
    values['runwayMonths'] = parseInt(runwayMatch[1], 10);
  }
  
  // Try to extract signal count
  const signalMatch = executiveBrief.match(/(\d+) warning signals/i);
  if (signalMatch) {
    values['signalCount'] = parseInt(signalMatch[1], 10);
  }
  
  // Extract from scenarios
  const scenarios = report.sections.scenarios;
  const baseProb = scenarios.match(/Base Case[\s\S]*?Probability:\s*(\d+)%/i);
  const upsideProb = scenarios.match(/Upside Case[\s\S]*?Probability:\s*(\d+)%/i);
  const downsideProb = scenarios.match(/Downside Case[\s\S]*?Probability:\s*(\d+)%/i);
  
  if (baseProb) values['baseCaseProbability'] = parseInt(baseProb[1], 10);
  if (upsideProb) values['upsideCaseProbability'] = parseInt(upsideProb[1], 10);
  if (downsideProb) values['downsideCaseProbability'] = parseInt(downsideProb[1], 10);
  
  return values;
}

/**
 * Calculate agreement score between multiple values
 */
function calculateAgreementScore(values: (string | number)[]): number {
  if (values.length <= 1) return 1.0;
  
  // For numeric values, calculate variance-based score
  const numericValues = values.filter(v => typeof v === 'number') as number[];
  if (numericValues.length === values.length) {
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    if (mean === 0) return numericValues.every(v => v === 0) ? 1.0 : 0.5;
    
    const variance = numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = stdDev / Math.abs(mean);
    
    // Convert to 0-1 score (lower variance = higher agreement)
    return Math.max(0, 1 - coeffOfVariation);
  }
  
  // For string values, calculate match rate
  const stringValues = values.map(v => String(v).toLowerCase().trim());
  const uniqueValues = new Set(stringValues);
  return 1 - (uniqueValues.size - 1) / stringValues.length;
}

/**
 * Compare field values across multiple pass results
 */
function compareFields(passResults: PassResult[]): FieldComparison[] {
  const successfulPasses = passResults.filter(p => p.success && p.report);
  if (successfulPasses.length === 0) return [];
  
  // Extract values from each pass
  const allValues: Record<string, (string | number)[]> = {};
  const reports = successfulPasses.map(p => p.report!);
  
  reports.forEach(report => {
    const keyValues = extractKeyValues(report);
    Object.entries(keyValues).forEach(([key, value]) => {
      if (!allValues[key]) allValues[key] = [];
      allValues[key].push(value);
    });
  });
  
  // Generate comparisons
  return Object.entries(allValues).map(([field, values]) => {
    const agreementScore = calculateAgreementScore(values);
    
    // Calculate variance for numeric fields
    let variance = 0;
    const numericValues = values.filter(v => typeof v === 'number') as number[];
    if (numericValues.length > 1) {
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      variance = numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length;
    }
    
    // Select value (prefer synthesis pass if available, otherwise use median/mode)
    let selectedValue = String(values[values.length - 1]); // Default to last (synthesis)
    let selectionReason = 'Selected from synthesis pass';
    
    if (agreementScore < 0.7 && numericValues.length > 0) {
      // Use median for low agreement numeric fields
      const sorted = [...numericValues].sort((a, b) => a - b);
      selectedValue = String(sorted[Math.floor(sorted.length / 2)]);
      selectionReason = 'Median selected due to disagreement';
    }
    
    return {
      field,
      values: values.map(String),
      variance,
      agreementScore,
      selectedValue,
      selectionReason,
    };
  });
}

/**
 * Detect material disagreement based on configured thresholds
 */
function detectMaterialDisagreement(
  fieldComparisons: FieldComparison[],
  passResults: PassResult[]
): { hasMaterialDisagreement: boolean; notes: string[] } {
  const config = getEnsembleConfig();
  const thresholds = config.materialDisagreementThresholds;
  const notes: string[] = [];
  let hasMaterialDisagreement = false;
  
  // Check value variance threshold
  const valueFields = ['confidence', 'baseCaseProbability', 'downsideCaseProbability'];
  valueFields.forEach(field => {
    const comparison = fieldComparisons.find(c => c.field === field);
    if (comparison && comparison.agreementScore < (1 - thresholds.valueVariancePercent / 100)) {
      hasMaterialDisagreement = true;
      notes.push(`High variance in ${field}: values differ by more than ${thresholds.valueVariancePercent}%`);
    }
  });
  
  // Check for ROI flip detection (not directly extractable from current mock, but structured for future)
  if (thresholds.roiFlipDetection) {
    const upsideValues = fieldComparisons.find(c => c.field === 'upsideCaseProbability');
    const downsideValues = fieldComparisons.find(c => c.field === 'downsideCaseProbability');
    
    if (upsideValues && downsideValues) {
      const upsideNums = upsideValues.values.map(Number).filter(n => !isNaN(n));
      const downsideNums = downsideValues.values.map(Number).filter(n => !isNaN(n));
      
      if (upsideNums.length > 1 && downsideNums.length > 1) {
        // Check if upside/downside relationship flips across passes
        const firstPassFavorable = upsideNums[0] > downsideNums[0];
        const lastPassFavorable = upsideNums[upsideNums.length - 1] > downsideNums[downsideNums.length - 1];
        
        if (firstPassFavorable !== lastPassFavorable) {
          hasMaterialDisagreement = true;
          notes.push('ROI outlook flipped between passes (upside vs downside probability reversal)');
        }
      }
    }
  }
  
  // Check for low overall consensus
  const avgAgreement = fieldComparisons.reduce((sum, c) => sum + c.agreementScore, 0) / 
    Math.max(fieldComparisons.length, 1);
  
  if (avgAgreement < config.consensusThreshold) {
    hasMaterialDisagreement = true;
    notes.push(`Overall consensus score (${(avgAgreement * 100).toFixed(0)}%) below threshold (${(config.consensusThreshold * 100).toFixed(0)}%)`);
  }
  
  return { hasMaterialDisagreement, notes };
}

/**
 * Calculate consensus and evidence scores
 */
function calculateScores(
  fieldComparisons: FieldComparison[],
  passResults: PassResult[]
): { consensusScore: number; evidenceScore: number } {
  // Consensus score: average agreement across fields
  const consensusScore = fieldComparisons.length > 0
    ? fieldComparisons.reduce((sum, c) => sum + c.agreementScore, 0) / fieldComparisons.length
    : 1.0;
  
  // Evidence score: based on pass success rate and integrity metrics
  const successRate = passResults.filter(p => p.success).length / passResults.length;
  
  // Get average evidence quality from successful passes
  const successfulReports = passResults
    .filter(p => p.success && p.report)
    .map(p => p.report!);
  
  const avgEvidenceQuality = successfulReports.length > 0
    ? successfulReports.reduce((sum, r) => sum + r.integrity.evidenceQuality, 0) / successfulReports.length
    : 50;
  
  const evidenceScore = (successRate * 0.4 + (avgEvidenceQuality / 100) * 0.6);
  
  return {
    consensusScore: Math.min(1, Math.max(0, consensusScore)),
    evidenceScore: Math.min(1, Math.max(0, evidenceScore)),
  };
}

/**
 * Merge integrity metrics from multiple reports
 */
function mergeIntegrityMetrics(
  reports: DiagnosticReport[],
  validation: Partial<ValidationMetadata>
): IntegrityMetrics {
  if (reports.length === 0) {
    return {
      completeness: 0,
      evidenceQuality: 0,
      confidence: 0,
      missingData: ['No valid passes completed'],
    };
  }
  
  // Use conservative estimates (minimum values) with adjustments for disagreement
  const completeness = Math.min(...reports.map(r => r.integrity.completeness));
  const evidenceQuality = Math.min(...reports.map(r => r.integrity.evidenceQuality));
  
  // Confidence is reduced if material disagreement detected
  let confidence = Math.min(...reports.map(r => r.integrity.confidence));
  if (validation.material_disagreement) {
    confidence = Math.max(0, confidence - 15); // Penalize for disagreement
  }
  
  // Union of all missing data items
  const allMissingData = new Set<string>();
  reports.forEach(r => r.integrity.missingData.forEach(item => allMissingData.add(item)));
  
  return {
    completeness,
    evidenceQuality,
    confidence,
    missingData: Array.from(allMissingData),
  };
}

/**
 * Main merge function: combines multiple pass results into validated output
 */
export function mergePassResults(passResults: PassResult[], startTime: number): MergeResult {
  const config = getEnsembleConfig();
  const executionTime = Date.now() - startTime;
  
  const successfulPasses = passResults.filter(p => p.success && p.report);
  const fieldComparisons = compareFields(passResults);
  const { hasMaterialDisagreement, notes } = detectMaterialDisagreement(fieldComparisons, passResults);
  const { consensusScore, evidenceScore } = calculateScores(fieldComparisons, passResults);
  
  // Build validation metadata
  const validation: ValidationMetadata = {
    ensemble_mode: config.mode,
    consensus_score: consensusScore,
    evidence_score: evidenceScore,
    material_disagreement: hasMaterialDisagreement,
    disagreement_notes: notes,
    pass_count: passResults.length,
    passes_completed: successfulPasses.length,
    fallback_used: successfulPasses.length < passResults.length,
    execution_time_total_ms: executionTime,
  };
  
  // Select final report (prefer synthesis pass, fall back to last successful)
  let finalReport: DiagnosticReport;
  
  const synthesisResult = passResults.find(p => p.passId === 'SYNTHESIS' && p.success && p.report);
  if (synthesisResult?.report) {
    finalReport = synthesisResult.report;
  } else if (successfulPasses.length > 0) {
    finalReport = successfulPasses[successfulPasses.length - 1].report!;
  } else {
    // This shouldn't happen due to fallback behavior, but handle gracefully
    throw new Error('No successful passes to merge');
  }
  
  // Apply merged integrity metrics
  const reports = successfulPasses.map(p => p.report!);
  finalReport = {
    ...finalReport,
    integrity: mergeIntegrityMetrics(reports, validation),
  };
  
  return {
    finalReport,
    validation,
    fieldComparisons,
  };
}

/**
 * Create a fallback validation metadata for single-pass mode
 */
export function createSinglePassValidation(): ValidationMetadata {
  return {
    ensemble_mode: 'off',
    consensus_score: 1.0,
    evidence_score: 1.0,
    material_disagreement: false,
    disagreement_notes: [],
    pass_count: 1,
    passes_completed: 1,
    fallback_used: false,
    execution_time_total_ms: 0,
  };
}

/**
 * Create a fallback validation metadata when ensemble fails
 */
export function createFallbackValidation(error: string, executionTime: number): ValidationMetadata {
  const config = getEnsembleConfig();
  return {
    ensemble_mode: config.mode,
    consensus_score: 0.5,
    evidence_score: 0.5,
    material_disagreement: true,
    disagreement_notes: [`Validation fallback: multi-pass failed; returned baseline result. Error: ${error}`],
    pass_count: config.mode === '3pass' ? 3 : 5,
    passes_completed: 0,
    fallback_used: true,
    execution_time_total_ms: executionTime,
  };
}
