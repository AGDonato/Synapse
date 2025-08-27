/**
 * Performance monitoring hook
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePerformanceTracking } from './usePerformanceTracking';

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  updateCount: number;
  memoryUsage: number;
  lastUpdate: number;
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 100, // ms
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
  TOO_MANY_UPDATES: 10, // updates per second
} as const;

// Performance issues interface
interface PerformanceIssue {
  type: 'slow_render' | 'memory_leak' | 'excessive_updates';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// Hook options
interface UsePerformanceOptions {
  trackRenders?: boolean;
  trackMemory?: boolean;
  trackUpdates?: boolean;
  onIssueDetected?: (issue: PerformanceIssue) => void;
  componentName?: string;
}

/**
 * Hook for monitoring component performance
 */
export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    trackRenders = true,
    trackMemory = true,
    trackUpdates = true,
    onIssueDetected,
    componentName = 'Unknown Component',
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    updateCount: 0,
    memoryUsage: 0,
    lastUpdate: 0,
  });

  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const renderStartRef = useRef<number>(0);
  const mountTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Performance tracking hook integration
  const { markStart, markEnd, measure } = usePerformanceTracking();

  // Start render measurement
  const startRenderMeasurement = useCallback(() => {
    if (!trackRenders) {return;}
    
    renderStartRef.current = performance.now();
    markStart(`${componentName}_render`);
  }, [trackRenders, componentName, markStart]);

  // End render measurement
  const endRenderMeasurement = useCallback(() => {
    if (!trackRenders || renderStartRef.current === 0) {return;}

    const renderTime = performance.now() - renderStartRef.current;
    markEnd(`${componentName}_render`);
    const measureResult = measure(`${componentName}_render_duration`, `${componentName}_render`);

    setMetrics(prev => ({ 
      ...prev, 
      renderTime,
      lastUpdate: Date.now(),
    }));

    // Check for slow renders
    if (renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
      const issue: PerformanceIssue = {
        type: 'slow_render',
        message: `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
        value: renderTime,
        threshold: PERFORMANCE_THRESHOLDS.SLOW_RENDER,
        timestamp: Date.now(),
      };
      
      setIssues(prev => [...prev, issue]);
      onIssueDetected?.(issue);
    }

    renderStartRef.current = 0;
  }, [trackRenders, componentName, markEnd, measure, onIssueDetected]);

  // Track component updates
  const trackUpdate = useCallback(() => {
    if (!trackUpdates) {return;}

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // Reset counter if more than 1 second has passed
    if (timeSinceLastUpdate > 1000) {
      updateCountRef.current = 0;
    }
    
    updateCountRef.current++;
    lastUpdateTimeRef.current = now;

    setMetrics(prev => ({
      ...prev,
      updateCount: updateCountRef.current,
      lastUpdate: Date.now(),
    }));

    // Check for excessive updates
    if (updateCountRef.current > PERFORMANCE_THRESHOLDS.TOO_MANY_UPDATES) {
      const issue: PerformanceIssue = {
        type: 'excessive_updates',
        message: `Excessive updates detected in ${componentName}: ${updateCountRef.current} updates/sec`,
        value: updateCountRef.current,
        threshold: PERFORMANCE_THRESHOLDS.TOO_MANY_UPDATES,
        timestamp: Date.now(),
      };
      
      setIssues(prev => [...prev, issue]);
      onIssueDetected?.(issue);
      updateCountRef.current = 0; // Reset to avoid spam
    }
  }, [trackUpdates, componentName, onIssueDetected]);

  // Get memory usage
  const getMemoryUsage = useCallback(() => {
    if (!trackMemory || !('memory' in performance)) {return 0;}
    
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize || 0;
  }, [trackMemory]);

  // Update memory metrics
  const updateMemoryMetrics = useCallback(() => {
    if (!trackMemory) {return;}

    const memoryUsage = getMemoryUsage();
    
    setMetrics(prev => ({
      ...prev,
      memoryUsage,
      lastUpdate: Date.now(),
    }));

    // Check for memory issues
    if (memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
      const issue: PerformanceIssue = {
        type: 'memory_leak',
        message: `High memory usage detected: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        value: memoryUsage,
        threshold: PERFORMANCE_THRESHOLDS.MEMORY_WARNING,
        timestamp: Date.now(),
      };
      
      setIssues(prev => [...prev, issue]);
      onIssueDetected?.(issue);
    }
  }, [trackMemory, getMemoryUsage, onIssueDetected]);

  // Setup Performance Observer for detailed metrics
  useEffect(() => {
    if (!trackRenders) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes(componentName)) {
            console.debug(`Performance entry: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      performanceObserverRef.current = observer;

      return () => {
        observer.disconnect();
      };
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }, [trackRenders, componentName]);

  // Component mount time tracking
  useEffect(() => {
    mountTimeRef.current = performance.now();
    markStart(`${componentName}_mount`);

    return () => {
      const mountDuration = performance.now() - mountTimeRef.current;
      markEnd(`${componentName}_mount`);
      measure(`${componentName}_mount_duration`, `${componentName}_mount`);
      
      setMetrics(prev => ({
        ...prev,
        componentMountTime: mountDuration,
      }));
    };
  }, [componentName, markStart, markEnd, measure]);

  // Regular memory monitoring
  useEffect(() => {
    if (!trackMemory) {return;}

    const interval = setInterval(updateMemoryMetrics, 5000); // Check every 5 seconds
    updateMemoryMetrics(); // Initial check

    return () => clearInterval(interval);
  }, [trackMemory, updateMemoryMetrics]);

  // Update tracking on every render
  useEffect(() => {
    trackUpdate();
  });

  // Start render measurement on every render
  startRenderMeasurement();

  // End render measurement after render
  useEffect(() => {
    endRenderMeasurement();
  });

  // Clear old issues
  const clearIssues = useCallback(() => {
    setIssues([]);
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      metrics,
      issues,
      recommendations: generateRecommendations(metrics, issues),
    };
  }, [componentName, metrics, issues]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      componentMountTime: 0,
      updateCount: 0,
      memoryUsage: getMemoryUsage(),
      lastUpdate: Date.now(),
    });
    updateCountRef.current = 0;
    clearIssues();
  }, [getMemoryUsage, clearIssues]);

  return {
    metrics,
    issues,
    clearIssues,
    resetMetrics,
    getPerformanceReport,
    startRenderMeasurement,
    endRenderMeasurement,
  };
};

// Generate performance recommendations
const generateRecommendations = (
  metrics: PerformanceMetrics,
  issues: PerformanceIssue[]
): string[] => {
  const recommendations: string[] = [];

  // Render performance recommendations
  if (metrics.renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
    recommendations.push(
      'Consider memoizing expensive calculations with useMemo or useCallback'
    );
    recommendations.push(
      'Check if component props are causing unnecessary re-renders'
    );
    recommendations.push(
      'Consider splitting large components into smaller ones'
    );
  }

  // Memory recommendations
  if (metrics.memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
    recommendations.push(
      'Check for memory leaks - ensure event listeners and subscriptions are cleaned up'
    );
    recommendations.push(
      'Consider implementing virtualization for large lists'
    );
    recommendations.push(
      'Review component dependencies and remove unused imports'
    );
  }

  // Update frequency recommendations
  if (metrics.updateCount > PERFORMANCE_THRESHOLDS.TOO_MANY_UPDATES) {
    recommendations.push(
      'Reduce update frequency by batching state updates'
    );
    recommendations.push(
      'Use debouncing for frequent user inputs'
    );
    recommendations.push(
      'Consider if all state changes are necessary'
    );
  }

  // Mount time recommendations
  if (metrics.componentMountTime > 500) {
    recommendations.push(
      'Consider lazy loading for this component'
    );
    recommendations.push(
      'Review initialization logic and move to useEffect if possible'
    );
    recommendations.push(
      'Check for synchronous operations that could be asynchronous'
    );
  }

  return recommendations;
};

// Higher-order component for performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UsePerformanceOptions = {}
) => {
  const ComponentWithPerformance = (props: P) => {
    const componentName = options.componentName || WrappedComponent.displayName || WrappedComponent.name;
    const performance = usePerformance({ ...options, componentName });

    // Log performance issues in development
    useEffect(() => {
      if (process.env.NODE_ENV === 'development' && performance.issues.length > 0) {
        console.warn(`Performance issues detected in ${componentName}:`, performance.issues);
      }
    }, [performance.issues, componentName]);

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithPerformance.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithPerformance;
};

export default usePerformance;