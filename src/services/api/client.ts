/**
 * ================================================================
 * CLIENT HTTP - PARA DESENVOLVEDOR BACKEND LEIA ISTO!
 * ================================================================
 *
 * Cliente HTTP principal para integração com backend PHP.
 * Inclui retry logic, cache, métricas e conversão automática camelCase ↔ snake_case.
 *
 * CARACTERÍSTICAS IMPORTANTES:
 * - Retry automático em falhas de rede
 * - Cache de requisições GET para performance
 * - Conversão automática de dados (camelCase ↔ snake_case)
 * - Headers de autenticação automáticos
 * - Upload de arquivos otimizado
 * - Métricas de performance
 */

// src/services/api/client.ts
import ky from 'ky';
import { phpRequestInterceptor, phpResponseInterceptor } from './php-adapter';

// Configuração base do cliente HTTP para PHP backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000; // 30 segundos

// Cache para requests duplicadas (otimização de performance)
const requestCache = new Map<string, Promise<unknown>>();

// Métricas de performance
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  retryCount: 0,
};

// Limpar cache periodicamente
setInterval(
  () => {
    requestCache.clear();
  },
  5 * 60 * 1000
); // 5 minutos

// Função para gerar ID único de requisição (para cache)
const generateRequestId = (url: string, options: Record<string, any> = {}): string => {
  const key = `${options.method || 'GET'}-${url}-${JSON.stringify(options.searchParams || {})}-${JSON.stringify(options.json || {})}`;
  return btoa(key).slice(0, 20);
};

// Função para atualizar métricas
const updateMetrics = (responseTime: number, success: boolean): void => {
  metrics.totalRequests++;

  if (success) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }

  // Calcular média móvel do tempo de resposta
  metrics.averageResponseTime =
    (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) /
    metrics.totalRequests;
};

// Cliente HTTP principal configurado para PHP
export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
  retry: {
    limit: 3, // Aumentado de 2 para 3 tentativas
    methods: ['get', 'post', 'put', 'delete'], // Repetir em todos os métodos HTTP
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    delay: attemptCount => Math.min(1000 * Math.pow(2, attemptCount - 1), 30000), // Atraso exponencial
  },
  hooks: {
    beforeRequest: [
      ...phpRequestInterceptor.beforeRequest,
      request => {
        // Interceptor para métricas - marca início da requisição
        (request as any)._startTime = Date.now();
        return request;
      },
    ],
    afterResponse: [
      ...phpResponseInterceptor.afterResponse,
      (request, options, response) => {
        // Interceptor para métricas - calcula tempo de resposta
        const startTime = (request as any)._startTime;
        if (startTime) {
          const responseTime = Date.now() - startTime;
          updateMetrics(responseTime, true);
        }
        return response;
      },
    ],
    beforeError: [
      ...phpResponseInterceptor.onError,
      error => {
        // Interceptor para métricas - registra erro
        const request = (error as any).request;
        const startTime = request?._startTime;
        if (startTime) {
          const responseTime = Date.now() - startTime;
          updateMetrics(responseTime, false);
        }
        throw error;
      },
    ],
  },
});

// Cliente para upload de arquivos (sem JSON conversion)
export const fileUploadClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 60000, // 1 minuto para uploads
  retry: {
    limit: 1,
    methods: [],
  },
  hooks: {
    beforeRequest: [
      request => {
        // Adiciona CSRF token
        const csrfToken = document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute('content');
        if (csrfToken) {
          request.headers.set('X-CSRF-TOKEN', csrfToken);
        }

        // Remove Content-Type para FormData
        if (request.body instanceof FormData) {
          request.headers.delete('Content-Type');
        }

        return request;
      },
    ],
    afterResponse: phpResponseInterceptor.afterResponse,
    beforeError: phpResponseInterceptor.onError,
  },
});

// Utilitários de autenticação
export const authUtils = {
  // Define token JWT no localStorage
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  // Remove token do localStorage
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },

  // Verifica se existe token válido e não expirado
  hasValidToken: (): boolean => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Converte para milissegundos
      return Date.now() < exp;
    } catch {
      return false;
    }
  },

  // Inicializa autenticação (chamado na inicialização do app)
  initialize: () => {
    const token = localStorage.getItem('auth_token');
    if (token && authUtils.hasValidToken()) {
      authUtils.setToken(token);
    } else {
      authUtils.removeToken();
    }
  },
};

// Lógica de renovação de token será tratada separadamente no auth service

// Função para obter métricas de performance
export const getApiMetrics = () => ({ ...metrics });

// Função para limpar cache manualmente
export const clearApiCache = () => {
  requestCache.clear();
};

// Função para verificar saúde da API
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('health', { timeout: 5000, retry: { limit: 1 } });
    return response.ok;
  } catch {
    return false;
  }
};

// Wrapper de API de alto nível com validação e cache
export const api = {
  get: async <T>(
    url: string,
    schema: { parse: (data: unknown) => T },
    options?: Record<string, unknown>
  ): Promise<{ data: T }> => {
    // Verifica cache para requisições GET
    const requestId = generateRequestId(url, options);
    const cached = requestCache.get(requestId);

    if (cached) {
      const cachedData = await cached;
      return cachedData as { data: T };
    }

    // Executa requisição e armazena no cache
    const promise = (async () => {
      const response = await apiClient.get(url, options);
      const data = await response.json();
      const validated = schema.parse(data);
      return { data: validated };
    })();

    requestCache.set(requestId, promise);
    return promise;
  },

  post: async <T>(
    url: string,
    body: unknown,
    schema: { parse: (data: unknown) => T },
    options?: Record<string, unknown>
  ): Promise<{ data: T }> => {
    const response = await apiClient.post(url, { json: body, ...options });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  put: async <T>(
    url: string,
    body: unknown,
    schema: { parse: (data: unknown) => T },
    options?: Record<string, unknown>
  ): Promise<{ data: T }> => {
    const response = await apiClient.put(url, { json: body, ...options });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  delete: async (url: string, options?: Record<string, unknown>): Promise<void> => {
    await apiClient.delete(url, options);
  },

  uploadFile: async <T>(
    url: string,
    file: File,
    schema: { parse: (data: unknown) => T }
  ): Promise<{ data: T }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fileUploadClient.post(url, { body: formData });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },
};

// Exporta cliente HTTP para acesso direto quando necessário
export const httpClient = apiClient;
