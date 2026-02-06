/**
 * How To Use Packet Component
 * 
 * Full Decision Packet execution guide.
 * Week-by-week instruction for using the packet.
 */

import { Map, Calendar, FileCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HowToUsePacketProps {
  hasDebt: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}

export function HowToUsePacket({ hasDebt, severity, className }: HowToUsePacketProps) {
  const phases = [
    {
      icon: AlertTriangle,
      title: 'Week 1',
      subtitle: hasDebt ? 'Lender engagement + cash control' : 'Cash control + stakeholder alignment',
      items: [
        'Validate cash position and 13-week forecast',
        hasDebt ? 'Initiate lender communication (use playbook)' : 'Align key stakeholders on situation',
        'Implement immediate cost controls',
        'Establish daily/weekly reporting cadence',
      ],
      color: severity === 'critical' ? 'destructive' : 'warning',
    },
    {
      icon: Map,
      title: 'Weeks 2–4',
      subtitle: hasDebt ? 'Forbearance + monetization options' : 'Stabilization + quick wins',
      items: [
        hasDebt ? 'Negotiate forbearance or covenant waiver' : 'Execute priority cost actions',
        'Identify and pursue quick win opportunities',
        'Monitor leading indicators daily',
        'Prepare board update with progress metrics',
      ],
      color: 'accent',
    },
    {
      icon: TrendingUp,
      title: 'Weeks 5–12',
      subtitle: hasDebt ? 'Restructuring or refinancing path' : 'Optimization + strategic positioning',
      items: [
        hasDebt ? 'Execute restructuring or refinancing strategy' : 'Implement structural improvements',
        'Validate sustainable unit economics',
        'Position for next phase (growth or exit)',
        'Document lessons learned and governance updates',
      ],
      color: 'success',
    },
  ];
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-accent" />
          How to Use This Packet
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          This packet functions as a command center. Follow the phased approach below.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {phases.map((phase, index) => (
          <div 
            key={index}
            className={cn(
              "p-4 rounded-lg border",
              phase.color === 'destructive' && "border-destructive/30 bg-destructive/5",
              phase.color === 'warning' && "border-warning/30 bg-warning/5",
              phase.color === 'accent' && "border-accent/30 bg-accent/5",
              phase.color === 'success' && "border-success/30 bg-success/5",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <phase.icon className={cn(
                "w-4 h-4",
                phase.color === 'destructive' && "text-destructive",
                phase.color === 'warning' && "text-warning",
                phase.color === 'accent' && "text-accent",
                phase.color === 'success' && "text-success",
              )} />
              <span className="text-sm font-semibold text-foreground">{phase.title}</span>
              <span className="text-xs text-muted-foreground">— {phase.subtitle}</span>
            </div>
            
            <ul className="space-y-1.5 ml-6">
              {phase.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        
        {/* System Disclosure */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground italic">
            This system quantifies risk, surfaces tradeoffs, and documents evidence — it does not replace judgment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
