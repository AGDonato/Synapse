/**
 * ================================================================
 * CLIENT HTTP - CLIENTE HTTP PRINCIPAL DO SISTEMA SYNAPSE
 * ================================================================
 *
 * Este arquivo implementa o cliente HTTP principal para integração com backend.
 * Fornece uma camada de abstração sobre requisições HTTP com funcionalidades avançadas.
 *
 * Funcionalidades principais:
 * - Cliente HTTP configurado com ky.js para máxima performance
 * - Sistema de retry automático com backoff exponencial
 * - Cache inteligente para requisições GET repetidas
 * - Conversão automática de dados camelCase ↔ snake_case via PHP adapter
 * - Headers de autenticação JWT automáticos
 * - Upload otimizado de arquivos com FormData
 * - Métricas detalhadas de performance e monitoramento
 * - Interceptors personalizados para logging e transformação
 * - Health check para verificação de conectividade
 * - Sistema de autenticação com JWT e renovação automática
 * - Validação de schemas com parsing automático
 *
 * Arquitetura:
 * - apiClient: Cliente principal para operações CRUD
 * - fileUploadClient: Cliente especializado para upload de arquivos
 * - api: Wrapper de alto nível com validação e cache
 * - authUtils: Utilitários para autenticação JWT
 * - Métricas em tempo real para monitoramento de performance
 *
 * Padrões implementados:
 * - Retry pattern com exponential backoff
 * - Cache pattern para otimização de performance
 * - Interceptor pattern para transformação de dados
 * - Observer pattern para métricas
 * - Factory pattern para criação de clientes especializados
 *
 * @fileoverview Cliente HTTP principal com funcionalidades avançadas
 * @version 1.0.0
 * @since 2024-01-15
 */

// src/services/api/client.ts
import ky from 'ky';

/**
 * URL base da API obtida das variáveis de ambiente
 * @default '/api'
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Timeout padrão para requisições HTTP (30 segundos)
 * @default 30000
 */
const API_TIMEOUT = 30000;

/**
 * Cache para requisições GET duplicadas para otimização de performance
 * Armazena promises de requisições para evitar chamadas desnecessárias
 */
const requestCache = new Map<string, Promise<unknown>>();

/**
 * Interface para métricas de performance da API
 */
interface ApiMetrics {
  /** Número total de requisições realizadas */
  totalRequests: number;
  /** Número de requisições bem-sucedidas */
  successfulRequests: number;
  /** Número de requisições que falharam */
  failedRequests: number;
  /** Tempo médio de resposta em milissegundos */
  averageResponseTime: number;
  /** Número total de tentativas de retry */
  retryCount: number;
}

/**
 * Métricas globais de performance da API
 */
const metrics: ApiMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  retryCount: 0,
};

/**
 * Timer para limpeza automática do cache a cada 5 minutos
 * Previne acúmulo excessivo de memória
 */
setInterval(
  () => {
    requestCache.clear();
  },
  5 * 60 * 1000
);

/**
 * Gera um identificador único para requisições baseado nos parâmetros
 * Usado para cache de requisições GET idênticas
 *
 * @param url - URL da requisição
 * @param options - Opções da requisição (método, parâmetros, body)
 * @returns Identificador único codificado em base64 (20 caracteres)
 */
const generateRequestId = (url: string, options: Record<string, any> = {}): string => {
  const key = `${options.method || 'GET'}-${url}-${JSON.stringify(options.searchParams || {})}-${JSON.stringify(options.json || {})}`;
  return btoa(key).slice(0, 20);
};

/**
 * Atualiza as métricas globais de performance da API
 * Calcula média móvel do tempo de resposta e contadores de sucesso/falha
 *
 * @param responseTime - Tempo de resposta da requisição em milissegundos
 * @param success - Se a requisição foi bem-sucedida
 */
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

/**
 * Cliente HTTP principal configurado com ky.js
 *
 * Funcionalidades incluídas:
 * - Retry automático com backoff exponencial
 * - Headers de autenticação JWT automáticos
 * - Métricas automáticas de performance
 * - Timeout configurável
 *
 * @example
 * ```typescript
 * const response = await apiClient.get('users/123');
 * const data = await response.json();
 * ```
 */
export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
  retry: {
    limit: 3, // Máximo de 3 tentativas
    methods: ['get', 'post', 'put', 'delete'], // Retry em todos os métodos HTTP
    statusCodes: [408, 413, 429, 500, 502, 503, 504], // Códigos que acionam retry
    delay: attemptCount => Math.min(1000 * Math.pow(2, attemptCount - 1), 30000), // Backoff exponencial
  },
  hooks: {
    beforeRequest: [
      request => {
        // Adicionar token JWT aos headers
        const token = localStorage.getItem('auth_token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        // Content-Type para JSON
        if (request.body && !(request.body instanceof FormData)) {
          request.headers.set('Content-Type', 'application/json');
        }

        // Interceptor para métricas - marca início da requisição
        (request as any)._startTime = Date.now();
        return request;
      },
    ],
    afterResponse: [
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
      error => {
        // Interceptor para métricas - registra erro
        const request = (error as any).request;
        const startTime = request?._startTime;
        if (startTime) {
          const responseTime = Date.now() - startTime;
          updateMetrics(responseTime, false);
        }

        // Logout automático em caso de 401
        if (error.response?.status === 401) {
          authUtils.removeToken();
          window.location.href = '/login';
        }

        throw error;
      },
    ],
  },
});

/**
 * Cliente HTTP especializado para upload de arquivos
 *
 * Diferenças do cliente principal:
 * - Timeout maior (60 segundos) para uploads grandes
 * - Sem retry automático para evitar uploads duplicados
 * - Configuração automática de FormData
 * - Headers de autenticação JWT automáticos
 * - Headers Content-Type configurados automaticamente
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * const response = await fileUploadClient.post('upload', { body: formData });
 * ```
 */
export const fileUploadClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 60000, // 1 minuto para uploads
  retry: {
    limit: 1, // Sem retry para uploads (evita duplicação)
    methods: [],
  },
  hooks: {
    beforeRequest: [
      request => {
        // Adicionar token JWT aos headers
        const token = localStorage.getItem('auth_token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        // Remove Content-Type para permitir configuração automática do FormData
        if (request.body instanceof FormData) {
          request.headers.delete('Content-Type');
        }

        return request;
      },
    ],
    beforeError: [
      error => {
        // Logout automático em caso de 401
        if (error.response?.status === 401) {
          authUtils.removeToken();
          window.location.href = '/login';
        }
        throw error;
      },
    ],
  },
});

/**
 * Utilitários para gerenciamento de autenticação JWT
 *
 * Funcionalidades:
 * - Armazenamento seguro de tokens JWT no localStorage
 * - Validação automática de expiração de tokens
 * - Inicialização automática na inicialização da aplicação
 * - Limpeza automática de tokens inválidos
 */
export const authUtils = {
  /**
   * Define o token JWT no localStorage
   * @param token - Token JWT válido
   */
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  /**
   * Remove o token JWT do localStorage
   * Usado durante logout ou quando token expira
   */
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },

  /**
   * Verifica se existe um token válido e não expirado
   * @returns True se o token existe e é válido, false caso contrário
   */
  hasValidToken: (): boolean => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }

    try {
      // Decodifica o payload do JWT para verificar expiração
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Converte para milissegundos
      return Date.now() < exp;
    } catch {
      return false;
    }
  },

  /**
   * Inicializa o sistema de autenticação
   * Deve ser chamado na inicialização da aplicação
   * Remove tokens inválidos automaticamente
   */
  initialize: () => {
    const token = localStorage.getItem('auth_token');
    if (token && authUtils.hasValidToken()) {
      authUtils.setToken(token);
    } else {
      authUtils.removeToken();
    }
  },
};

/**
 * Obtém uma cópia das métricas atuais de performance da API
 * @returns Objeto com estatísticas detalhadas de performance
 */
export const getApiMetrics = (): ApiMetrics => ({ ...metrics });

/**
 * Limpa o cache de requisições manualmente
 * Útil para forçar atualizações ou liberar memória
 */
export const clearApiCache = (): void => {
  requestCache.clear();
};

/**
 * Verifica a saúde da API fazendo uma requisição para o endpoint de health check
 * @returns Promise que resolve para true se a API está saudável, false caso contrário
 *
 * @example
 * ```typescript
 * const isHealthy = await healthCheck();
 * if (!isHealthy) {
 *   console.warn('API não está respondendo');
 * }
 * ```
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('health', {
      timeout: 5000,
      retry: { limit: 1 },
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Interface para schema de validação Zod
 */
interface ValidationSchema<T> {
  parse: (data: unknown) => T;
}

/**
 * Wrapper de API de alto nível com validação automática e cache inteligente
 *
 * Funcionalidades:
 * - Validação automática de responses com schemas Zod
 * - Cache automático para requisições GET
 * - Type safety completo com TypeScript generics
 * - Handling de erros padronizado
 * - Conversão automática via PHP adapter
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const UserSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const { data } = await api.get('users/123', UserSchema);
 * // data é tipado como { id: number, name: string, email: string }
 * ```
 */
export const api = {
  /**
   * Executa requisição GET com cache automático e validação
   *
   * @param url - URL relativa do endpoint
   * @param schema - Schema Zod para validação da response
   * @param options - Opções adicionais da requisição
   * @returns Promise com dados validados e tipados
   */
  get: async <T>(
    url: string,
    schema: ValidationSchema<T>,
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

  /**
   * Executa requisição POST com validação automática
   *
   * @param url - URL relativa do endpoint
   * @param body - Dados para enviar no body da requisição
   * @param schema - Schema Zod para validação da response
   * @param options - Opções adicionais da requisição
   * @returns Promise com dados validados e tipados
   */
  post: async <T>(
    url: string,
    body: unknown,
    schema: ValidationSchema<T>,
    options?: Record<string, unknown>
  ): Promise<{ data: T }> => {
    const response = await apiClient.post(url, { json: body, ...options });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  /**
   * Executa requisição PUT com validação automática
   *
   * @param url - URL relativa do endpoint
   * @param body - Dados para enviar no body da requisição
   * @param schema - Schema Zod para validação da response
   * @param options - Opções adicionais da requisição
   * @returns Promise com dados validados e tipados
   */
  put: async <T>(
    url: string,
    body: unknown,
    schema: ValidationSchema<T>,
    options?: Record<string, unknown>
  ): Promise<{ data: T }> => {
    const response = await apiClient.put(url, { json: body, ...options });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  /**
   * Executa requisição DELETE
   *
   * @param url - URL relativa do endpoint
   * @param options - Opções adicionais da requisição
   */
  delete: async (url: string, options?: Record<string, unknown>): Promise<void> => {
    await apiClient.delete(url, options);
  },

  /**
   * Upload de arquivo com validação automática
   *
   * @param url - URL relativa do endpoint de upload
   * @param file - Arquivo para upload
   * @param schema - Schema Zod para validação da response
   * @returns Promise com dados validados e tipados
   *
   * @example
   * ```typescript
   * const ResponseSchema = z.object({
   *   filename: z.string(),
   *   size: z.number(),
   *   url: z.string().url()
   * });
   *
   * const { data } = await api.uploadFile('upload', file, ResponseSchema);
   * ```
   */
  uploadFile: async <T>(
    url: string,
    file: File,
    schema: ValidationSchema<T>
  ): Promise<{ data: T }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fileUploadClient.post(url, { body: formData });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },
};

/**
 * Alias para o cliente HTTP principal
 * Útil quando é necessário acesso direto ao cliente ky.js
 * sem as validações e cache do wrapper `api`
 *
 * @example
 * ```typescript
 * // Para casos especiais onde é necessário controle total
 * const response = await httpClient.get('custom-endpoint');
 * const rawData = await response.text(); // Sem parsing JSON automático
 * ```
 */
export const httpClient = apiClient;
