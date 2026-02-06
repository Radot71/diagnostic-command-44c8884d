/**
 * Urgency Banner Component
 * 
 * Sticky banner displayed when severity is CRITICAL.
 * Nudges toward upgrade without blocking access.
 */

import { AlertTriangle, ArrowUpRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface UrgencyBannerProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  daysToAction: number;
  currentTier: 'prospect' | 'executive' | 'full';
  onUpgrade?: () => void;
  className?: string;
}

export function UrgencyBanner({
  severity,
  daysToAction,
  currentTier,
  onUpgrade,
  className,
}: UrgencyBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Only show for CRITICAL severity and non-full tiers
  if (severity !== 'critical' || currentTier === 'full' || isDismissed) {
    return null;
  }
  
  const timeRange = daysToAction <= 45 
    ? '30–45 days' 
    : daysToAction <= 60 
      ? '45–60 days' 
      : '60–90 days';
  
  return (
    <div className={cn(
      "sticky top-0 z-50 bg-destructive/95 text-destructive-foreground px-4 py-3 border-b border-destructive",
      className
    )}>
      <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              CRITICAL: Time-sensitive risk detected. Action required within {timeRange}.
            </p>
            <p className="text-xs opacity-90">
              {currentTier === 'prospect' 
                ? 'Upgrading to the Executive Snapshot provides scenario analysis, options comparison, and a 30-day action plan.'
                : 'Upgrading to the Full Decision Packet provides a complete execution roadmap, lender strategy, and evidence register.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive-foreground text-destructive rounded text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Upgrade Tier
            </button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
