import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Building2, DollarSign, BarChart3, Shield, AlertTriangle, FileCheck, Briefcase, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { signalOptions, situationTypes } from '@/lib/mockData';
import { runValidation } from '@/lib/validationRunner';
import { saveReport } from '@/lib/reportPersistence';
import { TierSelection } from '@/components/intake/TierSelection';
import { GovernancePillars } from '@/components/report/GovernancePillars';
import { DealEconomicsForm, isDealEconomicsComplete, getDealEconomicsErrors } from '@/components/intake/DealEconomicsForm';
import { PreComputeGate } from '@/components/intake/PreComputeGate';
import { preComputeAndValidate, IntakeConflict } from '@/lib/preComputeValidation';
import { startDiagnosticJob, pollUntilDone, cancelJob, ProgressUpdate } from '@/lib/jobQueue';
import { MacroSensitivity, TimeHorizonMonths } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, label: 'Diagnostic Tier', icon: Briefcase, description: 'Select analysis depth and deliverables' },
  { id: 2, label: 'Company Context', icon: Building2, description: 'Basic company information and industry' },
  { id: 3, label: 'Financial Position', icon: DollarSign, description: 'Liquidity, capital structure, and deal economics' },
  { id: 4, label: 'Operating Metrics', icon: BarChart3, description: 'Optional performance indicators' },
  { id: 5, label: 'Constraints', icon: Shield, description: 'Debt, covenants, and obligations' },
  { id: 6, label: 'Known Risks', icon: AlertTriangle, description: 'Identified concerns and signals' },
  { id: 7, label: 'Data Quality', icon: FileCheck, description: 'Situation classification and review' },
];

/** Strip non-numeric characters for strict numeric inputs */
function sanitizeNumeric(value: string): string {
  return value.replace(/[^0-9.\-]/g, '');
}

export default function DiagnosticIntake() {
  const navigate = useNavigate();
  const { wizardData, setWizardData, setReport, setOutputConfig, outputConfig, setReportSource, setReportId } = useDiagnostic();
  const [currentStep, setCurrentStep] = useState(1);
  const [preComputeConflicts, setPreComputeConflicts] = useState<IntakeConflict[]>([]);
  const [showPreComputeGate, setShowPreComputeGate] = useState(false);

  const updateCompanyBasics = (field: string, value: string) => {
    setWizardData(prev => ({
      ...prev,
      companyBasics: { ...prev.companyBasics, [field]: value },
    }));
  };

  const updateRunwayInputs = (field: string, value: string | boolean) => {
    setWizardData(prev => ({
      ...prev,
      runwayInputs: { ...prev.runwayInputs, [field]: value },
    }));
  };

  const updateDealEconomics = (field: string, value: string | boolean | MacroSensitivity[] | TimeHorizonMonths) => {
    setWizardData(prev => ({
      ...prev,
      dealEconomics: { ...prev.dealEconomics, [field]: value },
    }));
  };

  const updateOperatingMetrics = (field: string, value: string) => {
    setWizardData(prev => ({
      ...prev,
      operatingMetrics: { ...prev.operatingMetrics, [field]: value },
    }));
  };

  const updateSignals = (signal: string, checked: boolean) => {
    setWizardData(prev => ({
      ...prev,
      signalChecklist: {
        ...prev.signalChecklist,
        signals: checked
          ? [...prev.signalChecklist.signals, signal]
          : prev.signalChecklist.signals.filter(s => s !== signal),
      },
    }));
  };

  const updateNotes = (notes: string) => {
    setWizardData(prev => ({
      ...prev,
      signalChecklist: { ...prev.signalChecklist, notes },
    }));
  };

  const selectSituation = (situationId: string) => {
    const situation = situationTypes.find(s => s.id === situationId) || null;
    setWizardData(prev => ({ ...prev, situation }));
  };

  const [isRunning, setIsRunning] = useState(false);
  const [jobProgress, setJobProgress] = useState<ProgressUpdate | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  /** Computed runway for display */
  const computedRunway = (() => {
    const cash = parseFloat(wizardData.runwayInputs.cashOnHand);
    const burn = parseFloat(wizardData.runwayInputs.monthlyBurn);
    if (isNaN(cash) || isNaN(burn) || burn <= 0) return null;
    return cash / burn;
  })();

  /** Computed debt from deal economics for cross-check in Step 5 */
  const computedDebt = (() => {
    const ev = parseFloat(wizardData.dealEconomics.enterpriseValue);
    const eq = parseFloat(wizardData.dealEconomics.equityCheck);
    if (!isNaN(ev) && !isNaN(eq) && ev > 0 && eq > 0) return (ev - eq).toFixed(1);
    return null;
  })();

  const handleRunDiagnostic = async () => {
    // Run pre-compute validation first
    const result = preComputeAndValidate(wizardData, outputConfig.tier);

    if (result.conflicts.length > 0) {
      setPreComputeConflicts(result.conflicts);
      setShowPreComputeGate(true);

      if (result.hasBlockingErrors) {
        toast.error('Fix input errors before running diagnostic');
        return;
      }
      // Has only warnings — show gate for confirmation
      return;
    }

    await runDiagnosticWithNormalized(result.normalized!);
  };

  const handleConfirmWarnings = async () => {
    const result = preComputeAndValidate(wizardData, outputConfig.tier);
    if (result.hasBlockingErrors) {
      toast.error('Fix input errors before running diagnostic');
      return;
    }
    setShowPreComputeGate(false);
    await runDiagnosticWithNormalized(result.normalized!);
  };

  const runDiagnosticWithNormalized = async (normalizedIntake: object) => {
    setIsRunning(true);
    setJobProgress(null);
    setActiveJobId(null);
    try {
      toast.info('Starting diagnostic job...', { duration: 5000 });

      // 1. Start job (returns in <200ms)
      const jobId = await startDiagnosticJob({
        wizardData,
        outputMode: 'rapid',
        tier: outputConfig.tier,
        normalizedIntake,
      });
      setActiveJobId(jobId);

      // 2. Poll until complete
      const result = await pollUntilDone(jobId, (update) => {
        setJobProgress(update);
      });

      // 3. Process result
      const report = result.report;
      if (report.provenance) {
        report.provenance = result.provenance || report.provenance;
      }
      const validatedReport = await runValidation(report);
      setReport(validatedReport);
      setReportSource('claude');
      setOutputConfig({ mode: 'rapid', strictMode: true, tier: outputConfig.tier });

      try {
        const id = await saveReport({
          report: validatedReport,
          wizardData,
          outputConfig: { mode: 'rapid', strictMode: true, tier: outputConfig.tier },
          source: 'claude',
        });
        setReportId(id);
        toast.success('Diagnostic report generated!');
        navigate(`/report/${id}`);
      } catch (saveError) {
        console.error('[DiagnosticOS] Failed to persist report:', saveError);
        toast.success('Diagnostic report generated!');
        navigate('/report');
      }
    } catch (error) {
      console.error('[DiagnosticOS] Diagnostic run failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Analysis could not be completed. Please retry or contact support.',
        { duration: 8000 }
      );
    } finally {
      setIsRunning(false);
      setJobProgress(null);
      setActiveJobId(null);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return wizardData.companyBasics.companyName && wizardData.companyBasics.industry;
      case 3:
        return wizardData.runwayInputs.cashOnHand && wizardData.runwayInputs.monthlyBurn && isDealEconomicsComplete(wizardData.dealEconomics);
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    // If pre-compute gate is showing, render it instead of step content
    if (showPreComputeGate) {
      return (
        <PreComputeGate
          conflicts={preComputeConflicts}
          onFixInputs={() => {
            setShowPreComputeGate(false);
            // Navigate to the step with the first error
            const firstError = preComputeConflicts[0];
            if (firstError) {
              const financialFields = ['enterpriseValue', 'equityCheck', 'entryEbitda', 'ebitdaMargin', 'cashOnHand', 'monthlyBurn', 'usRevenuePct', 'exportExposurePct', 'macroSensitivities', 'dealType', 'dealTypeOther'];
              const debtFields = ['debtAmount'];
              if (financialFields.includes(firstError.field)) {
                setCurrentStep(3);
              } else if (debtFields.includes(firstError.field)) {
                setCurrentStep(5);
              }
            }
          }}
          onConfirmWarnings={handleConfirmWarnings}
          hasWarningsOnly={!preComputeConflicts.some(c => c.severity === 'error')}
        />
      );
    }

    switch (currentStep) {
      // ================================================================
      // STEP 1 — Diagnostic Tier
      // ================================================================
      case 1:
        return (
          <div className="space-y-6">
            <TierSelection
              selectedTier={outputConfig.tier}
              onSelectTier={(tier) => setOutputConfig(prev => ({ ...prev, tier }))}
            />
            <GovernancePillars />
          </div>
        );

      // ================================================================
      // STEP 2 — Company Context (Required Core)
      // ================================================================
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Company Context</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Provide basic information about the company being analyzed. Company Name and Industry are required; remaining fields are optional but recommended.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={wizardData.companyBasics.companyName}
                  onChange={(e) => updateCompanyBasics('companyName', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  value={wizardData.companyBasics.industry}
                  onChange={(e) => updateCompanyBasics('industry', e.target.value)}
                  placeholder="e.g., Manufacturing, Technology, Healthcare"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="revenue">Annual Revenue <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="revenue"
                  value={wizardData.companyBasics.revenue}
                  onChange={(e) => updateCompanyBasics('revenue', e.target.value)}
                  placeholder="e.g., $50M"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employees">Employees <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="employees"
                    value={wizardData.companyBasics.employees}
                    onChange={(e) => updateCompanyBasics('employees', e.target.value)}
                    placeholder="e.g., 250"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="founded">Year Founded <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="founded"
                    value={wizardData.companyBasics.founded}
                    onChange={(e) => updateCompanyBasics('founded', e.target.value)}
                    placeholder="e.g., 2010"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      // ================================================================
      // STEP 3 — Financial Position (Primary Gate to Analysis)
      // ================================================================
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Financial Position</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This step is the primary gate to analysis. Enter raw numbers only — no $, M, K suffixes.
              </p>
            </div>

            {/* A. Liquidity Inputs */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">A. Liquidity Inputs</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cashOnHand">Cash on Hand ($M) *</Label>
                  <Input
                    id="cashOnHand"
                    type="text"
                    inputMode="decimal"
                    value={wizardData.runwayInputs.cashOnHand}
                    onChange={(e) => updateRunwayInputs('cashOnHand', sanitizeNumeric(e.target.value))}
                    placeholder="e.g., 5"
                  />
                  {wizardData.runwayInputs.cashOnHand && !/^-?\d+(\.\d+)?$/.test(wizardData.runwayInputs.cashOnHand.trim()) && (
                    <p className="text-xs text-destructive">Must be a number (in $M, no suffixes)</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="monthlyBurn">Monthly Cash Burn ($M) *</Label>
                  <Input
                    id="monthlyBurn"
                    type="text"
                    inputMode="decimal"
                    value={wizardData.runwayInputs.monthlyBurn}
                    onChange={(e) => updateRunwayInputs('monthlyBurn', sanitizeNumeric(e.target.value))}
                    placeholder="e.g., 1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Negative burn indicates a cash-generating business
                  </p>
                </div>

                {computedRunway !== null && (
                  <div className="p-3 rounded bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Computed Runway: </span>
                      <span className="font-mono">
                        {computedRunway >= 99 ? 'Cash generating (no runway constraint)' : `${computedRunway.toFixed(1)} months`}
                      </span>
                      <span className="text-xs ml-2">(Cash ÷ Burn)</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* B. Deal Economics — Required */}
            <DealEconomicsForm
              data={wizardData.dealEconomics}
              onChange={updateDealEconomics}
            />

            {(() => {
              const errors = getDealEconomicsErrors(wizardData.dealEconomics);
              if (errors.length === 0) return null;
              return (
                <div className="p-3 rounded bg-warning/10 border border-warning/30 text-sm text-warning-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <span className="font-medium">Missing fields to unlock Step 4:</span>
                  </div>
                  <ul className="list-disc list-inside ml-6 text-xs space-y-0.5">
                    {errors.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              );
            })()}
          </div>
        );

      // ================================================================
      // STEP 4 — Operating Metrics (Optional but Recommended)
      // ================================================================
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Operating Metrics</h3>
              <p className="text-sm text-muted-foreground mb-6">
                These fields are optional but recommended. Any available data improves diagnostic accuracy.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="annualEbitda">Annual EBITDA</Label>
                <Input
                  id="annualEbitda"
                  value={wizardData.operatingMetrics.annualEbitda}
                  onChange={(e) => updateOperatingMetrics('annualEbitda', e.target.value)}
                  placeholder="e.g., $8M"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grossMargin">Gross Margin</Label>
                <Input
                  id="grossMargin"
                  value={wizardData.operatingMetrics.grossMargin}
                  onChange={(e) => updateOperatingMetrics('grossMargin', e.target.value)}
                  placeholder="e.g., 45%"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="revenueGrowthYoY">Revenue Growth (YoY)</Label>
                <Input
                  id="revenueGrowthYoY"
                  value={wizardData.operatingMetrics.revenueGrowthYoY}
                  onChange={(e) => updateOperatingMetrics('revenueGrowthYoY', e.target.value)}
                  placeholder="e.g., -5% or 15%"
                />
              </div>
            </div>
          </div>
        );

      // ================================================================
      // STEP 5 — Constraints (Strict numeric debt fields)
      // ================================================================
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Constraints</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Debt obligations and covenants significantly impact available options.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded border border-border">
                <div>
                  <Label className="text-base">Has Outstanding Debt?</Label>
                  <p className="text-sm text-muted-foreground">Include bank debt, bonds, or other obligations</p>
                </div>
                <Switch
                  checked={wizardData.runwayInputs.hasDebt}
                  onCheckedChange={(checked) => updateRunwayInputs('hasDebt', checked)}
                />
              </div>

              {wizardData.runwayInputs.hasDebt && (
                <>
                  {/* Show computed debt from EV-Equity if available */}
                  {computedDebt !== null ? (
                    <div className="p-3 rounded bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Computed Total Debt: </span>
                        <span className="font-mono">${computedDebt}M</span>
                        <span className="text-xs ml-2">(EV − Equity from Deal Economics)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Debt amount is derived from Deal Economics. Only enter a separate amount below if this represents a different obligation.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="debtAmount">Total Debt Amount ($M) *</Label>
                      <Input
                        id="debtAmount"
                        type="text"
                        inputMode="decimal"
                        value={wizardData.runwayInputs.debtAmount}
                        onChange={(e) => updateRunwayInputs('debtAmount', sanitizeNumeric(e.target.value))}
                        placeholder="e.g., 75"
                      />
                      {wizardData.runwayInputs.debtAmount && !/^-?\d+(\.\d+)?$/.test(wizardData.runwayInputs.debtAmount.trim()) && (
                        <p className="text-xs text-destructive">Must be a number (in $M, no suffixes)</p>
                      )}
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="debtMaturity">Debt Maturity (months) *</Label>
                    <Input
                      id="debtMaturity"
                      type="text"
                      inputMode="numeric"
                      value={wizardData.runwayInputs.debtMaturity}
                      onChange={(e) => updateRunwayInputs('debtMaturity', sanitizeNumeric(e.target.value))}
                      placeholder="e.g., 18"
                    />
                    {wizardData.runwayInputs.debtMaturity && !/^\d+$/.test(wizardData.runwayInputs.debtMaturity.trim()) && (
                      <p className="text-xs text-destructive">Must be a whole number (months)</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      // ================================================================
      // STEP 6 — Known Risks
      // ================================================================
      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Known Risks & Concerns</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select any risk signals that apply. This helps prioritize analysis areas.
              </p>
            </div>

            <div className="grid gap-2">
              {signalOptions.map((signal) => (
                <label
                  key={signal}
                  className="flex items-center gap-3 p-3 rounded border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={wizardData.signalChecklist.signals.includes(signal)}
                    onCheckedChange={(checked) => updateSignals(signal, !!checked)}
                  />
                  <span className="text-sm">{signal}</span>
                </label>
              ))}
            </div>

            <div className="grid gap-2 mt-4">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={wizardData.signalChecklist.notes}
                onChange={(e) => updateNotes(e.target.value)}
                placeholder="Any additional context or concerns..."
                rows={4}
              />
            </div>
          </div>
        );

      // ================================================================
      // STEP 7 — Data Quality & Situation Classification
      // ================================================================
      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Data Quality & Situation Classification</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select the situation type and review your inputs. The system will generate a Decision Packet based on all provided data.
              </p>
            </div>

            {/* Situation Type Selection */}
            <div className="space-y-4">
              <Label>Select Situation Type *</Label>
              <div className="grid gap-2">
                {situationTypes.map((situation) => (
                  <label
                    key={situation.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors",
                      wizardData.situation?.id === situation.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:bg-muted/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="situation"
                      checked={wizardData.situation?.id === situation.id}
                      onChange={() => selectSituation(situation.id)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      wizardData.situation?.id === situation.id
                        ? "border-accent bg-accent"
                        : "border-muted-foreground/40"
                    )}>
                      {wizardData.situation?.id === situation.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{situation.title}</span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase',
                          situation.urgency === 'critical' && 'bg-destructive/10 text-destructive',
                          situation.urgency === 'high' && 'bg-warning/10 text-warning',
                          situation.urgency === 'medium' && 'bg-muted text-muted-foreground',
                          situation.urgency === 'low' && 'bg-success/10 text-success'
                        )}>
                          {situation.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{situation.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Input Summary — now shows computed values */}
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Input Summary (Observed + Computed)</h4>
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3 text-sm">
                <SummaryRow label="Tier" value={outputConfig.tier.charAt(0).toUpperCase() + outputConfig.tier.slice(1)} />
                <SummaryRow label="Company" value={wizardData.companyBasics.companyName || '—'} />
                <SummaryRow label="Industry" value={wizardData.companyBasics.industry || '—'} />
                <SummaryRow label="Cash on Hand" value={wizardData.runwayInputs.cashOnHand ? `$${wizardData.runwayInputs.cashOnHand}M` : '—'} />
                <SummaryRow label="Monthly Burn" value={wizardData.runwayInputs.monthlyBurn ? `$${wizardData.runwayInputs.monthlyBurn}M` : '—'} />
                {computedRunway !== null && (
                  <SummaryRow
                    label="Runway (computed)"
                    value={computedRunway >= 99 ? 'Cash generating' : `${computedRunway.toFixed(1)} months`}
                    computed
                  />
                )}
                <div className="border-t border-border pt-2 mt-2" />
                <SummaryRow label="Deal Type" value={wizardData.dealEconomics.dealType || '—'} />
                <SummaryRow label="Enterprise Value" value={wizardData.dealEconomics.enterpriseValue ? `$${wizardData.dealEconomics.enterpriseValue}M` : '—'} />
                <SummaryRow label="Equity Check" value={wizardData.dealEconomics.equityCheck ? `$${wizardData.dealEconomics.equityCheck}M` : '—'} />
                {computedDebt && (
                  <SummaryRow label="Total Debt (computed)" value={`$${computedDebt}M`} computed />
                )}
                <SummaryRow label="Entry EBITDA" value={wizardData.dealEconomics.entryEbitda ? `$${wizardData.dealEconomics.entryEbitda}M` : '—'} />
                {(() => {
                  const ev = parseFloat(wizardData.dealEconomics.enterpriseValue);
                  const ebitda = parseFloat(wizardData.dealEconomics.entryEbitda);
                  const debt = computedDebt ? parseFloat(computedDebt) : 0;
                  return (
                    <>
                      {!isNaN(ev) && !isNaN(ebitda) && ebitda > 0 && (
                        <SummaryRow label="Entry Multiple (computed)" value={`${(ev / ebitda).toFixed(2)}x`} computed />
                      )}
                      {debt > 0 && !isNaN(ebitda) && ebitda > 0 && (
                        <SummaryRow label="Entry Leverage (computed)" value={`${(debt / ebitda).toFixed(2)}x`} computed />
                      )}
                    </>
                  );
                })()}
                <SummaryRow label="EBITDA Margin" value={wizardData.dealEconomics.ebitdaMargin ? `${wizardData.dealEconomics.ebitdaMargin}%` : '—'} />
                <SummaryRow label="US Revenue" value={wizardData.dealEconomics.usRevenuePct ? `${wizardData.dealEconomics.usRevenuePct}%` : '—'} />
                {wizardData.dealEconomics.usRevenuePct && (
                  <SummaryRow label="Non-US Revenue (computed)" value={`${100 - parseFloat(wizardData.dealEconomics.usRevenuePct || '0')}%`} computed />
                )}
                <SummaryRow label="Export Exposure" value={wizardData.dealEconomics.exportExposurePct ? `${wizardData.dealEconomics.exportExposurePct}%` : '—'} />
                <SummaryRow label="Risk Signals" value={wizardData.signalChecklist.signals.length > 0 ? wizardData.signalChecklist.signals.join(', ') : 'None selected'} />
                <SummaryRow label="Situation" value={wizardData.situation?.title || 'Not selected'} />
              </div>
            </div>

            <div className="p-4 rounded bg-muted/30 border border-border mt-4">
              <p className="text-sm text-foreground font-medium mb-2">Ready to Generate</p>
              <p className="text-sm text-muted-foreground">
                Before running, the system will validate all inputs, compute derived fields, and detect any conflicts. Only the normalized object with computed fields is sent to the analysis engine.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <EnterpriseLayout>
      <PageHeader 
        title="Guided Diagnostic Input" 
        subtitle={`Step ${currentStep} of ${steps.length}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Run Diagnostic' },
        ]}
      />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          {/* Step Indicators */}
          {!showPreComputeGate && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded text-sm whitespace-nowrap transition-colors",
                      isActive && "bg-accent text-accent-foreground",
                      isComplete && "bg-success/10 text-success cursor-pointer",
                      !isActive && !isComplete && "bg-muted text-muted-foreground"
                    )}
                    disabled={step.id > currentStep}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                      isActive && "bg-accent-foreground/20",
                      isComplete && "bg-success/20"
                    )}>
                      {isComplete ? <Check className="w-3 h-3" /> : step.id}
                    </div>
                    <span className="hidden md:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step Content */}
          <div className="enterprise-card p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          {!showPreComputeGate && (
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                  disabled={!canProceed()}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : isRunning ? (
                <div className="flex flex-col items-end gap-2 w-full max-w-sm">
                  {jobProgress && (
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{jobProgress.stage.replace('-', ' ')}</span>
                        <span>{jobProgress.pct}%</span>
                      </div>
                      <Progress value={jobProgress.pct} className="h-2" />
                      <p className="text-xs text-muted-foreground truncate">{jobProgress.message}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button disabled>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Running Diagnostic...
                    </Button>
                    {activeJobId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          cancelJob(activeJobId);
                          setIsRunning(false);
                          setJobProgress(null);
                          setActiveJobId(null);
                          toast.info('Job cancelled');
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleRunDiagnostic}
                  disabled={!wizardData.situation}
                >
                  👉 Run Live Diagnostic
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}

/** Compact summary row for Step 7 review */
function SummaryRow({ label, value, computed }: { label: string; value: string; computed?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className={cn("whitespace-nowrap", computed ? "text-accent" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("text-right font-medium", computed ? "font-mono text-accent" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
