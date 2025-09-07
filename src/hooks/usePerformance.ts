/**
 * Hook para monitoramento de performance de componentes
 *
 * @description
 * Monitora métricas de performance em tempo real:
 * - Tempo de renderização de componentes
 * - Uso de memória
 * - Contagem de atualizações
 * - Detecção automática de problemas de performance
 * - Alertas para renderizações lentas ou vazamentos de memória
 *
 * @example
 * const performance = usePerformance({
 *   componentName: 'MinhaTabela',
 *   trackRenders: true,
 *   trackMemory: true,
 *   onIssueDetected: (issue) => {
 *     console.warn('Performance issue:', issue);
 *   }
 * });
 *
 * // Acessar métricas
 * console.log('Renders:', performance.metrics.updateCount);
 *
 * @module hooks/usePerformance
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePerformanceTracking } from './usePerformanceTracking';
import { logger } from '../utils/logger';

// Interface para métricas de performance de componentes
interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  updateCount: number;
  memoryUsage: number;
  lastUpdate: number;
}

// Limites de performance para emissão de alertas automáticos
const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 100, // ms - renderização lenta
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB - alerta de memória
  TOO_MANY_UPDATES: 10, // atualizações por segundo
} as const;

// Interface para definição de problemas de performance detectados
interface PerformanceIssue {
  type: 'slow_render' | 'memory_leak' | 'excessive_updates';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// Interface para opções de configuração do hook de performance
interface UsePerformanceOptions {
  trackRenders?: boolean;
  trackMemory?: boolean;
  trackUpdates?: boolean;
  onIssueDetected?: (issue: PerformanceIssue) => void;
  componentName?: string;
}

/**
 * Hook principal para monitoramento de performance de componentes
 */
// eslint-disable-next-line max-lines-per-function
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

  // Integração com hook de rastreamento de performance
  const { startTiming, endTiming } = usePerformanceTracking();

  // Inicia medição do tempo de renderização
  const startRenderMeasurement = useCallback(() => {
    if (!trackRenders) {
      return;
    }

    renderStartRef.current = performance.now();
    startTiming(`render`);
  }, [trackRenders, startTiming]);

  // Finaliza medição do tempo de renderização
  const endRenderMeasurement = useCallback(() => {
    if (!trackRenders || renderStartRef.current === 0) {
      return;
    }

    const renderTime = performance.now() - renderStartRef.current;
    endTiming(`render`, { renderTime });

    setMetrics(prev => ({
      ...prev,
      renderTime,
      lastUpdate: Date.now(),
    }));

    // Verifica se houve renderizações lentas
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
  }, [trackRenders, componentName, endTiming, onIssueDetected]);

  // Rastreia atualizações do componente
  const trackUpdate = useCallback(() => {
    if (!trackUpdates) {
      return;
    }

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Reseta contador se passou mais de 1 segundo
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

    // Verifica se há atualizações excessivas
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
      updateCountRef.current = 0; // Reseta para evitar spam de alertas
    }
  }, [trackUpdates, componentName, onIssueDetected]);

  // Obtém uso atual de memória JavaScript
  const getMemoryUsage = useCallback(() => {
    if (!trackMemory || !('memory' in performance)) {
      return 0;
    }

    const memory = (performance as { memory?: { usedJSHeapSize?: number } }).memory;
    return memory?.usedJSHeapSize ?? 0;
  }, [trackMemory]);

  // Atualiza métricas de uso de memória
  const updateMemoryMetrics = useCallback(() => {
    if (!trackMemory) {
      return;
    }

    const memoryUsage = getMemoryUsage();

    setMetrics(prev => ({
      ...prev,
      memoryUsage,
      lastUpdate: Date.now(),
    }));

    // Verifica se há problemas de memória
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

  // Configura Performance Observer para métricas detalhadas
  useEffect(() => {
    if (!trackRenders) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes(componentName)) {
            logger.debug(`Performance entry: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      performanceObserverRef.current = observer;

      return () => {
        observer.disconnect();
      };
    } catch (error) {
      logger.warn('PerformanceObserver não é suportado pelo navegador:', error);
    }
  }, [trackRenders, componentName]);

  // Rastreamento do tempo de montagem do componente
  useEffect(() => {
    mountTimeRef.current = performance.now();
    startTiming(`mount`);

    return () => {
      const mountDuration = performance.now() - mountTimeRef.current;
      endTiming(`mount`, { mountDuration });

      setMetrics(prev => ({
        ...prev,
        componentMountTime: mountDuration,
      }));
    };
  }, [startTiming, endTiming]);

  // Monitoramento regular de memória
  useEffect(() => {
    if (!trackMemory) {
      return;
    }

    const interval = setInterval(updateMemoryMetrics, 5000); // Verifica a cada 5 segundos
    updateMemoryMetrics(); // Verificação inicial

    return () => clearInterval(interval);
  }, [trackMemory, updateMemoryMetrics]);

  // Rastreamento de atualizações a cada renderização
  useEffect(() => {
    trackUpdate();
  });

  // Inicia medição de renderização a cada render
  startRenderMeasurement();

  // Finaliza medição de renderização após render
  useEffect(() => {
    endRenderMeasurement();
  });

  // Limpa problemas antigos de performance
  const clearIssues = useCallback(() => {
    setIssues([]);
  }, []);

  // Obtém relatório completo de performance
  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      metrics,
      issues,
      recommendations: generateRecommendations(metrics, issues),
    };
  }, [componentName, metrics, issues]);

  // Reseta todas as métricas de performance
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

// Gera recomendações automáticas de otimização de performance
const generateRecommendations = (
  metrics: PerformanceMetrics,
  _issues: PerformanceIssue[]
): string[] => {
  const recommendations: string[] = [];

  // Recomendações para performance de renderização
  if (metrics.renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
    recommendations.push(
      'Considere usar memoização para cálculos custosos com useMemo ou useCallback'
    );
    recommendations.push(
      'Verifique se as props do componente estão causando re-renderizações desnecessárias'
    );
    recommendations.push('Considere dividir componentes grandes em componentes menores');
  }

  // Recomendações para otimização de memória
  if (metrics.memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
    recommendations.push(
      'Verifique vazamentos de memória - certifique-se de limpar event listeners e subscriptions'
    );
    recommendations.push('Considere implementar virtualização para listas grandes');
    recommendations.push('Revise dependências do componente e remova imports não utilizados');
  }

  // Recomendações para frequência de atualizações
  if (metrics.updateCount > PERFORMANCE_THRESHOLDS.TOO_MANY_UPDATES) {
    recommendations.push('Reduza a frequência de atualizações agrupando mudanças de estado');
    recommendations.push('Use debounce para inputs frequentes do usuário');
    recommendations.push('Considere se todas as mudanças de estado são necessárias');
  }

  // Recomendações para tempo de montagem
  if (metrics.componentMountTime > 500) {
    recommendations.push('Considere usar lazy loading para este componente');
    recommendations.push('Revise a lógica de inicialização e mova para useEffect se possível');
    recommendations.push('Verifique operações síncronas que poderiam ser assíncronas');
  }

  return recommendations;
};

// Componente de ordem superior para monitoramento automático de performance
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UsePerformanceOptions = {}
) => {
  const ComponentWithPerformance = (props: P) => {
    const componentName =
      options.componentName ?? WrappedComponent.displayName ?? WrappedComponent.name;
    const performance = usePerformance({ ...options, componentName });

    // Log de problemas de performance em desenvolvimento
    useEffect(() => {
      if (process.env.NODE_ENV === 'development' && performance.issues.length > 0) {
        logger.warn(`Problemas de performance detectados em ${componentName}:`, performance.issues);
      }
    }, [performance.issues, componentName]);

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithPerformance.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName ?? WrappedComponent.name})`;

  return ComponentWithPerformance;
};

export default usePerformance;
