import { useNavigate } from 'react-router-dom';
import { Play, Folder, FileText, ArrowRight, Keyboard, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnterpriseLayout, PageContent } from '@/components/layout/EnterpriseLayout';
import { useGlobalNavigation, KeyboardShortcutsHelp, SkipToMain } from '@/components/ui/keyboard-nav';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const shortcuts = useGlobalNavigation();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  };

  return (
    <EnterpriseLayout>
      <SkipToMain />
      <PageContent className="flex items-center justify-center" id="main-content">
        <motion.div 
          className="max-w-2xl w-full text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo Mark */}
          <motion.div 
            className="mb-8"
            {...fadeIn}
          >
            <div className="w-16 h-16 mx-auto rounded-xl bg-primary flex items-center justify-center mb-6 shadow-lg">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Title Block */}
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
              DiagnosticOS
            </h1>
            <p className="text-xl text-primary font-semibold mb-3">
              Institutional Decision & Risk Diagnostic System
            </p>
            <p className="text-muted-foreground text-lg">
              Board-grade diagnostics. Evidence-scored. Audit-ready.
            </p>
          </motion.div>

          {/* Primary Actions */}
          <motion.div 
            className="grid gap-3 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button
              size="lg"
              className="h-16 text-base justify-between group px-6"
              onClick={() => navigate('/diagnostic')}
              aria-label="Run New Diagnostic - Start a guided diagnostic intake"
            >
              <span className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">Run New Diagnostic</span>
                  <span className="block text-xs opacity-80">Guided 6-step intake process</span>
                </div>
              </span>
              <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-16 text-base justify-between group px-6"
              onClick={() => navigate('/demos')}
              aria-label="Load Demo Scenario - View pre-built diagnostic examples"
            >
              <span className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">Load Demo Scenario</span>
                  <span className="block text-xs text-muted-foreground">Pre-built scenarios for demonstration</span>
                </div>
              </span>
              <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-16 text-base justify-between group px-6"
              onClick={() => navigate('/reports')}
              aria-label="View Sample Reports - Browse exportable report formats"
            >
              <span className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">View Sample Reports</span>
                  <span className="block text-xs text-muted-foreground">Export formats and templates</span>
                </div>
              </span>
              <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              This system produces institutional-grade decision packets for executives, boards, and investors. 
              All outputs are evidence-tagged, confidence-scored, and auditable.
            </p>

            {/* Keyboard Shortcuts */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="View keyboard shortcuts"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Keyboard Shortcuts
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-card" align="center">
                <KeyboardShortcutsHelp shortcuts={shortcuts} />
              </PopoverContent>
            </Popover>
          </motion.div>
        </motion.div>
      </PageContent>
    </EnterpriseLayout>
  );
}
