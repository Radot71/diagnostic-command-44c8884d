import { Shield, Target, BarChart3, FileCheck, Lock, Zap, Activity, Check, Info } from 'lucide-react';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { EvidenceBadge } from '@/components/report/EvidencePopover';
import { AIUsageInfoPanel } from '@/components/report/SystemStatusPanel';
import { motion } from 'framer-motion';

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
    description: 'Initial diagnostic summary for early screening and qualification',
  },
  {
    name: 'Executive Snapshot',
    pages: '2-5 pages',
    description: 'Board-ready summary highlighting key findings and material risks',
  },
  {
    name: 'Full Decision Packet',
    pages: '20-40 pages',
    description: 'Comprehensive diagnostic with full scenario analysis and execution plan',
  },
  {
    name: 'Briefing Document',
    pages: 'Variable',
    description: 'Structured output for downstream briefing and stakeholder alignment',
  },
];

const reportSections = [
  'Situation',
  'Value Ledger',
  'Risk & Failure Graph',
  'Scenario Table',
  'Options Comparison',
  'Decision',
  'Execution Plan',
  'Evidence Register',
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AboutSystem() {
  return (
    <EnterpriseLayout>
      <PageHeader title="About the System" />
      <PageContent id="main-content">
        <div className="max-w-4xl mx-auto">
          {/* Intro */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  DiagnosticOS
                </h2>
                <p className="text-muted-foreground">
                  Institutional Decision & Risk Diagnostic System
                </p>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-4">
              DiagnosticOS is a structured diagnostic engine that produces board-grade decision packets 
              for executives, boards, and investors. The system consumes structured inputs and generates 
              comprehensive, evidence-tagged analysis across standardized dimensions.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All outputs are deterministic, auditable, and formatted for institutional consumption. 
              The system is designed for private equity, turnaround, and strategic decision contexts 
              where precision and accountability are paramount.
            </p>
            
            {/* How AI is Used Panel */}
            <AIUsageInfoPanel className="mt-6" />
          </motion.div>

          {/* Core Capabilities */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="mb-12"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Core Capabilities</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div 
                    key={feature.title} 
                    variants={item}
                    className="enterprise-card p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Output Types */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-12"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Output Types</h3>
            <div className="enterprise-card overflow-hidden">
              <table className="board-table">
                <thead>
                  <tr>
                    <th scope="col">Output</th>
                    <th scope="col">Length</th>
                    <th scope="col">Description</th>
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
          </motion.div>

          {/* Report Structure */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-12"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Report Structure</h3>
            <div className="enterprise-card p-6">
              <p className="text-muted-foreground mb-4">
                Every diagnostic follows a standardized structure for consistency and comparability:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {reportSections.map((section, index) => (
                  <motion.div 
                    key={section}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                    className="p-3 bg-muted/30 rounded-lg text-center border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-3 h-3 text-success" />
                      <p className="text-sm font-medium text-foreground">{section}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Evidence Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Evidence Tagging System</h3>
            <div className="enterprise-card p-6">
              <p className="text-muted-foreground mb-6">
                Every claim in a diagnostic is tagged with its evidence basis. Hover over any badge in the report 
                to see the data source and provenance details.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                  <div className="w-28 flex justify-center">
                    <EvidenceBadge type="observed" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Directly from user input or uploaded documents. Highest confidence level.
                  </span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                  <div className="w-28 flex justify-center">
                    <EvidenceBadge type="inferred" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Calculated or derived from provided inputs. Shows calculation methodology on hover.
                  </span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                  <div className="w-28 flex justify-center">
                    <EvidenceBadge type="assumed" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    System default or industry benchmark (no user data). Consider providing actual data for higher confidence.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Accessibility Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-12 p-6 bg-muted/20 rounded-lg border border-border"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2">Accessibility</h3>
            <p className="text-sm text-muted-foreground">
              DiagnosticOS is designed with accessibility in mind. The interface supports keyboard navigation, 
              screen readers, and follows WCAG 2.1 guidelines. Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl</kbd> + 
              navigation keys for quick access.
            </p>
          </motion.div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}
