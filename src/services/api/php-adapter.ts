// src/services/api/php-adapter.ts
/**
 * ================================================================
 * PHP ADAPTER - PARA DESENVOLVEDOR BACKEND LEIA ISTO!
 * ================================================================
 *
 * Este arquivo é um adaptador que converte dados entre o formato JavaScript
 * (camelCase) e PHP (snake_case), além de tratar datas e interceptar
 * requisições/respostas da API.
 *
 * COMO FUNCIONA:
 * - Intercepta requisições: converte camelCase → snake_case
 * - Intercepta respostas: converte snake_case → camelCase
 * - Converte datas: PHP (Y-m-d) ↔ Brasil (DD/MM/YYYY)
 * - Trata erros HTTP específicos (422, 401, 403)
 * - Adiciona tokens de autenticação automaticamente
 *
 * QUANDO USAR:
 * - É usado automaticamente quando USE_REAL_API = true no mockAdapter
 * - Interceptors são aplicados em todas as requisições para o backend PHP
 *
 * BACKEND: Os @ts-ignore neste arquivo são necessários devido à natureza
 * genérica das conversões de tipos. O código funciona corretamente na prática,
 * mas o TypeScript não consegue inferir os tipos em tempo de compilação.
 *
 * TESTE: Quando integrar o backend real, verifique se:
 * - Campos snake_case chegam corretamente no PHP
 * - Respostas PHP são convertidas para camelCase no frontend
 * - Datas são formatadas corretamente (DD/MM/YYYY ↔ Y-m-d)
 * - Headers de autenticação funcionam (Bearer token + CSRF)
 */

import type { KyResponse, NormalizedOptions } from 'ky';
import {
  type ApiError,
  ApiErrorSchema,
  type ApiResponse,
  ApiResponseSchema,
} from '../../schemas/entities/api.schema';

// Logger simples para debugar problemas de conversão
const logger = {
  warn: (message: string, error?: any) => console.warn(`[PHP-Adapter] ${message}`, error),
  error: (message: string, error?: any) => console.error(`[PHP-Adapter] ${message}`, error),
};

/**
 * FUNÇÕES DE CONVERSÃO CAMELCASE ↔ SNAKE_CASE
 * =============================================
 *
 * Estas funções convertem automaticamente entre os padrões:
 * JavaScript: { nomeUsuario: "João", dataNascimento: "01/01/1990" }
 * PHP:        { "nome_usuario": "João", "data_nascimento": "1990-01-01" }
 */

// Converte camelCase para snake_case (JavaScript → PHP)
export function camelToSnake<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // @ts-ignore - conversão genérica de array, tipo será preservado na prática
    return obj.map(camelToSnake);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = camelToSnake(value);
  }

  // @ts-ignore - conversão genérica, tipo será compatível na prática
  return converted;
}

// Converte snake_case para camelCase (PHP → JavaScript)
export function snakeToCamel<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // @ts-ignore - conversão genérica de array, tipo será preservado na prática
    return obj.map(snakeToCamel);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = snakeToCamel(value);
  }

  // @ts-ignore - conversão genérica, tipo será compatível na prática
  return converted;
}

/**
 * FUNÇÕES DE CONVERSÃO DE DATAS
 * =============================
 *
 * Converte automaticamente entre formatos de data:
 * PHP Backend:  "2024-12-31" ou "2024-12-31 23:59:59"
 * Frontend BR:  "31/12/2024"
 */

// Converte datas do formato PHP para formato brasileiro
export function convertPhpDates(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertPhpDates);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Converte datas PHP (Y-m-d H:i:s ou Y-m-d) para formato brasileiro (DD/MM/YYYY)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        converted[key] = date.toLocaleDateString('pt-BR');
        continue;
      }
    }

    converted[key] = convertPhpDates(value);
  }

  return converted;
}

// Converte datas do formato brasileiro para formato PHP
export function convertDatesToPHP(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDatesToPHP);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Converte datas brasileiras (DD/MM/YYYY) para formato PHP (Y-m-d)
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      converted[key] = `${year}-${month}-${day}`;
      continue;
    }

    converted[key] = convertDatesToPHP(value);
  }

  return converted;
}

/**
 * INTERCEPTORS PARA REQUISIÇÕES E RESPOSTAS
 * =========================================
 *
 * Estes interceptors são aplicados automaticamente em todas as chamadas da API:
 * - beforeRequest: converte dados + adiciona tokens de auth
 * - afterResponse: converte respostas de volta para camelCase
 * - onError: trata erros HTTP específicos do Laravel/PHP
 *
 * BACKEND: Configure sua API para aceitar os headers:
 * - Authorization: Bearer {token}
 * - X-CSRF-TOKEN: {csrf_token} (Laravel)
 * - X-Requested-With: XMLHttpRequest
 */

// Interceptor para requisições (antes de enviar para o servidor)
export const phpRequestInterceptor = {
  beforeRequest: [
    (request: Request) => {
      // Adiciona token JWT/Bearer automaticamente se estiver no localStorage
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        request.headers.set('Authorization', `Bearer ${authToken}`);
      }

      // Adiciona token CSRF do Laravel se estiver na página
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        request.headers.set('X-CSRF-TOKEN', csrfToken);
      }

      // Headers padrão para APIs PHP/Laravel
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('X-Requested-With', 'XMLHttpRequest');

      // Converte automaticamente camelCase → snake_case no body da requisição
      if (request.method !== 'GET' && request.body) {
        try {
          const bodyText = request.body.toString();
          const bodyObject = JSON.parse(bodyText);
          // Aplica dupla conversão: datas BR→PHP + camelCase→snake_case
          const convertedBody = camelToSnake(convertDatesToPHP(bodyObject));
          return new Request(request, {
            body: JSON.stringify(convertedBody),
          });
        } catch (error) {
          // Se der erro na conversão, envia dados originais
          logger.warn('Falha ao converter body da requisição:', error);
        }
      }

      return request;
    },
  ],
};

// Interceptor para respostas (depois de receber do servidor)
export const phpResponseInterceptor = {
  afterResponse: [
    async (request: Request, options: NormalizedOptions, response: KyResponse) => {
      // Clona a resposta para não afetar outros processamentos
      const clonedResponse = response.clone();

      try {
        const data = await clonedResponse.json();

        // Aplica dupla conversão: snake_case→camelCase + datas PHP→BR
        const convertedData = snakeToCamel(convertPhpDates(data));

        // Valida se a resposta segue o padrão ApiResponse esperado
        const validatedResponse = ApiResponseSchema.parse(convertedData);

        // Retorna nova resposta com dados convertidos
        return new Response(JSON.stringify(validatedResponse), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (error) {
        // Se der erro na conversão, retorna resposta original
        logger.warn('Falha ao converter resposta da API:', error);
        return response;
      }
    },
  ],

  // Interceptor de erro para casos específicos do Laravel/PHP
  onError: [
    (error: unknown) => {
      // BACKEND: @ts-ignore necessários para tratamento genérico de erros HTTP

      // Erro 422: Validação Laravel (campos inválidos)
      // @ts-ignore - error pode ter propriedade response dependendo do tipo de erro
      if (error.response?.status === 422) {
        // @ts-ignore - error.response existe no contexto de erro HTTP
        return error.response.json().then((data: unknown) => {
          // @ts-ignore - conversão genérica, tipo será adequado na prática
          const convertedError = snakeToCamel(data);
          const validatedError = ApiErrorSchema.parse({
            success: false,
            // @ts-ignore - propriedades existem após conversão
            message: convertedError.message || 'Dados inválidos enviados',
            // @ts-ignore - propriedades existem após conversão
            errors: convertedError.errors ? Object.values(convertedError.errors).flat() : [],
            code: 'VALIDATION_ERROR',
            statusCode: 422,
          });

          throw new Error(JSON.stringify(validatedError));
        });
      }

      // Erro 401/403: Token inválido ou acesso negado
      // @ts-ignore - error.response existe no contexto de erro HTTP
      if (error.response?.status === 401 || error.response?.status === 403) {
        const authError: ApiError = {
          success: false,
          message: 'Token de acesso inválido ou expirado',
          code: 'UNAUTHORIZED',
          // @ts-ignore - error.response.status existe aqui
          statusCode: error.response.status,
        };

        // Redireciona automaticamente para tela de login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        throw new Error(JSON.stringify(authError));
      }

      // Outros erros HTTP: 500, 404, etc.
      // @ts-ignore - error.response existe no contexto de erro HTTP
      if (error.response) {
        // @ts-ignore - error.response existe no contexto de erro HTTP
        return error.response
          .json()
          .then((data: unknown) => {
            // @ts-ignore - conversão genérica, tipo será adequado na prática
            const convertedError = snakeToCamel(data);
            const apiError: ApiError = {
              success: false,
              // @ts-ignore - propriedades existem após conversão
              message: convertedError.message || 'Erro interno do servidor',
              // @ts-ignore - propriedades existem após conversão
              errors: convertedError.errors,
              // @ts-ignore - propriedades existem após conversão
              code: convertedError.code || 'SERVER_ERROR',
              // @ts-ignore - error.response.status existe aqui
              statusCode: error.response.status,
            };

            throw new Error(JSON.stringify(apiError));
          })
          .catch(() => {
            // Se não conseguir parsear a resposta JSON, usa erro genérico
            const genericError: ApiError = {
              success: false,
              message: 'Erro de comunicação com o servidor',
              code: 'SERVER_ERROR',
              // @ts-ignore - error.response.status existe aqui
              statusCode: error.response.status,
            };

            throw new Error(JSON.stringify(genericError));
          });
      }

      throw error;
    },
  ],
};

/**
 * UTILITÁRIOS PARA TRABALHAR COM RESPOSTAS DA API
 * ===============================================
 *
 * Funções auxiliares para validar e extrair dados das respostas da API PHP.
 * Use estas funções para tratar respostas de forma segura.
 */

// Utilitários para trabalhar com respostas da API PHP
export const phpApiUtils = {
  // Verifica se a resposta indica sucesso
  isSuccess: (response: unknown): response is ApiResponse => {
    // @ts-ignore - verificação de propriedade em objeto unknown
    return response && response.success === true;
  },

  // Verifica se a resposta indica erro
  isError: (response: unknown): response is ApiError => {
    // @ts-ignore - verificação de propriedade em objeto unknown
    return response && response.success === false;
  },

  // Extrai dados úteis da resposta de sucesso
  extractData: <T>(response: ApiResponse<T>): T | null => {
    return response.data || null;
  },

  // Extrai todas as mensagens de erro para exibir ao usuário
  extractErrors: (response: ApiError): string[] => {
    const errors = response.errors || [];
    if (response.message && !errors.includes(response.message)) {
      return [response.message, ...errors];
    }
    return errors;
  },
};
