import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Users, DollarSign, BarChart3, Flame, GitCompare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { demoScenarios, generateMockReport } from '@/lib/mockData';
import { ScenarioComparison, ScenarioSelectBadge } from '@/components/report/ScenarioComparison';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DemoScenario {
  id: string;
  title: string;
  situation: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW';
  description: string;
  icon: React.ElementType;
  dataIndex: number;
  metrics?: {
    cashPosition?: string;
    runway?: string;
    riskLevel?: string;
    urgency?: string;
  };
}

const scenarioLibrary: DemoScenario[] = [
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
  },
  {
    id: 'covenant-breach',
    title: 'Covenant Breach Risk',
    situation: 'Debt covenant violation imminent',
    severity: 'RED',
    description: 'Manufacturing company approaching borrowing base limit',
    icon: DollarSign,
    dataIndex: 0,
    metrics: {
      cashPosition: '$8M',
      runway: '4 months',
      riskLevel: 'High',
      urgency: '30 days',
    },
  },
  {
    id: 'customer-concentration',
    title: 'Customer Concentration Collapse',
    situation: 'Top customer signaling exit',
    severity: 'ORANGE',
    description: 'Primary customer representing 35% of revenue threatening dual-source',
    icon: Users,
    dataIndex: 0,
    metrics: {
      cashPosition: '$12M',
      runway: '8 months',
      riskLevel: 'Medium-High',
      urgency: '60-90 days',
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
  },
  {
    id: 'growth-profitability',
    title: 'Growth vs Profitability Tradeoff',
    situation: 'Strategic inflection point',
    severity: 'YELLOW',
    description: 'Software company balancing growth investment against path to profitability',
    icon: BarChart3,
    dataIndex: 1,
    metrics: {
      cashPosition: '$25M',
      runway: '20 months',
      riskLevel: 'Moderate',
      urgency: 'Strategic',
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
  },
];

function SeverityBadge({ severity }: { severity: 'RED' | 'ORANGE' | 'YELLOW' }) {
  const classes = {
    RED: 'severity-red',
    ORANGE: 'severity-orange',
    YELLOW: 'severity-yellow',
  };

  return (
    <span className={cn('severity-badge', classes[severity])}>
      {severity}
    </span>
  );
}

export default function DemoScenarioLibrary() {
  const navigate = useNavigate();
  const { loadDemoScenario, setReport, setOutputConfig } = useDiagnostic();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  const handleOpenDiagnostic = (scenario: DemoScenario) => {
    const demoData = demoScenarios[scenario.dataIndex];
    loadDemoScenario(demoData.data);
    
    // Generate report and go directly to review mode
    const report = generateMockReport(demoData.data, 'rapid');
    setReport(report);
    setOutputConfig({ mode: 'rapid', strictMode: true });
    navigate('/report');
  };

  const toggleScenarioSelection = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 scenarios for comparison
      }
      return [...prev, id];
    });
  };

  const handleComparisonSelect = (id: string) => {
    const scenario = scenarioLibrary.find(s => s.id === id);
    if (scenario) {
      handleOpenDiagnostic(scenario);
    }
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
                    if (!comparisonMode) {
                      setSelectedForComparison([]);
                    }
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
            financial data, and pre-generated decision packet.
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
            {scenarioLibrary.map((scenario, index) => {
              const Icon = scenario.icon;
              const isSelected = selectedForComparison.includes(scenario.id);
              
              return (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "enterprise-card p-5 flex flex-col transition-all",
                    comparisonMode && isSelected && "ring-2 ring-accent",
                    comparisonMode && "hover:ring-2 hover:ring-accent/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      {comparisonMode && (
                        <ScenarioSelectBadge
                          selected={isSelected}
                          onToggle={() => toggleScenarioSelection(scenario.id)}
                          disabled={!isSelected && selectedForComparison.length >= 3}
                        />
                      )}
                      <SeverityBadge severity={scenario.severity} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {scenario.situation}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4 flex-1">
                    {scenario.description}
                  </p>

                  {/* Quick metrics */}
                  {scenario.metrics && (
                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cash</p>
                        <p className="text-xs font-medium text-foreground">{scenario.metrics.cashPosition}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Runway</p>
                        <p className="text-xs font-medium text-foreground">{scenario.metrics.runway}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenDiagnostic(scenario)}
                  >
                    Open Diagnostic
                  </Button>
                </motion.div>
              );
            })}
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
