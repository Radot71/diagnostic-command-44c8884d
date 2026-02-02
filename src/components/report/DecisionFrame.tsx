/**
 * Decision Frame Component
 * 
 * A consistent 3-block text section displayed at the top of every artifact view.
 * Frames the diagnostic output with institutional, decision-grade context.
 * 
 * This component does NOT introduce new data — it only frames existing output.
 */

import { Info, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DecisionFrameProps {
  /** Override the "What We Know" text based on artifact type */
  whatWeKnowOverride?: string;
  /** Override the "Why This Matters Now" text based on urgency */
  whyItMattersOverride?: string;
  /** Override the "What To Do Next" text based on recommendations */
  whatToDoOverride?: string;
  /** Additional CSS classes */
  className?: string;
}

export function DecisionFrame({ 
  whatWeKnowOverride,
  whyItMattersOverride,
  whatToDoOverride,
  className 
}: DecisionFrameProps) {
  const blocks = [
    {
      id: 'what-we-know',
      icon: Info,
      title: 'What We Know',
      content: whatWeKnowOverride || 
        'Based on the inputs provided, the system can reliably identify the primary drivers, constraints, and near-term risks.',
    },
    {
      id: 'why-it-matters',
      icon: Clock,
      title: 'Why This Matters Now',
      content: whyItMattersOverride ||
        'Time pressure is increasing. If no action is taken, risk becomes harder and more expensive to reverse.',
    },
    {
      id: 'what-to-do',
      icon: ArrowRight,
      title: 'What To Do Next',
      content: whatToDoOverride ||
        'Recommended actions below are ordered by urgency and reversibility to preserve optionality.',
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", className)}>
      {blocks.map((block) => (
        <div 
          key={block.id}
          className="p-4 bg-muted/30 rounded-lg border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <block.icon className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">{block.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {block.content}
          </p>
        </div>
      ))}
    </div>
  );
}
