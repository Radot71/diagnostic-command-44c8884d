import { EvidencePopover, EvidenceBadge, EvidenceType } from './EvidencePopover';

interface ReportContentProps {
  content: string;
  section: string;
}

export function ReportContent({ content, section }: ReportContentProps) {
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle evidence-tagged lines with [OBSERVED], [INFERRED], [ASSUMED]
      const evidenceMatch = line.match(/\[(OBSERVED|INFERRED|ASSUMED)\]/);
      let evidenceType: EvidenceType | null = null;
      let cleanLine = line;
      
      if (evidenceMatch) {
        evidenceType = evidenceMatch[1].toLowerCase() as EvidenceType;
        cleanLine = line.replace(/\[(OBSERVED|INFERRED|ASSUMED)\]\s*/, '');
      }
      
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4 first:mt-0">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('| ')) {
        const cells = line.split('|').filter(c => c.trim());
        return (
          <div key={i} className="grid grid-cols-4 gap-2 py-2.5 border-b border-border text-sm">
            {cells.map((cell, j) => (
              <span key={j} className={j === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                {cell.trim()}
              </span>
            ))}
          </div>
        );
      }
      if (line.startsWith('- [ ]')) {
        return (
          <div key={i} className="flex items-center gap-3 py-1.5 text-sm">
            <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
            <span className="text-foreground">{line.replace('- [ ]', '').trim()}</span>
          </div>
        );
      }
      if (line.startsWith('- ')) {
        const content = cleanLine.replace('- ', '');
        return (
          <li key={i} className="ml-4 text-muted-foreground py-0.5 flex items-center gap-2">
            {content}
            {evidenceType && section === 'evidence' && (
              <EvidencePopover
                type={evidenceType}
                source={getEvidenceSource(evidenceType, content)}
                details={getEvidenceDetails(evidenceType)}
              >
                <EvidenceBadge type={evidenceType} />
              </EvidencePopover>
            )}
          </li>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 text-muted-foreground list-decimal py-0.5">
            {line.replace(/^\d+\.\s*/, '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-3" />;
      }
      
      // Parse bold text
      const parts = cleanLine.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-muted-foreground leading-relaxed flex items-center gap-2">
          <span>
            {parts.map((part, j) => (
              j % 2 === 1 ? <strong key={j} className="text-foreground font-medium">{part}</strong> : part
            ))}
          </span>
          {evidenceType && (
            <EvidencePopover
              type={evidenceType}
              source={getEvidenceSource(evidenceType, cleanLine)}
              details={getEvidenceDetails(evidenceType)}
            >
              <EvidenceBadge type={evidenceType} />
            </EvidencePopover>
          )}
        </p>
      );
    });
  };

  return (
    <article className="prose prose-sm max-w-none" role="article">
      {renderContent(content)}
    </article>
  );
}

function getEvidenceSource(type: EvidenceType, content: string): string {
  switch (type) {
    case 'observed':
      return 'User-provided input during diagnostic intake';
    case 'inferred':
      return 'Calculated from: cash on hand ÷ monthly burn rate';
    case 'assumed':
      return 'Industry benchmark or system default value';
  }
}

function getEvidenceDetails(type: EvidenceType): string {
  switch (type) {
    case 'observed':
      return 'This data point was directly provided by the user and can be verified against source documents.';
    case 'inferred':
      return 'This value was derived through calculation or logical inference from observed data points.';
    case 'assumed':
      return 'No user data was available. This uses industry benchmarks or system defaults. Consider providing actual data for higher confidence.';
  }
}
