/**
 * ScenarioCard — Individual demo scenario card with governance indicators + tier picker
 */

import { useState } from 'react';
import { Shield, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScenarioSelectBadge } from '@/components/report/ScenarioComparison';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DiagnosticTier, TIER_CONFIGURATIONS } from '@/lib/types';

export type GovernancePosture = 'GO' | 'NO-GO' | 'CONDITIONAL';

export interface ScenarioCardData {
  id: string;
  title: string;
  situation: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW';
  description: string;
  icon: React.ElementType;
  dataIndex: number;
  metrics?: {
    cashPosition?: string;
    runway?: string;
    riskLevel?: string;
    urgency?: string;
  };
  governance: {
    posture: GovernancePosture;
    completeness: number;
    confidence: number;
  };
}

function SeverityBadge({ severity }: { severity: 'RED' | 'ORANGE' | 'YELLOW' }) {
  const classes = {
    RED: 'severity-red',
    ORANGE: 'severity-orange',
    YELLOW: 'severity-yellow',
  };
  return (
    <span className={cn('severity-badge', classes[severity])}>
      {severity}
    </span>
  );
}

function PostureBadge({ posture }: { posture: GovernancePosture }) {
  const config = {
    'GO': {
      icon: CheckCircle2,
      label: 'GO',
      className: 'bg-success/15 text-success border-success/30',
    },
    'NO-GO': {
      icon: AlertOctagon,
      label: 'NO-GO',
      className: 'bg-destructive/15 text-destructive border-destructive/30',
    },
    'CONDITIONAL': {
      icon: Shield,
      label: 'COND.',
      className: 'bg-warning/15 text-warning border-warning/30',
    },
  };
  const { icon: Icon, label, className } = config[posture];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
          className
        )}>
          <Icon className="w-3 h-3" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Governance Posture: {posture === 'CONDITIONAL' ? 'CONDITIONAL' : posture}
      </TooltipContent>
    </Tooltip>
  );
}

function MiniMeter({ value, label }: { value: number; label: string }) {
  const color =
    value >= 70 ? 'bg-success' :
    value >= 50 ? 'bg-warning' :
    'bg-destructive';
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-[10px] font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface ScenarioCardProps {
  scenario: ScenarioCardData;
  index: number;
  comparisonMode: boolean;
  isSelected: boolean;
  selectionDisabled: boolean;
  isLoading: boolean;
  onToggleSelection: () => void;
  onOpenDiagnostic: (tier: DiagnosticTier) => void;
}

export function ScenarioCard({
  scenario,
  index,
  comparisonMode,
  isSelected,
  selectionDisabled,
  isLoading,
  onToggleSelection,
  onOpenDiagnostic,
}: ScenarioCardProps) {
  const Icon = scenario.icon;
  const [selectedTier, setSelectedTier] = useState<DiagnosticTier>('full');
  const tierConfig = TIER_CONFIGURATIONS[selectedTier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "enterprise-card p-5 flex flex-col transition-all",
        comparisonMode && isSelected && "ring-2 ring-accent",
        comparisonMode && "hover:ring-2 hover:ring-accent/50"
      )}
    >
      {/* Header row: icon + badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex items-center gap-1.5">
          {comparisonMode && (
            <ScenarioSelectBadge
              selected={isSelected}
              onToggle={onToggleSelection}
              disabled={selectionDisabled}
            />
          )}
          <PostureBadge posture={scenario.governance.posture} />
          <SeverityBadge severity={scenario.severity} />
        </div>
      </div>

      {/* Title & description */}
      <h3 className="font-semibold text-foreground mb-1">{scenario.title}</h3>
      <p className="text-sm text-muted-foreground mb-1">{scenario.situation}</p>
      <p className="text-xs text-muted-foreground mb-3 flex-1">{scenario.description}</p>

      {/* Governance mini-meters */}
      <div className="flex gap-3 mb-3">
        <MiniMeter value={scenario.governance.completeness} label="Evidence" />
        <MiniMeter value={scenario.governance.confidence} label="Confidence" />
      </div>

      {/* Quick metrics */}
      {scenario.metrics && (
        <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-muted/30 rounded">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cash</p>
            <p className="text-xs font-medium text-foreground">{scenario.metrics.cashPosition}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Runway</p>
            <p className="text-xs font-medium text-foreground">{scenario.metrics.runway}</p>
          </div>
        </div>
      )}

      {/* Tier Selector */}
      <div className="mb-3">
        <Select
          value={selectedTier}
          onValueChange={(v) => setSelectedTier(v as DiagnosticTier)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TIER_CONFIGURATIONS).map(t => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                <span className="font-medium">{t.name}</span>
                <span className="ml-2 text-muted-foreground">{t.price}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1">{tierConfig.pageCount} · {tierConfig.description.split('.')[0]}</p>
      </div>

      {/* Action */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onOpenDiagnostic(selectedTier)}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Open Diagnostic'}
      </Button>
    </motion.div>
  );
}
