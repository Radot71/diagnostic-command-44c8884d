import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type EvidenceType = 'observed' | 'inferred' | 'assumed';

interface EvidenceTagProps {
  type: EvidenceType;
  source?: string;
  className?: string;
}

const typeConfig: Record<EvidenceType, { 
  label: string; 
  className: string;
  defaultSource: string;
}> = {
  observed: {
    label: 'OBSERVED',
    className: 'bg-success/20 text-success border-success/30 hover:bg-success/30',
    defaultSource: 'From user input',
  },
  inferred: {
    label: 'INFERRED',
    className: 'bg-warning/20 text-warning border-warning/30 hover:bg-warning/30',
    defaultSource: 'Calculated from inputs',
  },
  assumed: {
    label: 'ASSUMED',
    className: 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30',
    defaultSource: 'System default or industry benchmark',
  },
};

export function EvidenceTag({ type, source, className }: EvidenceTagProps) {
  const config = typeConfig[type];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              'text-[10px] font-mono cursor-help transition-colors',
              config.className,
              className
            )}
          >
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{source || config.defaultSource}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Evidence item with tag
interface EvidenceItemProps {
  text: string;
  type: EvidenceType;
  source?: string;
}

export function EvidenceItem({ text, type, source }: EvidenceItemProps) {
  return (
    <div className="flex items-start gap-2 py-2">
      <EvidenceTag type={type} source={source} className="mt-0.5 shrink-0" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
