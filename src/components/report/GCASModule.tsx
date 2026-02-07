import { Globe, TrendingDown, AlertTriangle, ArrowRight, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { GCASAssessment, CourseCorrection, PortfolioRecommendation, GCASScore } from '@/lib/types';
import { ReportContent } from './ReportContent';
import { cn } from '@/lib/utils';

// ---------- Score badge ----------

function GCASScoreBadge({ score }: { score: GCASScore }) {
  const config: Record<GCASScore, { label: string; className: string }> = {
    HIGH: { label: 'HIGH', className: 'bg-success/15 text-success border-success/30' },
    MEDIUM: { label: 'MEDIUM', className: 'bg-warning/15 text-warning border-warning/30' },
    LOW: { label: 'LOW', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  };
  const c = config[score] ?? config.LOW;
  return (
    <span className={cn('px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider', c.className)}>
      GCAS: {c.label}
    </span>
  );
}

// ---------- Screening questions ----------

function ScreeningQuestion({ label, value }: { label: string; value: boolean | string | null }) {
  const isPositive = value === true || value === 'help';
  const isNegative = value === false || value === 'hurt';
  const Icon = isPositive ? CheckCircle2 : isNegative ? XCircle : MinusCircle;
  const display = value === null ? 'N/A'
    : typeof value === 'boolean' ? (value ? 'Yes' : 'No')
    : value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1.5 text-sm font-medium',
        isPositive && 'text-success',
        isNegative && 'text-destructive',
        !isPositive && !isNegative && 'text-muted-foreground'
      )}>
        <Icon className="w-4 h-4" />
        {display}
      </span>
    </div>
  );
}

// ---------- Course correction card ----------

function CourseCorrectionCard({ item, index }: { item: CourseCorrection; index: number }) {
  const ownerColor: Record<string, string> = {
    CFO: 'bg-primary/10 text-primary',
    CRO: 'bg-accent/10 text-accent-foreground',
    COO: 'bg-warning/10 text-warning',
    CEO: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Action {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded', ownerColor[item.owner] || 'bg-muted text-muted-foreground')}>
            {item.owner}
          </span>
          <span className="text-xs text-muted-foreground">{item.timeline}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{item.what}</p>
      <p className="text-xs text-muted-foreground">{item.why}</p>
    </div>
  );
}

// ---------- Main GCAS Module ----------

interface GCASModuleProps {
  gcas?: GCASAssessment;
  narrative?: string;
  courseCorrections?: CourseCorrection[];
  courseCorrectionNarrative?: string;
  portfolioRecommendation?: PortfolioRecommendation;
  patternAnalysis?: string;
  className?: string;
}

export function GCASModule({
  gcas,
  narrative,
  courseCorrections,
  courseCorrectionNarrative,
  portfolioRecommendation,
  patternAnalysis,
  className,
}: GCASModuleProps) {
  if (!gcas && !narrative && !patternAnalysis) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">GCAS analysis not available for this report.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Pattern & Causal Analysis (Steps 2-3) */}
      {patternAnalysis && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Pattern & Causal Analysis
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={patternAnalysis} section="pattern" />
          </div>
        </section>
      )}

      {/* GCAS Score (Step 4) */}
      {gcas && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            GCAS — Global Currency & Asset Sensitivity
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <GCASScoreBadge score={gcas.score} />
            </div>
            <div className="mb-4">
              <ScreeningQuestion label="Meaningful revenue outside the U.S.?" value={gcas.revenueOutsideUS} />
              <ScreeningQuestion label="Exposure to emerging markets?" value={gcas.emergingMarketExposure} />
              <ScreeningQuestion label="Impact of weaker dollar?" value={gcas.weakerDollarImpact} />
            </div>

            {/* Value Translation (Step 5) — only when LOW */}
            {gcas.score === 'LOW' && (gcas.ebitdaRiskRange || gcas.financingRisk || gcas.exitMultipleRisk) && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Value Translation — Risk Estimates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {gcas.ebitdaRiskRange && (
                    <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">EBITDA Risk</span>
                      <p className="text-sm font-medium text-foreground mt-1">{gcas.ebitdaRiskRange}</p>
                    </div>
                  )}
                  {gcas.financingRisk && (
                    <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Financing Risk</span>
                      <p className="text-sm font-medium text-foreground mt-1">{gcas.financingRisk}</p>
                    </div>
                  )}
                  {gcas.exitMultipleRisk && (
                    <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Exit Multiple Risk</span>
                      <p className="text-sm font-medium text-foreground mt-1">{gcas.exitMultipleRisk}</p>
                    </div>
                  )}
                </div>
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

      {/* 90-Day Course Correction (Step 6) */}
      {(courseCorrections && courseCorrections.length > 0) && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            90-Day Course Correction
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
            90-Day Course Correction
          </h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ReportContent content={courseCorrectionNarrative} section="correction" />
          </div>
        </section>
      )}

      {/* Portfolio Recommendation (Step 7) */}
      {portfolioRecommendation && (
        <section>
          <div className="border-2 border-primary/30 rounded-lg p-5 bg-primary/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Portfolio Recommendation</h3>
            <p className="text-xl font-bold text-foreground mb-2">{portfolioRecommendation.action}</p>
            <p className="text-sm text-muted-foreground">{portfolioRecommendation.rationale}</p>
          </div>
        </section>
      )}
    </div>
  );
}
