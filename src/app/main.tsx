import { logger } from '../shared/utils/logger';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { StoreDevtools, StoreProvider } from './providers/StoreProvider';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import { EnhancedAuthProvider } from './contexts/EnhancedAuthContext';
// Context providers migrated to Zustand stores in StoreProvider
import { createAuthConfig, createPermissionMapping } from '../shared/services/auth/config';
// import { analytics } from '../shared/services/analytics/core'; // Moved to _trash
// import { healthMonitor } from '../shared/services/monitoring/healthCheck'; // Moved to _trash
// import { pwaUtils, register as registerSW } from '../shared/services/pwa/serviceWorkerRegistration'; // Moved to _trash
import { initializeSecurity } from '../shared/services/security';
// Cache utilities removed (unused functionality)
import { batchPreload, dynamicImports } from '../shared/utils/lazyLoading';
import '../index.css';

// Initialize security first
initializeSecurity().catch(error => {
  logger.error('Security initialization failed:', error);
});

// Initialize external authentication configuration
const authConfig = createAuthConfig();
const permissionMapping = createPermissionMapping();

if (authConfig) {
  logger.info(`External authentication configured: ${authConfig.provider}`);
  // analytics.track('external_auth_configured', { // Moved to _trash
  //   provider: authConfig.provider,
  //   enableSSO: authConfig.enableSSO,
  //   requireMFA: authConfig.requireMFA,
  // });
} else {
  logger.info('Using internal authentication');
}

// Initialize analytics and monitoring - DISABLED (services moved to _trash)
// analytics.track('app_initialized', {
//   version: '1.0.0',
//   environment: import.meta.env.MODE,
//   userAgent: navigator.userAgent,
//   timestamp: Date.now(),
//   performanceMetrics: {
//     memory: (performance as any).memory?.usedJSHeapSize || 0,
//     connection: (navigator as any).connection?.effectiveType || 'unknown',
//   },
// });

// Start health monitoring - DISABLED (service moved to _trash)
// healthMonitor.startMonitoring(60000); // Check every minute

// Preload critical components
const initializePerformance = async () => {
  try {
    // Preload critical components (after initial render)
    setTimeout(() => {
      batchPreload(
        [
          dynamicImports.features.charts as any,
          dynamicImports.features.tables as any,
          dynamicImports.features.modals as any,
        ],
        { parallel: true }
      ).catch(console.warn);
    }, 1000);
  } catch (error) {
    logger.warn('Performance initialization failed:', error);
  }
};

initializePerformance();

// Register service worker and setup PWA - DISABLED (services moved to _trash)
// registerSW({
//   onSuccess: registration => {
//     analytics.track('sw_registered', {
//       scope: registration.scope,
//       type: 'success',
//     });
//   },
//   onUpdate: registration => {
//     analytics.track('sw_updated', {
//       scope: registration.scope,
//       type: 'update_available',
//     });

//     // Show update notification
//     if ('Notification' in window && Notification.permission === 'granted') {
//       new Notification('Atualização disponível!', {
//         body: 'Uma nova versão do Synapse está disponível. Clique para atualizar.',
//         icon: '/synapse-icon.svg',
//         tag: 'app-update',
//       });
//     }
//   },
//   onOffline: () => {
//     analytics.track('app_offline');
//   },
//   onOnline: () => {
//     analytics.track('app_online');
//   },
// });

// Setup PWA install prompt - DISABLED (service moved to _trash)
// pwaUtils.setupInstallPrompt();

// Request persistent storage for better offline experience - DISABLED (service moved to _trash)
// pwaUtils.requestPersistentStorage().then(persistent => {
//   analytics.track('storage_permission', { persistent });
// });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <QueryProvider>
        <AuthProvider>
          <EnhancedAuthProvider
            authConfig={authConfig || undefined}
            permissionMapping={permissionMapping}
          >
            <RouterProvider router={router} />
          </EnhancedAuthProvider>
        </AuthProvider>
      </QueryProvider>
      <StoreDevtools />
    </StoreProvider>
  </React.StrictMode>
);
