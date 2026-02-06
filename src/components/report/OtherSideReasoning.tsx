/**
 * OtherSideReasoning Component
 *
 * Institutional-grade "devil's advocate" module.
 * Surfaces what could make the analysis wrong, fast disconfirming checks,
 * inaction warnings, and tier-upgrade context.
 *
 * READ-ONLY from DecisionPacketV1 — no new numbers, no engine changes.
 */

import { AlertTriangle, ShieldAlert, ListChecks, Lock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DiagnosticReport, DiagnosticTier, WizardData } from '@/lib/types';

interface OtherSideReasoningProps {
  report: DiagnosticReport;
  wizardData: WizardData;
  currentTier: DiagnosticTier;
  className?: string;
}

// --- Derivation helpers (read-only from packet / wizard) ---

function deriveWhatCouldBeWrong(
  report: DiagnosticReport,
  wizardData: WizardData,
  tier: DiagnosticTier,
): string[] {
  const bullets: string[] = [];
  const { missingData, confidence, evidenceQuality } = report.integrity;

  // Always surface missing-data assumptions
  if (missingData.length > 0) {
    bullets.push(
      `Analysis assumes absence of data for: ${missingData.slice(0, 2).join(', ')}. If this data exists and differs from benchmarks, conclusions may shift.`,
    );
  }

  // Confidence-driven caveats
  if (confidence < 70) {
    bullets.push(
      'Confidence is below 70%. Magnitude estimates are directionally material but may lack the precision required for binding commitments.',
    );
  }

  // Evidence quality
  if (evidenceQuality < 50) {
    bullets.push(
      'Evidence quality is low. Key inputs rely on management estimates rather than audited figures — conclusions should be treated as indicative.',
    );
  }

  // Situation-specific
  if (wizardData.runwayInputs.hasDebt) {
    bullets.push(
      'Debt covenant terms have not been independently verified. Actual breach thresholds may differ from stated inputs.',
    );
  }

  if (wizardData.signalChecklist.signals.length < 3) {
    bullets.push(
      'Fewer than three warning signals were flagged. The risk profile may be understated if additional signals exist but were not captured.',
    );
  }

  // Tier-gated depth
  if (tier === 'executive' || tier === 'full') {
    bullets.push(
      'Scenario probabilities reflect baseline assumptions. Exogenous shocks (regulatory, macroeconomic) are not modeled unless explicitly inputted.',
    );
    bullets.push(
      'Customer and supplier concentration data was not provided. Revenue fragility may be higher or lower than modeled.',
    );
    bullets.push(
      'Management execution risk is assessed qualitatively. No independent reference checks have been performed.',
    );
  }

  if (tier === 'full') {
    bullets.push(
      'Recovery estimates for intangible assets assume orderly liquidation. Forced-sale discounts could reduce recoveries by 20–40%.',
    );
    bullets.push(
      'Execution plan timelines assume immediate engagement of professional advisors. Delays in advisor selection compound time pressure.',
    );
  }

  // Cap by tier
  const maxBullets = tier === 'prospect' ? 3 : tier === 'executive' ? 6 : 10;
  return bullets.slice(0, maxBullets);
}

function deriveDisconfirmingChecks(
  report: DiagnosticReport,
  wizardData: WizardData,
  tier: DiagnosticTier,
): { label: string; blocked: boolean }[] {
  const checks: { label: string; blocked: boolean }[] = [];
  const missing = new Set(report.integrity.missingData.map(d => d.toLowerCase()));

  checks.push({
    label: 'Pull covenant definition page and recompute breach risk against actual terms.',
    blocked: !wizardData.runwayInputs.hasDebt,
  });

  checks.push({
    label: 'Obtain 13-week cash flow forecast prepared by management and compare to stated burn rate.',
    blocked: missing.has('historical monthly p&l (last 24 months)'),
  });

  checks.push({
    label: 'Confirm top-5 customer revenue share to validate concentration risk.',
    blocked: missing.has('customer concentration analysis'),
  });

  if (tier === 'executive' || tier === 'full') {
    checks.push({
      label: 'Request supplier aging schedule to assess payables pressure independently.',
      blocked: missing.has('detailed aging schedule'),
    });

    checks.push({
      label: 'Review management org chart for key-person dependencies.',
      blocked: missing.has('management org chart'),
    });

    checks.push({
      label: 'Compare capex requirements forecast against available liquidity.',
      blocked: missing.has('capex requirements forecast'),
    });
  }

  const maxChecks = tier === 'prospect' ? 3 : tier === 'executive' ? 5 : 6;
  return checks.slice(0, maxChecks);
}

function deriveInactionWarning(
  report: DiagnosticReport,
  wizardData: WizardData,
): string {
  const confidence = report.integrity.confidence;
  const urgency = wizardData.situation?.urgency || 'medium';
  const precisionCaveat =
    confidence < 60
      ? ' These estimates are directional, not precise.'
      : '';

  if (urgency === 'critical') {
    return `Without intervention, the current trajectory indicates accelerating deterioration. Window for preserving optionality is narrowing.${precisionCaveat}`;
  }
  if (urgency === 'high') {
    return `Delayed action reduces available strategic options and increases remediation cost. Each month of inaction compounds exposure.${precisionCaveat}`;
  }
  return `Current position allows for measured response, but unaddressed risks tend to compound over time. Periodic reassessment is recommended.${precisionCaveat}`;
}

function deriveUpgradeUnlock(tier: DiagnosticTier): string {
  switch (tier) {
    case 'prospect':
      return 'Unlock board-ready counter-case + kill criteria + execution sequence';
    case 'executive':
      return 'Unlock lender-grade kill criteria + stakeholder scripts + week-by-week plan';
    case 'full':
      return 'Full governance view enabled';
  }
}

// --- Component ---

export function OtherSideReasoning({
  report,
  wizardData,
  currentTier,
  className,
}: OtherSideReasoningProps) {
  const wrongBullets = deriveWhatCouldBeWrong(report, wizardData, currentTier);
  const checks = deriveDisconfirmingChecks(report, wizardData, currentTier);
  const inactionWarning = deriveInactionWarning(report, wizardData);
  const upgradeText = deriveUpgradeUnlock(currentTier);
  const isFullTier = currentTier === 'full';

  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          Other-Side Reasoning
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Balanced assessment of what could invalidate or materially alter this diagnostic.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* A — What could make this wrong? */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            What could make this wrong?
          </h4>
          <ul className="space-y-1.5">
            {wrongBullets.map((bullet, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground flex items-start gap-2"
              >
                <span className="text-warning mt-0.5 flex-shrink-0">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* B — Disconfirming checks */}
        {(currentTier === 'executive' || currentTier === 'full') && (
          <section>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
              Disconfirming checks (fast tests)
            </h4>
            <ul className="space-y-1.5">
              {checks.map((check, i) => (
                <li
                  key={i}
                  className="text-xs flex items-start gap-2"
                >
                  {check.blocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        {check.label}{' '}
                        <span className="text-destructive font-medium">
                          — Blocked until provided
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{check.label}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Prospect gets a condensed version */}
        {currentTier === 'prospect' && checks.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
              Disconfirming checks (fast tests)
            </h4>
            <ul className="space-y-1.5">
              {checks.slice(0, 3).map((check, i) => (
                <li
                  key={i}
                  className="text-xs flex items-start gap-2"
                >
                  {check.blocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        {check.label}{' '}
                        <span className="text-destructive font-medium">
                          — Blocked until provided
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{check.label}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* C — If you do nothing */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            If you do nothing
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {inactionWarning}
          </p>
        </section>

        {/* D — Upgrade unlock */}
        {!isFullTier ? (
          <section className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span>{upgradeText}</span>
            </p>
          </section>
        ) : (
          <section className="pt-3 border-t border-border">
            <p className="text-xs text-success flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Full governance view enabled</span>
            </p>
          </section>
        )}
      </CardContent>
    </Card>
  );
}