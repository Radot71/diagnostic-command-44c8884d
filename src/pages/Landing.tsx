import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Upload, PlayCircle, Activity, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { demoScenarios } from '@/lib/mockData';

export default function Landing() {
  const navigate = useNavigate();
  const { loadDemoScenario } = useDiagnostic();

  const handleLoadDemo = (index: number) => {
    loadDemoScenario(demoScenarios[index].data);
    navigate('/situation');
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm mb-6">
            <Shield className="w-4 h-4" />
            <span>Board-Grade Diagnostic Intelligence</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            PE Diagnostics,<br />
            <span className="text-muted-foreground">Accelerated</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate comprehensive diagnostic reports for distress, transaction, 
            growth, and governance situations. From intake to board-ready output in minutes.
          </p>
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/situation')}
            className="board-card-hover p-6 text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Start Guided Intake</h3>
            <p className="text-sm text-muted-foreground">
              Answer a few questions about your situation and we'll generate a tailored diagnostic report.
            </p>
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="board-card-hover p-6 text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <Upload className="w-6 h-6 text-secondary-foreground" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Upload Decision Packet</h3>
            <p className="text-sm text-muted-foreground">
              Already have a DecisionPacketV1 JSON file? Upload it directly to generate your report.
            </p>
          </button>
        </motion.div>

        {/* Demo Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="board-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Load Demo Scenario</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Explore DiagnosticOS with pre-populated sample data. Perfect for understanding the workflow.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {demoScenarios.map((scenario, index) => (
              <Button
                key={scenario.name}
                variant="outline"
                className="justify-start h-auto py-3 px-4"
                onClick={() => handleLoadDemo(index)}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{scenario.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {scenario.data.situation?.title}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-3 gap-6 mt-16 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">3</div>
            <div className="text-sm text-muted-foreground">Output Modes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">6</div>
            <div className="text-sm text-muted-foreground">Report Sections</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">∞</div>
            <div className="text-sm text-muted-foreground">Scenarios</div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
