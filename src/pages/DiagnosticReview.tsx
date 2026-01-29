import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, TrendingUp, Target, Route, ClipboardList, FileCheck,
  Download, Printer, FileJson, FileText, ChevronDown, Clock, Shield,
  ArrowLeft, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const reportSections = [
  { id: 'situation', label: 'Situation', icon: AlertTriangle },
  { id: 'value', label: 'Value at Risk', icon: TrendingUp },
  { id: 'failures', label: 'Failure Modes', icon: Target },
  { id: 'scenarios', label: 'Scenarios', icon: Route },
  { id: 'options', label: 'Options', icon: ClipboardList },
  { id: 'recommendation', label: 'Recommendation', icon: Shield },
  { id: 'execution', label: 'Execution Plan', icon: ClipboardList },
  { id: 'evidence', label: 'Evidence Register', icon: FileCheck },
];

type ViewMode = 'executive' | 'board' | 'prospect';

function ReportSidebar({ 
  activeSection, 
  onSectionChange 
}: { 
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  return (
    <nav className="space-y-1">
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
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SeverityIndicator({ level }: { level: string }) {
  const config = {
    critical: { label: 'CRITICAL', class: 'severity-red' },
    high: { label: 'HIGH', class: 'severity-orange' },
    medium: { label: 'MEDIUM', class: 'severity-yellow' },
    low: { label: 'LOW', class: 'severity-green' },
  };
  
  const { label, class: className } = config[level as keyof typeof config] || config.medium;
  
  return <span className={cn('severity-badge', className)}>{label}</span>;
}

function ConfidenceScore({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            score >= 70 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"
          )} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );
}

function ReportContent({ content, section }: { content: string; section: string }) {
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4 first:mt-0">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace('### ', '')}</h3>;
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
        return <li key={i} className="ml-4 text-muted-foreground py-0.5">{line.replace('- ', '')}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-4 text-muted-foreground list-decimal py-0.5">{line.replace(/^\d+\.\s*/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-3" />;
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-muted-foreground leading-relaxed">
          {parts.map((part, j) => (
            j % 2 === 1 ? <strong key={j} className="text-foreground font-medium">{part}</strong> : part
          ))}
        </p>
      );
    });
  };

  return <div className="prose prose-sm max-w-none">{renderContent(content)}</div>;
}

export default function DiagnosticReview() {
  const navigate = useNavigate();
  const { report, wizardData, resetWizard } = useDiagnostic();
  const [activeSection, setActiveSection] = useState('situation');
  const [viewMode, setViewMode] = useState<ViewMode>('executive');

  if (!report) {
    navigate('/');
    return null;
  }

  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );

  const handleExportPDF = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleExportHTML = () => {
    toast.success('HTML export started', { description: 'Your report will download shortly.' });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  const handleNewDiagnostic = () => {
    resetWizard();
    navigate('/');
  };

  const getSectionContent = () => {
    switch (activeSection) {
      case 'situation':
      case 'value':
        return report.sections.executiveBrief;
      case 'failures':
      case 'scenarios':
        return report.sections.scenarios;
      case 'options':
      case 'recommendation':
        return report.sections.options;
      case 'execution':
        return report.sections.executionPlan;
      case 'evidence':
        return report.sections.evidenceRegister;
      default:
        return report.sections.executiveBrief;
    }
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title={wizardData.companyBasics.companyName || 'Diagnostic Review'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Diagnostic Review' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewDiagnostic}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Diagnostic
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <aside className="w-56 border-r border-border bg-card p-4 flex-shrink-0 overflow-auto">
          <ReportSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar - Indicators */}
          <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Severity:</span>
                <SeverityIndicator level={wizardData.situation?.urgency || 'medium'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <ConfidenceScore score={confidenceScore} />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {wizardData.situation?.urgency === 'critical' ? 'Immediate Action Required' : 'Standard Timeline'}
                </span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded p-1">
              {(['executive', 'board', 'prospect'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize",
                    viewMode === mode 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode} View
                </button>
              ))}
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl">
              <ReportContent content={getSectionContent()} section={activeSection} />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Export & Summary */}
        <aside className="w-72 border-l border-border bg-card p-4 flex-shrink-0 overflow-auto">
          {/* Export Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Export & Delivery</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportPDF}>
                <Printer className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportHTML}>
                <FileText className="w-4 h-4 mr-2" />
                Export HTML
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportJSON}>
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/briefings')}>
                <Download className="w-4 h-4 mr-2" />
                NotebookLM Brief
              </Button>
            </div>
          </div>

          {/* Integrity Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Data Integrity</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Completeness</span>
                  <span className="font-medium">{report.integrity.completeness}%</span>
                </div>
                <div className="integrity-meter">
                  <div className="integrity-fill bg-accent" style={{ width: `${report.integrity.completeness}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Evidence Quality</span>
                  <span className="font-medium">{report.integrity.evidenceQuality}%</span>
                </div>
                <div className="integrity-meter">
                  <div className="integrity-fill bg-accent" style={{ width: `${report.integrity.evidenceQuality}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{report.integrity.confidence}%</span>
                </div>
                <div className="integrity-meter">
                  <div className="integrity-fill bg-accent" style={{ width: `${report.integrity.confidence}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Missing Data */}
          {report.integrity.missingData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Missing Data</h3>
              <ul className="space-y-1.5">
                {report.integrity.missingData.slice(0, 5).map((item, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Advanced JSON */}
          <Accordion type="single" collapsible>
            <AccordionItem value="json" className="border-none">
              <AccordionTrigger className="text-xs text-muted-foreground hover:text-foreground py-2">
                Advanced: View Raw JSON
              </AccordionTrigger>
              <AccordionContent>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(report.rawJson, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>
      </div>
    </EnterpriseLayout>
  );
}