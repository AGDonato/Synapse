import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { PageErrorFallback } from '../ui/ErrorFallback';
import { ServiceWorkerStatus } from '../ui';
// import PWAInstallBanner from '../pwa/PWAInstallBanner'; // Moved to _trash
// import OfflineIndicator from '../pwa/OfflineIndicator'; // Moved to _trash
import { useMatches, useLocation } from 'react-router-dom';
import { useSidebar } from '../../../app/stores/globalStore';
// import { analytics } from '../../services/analytics/core'; // Moved to _trash
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();
  const isSidebarCollapsed = !sidebarOpen;
  const setSidebarCollapsed = (collapsed: boolean) => setSidebarOpen(!collapsed);

  // Inline implementation of useCurrentRoute
  const matches = useMatches();
  const location = useLocation();
  const currentMatch = matches.reverse().find(match => match.handle);
  const handle = currentMatch?.handle as
    | { title?: string; meta?: Record<string, unknown> }
    | undefined;
  const currentRoute = {
    pathname: location.pathname,
    title: handle?.title || 'Synapse',
    meta: handle?.meta || {},
  };

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Track PWA usage - DISABLED (analytics moved to _trash)
  useEffect(() => {
    // analytics.track('pwa_usage', {
    //   isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    //   route: currentRoute.pathname,
    // });
  }, [currentRoute.pathname]);

  // Atualizar title da página dinamicamente
  useEffect(() => {
    document.title = currentRoute.title ? `${currentRoute.title} - Synapse` : 'Synapse';
  }, [currentRoute.title]);

  return (
    <div className={styles.appLayout}>
      <Header onMenuButtonClick={toggleSidebar} menuButtonRef={menuButtonRef} />

      <div className={styles.container}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          menuButtonRef={menuButtonRef}
          onOverlayClick={() => setSidebarCollapsed(true)}
        />

        <main
          id='main-content'
          className={styles.main}
          role='main'
          tabIndex={-1}
          aria-label='Conteúdo principal'
        >
          <div className={styles.content}>
            <ErrorBoundary fallback={<PageErrorFallback />}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* PWA Components - DISABLED (moved to _trash) */}
      {/* <PWAInstallBanner
        onInstall={() => analytics.track('pwa_installed')}
        onDismiss={() => analytics.track('pwa_install_dismissed')}
      />
      <OfflineIndicator /> */}

      {/* Service Worker Status */}
      <ServiceWorkerStatus />
    </div>
  );
}
