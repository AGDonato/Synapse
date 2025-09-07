/**
 * Hook para rastreamento detalhado de performance
 *
 * @description
 * Coleta métricas detalhadas de performance de componentes:
 * - Rastreamento de renderizações e tempo de mount
 * - Métricas de atualizações de componentes
 * - Monitoramento de operações assíncronas
 * - Integração com sistema de analytics
 * - Coleta automática de dados para análise
 *
 * @example
 * const tracking = usePerformanceTracking({
 *   componentName: 'TabelaDemandas',
 *   trackRenders: true,
 *   trackAsyncOperations: true
 * });
 *
 * // Rastrear operação customizada
 * tracking.trackCustomMetric('data-fetch', 450);
 *
 * @module hooks/usePerformanceTracking
 */

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

/**
 * Hook principal para rastreamento de performance
 *
 * @param options - Opções de rastreamento:
 *   - trackRenders: Rastrear renderizações (padrão: true)
 *   - trackMounts: Rastrear monta/desmonta (padrão: true)
 *   - trackUpdates: Rastrear atualizações (padrão: false)
 *   - trackAsyncOperations: Rastrear operações assíncronas (padrão: false)
 *   - componentName: Nome do componente para identificação
 */
export const usePerformanceTracking = (options: UsePerformanceTrackingOptions = {}) => {
  const {
    trackRenders = true,
    trackMounts = true,
    trackUpdates = false,
    trackAsyncOperations = true,
    componentName = 'UnknownComponent',
  } = options;

  const { trackPerformance } = useAnalytics();
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number | undefined>(undefined);
  const updateTimesRef = useRef<number[]>([]);
  const asyncOperationsRef = useRef(new Map<string, number>());

  // Rastreia montagem de componentes
  useEffect(() => {
    if (trackMounts) {
      mountTimeRef.current = performance.now();
      analytics.track(
        'component_mount',
        {
          componentName,
          timestamp: mountTimeRef.current,
        },
        'performance'
      );
    }

    return () => {
      if (trackMounts && mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        analytics.track(
          'component_unmount',
          {
            componentName,
            mountDuration,
            renderCount: renderCountRef.current,
          },
          'performance'
        );
      }
    };
  }, [trackMounts, componentName]);

  // Rastreia renderizações dos componentes
  useEffect(() => {
    if (trackRenders) {
      renderCountRef.current += 1;
      const renderTime = performance.now();

      if (renderCountRef.current > 1) {
        trackPerformance(`component_render_${componentName}`, renderTime, {
          renderCount: renderCountRef.current,
          componentName,
        });
      }
    }
  });

  // Rastreia atualizações de componentes
  useEffect(() => {
    if (trackUpdates && renderCountRef.current > 1) {
      const updateTime = performance.now();
      updateTimesRef.current.push(updateTime);

      analytics.track(
        'component_update',
        {
          componentName,
          updateCount: updateTimesRef.current.length,
          timestamp: updateTime,
        },
        'performance'
      );
    }
  });

  // Rastreamento de operações assíncronas
  const trackAsyncOperation = useCallback(
    async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
      if (!trackAsyncOperations) {
        return operation();
      }

      const startTime = performance.now();
      const operationId = `${operationName}_${Date.now()}`;

      asyncOperationsRef.current.set(operationId, startTime);

      try {
        analytics.track(
          'async_operation_start',
          {
            operationName,
            operationId,
            componentName,
          },
          'performance'
        );

        const result = await operation();

        const endTime = performance.now();
        const duration = endTime - startTime;

        analytics.track(
          'async_operation_success',
          {
            operationName,
            operationId,
            duration,
            componentName,
          },
          'performance'
        );

        trackPerformance(`async_${operationName}`, duration, {
          componentName,
          operationId,
        });

        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        analytics.track(
          'async_operation_error',
          {
            operationName,
            operationId,
            duration,
            error: (error as Error).message,
            componentName,
          },
          'error'
        );

        throw error;
      } finally {
        asyncOperationsRef.current.delete(operationId);
      }
    },
    [trackAsyncOperations, componentName, trackPerformance]
  );

  // Utilitários para cronometragem manual
  const startTiming = useCallback(
    (label: string) => {
      analytics.time(`${componentName}_${label}`);
    },
    [componentName]
  );

  const endTiming = useCallback(
    (label: string, properties?: Record<string, unknown>) => {
      analytics.timeEnd(`${componentName}_${label}`, {
        componentName,
        ...properties,
      });
    },
    [componentName]
  );

  // Obtém resumo completo de performance
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

// Componente de ordem superior para rastreamento automático de performance
export function withPerformanceTracking(
  Component: React.ComponentType<Record<string, unknown>>,
  options: UsePerformanceTrackingOptions = {}
) {
  const WrappedComponent: React.FC<Record<string, unknown>> = props => {
    const componentName = options.componentName ?? Component.displayName ?? Component.name;

    usePerformanceTracking({
      ...options,
      componentName,
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName ?? Component.name})`;
  return WrappedComponent;
}
