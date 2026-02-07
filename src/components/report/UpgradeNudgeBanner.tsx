import { AlertTriangle, ArrowRight, BarChart3, FileText, Map } from 'lucide-react';
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
 * Governance-grade framing: urgency without marketing language.
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

  const previewItems = currentTier === 'prospect'
    ? [
        { icon: BarChart3, label: 'Board memo with scenario analysis' },
        { icon: FileText, label: 'Options comparison table' },
        { icon: Map, label: '30-day action plan' },
      ]
    : [
        { icon: BarChart3, label: 'Board slide deck (10 slides)' },
        { icon: FileText, label: 'Evidence register with audit trail' },
        { icon: Map, label: '30/90-day execution roadmap' },
      ];

  return (
    <div className={cn(
      "p-4 rounded-lg border border-warning/30 bg-warning/5",
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            You are making a{' '}
            <span className="uppercase">{stage}</span> decision with partial visibility.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            The {nextTierConfig.name} converts advisory insight into auditable governance.
          </p>

          {/* Preview thumbnails */}
          <div className="flex items-center gap-4 mt-3">
            {previewItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <item.icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
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
