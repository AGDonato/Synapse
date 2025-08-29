import { logger } from './utils/logger';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { StoreDevtools, StoreProvider } from './providers/StoreProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { DesignSystemProvider } from './design-system';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import { EnhancedAuthProvider } from './contexts/EnhancedAuthContext';
import { DocumentosProvider } from './contexts/DocumentosContext';
import { createAuthConfig, createPermissionMapping } from './services/auth/config';
import { analytics } from './services/analytics/core';
import { healthMonitor } from './services/monitoring/healthCheck';
import { pwaUtils, register as registerSW } from './services/pwa/serviceWorkerRegistration';
import { initializeSecurity } from './services/security';
import { globalCache, warmCache } from './utils/cache';
import { batchPreload, dynamicImports } from './utils/lazyLoading';
import './index.css';

// Initialize security first
initializeSecurity().catch(error => {
  logger.error('Security initialization failed:', error);
});

// Initialize external authentication configuration
const authConfig = createAuthConfig();
const permissionMapping = createPermissionMapping();

if (authConfig) {
  logger.info(`External authentication configured: ${authConfig.provider}`);
  analytics.track('external_auth_configured', {
    provider: authConfig.provider,
    enableSSO: authConfig.enableSSO,
    requireMFA: authConfig.requireMFA,
  });
} else {
  logger.info('Using internal authentication');
}

// Initialize analytics and monitoring
analytics.track('app_initialized', {
  version: '1.0.0',
  environment: import.meta.env.MODE,
  userAgent: navigator.userAgent,
  timestamp: Date.now(),
  performanceMetrics: {
    memory: (performance as any).memory?.usedJSHeapSize || 0,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
  },
});

// Start health monitoring
healthMonitor.startMonitoring(60000); // Check every minute

// Preload critical resources
const initializePerformance = async () => {
  try {
    // Warm up cache with critical data
    await warmCache(globalCache, [
      {
        key: 'app:metadata',
        factory: async () => ({
          version: '1.0.0',
          timestamp: Date.now(),
          features: ['demandas', 'documentos', 'cadastros', 'relatorios'],
        }),
        options: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
      },
    ]);

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

// Register service worker and setup PWA
registerSW({
  onSuccess: registration => {
    analytics.track('sw_registered', {
      scope: registration.scope,
      type: 'success',
    });
  },
  onUpdate: registration => {
    analytics.track('sw_updated', {
      scope: registration.scope,
      type: 'update_available',
    });

    // Show update notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Atualização disponível!', {
        body: 'Uma nova versão do Synapse está disponível. Clique para atualizar.',
        icon: '/synapse-icon.svg',
        tag: 'app-update',
      });
    }
  },
  onOffline: () => {
    analytics.track('app_offline');
  },
  onOnline: () => {
    analytics.track('app_online');
  },
});

// Setup PWA install prompt
pwaUtils.setupInstallPrompt();

// Request persistent storage for better offline experience
pwaUtils.requestPersistentStorage().then(persistent => {
  analytics.track('storage_permission', { persistent });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <DesignSystemProvider>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <EnhancedAuthProvider
                authConfig={authConfig || undefined}
                permissionMapping={permissionMapping}
              >
                <DocumentosProvider>
                  <RouterProvider router={router} />
                </DocumentosProvider>
              </EnhancedAuthProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </DesignSystemProvider>
      <StoreDevtools />
    </StoreProvider>
  </React.StrictMode>
);
