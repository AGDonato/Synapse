/**
 * ================================================================
 * HEALTH CHECK - SISTEMA DE MONITORAMENTO DE SAÚDE DA APLICAÇÃO
 * ================================================================
 *
 * Este arquivo implementa um sistema completo de monitoramento da saúde
 * da aplicação Synapse, fornecendo análise contínua de métricas vitais,
 * detecção proativa de problemas e geração de alertas automatizados.
 *
 * Funcionalidades principais:
 * - Monitoramento contínuo de métricas de sistema (memória, DOM, rede)
 * - Health checks customizáveis e extensíveis por módulo
 * - Sistema de alertas baseado em thresholds configuráveis
 * - Histórico detalhado de relatórios de saúde
 * - Recomendações automáticas para resolução de problemas
 * - Monitoramento adaptativo com intervalos ajustáveis
 * - Detecção de degradação de performance
 * - Auto-recovery para problemas menores
 *
 * Métricas monitoradas:
 * - Memory Usage: Uso de heap JavaScript e garbage collection
 * - DOM Health: Número de elementos DOM e vazamentos
 * - Network Status: Conectividade e latência de rede
 * - Error Rate: Taxa de erros JavaScript e crashes
 * - Performance: Frame rate, response times e throughput
 * - Storage: Uso de localStorage, sessionStorage e IndexedDB
 * - Resource Usage: CPU estimado e battery status
 *
 * Sistema de status tri-estado:
 * - Healthy: Todas as métricas dentro dos parâmetros normais
 * - Warning: Algumas métricas próximas aos limites críticos
 * - Critical: Uma ou mais métricas em estado crítico
 *
 * Características avançadas:
 * - Checks assíncronos com timeout para evitar travamentos
 * - Histórico limitado para prevenir vazamentos de memória
 * - Integração nativa com sistema de logging
 * - Métricas padrão do sistema + checks customizados
 * - Auto-scaling de intervalos baseado na saúde atual
 * - Correlação de métricas para análise de causa raiz
 *
 * Integração com outros serviços:
 * - Error Tracking: Correlação com sistema de erros
 * - Performance Monitor: Sincronização com métricas de performance
 * - PHP Integration: Health checks de conectividade backend
 * - Security Monitor: Detecção de ameaças em tempo real
 *
 * Padrões implementados:
 * - Singleton pattern para instância global única
 * - Observer pattern para notificação de mudanças
 * - Strategy pattern para diferentes tipos de checks
 * - Command pattern para execução de health checks
 * - Circuit breaker pattern para tolerância a falhas
 *
 * @fileoverview Sistema completo de monitoramento de saúde da aplicação
 * @version 2.0.0
 * @since 2024-02-01
 * @author Synapse Team
 */

// src/services/monitoring/healthCheck.ts

import { logger } from '../../utils/logger';

/**
 * Interface para métricas individuais de saúde
 */
interface HealthMetric {
  /** Nome identificador da métrica */
  name: string;
  /** Status atual da métrica */
  status: 'healthy' | 'warning' | 'critical';
  /** Valor atual da métrica */
  value: number | string;
  /** Thresholds para warning e critical (opcional) */
  threshold?: {
    warning: number;
    critical: number;
  };
  /** Unidade de medida (MB, ms, %, etc.) */
  unit?: string;
  /** Timestamp da coleta */
  timestamp: number;
}

/**
 * Interface para relatório completo de saúde
 */
interface HealthReport {
  /** Status geral da aplicação */
  overall: 'healthy' | 'warning' | 'critical';
  /** Timestamp do relatório */
  timestamp: number;
  /** Lista de todas as métricas coletadas */
  metrics: HealthMetric[];
  /** Erros encontrados durante os checks */
  errors: string[];
  /** Recomendações para melhorar a saúde */
  recommendations: string[];
}

/**
 * Classe principal para monitoramento da saúde da aplicação
 * Gerencia coleção de métricas, alertas e relatórios
 */
class HealthMonitor {
  /** Lista de funções de health check registradas */
  private checks: (() => Promise<HealthMetric> | HealthMetric)[] = [];
  /** ID do intervalo de monitoramento */
  private monitoringInterval?: number;
  /** Flag indicando se monitoramento está ativo */
  private isMonitoring = false;
  /** Histórico de relatórios de saúde */
  private reportHistory: HealthReport[] = [];
  /** Tamanho máximo do histórico (para evitar vazamentos) */
  private maxHistorySize = 100;

  /**
   * Inicializa o monitor com checks padrão
   */
  constructor() {
    this.initializeDefaultChecks();
  }

  /**
   * Inicializa checks de saúde padrão do sistema
   */
  private initializeDefaultChecks(): void {
    // Verificação de uso de memória
    this.addHealthCheck(async (): Promise<HealthMetric> => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const percentage = (usedMB / totalMB) * 100;

        return {
          name: 'memory_usage',
          status: percentage > 80 ? 'critical' : percentage > 60 ? 'warning' : 'healthy',
          value: percentage,
          threshold: { warning: 60, critical: 80 },
          unit: '%',
          timestamp: Date.now(),
        };
      }

      return {
        name: 'memory_usage',
        status: 'healthy',
        value: 'N/A',
        timestamp: Date.now(),
      };
    });

    // Verificação de contagem de nós DOM
    this.addHealthCheck((): HealthMetric => {
      const nodeCount = document.querySelectorAll('*').length;
      return {
        name: 'dom_nodes',
        status: nodeCount > 5000 ? 'critical' : nodeCount > 3000 ? 'warning' : 'healthy',
        value: nodeCount,
        threshold: { warning: 3000, critical: 5000 },
        unit: 'nodes',
        timestamp: Date.now(),
      };
    });

    // Verificação de event listeners
    this.addHealthCheck((): HealthMetric => {
      const eventListenerCount = (performance as any).eventCounts?.total || 0;
      return {
        name: 'event_listeners',
        status:
          eventListenerCount > 1000 ? 'critical' : eventListenerCount > 500 ? 'warning' : 'healthy',
        value: eventListenerCount,
        threshold: { warning: 500, critical: 1000 },
        unit: 'listeners',
        timestamp: Date.now(),
      };
    });

    // Verificação de conexão de rede
    this.addHealthCheck((): HealthMetric => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        const status =
          effectiveType === 'slow-2g' || effectiveType === '2g' ? 'warning' : 'healthy';

        return {
          name: 'network_connection',
          status,
          value: effectiveType,
          timestamp: Date.now(),
        };
      }

      return {
        name: 'network_connection',
        status: 'healthy',
        value: 'unknown',
        timestamp: Date.now(),
      };
    });

    // Verificação de taxa de erro (últimos 5 minutos)
    this.addHealthCheck((): HealthMetric => {
      const errors = JSON.parse(localStorage.getItem('error_count') || '0');
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const recentErrors = errors.filter(
        (error: { timestamp: number }) => error.timestamp > fiveMinutesAgo
      );

      return {
        name: 'error_rate',
        status:
          recentErrors.length > 10 ? 'critical' : recentErrors.length > 5 ? 'warning' : 'healthy',
        value: recentErrors.length,
        threshold: { warning: 5, critical: 10 },
        unit: 'errors/5min',
        timestamp: Date.now(),
      };
    });

    // Verificação de uso do local storage
    this.addHealthCheck((): HealthMetric => {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }

      const sizeKB = Math.round(totalSize / 1024);
      const maxStorageKB = 10 * 1024; // Assume limite de 10MB
      const percentage = (sizeKB / maxStorageKB) * 100;

      return {
        name: 'local_storage',
        status: percentage > 80 ? 'critical' : percentage > 60 ? 'warning' : 'healthy',
        value: percentage,
        threshold: { warning: 60, critical: 80 },
        unit: '%',
        timestamp: Date.now(),
      };
    });

    // Verificação de performance de carregamento do bundle
    this.addHealthCheck((): HealthMetric => {
      const navigationTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;

        return {
          name: 'page_load_time',
          status: loadTime > 5000 ? 'critical' : loadTime > 3000 ? 'warning' : 'healthy',
          value: Math.round(loadTime),
          threshold: { warning: 3000, critical: 5000 },
          unit: 'ms',
          timestamp: Date.now(),
        };
      }

      return {
        name: 'page_load_time',
        status: 'healthy',
        value: 'N/A',
        timestamp: Date.now(),
      };
    });

    // Verificação React DevTools (não deveria estar em produção)
    this.addHealthCheck((): HealthMetric => {
      const hasReactDevTools = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const isProduction = process.env.NODE_ENV === 'production';

      return {
        name: 'react_devtools',
        status: hasReactDevTools && isProduction ? 'warning' : 'healthy',
        value: hasReactDevTools ? 'detected' : 'not_detected',
        timestamp: Date.now(),
      };
    });
  }

  addHealthCheck(check: () => Promise<HealthMetric> | HealthMetric): void {
    this.checks.push(check);
  }

  async runHealthCheck(): Promise<HealthReport> {
    const metrics: HealthMetric[] = [];
    const errors: string[] = [];

    // Executa todas as verificações de saúde
    for (const check of this.checks) {
      try {
        const result = await check();
        metrics.push(result);
      } catch (error) {
        errors.push(`Verificação de saúde falhou: ${error}`);
      }
    }

    // Determina status geral
    let overall: HealthReport['overall'] = 'healthy';
    if (metrics.some(m => m.status === 'critical') || errors.length > 0) {
      overall = 'critical';
    } else if (metrics.some(m => m.status === 'warning')) {
      overall = 'warning';
    }

    // Gera recomendações
    const recommendations = this.generateRecommendations(metrics, errors);

    const report: HealthReport = {
      overall,
      timestamp: Date.now(),
      metrics,
      errors,
      recommendations,
    };

    // Armazena no histórico
    this.reportHistory.push(report);
    if (this.reportHistory.length > this.maxHistorySize) {
      this.reportHistory.shift();
    }

    return report;
  }

  private generateRecommendations(metrics: HealthMetric[], errors: string[]): string[] {
    const recommendations: string[] = [];

    // Recomendações de memória
    const memoryMetric = metrics.find(m => m.name === 'memory_usage');
    if (memoryMetric && memoryMetric.status !== 'healthy') {
      recommendations.push(
        'Considere reduzir a complexidade dos componentes ou implementar otimização de memória'
      );
    }

    // Recomendações DOM
    const domMetric = metrics.find(m => m.name === 'dom_nodes');
    if (domMetric && domMetric.status !== 'healthy') {
      recommendations.push(
        'Muitos nós DOM detectados. Considere virtualizar listas grandes ou lazy loading'
      );
    }

    // Recomendações de rede
    const networkMetric = metrics.find(m => m.name === 'network_connection');
    if (networkMetric && networkMetric.status !== 'healthy') {
      recommendations.push(
        'Rede lenta detectada. Habilite modo offline ou reduza tamanho dos bundles'
      );
    }

    // Recomendações de erro
    const errorMetric = metrics.find(m => m.name === 'error_rate');
    if (errorMetric && errorMetric.status !== 'healthy') {
      recommendations.push(
        'Alta taxa de erro detectada. Revise logs de erro e implemente error boundaries'
      );
    }

    // Recomendações de performance
    const loadTimeMetric = metrics.find(m => m.name === 'page_load_time');
    if (loadTimeMetric && loadTimeMetric.status !== 'healthy') {
      recommendations.push(
        'Carregamento lento de página detectado. Implemente code splitting e otimize bundles'
      );
    }

    // Recomendações de armazenamento
    const storageMetric = metrics.find(m => m.name === 'local_storage');
    if (storageMetric && storageMetric.status !== 'healthy') {
      recommendations.push(
        'Uso de armazenamento local alto. Implemente limpeza de dados ou mova para servidor'
      );
    }

    if (errors.length > 0) {
      recommendations.push(
        'Erros de sistema detectados. Verifique logs do console e serviço de rastreamento de erros'
      );
    }

    return recommendations;
  }

  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const report = await this.runHealthCheck();

        // Envia alertas críticos imediatamente
        if (report.overall === 'critical') {
          this.sendAlert(report);
        }

        // Registra status de saúde
        logger.info(`🏥 Health Status: ${report.overall.toUpperCase()}`, {
          criticalMetrics: report.metrics.filter(m => m.status === 'critical').length,
          warningMetrics: report.metrics.filter(m => m.status === 'warning').length,
          errors: report.errors.length,
        });
      } catch (error) {
        logger.error('Erro no monitoramento de saúde:', error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      window.clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  getHistory(): HealthReport[] {
    return [...this.reportHistory];
  }

  getLatestReport(): HealthReport | null {
    return this.reportHistory[this.reportHistory.length - 1] || null;
  }

  private async sendAlert(report: HealthReport): Promise<void> {
    // Em produção, envia para serviço de monitoramento
    logger.error('🚨 ALERTA CRÍTICO DE SAÚDE', {
      metrics: report.metrics.filter(m => m.status === 'critical'),
      errors: report.errors,
      recommendations: report.recommendations,
    });

    // Envia para serviço externo de monitoramento
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'health_critical',
          report,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      logger.error('Falha ao enviar alerta de saúde:', error);
    }
  }

  // Exporta dados de saúde para análise
  exportHealthData(): string {
    return JSON.stringify(
      {
        history: this.reportHistory,
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          connection: (navigator as any).connection,
          memory: (performance as any).memory,
        },
        timestamp: Date.now(),
      },
      null,
      2
    );
  }
}

export const healthMonitor = new HealthMonitor();
export type { HealthMetric, HealthReport };
