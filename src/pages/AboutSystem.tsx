import { Shield, Target, BarChart3, FileCheck, Lock, Zap } from 'lucide-react';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';

const features = [
  {
    icon: Shield,
    title: 'Board-Grade Analysis',
    description: 'Diagnostic outputs are formatted for executive consumption and board presentation. Every claim is evidence-tagged and auditable.',
  },
  {
    icon: Target,
    title: 'Structured Decision Framework',
    description: 'Systematic analysis of situation, risks, scenarios, options, and execution plans. No unstructured narratives.',
  },
  {
    icon: BarChart3,
    title: 'Confidence Scoring',
    description: 'Every diagnostic includes data quality assessment and confidence scores based on input completeness and evidence quality.',
  },
  {
    icon: FileCheck,
    title: 'Evidence Tagging',
    description: 'All claims are tagged as OBSERVED (from input), INFERRED (calculated), or ASSUMED (system default). Full audit trail.',
  },
  {
    icon: Lock,
    title: 'Deterministic Outputs',
    description: 'Given the same inputs, the system produces identical outputs. No randomness, no hallucination, no surprises.',
  },
  {
    icon: Zap,
    title: 'Multiple Output Modes',
    description: 'Generate prospect snapshots (1 page), executive summaries (2-5 pages), or full decision packets (20-40 pages).',
  },
];

const outputTypes = [
  {
    name: 'Prospect Snapshot',
    pages: '1 page',
    description: 'Quick-hit summary for initial outreach and prospecting',
  },
  {
    name: 'Executive Snapshot',
    pages: '2-5 pages',
    description: 'Board-ready summary with key findings and recommendations',
  },
  {
    name: 'Full Decision Packet',
    pages: '20-40 pages',
    description: 'Comprehensive diagnostic with full scenario analysis and execution plan',
  },
  {
    name: 'NotebookLM Briefing',
    pages: 'Variable',
    description: 'Formatted for AI audio/video briefing generation',
  },
];

export default function AboutSystem() {
  return (
    <EnterpriseLayout>
      <PageHeader title="About the System" />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          {/* Intro */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              DiagnosticOS — Institutional Decision & Risk Diagnostic System
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              DiagnosticOS is a structured diagnostic engine that produces board-grade decision packets 
              for executives, boards, and investors. The system consumes structured inputs and generates 
              comprehensive, evidence-tagged analysis across standardized dimensions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              All outputs are deterministic, auditable, and formatted for institutional consumption. 
              The system is designed for private equity, turnaround, and strategic decision contexts 
              where precision and accountability are paramount.
            </p>
          </div>

          {/* Core Capabilities */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-foreground mb-6">Core Capabilities</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="enterprise-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Output Types */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-foreground mb-6">Output Types</h3>
            <div className="enterprise-card overflow-hidden">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Output</th>
                    <th>Length</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {outputTypes.map((output) => (
                    <tr key={output.name}>
                      <td className="font-medium">{output.name}</td>
                      <td>{output.pages}</td>
                      <td className="text-muted-foreground">{output.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Structure */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-foreground mb-6">Report Structure</h3>
            <div className="enterprise-card p-6">
              <p className="text-muted-foreground mb-4">
                Every diagnostic follows a standardized structure for consistency and comparability:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Situation',
                  'Value Ledger',
                  'Risk & Failure Graph',
                  'Scenario Table',
                  'Options Comparison',
                  'Decision',
                  'Execution Plan',
                  'Evidence Register',
                ].map((section) => (
                  <div key={section} className="p-3 bg-muted/30 rounded text-center">
                    <p className="text-sm font-medium text-foreground">{section}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence Tags */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">Evidence Tagging System</h3>
            <div className="enterprise-card p-6">
              <p className="text-muted-foreground mb-4">
                Every claim in a diagnostic is tagged with its evidence basis:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="evidence-tag evidence-observed w-28 justify-center">OBSERVED</span>
                  <span className="text-sm text-muted-foreground">Directly from user input or uploaded documents</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="evidence-tag evidence-inferred w-28 justify-center">INFERRED</span>
                  <span className="text-sm text-muted-foreground">Calculated or derived from provided inputs</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="evidence-tag evidence-assumed w-28 justify-center">ASSUMED</span>
                  <span className="text-sm text-muted-foreground">System default or industry benchmark (no user data)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}