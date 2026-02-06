/**
 * Export Labels Component
 * 
 * Descriptive labels for export formats.
 * Clarifies purpose of each format without changing behavior.
 */

import { FileText, Printer, FileJson, BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ExportFormat {
  id: 'html' | 'pdf' | 'json' | 'markdown';
  label: string;
  description: string;
  icon: typeof FileText;
}

export const EXPORT_FORMAT_CONFIG: ExportFormat[] = [
  {
    id: 'html',
    label: 'HTML',
    description: 'Board-readable view',
    icon: FileText,
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Lender-ready artifact',
    icon: Printer,
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Machine-readable contract',
    icon: FileJson,
  },
  {
    id: 'markdown',
    label: 'NotebookLM',
    description: 'AI briefing format',
    icon: BookOpen,
  },
];

interface ExportLabelProps {
  format: 'html' | 'pdf' | 'json' | 'markdown';
  className?: string;
}

export function ExportLabel({ format, className }: ExportLabelProps) {
  const config = EXPORT_FORMAT_CONFIG.find(f => f.id === format);
  if (!config) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help",
          className
        )}>
          <config.icon className="w-3 h-3" />
          <span>{config.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface ExportButtonLabelProps {
  format: 'html' | 'pdf' | 'json' | 'markdown';
  showDescription?: boolean;
  className?: string;
}

/**
 * Inline label for export buttons
 */
export function ExportButtonLabel({ format, showDescription = true, className }: ExportButtonLabelProps) {
  const config = EXPORT_FORMAT_CONFIG.find(f => f.id === format);
  if (!config) return null;
  
  return (
    <span className={cn("flex flex-col items-start", className)}>
      <span className="text-sm font-medium">{config.label}</span>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </span>
  );
}
