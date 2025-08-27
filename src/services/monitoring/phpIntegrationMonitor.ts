/**
 * PHP Integration Monitor
 * Sistema de monitoramento específico para integração PHP
 * Inclui health checks, performance metrics e error tracking
 */

import { env } from '../../config/env';
import { phpApiClient } from '../api/phpApiClient';
import { requestQueueManager } from '../api/requestQueueManager';
import { phpSessionBridge } from '../auth/phpSessionBridge';

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

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  errorRate?: number;
  lastError?: string;
  lastCheck: string;
}

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

export interface EndpointMetrics {
  endpoint: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: string;
  statusCodes: Map<number, number>;
}

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
 * Monitor de integração PHP
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
    queueSize: 100
  };

  constructor() {
    this.healthStatus = this.initializeHealthStatus();
    this.performanceMetrics = this.initializePerformanceMetrics();
    
    this.startMonitoring();
    this.setupEventListeners();
  }

  /**
   * Iniciar monitoramento
   */
  start(): void {
    logger.info('🔍 Iniciando monitoramento de integração PHP...');
    
    this.startHealthChecks();
    this.startMetricsCollection();
    this.startAlertMonitoring();
  }

  /**
   * Parar monitoramento
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
   * Obter status de saúde atual
   */
  getHealthStatus(): PHPHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Obter métricas de performance
   */
  getPerformanceMetrics(): PHPPerformanceMetrics {
    return {
      ...this.performanceMetrics,
      endpoints: new Map(this.performanceMetrics.endpoints)
    };
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obter histórico de alertas
   */
  getAlertHistory(limit = 50): MonitoringAlert[] {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Executar health check manual
   */
  async runHealthCheck(): Promise<PHPHealthStatus> {
    await this.checkPHPHealth();
    return this.getHealthStatus();
  }

  /**
   * Reportar erro personalizado
   */
  reportError(error: Partial<PHPError>): void {
    const phpError: PHPError = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      level: error.level || 'error',
      message: error.message || 'Unknown error',
      file: error.file,
      line: error.line,
      trace: error.trace,
      context: error.context,
      userId: error.userId || this.getCurrentUserId(),
      sessionId: error.sessionId || this.getCurrentSessionId(),
      endpoint: error.endpoint,
      statusCode: error.statusCode
    };

    this.addError(phpError);
  }

  /**
   * Obter logs de integração
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
   * Gerar relatório de integração
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
        uptime: this.healthStatus.uptime
      },
      healthStatus: this.healthStatus,
      performanceMetrics: this.performanceMetrics,
      activeAlerts: this.getActiveAlerts(),
      topErrors,
      endpointPerformance: endpointPerformance.slice(0, 10)
    };
  }

  /**
   * Implementações privadas
   */
  private startMonitoring(): void {
    this.start();
  }

  private startHealthChecks(): void {
    // Health check inicial
    this.checkPHPHealth();

    // Health checks periódicos
    this.healthCheckInterval = window.setInterval(() => {
      this.checkPHPHealth();
    }, env.IS_PRODUCTION ? 30000 : 60000); // 30s em prod, 60s em dev
  }

  private async checkPHPHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      // Health check principal
      const healthResponse = await phpApiClient.get('/health', {
        timeout: 10000,
        retries: 1
      });

      const responseTime = Date.now() - startTime;
      this.addResponseTime(responseTime);

      if (healthResponse.success) {
        this.healthStatus.status = 'healthy';
        this.healthStatus.responseTime = responseTime;
        this.healthStatus.lastCheck = new Date().toISOString();
        
        // Atualizar informações do servidor
        if (healthResponse.data) {
          this.healthStatus.version = healthResponse.data.version;
          this.healthStatus.environment = healthResponse.data.environment;
          this.healthStatus.uptime = healthResponse.data.uptime || 0;
        }

        // Verificar serviços individuais
        await this.checkIndividualServices();
      } else {
        this.healthStatus.status = 'degraded';
        this.createAlert('health', 'medium', 'API Response Error', 'PHP API returned unsuccessful response');
      }

    } catch (error: unknown) {
      this.healthStatus.status = 'unhealthy';
      this.healthStatus.responseTime = Date.now() - startTime;
      this.healthStatus.lastCheck = new Date().toISOString();

      this.createAlert(
        'health', 
        'critical', 
        'PHP Health Check Failed', 
        `Failed to connect to PHP backend: ${error.message}`
      );

      this.reportError({
        level: 'fatal',
        message: `Health check failed: ${error.message}`,
        endpoint: '/health',
        statusCode: error.response?.status
      });
    }
  }

  private async checkIndividualServices(): Promise<void> {
    const services = ['database', 'redis', 'sessions', 'websocket', 'queue'];
    
    for (const service of services) {
      try {
        const response = await phpApiClient.get(`/health/${service}`, {
          timeout: 5000,
          retries: 1
        });

        this.healthStatus.services[service as keyof typeof this.healthStatus.services] = {
          status: response.success ? 'up' : 'degraded',
          responseTime: response.data?.responseTime,
          errorRate: response.data?.errorRate,
          lastCheck: new Date().toISOString()
        };

      } catch (error: unknown) {
        this.healthStatus.services[service as keyof typeof this.healthStatus.services] = {
          status: 'down',
          lastError: error.message,
          lastCheck: new Date().toISOString()
        };

        this.createAlert(
          'health',
          'high',
          `${service} Service Down`,
          `${service} service is not responding: ${error.message}`
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
    
    // Atualizar métricas de performance
    this.performanceMetrics.throughput.requestsPerSecond = 
      this.calculateRequestsPerSecond();
    
    this.performanceMetrics.throughput.requestsPerMinute = 
      this.calculateRequestsPerMinute();

    // Atualizar métricas de response time
    this.updateResponseTimeMetrics();

    // Atualizar métricas de erro
    this.updateErrorMetrics();

    // Coletar métricas do PHP (se disponível)
    this.collectPHPResourceMetrics();

    // Coletar métricas por endpoint
    this.collectEndpointMetrics();
  }

  private updateResponseTimeMetrics(): void {
    if (this.responseTimeBuffer.length === 0) {return;}

    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
    
    this.performanceMetrics.responseTime.current = sorted[sorted.length - 1] || 0;
    this.performanceMetrics.responseTime.average = 
      sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
    
    this.performanceMetrics.responseTime.p95 = 
      sorted[Math.floor(sorted.length * 0.95)] || 0;
    
    this.performanceMetrics.responseTime.p99 = 
      sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  private updateErrorMetrics(): void {
    const recentErrors = this.errorBuffer.filter(error => 
      Date.now() - new Date(error.timestamp).getTime() < 300000 // Últimos 5 minutos
    );

    this.performanceMetrics.errors.totalErrors = this.errorBuffer.length;
    this.performanceMetrics.errors.recentErrors = recentErrors.slice(-10);

    // Calcular error rate
    const queueMetrics = requestQueueManager.getMetrics();
    if (queueMetrics.totalRequests > 0) {
      this.performanceMetrics.errors.errorRate = 
        queueMetrics.failedRequests / queueMetrics.totalRequests;
    }

    // Agrupar erros por tipo
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
        retries: 0
      });

      if (response.success && response.data) {
        this.performanceMetrics.resources = {
          memoryUsage: response.data.memory_usage_percent || 0,
          cpuUsage: response.data.cpu_usage_percent || 0,
          diskSpace: response.data.disk_usage_percent || 0,
          activeConnections: response.data.active_connections || 0
        };
      }
    } catch (error) {
      // Ignorar erros de métricas de recursos
    }
  }

  private collectEndpointMetrics(): void {
    const queueMetrics = requestQueueManager.getMetrics();
    
    // Atualizar métricas por endpoint
    for (const [endpoint, metrics] of queueMetrics.endpointMetrics.entries()) {
      this.performanceMetrics.endpoints.set(endpoint, {
        endpoint,
        totalRequests: metrics.totalRequests,
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.errorRate,
        lastRequestTime: new Date(metrics.lastRequestTime).toISOString(),
        statusCodes: new Map() // Seria preenchido com dados reais
      });
    }
  }

  private startAlertMonitoring(): void {
    setInterval(() => {
      this.checkAlerts();
    }, 10000); // A cada 10 segundos
  }

  private checkAlerts(): void {
    // Verificar response time
    if (this.performanceMetrics.responseTime.average > this.alertThresholds.responseTime) {
      this.createAlert(
        'performance',
        'medium',
        'High Response Time',
        `Average response time (${this.performanceMetrics.responseTime.average}ms) exceeds threshold`
      );
    }

    // Verificar error rate
    if (this.performanceMetrics.errors.errorRate > this.alertThresholds.errorRate) {
      this.createAlert(
        'error',
        'high',
        'High Error Rate',
        `Error rate (${(this.performanceMetrics.errors.errorRate * 100).toFixed(2)}%) exceeds threshold`
      );
    }

    // Verificar uso de recursos
    const resources = this.performanceMetrics.resources;
    
    if (resources.memoryUsage > this.alertThresholds.memoryUsage) {
      this.createAlert(
        'performance',
        'high',
        'High Memory Usage',
        `Memory usage (${(resources.memoryUsage * 100).toFixed(1)}%) exceeds threshold`
      );
    }

    if (resources.cpuUsage > this.alertThresholds.cpuUsage) {
      this.createAlert(
        'performance',
        'medium',
        'High CPU Usage',
        `CPU usage (${(resources.cpuUsage * 100).toFixed(1)}%) exceeds threshold`
      );
    }

    // Verificar tamanho da fila
    const queueStatus = requestQueueManager.getQueueStatus();
    if (queueStatus.totalQueued > this.alertThresholds.queueSize) {
      this.createAlert(
        'performance',
        'medium',
        'Large Queue Size',
        `Request queue size (${queueStatus.totalQueued}) exceeds threshold`
      );
    }
  }

  private createAlert(
    type: MonitoringAlert['type'],
    severity: MonitoringAlert['severity'],
    title: string,
    description: string
  ): void {
    // Verificar se alerta similar já existe
    const existingAlert = this.alerts.find(alert => 
      !alert.resolved && 
      alert.title === title && 
      alert.type === type
    );

    if (existingAlert) {
      return; // Não duplicar alertas
    }

    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      description,
      timestamp: new Date().toISOString(),
      resolved: false,
      affectedServices: this.getAffectedServices(type)
    };

    this.alerts.push(alert);

    // Limitar número de alertas
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    // Log do alerta
    logger.warn(`🚨 Alert: ${title} - ${description}`);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('php-integration-alert', {
      detail: alert
    }));
  }

  private addResponseTime(responseTime: number): void {
    this.responseTimeBuffer.push(responseTime);
    
    // Manter apenas os últimos 100 response times
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
    window.dispatchEvent(new CustomEvent('php-integration-error', {
      detail: error
    }));
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
    return queueMetrics.completedRequests > 0 ? 
      queueMetrics.completedRequests / (Date.now() / 1000) : 0;
  }

  private calculateRequestsPerMinute(): number {
    return this.calculateRequestsPerSecond() * 60;
  }

  private getAffectedServices(alertType: MonitoringAlert['type']): string[] {
    switch (alertType) {
      case 'health': return ['php-api'];
      case 'performance': return ['php-api', 'database'];
      case 'error': return ['php-api'];
      case 'security': return ['php-api', 'sessions'];
      default: return [];
    }
  }

  private setupEventListeners(): void {
    // Listener para erros do PHP API Client
    window.addEventListener('php-api-error', (event: unknown) => {
      this.reportError({
        level: 'error',
        message: event.detail.message,
        endpoint: event.detail.endpoint,
        statusCode: event.detail.statusCode
      });
    });

    // Listener para mudanças de conectividade
    window.addEventListener('online', () => {
      this.checkPHPHealth();
    });

    window.addEventListener('offline', () => {
      this.createAlert(
        'health',
        'critical',
        'Network Offline',
        'Network connection lost'
      );
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
        queue: { status: 'down', lastCheck: new Date().toISOString() }
      }
    };
  }

  private initializePerformanceMetrics(): PHPPerformanceMetrics {
    return {
      responseTime: {
        current: 0,
        average: 0,
        p95: 0,
        p99: 0
      },
      throughput: {
        requestsPerSecond: 0,
        requestsPerMinute: 0
      },
      errors: {
        totalErrors: 0,
        errorRate: 0,
        errorsByType: new Map(),
        recentErrors: []
      },
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskSpace: 0,
        activeConnections: 0
      },
      endpoints: new Map()
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

// Singleton instance
export const phpIntegrationMonitor = new PHPIntegrationMonitor();

// Hook para usar no React
export const usePHPMonitoring = () => {
  const [healthStatus, setHealthStatus] = React.useState(phpIntegrationMonitor.getHealthStatus());
  const [performanceMetrics, setPerformanceMetrics] = React.useState(phpIntegrationMonitor.getPerformanceMetrics());
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