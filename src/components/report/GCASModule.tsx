import { Globe, TrendingDown, ArrowRight, BarChart3, Target, AlertTriangle, DollarSign, ShieldCheck, Shield, FlaskConical, Landmark } from 'lucide-react';
import { GCASAssessment, CourseCorrection, PortfolioRecommendation, CausalImpactRow, SegmentBreakdown, CheckpointGate, FinancingLeverage, ValueLedgerSummary, CriticalPrecondition, GovernorDecision, SelfTest } from '@/lib/types';
import { ReportContent } from './ReportContent';
import { GCASScoreBadge, ScreeningQuestion, CausalImpactTable } from './gcas/GCASParts';
import { CourseCorrectionCard } from './gcas/CourseCorrectionCard';
import { SegmentValueCard } from './gcas/SegmentValueCard';
import { CheckpointRuleCard } from './gcas/CheckpointRuleCard';
import { ValueLedgerTable } from './gcas/ValueLedgerTable';
import { CriticalPreconditions } from './gcas/CriticalPreconditions';
import { GovernorDecisionPanel } from './gcas/GovernorDecisionPanel';
import { SelfTestPanel } from './gcas/SelfTestPanel';
import { FinancingLeveragePanel } from './gcas/FinancingLeveragePanel';
import { cn } from '@/lib/utils';

interface GCASModuleProps {
  gcas?: GCASAssessment;
  narrative?: string;
  courseCorrections?: CourseCorrection[];
  courseCorrectionNarrative?: string;
  portfolioRecommendation?: PortfolioRecommendation;
  patternAnalysis?: string;
  causalImpactTable?: string;
  causalImpactRows?: CausalImpactRow[];
  segmentValueMath?: string;
  segmentBreakdown?: SegmentBreakdown;
  checkpointRule?: string;
  checkpointGate?: CheckpointGate;
  /** PE Governor v2 additions */
  financingNarrative?: string;
  financingLeverage?: FinancingLeverage;
  valueLedgerNarrative?: string;
  valueLedgerSummary?: ValueLedgerSummary;
  preconditionsNarrative?: string;
  criticalPreconditions?: CriticalPrecondition[];
  governorNarrative?: string;
  governorDecision?: GovernorDecision;
  selfTestNarrative?: string;
  selfTest?: SelfTest;
  className?: string;
}

export function GCASModule({
  gcas,
  narrative,
  courseCorrections,
  courseCorrectionNarrative,
  portfolioRecommendation,
  patternAnalysis,
  causalImpactTable,
  causalImpactRows,
  segmentValueMath,
  segmentBreakdown,
  checkpointRule,
  checkpointGate,
  financingNarrative,
  financingLeverage,
  valueLedgerNarrative,
  valueLedgerSummary,
  preconditionsNarrative,
  criticalPreconditions,
  governorNarrative,
  governorDecision,
  selfTestNarrative,
  selfTest,
  className,
}: GCASModuleProps) {
  if (!gcas && !narrative && !patternAnalysis && !governorDecision) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">GCAS analysis not available for this report.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* SECTION 2 — Pattern Analysis */}
      {patternAnalysis && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Section 2 — Patterns (Historical Precedents)
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={patternAnalysis} section="pattern" />
          </div>
        </section>
      )}

      {/* SECTION 3 — Causal Impact Table */}
      {(causalImpactRows && causalImpactRows.length > 0) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Section 3 — Causal Impact
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <CausalImpactTable rows={causalImpactRows} />
          </div>
        </section>
      )}
      {causalImpactTable && !causalImpactRows?.length && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Section 3 — Causal Impact
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={causalImpactTable} section="causal" />
          </div>
        </section>
      )}

      {/* SECTION 4 — GCAS Score */}
      {gcas && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Section 4 — GCAS Score
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <GCASScoreBadge score={gcas.score} />
            </div>
            <div className="mb-4">
              <ScreeningQuestion label="Q1: Meaningful revenue outside the U.S.?" value={gcas.revenueOutsideUS} />
              <ScreeningQuestion label="Q2: Exposed to emerging markets?" value={gcas.emergingMarketExposure} />
              <ScreeningQuestion label="Q3: Would a weaker USD help?" value={gcas.weakerDollarImpact} />
            </div>
            {gcas.explanation && (
              <p className="text-sm text-foreground font-medium mb-2">{gcas.explanation}</p>
            )}
            {gcas.score === 'LOW' && gcas.riskWarning && (
              <div className="mt-3 bg-destructive/5 rounded-lg p-3 border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{gcas.riskWarning}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* GCAS Narrative */}
      {narrative && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <ReportContent content={narrative} section="gcas" />
        </div>
      )}

      {/* SECTION 5 — Segment-Level Value Math */}
      {(segmentBreakdown || segmentValueMath) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Section 5 — Segment-Level Value Math
          </h2>
          {segmentBreakdown ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <SegmentValueCard segment={segmentBreakdown} />
            </div>
          ) : segmentValueMath ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <ReportContent content={segmentValueMath} section="segment" />
            </div>
          ) : null}
        </section>
      )}

      {/* SECTION 6 — Financing & Leverage */}
      {(financingLeverage || financingNarrative) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            Section 6 — Financing & Leverage
          </h2>
          {financingLeverage ? (
            <FinancingLeveragePanel financing={financingLeverage} />
          ) : financingNarrative ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <ReportContent content={financingNarrative} section="financing" />
            </div>
          ) : null}
        </section>
      )}

      {/* SECTION 7 — Value Ledger (CFO-Grade) */}
      {(valueLedgerSummary || valueLedgerNarrative) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Section 7 — Value Ledger (CFO-Grade)
          </h2>
          {valueLedgerSummary ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <ValueLedgerTable summary={valueLedgerSummary} />
            </div>
          ) : valueLedgerNarrative ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <ReportContent content={valueLedgerNarrative} section="valueLedger" />
            </div>
          ) : null}
        </section>
      )}

      {/* SECTION 8 — Critical Preconditions */}
      {(criticalPreconditions && criticalPreconditions.length > 0) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Section 8 — Critical Preconditions
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <CriticalPreconditions preconditions={criticalPreconditions} />
          </div>
        </section>
      )}
      {preconditionsNarrative && !criticalPreconditions?.length && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Section 8 — Critical Preconditions
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={preconditionsNarrative} section="preconditions" />
          </div>
        </section>
      )}

      {/* SECTION 9 — 90-Day Course Correction */}
      {(courseCorrections && courseCorrections.length > 0) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Section 9 — 90-Day Course Correction
          </h2>
          <div className="space-y-3">
            {courseCorrections.map((item, i) => (
              <CourseCorrectionCard key={i} item={item} index={i} />
            ))}
          </div>
        </section>
      )}
      {courseCorrectionNarrative && !courseCorrections?.length && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Section 9 — 90-Day Course Correction
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={courseCorrectionNarrative} section="correction" />
          </div>
        </section>
      )}

      {/* SECTION 10 — Checkpoint Rule */}
      {(checkpointGate || checkpointRule) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Section 10 — 6–12 Month Decision Gate
          </h2>
          {checkpointGate ? (
            <CheckpointRuleCard gate={checkpointGate} />
          ) : checkpointRule ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <ReportContent content={checkpointRule} section="checkpoint" />
            </div>
          ) : null}
        </section>
      )}

      {/* SECTION 11 — Portfolio Recommendation */}
      {portfolioRecommendation && (
        <section>
          <div className="border-2 border-primary/30 rounded-lg p-5 bg-primary/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Section 11 — Portfolio Recommendation</h3>
            <p className="text-xl font-bold text-foreground mb-2">{portfolioRecommendation.action}</p>
            <p className="text-sm text-muted-foreground">{portfolioRecommendation.rationale}</p>
            {portfolioRecommendation.conditionalFollowOn && (
              <p className="text-xs text-muted-foreground mt-2 italic">{portfolioRecommendation.conditionalFollowOn}</p>
            )}
          </div>
        </section>
      )}

      {/* SECTION 12 — Governor Decision */}
      {governorDecision && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Section 12 — Governor Decision
          </h2>
          <GovernorDecisionPanel decision={governorDecision} />
        </section>
      )}
      {governorNarrative && !governorDecision && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Section 12 — Governor Decision
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={governorNarrative} section="governor" />
          </div>
        </section>
      )}

      {/* SECTION 13 — Self-Test */}
      {selfTest && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Section 13 — Self-Test
          </h2>
          <SelfTestPanel selfTest={selfTest} />
        </section>
      )}
      {selfTestNarrative && !selfTest && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Section 13 — Self-Test
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={selfTestNarrative} section="selftest" />
          </div>
        </section>
      )}
    </div>
  );
}
