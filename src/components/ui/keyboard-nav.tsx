import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
      const isCtrlOrMetaPressed = event.ctrlKey || event.metaKey;
      
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (!ctrlOrMeta || isCtrlOrMetaPressed) &&
        (!shortcut.shiftKey || event.shiftKey)
      ) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global navigation shortcuts hook
export function useGlobalNavigation() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => navigate('/diagnostic'),
      description: 'New Diagnostic',
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => navigate('/demos'),
      description: 'Demo Scenarios',
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => navigate('/reports'),
      description: 'Reports & Exports',
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Home',
    },
  ];

  useKeyboardNavigation(shortcuts);

  return shortcuts;
}

// Focus trap for modals and dialogs
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
}

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded focus:outline-none"
    >
      Skip to main content
    </a>
  );
}

// Keyboard shortcuts help dialog content
export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-muted text-xs font-mono rounded border border-border">
              {shortcut.ctrlKey || shortcut.metaKey ? '⌘/' : ''}
              {shortcut.shiftKey ? 'Shift+' : ''}
              {shortcut.key.toUpperCase()}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
