import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDown, Download, Printer, FileJson, FileText, MessageSquare,
  AlertTriangle, TrendingUp, Target, Route, ClipboardList, FileCheck,
  ArrowLeft, ExternalLink, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { toast } from 'sonner';

const reportTabs = [
  { id: 'executive', label: 'Executive Brief', icon: FileText },
  { id: 'value', label: 'Value Ledger', icon: TrendingUp },
  { id: 'scenarios', label: 'Scenarios', icon: Target },
  { id: 'options', label: 'Options', icon: Route },
  { id: 'execution', label: 'Execution Plan', icon: ClipboardList },
  { id: 'evidence', label: 'Evidence', icon: FileCheck },
];

function IntegrityHUD() {
  const { report } = useDiagnostic();
  if (!report) return null;

  const { integrity } = report;
  const overallScore = Math.round((integrity.completeness + integrity.evidenceQuality + integrity.confidence) / 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-urgent';
  };

  return (
    <div className="board-card p-4 h-fit sticky top-4">
      <h3 className="font-semibold text-foreground mb-4">Integrity HUD</h3>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white ${getScoreColor(overallScore)}`}>
          {overallScore}%
        </div>
        <p className="text-sm text-muted-foreground mt-2">Overall Confidence</p>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Completeness</span>
            <span className="font-medium">{integrity.completeness}%</span>
          </div>
          <Progress value={integrity.completeness} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Evidence Quality</span>
            <span className="font-medium">{integrity.evidenceQuality}%</span>
          </div>
          <Progress value={integrity.evidenceQuality} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{integrity.confidence}%</span>
          </div>
          <Progress value={integrity.confidence} className="h-2" />
        </div>
      </div>

      {/* Missing Data */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Missing Data ({integrity.missingData.length})
        </h4>
        <ul className="space-y-1">
          {integrity.missingData.map((item, index) => (
            <li
              key={index}
              className="text-xs text-muted-foreground py-1.5 px-2 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InputSummaryPanel() {
  const { report, wizardData } = useDiagnostic();
  if (!report) return null;

  return (
    <div className="board-card p-4 h-fit sticky top-4">
      <h3 className="font-semibold text-foreground mb-4">Input Summary</h3>

      <div className="prose prose-sm text-muted-foreground">
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-foreground">Company:</span>{' '}
            {wizardData.companyBasics.companyName || 'Not specified'}
          </div>
          <div>
            <span className="font-medium text-foreground">Industry:</span>{' '}
            {wizardData.companyBasics.industry || 'Not specified'}
          </div>
          <div>
            <span className="font-medium text-foreground">Situation:</span>{' '}
            {wizardData.situation?.title || 'Not specified'}
          </div>
          <div>
            <span className="font-medium text-foreground">Cash Position:</span>{' '}
            {wizardData.runwayInputs.cashOnHand || 'Not specified'}
          </div>
          <div>
            <span className="font-medium text-foreground">Monthly Burn:</span>{' '}
            {wizardData.runwayInputs.monthlyBurn || 'Not specified'}
          </div>
          {wizardData.runwayInputs.hasDebt && (
            <div>
              <span className="font-medium text-foreground">Debt:</span>{' '}
              {wizardData.runwayInputs.debtAmount} ({wizardData.runwayInputs.debtMaturity})
            </div>
          )}
          <div>
            <span className="font-medium text-foreground">Signals:</span>{' '}
            {wizardData.signalChecklist.signals.length > 0
              ? wizardData.signalChecklist.signals.join(', ')
              : 'None selected'}
          </div>
        </div>
      </div>

      {/* Advanced JSON Accordion */}
      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="json" className="border-none">
          <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
            Advanced: View JSON
          </AccordionTrigger>
          <AccordionContent>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
              {JSON.stringify(report.rawJson, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function ReportContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('| ')) {
        // Table row - simplified rendering
        const cells = line.split('|').filter(c => c.trim());
        return (
          <div key={i} className="grid grid-cols-4 gap-2 py-2 border-b border-border text-sm">
            {cells.map((cell, j) => (
              <span key={j} className={j === 0 ? 'font-medium' : 'text-muted-foreground'}>
                {cell.trim()}
              </span>
            ))}
          </div>
        );
      }
      if (line.startsWith('- [ ]')) {
        return (
          <div key={i} className="flex items-center gap-2 py-1 text-sm">
            <div className="w-4 h-4 rounded border border-border" />
            <span>{line.replace('- [ ]', '').trim()}</span>
          </div>
        );
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 text-muted-foreground">{line.replace('- ', '')}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-4 text-muted-foreground list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Handle bold text
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-muted-foreground leading-relaxed">
          {parts.map((part, j) => (
            j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
          ))}
        </p>
      );
    });
  };

  return <div className="prose prose-sm max-w-none">{renderContent(content)}</div>;
}

export default function ReportViewer() {
  const navigate = useNavigate();
  const { report, wizardData, resetWizard } = useDiagnostic();
  const [activeTab, setActiveTab] = useState('executive');

  if (!report) {
    navigate('/');
    return null;
  }

  const handleExportHTML = () => {
    toast.success('HTML export started', { description: 'Your report will download shortly.' });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateNotebookLM = () => {
    const brief = `# DiagnosticOS Briefing Document

## Company: ${wizardData.companyBasics.companyName}
## Situation: ${wizardData.situation?.title}
## Generated: ${new Date(report.generatedAt).toLocaleDateString()}

---

${report.sections.executiveBrief}

---

## Key Takeaways for Discussion

1. What are the most critical risks identified?
2. Which strategic option offers the best risk-adjusted outcome?
3. What additional information would improve confidence?
4. What is the recommended timeline for action?

---

## Evidence Gaps

${report.integrity.missingData.map(item => `- ${item}`).join('\n')}

---

Report ID: ${report.id}
Confidence Score: ${Math.round((report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3)}%
`;

    const blob = new Blob([brief], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notebooklm-brief-${report.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('NotebookLM brief generated', { description: 'Ready to upload to NotebookLM.' });
  };

  const handleNewDiagnostic = () => {
    resetWizard();
    navigate('/');
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'executive': return report.sections.executiveBrief;
      case 'value': return report.sections.valueLedger;
      case 'scenarios': return report.sections.scenarios;
      case 'options': return report.sections.options;
      case 'execution': return report.sections.executionPlan;
      case 'evidence': return report.sections.evidenceRegister;
      default: return '';
    }
  };

  return (
    <PageContainer className="pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Button variant="ghost" size="sm" onClick={handleNewDiagnostic} className="h-auto p-0">
                <ArrowLeft className="w-4 h-4 mr-1" />
                New Diagnostic
              </Button>
              <ChevronRight className="w-4 h-4" />
              <span>Command Deck</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {wizardData.companyBasics.companyName || 'Diagnostic Report'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={wizardData.situation?.urgency === 'critical' ? 'critical' : 'secondary'}>
                {wizardData.situation?.title}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportHTML}>
              <Download className="w-4 h-4 mr-2" />
              HTML
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button size="sm" onClick={handleGenerateNotebookLM}>
              <MessageSquare className="w-4 h-4 mr-2" />
              NotebookLM Brief
            </Button>
          </div>
        </motion.div>

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-[240px_1fr_280px] gap-6">
          {/* Left Column - Integrity HUD */}
          <div className="hidden lg:block">
            <IntegrityHUD />
          </div>

          {/* Center Column - Report Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="board-card"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-border px-4">
                <TabsList className="h-12 bg-transparent">
                  {reportTabs.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-6">
                <ReportContent content={getTabContent()} />
              </div>
            </Tabs>
          </motion.div>

          {/* Right Column - Input Summary */}
          <div className="hidden lg:block">
            <InputSummaryPanel />
          </div>
        </div>

        {/* Mobile Panels */}
        <div className="lg:hidden mt-6 space-y-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="integrity" className="board-card border-none">
              <AccordionTrigger className="px-4 py-3">Integrity HUD</AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <IntegrityHUD />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="inputs" className="board-card border-none mt-4">
              <AccordionTrigger className="px-4 py-3">Input Summary</AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <InputSummaryPanel />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </PageContainer>
  );
}
