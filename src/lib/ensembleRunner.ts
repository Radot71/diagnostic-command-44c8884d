/**
 * EnsembleRunner - Multi-Pass Diagnostic Validation Wrapper
 * 
 * Wraps the existing diagnostic execution flow with optional multi-pass validation.
 * Preserves the Decision Packet schema while adding reliability through prompt ensembling.
 */

import { DiagnosticReport, WizardData, OutputMode } from './types';
import { 
  getEnsembleConfig, 
  isEnsembleActive, 
  getPassCount,
  EnsembleMode 
} from './ensembleConfig';
import {
  PassResult,
  PassDefinition,
  ValidationMetadata,
  EnsembleQAOutput,
  ValidatedDiagnosticReport,
  THREE_PASS_LENSES,
  FIVE_PASS_LENSES,
} from './ensembleTypes';
import {
  mergePassResults,
  createSinglePassValidation,
  createFallbackValidation,
} from './ensembleMerge';
import { generateMockReport } from './mockData';

/**
 * Get the appropriate lens configuration for current mode
 */
function getLenses(): PassDefinition[] {
  const config = getEnsembleConfig();
  switch (config.mode) {
    case '3pass':
      return THREE_PASS_LENSES;
    case '5pass':
      return FIVE_PASS_LENSES;
    default:
      return [];
  }
}

/**
 * Execute a single diagnostic pass with a specific lens
 * 
 * NOTE: In the current implementation, this uses the mock generator.
 * When integrated with a real LLM backend, the systemPromptModifier
 * would be prepended to the base diagnostic prompt.
 */
async function executeSinglePass(
  lens: PassDefinition,
  wizardData: WizardData,
  outputMode: OutputMode
): Promise<PassResult> {
  const startTime = Date.now();
  
  try {
    // In a real implementation, this would call the LLM with:
    // - Base system prompt for Decision-Grade Diagnostic Engine
    // - Lens-specific modifier (lens.systemPromptModifier)
    // - Input data (wizardData)
    // - Output schema contract (DiagnosticReport structure)
    
    // For now, use the mock generator with slight variations per lens
    const report = generateMockReport(wizardData, outputMode);
    
    // Apply lens-specific adjustments to simulate different perspectives
    const adjustedReport = applyLensAdjustments(report, lens);
    
    return {
      passId: lens.id,
      success: true,
      report: adjustedReport,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      passId: lens.id,
      success: false,
      report: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Apply lens-specific adjustments to simulate different diagnostic perspectives
 * 
 * In production with real LLM, this wouldn't be needed as the lens prompt
 * modifier would naturally produce different outputs.
 */
function applyLensAdjustments(report: DiagnosticReport, lens: PassDefinition): DiagnosticReport {
  const adjusted = { ...report };
  
  switch (lens.id) {
    case 'RISK_AUDIT':
      // Risk lens tends to be more conservative
      adjusted.integrity = {
        ...adjusted.integrity,
        confidence: Math.max(0, adjusted.integrity.confidence - 8),
        evidenceQuality: Math.max(0, adjusted.integrity.evidenceQuality - 5),
      };
      // Adjust scenario probabilities to favor downside
      adjusted.sections = {
        ...adjusted.sections,
        scenarios: adjusted.sections.scenarios
          .replace(/Downside Case[\s\S]*?Probability:\s*\d+%/, (match) => {
            const current = parseInt(match.match(/(\d+)%/)?.[1] || '35', 10);
            return match.replace(/\d+%/, `${Math.min(50, current + 10)}%`);
          }),
      };
      break;
      
    case 'VALUE_LENS':
      // Value lens tends to find upside
      adjusted.integrity = {
        ...adjusted.integrity,
        confidence: Math.min(100, adjusted.integrity.confidence + 3),
      };
      // Adjust scenario probabilities to favor upside
      adjusted.sections = {
        ...adjusted.sections,
        scenarios: adjusted.sections.scenarios
          .replace(/Upside Case[\s\S]*?Probability:\s*\d+%/, (match) => {
            const current = parseInt(match.match(/(\d+)%/)?.[1] || '25', 10);
            return match.replace(/\d+%/, `${Math.min(40, current + 8)}%`);
          }),
      };
      break;
      
    case 'AUDIT_LENS':
      // Audit lens is most critical about evidence
      adjusted.integrity = {
        ...adjusted.integrity,
        evidenceQuality: Math.max(0, adjusted.integrity.evidenceQuality - 10),
        missingData: [
          ...adjusted.integrity.missingData,
          'Third-party verification of key assumptions',
          'Sensitivity analysis on critical variables',
        ],
      };
      break;
      
    case 'SYNTHESIS':
      // Synthesis balances perspectives
      adjusted.integrity = {
        ...adjusted.integrity,
        confidence: Math.round(adjusted.integrity.confidence * 0.95), // Slight conservatism
      };
      break;
  }
  
  return adjusted;
}

/**
 * Log QA output for developer debugging
 */
function logQAOutput(qaOutput: EnsembleQAOutput): void {
  const config = getEnsembleConfig();
  
  if (!config.enableDevPanel) return;
  
  console.group('[DiagnosticOS:Ensemble] QA Output');
  console.log('Timestamp:', qaOutput.timestamp);
  console.log('Mode:', qaOutput.config.mode, `(${qaOutput.config.passCount} passes)`);
  console.log('Consensus Score:', `${(qaOutput.validation.consensus_score * 100).toFixed(1)}%`);
  console.log('Evidence Score:', `${(qaOutput.validation.evidence_score * 100).toFixed(1)}%`);
  console.log('Material Disagreement:', qaOutput.validation.material_disagreement);
  
  if (qaOutput.validation.disagreement_notes.length > 0) {
    console.log('Disagreement Notes:');
    qaOutput.validation.disagreement_notes.forEach(note => console.log('  -', note));
  }
  
  console.log('Pass Results:');
  qaOutput.passResults.forEach(pass => {
    console.log(`  ${pass.passId}: ${pass.success ? '✓' : '✗'} (${pass.timeMs}ms)`);
  });
  
  if (qaOutput.keyFieldDiffs.length > 0) {
    console.log('Key Field Differences:');
    qaOutput.keyFieldDiffs
      .filter(diff => diff.agreementScore < 0.9)
      .forEach(diff => {
        console.log(`  ${diff.field}: agreement=${(diff.agreementScore * 100).toFixed(0)}%, values=[${diff.values.join(', ')}]`);
      });
  }
  
  console.groupEnd();
}

/**
 * Main EnsembleRunner function
 * 
 * Wraps the diagnostic execution with optional multi-pass validation.
 * Returns the exact same DiagnosticReport schema with optional validation metadata.
 */
export async function runEnsembleDiagnostic(
  wizardData: WizardData,
  outputMode: OutputMode
): Promise<ValidatedDiagnosticReport> {
  const config = getEnsembleConfig();
  const startTime = Date.now();
  
  // Single-pass mode (default/off)
  if (!isEnsembleActive()) {
    const report = generateMockReport(wizardData, outputMode);
    return {
      ...report,
      validation: createSinglePassValidation(),
    };
  }
  
  // Multi-pass ensemble mode
  const lenses = getLenses();
  const passResults: PassResult[] = [];
  
  try {
    // Execute all passes
    for (const lens of lenses) {
      const result = await executeSinglePass(lens, wizardData, outputMode);
      passResults.push(result);
    }
    
    // Merge results
    const { finalReport, validation, fieldComparisons } = mergePassResults(passResults, startTime);
    
    // Generate QA output
    const qaOutput: EnsembleQAOutput = {
      timestamp: new Date().toISOString(),
      config: {
        mode: config.mode,
        passCount: getPassCount(),
      },
      validation,
      keyFieldDiffs: fieldComparisons.filter(c => c.agreementScore < 0.9),
      passResults: passResults.map(p => ({
        passId: p.passId,
        success: p.success,
        timeMs: p.executionTimeMs,
      })),
    };
    
    logQAOutput(qaOutput);
    
    return {
      ...finalReport,
      validation,
    };
    
  } catch (error) {
    // Safe fallback: return single-pass result if ensemble fails
    if (config.fallbackOnError) {
      console.warn('[DiagnosticOS:Ensemble] Multi-pass failed, falling back to single-pass:', error);
      
      const report = generateMockReport(wizardData, outputMode);
      const validation = createFallbackValidation(
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime
      );
      
      return {
        ...report,
        validation,
      };
    }
    
    throw error;
  }
}

/**
 * Get validation summary for UI display (minimal)
 */
export function getValidationBadge(validation?: ValidationMetadata): {
  show: boolean;
  label: string;
  variant: 'success' | 'warning' | 'default';
  tooltip: string;
} {
  if (!validation || validation.ensemble_mode === 'off') {
    return {
      show: false,
      label: '',
      variant: 'default',
      tooltip: '',
    };
  }
  
  if (validation.fallback_used) {
    return {
      show: true,
      label: 'Baseline',
      variant: 'warning',
      tooltip: 'Multi-pass validation failed; showing baseline result',
    };
  }
  
  if (validation.material_disagreement) {
    return {
      show: true,
      label: `Validated (${(validation.consensus_score * 100).toFixed(0)}%)`,
      variant: 'warning',
      tooltip: `Material disagreement detected. ${validation.disagreement_notes.join(' ')}`,
    };
  }
  
  return {
    show: true,
    label: `Validated (${(validation.consensus_score * 100).toFixed(0)}%)`,
    variant: 'success',
    tooltip: `${validation.pass_count}-pass validation complete. Consensus: ${(validation.consensus_score * 100).toFixed(0)}%, Evidence: ${(validation.evidence_score * 100).toFixed(0)}%`,
  };
}
