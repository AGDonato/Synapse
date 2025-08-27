/**
 * Store provider for Zustand stores
 */

import React, { useEffect } from 'react';
import { useGlobalStore, useNotifications, useTheme } from '../stores/globalStore';
import { useDemandasStore } from '../stores/demandasStore';
import { useDocumentosStore } from '../stores/documentosStore';
import { analytics } from '../services/analytics/core';
import { logger } from '../utils/logger';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Store Provider component that initializes stores and sets up subscriptions
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { theme } = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    
    // Also set the theme-color meta tag for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        'content',
        theme === 'dark' ? '#1a1a1a' : '#ffffff'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
      document.head.appendChild(meta);
    }
  }, [theme]);

  useEffect(() => {
    // Set up global error handling
    const handleError = (event: ErrorEvent) => {
      logger.error('Global error:', event.error);
      
      // Update error count in performance metrics
      useGlobalStore.getState().updatePerformanceMetrics({
        errorCount: useGlobalStore.getState().performanceMetrics.errorCount + 1,
      });

      // Show user-friendly notification for critical errors
      if (event.error?.name !== 'ChunkLoadError') { // Ignore chunk load errors
        addNotification({
          type: 'error',
          title: 'Erro Inesperado',
          message: 'Ocorreu um erro inesperado. A equipe foi notificada.',
          duration: 8000,
          actions: [
            {
              label: 'Recarregar',
              action: () => window.location.reload(),
              variant: 'primary',
            },
          ],
        });
      }

      // Track error in analytics
      analytics.track('error_occurred', {
        error: event.error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', event.reason);
      
      // Update error count
      useGlobalStore.getState().updatePerformanceMetrics({
        errorCount: useGlobalStore.getState().performanceMetrics.errorCount + 1,
      });

      // Track in analytics
      analytics.track('promise_rejection', {
        reason: event.reason?.message || 'Unknown reason',
        timestamp: Date.now(),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addNotification]);

  useEffect(() => {
    // Track initial app load performance
    const loadTime = performance.now();
    
    // Wait for initial render to complete
    requestAnimationFrame(() => {
      useGlobalStore.getState().updatePerformanceMetrics({
        loadTime,
      });

      analytics.track('app_loaded', {
        loadTime,
        timestamp: Date.now(),
      });
    });

    // Set up performance observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              useGlobalStore.getState().updatePerformanceMetrics({
                loadTime: navEntry.loadEventEnd - navEntry.navigationStart,
              });
            }
          });
        });

        observer.observe({ entryTypes: ['navigation'] });

        return () => {
          observer.disconnect();
        };
      } catch (error) {
        logger.warn('PerformanceObserver not fully supported:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Set up store subscriptions for analytics tracking
    
    // Track preference changes
    const unsubscribePreferences = useGlobalStore.subscribe(
      (state) => state.preferences,
      (preferences, prevPreferences) => {
        if (prevPreferences) {
          const changes = Object.keys(preferences).reduce((acc, key) => {
            const typedKey = key as keyof typeof preferences;
            if (preferences[typedKey] !== prevPreferences[typedKey]) {
              acc[typedKey] = {
                from: prevPreferences[typedKey],
                to: preferences[typedKey],
              };
            }
            return acc;
          }, {} as any);

          if (Object.keys(changes).length > 0) {
            analytics.track('preferences_changed', {
              changes,
              timestamp: Date.now(),
            });
          }
        }
      },
      { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
    );

    // Track route changes
    const unsubscribeRoute = useGlobalStore.subscribe(
      (state) => state.currentRoute,
      (route, prevRoute) => {
        if (prevRoute && route !== prevRoute) {
          analytics.track('route_changed', {
            from: prevRoute,
            to: route,
            timestamp: Date.now(),
          });
        }
      }
    );

    // Track feature usage
    const unsubscribeFeatures = useGlobalStore.subscribe(
      (state) => state.features,
      (features, prevFeatures) => {
        if (prevFeatures) {
          const changes = Object.keys(features).reduce((acc, key) => {
            const typedKey = key as keyof typeof features;
            if (features[typedKey] !== prevFeatures[typedKey]) {
              acc[typedKey] = features[typedKey];
            }
            return acc;
          }, {} as any);

          if (Object.keys(changes).length > 0) {
            analytics.track('feature_flags_changed', {
              changes,
              timestamp: Date.now(),
            });
          }
        }
      },
      { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
    );

    return () => {
      unsubscribePreferences();
      unsubscribeRoute();
      unsubscribeFeatures();
    };
  }, []);

  useEffect(() => {
    // Initialize stores with default data if needed
    const globalState = useGlobalStore.getState();
    
    // Initialize data stores automatically
    const initializeStores = async () => {
      try {
        logger.info('🚀 Inicializando stores Synapse...');
        
        // Fetch initial data for both stores
        const demandasState = useDemandasStore.getState();
        const documentosState = useDocumentosStore.getState();
        
        // Only fetch if stores are empty and not already loading
        if (demandasState.demandas.length === 0 && !demandasState.isLoading) {
          logger.info('🔄 Carregando demandas...');
          await demandasState.fetchDemandas();
        }
        
        if (documentosState.documentos.length === 0 && !documentosState.isLoading) {
          logger.info('🔄 Carregando documentos...');
          await documentosState.fetchDocumentos();
        }
        
        const finalDemandasState = useDemandasStore.getState();
        const finalDocumentosState = useDocumentosStore.getState();
        
        logger.info('✅ Stores inicializados:', {
          demandas: finalDemandasState.demandas.length,
          documentos: finalDocumentosState.documentos.length,
        });
        
        analytics.track('stores_initialized', {
          demandas_count: finalDemandasState.demandas.length,
          documentos_count: finalDocumentosState.documentos.length,
          timestamp: Date.now(),
        });
        
        // Notificar sucesso
        if (finalDemandasState.demandas.length > 0 || finalDocumentosState.documentos.length > 0) {
          addNotification({
            type: 'success',
            title: 'Dados Carregados',
            message: `${finalDemandasState.demandas.length} demandas e ${finalDocumentosState.documentos.length} documentos carregados`,
            duration: 3000,
          });
        }
        
      } catch (error) {
        logger.error('❌ Erro ao inicializar stores:', error);
        addNotification({
          type: 'error',
          title: 'Erro de Inicialização',
          message: 'Erro ao carregar dados iniciais. Tentando novamente...',
          duration: 5000,
        });
      }
    };

    // Initialize stores after a short delay to ensure they're properly set up
    const initTimer = setTimeout(initializeStores, 100);
    
    // Show welcome notification for first-time users
    if (globalState.preferences === globalState.preferences) {
      // Check if it's first visit (you might want to store this in localStorage separately)
      const isFirstVisit = !localStorage.getItem('app-visited');
      
      if (isFirstVisit) {
        localStorage.setItem('app-visited', 'true');
        
        setTimeout(() => {
          addNotification({
            type: 'info',
            title: 'Bem-vindo ao Synapse!',
            message: 'Explore o sistema de gestão de demandas e documentos.',
            duration: 10000,
            actions: [
              {
                label: 'Tour',
                action: () => {
                  // You could implement a tour feature here
                  analytics.track('tour_started', { timestamp: Date.now() });
                },
                variant: 'primary',
              },
            ],
          });
        }, 2000);

        analytics.track('first_visit', {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        });
      }
    }

    return () => {
      clearTimeout(initTimer);
    };
  }, [addNotification]);

  return <>{children}</>;
};

/**
 * Hook to use store hydration status
 */
export const useStoreHydration = () => {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    // Check if stores are hydrated (for SSR compatibility)
    const checkHydration = () => {
      try {
        // Try to access store state
        useGlobalStore.getState();
        useDemandasStore.getState();
        setIsHydrated(true);
      } catch (error) {
        logger.warn('Stores not yet hydrated:', error);
      }
    };

    checkHydration();

    // If not hydrated immediately, try again after a short delay
    if (!isHydrated) {
      const timer = setTimeout(checkHydration, 100);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  return isHydrated;
};

/**
 * Store devtools component for development
 */
export const StoreDevtools: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: '#1a1a1a',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontFamily: 'monospace',
        zIndex: 9999,
        opacity: 0.8,
        pointerEvents: 'none',
      }}
    >
      Stores: Active
    </div>
  );
};

export default StoreProvider;