import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { PageErrorFallback } from '../ui/ErrorFallback';
import { ServiceWorkerStatus } from '../ui';
// import PWAInstallBanner from '../pwa/PWAInstallBanner'; // Moved to _trash
// import OfflineIndicator from '../pwa/OfflineIndicator'; // Moved to _trash
import { useCurrentRoute } from '../../router/newHooks';
import { useSidebar } from '../../contexts/SidebarContext';
// import { analytics } from '../../services/analytics/core'; // Moved to _trash
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { isSidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useSidebar();
  const currentRoute = useCurrentRoute();
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
