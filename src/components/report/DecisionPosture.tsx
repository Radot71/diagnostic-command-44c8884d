/**
 * Decision Posture Module
 * 
 * A lightweight informational module that provides decision guidance.
 * Makes the system feel like a guide, not a report generator.
 * 
 * This component derives posture from existing analysis context.
 */

import { Shield, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PostureType = 'stabilize' | 'recover' | 'defend' | 'escalate';

interface DecisionPostureProps {
  /** The recommended decision posture */
  posture: PostureType;
  /** 1-2 sentences explaining the posture, pulled from existing analysis */
  reason: string;
  /** 1 sentence describing risk if action is delayed */
  riskIfDelayed: string;
  /** 1 sentence pointing to the first recommended action */
  nextAction: string;
  /** Additional CSS classes */
  className?: string;
}

const POSTURE_CONFIG: Record<PostureType, {
  label: string;
  icon: typeof Shield;
  colorClass: string;
  bgClass: string;
}> = {
  stabilize: {
    label: 'Stabilize',
    icon: Shield,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/10',
  },
  recover: {
    label: 'Recover',
    icon: TrendingUp,
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  defend: {
    label: 'Defend',
    icon: AlertTriangle,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  escalate: {
    label: 'Escalate',
    icon: Zap,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
};

export function DecisionPosture({ 
  posture, 
  reason, 
  riskIfDelayed, 
  nextAction,
  className 
}: DecisionPostureProps) {
  const config = POSTURE_CONFIG[posture];
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border border-border bg-card",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", config.bgClass)}>
          <Icon className={cn("w-4 h-4", config.colorClass)} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Decision Posture</h4>
          <span className={cn("text-xs font-medium", config.colorClass)}>{config.label}</span>
        </div>
      </div>

      <dl className="space-y-2.5 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Why
          </dt>
          <dd className="text-foreground leading-relaxed">{reason}</dd>
        </div>
        
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Risk if Delayed
          </dt>
          <dd className="text-muted-foreground leading-relaxed">{riskIfDelayed}</dd>
        </div>
        
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Next Action
          </dt>
          <dd className="text-foreground font-medium leading-relaxed">{nextAction}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Derive posture from wizard data and report context
 */
export function derivePosture(
  urgency: string | undefined,
  hasDebt: boolean,
  signalsCount: number,
  confidenceScore: number
): PostureType {
  // Critical urgency or high debt with multiple signals = Escalate
  if (urgency === 'critical' || (hasDebt && signalsCount >= 3)) {
    return 'escalate';
  }
  
  // High urgency or multiple warning signals = Defend
  if (urgency === 'high' || signalsCount >= 2) {
    return 'defend';
  }
  
  // Low confidence or moderate signals = Stabilize
  if (confidenceScore < 60 || signalsCount >= 1) {
    return 'stabilize';
  }
  
  // Default to recover if situation is manageable
  return 'recover';
}
