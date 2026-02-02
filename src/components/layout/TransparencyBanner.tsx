/**
 * Transparency Banner Component
 * 
 * Global slim banner displayed at the top of diagnostic result pages
 * to establish trust and disclose system behavior.
 */

import { Shield, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TransparencyBannerProps {
  className?: string;
  variant?: 'default' | 'demo';
}

export function TransparencyBanner({ className, variant = 'default' }: TransparencyBannerProps) {
  if (variant === 'demo') {
    return (
      <div className={cn(
        "w-full px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center justify-center gap-2",
        className
      )}>
        <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
          DEMO MODE — SIMULATED DATA
        </span>
        <span className="text-xs text-destructive/80">
          Results do NOT reflect real inputs.
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between",
      className
    )}>
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          Deterministic + Transparent Diagnostic System
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-3 h-3" />
            <span>How this works</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <p className="text-xs leading-relaxed">
            All financial and risk calculations are deterministic. AI is used only for additive 
            explanation and validation. Any AI fallback, validation pass, or assumption override 
            is explicitly disclosed in the System Status panel.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
