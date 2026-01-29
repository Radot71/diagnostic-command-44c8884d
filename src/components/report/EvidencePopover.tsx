import { ReactNode, useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info, Database, Calculator, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EvidenceType = 'observed' | 'inferred' | 'assumed';

interface EvidencePopoverProps {
  type: EvidenceType;
  source: string;
  details?: string;
  timestamp?: string;
  children: ReactNode;
  className?: string;
}

const evidenceConfig = {
  observed: {
    label: 'OBSERVED',
    icon: Database,
    description: 'Directly from user input',
    className: 'evidence-observed',
    iconColor: 'text-success',
  },
  inferred: {
    label: 'INFERRED',
    icon: Calculator,
    description: 'Calculated from inputs',
    className: 'evidence-inferred',
    iconColor: 'text-warning',
  },
  assumed: {
    label: 'ASSUMED',
    icon: AlertCircle,
    description: 'System default or benchmark',
    className: 'evidence-assumed',
    iconColor: 'text-destructive',
  },
};

export function EvidencePopover({ 
  type, 
  source, 
  details, 
  timestamp,
  children,
  className 
}: EvidencePopoverProps) {
  const config = evidenceConfig[type];
  const Icon = config.icon;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span 
          className={cn("cursor-help inline-flex items-center gap-1", className)}
          role="button"
          tabIndex={0}
          aria-label={`Evidence: ${config.label}. ${source}`}
        >
          {children}
          <Info className="w-3 h-3 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 bg-card border-border shadow-lg z-50" 
        align="start"
        side="top"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn('evidence-tag', config.className)}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </span>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Source
              </p>
              <p className="text-sm text-foreground">{source}</p>
            </div>
            
            {details && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Details
                </p>
                <p className="text-sm text-muted-foreground">{details}</p>
              </div>
            )}
            
            {timestamp && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Recorded
                </p>
                <p className="text-xs text-muted-foreground">{timestamp}</p>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Inline badge version without popover
export function EvidenceBadge({ type, showLabel = true }: { type: EvidenceType; showLabel?: boolean }) {
  const config = evidenceConfig[type];
  const Icon = config.icon;
  
  return (
    <span className={cn('evidence-tag', config.className)}>
      <Icon className="w-3 h-3" />
      {showLabel && <span className="ml-1">{config.label}</span>}
    </span>
  );
}
