import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Building2, DollarSign, BarChart3, Shield, AlertTriangle, FileCheck, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { situations, signalOptions } from '@/lib/mockData';
import { calcRunwayMonths } from '@/lib/currencyUtils';
import { runValidation } from '@/lib/validationRunner';
import { generateAIReport } from '@/lib/aiAnalysis';
import { saveReport } from '@/lib/reportPersistence';
import { TierSelection } from '@/components/intake/TierSelection';
import { GovernancePillars } from '@/components/report/GovernancePillars';
import { DealEconomicsForm, isDealEconomicsComplete } from '@/components/intake/DealEconomicsForm';
import { MacroSensitivity, TimeHorizonMonths } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, label: 'Diagnostic Tier', icon: Briefcase, description: 'Select analysis depth and deliverables' },
  { id: 2, label: 'Company Context', icon: Building2, description: 'Basic company information and industry' },
  { id: 3, label: 'Financial Position', icon: DollarSign, description: 'Cash, revenue, and capital structure' },
  { id: 4, label: 'Operating Metrics', icon: BarChart3, description: 'Key performance indicators' },
  { id: 5, label: 'Constraints', icon: Shield, description: 'Debt, covenants, and obligations' },
  { id: 6, label: 'Known Risks', icon: AlertTriangle, description: 'Identified concerns and signals' },
  { id: 7, label: 'Data Quality', icon: FileCheck, description: 'Confidence and completeness' },
];

export default function DiagnosticIntake() {
  const navigate = useNavigate();
  const { wizardData, setWizardData, setReport, setOutputConfig, outputConfig, setReportSource, setReportId } = useDiagnostic();
  const [currentStep, setCurrentStep] = useState(1);

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
    const situation = situations.find(s => s.id === situationId) || null;
    setWizardData(prev => ({ ...prev, situation }));
  };

  const [isRunning, setIsRunning] = useState(false);

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    try {
      // Use AI-powered analysis via Claude — NO mock fallback
      toast.info('Generating AI analysis...', { duration: 10000 });
      const aiReport = await generateAIReport(wizardData, 'rapid', outputConfig.tier);
      const validatedReport = await runValidation(aiReport);
      setReport(validatedReport);
      setReportSource('claude');
      setOutputConfig({ mode: 'rapid', strictMode: true, tier: outputConfig.tier });

      // Persist to database
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
        // Still navigate even if save fails — report is in context
        toast.success('Diagnostic report generated!');
        navigate('/report');
      }
    } catch (error) {
      console.error('[DiagnosticOS] Diagnostic run failed:', error);
      // NO mock fallback — show clear error and stay on page
      toast.error(
        error instanceof Error ? error.message : 'Analysis could not be completed. Please retry or contact support.',
        { duration: 8000 }
      );
      // Do NOT navigate to /report. Do NOT store a mock report.
    } finally {
      setIsRunning(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Tier is always selected (defaults to 'full')
      case 2:
        return wizardData.companyBasics.companyName && wizardData.companyBasics.industry;
      case 3:
        return wizardData.runwayInputs.cashOnHand && wizardData.runwayInputs.monthlyBurn && isDealEconomicsComplete(wizardData.dealEconomics);
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Company Context</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Provide basic information about the company being analyzed. This establishes the foundation for the diagnostic.
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="revenue">Annual Revenue</Label>
                  <Input
                    id="revenue"
                    value={wizardData.companyBasics.revenue}
                    onChange={(e) => updateCompanyBasics('revenue', e.target.value)}
                    placeholder="e.g., $50M"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employees">Employees</Label>
                  <Input
                    id="employees"
                    value={wizardData.companyBasics.employees}
                    onChange={(e) => updateCompanyBasics('employees', e.target.value)}
                    placeholder="e.g., 250"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="founded">Year Founded</Label>
                <Input
                  id="founded"
                  value={wizardData.companyBasics.founded}
                  onChange={(e) => updateCompanyBasics('founded', e.target.value)}
                  placeholder="e.g., 2010"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Financial Position</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Understanding the current financial state is critical for assessing risk and runway.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cashOnHand">Cash on Hand *</Label>
                <Input
                  id="cashOnHand"
                  value={wizardData.runwayInputs.cashOnHand}
                  onChange={(e) => updateRunwayInputs('cashOnHand', e.target.value)}
                  placeholder="e.g., $5M"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="monthlyBurn">Monthly Cash Burn *</Label>
                <Input
                  id="monthlyBurn"
                  value={wizardData.runwayInputs.monthlyBurn}
                  onChange={(e) => updateRunwayInputs('monthlyBurn', e.target.value)}
                  placeholder="e.g., $500K"
                />
                <p className="text-xs text-muted-foreground">
                  Negative burn indicates a cash-generating business
                </p>
              </div>

              {wizardData.runwayInputs.cashOnHand && wizardData.runwayInputs.monthlyBurn && (
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Computed Runway: </span>
                    {(() => {
                      const runway = calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn);
                      if (runway >= 99) return 'Cash generating (no runway constraint)';
                      if (runway > 0) return `${runway.toFixed(1)} months`;
                      return 'Unable to calculate';
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Deal Economics — Required Section */}
            <DealEconomicsForm
              data={wizardData.dealEconomics}
              onChange={updateDealEconomics}
            />

            {!isDealEconomicsComplete(wizardData.dealEconomics) && (
              <div className="p-3 rounded bg-warning/10 border border-warning/30 text-sm text-warning-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                Complete Deal Economics to enable deterministic analysis.
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Operating Metrics</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Key performance indicators help assess operational health and trajectory.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>EBITDA (Annual)</Label>
                <Input placeholder="e.g., $8M" />
              </div>
              <div className="grid gap-2">
                <Label>Gross Margin</Label>
                <Input placeholder="e.g., 45%" />
              </div>
              <div className="grid gap-2">
                <Label>Revenue Growth (YoY)</Label>
                <Input placeholder="e.g., -5% or 15%" />
              </div>
            </div>
          </div>
        );

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
                  <Label className="text-base">Has Outstanding Debt</Label>
                  <p className="text-sm text-muted-foreground">Include bank debt, bonds, or other obligations</p>
                </div>
                <Switch
                  checked={wizardData.runwayInputs.hasDebt}
                  onCheckedChange={(checked) => updateRunwayInputs('hasDebt', checked)}
                />
              </div>

              {wizardData.runwayInputs.hasDebt && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="debtAmount">Total Debt Amount</Label>
                    <Input
                      id="debtAmount"
                      value={wizardData.runwayInputs.debtAmount}
                      onChange={(e) => updateRunwayInputs('debtAmount', e.target.value)}
                      placeholder="e.g., $25M"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="debtMaturity">Time to Maturity</Label>
                    <Input
                      id="debtMaturity"
                      value={wizardData.runwayInputs.debtMaturity}
                      onChange={(e) => updateRunwayInputs('debtMaturity', e.target.value)}
                      placeholder="e.g., 18 months"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Known Risks & Concerns</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select any warning signals that apply. This helps prioritize analysis areas.
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

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Confidence & Data Quality</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Review your inputs and select the diagnostic type. The system will generate a Decision Packet based on available data.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Select Situation Type</Label>
                <div className="grid gap-2">
                  {situations.slice(0, 6).map((situation) => (
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{situation.title}</span>
                          <span className={cn(
                            'severity-badge text-[10px]',
                            situation.urgency === 'critical' && 'severity-red',
                            situation.urgency === 'high' && 'severity-orange',
                            situation.urgency === 'medium' && 'severity-yellow',
                            situation.urgency === 'low' && 'severity-green'
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
            </div>

            <div className="p-4 rounded bg-muted/30 border border-border mt-6">
              <p className="text-sm text-foreground font-medium mb-2">Ready to Generate</p>
              <p className="text-sm text-muted-foreground">
                This diagnostic runs a deterministic institutional engine that produces a decision-grade analysis in seconds — with full audit trail, quantified uncertainty, and clear strategic options.
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
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isComplete = step.id < currentStep;
              const Icon = step.icon;

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

          {/* Step Content */}
          <div className="enterprise-card p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
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
              <Button disabled>
                <span className="animate-pulse">Running Diagnostic...</span>
              </Button>
            ) : (
              <Button
                onClick={handleRunDiagnostic}
                disabled={!wizardData.situation}
              >
                Run Diagnostic
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}