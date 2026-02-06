/**
 * Tier Upgrade Prompt Components
 * 
 * Displays what's not included in current tier (without blocking access).
 * Institutional framing for natural upgrade path.
 */

import { Lock, ArrowUpRight, FileText, Map, Users, BarChart3, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface WhatYouDontSeeProps {
  currentTier: 'prospect' | 'executive' | 'full';
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Prospect Tier: What You Don't Yet See
 */
export function WhatYouDontSee({ currentTier, onUpgrade, className }: WhatYouDontSeeProps) {
  if (currentTier === 'full') return null;
  
  const nextTier = currentTier === 'prospect' ? 'Executive Snapshot' : 'Full Decision Packet';
  const nextPrice = currentTier === 'prospect' ? '$10,000' : '$20,000';
  
  const excludedItems = currentTier === 'prospect' 
    ? [
        'Full value ledger with scenario modeling',
        'Options comparison table with risk assessment',
        '30-day action plan with milestones',
        'Lender strategy and negotiation playbook',
      ]
    : [
        '13-week cash forecast model',
        'Week-by-week execution roadmap',
        'Lender negotiation playbook',
        'Complete evidence register',
        'Audit trail for every number',
        'Board-ready PDF + NotebookLM brief',
      ];
  
  return (
    <Card className={cn("border-accent/30", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          What You Don't Yet See
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Not included in this snapshot:
        </p>
        
        <ul className="space-y-1.5">
          {excludedItems.map((item, index) => (
            <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-accent mt-0.5">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        
        {onUpgrade && (
          <>
            <Separator />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-center gap-2 border-accent/50 hover:bg-accent/5"
              onClick={onUpgrade}
            >
              <ArrowUpRight className="w-4 h-4" />
              Unlock {nextTier} ({nextPrice})
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface WhatFullPacketAddsProps {
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Executive Tier: What the Full Decision Packet Adds
 */
export function WhatFullPacketAdds({ onUpgrade, className }: WhatFullPacketAddsProps) {
  const additions = [
    { icon: BarChart3, label: '13-week cash forecast' },
    { icon: Map, label: 'Week-by-week execution plan' },
    { icon: Shield, label: 'Lender negotiation playbook' },
    { icon: FileText, label: 'Evidence register' },
    { icon: CheckCircle2, label: 'Audit trail for every number' },
    { icon: Users, label: 'Board-ready PDF + NotebookLM brief' },
  ];
  
  return (
    <Card className={cn("border-accent/30 bg-accent/5", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-accent" />
          What the Full Decision Packet Adds
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {additions.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <item.icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        
        {onUpgrade && (
          <>
            <Separator />
            <Button 
              variant="default" 
              size="sm" 
              className="w-full justify-center gap-2"
              onClick={onUpgrade}
            >
              <ArrowUpRight className="w-4 h-4" />
              Upgrade to Full Decision Packet ($20,000)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface TierFooterNoteProps {
  tier: 'prospect' | 'executive' | 'full';
  className?: string;
}

/**
 * Tier-specific footer guidance note
 */
export function TierFooterNote({ tier, className }: TierFooterNoteProps) {
  const notes = {
    prospect: 'Use this snapshot to decide whether this situation merits deeper diligence.',
    executive: 'Use this briefing to align leadership and prepare for board discussion.',
    full: 'This packet functions as a command center for crisis governance and stakeholder coordination.',
  };
  
  return (
    <div className={cn(
      "px-4 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground italic",
      className
    )}>
      {notes[tier]}
    </div>
  );
}
