import { useState } from 'react';
import { Eye, EyeOff, Download, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ExportPreviewProps {
  title: string;
  type: 'prospect' | 'executive' | 'full' | 'briefing';
  content: string;
  onExport: (format: string) => void;
  formats: string[];
}

export function ExportPreview({ title, type, content, onExport, formats }: ExportPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const typeConfig = {
    prospect: {
      pages: '1 page',
      description: 'Quick snapshot for initial outreach',
      className: 'border-l-4 border-l-accent',
    },
    executive: {
      pages: '2-5 pages',
      description: 'Board-ready summary with key findings',
      className: 'border-l-4 border-l-success',
    },
    full: {
      pages: '20-40 pages',
      description: 'Comprehensive decision packet',
      className: 'border-l-4 border-l-warning',
    },
    briefing: {
      pages: 'Variable',
      description: 'Formatted for audio/video generation',
      className: 'border-l-4 border-l-info',
    },
  };

  const config = typeConfig[type];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            {title} Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Preview metadata */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">{config.pages}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          
          {/* Content preview */}
          <div className={cn("bg-white rounded-lg border border-border", config.className)}>
            <ScrollArea className="h-[400px]">
              <div className="p-6">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                  {content}
                </pre>
              </div>
            </ScrollArea>
          </div>
          
          {/* Export actions */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Ready to export
            </p>
            <div className="flex items-center gap-2">
              {formats.map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onExport(format);
                    setIsOpen(false);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export {format}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline preview
export function InlineExportPreview({ 
  content, 
  maxLines = 5 
}: { 
  content: string; 
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const lines = content.split('\n');
  const truncatedContent = lines.slice(0, maxLines).join('\n');
  const hasMore = lines.length > maxLines;

  return (
    <div className="bg-muted/30 rounded-lg border border-border">
      <div className="p-4">
        <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
          {expanded ? content : truncatedContent}
          {!expanded && hasMore && '...'}
        </pre>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-accent hover:bg-muted/50 border-t border-border transition-colors"
        >
          {expanded ? 'Show less' : `Show ${lines.length - maxLines} more lines`}
        </button>
      )}
    </div>
  );
}
