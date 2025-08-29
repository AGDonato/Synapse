import { logger } from './logger';
/**
 * Enhanced lazy loading utilities with performance optimizations
 */

import type { ComponentType, LazyExoticComponent } from 'react';
import { Suspense, lazy } from 'react';
import React from 'react';

// Types
type ComponentFactory<T = Record<string, unknown>> = () => Promise<{ default: ComponentType<T> }>;
type RetryFunction<T = Record<string, unknown>> = (
  fn: ComponentFactory<T>,
  retriesLeft: number
) => Promise<{ default: ComponentType<T> }>;

// Lazy loading configuration
interface LazyLoadConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  preload?: boolean;
  onError?: (error: Error) => void;
  onLoading?: () => void;
  onLoaded?: () => void;
}

// Default configuration
const defaultConfig: Required<LazyLoadConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  preload: false,
  onError: error => logger.error('Lazy loading failed:', error),
  onLoading: () => logger.info('Loading component...'),
  onLoaded: () => logger.info('Component loaded successfully'),
};

// Retry mechanism for failed imports
const retryImport = async <T = Record<string, unknown>>(
  fn: ComponentFactory<T>,
  retriesLeft: number
): Promise<{ default: ComponentType<T> }> => {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft <= 0) {
      throw error;
    }

    logger.warn(`Import failed, retrying... (${retriesLeft} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, defaultConfig.retryDelay));
    return retryImport(fn, retriesLeft - 1);
  }
};

// Enhanced lazy loading with retry logic
export const createLazyComponent = <T = Record<string, unknown>>(
  componentFactory: ComponentFactory<T>,
  config: LazyLoadConfig = {}
): LazyExoticComponent<ComponentType<T>> => {
  const fullConfig = { ...defaultConfig, ...config };

  const enhancedFactory = async () => {
    fullConfig.onLoading();

    try {
      const component = await retryImport(componentFactory, fullConfig.maxRetries);
      fullConfig.onLoaded();
      return component;
    } catch (error) {
      fullConfig.onError(error as Error);
      throw error;
    }
  };

  return lazy(enhancedFactory);
};

// Preload function for components
export const preloadComponent = async <T>(componentFactory: ComponentFactory<T>): Promise<void> => {
  try {
    await componentFactory();
  } catch (error) {
    logger.warn('Preload failed for component:', error);
  }
};

// Batch preload multiple components
export const batchPreload = async (
  factories: ComponentFactory[],
  options: { parallel?: boolean; delay?: number } = {}
): Promise<void> => {
  const { parallel = true, delay = 0 } = options;

  if (parallel) {
    await Promise.allSettled(factories.map(factory => preloadComponent(factory)));
  } else {
    for (const factory of factories) {
      await preloadComponent(factory);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

// Lazy loading with intersection observer (for viewport-based loading)
export const createViewportLazyComponent = <T = Record<string, unknown>>(
  componentFactory: ComponentFactory<T>,
  config: LazyLoadConfig & { rootMargin?: string; threshold?: number } = {}
): LazyExoticComponent<ComponentType<T>> => {
  const { rootMargin = '100px', threshold = 0.1, ...lazyConfig } = config;
  let hasLoaded = false;

  return lazy(async () => {
    // If already loaded, return immediately
    if (hasLoaded) {
      return await componentFactory();
    }

    // Wait for intersection observer trigger
    return new Promise((resolve, reject) => {
      // Create a temporary element to observe
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              hasLoaded = true;
              observer.disconnect();

              retryImport(componentFactory, defaultConfig.maxRetries).then(resolve).catch(reject);
            }
          });
        },
        { rootMargin, threshold }
      );

      // Create marker element
      const marker = document.createElement('div');
      marker.style.position = 'absolute';
      marker.style.top = '0';
      marker.style.left = '0';
      marker.style.width = '1px';
      marker.style.height = '1px';
      marker.style.opacity = '0';
      marker.style.pointerEvents = 'none';

      document.body.appendChild(marker);
      observer.observe(marker);

      // Cleanup after timeout
      setTimeout(() => {
        observer.disconnect();
        document.body.removeChild(marker);
        if (!hasLoaded) {
          reject(new Error('Viewport lazy loading timeout'));
        }
      }, lazyConfig.timeout || defaultConfig.timeout);
    });
  });
};

// Resource hints for better loading performance
export const addResourceHints = (hints: { href: string; as: string; type?: string }[]) => {
  hints.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) {
      link.type = type;
    }

    document.head.appendChild(link);
  });
};

// Performance monitoring for lazy loading
interface LoadingMetrics {
  componentName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

const loadingMetrics: LoadingMetrics[] = [];

export const trackLazyLoading = <T>(
  componentName: string,
  componentFactory: ComponentFactory<T>
): ComponentFactory<T> => {
  return async () => {
    const startTime = performance.now();

    try {
      const component = await componentFactory();
      const endTime = performance.now();

      loadingMetrics.push({
        componentName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
      });

      return component;
    } catch (error) {
      const endTime = performance.now();

      loadingMetrics.push({
        componentName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
};

// Get loading metrics
export const getLazyLoadingMetrics = (): LoadingMetrics[] => {
  return [...loadingMetrics];
};

// Clear metrics
export const clearLazyLoadingMetrics = (): void => {
  loadingMetrics.length = 0;
};

// Lazy route factory with code splitting
export const createLazyRoute = <T = Record<string, unknown>>(
  componentFactory: ComponentFactory<T>,
  options: {
    preload?: boolean;
    fallback?: React.ReactElement;
    errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  } = {}
) => {
  const { preload = false, fallback, errorBoundary: ErrorBoundary } = options;

  const LazyComponent = createLazyComponent(
    trackLazyLoading(`Route_${componentFactory.name}`, componentFactory),
    { preload }
  );

  return (props: T) => {
    if (ErrorBoundary) {
      return React.createElement(
        ErrorBoundary,
        { error: new Error('Component failed to load'), retry: () => window.location.reload() },
        React.createElement(
          Suspense,
          { fallback },
          React.createElement(LazyComponent as any, props as any)
        )
      );
    }

    return React.createElement(
      Suspense,
      { fallback },
      React.createElement(LazyComponent as any, props as any)
    );
  };
};

// Smart preloading based on user behavior
class SmartPreloader {
  private preloadedComponents = new Set<string>();
  private userInteractions: string[] = [];
  private preloadTimeout: number | null = null;

  // Track user interactions
  trackInteraction(componentPath: string) {
    this.userInteractions.push(componentPath);

    // Keep only last 10 interactions
    if (this.userInteractions.length > 10) {
      this.userInteractions.shift();
    }

    this.schedulePreload();
  }

  // Schedule preload based on patterns
  private schedulePreload() {
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }

    this.preloadTimeout = window.setTimeout(() => {
      this.analyzeAndPreload();
    }, 2000);
  }

  // Analyze patterns and preload likely next components
  private analyzeAndPreload() {
    const patterns = this.findPatterns();
    patterns.forEach(async componentPath => {
      if (!this.preloadedComponents.has(componentPath)) {
        try {
          // Dynamic import based on path
          await import(/* @vite-ignore */ componentPath);
          this.preloadedComponents.add(componentPath);
        } catch (error) {
          // Error already logged by logger system
        }
      }
    });
  }

  // Simple pattern analysis
  private findPatterns(): string[] {
    // This is a simplified pattern recognition
    // In reality, you'd want more sophisticated ML-based approaches
    const frequencies: Record<string, number> = {};

    this.userInteractions.forEach(path => {
      frequencies[path] = (frequencies[path] || 0) + 1;
    });

    // Return paths with high frequency
    return Object.entries(frequencies)
      .filter(([, count]) => count >= 2)
      .map(([path]) => path);
  }

  // Reset preloader state
  reset() {
    this.preloadedComponents.clear();
    this.userInteractions.length = 0;
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }
  }
}

export const smartPreloader = new SmartPreloader();

// Hook for component visibility detection
export const useComponentVisible = (callback?: () => void) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible && callback) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [callback]);

  return { isVisible, elementRef };
};

// Bundle splitting utilities
export const dynamicImports = {
  // Route-based imports
  routes: {
    home: () => import('../pages/HomePage/index'),
    demandas: () => import('../pages/DemandasPage'),
    documentos: () => import('../pages/DocumentosPage'),
    cadastros: () => import('../pages/CadastrosPage'),
    relatorios: () => import('../pages/RelatoriosPage'),
    analytics: () => import('../pages/AnalyticsPage'),
  },

  // Feature-based imports
  features: {
    charts: () => import('../components/charts/AnalyticsChart'),
    forms: () => import('../components/forms/SearchableSelect'),
    modals: () => import('../components/ui/Modal'),
    tables: () => import('../components/ui/DataTable'),
  },

  // Utility imports
  utils: {
    dateUtils: () => import('../utils/dateUtils'),
    formatters: () => import('../utils/formatters'),
    validators: () => import('../utils/validators'),
  },
};

export default {
  createLazyComponent,
  createLazyRoute,
  preloadComponent,
  batchPreload,
  smartPreloader,
  useComponentVisible,
  dynamicImports,
  getLazyLoadingMetrics,
  clearLazyLoadingMetrics,
};
