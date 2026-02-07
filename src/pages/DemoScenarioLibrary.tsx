import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Users, DollarSign, BarChart3, Flame, GitCompare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { demoScenarios, generateMockReport } from '@/lib/mockData';
import { runValidation } from '@/lib/validationRunner';
import { ScenarioComparison } from '@/components/report/ScenarioComparison';
import { ScenarioCard, type ScenarioCardData } from '@/components/scenarios/ScenarioCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const scenarioLibrary: ScenarioCardData[] = [
  {
    id: 'liquidity-crisis',
    title: 'Liquidity Crisis',
    situation: 'Cash runway < 90 days with limited options',
    severity: 'RED',
    description: 'Retail company facing immediate cash shortfall with Q4 below plan',
    icon: AlertTriangle,
    dataIndex: 2,
    metrics: {
      cashPosition: '$2.5M',
      runway: '~60 days',
      riskLevel: 'Critical',
      urgency: 'Immediate',
    },
    governance: {
      posture: 'NO-GO',
      completeness: 45,
      confidence: 52,
    },
  },
  {
    id: 'covenant-breach',
    title: 'Covenant Breach Risk',
    situation: 'Debt covenant violation imminent',
    severity: 'RED',
    description: 'Manufacturing company approaching borrowing base limit',
    icon: DollarSign,
    dataIndex: 3,
    metrics: {
      cashPosition: '$3.2M',
      runway: '2.3 months',
      riskLevel: 'Critical',
      urgency: '60 days',
    },
    governance: {
      posture: 'NO-GO',
      completeness: 38,
      confidence: 48,
    },
  },
  {
    id: 'customer-concentration',
    title: 'Customer Concentration Collapse',
    situation: 'Top customer signaling exit',
    severity: 'ORANGE',
    description: 'Primary customer representing 35% of revenue threatening dual-source',
    icon: Users,
    dataIndex: 4,
    metrics: {
      cashPosition: '$12M',
      runway: '8 months',
      riskLevel: 'Medium-High',
      urgency: '60-90 days',
    },
    governance: {
      posture: 'CONDITIONAL',
      completeness: 58,
      confidence: 62,
    },
  },
  {
    id: 'burn-rate',
    title: 'Burn Rate Runway Crisis',
    situation: 'Cash burn accelerating beyond plan',
    severity: 'ORANGE',
    description: 'Tech company with 15-month runway facing competitive pressure',
    icon: Flame,
    dataIndex: 1,
    metrics: {
      cashPosition: '$18M',
      runway: '15 months',
      riskLevel: 'Medium',
      urgency: 'Proactive',
    },
    governance: {
      posture: 'CONDITIONAL',
      completeness: 65,
      confidence: 68,
    },
  },
  {
    id: 'growth-profitability',
    title: 'Growth vs Profitability Tradeoff',
    situation: 'Strategic inflection point',
    severity: 'YELLOW',
    description: 'Software company balancing growth investment against path to profitability',
    icon: BarChart3,
    dataIndex: 5,
    metrics: {
      cashPosition: '$25M',
      runway: '20 months',
      riskLevel: 'Moderate',
      urgency: 'Strategic',
    },
    governance: {
      posture: 'GO',
      completeness: 78,
      confidence: 74,
    },
  },
  {
    id: 'market-erosion',
    title: 'Market Share Erosion',
    situation: 'Competitive position weakening',
    severity: 'YELLOW',
    description: 'Established player losing ground to well-funded competitors',
    icon: TrendingDown,
    dataIndex: 1,
    metrics: {
      cashPosition: '$30M',
      runway: '24 months',
      riskLevel: 'Moderate',
      urgency: 'Strategic',
    },
    governance: {
      posture: 'GO',
      completeness: 82,
      confidence: 76,
    },
  },
];

export default function DemoScenarioLibrary() {
  const navigate = useNavigate();
  const { loadDemoScenario, setReport, setOutputConfig } = useDiagnostic();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  const handleOpenDiagnostic = async (scenario: ScenarioCardData) => {
    setLoadingScenario(scenario.id);
    try {
      const demoData = demoScenarios[scenario.dataIndex];
      loadDemoScenario(demoData.data);
      
      const baseReport = generateMockReport(demoData.data, 'rapid');
      const validatedReport = await runValidation(baseReport);
      setReport(validatedReport);
      setOutputConfig({ mode: 'rapid', strictMode: true, tier: 'full' });
      navigate('/report');
    } finally {
      setLoadingScenario(null);
    }
  };

  const toggleScenarioSelection = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleComparisonSelect = (id: string) => {
    const scenario = scenarioLibrary.find(s => s.id === id);
    if (scenario) handleOpenDiagnostic(scenario);
  };

  return (
    <EnterpriseLayout>
      <PageHeader 
        title="Demo Scenario Library" 
        subtitle="Pre-built scenarios for demonstration"
        actions={
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={comparisonMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setComparisonMode(!comparisonMode);
                    if (!comparisonMode) setSelectedForComparison([]);
                  }}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Select 2-3 scenarios to compare side-by-side
              </TooltipContent>
            </Tooltip>
          </div>
        }
      />
      <PageContent>
        <div className="max-w-5xl mx-auto">
          <p className="text-muted-foreground mb-6">
            Select a scenario to view a complete diagnostic analysis. Each scenario includes full company context, 
            financial data, and pre-generated decision packet. Governance posture indicates the current GO/NO-GO assessment.
          </p>

          {comparisonMode && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-accent/5 border border-accent/20 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">
                  Select 2-3 scenarios to compare. Selected: {selectedForComparison.length}/3
                </span>
              </div>
              {selectedForComparison.length >= 2 && (
                <Button size="sm" onClick={() => {}}>
                  <GitCompare className="w-4 h-4 mr-2" />
                  View Comparison
                </Button>
              )}
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarioLibrary.map((scenario, index) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                index={index}
                comparisonMode={comparisonMode}
                isSelected={selectedForComparison.includes(scenario.id)}
                selectionDisabled={!selectedForComparison.includes(scenario.id) && selectedForComparison.length >= 3}
                isLoading={loadingScenario === scenario.id}
                onToggleSelection={() => toggleScenarioSelection(scenario.id)}
                onOpenDiagnostic={() => handleOpenDiagnostic(scenario)}
              />
            ))}
          </div>
        </div>
      </PageContent>

      {/* Comparison Modal */}
      <ScenarioComparison
        scenarios={scenarioLibrary}
        selectedIds={selectedForComparison}
        onClose={() => {
          setSelectedForComparison([]);
          setComparisonMode(false);
        }}
        onSelect={handleComparisonSelect}
      />
    </EnterpriseLayout>
  );
}
