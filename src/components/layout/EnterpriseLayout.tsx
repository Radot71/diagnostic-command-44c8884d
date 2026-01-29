import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Play, 
  Folder, 
  FileText, 
  Headphones, 
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/diagnostic', label: 'Run Diagnostic', icon: Play },
  { path: '/demos', label: 'Load Demo Scenario', icon: Folder },
  { path: '/reports', label: 'Reports & Exports', icon: FileText },
  { path: '/briefings', label: 'Briefings (NotebookLM)', icon: Headphones },
  { path: '/about', label: 'About the System', icon: Info },
];

interface EnterpriseLayoutProps {
  children: ReactNode;
}

export function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-sidebar flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">DiagnosticOS</span>
              <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Decision System</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path || 
                (item.path === '/diagnostic' && currentPath.startsWith('/intake')) ||
                (item.path === '/reports' && currentPath === '/report');
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn('nav-item', isActive && 'nav-item-active')}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40 leading-relaxed">
            Institutional-grade decision packets for executives, boards, and investors.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex flex-col">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3" />}
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex-1 overflow-auto p-6", className)}>
      {children}
    </div>
  );
}