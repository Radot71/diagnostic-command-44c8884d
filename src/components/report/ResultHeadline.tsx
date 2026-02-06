/**
 * Result Headline Component
 * 
 * Standard headline for all diagnostic artifacts.
 * Institutional language with deterministic disclosure.
 */

import { FileCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultHeadlineProps {
  className?: string;
  showDemo?: boolean;
  companyName?: string;
}

export function ResultHeadline({ className, showDemo, companyName }: ResultHeadlineProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-2.5 px-4 bg-muted/30 rounded border border-border",
      className
    )}>
      <div className="flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-accent flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Findings are deterministic.</span>
          {' '}Commentary is advisory.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {showDemo && (
          <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-medium rounded">
            Demo: {companyName || 'Sample Case'}
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>Board-ready</span>
        </div>
      </div>
    </div>
  );
}
