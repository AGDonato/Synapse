/**
 * Advanced Request Queue Manager
 * Gerenciamento avançado de filas de requisições para backend PHP
 * Otimizado para 4 usuários simultâneos
 */

import { env } from '../../config/env';
import { type PHPRequestConfig, phpApiClient } from './phpApiClient';

export interface QueuedRequest {
  id: string;
  config: PHPRequestConfig;
  priority: 'low' | 'normal' | 'high' | 'critical';
  userId: string;
  sessionId: string;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  retryDelay: number;
  timeout: number;
  dependencies?: string[];
  tags?: string[];
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

export interface QueueConfiguration {
  maxConcurrentRequests: number;
  maxQueueSize: number;
  defaultTimeout: number;
  rateLimitPerUser: number; // requests por minuto por usuário
  rateLimitPerEndpoint: number; // requests por minuto por endpoint
  batchingEnabled: boolean;
  batchingDelay: number;
  retryPolicy: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    exponentialBackoff: boolean;
  };
}

export interface QueueMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  queueLength: number;
  activeRequests: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  userMetrics: Map<string, {
    totalRequests: number;
    pendingRequests: number;
    successRate: number;
    averageResponseTime: number;
  }>;
  endpointMetrics: Map<string, {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    lastRequestTime: number;
  }>;
}

export interface BatchRequest {
  id: string;
  requests: QueuedRequest[];
  endpoint: string;
  batchSize: number;
  createdAt: number;
}

/**
 * Gerenciador avançado de filas de requisições
 */
class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private activeRequests = new Map<string, QueuedRequest>();
  private batchRequests = new Map<string, BatchRequest>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private endpointLimits = new Map<string, { count: number; resetTime: number }>();
  private processTimer: number | null = null;
  private batchTimer: number | null = null;
  private isProcessing = false;

  private config: QueueConfiguration = {
    maxConcurrentRequests: env.IS_PRODUCTION ? 8 : 4, // 2 requests por usuário em produção
    maxQueueSize: 1000,
    defaultTimeout: 30000,
    rateLimitPerUser: env.IS_PRODUCTION ? 120 : 60, // requests por minuto
    rateLimitPerEndpoint: env.IS_PRODUCTION ? 300 : 150,
    batchingEnabled: true,
    batchingDelay: 50, // 50ms para agrupar requests
    retryPolicy: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBackoff: true
    }
  };

  private metrics: QueueMetrics = {
    totalRequests: 0,
    completedRequests: 0,
    failedRequests: 0,
    queueLength: 0,
    activeRequests: 0,
    averageWaitTime: 0,
    averageProcessingTime: 0,
    userMetrics: new Map(),
    endpointMetrics: new Map()
  };

  // Endpoints que suportam batching
  private batchableEndpoints = new Set([
    '/demandas',
    '/documentos',
    '/assuntos',
    '/orgaos',
    '/autoridades',
    '/provedores'
  ]);

  constructor(config?: Partial<QueueConfiguration>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.startProcessing();
    this.setupCleanupTimer();
    this.setupEventListeners();
  }

  /**
   * Adicionar request à fila
   */
  async enqueue<T = unknown>(
    config: PHPRequestConfig,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      userId?: string;
      dependencies?: string[];
      tags?: string[];
      skipBatching?: boolean;
    } = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const userId = options.userId || this.getCurrentUserId();
      
      // Verificar limites de fila
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Queue is full'));
        return;
      }

      // Verificar rate limit do usuário
      if (!this.checkUserRateLimit(userId)) {
        reject(new Error('User rate limit exceeded'));
        return;
      }

      // Verificar rate limit do endpoint
      const endpoint = this.extractEndpoint(config.url);
      if (!this.checkEndpointRateLimit(endpoint)) {
        reject(new Error(`Endpoint ${endpoint} rate limit exceeded`));
        return;
      }

      // Criar request na fila
      const queuedRequest: QueuedRequest = {
        id: requestId,
        config,
        priority: options.priority || 'normal',
        userId,
        sessionId: this.getCurrentSessionId(),
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: this.config.retryPolicy.maxAttempts,
        retryDelay: this.config.retryPolicy.baseDelay,
        timeout: config.timeout || this.config.defaultTimeout,
        dependencies: options.dependencies,
        tags: options.tags,
        resolve,
        reject
      };

      // Verificar se pode ser agrupado em batch
      if (
        this.config.batchingEnabled && 
        !options.skipBatching &&
        this.canBeBatched(config) &&
        config.method === 'GET'
      ) {
        this.addToBatch(queuedRequest);
      } else {
        this.addToQueue(queuedRequest);
      }

      // Atualizar métricas
      this.updateMetrics('request_queued', queuedRequest);
      
      // Processar fila imediatamente se for crítico
      if (options.priority === 'critical') {
        this.processQueue();
      }
    });
  }

  /**
   * Cancelar request da fila
   */
  cancel(requestId: string): boolean {
    // Remover da fila principal
    const queueIndex = this.queue.findIndex(req => req.id === requestId);
    if (queueIndex !== -1) {
      const request = this.queue.splice(queueIndex, 1)[0];
      request.reject(new Error('Request cancelled'));
      return true;
    }

    // Remover de requests ativos
    if (this.activeRequests.has(requestId)) {
      const request = this.activeRequests.get(requestId)!;
      request.reject(new Error('Request cancelled'));
      this.activeRequests.delete(requestId);
      return true;
    }

    return false;
  }

  /**
   * Cancelar todos os requests de um usuário
   */
  cancelUserRequests(userId: string): number {
    let cancelled = 0;

    // Cancelar da fila
    this.queue = this.queue.filter(request => {
      if (request.userId === userId) {
        request.reject(new Error('User requests cancelled'));
        cancelled++;
        return false;
      }
      return true;
    });

    // Cancelar requests ativos
    for (const [id, request] of this.activeRequests.entries()) {
      if (request.userId === userId) {
        request.reject(new Error('User requests cancelled'));
        this.activeRequests.delete(id);
        cancelled++;
      }
    }

    return cancelled;
  }

  /**
   * Pausar/despausar processamento
   */
  pause(): void {
    this.isProcessing = false;
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
  }

  resume(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.startProcessing();
    }
  }

  /**
   * Obter métricas da fila
   */
  getMetrics(): QueueMetrics {
    this.metrics.queueLength = this.queue.length;
    this.metrics.activeRequests = this.activeRequests.size;
    return { ...this.metrics };
  }

  /**
   * Obter status da fila
   */
  getQueueStatus() {
    const queueByPriority = this.queue.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const queueByUser = this.queue.reduce((acc, req) => {
      acc[req.userId] = (acc[req.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQueued: this.queue.length,
      totalActive: this.activeRequests.size,
      queueByPriority,
      queueByUser,
      batchRequests: this.batchRequests.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Limpar fila (emergency only)
   */
  clear(): void {
    // Rejeitar todos os requests na fila
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];

    // Rejeitar requests ativos
    this.activeRequests.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.activeRequests.clear();

    // Limpar batches
    this.batchRequests.clear();
  }

  /**
   * Implementações privadas
   */
  private startProcessing(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
    }

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (!this.isProcessing || this.activeRequests.size >= this.config.maxConcurrentRequests) {
      this.scheduleNextProcessing();
      return;
    }

    // Processar batches primeiro
    await this.processBatches();

    // Processar requests individuais por prioridade
    const request = this.getNextRequest();
    if (request) {
      this.processRequest(request);
    }

    this.scheduleNextProcessing();
  }

  private scheduleNextProcessing(): void {
    if (this.processTimer) {
      clearTimeout(this.processTimer);
    }

    if (this.queue.length > 0 || this.batchRequests.size > 0) {
      this.processTimer = window.setTimeout(() => {
        this.processQueue();
      }, 10); // Verificar a cada 10ms
    }
  }

  private getNextRequest(): QueuedRequest | null {
    if (this.queue.length === 0) {return null;}

    // Ordenar por prioridade e dependências
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    
    // Filtrar requests que podem ser processados (sem dependências pendentes)
    const availableRequests = this.queue.filter(request => {
      if (!request.dependencies || request.dependencies.length === 0) {
        return true;
      }

      // Verificar se todas as dependências foram resolvidas
      return request.dependencies.every(depId => 
        !this.activeRequests.has(depId) && 
        !this.queue.find(r => r.id === depId)
      );
    });

    if (availableRequests.length === 0) {return null;}

    // Ordenar por prioridade e tempo
    availableRequests.sort((a, b) => {
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt - b.createdAt;
    });

    const selectedRequest = availableRequests[0];
    
    // Remover da fila
    const index = this.queue.findIndex(r => r.id === selectedRequest.id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    return selectedRequest;
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    this.activeRequests.set(request.id, request);
    const startTime = Date.now();

    try {
      // Executar request
      const result = await phpApiClient.request(request.config);
      
      // Sucesso
      const processingTime = Date.now() - startTime;
      const waitTime = startTime - request.createdAt;
      
      this.updateMetrics('request_completed', request, { processingTime, waitTime });
      request.resolve(result);

    } catch (error) {
      request.attempts++;
      
      // Verificar se deve fazer retry
      if (request.attempts < request.maxAttempts && this.shouldRetry(error)) {
        await this.scheduleRetry(request);
      } else {
        // Falha definitiva
        const processingTime = Date.now() - startTime;
        const waitTime = startTime - request.createdAt;
        
        this.updateMetrics('request_failed', request, { processingTime, waitTime });
        request.reject(error);
      }
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  private async scheduleRetry(request: QueuedRequest): Promise<void> {
    const delay = this.config.retryPolicy.exponentialBackoff
      ? Math.min(
          request.retryDelay * Math.pow(2, request.attempts - 1),
          this.config.retryPolicy.maxDelay
        )
      : request.retryDelay;

    setTimeout(() => {
      // Adicionar de volta na fila com prioridade maior
      request.priority = request.priority === 'critical' ? 'critical' : 
                        request.priority === 'high' ? 'high' : 'normal';
      this.addToQueue(request);
    }, delay);
  }

  private shouldRetry(error: unknown): boolean {
    // Não fazer retry para erros 4xx (exceto 408, 429)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return error.response.status === 408 || error.response.status === 429;
    }

    // Fazer retry para erros de rede e 5xx
    return true;
  }

  private addToQueue(request: QueuedRequest): void {
    this.queue.push(request);
    
    // Manter fila ordenada por prioridade
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    this.queue.sort((a, b) => {
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt - b.createdAt;
    });
  }

  private canBeBatched(config: PHPRequestConfig): boolean {
    const endpoint = this.extractEndpoint(config.url);
    return this.batchableEndpoints.has(endpoint) && config.method === 'GET';
  }

  private addToBatch(request: QueuedRequest): void {
    const endpoint = this.extractEndpoint(request.config.url);
    const batchId = `${endpoint}-${request.userId}`;
    
    let batch = this.batchRequests.get(batchId);
    if (!batch) {
      batch = {
        id: batchId,
        requests: [],
        endpoint,
        batchSize: 0,
        createdAt: Date.now()
      };
      this.batchRequests.set(batchId, batch);
    }

    batch.requests.push(request);
    batch.batchSize++;

    // Processar batch se atingiu tamanho máximo ou timeout
    if (batch.batchSize >= 10 || Date.now() - batch.createdAt > this.config.batchingDelay) {
      this.processBatch(batch);
      this.batchRequests.delete(batchId);
    } else {
      // Agendar processamento do batch
      this.scheduleBatchProcessing(batchId);
    }
  }

  private scheduleBatchProcessing(batchId: string): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = window.setTimeout(() => {
      const batch = this.batchRequests.get(batchId);
      if (batch) {
        this.processBatch(batch);
        this.batchRequests.delete(batchId);
      }
    }, this.config.batchingDelay);
  }

  private async processBatches(): Promise<void> {
    const batchesToProcess = Array.from(this.batchRequests.values())
      .filter(batch => Date.now() - batch.createdAt > this.config.batchingDelay);

    for (const batch of batchesToProcess) {
      this.processBatch(batch);
      this.batchRequests.delete(batch.id);
    }
  }

  private async processBatch(batch: BatchRequest): Promise<void> {
    try {
      // Construir batch request
      const batchConfig: PHPRequestConfig = {
        url: `${batch.endpoint}/batch`,
        method: 'POST',
        data: {
          requests: batch.requests.map(req => ({
            id: req.id,
            url: req.config.url,
            params: req.config.params
          }))
        }
      };

      const result = await phpApiClient.request(batchConfig);
      
      // Distribuir respostas
      if (result.success && result.data?.responses) {
        result.data.responses.forEach((response: unknown, index: number) => {
          const request = batch.requests[index];
          if (response.success) {
            request.resolve(response);
            this.updateMetrics('request_completed', request);
          } else {
            request.reject(new Error(response.error || 'Batch request failed'));
            this.updateMetrics('request_failed', request);
          }
        });
      } else {
        // Falha no batch todo - processar individualmente
        batch.requests.forEach(request => {
          this.addToQueue(request);
        });
      }

    } catch (error) {
      // Falha no batch - processar individualmente
      batch.requests.forEach(request => {
        this.addToQueue(request);
      });
    }
  }

  private checkUserRateLimit(userId: string): boolean {
    const now = Date.now();
    const key = `user:${userId}`;
    const limit = this.rateLimiters.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }

    if (limit.count >= this.config.rateLimitPerUser) {
      return false;
    }

    limit.count++;
    return true;
  }

  private checkEndpointRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const limit = this.endpointLimits.get(endpoint);

    if (!limit || now > limit.resetTime) {
      this.endpointLimits.set(endpoint, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }

    if (limit.count >= this.config.rateLimitPerEndpoint) {
      return false;
    }

    limit.count++;
    return true;
  }

  private updateMetrics(
    eventType: 'request_queued' | 'request_completed' | 'request_failed',
    request: QueuedRequest,
    timing?: { processingTime: number; waitTime: number }
  ): void {
    this.metrics.totalRequests++;

    if (eventType === 'request_completed') {
      this.metrics.completedRequests++;
      if (timing) {
        // Atualizar média móvel
        this.metrics.averageWaitTime = 
          (this.metrics.averageWaitTime * (this.metrics.completedRequests - 1) + timing.waitTime) / 
          this.metrics.completedRequests;
        
        this.metrics.averageProcessingTime = 
          (this.metrics.averageProcessingTime * (this.metrics.completedRequests - 1) + timing.processingTime) / 
          this.metrics.completedRequests;
      }
    } else if (eventType === 'request_failed') {
      this.metrics.failedRequests++;
    }

    // Atualizar métricas por usuário
    const userMetrics = this.metrics.userMetrics.get(request.userId) || {
      totalRequests: 0,
      pendingRequests: 0,
      successRate: 0,
      averageResponseTime: 0
    };

    userMetrics.totalRequests++;
    if (eventType === 'request_completed') {
      userMetrics.successRate = userMetrics.successRate * 0.9 + 0.1; // Média móvel
    } else if (eventType === 'request_failed') {
      userMetrics.successRate = userMetrics.successRate * 0.9; // Média móvel
    }

    this.metrics.userMetrics.set(request.userId, userMetrics);

    // Atualizar métricas por endpoint
    const endpoint = this.extractEndpoint(request.config.url);
    const endpointMetrics = this.metrics.endpointMetrics.get(endpoint) || {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastRequestTime: 0
    };

    endpointMetrics.totalRequests++;
    endpointMetrics.lastRequestTime = Date.now();
    
    if (eventType === 'request_failed') {
      endpointMetrics.errorRate = endpointMetrics.errorRate * 0.9 + 0.1;
    } else if (eventType === 'request_completed') {
      endpointMetrics.errorRate = endpointMetrics.errorRate * 0.9;
      if (timing) {
        endpointMetrics.averageResponseTime = 
          (endpointMetrics.averageResponseTime * (endpointMetrics.totalRequests - 1) + timing.processingTime) / 
          endpointMetrics.totalRequests;
      }
    }

    this.metrics.endpointMetrics.set(endpoint, endpointMetrics);
  }

  private setupCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Limpar rate limiters expirados
      for (const [key, limit] of this.rateLimiters.entries()) {
        if (now > limit.resetTime) {
          this.rateLimiters.delete(key);
        }
      }

      for (const [key, limit] of this.endpointLimits.entries()) {
        if (now > limit.resetTime) {
          this.endpointLimits.delete(key);
        }
      }

      // Limpar batches antigos
      for (const [batchId, batch] of this.batchRequests.entries()) {
        if (now - batch.createdAt > 30000) { // 30 segundos
          batch.requests.forEach(req => {
            req.reject(new Error('Batch timeout'));
          });
          this.batchRequests.delete(batchId);
        }
      }
    }, 30000); // A cada 30 segundos
  }

  private setupEventListeners(): void {
    window.addEventListener('beforeunload', () => {
      this.pause();
      this.clear();
    });

    window.addEventListener('online', () => {
      this.resume();
    });

    window.addEventListener('offline', () => {
      this.pause();
    });
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, 'http://localhost');
      const path = urlObj.pathname;
      
      // Extrair endpoint base (ex: /api/demandas/123 -> /demandas)
      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 2) {
        return `/${segments[1]}`;
      }
      
      return path;
    } catch {
      return url;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('user_id') || 'anonymous';
  }

  private getCurrentSessionId(): string {
    return sessionStorage.getItem('session_id') || 'no-session';
  }
}

// Singleton instance
export const requestQueueManager = new RequestQueueManager();

// Hook para usar no React
export const useRequestQueue = () => {
  const [metrics, setMetrics] = React.useState(requestQueueManager.getMetrics());
  const [status, setStatus] = React.useState(requestQueueManager.getQueueStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(requestQueueManager.getMetrics());
      setStatus(requestQueueManager.getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    status,
    enqueue: requestQueueManager.enqueue.bind(requestQueueManager),
    cancel: requestQueueManager.cancel.bind(requestQueueManager),
    cancelUserRequests: requestQueueManager.cancelUserRequests.bind(requestQueueManager),
    pause: requestQueueManager.pause.bind(requestQueueManager),
    resume: requestQueueManager.resume.bind(requestQueueManager),
    clear: requestQueueManager.clear.bind(requestQueueManager),
  };
};

export default requestQueueManager;