import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, FileWarning, RefreshCw, Search, TrendingUp, 
  Scissors, Globe, Rocket, Users, Building2, ArrowRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { situations } from '@/lib/mockData';
import { Situation, SituationCategory, UrgencyLevel } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  FileWarning,
  RefreshCw,
  Search,
  TrendingUp,
  Scissors,
  Globe,
  Rocket,
  Users,
  Building2,
};

const categoryLabels: Record<SituationCategory, string> = {
  distress: 'Distress & Turnaround',
  transaction: 'Transaction',
  growth: 'Growth',
  governance: 'Governance',
};

const urgencyVariants: Record<UrgencyLevel, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

function SituationCard({ situation, onClick }: { situation: Situation; onClick: () => void }) {
  const Icon = iconMap[situation.icon] || AlertTriangle;
  
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="board-card-hover p-5 text-left w-full group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{situation.title}</h3>
            <Badge variant={urgencyVariants[situation.urgency]}>
              {situation.urgency}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {situation.description}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}

export default function SituationSelector() {
  const navigate = useNavigate();
  const { wizardData, setWizardData, setCurrentStep } = useDiagnostic();
  const [activeCategory, setActiveCategory] = useState<SituationCategory>(
    wizardData.situation?.category || 'distress'
  );

  const handleSelectSituation = (situation: Situation) => {
    setWizardData(prev => ({ ...prev, situation }));
    setCurrentStep(1);
    navigate('/intake');
  };

  const filteredSituations = situations.filter(s => s.category === activeCategory);

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">Select Situation Type</h1>
          <p className="text-muted-foreground">
            Choose the scenario that best describes your current diagnostic need. 
            This helps us tailor the intake questions and output format.
          </p>
        </motion.div>

        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as SituationCategory)}>
          <TabsList className="w-full grid grid-cols-4 mb-6">
            {(Object.keys(categoryLabels) as SituationCategory[]).map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
                {categoryLabels[cat].split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(categoryLabels) as SituationCategory[]).map(cat => (
            <TabsContent key={cat} value={cat}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {situations
                  .filter(s => s.category === cat)
                  .map(situation => (
                    <SituationCard
                      key={situation.id}
                      situation={situation}
                      onClick={() => handleSelectSituation(situation)}
                    />
                  ))}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageContainer>
  );
}
