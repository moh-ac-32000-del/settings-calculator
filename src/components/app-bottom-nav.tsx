import { Archive, Calculator, Settings2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { translateKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function AppBottomNav() {
  const [location] = useLocation();
  const operationsActive = location === '/' || location === '/operations';
  const archiveActive = location === '/archive';
  const settingsActive = location === '/settings';

  return (
    <nav className="app-bottom-nav" aria-label={translateKey('mainNavigation')}>
      <Link
        href="/operations"
        className={cn('app-bottom-nav-item', operationsActive && 'app-bottom-nav-item-active')}
        data-active={operationsActive}
        aria-current={operationsActive ? 'page' : undefined}
        data-testid="bottom-nav-operations"
      >
        <Calculator size={17} strokeWidth={1.8} />
        <span>{translateKey('operations')}</span>
      </Link>
      <Link
        href="/archive"
        className={cn('app-bottom-nav-item', archiveActive && 'app-bottom-nav-item-active')}
        data-active={archiveActive}
        aria-current={archiveActive ? 'page' : undefined}
        data-testid="bottom-nav-archive"
      >
        <Archive size={17} strokeWidth={1.8} />
        <span>{translateKey('archive')}</span>
      </Link>
      <Link
        href="/settings"
        className={cn('app-bottom-nav-item', settingsActive && 'app-bottom-nav-item-active')}
        data-active={settingsActive}
        aria-current={settingsActive ? 'page' : undefined}
        data-testid="bottom-nav-settings"
      >
        <Settings2 size={17} strokeWidth={1.8} />
        <span>{translateKey('settings')}</span>
      </Link>
    </nav>
  );
}