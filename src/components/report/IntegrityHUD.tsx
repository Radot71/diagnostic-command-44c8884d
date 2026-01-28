import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { cn } from '@/lib/utils';

interface MissingDataItem {
  label: string;
  field: string;
  section: 'basics' | 'runway' | 'signals';
  impact: number; // How much this affects confidence (percentage points)
}

const MISSING_DATA_CONFIG: MissingDataItem[] = [
  { label: 'Company Revenue', field: 'revenue', section: 'basics', impact: 8 },
  { label: 'Employee Count', field: 'employees', section: 'basics', impact: 5 },
  { label: 'Year Founded', field: 'founded', section: 'basics', impact: 3 },
  { label: 'Cash on Hand', field: 'cashOnHand', section: 'runway', impact: 15 },
  { label: 'Monthly Burn Rate', field: 'monthlyBurn', section: 'runway', impact: 12 },
  { label: 'Debt Amount', field: 'debtAmount', section: 'runway', impact: 10 },
  { label: 'Debt Maturity', field: 'debtMaturity', section: 'runway', impact: 5 },
  { label: 'Warning Signals', field: 'signals', section: 'signals', impact: 8 },
  { label: 'Additional Notes', field: 'notes', section: 'signals', impact: 4 },
];

export function IntegrityHUD() {
  const navigate = useNavigate();
  const { report, wizardData, outputConfig } = useDiagnostic();
  
  if (!report) return null;

  const { integrity } = report;
  
  // Calculate actual missing fields
  const missingFields = MISSING_DATA_CONFIG.filter(item => {
    switch (item.section) {
      case 'basics':
        return !wizardData.companyBasics[item.field as keyof typeof wizardData.companyBasics];
      case 'runway':
        if (item.field === 'debtAmount' || item.field === 'debtMaturity') {
          return wizardData.runwayInputs.hasDebt && 
            !wizardData.runwayInputs[item.field as keyof typeof wizardData.runwayInputs];
        }
        return !wizardData.runwayInputs[item.field as keyof typeof wizardData.runwayInputs];
      case 'signals':
        if (item.field === 'signals') {
          return wizardData.signalChecklist.signals.length === 0;
        }
        return !wizardData.signalChecklist.notes;
      default:
        return false;
    }
  });

  const totalMissingImpact = missingFields.reduce((acc, item) => acc + item.impact, 0);
  const maxConfidence = 100 - totalMissingImpact;
  const confidenceScore = Math.min(integrity.confidence, maxConfidence);
  const isCapped = integrity.confidence >= maxConfidence && missingFields.length > 0;
  
  // Calculate next milestone
  const currentProgress = confidenceScore;
  const nextMilestone = currentProgress < 60 ? 60 : currentProgress < 80 ? 80 : 100;
  const pointsToNext = nextMilestone - currentProgress;
  const fieldsNeededForMilestone = missingFields
    .sort((a, b) => b.impact - a.impact)
    .filter((_, i, arr) => {
      const cumulative = arr.slice(0, i + 1).reduce((acc, item) => acc + item.impact, 0);
      return cumulative <= pointsToNext + 5; // Show slightly more than needed
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-urgent';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-urgent';
  };

  const handleNavigateToField = (section: string) => {
    // Navigate to intake with step based on section
    const stepMap = { basics: 0, runway: 1, signals: 2 };
    navigate(`/intake?step=${stepMap[section as keyof typeof stepMap] || 0}`);
  };

  return (
    <div className="board-card p-4 h-fit sticky top-4">
      <h3 className="font-semibold text-foreground mb-4">Integrity HUD</h3>

      {/* Overall Confidence Score */}
      <div className="text-center mb-6">
        <div className={cn(
          "w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white",
          getScoreColor(confidenceScore)
        )}>
          {confidenceScore}%
        </div>
        <p className="text-sm text-muted-foreground mt-2">Confidence Score</p>
        
        {/* Capped Warning */}
        {isCapped && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1 mt-2 text-xs text-warning cursor-help">
                  <Info className="w-3 h-3" />
                  Capped at {maxConfidence}%
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">
                  Missing: {missingFields.slice(0, 3).map(f => f.label).join(', ')}
                  {missingFields.length > 3 && ` +${missingFields.length - 3} more`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Low Confidence Banner for non-strict mode */}
        {!outputConfig.strictMode && confidenceScore < 70 && (
          <div className="mt-3 px-3 py-1.5 rounded-md bg-warning/10 border border-warning/20">
            <span className="text-xs font-medium text-warning">LOW CONFIDENCE</span>
          </div>
        )}
      </div>

      {/* Progress to Next Milestone */}
      {pointsToNext > 0 && pointsToNext < 30 && (
        <div className="mb-6 p-3 rounded-lg bg-muted/50">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progress to {nextMilestone}%</span>
            <span className={getScoreTextColor(currentProgress)}>
              +{Math.min(pointsToNext, fieldsNeededForMilestone.reduce((a, f) => a + f.impact, 0))} pts possible
            </span>
          </div>
          <Progress value={(currentProgress / nextMilestone) * 100} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            Add {Math.min(fieldsNeededForMilestone.length, 3)} more field{fieldsNeededForMilestone.length !== 1 ? 's' : ''} to reach {nextMilestone}%
          </p>
        </div>
      )}

      {/* Individual Metrics */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Completeness</span>
            <span className="font-medium">{integrity.completeness}%</span>
          </div>
          <Progress value={integrity.completeness} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Evidence Quality</span>
            <span className="font-medium">{integrity.evidenceQuality}%</span>
          </div>
          <Progress value={integrity.evidenceQuality} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{integrity.confidence}%</span>
          </div>
          <Progress value={integrity.confidence} className="h-2" />
        </div>
      </div>

      {/* Missing Data with Clickable Links */}
      {missingFields.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Missing Data ({missingFields.length})
          </h4>
          <ul className="space-y-1">
            {missingFields.map((item, index) => (
              <li
                key={index}
                onClick={() => handleNavigateToField(item.section)}
                className="flex items-center justify-between text-xs text-muted-foreground py-1.5 px-2 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
              >
                <span>{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60">+{item.impact}%</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Also show original missing data from report */}
      {integrity.missingData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Additional Data Gaps
          </h4>
          <ul className="space-y-1">
            {integrity.missingData.slice(0, 3).map((item, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground/80 py-1 px-2"
              >
                {item}
              </li>
            ))}
            {integrity.missingData.length > 3 && (
              <li className="text-xs text-muted-foreground/60 py-1 px-2">
                +{integrity.missingData.length - 3} more items
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
