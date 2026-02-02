import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiagnosticTier, TIER_CONFIGURATIONS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UpgradeNudgeBannerProps {
  currentTier: DiagnosticTier;
  stage: string;
  daysToCritical: number;
  className?: string;
}

/**
 * Upgrade nudge banner shown after diagnostic runs.
 * Behavioral design: feels logical, not sales-driven.
 */
export function UpgradeNudgeBanner({ 
  currentTier, 
  stage, 
  daysToCritical,
  className 
}: UpgradeNudgeBannerProps) {
  const navigate = useNavigate();
  
  // Don't show for full tier
  if (currentTier === 'full') return null;
  
  const nextTier = currentTier === 'prospect' ? 'executive' : 'full';
  const nextTierConfig = TIER_CONFIGURATIONS[nextTier];
  
  const upgradeMessage = currentTier === 'prospect'
    ? 'Upgrade to unlock a full 30-day action plan, board memo, and options analysis.'
    : 'Upgrade to unlock a full 30/90 plan, board deck, and stakeholder pack.';

  return (
    <div className={cn(
      "p-4 rounded-lg border border-warning/30 bg-warning/5",
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Your company is in a <span className="font-semibold">{stage}</span> state 
            {daysToCritical > 0 && (
              <> with <span className="font-semibold">{daysToCritical} days</span> to critical threshold</>
            )}.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {upgradeMessage}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/diagnostic')}
          className="flex-shrink-0"
        >
          {nextTierConfig.name}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
