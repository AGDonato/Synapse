/**
 * PHP API Client
 * Cliente especializado para integração com backend PHP
 * Inclui conversão automática snake_case ↔ camelCase, retry logic e error mapping
 */

import { env } from '../../config/env';
import type { ApiError, ApiResponse } from '../../types/api';

export interface PHPRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipCaseConversion?: boolean;
}

export interface PHPResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    last_page?: number;
  };
}

interface RequestQueueItem {
  id: string;
  config: PHPRequestConfig;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  attempts: number;
  timestamp: number;
}

/**
 * Converte objeto camelCase para snake_case
 */
function toSnakeCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const converted: unknown = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = toSnakeCase(value);
  }
  return converted;
}

/**
 * Converte objeto snake_case para camelCase
 */
function toCamelCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const converted: unknown = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = toCamelCase(value);
  }
  return converted;
}

/**
 * Mapear erros PHP para erros React
 */
function mapPHPError(error: unknown): ApiError {
  if (error?.response?.data) {
    const phpError = error.response.data;
    return {
      message: phpError.message || phpError.error || 'Erro no servidor PHP',
      code: phpError.code || phpError.error_code || error.response.status,
      details: phpError
    };
  }

  if (error?.code === 'NETWORK_ERROR') {
    return {
      message: 'Erro de conexão com o servidor',
      code: 'NETWORK_ERROR',
      details: error
    };
  }

  if (error?.code === 'TIMEOUT') {
    return {
      message: 'Timeout na requisição',
      code: 'TIMEOUT',
      details: error
    };
  }

  return {
    message: error?.message || 'Erro desconhecido',
    code: 'UNKNOWN_ERROR',
    details: error
  };
}

/**
 * Cliente API PHP com recursos avançados
 */
class PHPApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private requestQueue: RequestQueueItem[] = [];
  private processingQueue = false;
  private maxConcurrentRequests = 4; // Otimizado para 4 usuários
  private activeRequests = 0;
  private rateLimitDelay = 100; // ms entre requests

  // Cache para requests duplicadas
  private requestCache = new Map<string, Promise<unknown>>();

  // Métricas
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    retryCount: 0
  };

  constructor() {
    this.baseURL = env.API_BASE_URL;
    this.defaultTimeout = env.API_TIMEOUT;
    this.defaultRetries = env.API_RETRY_ATTEMPTS;

    // Cleanup cache periodicamente
    setInterval(() => {
      this.requestCache.clear();
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Fazer requisição para API PHP
   */
  async request<T = unknown>(config: PHPRequestConfig): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId(config);
    
    // Verificar se request já está em cache (deduplication)
    if (config.method === 'GET') {
      const cached = this.requestCache.get(requestId);
      if (cached) {
        return cached;
      }
    }

    // Criar promise para request
    const promise = new Promise<ApiResponse<T>>((resolve, reject) => {
      const queueItem: RequestQueueItem = {
        id: requestId,
        config,
        resolve,
        reject,
        attempts: 0,
        timestamp: Date.now()
      };

      this.requestQueue.push(queueItem);
      this.processQueue();
    });

    // Cache apenas GETs
    if (config.method === 'GET') {
      this.requestCache.set(requestId, promise);
    }

    return promise;
  }

  /**
   * Processar fila de requests
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const item = this.requestQueue.shift();
      if (item) {
        this.executeRequest(item);
        await this.delay(this.rateLimitDelay);
      }
    }

    this.processingQueue = false;
  }

  /**
   * Executar request individual
   */
  private async executeRequest(item: RequestQueueItem): Promise<void> {
    this.activeRequests++;
    const startTime = Date.now();
    
    try {
      const result = await this.performRequest(item.config);
      
      // Atualizar métricas
      this.updateMetrics(Date.now() - startTime, true);
      
      item.resolve(result);
    } catch (error) {
      item.attempts++;
      const maxRetries = item.config.retries || this.defaultRetries;
      
      if (item.attempts < maxRetries) {
        // Retry com backoff exponencial
        const delay = Math.min(1000 * Math.pow(2, item.attempts - 1), 30000);
        setTimeout(() => {
          this.requestQueue.unshift(item); // Volta para início da fila
          this.processQueue();
        }, delay);
        
        this.metrics.retryCount++;
      } else {
        // Esgotaram as tentativas
        this.updateMetrics(Date.now() - startTime, false);
        item.reject(mapPHPError(error));
      }
    } finally {
      this.activeRequests--;
      this.processQueue(); // Continua processando a fila
    }
  }

  /**
   * Perform actual HTTP request
   */
  private async performRequest(config: PHPRequestConfig): Promise<unknown> {
    const url = new URL(config.url, this.baseURL);
    
    // Adicionar parâmetros query
    if (config.params) {
      const params = config.skipCaseConversion ? config.params : toSnakeCase(config.params);
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, String(params[key]));
      });
    }

    // Configurar headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...config.headers
    };

    // Adicionar token de autenticação se disponível
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Configurar body
    let body: string | undefined;
    if (config.data && !['GET', 'HEAD'].includes(config.method || 'GET')) {
      body = JSON.stringify(
        config.skipCaseConversion ? config.data : toSnakeCase(config.data)
      );
    }

    // Fazer request com timeout
    const controller = new AbortController();
    const timeout = config.timeout || this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        method: config.method || 'GET',
        headers,
        body,
        signal: controller.signal,
        credentials: 'include' // Para cookies de sessão PHP
      });

      clearTimeout(timeoutId);

      // Verificar se response é ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const responseData = await response.json();
      
      // Converter snake_case para camelCase se necessário
      const convertedData = config.skipCaseConversion ? responseData : toCamelCase(responseData);

      return {
        success: true,
        data: convertedData.data || convertedData,
        message: convertedData.message
      };

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw { code: 'TIMEOUT', message: 'Request timeout' };
      }
      
      throw error;
    }
  }

  /**
   * Métodos de conveniência para HTTP verbs
   */
  async get<T = unknown>(url: string, config?: Omit<PHPRequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request({ ...config, url, method: 'GET' });
  }

  async post<T = unknown>(url: string, data?: unknown, config?: Omit<PHPRequestConfig, 'url' | 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request({ ...config, url, method: 'POST', data });
  }

  async put<T = unknown>(url: string, data?: unknown, config?: Omit<PHPRequestConfig, 'url' | 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request({ ...config, url, method: 'PUT', data });
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: Omit<PHPRequestConfig, 'url' | 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request({ ...config, url, method: 'PATCH', data });
  }

  async delete<T = unknown>(url: string, config?: Omit<PHPRequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request({ ...config, url, method: 'DELETE' });
  }

  /**
   * Operações em batch
   */
  async batch<T = unknown>(requests: PHPRequestConfig[]): Promise<ApiResponse<T>[]> {
    // Executar todas as requests em paralelo mas respeitando o limite
    const promises = requests.map(config => this.request<T>(config));
    return Promise.all(promises);
  }

  /**
   * Utilities
   */
  private generateRequestId(config: PHPRequestConfig): string {
    const key = `${config.method || 'GET'}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`;
    return btoa(key).slice(0, 20);
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateMetrics(responseTime: number, success: boolean): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Calcular média móvel do tempo de resposta
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / this.metrics.totalRequests;
  }

  /**
   * Obter métricas da API
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Limpar cache e fila
   */
  clear(): void {
    this.requestCache.clear();
    this.requestQueue.length = 0;
  }

  /**
   * Health check do servidor PHP
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { timeout: 5000, retries: 1 });
      return response.success;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const phpApiClient = new PHPApiClient();

// Export tipos
export type { PHPRequestConfig, PHPResponse };
export { toSnakeCase, toCamelCase, mapPHPError };
export default phpApiClient;