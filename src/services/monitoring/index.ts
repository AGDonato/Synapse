/**
 * ================================================================
 * MONITORING SERVICE - SISTEMA COMPLETO DE MONITORAMENTO
 * ================================================================
 *
 * Este arquivo centraliza todos os serviços de monitoramento do Synapse,
 * fornecendo uma interface unificada para observabilidade completa da aplicação
 * com métricas de saúde, performance, erros e diagnósticos em tempo real.
 *
 * Funcionalidades principais:
 * - Monitoramento de saúde do sistema e recursos
 * - Rastreamento e relatório de erros com contexto
 * - Monitoramento de performance e Core Web Vitals
 * - Alertas e notificações em tempo real
 * - Integração cross-service para visão holística
 * - Exportação de dados para análise externa
 * - Auto-recovery e self-healing capabilities
 *
 * Serviços integrados:
 * - HealthMonitor: Monitoramento de saúde e recursos do sistema
 * - ErrorTracking: Captura e análise de erros e exceções
 * - PerformanceMonitoring: Métricas de performance e UX
 * - PHPIntegrationMonitor: Monitoramento de integração backend
 *
 * Métricas coletadas:
 * - Uso de CPU, memória e recursos do navegador
 * - Taxa de erros e exceções por tipo/severidade
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Latência de rede e tempo de resposta de APIs
 * - Métricas customizadas de negócio
 *
 * Estratégias de monitoramento:
 * - Real-time monitoring: Coleta contínua de métricas
 * - Batch reporting: Envio otimizado de relatórios
 * - Error deduplication: Prevenção de spam de erros
 * - Adaptive sampling: Ajuste dinâmico de frequência
 * - Graceful degradation: Fallback em caso de falhas
 *
 * Integrações disponíveis:
 * - Sentry: Rastreamento avançado de erros
 * - Google Analytics: Métricas de usuário e comportamento
 * - Custom endpoints: APIs proprietárias de monitoramento
 * - Local storage: Persistência offline de métricas
 *
 * Padrões implementados:
 * - Observer pattern para eventos de monitoramento
 * - Decorator pattern para wrapping de funções
 * - Strategy pattern para diferentes tipos de coleta
 * - Chain of Responsibility para processamento de erros
 * - Singleton pattern para instâncias de serviço
 *
 * @fileoverview Sistema centralizado de monitoramento e observabilidade
 * @version 2.0.0
 * @since 2024-01-26
 * @author Synapse Team
 */

import { logger } from '../../utils/logger';

/**
 * ===================================================================
 * EXPORTAÇÃO DE SERVIÇOS DE MONITORAMENTO
 * ===================================================================
 */
export { healthMonitor } from './healthCheck';
export {
  errorTrackingService,
  createErrorTrackingWrapper,
  getErrorTrackingUtils,
} from './errorTracking';
export { performanceMonitoringService, getPerformanceUtils } from './performance';

/**
 * ===================================================================
 * EXPORTAÇÃO DE TIPOS E INTERFACES
 * ===================================================================
 */
export type { HealthMetric, HealthReport } from './healthCheck';
export type { ErrorInfo, ErrorReport, ErrorTrackingConfig } from './errorTracking';
export type { PerformanceMetric, PerformanceReport, PerformanceConfig } from './performance';

import { healthMonitor } from './healthCheck';
import { errorTrackingService } from './errorTracking';
import { performanceMonitoringService } from './performance';

/**
 * Inicializa todos os serviços de monitoramento da aplicação
 *
 * Configura e inicia todos os serviços de monitoramento com as configurações
 * especificadas. Estabelece integrações entre serviços e configura handlers
 * de eventos para coleta automática de métricas.
 *
 * @param config - Configurações opcionais para cada serviço
 * @param config.health - Configurações do monitor de saúde
 * @param config.errors - Configurações do rastreamento de erros
 * @param config.performance - Configurações do monitor de performance
 * @returns Promise que resolve quando todos os serviços estão inicializados
 *
 * @example
 * ```typescript
 * await initializeMonitoring({
 *   health: { intervalMs: 30000 },
 *   errors: { endpoint: '/api/errors' },
 *   performance: { endpoint: '/api/metrics' }
 * });
 * ```
 */
export const initializeMonitoring = async (
  config: {
    health?: { intervalMs?: number };
    errors?: { endpoint?: string };
    performance?: { endpoint?: string };
  } = {}
): Promise<void> => {
  try {
    logger.info('🔍 Initializing monitoring services...');

    // Inicializa rastreamento de erro primeiro (captura erros de inicialização)
    errorTrackingService.captureError({
      message: 'Monitoring initialization started',
      type: 'javascript',
      severity: 'low',
      tags: ['monitoring', 'initialization'],
    });

    // Inicia monitoramento de saúde
    healthMonitor.startMonitoring(config.health?.intervalMs || 30000);

    // Monitoramento de performance é auto-iniciado no construtor
    // Atualiza configuração se fornecida
    if (config.performance?.endpoint) {
      (performanceMonitoringService as any).config.endpoint = config.performance.endpoint;
    }

    // Atualiza configuração de rastreamento de erro
    if (config.errors?.endpoint) {
      (errorTrackingService as any).config.endpoint = config.errors.endpoint;
    }

    // Configura integrações cross-service
    setupIntegrations();

    logger.info('✅ Monitoring services initialized successfully');

    // Registra status inicial
    setTimeout(async () => {
      const healthReport = await healthMonitor.runHealthCheck();
      const performanceReport = performanceMonitoringService.generateReport();
      const errorReport = errorTrackingService.generateReport();

      logger.info('📊 Initial monitoring status:', {
        health: healthReport.overall,
        performance: performanceReport.score,
        errors: errorReport.summary.total,
      });
    }, 2000);
  } catch (error) {
    logger.error('❌ Monitoring initialization failed:', error);

    // Tenta capturar este erro
    try {
      errorTrackingService.captureError({
        message: `Monitoring initialization failed: ${error}`,
        type: 'javascript',
        severity: 'critical',
        context: { error: String(error) },
        tags: ['monitoring', 'initialization', 'failure'],
      });
    } catch (captureError) {
      logger.error('Failed to capture initialization error:', captureError);
    }

    throw error;
  }
};

/**
 * Configura integrações entre os serviços de monitoramento
 *
 * Estabelece comunicação cross-service para que problemas detectados
 * por um serviço sejam reportados aos outros, criando uma visão
 * holística do estado da aplicação.
 *
 * @private
 */
const setupIntegrations = (): void => {
  // Integração Monitoramento de saúde -> Rastreamento de erro
  const originalHealthCheck = healthMonitor.runHealthCheck.bind(healthMonitor);
  healthMonitor.runHealthCheck = async () => {
    const report = await originalHealthCheck();

    // Reporta problemas críticos de saúde como erros
    if (report.overall === 'critical') {
      errorTrackingService.captureError({
        message: 'Critical health issues detected',
        type: 'performance',
        severity: 'high',
        context: {
          metrics: report.metrics.filter(m => m.status === 'critical'),
          errors: report.errors,
        },
        tags: ['health', 'critical'],
      });
    }

    return report;
  };

  // Integração Monitoramento de performance -> Rastreamento de erro
  const originalGenerateReport = performanceMonitoringService.generateReport.bind(
    performanceMonitoringService
  );
  performanceMonitoringService.generateReport = () => {
    const report = originalGenerateReport();

    // Reporta Core Web Vitals ruins como erros de performance
    Object.entries(report.coreWebVitals).forEach(([name, metric]) => {
      if (metric && (metric as any).score === 'poor') {
        errorTrackingService.captureError({
          message: `Poor ${name.toUpperCase()}: ${(metric as any).value}${(metric as any).unit}`,
          type: 'performance',
          severity: 'medium',
          context: {
            metric: name,
            value: (metric as any).value,
            unit: (metric as any).unit,
            threshold: (metric as any).threshold,
          },
          tags: ['performance', 'core-web-vitals', name],
        });
      }
    });

    return report;
  };
};

/**
 * Para todos os serviços de monitoramento
 *
 * Desativa a coleta de métricas e libera recursos associados.
 * Útil para cleanup em testes ou ao desmontar a aplicação.
 *
 * @example
 * ```typescript
 * // No cleanup da aplicação
 * window.addEventListener('beforeunload', () => {
 *   stopMonitoring();
 * });
 * ```
 */
export const stopMonitoring = (): void => {
  logger.info('🛑 Stopping monitoring services...');

  try {
    healthMonitor.stopMonitoring();
    performanceMonitoringService.stop();
    errorTrackingService.stop();

    logger.info('✅ Monitoring services stopped');
  } catch (error) {
    logger.error('❌ Error stopping monitoring services:', error);
  }
};

/**
 * Obtém status completo de todos os serviços de monitoramento
 *
 * Agrega relatórios de todos os serviços em um único objeto,
 * fornecendo uma visão consolidada do estado da aplicação.
 *
 * @returns Promise com relatório agregado de monitoramento
 *
 * @example
 * ```typescript
 * const status = await getMonitoringStatus();
 *
 * if (status.overall === 'critical') {
 *   console.error('Problemas críticos detectados:', status);
 *   alertAdministrators(status);
 * }
 *
 * console.log('Saúde:', status.health.overall);
 * console.log('Performance Score:', status.performance.score);
 * console.log('Erros não resolvidos:', status.errors.summary.unresolved);
 * ```
 */
export const getMonitoringStatus = async () => {
  try {
    const healthReport = await healthMonitor.runHealthCheck();
    const performanceReport = performanceMonitoringService.generateReport();
    const errorReport = errorTrackingService.generateReport();

    // Determina status geral
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (
      healthReport.overall === 'critical' ||
      performanceReport.score < 30 ||
      errorReport.summary.unresolved > 10
    ) {
      overall = 'critical';
    } else if (
      healthReport.overall === 'warning' ||
      performanceReport.score < 60 ||
      errorReport.summary.unresolved > 5
    ) {
      overall = 'warning';
    }

    return {
      health: healthReport,
      performance: performanceReport,
      errors: errorReport,
      overall,
    };
  } catch (error) {
    logger.error('Failed to get monitoring status:', error);
    const fallbackErrorReport = {
      errors: [],
      summary: {
        total: 1,
        byType: {},
        bySeverity: { critical: 1 },
        unresolved: 1,
        newInLast24h: 1,
      },
      period: { start: Date.now(), end: Date.now() },
    };

    const fallbackHealthReport = {
      overall: 'critical' as const,
      metrics: [],
      errors: ['Monitoring system failure'],
      timestamp: Date.now(),
    };

    const fallbackPerformanceReport = {
      score: 0,
      coreWebVitals: {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
      },
      metrics: [],
      recommendations: [],
      timestamp: Date.now(),
    };

    return {
      health: fallbackHealthReport,
      performance: fallbackPerformanceReport,
      errors: fallbackErrorReport,
      overall: 'critical' as const,
    };
  }
};

/**
 * Exporta dados de monitoramento para análise externa
 *
 * Serializa todos os dados coletados pelos serviços de monitoramento
 * em formato JSON para exportação, análise offline ou envio para
 * sistemas externos de análise.
 *
 * @returns String JSON com todos os dados de monitoramento
 *
 * @example
 * ```typescript
 * // Exportar dados para download
 * const data = exportMonitoringData();
 * const blob = new Blob([data], { type: 'application/json' });
 * const url = URL.createObjectURL(blob);
 *
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `monitoring-${Date.now()}.json`;
 * a.click();
 * ```
 */
export const exportMonitoringData = (): string => {
  try {
    const healthData = healthMonitor.exportHealthData();
    const errorReport = errorTrackingService.generateReport();
    const performanceReport = performanceMonitoringService.generateReport();

    const exportData = {
      timestamp: Date.now(),
      version: '1.0.0',
      environment: (import.meta as any).env?.MODE || 'unknown',
      url: window.location.href,
      userAgent: navigator.userAgent,
      data: {
        health: JSON.parse(healthData),
        errors: errorReport,
        performance: performanceReport,
      },
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error('Failed to export monitoring data:', error);
    return JSON.stringify({ error: String(error) }, null, 2);
  }
};

/**
 * Configuração global do sistema de monitoramento
 *
 * Define intervalos, thresholds e feature flags para todos os
 * serviços de monitoramento. Ajustável baseado no ambiente
 * (desenvolvimento, staging, produção).
 *
 * @example
 * ```typescript
 * // Ajustar threshold de memória
 * monitoringConfig.healthThresholds.memory.warning = 70;
 *
 * // Habilitar alertas em tempo real
 * monitoringConfig.features.realTimeAlerts = true;
 * ```
 */
export const monitoringConfig = {
  // Intervalos padrão
  healthCheckInterval: 30000, // 30 segundos
  performanceReportInterval: 30000, // 30 segundos
  errorReportInterval: 5 * 60 * 1000, // 5 minutos

  // Limiares
  healthThresholds: {
    memory: { warning: 60, critical: 80 },
    domNodes: { warning: 3000, critical: 5000 },
    errorRate: { warning: 5, critical: 10 },
  },

  performanceThresholds: {
    lcp: { good: 2500, needs_improvement: 4000 },
    fid: { good: 100, needs_improvement: 300 },
    cls: { good: 0.1, needs_improvement: 0.25 },
    score: { good: 90, needs_improvement: 60 },
  },

  errorThresholds: {
    critical: 0, // Nenhum erro crítico permitido
    high: 2, // Máximo 2 erros de alta severidade
    medium: 10, // Máximo 10 erros de severidade média
  },

  // Feature flags
  features: {
    realTimeAlerts: (import.meta as any).env?.PROD || false,
    detailedLogging: (import.meta as any).env?.DEV || false,
    performanceOptimization: true,
    errorDeduplication: true,
    healthAutoRecovery: (import.meta as any).env?.PROD || false,
  },
} as const;

/**
 * ===================================================================
 * EXPORTAÇÃO PADRÃO DO MÓDULO DE MONITORAMENTO
 * ===================================================================
 */
export default {
  initializeMonitoring,
  stopMonitoring,
  getMonitoringStatus,
  exportMonitoringData,
  config: monitoringConfig,
};
