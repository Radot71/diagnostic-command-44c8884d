import { 
  AlertTriangle, TrendingUp, Target, Route, ClipboardList, FileCheck, Shield, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const reportSections = [
  { id: 'situation', label: 'Situation', icon: AlertTriangle },
  { id: 'value', label: 'Value at Risk', icon: TrendingUp },
  { id: 'failures', label: 'Failure Modes', icon: Target },
  { id: 'scenarios', label: 'Scenarios', icon: Route },
  { id: 'options', label: 'Options', icon: ClipboardList },
  { id: 'recommendation', label: 'Recommendation', icon: Shield },
  { id: 'gcas', label: 'GCAS Analysis', icon: Shield },
  { id: 'execution', label: 'Execution Plan', icon: ClipboardList },
  { id: 'evidence', label: 'Evidence Register', icon: FileCheck },
];

interface ReportSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ReportSidebar({ activeSection, onSectionChange }: ReportSidebarProps) {
  return (
    <nav className="space-y-1" role="navigation" aria-label="Report sections">
      {reportSections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors text-left",
              isActive 
                ? "bg-accent text-accent-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function SeverityIndicator({ level }: { level: string }) {
  const config = {
    critical: { label: 'CRITICAL', class: 'severity-red' },
    high: { label: 'HIGH', class: 'severity-orange' },
    medium: { label: 'MEDIUM', class: 'severity-yellow' },
    low: { label: 'LOW', class: 'severity-green' },
  };
  
  const { label, class: className } = config[level as keyof typeof config] || config.medium;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('severity-badge cursor-help', className)} role="status" aria-label={`Severity: ${label}`}>
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-xs">
          Severity reflects predefined thresholds for attention and runway. 
          Thresholds are documented in the system configuration.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ConfidenceScore({ score }: { score: number }) {
  const getStatus = () => {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };
  
  const status = getStatus();
  
  return (
    <div className="flex items-center gap-2" role="status" aria-label={`Confidence: ${score}%`}>
      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            status === 'high' && "bg-success",
            status === 'medium' && "bg-warning",
            status === 'low' && "bg-destructive"
          )} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );
}

interface IntegrityMeterProps {
  label: string;
  value: number;
  colorClass?: string;
}

export function IntegrityMeter({ label, value, colorClass = 'bg-accent' }: IntegrityMeterProps) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="integrity-meter">
        <div className={cn("integrity-fill", colorClass)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
