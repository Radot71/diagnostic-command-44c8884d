/**
 * Result Headline Component
 * 
 * Standard headline for all diagnostic artifacts.
 * Replaces any hype with clear, institutional language.
 */

import { FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultHeadlineProps {
  className?: string;
}

export function ResultHeadline({ className }: ResultHeadlineProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 py-2 px-3 bg-muted/30 rounded border border-border",
      className
    )}>
      <FileCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Findings are deterministic.</span>
        {' '}Commentary is advisory.
      </p>
    </div>
  );
}
