import { useNavigate } from 'react-router-dom';
import { Download, FileText, Printer, Upload, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  formats: string[];
}

const exportOptions: ExportOption[] = [
  {
    id: 'prospect',
    title: 'Prospect Snapshot',
    description: '1-page executive summary for initial outreach',
    formats: ['PDF', 'HTML'],
  },
  {
    id: 'executive',
    title: 'Executive Snapshot',
    description: '2-5 page summary with key findings and recommendations',
    formats: ['PDF', 'HTML'],
  },
  {
    id: 'full',
    title: 'Full Decision Packet',
    description: '20-40 page comprehensive diagnostic with full analysis',
    formats: ['PDF', 'HTML', 'JSON'],
  },
  {
    id: 'notebooklm',
    title: 'NotebookLM Briefing',
    description: 'Formatted for audio/video briefing generation',
    formats: ['TXT', 'DOC'],
  },
];

export default function ExportDelivery() {
  const navigate = useNavigate();
  const { report, wizardData } = useDiagnostic();

  if (!report) {
    return (
      <EnterpriseLayout>
        <PageHeader title="Reports & Exports" />
        <PageContent>
          <div className="max-w-2xl mx-auto text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Reports Available</h2>
            <p className="text-muted-foreground mb-6">
              Run a diagnostic first to generate exportable reports.
            </p>
            <Button onClick={() => navigate('/diagnostic')}>
              Run New Diagnostic
            </Button>
          </div>
        </PageContent>
      </EnterpriseLayout>
    );
  }

  const handleExport = (optionId: string, format: string) => {
    if (format === 'JSON') {
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnostic-${optionId}-${report.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exported successfully');
    } else if (format === 'TXT' || format === 'DOC') {
      const brief = generateBriefingDocument();
      const blob = new Blob([brief], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `briefing-${report.id}.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Briefing document exported');
    } else {
      toast.success(`${format} export started`, { 
        description: `Your ${optionId} report will download shortly.` 
      });
    }
  };

  const generateBriefingDocument = () => {
    return `DIAGNOSTICOS BRIEFING DOCUMENT
================================

Company: ${wizardData.companyBasics.companyName || 'Target Company'}
Situation: ${wizardData.situation?.title || 'General Assessment'}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}
Report ID: ${report.id}

---

EXECUTIVE SUMMARY
-----------------
${report.sections.executiveBrief}

---

KEY NUMBERS
-----------
Cash on Hand: ${wizardData.runwayInputs.cashOnHand || 'Not specified'}
Monthly Burn: ${wizardData.runwayInputs.monthlyBurn || 'Not specified'}
Debt Position: ${wizardData.runwayInputs.hasDebt ? wizardData.runwayInputs.debtAmount : 'No significant debt'}

---

RISK ASSESSMENT
---------------
Severity: ${wizardData.situation?.urgency?.toUpperCase() || 'MEDIUM'}
Confidence Score: ${Math.round((report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3)}%

Key Signals Identified:
${wizardData.signalChecklist.signals.map(s => `- ${s}`).join('\n') || '- None identified'}

---

DECISION RECOMMENDATION
-----------------------
${report.sections.options}

---

DISCUSSION QUESTIONS
--------------------
1. What are the most critical risks identified?
2. Which strategic option offers the best risk-adjusted outcome?
3. What additional information would improve confidence?
4. What is the recommended timeline for action?

---

DATA GAPS
---------
${report.integrity.missingData.map(item => `- ${item}`).join('\n')}

---

This document is designed for upload to NotebookLM or similar platforms
for audio/video briefing generation.
`;
  };

  return (
    <EnterpriseLayout>
      <PageHeader 
        title="Export & Delivery" 
        subtitle={wizardData.companyBasics.companyName || 'Current Diagnostic'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Reports & Exports' },
        ]}
      />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          {/* Export Options */}
          <div className="grid gap-4 mb-8">
            {exportOptions.map((option) => (
              <div key={option.id} className="enterprise-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {option.formats.map((format) => (
                      <Button
                        key={format}
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(option.id, format)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Branding Options */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Branding Options</h3>
            </div>

            <div className="grid gap-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name (on cover)</Label>
                <Input 
                  id="companyName" 
                  placeholder="Your Company Name"
                  defaultValue={wizardData.companyBasics.companyName}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logo">Logo Upload</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop logo here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="coverPage" className="rounded" defaultChecked />
                <Label htmlFor="coverPage" className="text-sm cursor-pointer">
                  Include branded cover page
                </Label>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => navigate('/report')}>
              Back to Review
            </Button>
            <Button onClick={() => handleExport('full', 'PDF')}>
              <Printer className="w-4 h-4 mr-2" />
              Print Full Packet
            </Button>
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}