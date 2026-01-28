import { useDiagnostic } from '@/lib/diagnosticContext';
import { EvidenceItem, EvidenceType } from './EvidenceTag';
import { parseAmount, formatMonths } from '@/components/intake/RunwayValidation';

interface EvidenceEntry {
  text: string;
  type: EvidenceType;
  source?: string;
}

export function EvidenceRegister() {
  const { wizardData, report } = useDiagnostic();
  
  if (!report) return null;
  
  const { companyBasics, runwayInputs, signalChecklist } = wizardData;
  
  // Build evidence entries with proper tagging
  const entries: EvidenceEntry[] = [];
  
  // Company basics - all OBSERVED
  if (companyBasics.companyName) {
    entries.push({
      text: `Company: ${companyBasics.companyName}`,
      type: 'observed',
      source: 'User input: Company Basics',
    });
  }
  if (companyBasics.industry) {
    entries.push({
      text: `Industry: ${companyBasics.industry}`,
      type: 'observed',
      source: 'User input: Company Basics',
    });
  }
  if (companyBasics.revenue) {
    entries.push({
      text: `Annual Revenue: ${companyBasics.revenue}`,
      type: 'observed',
      source: 'User input: Company Basics',
    });
  }
  if (companyBasics.employees) {
    entries.push({
      text: `Employee Count: ${companyBasics.employees}`,
      type: 'observed',
      source: 'User input: Company Basics',
    });
  }
  if (companyBasics.founded) {
    entries.push({
      text: `Founded: ${companyBasics.founded}`,
      type: 'observed',
      source: 'User input: Company Basics',
    });
  }
  
  // Runway inputs - OBSERVED
  if (runwayInputs.cashOnHand) {
    entries.push({
      text: `Cash on Hand: ${runwayInputs.cashOnHand}`,
      type: 'observed',
      source: 'User input: Runway & Clock',
    });
  }
  if (runwayInputs.monthlyBurn) {
    entries.push({
      text: `Monthly Burn Rate: ${runwayInputs.monthlyBurn}`,
      type: 'observed',
      source: 'User input: Runway & Clock',
    });
  }
  
  // Runway calculation - INFERRED
  const cash = parseAmount(runwayInputs.cashOnHand);
  const burn = parseAmount(runwayInputs.monthlyBurn);
  if (cash !== null && burn !== null && burn !== 0) {
    const runway = cash / burn;
    entries.push({
      text: `Calculated Runway: ${formatMonths(runway)}`,
      type: 'inferred',
      source: `Calculated from: ${runwayInputs.cashOnHand} ÷ ${runwayInputs.monthlyBurn}`,
    });
  }
  
  // Debt info - OBSERVED
  if (runwayInputs.hasDebt) {
    if (runwayInputs.debtAmount) {
      entries.push({
        text: `Total Debt: ${runwayInputs.debtAmount}`,
        type: 'observed',
        source: 'User input: Runway & Clock',
      });
    }
    if (runwayInputs.debtMaturity) {
      entries.push({
        text: `Debt Maturity: ${runwayInputs.debtMaturity}`,
        type: 'observed',
        source: 'User input: Runway & Clock',
      });
    }
  }
  
  // Signals - OBSERVED
  if (signalChecklist.signals.length > 0) {
    signalChecklist.signals.forEach(signal => {
      entries.push({
        text: `Signal: ${signal}`,
        type: 'observed',
        source: 'User input: Signals Checklist',
      });
    });
  }
  
  // Notes - OBSERVED
  if (signalChecklist.notes) {
    entries.push({
      text: `Additional Context: ${signalChecklist.notes}`,
      type: 'observed',
      source: 'User input: Additional Notes',
    });
  }
  
  // System defaults/benchmarks - ASSUMED
  entries.push({
    text: 'Industry P&L benchmarks applied',
    type: 'assumed',
    source: 'System default: Industry benchmarks for valuation multiples',
  });
  entries.push({
    text: 'Standard recovery rates for asset classes',
    type: 'assumed',
    source: 'System default: Based on historical restructuring data',
  });
  entries.push({
    text: 'Market conditions assumed stable',
    type: 'assumed',
    source: 'System default: No market disruption factored',
  });
  
  // Situation - OBSERVED
  if (wizardData.situation) {
    entries.push({
      text: `Situation Type: ${wizardData.situation.title}`,
      type: 'observed',
      source: 'User selection: Situation Selector',
    });
    entries.push({
      text: `Urgency Level: ${wizardData.situation.urgency}`,
      type: 'observed',
      source: 'Derived from situation type',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Evidence Register</h2>
        <p className="text-sm text-muted-foreground mb-6">
          All data points used in this analysis are tagged by their source. 
          Hover over badges to see detailed provenance.
        </p>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success/20 text-success border border-success/30">
            OBSERVED
          </span>
          <span className="text-muted-foreground">Direct user input</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-warning/20 text-warning border border-warning/30">
            INFERRED
          </span>
          <span className="text-muted-foreground">Calculated from inputs</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-destructive/20 text-destructive border border-destructive/30">
            ASSUMED
          </span>
          <span className="text-muted-foreground">System default / benchmark</span>
        </div>
      </div>
      
      {/* Evidence Items */}
      <div className="divide-y divide-border">
        {entries.map((entry, index) => (
          <EvidenceItem 
            key={index}
            text={entry.text}
            type={entry.type}
            source={entry.source}
          />
        ))}
      </div>
    </div>
  );
}
