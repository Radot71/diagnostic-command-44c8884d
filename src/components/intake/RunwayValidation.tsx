import { useMemo } from 'react';
import { AlertCircle, Info, CheckCircle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RunwayValidationProps {
  cashOnHand: string;
  monthlyBurn: string;
  revenue?: string;
  ebitda?: string;
}

// Parse currency/number string to numeric value
export function parseAmount(value: string): number | null {
  if (!value) return null;
  // Remove currency symbols, commas, and common suffixes
  const cleaned = value.replace(/[$,]/g, '').trim().toLowerCase();
  
  // Handle suffixes like M (million) or K (thousand)
  let multiplier = 1;
  let numStr = cleaned;
  
  if (cleaned.endsWith('m')) {
    multiplier = 1000000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('k')) {
    multiplier = 1000;
    numStr = cleaned.slice(0, -1);
  }
  
  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  
  return num * multiplier;
}

export function formatMonths(months: number): string {
  if (months < 0) return 'Cash generating';
  if (months === Infinity) return '∞';
  if (months < 1) return `${Math.round(months * 30)} days`;
  return `${months.toFixed(1)} months`;
}

export function useRunwayCalculation({ cashOnHand, monthlyBurn }: RunwayValidationProps) {
  return useMemo(() => {
    const cash = parseAmount(cashOnHand);
    const burn = parseAmount(monthlyBurn);
    
    if (cash === null || burn === null) {
      return { runway: null, isNegativeBurn: false };
    }
    
    if (burn === 0) {
      return { runway: Infinity, isNegativeBurn: false };
    }
    
    const runway = cash / burn;
    const isNegativeBurn = burn < 0;
    
    return { runway, isNegativeBurn };
  }, [cashOnHand, monthlyBurn]);
}

export function RunwayDisplay({ cashOnHand, monthlyBurn }: RunwayValidationProps) {
  const { runway, isNegativeBurn } = useRunwayCalculation({ cashOnHand, monthlyBurn });
  
  if (runway === null) return null;
  
  return (
    <div className="flex items-center gap-2 mt-2">
      <CheckCircle className="w-4 h-4 text-success" />
      <span className="text-sm text-muted-foreground">
        Computed: <span className="font-medium text-foreground">{formatMonths(runway)}</span>
      </span>
      {isNegativeBurn && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-info cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Negative burn = cash generating business</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface MathCheckWarningProps {
  computedRunway: number | null;
  statedRunway: string;
  cashOnHand: string;
  monthlyBurn: string;
}

export function MathCheckWarning({ 
  computedRunway, 
  statedRunway,
  cashOnHand,
  monthlyBurn
}: MathCheckWarningProps) {
  const statedValue = parseAmount(statedRunway);
  
  if (computedRunway === null || statedValue === null) return null;
  if (computedRunway === Infinity) return null;
  
  // Allow 10% tolerance for rounding
  const tolerance = Math.max(0.5, statedValue * 0.1);
  const difference = Math.abs(computedRunway - statedValue);
  
  if (difference <= tolerance) return null;
  
  return (
    <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-warning/10 border border-warning/20">
      <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
      <span className="text-sm text-warning">
        Math check: {cashOnHand} ÷ {monthlyBurn}/mo = {formatMonths(computedRunway)}, not {statedRunway}
      </span>
    </div>
  );
}

interface EbitdaValidationProps {
  revenue: string;
  ebitda: string;
}

export function EbitdaValidation({ revenue, ebitda }: EbitdaValidationProps) {
  const revenueValue = parseAmount(revenue);
  const ebitdaValue = parseAmount(ebitda);
  
  if (revenueValue === null || ebitdaValue === null) return null;
  if (ebitdaValue <= revenueValue) return null;
  
  return (
    <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <span className="text-sm text-destructive font-medium">
        Impossible: EBITDA cannot exceed Revenue
      </span>
    </div>
  );
}

interface NegativeBurnTooltipProps {
  burn: string;
}

export function NegativeBurnIndicator({ burn }: NegativeBurnTooltipProps) {
  const burnValue = parseAmount(burn);
  
  if (burnValue === null || burnValue >= 0) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-info/10 text-info text-xs cursor-help">
            <Info className="w-3 h-3" />
            Cash positive
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Negative burn = cash generating business</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
