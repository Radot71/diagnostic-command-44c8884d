import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Users, DollarSign, BarChart3, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { demoScenarios, generateMockReport } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface DemoScenario {
  id: string;
  title: string;
  situation: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW';
  description: string;
  icon: React.ElementType;
  dataIndex: number;
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
  },
  {
    id: 'covenant-breach',
    title: 'Covenant Breach Risk',
    situation: 'Debt covenant violation imminent',
    severity: 'RED',
    description: 'Manufacturing company approaching borrowing base limit',
    icon: DollarSign,
    dataIndex: 0,
  },
  {
    id: 'customer-concentration',
    title: 'Customer Concentration Collapse',
    situation: 'Top customer signaling exit',
    severity: 'ORANGE',
    description: 'Primary customer representing 35% of revenue threatening dual-source',
    icon: Users,
    dataIndex: 0,
  },
  {
    id: 'burn-rate',
    title: 'Burn Rate Runway Crisis',
    situation: 'Cash burn accelerating beyond plan',
    severity: 'ORANGE',
    description: 'Tech company with 15-month runway facing competitive pressure',
    icon: Flame,
    dataIndex: 1,
  },
  {
    id: 'growth-profitability',
    title: 'Growth vs Profitability Tradeoff',
    situation: 'Strategic inflection point',
    severity: 'YELLOW',
    description: 'Software company balancing growth investment against path to profitability',
    icon: BarChart3,
    dataIndex: 1,
  },
  {
    id: 'market-erosion',
    title: 'Market Share Erosion',
    situation: 'Competitive position weakening',
    severity: 'YELLOW',
    description: 'Established player losing ground to well-funded competitors',
    icon: TrendingDown,
    dataIndex: 1,
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

  const handleOpenDiagnostic = (scenario: DemoScenario) => {
    const demoData = demoScenarios[scenario.dataIndex];
    loadDemoScenario(demoData.data);
    
    // Generate report and go directly to review mode
    const report = generateMockReport(demoData.data, 'rapid');
    setReport(report);
    setOutputConfig({ mode: 'rapid', strictMode: true });
    navigate('/report');
  };

  return (
    <EnterpriseLayout>
      <PageHeader 
        title="Demo Scenario Library" 
        subtitle="Pre-built scenarios for demonstration"
      />
      <PageContent>
        <div className="max-w-5xl mx-auto">
          <p className="text-muted-foreground mb-8">
            Select a scenario to view a complete diagnostic analysis. Each scenario includes full company context, 
            financial data, and pre-generated decision packet.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarioLibrary.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <div
                  key={scenario.id}
                  className="enterprise-card p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <SeverityBadge severity={scenario.severity} />
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

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenDiagnostic(scenario)}
                  >
                    Open Diagnostic
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}