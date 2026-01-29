import { useNavigate } from 'react-router-dom';
import { Play, Folder, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnterpriseLayout, PageContent } from '@/components/layout/EnterpriseLayout';

export default function Home() {
  const navigate = useNavigate();

  return (
    <EnterpriseLayout>
      <PageContent className="flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          {/* Title Block */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              DiagnosticOS
            </h1>
            <p className="text-lg text-primary font-medium mb-2">
              Decision & Risk Diagnostic System
            </p>
            <p className="text-muted-foreground">
              Board-grade diagnostics. Evidence-scored. Audit-ready.
            </p>
          </div>

          {/* Primary Actions */}
          <div className="grid gap-4 mb-8">
            <Button
              size="lg"
              className="h-14 text-base justify-between group"
              onClick={() => navigate('/diagnostic')}
            >
              <span className="flex items-center gap-3">
                <Play className="w-5 h-5" />
                Run New Diagnostic
              </span>
              <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-14 text-base justify-between group"
              onClick={() => navigate('/demos')}
            >
              <span className="flex items-center gap-3">
                <Folder className="w-5 h-5" />
                Load Demo Scenario
              </span>
              <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-14 text-base justify-between group"
              onClick={() => navigate('/reports')}
            >
              <span className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                View Sample Reports
              </span>
              <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </div>

          {/* Footer Text */}
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This system produces institutional-grade decision packets for executives, boards, and investors.
          </p>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}