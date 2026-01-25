import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, DollarSign, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { signalOptions } from '@/lib/mockData';

const steps = [
  { id: 1, title: 'Company Basics', icon: Building2, description: 'Tell us about the company' },
  { id: 2, title: 'Runway & Clock', icon: DollarSign, description: 'Financial position and constraints' },
  { id: 3, title: 'Signals & Notes', icon: AlertCircle, description: 'Warning signs and context' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              currentStep > index
                ? 'bg-success text-success-foreground'
                : currentStep === index
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {currentStep > index ? <Check className="w-4 h-4" /> : step.id}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 ${
                currentStep > index ? 'bg-success' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1CompanyBasics() {
  const { wizardData, setWizardData } = useDiagnostic();
  const { companyBasics } = wizardData;

  const updateField = (field: keyof typeof companyBasics, value: string) => {
    setWizardData(prev => ({
      ...prev,
      companyBasics: { ...prev.companyBasics, [field]: value },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">{steps[0].title}</h2>
        <p className="text-muted-foreground text-sm">{steps[0].description}</p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            placeholder="e.g., Acme Industries"
            value={companyBasics.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., Manufacturing"
              value={companyBasics.industry}
              onChange={(e) => updateField('industry', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="revenue">Annual Revenue</Label>
            <Input
              id="revenue"
              placeholder="e.g., $50M"
              value={companyBasics.revenue}
              onChange={(e) => updateField('revenue', e.target.value)}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employees">Employee Count</Label>
            <Input
              id="employees"
              placeholder="e.g., 250"
              value={companyBasics.employees}
              onChange={(e) => updateField('employees', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="founded">Year Founded</Label>
            <Input
              id="founded"
              placeholder="e.g., 1995"
              value={companyBasics.founded}
              onChange={(e) => updateField('founded', e.target.value)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Step2RunwayInputs() {
  const { wizardData, setWizardData } = useDiagnostic();
  const { runwayInputs } = wizardData;

  const updateField = (field: keyof typeof runwayInputs, value: string | boolean) => {
    setWizardData(prev => ({
      ...prev,
      runwayInputs: { ...prev.runwayInputs, [field]: value },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">{steps[1].title}</h2>
        <p className="text-muted-foreground text-sm">{steps[1].description}</p>
      </div>

      <div className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cash">Cash on Hand</Label>
            <Input
              id="cash"
              placeholder="e.g., $5M"
              value={runwayInputs.cashOnHand}
              onChange={(e) => updateField('cashOnHand', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="burn">Monthly Burn Rate</Label>
            <Input
              id="burn"
              placeholder="e.g., $500K"
              value={runwayInputs.monthlyBurn}
              onChange={(e) => updateField('monthlyBurn', e.target.value)}
            />
          </div>
        </div>

        <div className="board-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label htmlFor="hasDebt" className="text-base">Has Debt?</Label>
              <p className="text-sm text-muted-foreground">Toggle if the company has outstanding debt</p>
            </div>
            <Switch
              id="hasDebt"
              checked={runwayInputs.hasDebt}
              onCheckedChange={(checked) => updateField('hasDebt', checked)}
            />
          </div>

          <AnimatePresence>
            {runwayInputs.hasDebt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border"
              >
                <div>
                  <Label htmlFor="debtAmount">Total Debt Amount</Label>
                  <Input
                    id="debtAmount"
                    placeholder="e.g., $20M"
                    value={runwayInputs.debtAmount}
                    onChange={(e) => updateField('debtAmount', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="debtMaturity">Time to Maturity</Label>
                  <Input
                    id="debtMaturity"
                    placeholder="e.g., 12 months"
                    value={runwayInputs.debtMaturity}
                    onChange={(e) => updateField('debtMaturity', e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Step3SignalsNotes() {
  const { wizardData, setWizardData } = useDiagnostic();
  const { signalChecklist } = wizardData;

  const toggleSignal = (signal: string) => {
    setWizardData(prev => ({
      ...prev,
      signalChecklist: {
        ...prev.signalChecklist,
        signals: prev.signalChecklist.signals.includes(signal)
          ? prev.signalChecklist.signals.filter(s => s !== signal)
          : [...prev.signalChecklist.signals, signal],
      },
    }));
  };

  const updateNotes = (notes: string) => {
    setWizardData(prev => ({
      ...prev,
      signalChecklist: { ...prev.signalChecklist, notes },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">{steps[2].title}</h2>
        <p className="text-muted-foreground text-sm">{steps[2].description}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base mb-3 block">Warning Signals (select all that apply)</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            {signalOptions.map(signal => (
              <div
                key={signal}
                className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={signal}
                  checked={signalChecklist.signals.includes(signal)}
                  onCheckedChange={() => toggleSignal(signal)}
                />
                <label
                  htmlFor={signal}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {signal}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes & Context</Label>
          <Textarea
            id="notes"
            placeholder="Any additional context, concerns, or specific areas to focus on..."
            rows={4}
            value={signalChecklist.notes}
            onChange={(e) => updateNotes(e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function GuidedIntake() {
  const navigate = useNavigate();
  const { wizardData, currentStep, setCurrentStep } = useDiagnostic();
  const [localStep, setLocalStep] = useState(0);

  const handleNext = () => {
    if (localStep < steps.length - 1) {
      setLocalStep(localStep + 1);
    } else {
      navigate('/output-mode');
    }
  };

  const handleBack = () => {
    if (localStep > 0) {
      setLocalStep(localStep - 1);
    } else {
      navigate('/situation');
    }
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        {/* Situation Badge */}
        {wizardData.situation && (
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground">
              Diagnosing: <span className="font-medium text-foreground">{wizardData.situation.title}</span>
            </span>
          </div>
        )}

        <StepIndicator currentStep={localStep} />

        <div className="board-card p-6">
          <AnimatePresence mode="wait">
            {localStep === 0 && <Step1CompanyBasics key="step1" />}
            {localStep === 1 && <Step2RunwayInputs key="step2" />}
            {localStep === 2 && <Step3SignalsNotes key="step3" />}
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext}>
              {localStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Choose Output Mode'
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
