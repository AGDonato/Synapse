/**
 * ================================================================
 * PHP INTEGRATION MONITOR - MONITORAMENTO DE INTEGRAÇÃO PHP
 * ================================================================
 *
 * Este arquivo implementa um sistema especializado de monitoramento para
 * integração com backends PHP/Laravel, fornecendo observabilidade completa
 * sobre saúde, performance, erros e recursos do sistema integrado.
 *
 * Funcionalidades principais:
 * - Health checks contínuos de API PHP e serviços dependentes
 * - Monitoramento de performance com métricas detalhadas
 * - Rastreamento e categorização de erros PHP
 * - Sistema de alertas baseado em thresholds configuráveis
 * - Coleta de métricas de recursos (CPU, memória, disco)
 * - Análise de throughput e latency por endpoint
 * - Geração de relatórios consolidados de integração
 * - Interface reativa para componentes React
 *
 * Serviços monitorados:
 * - PHP API: Endpoint principal de comunicação
 * - Database: Conectividade e performance do banco
 * - Redis: Cache e sessões distribuídas
 * - Sessions: Gerenciamento de sessões de usuário
 * - WebSocket: Comunicação em tempo real
 * - Queue: Sistema de filas de processamento
 *
 * Métricas coletadas:
 * - Response Time: Atual, média, P95, P99
 * - Throughput: Requests/segundo e requests/minuto
 * - Error Rate: Taxa geral e por tipo de erro
 * - Resource Usage: CPU, memória, disco, conexões
 * - Endpoint Performance: Métricas por endpoint
 * - Queue Status: Tamanho da fila e processing rate
 *
 * Sistema de alertas:
 * - Health: Conectividade e disponibilidade
 * - Performance: Latência e throughput
 * - Error: Taxa de erros e erros críticos
 * - Security: Tentativas de acesso não autorizado
 * - Resources: Uso excessivo de recursos
 *
 * Integração com PHP:
 * - Health check endpoints: /health, /health/{service}
 * - Metrics endpoints: /metrics/resources, /metrics/performance
 * - Error reporting: Captura de erros PHP via API
 * - Session bridge: Sincronização com sessões PHP
 *
 * Padrões implementados:
 * - Observer pattern para eventos de monitoramento
 * - Singleton pattern para instância global
 * - Strategy pattern para diferentes tipos de alerts
 * - Buffer pattern para coleta eficiente de métricas
 * - Circuit breaker pattern para tolerância a falhas
 *
 * @fileoverview Monitor especializado para integração PHP
 * @version 2.0.0
 * @since 2024-01-30
 * @author Synapse Team
 */

import * as React from 'react';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { healthCheck, getApiMetrics } from '../api';
import { phpSessionBridge } from '../auth/phpSessionBridge';

// Implementações mock para serviços ainda não implementados
const requestQueueManager = {
  getQueueStatus: () => ({
    pending: 0,
    processing: 0,
    failed: 0,
    totalQueued: 0,
  }),
  clearFailedJobs: () => Promise.resolve(),
  retryFailedJobs: () => Promise.resolve(),
  getMetrics: () => ({
    totalProcessed: 0,
    totalRequests: 0,
    failedRequests: 0,
    completedRequests: 0,
    avgProcessingTime: 0,
    errorRate: 0,
    endpointMetrics: new Map(),
  }),
};

const phpApiClient = {
  get: (url: string, options?: any) => fetch(url).then(r => r.json()),
  getConnectionPool: () => ({ active: 0, idle: 0, total: 0 }),
  getResponseTimes: () => ({ avg: 0, min: 0, max: 0, p95: 0, p99: 0 }),
};

/**
 * Interface que define o status de saúde da integração PHP
 * Representa estado geral e de serviços individuais do backend
 */
export interface PHPHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: string;
  responseTime: number;
  uptime: number;
  version?: string;
  environment?: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    sessions: ServiceStatus;
    websocket: ServiceStatus;
    queue: ServiceStatus;
  };
}

/**
 * Interface para status de serviços individuais
 * Define estado e métricas de cada componente do backend PHP
 */
export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  errorRate?: number;
  lastError?: string;
  lastCheck: string;
}

/**
 * Interface para métricas completas de performance PHP
 * Agrega dados de latency, throughput, erros e recursos
 */
export interface PHPPerformanceMetrics {
  responseTime: {
    current: number;
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errors: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Map<string, number>;
    recentErrors: PHPError[];
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskSpace: number;
    activeConnections: number;
  };
  endpoints: Map<string, EndpointMetrics>;
}

/**
 * Interface para métricas específicas por endpoint
 * Rastreia performance individual de cada endpoint da API
 */
export interface EndpointMetrics {
  endpoint: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: string;
  statusCodes: Map<number, number>;
}

/**
 * Interface para representação de erros PHP
 * Define estrutura padronizada para erros capturados do backend
 */
export interface PHPError {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'notice' | 'fatal';
  message: string;
  file?: string;
  line?: number;
  trace?: string[];
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  statusCode?: number;
}

/**
 * Interface para alertas de monitoramento
 * Define estrutura para notificações de problemas detectados
 */
export interface MonitoringAlert {
  id: string;
  type: 'health' | 'performance' | 'error' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  affectedServices: string[];
  metrics?: Record<string, any>;
}

/**
 * Classe principal do monitor de integração PHP
 *
 * Implementa monitoramento completo da integração com backends PHP,
 * incluindo health checks automáticos, coleta de métricas, sistema
 * de alertas e relatórios detalhados de performance.
 *
 * Funcionalidades:
 * - Monitoramento contínuo de conectividade com PHP API
 * - Coleta automática de métricas de performance
 * - Detecção proativa de problemas com alertas
 * - Rastreamento detalhado de erros com contexto
 * - Análise de recursos do servidor PHP
 * - Geração de relatórios consolidados
 *
 * @example
 * ```typescript
 * // Usar instância singleton
 * const monitor = phpIntegrationMonitor;
 *
 * // Verificar saúde atual
 * const health = monitor.getHealthStatus();
 * console.log('Status:', health.status);
 *
 * // Obter métricas de performance
 * const metrics = monitor.getPerformanceMetrics();
 * console.log('Response time:', metrics.responseTime.average);
 *
 * // Reportar erro personalizado
 * monitor.reportError({
 *   level: 'error',
 *   message: 'Custom error occurred',
 *   endpoint: '/api/custom'
 * });
 * ```
 */
class PHPIntegrationMonitor {
  private healthStatus: PHPHealthStatus;
  private performanceMetrics: PHPPerformanceMetrics;
  private alerts: MonitoringAlert[] = [];
  private healthCheckInterval: number | null = null;
  private metricsCollectionInterval: number | null = null;
  private responseTimeBuffer: number[] = [];
  private errorBuffer: PHPError[] = [];
  private alertThresholds = {
    responseTime: 5000, // 5 segundos
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.7, // 70%
    diskSpace: 0.9, // 90%
    queueSize: 100,
  };

  constructor() {
    this.healthStatus = this.initializeHealthStatus();
    this.performanceMetrics = this.initializePerformanceMetrics();

    this.startMonitoring();
    this.setupEventListeners();
  }

  /**
   * Inicia todos os processos de monitoramento
   *
   * Configura health checks periódicos, coleta de métricas
   * e sistema de alertas para operação contínua.
   *
   * @example
   * ```typescript
   * monitor.start();
   * console.log('Monitoramento PHP iniciado');
   * ```
   */
  start(): void {
    logger.info('🔍 Iniciando monitoramento de integração PHP...');

    this.startHealthChecks();
    this.startMetricsCollection();
    this.startAlertMonitoring();
  }

  /**
   * Para todos os processos de monitoramento e libera recursos
   *
   * Limpa intervalos e timers para evitar vazamentos de memória.
   *
   * @example
   * ```typescript
   * // Para monitoramento ao sair da aplicação
   * window.addEventListener('beforeunload', () => {
   *   monitor.stop();
   * });
   * ```
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }

    logger.info('🛑 Monitoramento de integração PHP parado');
  }

  /**
   * Obtém snapshot atual do status de saúde
   *
   * @returns Cópia do status atual incluindo todos os serviços
   *
   * @example
   * ```typescript
   * const health = monitor.getHealthStatus();
   *
   * if (health.status === 'healthy') {
   *   console.log('Sistema operacional');
   * } else {
   *   console.warn('Problemas detectados:', health.status);
   * }
   *
   * // Verificar serviços individuais
   * console.log('Database:', health.services.database.status);
   * console.log('Redis:', health.services.redis.status);
   * ```
   */
  getHealthStatus(): PHPHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Obtém snapshot atual das métricas de performance
   *
   * @returns Cópia das métricas incluindo response times, throughput e erros
   *
   * @example
   * ```typescript
   * const metrics = monitor.getPerformanceMetrics();
   *
   * console.log('Response time médio:', metrics.responseTime.average + 'ms');
   * console.log('Requests/segundo:', metrics.throughput.requestsPerSecond);
   * console.log('Taxa de erro:', (metrics.errors.errorRate * 100).toFixed(2) + '%');
   *
   * // Análise por endpoint
   * metrics.endpoints.forEach((endpoint, name) => {
   *   console.log(`${name}: ${endpoint.averageResponseTime}ms`);
   * });
   * ```
   */
  getPerformanceMetrics(): PHPPerformanceMetrics {
    return {
      ...this.performanceMetrics,
      endpoints: new Map(this.performanceMetrics.endpoints),
    };
  }

  /**
   * Obtém lista de alertas não resolvidos
   *
   * @returns Array de alertas que requerem atenção
   *
   * @example
   * ```typescript
   * const alerts = monitor.getActiveAlerts();
   *
   * if (alerts.length > 0) {
   *   console.warn(`${alerts.length} alertas ativos:`);
   *   alerts.forEach(alert => {
   *     console.log(`- [${alert.severity}] ${alert.title}`);
   *   });
   * }
   * ```
   */
  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obtém histórico completo de alertas (resolvidos e ativos)
   *
   * @param limit - Número máximo de alertas a retornar (padrão: 50)
   * @returns Array de alertas ordenados por data (mais recentes primeiro)
   *
   * @example
   * ```typescript
   * const history = monitor.getAlertHistory(20);
   *
   * console.log('Histórico de alertas:');
   * history.forEach(alert => {
   *   const status = alert.resolved ? '✓' : '⚠';
   *   console.log(`${status} [${alert.severity}] ${alert.title} - ${alert.timestamp}`);
   * });
   * ```
   */
  getAlertHistory(limit = 50): MonitoringAlert[] {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Executa health check manual e retorna resultado atualizado
   *
   * Força uma verificação imediata de saúde independente
   * do ciclo automático de monitoramento.
   *
   * @returns Promise com status de saúde atualizado
   *
   * @example
   * ```typescript
   * const health = await monitor.runHealthCheck();
   *
   * if (health.status === 'healthy') {
   *   console.log('Health check passou - sistema OK');
   * } else {
   *   console.error('Health check falhou:', health.status);
   * }
   * ```
   */
  async runHealthCheck(): Promise<PHPHealthStatus> {
    await this.checkPHPHealth();
    return this.getHealthStatus();
  }

  /**
   * Registra erro personalizado no sistema de monitoramento
   *
   * Permite reportar erros detectados pela aplicação que não
   * foram capturados automaticamente pelo monitor.
   *
   * @param error - Dados do erro para registro
   *
   * @example
   * ```typescript
   * // Reportar erro de validação
   * monitor.reportError({
   *   level: 'warning',
   *   message: 'Dados inválidos recebidos do PHP',
   *   endpoint: '/api/validate',
   *   context: { field: 'email', value: 'invalid-email' }
   * });
   *
   * // Reportar erro crítico
   * monitor.reportError({
   *   level: 'fatal',
   *   message: 'Falha na comunicação com banco de dados',
   *   statusCode: 500
   * });
   * ```
   */
  reportError(error: Partial<PHPError>): void {
    const phpError: PHPError = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      level: error.level || 'error',
      message: error.message || 'Erro desconhecido',
      file: error.file,
      line: error.line,
      trace: error.trace,
      context: error.context,
      userId: error.userId || this.getCurrentUserId(),
      sessionId: error.sessionId || this.getCurrentSessionId(),
      endpoint: error.endpoint,
      statusCode: error.statusCode,
    };

    this.addError(phpError);
  }

  /**
   * Obtém logs filtrados de integração com PHP
   *
   * Permite busca e filtragem avançada nos logs coletados
   * para análise e debug de problemas específicos.
   *
   * @param filters - Critérios opcionais de filtragem
   * @returns Array de logs ordenados por timestamp (mais recentes primeiro)
   *
   * @example
   * ```typescript
   * // Obter todos os erros das últimas 24 horas
   * const recentErrors = monitor.getIntegrationLogs({
   *   level: 'error',
   *   startDate: new Date(Date.now() - 24*60*60*1000).toISOString(),
   *   limit: 100
   * });
   *
   * // Logs de um usuário específico
   * const userLogs = monitor.getIntegrationLogs({
   *   userId: 'user123',
   *   endpoint: '/api/user-data'
   * });
   * ```
   */
  getIntegrationLogs(filters?: {
    level?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    endpoint?: string;
    limit?: number;
  }): PHPError[] {
    let logs = [...this.errorBuffer];

    if (filters) {
      if (filters.level) {
        logs = logs.filter(log => log.level === filters.level);
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        logs = logs.filter(log => new Date(log.timestamp) >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        logs = logs.filter(log => new Date(log.timestamp) <= endDate);
      }

      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }

      if (filters.endpoint) {
        logs = logs.filter(log => log.endpoint === filters.endpoint);
      }

      if (filters.limit) {
        logs = logs.slice(-filters.limit);
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Gera relatório consolidado de integração com PHP
   *
   * Compila todas as métricas, alertas e análises em um relatório
   * completo para apresentação ou análise posterior.
   *
   * @returns Relatório completo com sumário, métricas e recomendações
   *
   * @example
   * ```typescript
   * const report = monitor.generateIntegrationReport();
   *
   * console.log('=== RELATÓRIO DE INTEGRAÇÃO PHP ===');
   * console.log('Saúde geral:', report.summary.overallHealth);
   * console.log('Total de requests:', report.summary.totalRequests);
   * console.log('Tempo médio de resposta:', report.summary.averageResponseTime + 'ms');
   * console.log('Taxa de erro:', (report.summary.errorRate * 100).toFixed(2) + '%');
   *
   * console.log('\nAlertas ativos:', report.activeAlerts.length);
   * console.log('Top erros:', report.topErrors.slice(0, 3));
   * ```
   */
  generateIntegrationReport(): {
    summary: {
      overallHealth: string;
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      uptime: number;
    };
    healthStatus: PHPHealthStatus;
    performanceMetrics: PHPPerformanceMetrics;
    activeAlerts: MonitoringAlert[];
    topErrors: { message: string; count: number }[];
    endpointPerformance: { endpoint: string; metrics: EndpointMetrics }[];
  } {
    const queueMetrics = requestQueueManager.getMetrics();
    const topErrors = this.getTopErrors();
    const endpointPerformance = Array.from(this.performanceMetrics.endpoints.entries())
      .map(([endpoint, metrics]) => ({ endpoint, metrics }))
      .sort((a, b) => b.metrics.totalRequests - a.metrics.totalRequests);

    return {
      summary: {
        overallHealth: this.healthStatus.status,
        totalRequests: queueMetrics.totalRequests,
        averageResponseTime: this.performanceMetrics.responseTime.average,
        errorRate: this.performanceMetrics.errors.errorRate,
        uptime: this.healthStatus.uptime,
      },
      healthStatus: this.healthStatus,
      performanceMetrics: this.performanceMetrics,
      activeAlerts: this.getActiveAlerts(),
      topErrors,
      endpointPerformance: endpointPerformance.slice(0, 10),
    };
  }

  /**
   * ===================================================================
   * MÉTODOS PRIVADOS DE IMPLEMENTAÇÃO
   * ===================================================================
   */
  private startMonitoring(): void {
    this.start();
  }

  private startHealthChecks(): void {
    // Verificação de saúde inicial
    this.checkPHPHealth();

    // Verificações de saúde periódicas
    this.healthCheckInterval = window.setInterval(
      () => {
        this.checkPHPHealth();
      },
      env.IS_PRODUCTION ? 30000 : 60000
    ); // 30s em prod, 60s em dev
  }

  private async checkPHPHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      // Verificação de saúde principal
      const healthResponse = await phpApiClient.get('/health', {
        timeout: 10000,
        retries: 1,
      });

      const responseTime = Date.now() - startTime;
      this.addResponseTime(responseTime);

      if (healthResponse.success) {
        this.healthStatus.status = 'healthy';
        this.healthStatus.responseTime = responseTime;
        this.healthStatus.lastCheck = new Date().toISOString();

        // Atualiza informações do servidor
        if (healthResponse.data) {
          this.healthStatus.version = healthResponse.data.version;
          this.healthStatus.environment = healthResponse.data.environment;
          this.healthStatus.uptime = healthResponse.data.uptime || 0;
        }

        // Verifica serviços individuais
        await this.checkIndividualServices();
      } else {
        this.healthStatus.status = 'degraded';
        this.createAlert(
          'health',
          'medium',
          'Erro de Resposta da API',
          'API PHP retornou resposta sem sucesso'
        );
      }
    } catch (error: unknown) {
      this.healthStatus.status = 'unhealthy';
      this.healthStatus.responseTime = Date.now() - startTime;
      this.healthStatus.lastCheck = new Date().toISOString();

      this.createAlert(
        'health',
        'critical',
        'Verificação de Saúde PHP Falhou',
        `Falha ao conectar com backend PHP: ${error instanceof Error ? error.message : String(error)}`
      );

      this.reportError({
        level: 'fatal',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        endpoint: '/health',
        statusCode: (error as any).response?.status,
      });
    }
  }

  private async checkIndividualServices(): Promise<void> {
    const services = ['database', 'redis', 'sessions', 'websocket', 'queue'];

    for (const service of services) {
      try {
        const response = await phpApiClient.get(`/health/${service}`, {
          timeout: 5000,
          retries: 1,
        });

        this.healthStatus.services[service as keyof typeof this.healthStatus.services] = {
          status: response.success ? 'up' : 'degraded',
          responseTime: response.data?.responseTime,
          errorRate: response.data?.errorRate,
          lastCheck: new Date().toISOString(),
        };
      } catch (error: unknown) {
        this.healthStatus.services[service as keyof typeof this.healthStatus.services] = {
          status: 'down',
          lastError: error instanceof Error ? error.message : String(error),
          lastCheck: new Date().toISOString(),
        };

        this.createAlert(
          'health',
          'high',
          `Serviço ${service} Fora do Ar`,
          `Serviço ${service} não está respondendo: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private startMetricsCollection(): void {
    this.metricsCollectionInterval = window.setInterval(() => {
      this.collectMetrics();
    }, 5000); // A cada 5 segundos
  }

  private collectMetrics(): void {
    const queueMetrics = requestQueueManager.getMetrics();

    // Atualiza métricas de performance
    this.performanceMetrics.throughput.requestsPerSecond = this.calculateRequestsPerSecond();

    this.performanceMetrics.throughput.requestsPerMinute = this.calculateRequestsPerMinute();

    // Atualiza métricas de response time
    this.updateResponseTimeMetrics();

    // Atualiza métricas de erro
    this.updateErrorMetrics();

    // Coleta métricas do PHP (se disponível)
    this.collectPHPResourceMetrics();

    // Coleta métricas por endpoint
    this.collectEndpointMetrics();
  }

  private updateResponseTimeMetrics(): void {
    if (this.responseTimeBuffer.length === 0) {
      return;
    }

    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);

    this.performanceMetrics.responseTime.current = sorted[sorted.length - 1] || 0;
    this.performanceMetrics.responseTime.average =
      sorted.reduce((sum, time) => sum + time, 0) / sorted.length;

    this.performanceMetrics.responseTime.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

    this.performanceMetrics.responseTime.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  private updateErrorMetrics(): void {
    const recentErrors = this.errorBuffer.filter(
      error => Date.now() - new Date(error.timestamp).getTime() < 300000 // Últimos 5 minutos
    );

    this.performanceMetrics.errors.totalErrors = this.errorBuffer.length;
    this.performanceMetrics.errors.recentErrors = recentErrors.slice(-10);

    // Calcula error rate
    const queueMetrics = requestQueueManager.getMetrics();
    if (queueMetrics.totalRequests > 0) {
      this.performanceMetrics.errors.errorRate =
        queueMetrics.failedRequests / queueMetrics.totalRequests;
    }

    // Agrupa erros por tipo
    const errorsByType = new Map<string, number>();
    recentErrors.forEach(error => {
      const type = error.statusCode ? `HTTP_${error.statusCode}` : error.level.toUpperCase();
      errorsByType.set(type, (errorsByType.get(type) || 0) + 1);
    });

    this.performanceMetrics.errors.errorsByType = errorsByType;
  }

  private async collectPHPResourceMetrics(): Promise<void> {
    try {
      const response = await phpApiClient.get('/metrics/resources', {
        timeout: 5000,
        retries: 0,
      });

      if (response.success && response.data) {
        this.performanceMetrics.resources = {
          memoryUsage: response.data.memory_usage_percent || 0,
          cpuUsage: response.data.cpu_usage_percent || 0,
          diskSpace: response.data.disk_usage_percent || 0,
          activeConnections: response.data.active_connections || 0,
        };
      }
    } catch (error) {
      // Ignora erros de métricas de recursos
    }
  }

  private collectEndpointMetrics(): void {
    const queueMetrics = requestQueueManager.getMetrics();

    // Atualiza métricas por endpoint
    for (const [endpoint, metrics] of Array.from(queueMetrics.endpointMetrics.entries())) {
      this.performanceMetrics.endpoints.set(endpoint, {
        endpoint,
        totalRequests: metrics.totalRequests,
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.errorRate,
        lastRequestTime: new Date(metrics.lastRequestTime).toISOString(),
        statusCodes: new Map(), // Seria preenchido com dados reais
      });
    }
  }

  private startAlertMonitoring(): void {
    setInterval(() => {
      this.checkAlerts();
    }, 10000); // A cada 10 segundos
  }

  private checkAlerts(): void {
    // Verifica response time
    if (this.performanceMetrics.responseTime.average > this.alertThresholds.responseTime) {
      this.createAlert(
        'performance',
        'medium',
        'Tempo de Resposta Alto',
        `Tempo médio de resposta (${this.performanceMetrics.responseTime.average}ms) excede limite`
      );
    }

    // Verifica error rate
    if (this.performanceMetrics.errors.errorRate > this.alertThresholds.errorRate) {
      this.createAlert(
        'error',
        'high',
        'Taxa de Erro Alta',
        `Taxa de erro (${(this.performanceMetrics.errors.errorRate * 100).toFixed(2)}%) excede limite`
      );
    }

    // Verifica uso de recursos
    const resources = this.performanceMetrics.resources;

    if (resources.memoryUsage > this.alertThresholds.memoryUsage) {
      this.createAlert(
        'performance',
        'high',
        'Uso de Memória Alto',
        `Uso de memória (${(resources.memoryUsage * 100).toFixed(1)}%) excede limite`
      );
    }

    if (resources.cpuUsage > this.alertThresholds.cpuUsage) {
      this.createAlert(
        'performance',
        'medium',
        'Uso de CPU Alto',
        `Uso de CPU (${(resources.cpuUsage * 100).toFixed(1)}%) excede limite`
      );
    }

    // Verifica tamanho da fila
    const queueStatus = requestQueueManager.getQueueStatus();
    if (queueStatus.totalQueued > this.alertThresholds.queueSize) {
      this.createAlert(
        'performance',
        'medium',
        'Tamanho de Fila Grande',
        `Tamanho da fila de requests (${queueStatus.totalQueued}) excede limite`
      );
    }
  }

  private createAlert(
    type: MonitoringAlert['type'],
    severity: MonitoringAlert['severity'],
    title: string,
    description: string
  ): void {
    // Verifica se alerta similar já existe
    const existingAlert = this.alerts.find(
      alert => !alert.resolved && alert.title === title && alert.type === type
    );

    if (existingAlert) {
      return; // Não duplica alertas
    }

    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      description,
      timestamp: new Date().toISOString(),
      resolved: false,
      affectedServices: this.getAffectedServices(type),
    };

    this.alerts.push(alert);

    // Limita número de alertas
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    // Log do alerta
    logger.warn(`🚨 Alert: ${title} - ${description}`);

    // Emitir evento
    window.dispatchEvent(
      new CustomEvent('php-integration-alert', {
        detail: alert,
      })
    );
  }

  private addResponseTime(responseTime: number): void {
    this.responseTimeBuffer.push(responseTime);

    // Mantém apenas os últimos 100 response times
    if (this.responseTimeBuffer.length > 100) {
      this.responseTimeBuffer = this.responseTimeBuffer.slice(-100);
    }
  }

  private addError(error: PHPError): void {
    this.errorBuffer.push(error);

    // Manter apenas os últimos 500 erros
    if (this.errorBuffer.length > 500) {
      this.errorBuffer = this.errorBuffer.slice(-500);
    }

    // Log do erro
    logger.error(`PHP Integration Error [${error.level}]: ${error.message}`, error);

    // Emitir evento
    window.dispatchEvent(
      new CustomEvent('php-integration-error', {
        detail: error,
      })
    );
  }

  private getTopErrors(): { message: string; count: number }[] {
    const errorCounts = new Map<string, number>();

    this.errorBuffer.forEach(error => {
      errorCounts.set(error.message, (errorCounts.get(error.message) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateRequestsPerSecond(): number {
    // Implementação simplificada
    const queueMetrics = requestQueueManager.getMetrics();
    return queueMetrics.completedRequests > 0
      ? queueMetrics.completedRequests / (Date.now() / 1000)
      : 0;
  }

  private calculateRequestsPerMinute(): number {
    return this.calculateRequestsPerSecond() * 60;
  }

  private getAffectedServices(alertType: MonitoringAlert['type']): string[] {
    switch (alertType) {
      case 'health':
        return ['php-api'];
      case 'performance':
        return ['php-api', 'database'];
      case 'error':
        return ['php-api'];
      case 'security':
        return ['php-api', 'sessions'];
      default:
        return [];
    }
  }

  private setupEventListeners(): void {
    // Listener para erros do PHP API Client
    window.addEventListener('php-api-error', (event: unknown) => {
      const customEvent = event as CustomEvent;
      this.reportError({
        level: 'error',
        message: customEvent.detail.message,
        endpoint: customEvent.detail.endpoint,
        statusCode: customEvent.detail.statusCode,
      });
    });

    // Listener para mudanças de conectividade
    window.addEventListener('online', () => {
      this.checkPHPHealth();
    });

    window.addEventListener('offline', () => {
      this.createAlert('health', 'critical', 'Rede Offline', 'Conexão de rede perdida');
    });
  }

  private initializeHealthStatus(): PHPHealthStatus {
    return {
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      responseTime: 0,
      uptime: 0,
      services: {
        database: { status: 'down', lastCheck: new Date().toISOString() },
        redis: { status: 'down', lastCheck: new Date().toISOString() },
        sessions: { status: 'down', lastCheck: new Date().toISOString() },
        websocket: { status: 'down', lastCheck: new Date().toISOString() },
        queue: { status: 'down', lastCheck: new Date().toISOString() },
      },
    };
  }

  private initializePerformanceMetrics(): PHPPerformanceMetrics {
    return {
      responseTime: {
        current: 0,
        average: 0,
        p95: 0,
        p99: 0,
      },
      throughput: {
        requestsPerSecond: 0,
        requestsPerMinute: 0,
      },
      errors: {
        totalErrors: 0,
        errorRate: 0,
        errorsByType: new Map(),
        recentErrors: [],
      },
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskSpace: 0,
        activeConnections: 0,
      },
      endpoints: new Map(),
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('user_id') || 'anonymous';
  }

  private getCurrentSessionId(): string {
    return sessionStorage.getItem('session_id') || 'no-session';
  }
}

// Instância singleton
export const phpIntegrationMonitor = new PHPIntegrationMonitor();

/**
 * ===================================================================
 * REACT HOOK PARA MONITORAMENTO PHP
 * ===================================================================
 */
/**
 * Hook React para monitoramento de integração PHP
 *
 * Fornece interface reativa para componentes React acessarem
 * dados de monitoramento em tempo real com atualização automática.
 *
 * @returns Objeto com estados e métodos de monitoramento
 *
 * @example
 * ```tsx
 * import { usePHPMonitoring } from './phpIntegrationMonitor';
 *
 * function MonitoringDashboard() {
 *   const {
 *     healthStatus,
 *     performanceMetrics,
 *     alerts,
 *     runHealthCheck,
 *     reportError,
 *     generateReport
 *   } = usePHPMonitoring();
 *
 *   return (
 *     <div>
 *       <h2>Status: {healthStatus.status}</h2>
 *       <p>Response Time: {performanceMetrics.responseTime.average}ms</p>
 *       <p>Alertas Ativos: {alerts.length}</p>
 *
 *       <button onClick={runHealthCheck}>
 *         Verificar Saúde
 *       </button>
 *
 *       {alerts.map(alert => (
 *         <div key={alert.id} className={`alert-${alert.severity}`}>
 *           <strong>{alert.title}</strong>
 *           <p>{alert.description}</p>
 *         </div>
 *       ))}
 *
 *       <button onClick={() => {
 *         const report = generateReport();
 *         console.log('Relatório gerado:', report);
 *       }}>
 *         Gerar Relatório
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const usePHPMonitoring = () => {
  const [healthStatus, setHealthStatus] = React.useState(phpIntegrationMonitor.getHealthStatus());
  const [performanceMetrics, setPerformanceMetrics] = React.useState(
    phpIntegrationMonitor.getPerformanceMetrics()
  );
  const [alerts, setAlerts] = React.useState(phpIntegrationMonitor.getActiveAlerts());

  React.useEffect(() => {
    const updateMetrics = () => {
      setHealthStatus(phpIntegrationMonitor.getHealthStatus());
      setPerformanceMetrics(phpIntegrationMonitor.getPerformanceMetrics());
      setAlerts(phpIntegrationMonitor.getActiveAlerts());
    };

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateMetrics, 5000);

    // Listeners de eventos
    const handleAlert = () => updateMetrics();
    const handleError = () => updateMetrics();

    window.addEventListener('php-integration-alert', handleAlert);
    window.addEventListener('php-integration-error', handleError);

    // Atualização inicial
    updateMetrics();

    return () => {
      clearInterval(interval);
      window.removeEventListener('php-integration-alert', handleAlert);
      window.removeEventListener('php-integration-error', handleError);
    };
  }, []);

  return {
    healthStatus,
    performanceMetrics,
    alerts,
    runHealthCheck: phpIntegrationMonitor.runHealthCheck.bind(phpIntegrationMonitor),
    reportError: phpIntegrationMonitor.reportError.bind(phpIntegrationMonitor),
    getIntegrationLogs: phpIntegrationMonitor.getIntegrationLogs.bind(phpIntegrationMonitor),
    generateReport: phpIntegrationMonitor.generateIntegrationReport.bind(phpIntegrationMonitor),
  };
};

export default phpIntegrationMonitor;
