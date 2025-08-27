// src/hooks/usePerformanceTracking.ts

import React, { useCallback, useEffect, useRef } from 'react';
import { analytics } from '../services/analytics/core';
import { useAnalytics } from './useAnalytics';

interface UsePerformanceTrackingOptions {
  trackRenders?: boolean;
  trackMounts?: boolean;
  trackUpdates?: boolean;
  trackAsyncOperations?: boolean;
  componentName?: string;
}

export const usePerformanceTracking = (
  options: UsePerformanceTrackingOptions = {}
) => {
  const {
    trackRenders = true,
    trackMounts = true,
    trackUpdates = false,
    trackAsyncOperations = true,
    componentName = 'UnknownComponent'
  } = options;

  const { trackPerformance } = useAnalytics();
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number | undefined>(undefined);
  const updateTimesRef = useRef<number[]>([]);
  const asyncOperationsRef = useRef(new Map<string, number>());

  // Track component mounts
  useEffect(() => {
    if (trackMounts) {
      mountTimeRef.current = performance.now();
      analytics.track('component_mount', { 
        componentName,
        timestamp: mountTimeRef.current 
      }, 'performance');
    }

    return () => {
      if (trackMounts && mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        analytics.track('component_unmount', { 
          componentName,
          mountDuration,
          renderCount: renderCountRef.current
        }, 'performance');
      }
    };
  }, [trackMounts, componentName]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCountRef.current += 1;
      const renderTime = performance.now();
      
      if (renderCountRef.current > 1) {
        trackPerformance(`component_render_${componentName}`, renderTime, {
          renderCount: renderCountRef.current,
          componentName
        });
      }
    }
  });

  // Track updates
  useEffect(() => {
    if (trackUpdates && renderCountRef.current > 1) {
      const updateTime = performance.now();
      updateTimesRef.current.push(updateTime);
      
      analytics.track('component_update', {
        componentName,
        updateCount: updateTimesRef.current.length,
        timestamp: updateTime
      }, 'performance');
    }
  });

  // Async operation tracking
  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!trackAsyncOperations) {
      return operation();
    }

    const startTime = performance.now();
    const operationId = `${operationName}_${Date.now()}`;
    
    asyncOperationsRef.current.set(operationId, startTime);
    
    try {
      analytics.track('async_operation_start', {
        operationName,
        operationId,
        componentName
      }, 'performance');

      const result = await operation();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      analytics.track('async_operation_success', {
        operationName,
        operationId,
        duration,
        componentName
      }, 'performance');

      trackPerformance(`async_${operationName}`, duration, {
        componentName,
        operationId
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      analytics.track('async_operation_error', {
        operationName,
        operationId,
        duration,
        error: (error as Error).message,
        componentName
      }, 'error');

      throw error;
    } finally {
      asyncOperationsRef.current.delete(operationId);
    }
  }, [trackAsyncOperations, componentName, trackPerformance]);

  // Manual timing utilities
  const startTiming = useCallback((label: string) => {
    analytics.time(`${componentName}_${label}`);
  }, [componentName]);

  const endTiming = useCallback((label: string, properties?: Record<string, any>) => {
    analytics.timeEnd(`${componentName}_${label}`, {
      componentName,
      ...properties
    });
  }, [componentName]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const now = performance.now();
    const mountDuration = mountTimeRef.current ? now - mountTimeRef.current : 0;
    
    return {
      componentName,
      renderCount: renderCountRef.current,
      mountDuration,
      updateCount: updateTimesRef.current.length,
      activeAsyncOperations: asyncOperationsRef.current.size,
      averageRenderTime: mountDuration / Math.max(renderCountRef.current, 1),
    };
  }, [componentName]);

  return {
    trackAsyncOperation,
    startTiming,
    endTiming,
    getPerformanceSummary,
    renderCount: renderCountRef.current,
  };
};

// HOC for automatic performance tracking
export function withPerformanceTracking(
  Component: React.ComponentType<Record<string, unknown>>,
  options: UsePerformanceTrackingOptions = {}
) {
  const WrappedComponent: React.FC<Record<string, unknown>> = (props) => {
    const componentName = options.componentName || Component.displayName || Component.name;
    
    usePerformanceTracking({
      ...options,
      componentName,
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
}