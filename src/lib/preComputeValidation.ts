/**
 * Pre-compute validation layer for the PE diagnostic intake.
 * 
 * Responsibilities:
 * 1. Normalize all numeric values from raw form strings
 * 2. Compute derived fields deterministically  
 * 3. Detect conflicts and produce actionable error messages
 * 4. Produce a clean NormalizedIntake object for the analysis engine
 */

import { WizardData } from './types';

// ============================================================================
// Normalized output — this is what the analysis engine receives
// ============================================================================

export interface NormalizedIntake {
  company: {
    name: string;
    industry: string;
    revenue: string;
    employees: string;
    founded: string;
  };
  situation: {
    id: string;
    title: string;
    description: string;
    category: string;
    urgency: string;
  } | null;
  observed: {
    enterpriseValue_m: number;
    equityCheck_m: number;
    entryEbitda_m: number;
    ebitdaMargin_pct: number;
    cashOnHand_m: number;
    monthlyBurn_m: number;
    usRevenuePct: number;
    exportExposurePct: number;
    debtMaturityMonths: number | null;
    timeHorizonMonths: number;
  };
  inferred: {
    totalDebt_m: number;
    entryLeverage_x: number;
    entryMultiple_x: number;
    runwayMonths: number;
    impliedRevenue_m: number;
    nonUsRevenuePct: number;
  };
  dealType: string;
  dealTypeOther: string;
  macroSensitivities: string[];
  hasDebt: boolean;
  signals: string[];
  notes: string;
  operatingMetrics: {
    annualEbitda: string;
    grossMargin: string;
    revenueGrowthYoY: string;
  };
  tier: string;
}

// ============================================================================
// Conflict types
// ============================================================================

export interface IntakeConflict {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  /** If true, requires user confirmation to proceed */
  requiresConfirmation?: boolean;
}

export interface PreComputeResult {
  normalized: NormalizedIntake | null;
  conflicts: IntakeConflict[];
  /** True if there are blocking errors (not just warnings) */
  hasBlockingErrors: boolean;
}

// ============================================================================
// Strict numeric parsing — no units, no text
// ============================================================================

function strictParseNum(val: string | undefined | null): number | null {
  if (val === undefined || val === null || val.trim() === '') return null;
  // Strip common suffixes: $, M, K, B, "months", "mo"
  let cleaned = val.trim()
    .replace(/^\$/, '')
    .replace(/[MmKkBb]$/g, '')
    .replace(/\s*(months?|mo)\s*$/i, '')
    .trim();
  // Only allow digits, optional decimal, optional leading minus
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ============================================================================
// Main pre-compute function
// ============================================================================

export function preComputeAndValidate(
  wizardData: WizardData,
  tier: string
): PreComputeResult {
  const conflicts: IntakeConflict[] = [];
  const de = wizardData.dealEconomics;
  const ri = wizardData.runwayInputs;

  // Parse observed values
  const ev = strictParseNum(de.enterpriseValue);
  const equity = strictParseNum(de.equityCheck);
  const ebitda = strictParseNum(de.entryEbitda);
  const margin = strictParseNum(de.ebitdaMargin);
  const cash = strictParseNum(ri.cashOnHand);
  const burn = strictParseNum(ri.monthlyBurn);
  const usRev = strictParseNum(de.usRevenuePct);
  const exportExp = strictParseNum(de.exportExposurePct);
  const debtMaturity = strictParseNum(ri.debtMaturity);
  const timeHorizon = de.timeHorizonMonths;

  // --- Check required fields ---
  if (ev === null || ev <= 0) conflicts.push({ field: 'enterpriseValue', severity: 'error', message: 'Enterprise Value is required (positive number in $M)' });
  if (equity === null || equity <= 0) conflicts.push({ field: 'equityCheck', severity: 'error', message: 'Equity Check is required (positive number in $M)' });
  if (ebitda === null || ebitda <= 0) conflicts.push({ field: 'entryEbitda', severity: 'error', message: 'Entry EBITDA is required (positive number in $M)' });
  if (margin === null || margin < 1 || margin > 40) conflicts.push({ field: 'ebitdaMargin', severity: 'error', message: 'EBITDA Margin must be 1–40%' });
  if (cash === null) conflicts.push({ field: 'cashOnHand', severity: 'error', message: 'Cash on Hand is required (number in $M)' });
  if (burn === null) conflicts.push({ field: 'monthlyBurn', severity: 'error', message: 'Monthly Burn is required (number in $M)' });
  if (usRev === null || usRev < 0 || usRev > 100) conflicts.push({ field: 'usRevenuePct', severity: 'error', message: 'US Revenue % must be 0–100' });
  if (exportExp === null || exportExp < 0 || exportExp > 100) conflicts.push({ field: 'exportExposurePct', severity: 'error', message: 'Export Exposure % must be 0–100' });
  if (!de.dealType) conflicts.push({ field: 'dealType', severity: 'error', message: 'Deal Type is required' });
  if (de.dealType === 'other' && !de.dealTypeOther.trim()) conflicts.push({ field: 'dealTypeOther', severity: 'error', message: 'Please describe the deal type' });
  if (de.macroSensitivities.length === 0) conflicts.push({ field: 'macroSensitivities', severity: 'error', message: 'Select at least one macro sensitivity' });

  // Equity > EV check
  if (ev !== null && equity !== null && equity > ev) {
    conflicts.push({ field: 'equityCheck', severity: 'error', message: 'Equity cannot exceed Enterprise Value' });
  }

  // If blocking errors, return early
  const blockingErrors = conflicts.filter(c => c.severity === 'error');
  if (blockingErrors.length > 0) {
    return { normalized: null, conflicts, hasBlockingErrors: true };
  }

  // --- Compute derived values (all inputs validated above) ---
  const totalDebt = ev! - equity!;
  const entryLeverage = totalDebt / ebitda!;
  const entryMultiple = ev! / ebitda!;
  const runway = burn! > 0 ? cash! / burn! : 99;
  const impliedRevenue = margin! > 0 ? ebitda! / (margin! / 100) : 0;
  const nonUsRev = 100 - usRev!;

  // --- Conflict detection (warnings) ---

  // (a) If user has separate debt amount and it differs from EV-Equity by >5%
  if (ri.hasDebt && ri.debtAmount) {
    const statedDebt = strictParseNum(ri.debtAmount);
    if (statedDebt !== null && totalDebt > 0) {
      const diff = Math.abs(statedDebt - totalDebt) / totalDebt;
      if (diff > 0.05) {
        conflicts.push({
          field: 'debtAmount',
          severity: 'error',
          message: `Stated debt ($${statedDebt}M) differs from computed debt (EV-Equity = $${totalDebt.toFixed(1)}M) by ${(diff * 100).toFixed(0)}%. Fix the discrepancy.`,
        });
      }
    }
  }

  // (c) EV/EBITDA multiple sanity check
  if (entryMultiple < 3 || entryMultiple > 20) {
    conflicts.push({
      field: 'entryMultiple',
      severity: 'warning',
      message: `Entry multiple is ${entryMultiple.toFixed(1)}x — outside typical 3x–20x range. Is EBITDA annual and in $M?`,
      requiresConfirmation: true,
    });
  }

  const hasBlockingErrors = conflicts.some(c => c.severity === 'error');

  if (hasBlockingErrors) {
    return { normalized: null, conflicts, hasBlockingErrors: true };
  }

  const normalized: NormalizedIntake = {
    company: {
      name: wizardData.companyBasics.companyName,
      industry: wizardData.companyBasics.industry,
      revenue: wizardData.companyBasics.revenue,
      employees: wizardData.companyBasics.employees,
      founded: wizardData.companyBasics.founded,
    },
    situation: wizardData.situation,
    observed: {
      enterpriseValue_m: ev!,
      equityCheck_m: equity!,
      entryEbitda_m: ebitda!,
      ebitdaMargin_pct: margin!,
      cashOnHand_m: cash!,
      monthlyBurn_m: burn!,
      usRevenuePct: usRev!,
      exportExposurePct: exportExp!,
      debtMaturityMonths: debtMaturity,
      timeHorizonMonths: timeHorizon,
    },
    inferred: {
      totalDebt_m: parseFloat(totalDebt.toFixed(1)),
      entryLeverage_x: parseFloat(entryLeverage.toFixed(2)),
      entryMultiple_x: parseFloat(entryMultiple.toFixed(2)),
      runwayMonths: parseFloat(runway.toFixed(1)),
      impliedRevenue_m: parseFloat(impliedRevenue.toFixed(1)),
      nonUsRevenuePct: parseFloat(nonUsRev.toFixed(0)),
    },
    dealType: de.dealType,
    dealTypeOther: de.dealType === 'other' ? de.dealTypeOther.trim() : '',
    macroSensitivities: de.macroSensitivities,
    hasDebt: ri.hasDebt,
    signals: wizardData.signalChecklist.signals,
    notes: wizardData.signalChecklist.notes,
    operatingMetrics: {
      annualEbitda: wizardData.operatingMetrics.annualEbitda,
      grossMargin: wizardData.operatingMetrics.grossMargin,
      revenueGrowthYoY: wizardData.operatingMetrics.revenueGrowthYoY,
    },
    tier,
  };

  return { normalized, conflicts, hasBlockingErrors: false };
}
