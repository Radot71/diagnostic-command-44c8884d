/**
 * ValidationRunner - Multi-Pass Validation Wrapper
 * 
 * Wraps an existing Decision Packet with optional multi-pass validation.
 * DOES NOT modify the core Decision Packet - only adds meta.validation.
 * 
 * This is a "post-generation" validation layer that analyzes the output
 * from the diagnostic engine for consistency, evidence quality, and alignment.
 */

import { DiagnosticReport, IntegrityMetrics } from './types';
import { 
  getEnsembleConfig, 
  isEnsembleActive, 
  getPassCount,
  EnsembleMode 
} from './ensembleConfig';
import {
  ValidationLens,
  ValidationLensDefinition,
  ValidationLensResult,
  ValidationFinding,
  ValidationMetadata,
  FieldDiff,
  ValidationQAOutput,
  THREE_PASS_VALIDATION_LENSES,
  FIVE_PASS_VALIDATION_LENSES,
  DATA_GAP_FIELD_MAP,
} from './validationTypes';

/**
 * Get the appropriate lens configuration for current mode
 */
function getValidationLenses(): ValidationLensDefinition[] {
  const config = getEnsembleConfig();
  switch (config.mode) {
    case '3pass':
      return THREE_PASS_VALIDATION_LENSES;
    case '5pass':
      return FIVE_PASS_VALIDATION_LENSES;
    default:
      return [];
  }
}

/**
 * Run the CONSISTENCY_LENS validation
 * Checks internal consistency across Decision Packet sections
 */
function runConsistencyLens(report: DiagnosticReport): ValidationLensResult {
  const startTime = Date.now();
  const findings: ValidationFinding[] = [];
  
  // Check 1: Runway calculation consistency
  const executiveBrief = report.sections.executiveBrief;
  const runwayMatch = executiveBrief.match(/runway is approximately (\d+)/i);
  if (runwayMatch) {
    const statedRunway = parseInt(runwayMatch[1], 10);
    // Check if runway is referenced consistently in scenarios
    const scenarioRunway = report.sections.scenarios.match(/Month (\d+)/i);
    if (scenarioRunway && Math.abs(parseInt(scenarioRunway[1], 10) - statedRunway) > 3) {
      findings.push({
        type: 'consistency',
        severity: 'warning',
        field: 'sections.scenarios',
        message: `Scenario timeline (Month ${scenarioRunway[1]}) differs from stated runway (${statedRunway} months)`,
        relatedFields: ['sections.executiveBrief'],
      });
    }
  }

  // Check 2: Value Ledger references in options
  const valueLedgerMentioned = report.sections.options.toLowerCase().includes('value') || 
                               report.sections.options.toLowerCase().includes('recovery');
  if (!valueLedgerMentioned) {
    findings.push({
      type: 'consistency',
      severity: 'info',
      field: 'sections.options',
      message: 'Options section does not explicitly reference Value Ledger metrics',
      relatedFields: ['sections.valueLedger'],
    });
  }

  // Check 3: Execution plan references valid options
  const optionsPattern = /Option \d/gi;
  const optionsInPlan = report.sections.executionPlan.match(optionsPattern) || [];
  const optionsInOptions = report.sections.options.match(optionsPattern) || [];
  const planOptionsSet = new Set(optionsInPlan.map(o => o.toLowerCase()));
  const definedOptionsSet = new Set(optionsInOptions.map(o => o.toLowerCase()));
  
  planOptionsSet.forEach(opt => {
    if (!definedOptionsSet.has(opt)) {
      findings.push({
        type: 'consistency',
        severity: 'error',
        field: 'sections.executionPlan',
        message: `Execution plan references ${opt} which is not defined in options`,
        relatedFields: ['sections.options'],
      });
    }
  });

  // Check 4: Signals mentioned in execution plan
  const signalCount = (report.sections.executiveBrief.match(/warning signals/i) || [''])[0];
  const planMentionsSignals = report.sections.executionPlan.toLowerCase().includes('signal') ||
                              report.sections.executionPlan.toLowerCase().includes('risk');
  if (signalCount && !planMentionsSignals) {
    findings.push({
      type: 'consistency',
      severity: 'info',
      field: 'sections.executionPlan',
      message: 'Warning signals mentioned in executive brief not addressed in execution plan',
      relatedFields: ['sections.executiveBrief'],
    });
  }

  // Calculate score: fewer findings = higher score
  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const score = Math.max(0, 1 - (errorCount * 0.2) - (warningCount * 0.1) - (findings.length * 0.02));

  return {
    lensId: 'CONSISTENCY_LENS',
    success: true,
    findings,
    score,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Run the AUDIT_LENS validation
 * Verifies claims have proper evidence citations
 */
function runAuditLens(report: DiagnosticReport): ValidationLensResult {
  const startTime = Date.now();
  const findings: ValidationFinding[] = [];

  // Check 1: Evidence tags in executive brief
  const evidenceTags = ['[OBSERVED]', '[INFERRED]', '[ASSUMED]', '[COMPUTED]'];
  const briefHasTags = evidenceTags.some(tag => report.sections.executiveBrief.includes(tag));
  if (!briefHasTags) {
    findings.push({
      type: 'citation',
      severity: 'info',
      field: 'sections.executiveBrief',
      message: 'Executive brief contains no evidence provenance tags',
    });
  }

  // Check 2: Value Ledger has source references
  const valueLedgerHasSources = report.sections.valueLedger.includes('FMV') || 
                                 report.sections.valueLedger.includes('Book Value') ||
                                 report.sections.valueLedger.includes('%');
  if (!valueLedgerHasSources) {
    findings.push({
      type: 'evidence',
      severity: 'warning',
      field: 'sections.valueLedger',
      message: 'Value Ledger lacks clear valuation methodology references',
    });
  }

  // Check 3: Scenarios have probability sources
  const scenariosHaveProbabilities = report.sections.scenarios.includes('Probability');
  if (!scenariosHaveProbabilities) {
    findings.push({
      type: 'citation',
      severity: 'warning',
      field: 'sections.scenarios',
      message: 'Scenario probabilities lack cited methodology or source',
    });
  }

  // Check 4: Evidence register completeness
  const pendingItems = (report.sections.evidenceRegister.match(/\\[ \\]/g) || []).length;
  const receivedItems = (report.sections.evidenceRegister.match(/Good|Fair|Poor/gi) || []).length;
  const completionRate = receivedItems / Math.max(1, receivedItems + pendingItems);
  
  if (completionRate < 0.5) {
    findings.push({
      type: 'evidence',
      severity: 'warning',
      field: 'sections.evidenceRegister',
      message: `Evidence register is ${Math.round(completionRate * 100)}% complete - significant gaps remain`,
    });
  }

  // Check 5: Missing data acknowledged
  if (report.integrity.missingData.length > 0) {
    const missingAcknowledged = report.sections.executiveBrief.toLowerCase().includes('missing') ||
                                 report.sections.executiveBrief.toLowerCase().includes('gap') ||
                                 report.sections.executiveBrief.toLowerCase().includes('pending');
    if (!missingAcknowledged && report.integrity.missingData.length > 3) {
      findings.push({
        type: 'evidence',
        severity: 'warning',
        field: 'integrity.missingData',
        message: `${report.integrity.missingData.length} missing data items not acknowledged in executive brief`,
      });
    }
  }

  // Calculate score based on evidence quality
  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const baseScore = report.integrity.evidenceQuality / 100;
  const score = Math.max(0, baseScore - (errorCount * 0.15) - (warningCount * 0.08));

  return {
    lensId: 'AUDIT_LENS',
    success: true,
    findings,
    score,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Run the RISK_LENS validation (5-pass only)
 * Verifies risks are properly addressed
 */
function runRiskLens(report: DiagnosticReport): ValidationLensResult {
  const startTime = Date.now();
  const findings: ValidationFinding[] = [];

  // Check 1: Risks mentioned are addressed in options
  const riskKeywords = ['risk', 'threat', 'vulnerability', 'failure', 'downside'];
  const risksInBrief = riskKeywords.filter(k => 
    report.sections.executiveBrief.toLowerCase().includes(k)
  );
  const risksInOptions = riskKeywords.filter(k => 
    report.sections.options.toLowerCase().includes(k)
  );

  if (risksInBrief.length > risksInOptions.length) {
    findings.push({
      type: 'risk',
      severity: 'warning',
      field: 'sections.options',
      message: 'Some risks identified in brief are not addressed in strategic options',
      relatedFields: ['sections.executiveBrief'],
    });
  }

  // Check 2: Downside scenario severity
  const downsideMatch = report.sections.scenarios.match(/Downside Case[\s\S]*?Probability:\s*(\d+)%/i);
  if (downsideMatch) {
    const downsideProbability = parseInt(downsideMatch[1], 10);
    if (downsideProbability > 40) {
      // High downside probability should be reflected in recommendations
      const urgentLanguage = ['immediate', 'urgent', 'critical', 'priority'].some(w =>
        report.sections.executionPlan.toLowerCase().includes(w)
      );
      if (!urgentLanguage) {
        findings.push({
          type: 'risk',
          severity: 'warning',
          field: 'sections.executionPlan',
          message: `Downside probability (${downsideProbability}%) is high but execution plan lacks urgency language`,
        });
      }
    }
  }

  // Check 3: Constraint awareness in options
  const hasDebt = report.sections.valueLedger.toLowerCase().includes('debt') ||
                  report.sections.valueLedger.toLowerCase().includes('secured');
  const debtMentionedInOptions = report.sections.options.toLowerCase().includes('debt') ||
                                  report.sections.options.toLowerCase().includes('lender');
  if (hasDebt && !debtMentionedInOptions) {
    findings.push({
      type: 'risk',
      severity: 'info',
      field: 'sections.options',
      message: 'Debt constraints from Value Ledger not explicitly addressed in options',
    });
  }

  const score = Math.max(0, 1 - (findings.filter(f => f.severity === 'error').length * 0.2) - 
                              (findings.filter(f => f.severity === 'warning').length * 0.1));

  return {
    lensId: 'RISK_LENS',
    success: true,
    findings,
    score,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Run the VALUE_LENS validation (5-pass only)
 * Verifies decision aligns with value metrics
 */
function runValueLens(report: DiagnosticReport): ValidationLensResult {
  const startTime = Date.now();
  const findings: ValidationFinding[] = [];

  // Check 1: Recovery percentages referenced in recommendations
  const recoveryMentioned = report.sections.valueLedger.match(/(\d+)%/g) || [];
  const optionsReferenceValue = report.sections.options.toLowerCase().includes('recovery') ||
                                 report.sections.options.toLowerCase().includes('value') ||
                                 report.sections.options.toLowerCase().includes('return');

  if (recoveryMentioned.length > 0 && !optionsReferenceValue) {
    findings.push({
      type: 'value',
      severity: 'warning',
      field: 'sections.options',
      message: 'Value Ledger contains recovery estimates not referenced in options analysis',
    });
  }

  // Check 2: ROI/return mentioned for investment options
  const investmentMentioned = report.sections.options.match(/Investment Required.*?\$[\\d.]+[MK]?/gi) || [];
  const roiMentioned = report.sections.options.toLowerCase().includes('roi') ||
                       report.sections.options.toLowerCase().includes('return') ||
                       report.sections.options.toLowerCase().includes('payback');

  if (investmentMentioned.length > 0 && !roiMentioned) {
    findings.push({
      type: 'value',
      severity: 'info',
      field: 'sections.options',
      message: 'Investment amounts listed without explicit ROI or payback period',
    });
  }

  // Check 3: Upside scenario leveraged
  const upsideMatch = report.sections.scenarios.match(/Upside Case[\s\S]*?Probability:\s*(\d+)%/i);
  if (upsideMatch) {
    const upsideProbability = parseInt(upsideMatch[1], 10);
    if (upsideProbability > 20) {
      const upsideActions = report.sections.executionPlan.toLowerCase().includes('upside') ||
                            report.sections.executionPlan.toLowerCase().includes('opportunity') ||
                            report.sections.executionPlan.toLowerCase().includes('growth');
      if (!upsideActions) {
        findings.push({
          type: 'value',
          severity: 'info',
          field: 'sections.executionPlan',
          message: 'Upside scenario not explicitly targeted in execution plan actions',
        });
      }
    }
  }

  const score = Math.max(0, 1 - (findings.filter(f => f.severity === 'error').length * 0.2) - 
                              (findings.filter(f => f.severity === 'warning').length * 0.1));

  return {
    lensId: 'VALUE_LENS',
    success: true,
    findings,
    score,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Run the SYNTHESIS_LENS validation
 * Produces final scores and follow-up questions
 */
function runSynthesisLens(
  report: DiagnosticReport, 
  priorResults: ValidationLensResult[]
): ValidationLensResult {
  const startTime = Date.now();
  const findings: ValidationFinding[] = [];

  // Aggregate findings from prior lenses
  const allFindings = priorResults.flatMap(r => r.findings);
  const errorCount = allFindings.filter(f => f.severity === 'error').length;
  const warningCount = allFindings.filter(f => f.severity === 'warning').length;

  if (errorCount > 0) {
    findings.push({
      type: 'consistency',
      severity: 'error',
      field: 'validation',
      message: `${errorCount} error-level finding(s) detected across validation passes`,
    });
  }

  if (warningCount > 3) {
    findings.push({
      type: 'consistency',
      severity: 'warning',
      field: 'validation',
      message: `${warningCount} warning-level findings indicate potential quality issues`,
    });
  }

  // Check overall confidence alignment
  const avgLensScore = priorResults.reduce((sum, r) => sum + r.score, 0) / Math.max(1, priorResults.length);
  const integrityConfidence = report.integrity.confidence / 100;
  
  if (Math.abs(avgLensScore - integrityConfidence) > 0.2) {
    findings.push({
      type: 'consistency',
      severity: 'info',
      field: 'integrity.confidence',
      message: `Validation score (${Math.round(avgLensScore * 100)}%) differs from stated confidence (${report.integrity.confidence}%)`,
    });
  }

  return {
    lensId: 'SYNTHESIS_LENS',
    success: true,
    findings,
    score: avgLensScore,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Calculate consensus score from lens results
 */
function calculateConsensusScore(lensResults: ValidationLensResult[]): number {
  if (lensResults.length === 0) return 1.0;
  
  const avgScore = lensResults.reduce((sum, r) => sum + r.score, 0) / lensResults.length;
  return Math.round(avgScore * 100) / 100;
}

/**
 * Calculate evidence score from report integrity and audit findings
 */
function calculateEvidenceScore(report: DiagnosticReport, lensResults: ValidationLensResult[]): number {
  const baseScore = report.integrity.evidenceQuality / 100;
  
  const auditResult = lensResults.find(r => r.lensId === 'AUDIT_LENS');
  if (auditResult) {
    return Math.round(((baseScore + auditResult.score) / 2) * 100) / 100;
  }
  
  return Math.round(baseScore * 100) / 100;
}

/**
 * Detect material disagreement based on findings
 */
function detectMaterialDisagreement(lensResults: ValidationLensResult[]): { 
  hasMaterialDisagreement: boolean; 
  notes: string[] 
} {
  const notes: string[] = [];
  let hasMaterialDisagreement = false;

  // Check for any error-level findings
  const errorFindings = lensResults.flatMap(r => r.findings.filter(f => f.severity === 'error'));
  if (errorFindings.length > 0) {
    hasMaterialDisagreement = true;
    errorFindings.forEach(f => notes.push(f.message));
  }

  // Check for multiple warnings in same field
  const warningsByField = new Map<string, number>();
  lensResults.forEach(r => {
    r.findings.filter(f => f.severity === 'warning').forEach(f => {
      warningsByField.set(f.field, (warningsByField.get(f.field) || 0) + 1);
    });
  });

  warningsByField.forEach((count, field) => {
    if (count >= 2) {
      hasMaterialDisagreement = true;
      notes.push(`Multiple validation warnings on ${field}`);
    }
  });

  // Check for low overall lens scores
  const avgScore = lensResults.reduce((sum, r) => sum + r.score, 0) / Math.max(1, lensResults.length);
  if (avgScore < 0.6) {
    hasMaterialDisagreement = true;
    notes.push(`Overall validation score (${Math.round(avgScore * 100)}%) below acceptable threshold`);
  }

  return { hasMaterialDisagreement, notes };
}

/**
 * Generate targeted follow-up questions based on data gaps
 */
function generateFollowUpQuestions(
  report: DiagnosticReport, 
  lensResults: ValidationLensResult[],
  evidenceScore: number,
  hasMaterialDisagreement: boolean
): string[] {
  // Only generate if evidence is weak or disagreement exists
  if (evidenceScore >= 0.6 && !hasMaterialDisagreement) {
    return [];
  }

  const questions: string[] = [];
  
  // Map missing data to targeted questions
  report.integrity.missingData.forEach(item => {
    const itemLower = item.toLowerCase();
    
    if (itemLower.includes('p&l') || itemLower.includes('revenue')) {
      questions.push(DATA_GAP_FIELD_MAP['financials.revenue'] || 
        'What are the historical revenue trends (last 12-24 months)?');
    }
    if (itemLower.includes('customer') || itemLower.includes('concentration')) {
      questions.push(DATA_GAP_FIELD_MAP['market.customers'] ||
        'What is the customer concentration profile (top 5 customers as % of revenue)?');
    }
    if (itemLower.includes('aging') || itemLower.includes('receivable')) {
      questions.push('What is the current A/R aging schedule and collection trends?');
    }
    if (itemLower.includes('org') || itemLower.includes('management')) {
      questions.push(DATA_GAP_FIELD_MAP['governance.management'] ||
        'What is the management team tenure and any recent departures?');
    }
    if (itemLower.includes('capex') || itemLower.includes('capital')) {
      questions.push('What are the near-term capital expenditure requirements?');
    }
  });

  // Add questions from warning findings
  const warningFindings = lensResults.flatMap(r => 
    r.findings.filter(f => f.severity === 'warning')
  );
  
  warningFindings.slice(0, 3).forEach(f => {
    if (f.field.includes('valueLedger')) {
      questions.push('Can you provide supporting documentation for key valuation assumptions?');
    }
    if (f.field.includes('scenarios')) {
      questions.push('What methodology was used for scenario probability estimates?');
    }
  });

  // Dedupe and limit
  const uniqueQuestions = [...new Set(questions)];
  return uniqueQuestions.slice(0, 7);
}

/**
 * Extract field diffs from findings
 */
function extractFieldDiffs(lensResults: ValidationLensResult[]): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  
  lensResults.forEach(result => {
    result.findings
      .filter(f => f.severity === 'error' || f.severity === 'warning')
      .forEach(f => {
        diffs.push({
          field: f.field,
          issue: f.message,
        });
      });
  });

  return diffs.slice(0, 10); // Limit to top 10
}

/**
 * Log QA output for developer debugging
 */
function logQAOutput(qaOutput: ValidationQAOutput): void {
  const config = getEnsembleConfig();
  
  if (!config.enableDevPanel) return;
  
  console.group('[DiagnosticOS:Validation] QA Output');
  console.log('Timestamp:', qaOutput.timestamp);
  console.log('Mode:', qaOutput.config.mode, `(${qaOutput.config.passCount} passes)`);
  console.log('Consensus Score:', `${(qaOutput.validation.consensusScore * 100).toFixed(1)}%`);
  console.log('Evidence Score:', `${(qaOutput.validation.evidenceScore * 100).toFixed(1)}%`);
  console.log('Material Disagreement:', qaOutput.validation.materialDisagreement);
  
  if (qaOutput.validation.disagreementNotes.length > 0) {
    console.log('Disagreement Notes:');
    qaOutput.validation.disagreementNotes.forEach(note => console.log('  -', note));
  }

  if (qaOutput.validation.followUpQuestions.length > 0) {
    console.log('Follow-up Questions:');
    qaOutput.validation.followUpQuestions.forEach(q => console.log('  ?', q));
  }
  
  console.log('Lens Results:');
  qaOutput.lensResults.forEach(lens => {
    console.log(`  ${lens.lensId}: score=${(lens.score * 100).toFixed(0)}%, findings=${lens.findingsCount} (${lens.timeMs}ms)`);
  });
  
  console.groupEnd();
}

/**
 * Create a default validation metadata (when ensemble is off)
 */
export function createDefaultValidation(): ValidationMetadata {
  return {
    ensembleMode: 'off',
    consensusScore: 1.0,
    evidenceScore: 1.0,
    materialDisagreement: false,
    disagreementNotes: [],
    followUpQuestions: [],
    fieldDiffs: [],
  };
}

/**
 * Create fallback validation metadata when validation fails
 */
export function createFallbackValidation(error: string): ValidationMetadata {
  const config = getEnsembleConfig();
  return {
    ensembleMode: config.mode,
    consensusScore: 0,
    evidenceScore: 0,
    materialDisagreement: true,
    disagreementNotes: [`Validation fallback: multi-pass validation failed; returned baseline packet. Error: ${error}`],
    followUpQuestions: [],
    fieldDiffs: [],
  };
}

/**
 * Main ValidationRunner function
 * 
 * Takes an existing Decision Packet and adds validation metadata.
 * Does NOT modify any existing fields - only adds meta.validation.
 */
export async function runValidation(report: DiagnosticReport): Promise<DiagnosticReport & { validation?: ValidationMetadata }> {
  const config = getEnsembleConfig();
  
  // If ensemble is off, return report unchanged (with default validation)
  if (!isEnsembleActive()) {
    return {
      ...report,
      validation: createDefaultValidation(),
    };
  }
  
  try {
    const lenses = getValidationLenses();
    const lensResults: ValidationLensResult[] = [];
    
    // Run each lens in sequence
    for (const lens of lenses) {
      let result: ValidationLensResult;
      
      switch (lens.id) {
        case 'CONSISTENCY_LENS':
          result = runConsistencyLens(report);
          break;
        case 'AUDIT_LENS':
          result = runAuditLens(report);
          break;
        case 'RISK_LENS':
          result = runRiskLens(report);
          break;
        case 'VALUE_LENS':
          result = runValueLens(report);
          break;
        case 'SYNTHESIS_LENS':
          result = runSynthesisLens(report, lensResults);
          break;
        default:
          continue;
      }
      
      lensResults.push(result);
    }
    
    // Calculate scores
    const consensusScore = calculateConsensusScore(lensResults);
    const evidenceScore = calculateEvidenceScore(report, lensResults);
    const { hasMaterialDisagreement, notes } = detectMaterialDisagreement(lensResults);
    const followUpQuestions = generateFollowUpQuestions(report, lensResults, evidenceScore, hasMaterialDisagreement);
    const fieldDiffs = extractFieldDiffs(lensResults);
    
    // Build validation metadata
    const validation: ValidationMetadata = {
      ensembleMode: config.mode,
      consensusScore,
      evidenceScore,
      materialDisagreement: hasMaterialDisagreement,
      disagreementNotes: notes,
      followUpQuestions,
      fieldDiffs,
    };
    
    // Log QA output
    const qaOutput: ValidationQAOutput = {
      timestamp: new Date().toISOString(),
      config: {
        mode: config.mode,
        passCount: getPassCount(),
      },
      validation,
      lensResults: lensResults.map(r => ({
        lensId: r.lensId,
        success: r.success,
        score: r.score,
        findingsCount: r.findings.length,
        timeMs: r.executionTimeMs,
      })),
    };
    
    logQAOutput(qaOutput);
    
    return {
      ...report,
      validation,
    };
    
  } catch (error) {
    // Safe fallback: return report unchanged with fallback validation
    if (config.fallbackOnError) {
      console.warn('[DiagnosticOS:Validation] Validation failed, returning baseline:', error);
      
      return {
        ...report,
        validation: createFallbackValidation(
          error instanceof Error ? error.message : 'Unknown error'
        ),
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
  if (!validation || validation.ensembleMode === 'off') {
    return {
      show: false,
      label: '',
      variant: 'default',
      tooltip: '',
    };
  }
  
  if (validation.materialDisagreement) {
    return {
      show: true,
      label: `Validated (${Math.round(validation.consensusScore * 100)}%)`,
      variant: 'warning',
      tooltip: `Material issues detected. ${validation.disagreementNotes.slice(0, 2).join(' ')}`,
    };
  }
  
  return {
    show: true,
    label: `Validated (${Math.round(validation.consensusScore * 100)}%)`,
    variant: 'success',
    tooltip: `Multi-pass validation complete. Consensus: ${Math.round(validation.consensusScore * 100)}%, Evidence: ${Math.round(validation.evidenceScore * 100)}%`,
  };
}
