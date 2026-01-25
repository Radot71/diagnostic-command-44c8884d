import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Zap, BookOpen, Shield, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { generateMockReport } from '@/lib/mockData';
import { OutputMode } from '@/lib/types';

const outputModes = [
  {
    id: 'snapshot' as OutputMode,
    title: 'Prospect Snapshot',
    pages: '1 page',
    description: 'Quick overview for initial screening. Key metrics and red flags at a glance.',
    icon: Zap,
    features: ['Executive summary', 'Key metrics', 'Risk flags', 'Recommendation'],
  },
  {
    id: 'rapid' as OutputMode,
    title: 'Rapid Diagnostic',
    pages: '5-8 pages',
    description: 'Comprehensive analysis for deal teams. Full situation assessment with options.',
    icon: FileText,
    features: ['Full executive brief', 'Value ledger', 'Scenario analysis', 'Strategic options', 'Execution outline'],
    recommended: true,
  },
  {
    id: 'full' as OutputMode,
    title: 'Full Decision Packet',
    pages: '20-40 pages',
    description: 'Board-ready documentation. Complete due diligence package with evidence.',
    icon: BookOpen,
    features: ['Complete analysis', 'Detailed scenarios', 'Full evidence register', 'Appendices', 'Data room ready'],
  },
];

export default function OutputModePicker() {
  const navigate = useNavigate();
  const { wizardData, outputConfig, setOutputConfig, setReport } = useDiagnostic();

  const handleSelectMode = (mode: OutputMode) => {
    setOutputConfig(prev => ({ ...prev, mode }));
  };

  const handleGenerate = () => {
    const report = generateMockReport(wizardData, outputConfig.mode);
    setReport(report);
    navigate('/report');
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">Choose Output Format</h1>
          <p className="text-muted-foreground">
            Select the depth of analysis you need. Each format is designed for different stages of decision-making.
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {outputModes.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelectMode(mode.id)}
              className={`board-card p-6 text-left relative transition-all ${
                outputConfig.mode === mode.id
                  ? 'ring-2 ring-accent border-accent'
                  : 'hover:border-accent/50'
              }`}
            >
              {mode.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <mode.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                {outputConfig.mode === mode.id && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-4 h-4 text-accent-foreground" />
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-foreground mb-1">{mode.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{mode.pages}</p>
              <p className="text-sm text-muted-foreground mb-4">{mode.description}</p>

              <ul className="space-y-2">
                {mode.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>

        {/* Strict Mode Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="board-card p-4 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="strictMode" className="text-base font-medium">Strict Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Require evidence citations for all claims. Flags unsupported assertions.
                </p>
              </div>
            </div>
            <Switch
              id="strictMode"
              checked={outputConfig.strictMode}
              onCheckedChange={(checked) => setOutputConfig(prev => ({ ...prev, strictMode: checked }))}
            />
          </div>
        </motion.div>

        {/* What Happens Next */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/50 rounded-lg p-4 mb-8"
        >
          <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Your inputs will be processed by the diagnostic engine</li>
            <li>A structured report will be generated based on your selections</li>
            <li>You can review, edit, and export the final output</li>
          </ol>
        </motion.div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/intake')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Intake
          </Button>
          <Button onClick={handleGenerate} size="lg">
            Generate Report
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
