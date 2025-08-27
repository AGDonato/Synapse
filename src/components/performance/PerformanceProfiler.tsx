import { Profiler, type ProfilerOnRenderCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface PerformanceProfilerProps {
  id: string;
  children: ReactNode;
  onRender?: ProfilerOnRenderCallback;
  enabled?: boolean;
}

// Interface para métricas de performance
export interface PerformanceMetrics {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

// Classe para coletar e analisar métricas
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private subscribers: ((metrics: PerformanceMetrics[]) => void)[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Manter apenas os últimos 100 registros
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Notificar subscribers
    this.subscribers.forEach(callback => callback([...this.metrics]));

    // Log performance issues
    if (metric.actualDuration > 50) { // Mais de 50ms - threshold reduzido pós otimizações
      console.warn(`🐌 Performance issue detected in component "${metric.id}":`, {
        phase: metric.phase,
        duration: `${metric.actualDuration.toFixed(2)}ms`,
        baseline: `${metric.baseDuration.toFixed(2)}ms`,
        overhead: `${(metric.actualDuration - metric.baseDuration).toFixed(2)}ms`,
      });
    }

    // Log no DevTools (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      // @ts-ignore - performance.mark existe
      performance.mark(`${metric.id}-${metric.phase}-start`, {
        startTime: metric.startTime,
      });
      // @ts-ignore - performance.mark existe
      performance.mark(`${metric.id}-${metric.phase}-end`, {
        startTime: metric.commitTime,
      });
      // @ts-ignore - performance.measure existe
      performance.measure(
        `${metric.id}-${metric.phase}`,
        `${metric.id}-${metric.phase}-start`,
        `${metric.id}-${metric.phase}-end`
      );
    }
  }

  subscribe(callback: (metrics: PerformanceMetrics[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Retornar função de unsubscribe
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(componentId?: string): number {
    const filteredMetrics = componentId 
      ? this.metrics.filter(m => m.id === componentId)
      : this.metrics;

    if (filteredMetrics.length === 0) {return 0;}

    const totalDuration = filteredMetrics.reduce((sum, metric) => sum + metric.actualDuration, 0);
    return totalDuration / filteredMetrics.length;
  }

  getSlowestComponents(limit = 10): { id: string; avgDuration: number; count: number }[] {
    const componentStats = new Map<string, { totalDuration: number; count: number }>();

    this.metrics.forEach(metric => {
      const current = componentStats.get(metric.id) || { totalDuration: 0, count: 0 };
      componentStats.set(metric.id, {
        totalDuration: current.totalDuration + metric.actualDuration,
        count: current.count + 1,
      });
    });

    return Array.from(componentStats.entries())
      .map(([id, stats]) => ({
        id,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  clear(): void {
    this.metrics = [];
    this.subscribers.forEach(callback => callback([]));
  }
}

// Instância global do monitor
export const performanceMonitor = PerformanceMonitor.getInstance();

// Componente Profiler
export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({ 
  id, 
  children, 
  onRender,
  enabled = import.meta.env.DEV,
}) => {
  const handleRender: ProfilerOnRenderCallback = (
    profileId: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    // Chamar callback customizado se fornecido
    onRender?.(profileId, phase, actualDuration, baseDuration, startTime, commitTime);

    // Registrar métrica no monitor
    if (enabled) {
      performanceMonitor.recordMetric({
        id: profileId,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactions: new Set(),
      });
    }
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
};

// Hook para usar métricas de performance
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    // Obter métricas iniciais
    setMetrics(performanceMonitor.getMetrics());

    // Subscribir para atualizações
    const unsubscribe = performanceMonitor.subscribe(setMetrics);

    return unsubscribe;
  }, []);

  return {
    metrics,
    averageRenderTime: performanceMonitor.getAverageRenderTime(),
    slowestComponents: performanceMonitor.getSlowestComponents(),
    clear: performanceMonitor.clear,
  };
};

// Componente para debugger de performance (desenvolvimento)
export const PerformanceDebugger: React.FC = () => {
  const { metrics, averageRenderTime, slowestComponents, clear } = usePerformanceMetrics();

  if (!import.meta.env.DEV || metrics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: '#000',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <strong>⚡ Performance Monitor</strong>
        <button 
          onClick={clear} 
          style={{ 
            marginLeft: '10px', 
            background: '#333', 
            color: '#fff', 
            border: 'none',
            padding: '2px 6px',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Avg Render Time:</strong> {averageRenderTime.toFixed(2)}ms
      </div>
      
      <div>
        <strong>Slowest Components:</strong>
        {slowestComponents.slice(0, 5).map(comp => (
          <div key={comp.id} style={{ marginLeft: '10px' }}>
            {comp.id}: {comp.avgDuration.toFixed(2)}ms ({comp.count} renders)
          </div>
        ))}
      </div>
    </div>
  );
};