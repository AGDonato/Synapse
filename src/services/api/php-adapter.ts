/**
 * ================================================================
 * PHP ADAPTER - ADAPTADOR DE INTEGRAÇÃO COM BACKEND PHP/LARAVEL
 * ================================================================
 *
 * Este arquivo implementa um adaptador completo para integração perfeita entre
 * frontend TypeScript/JavaScript e backend PHP/Laravel.
 *
 * Funcionalidades principais:
 * - Conversão automática de nomenclatura (camelCase ↔ snake_case)
 * - Transformação de formatos de data (ISO8601 ↔ formato brasileiro)
 * - Interceptação e transformação de requisições HTTP
 * - Processamento de respostas com validação automática
 * - Tratamento especializado de erros HTTP (422, 401, 403, 500)
 * - Gerenciamento automático de tokens JWT e CSRF
 * - Headers HTTP padronizados para APIs REST
 * - Validação de schemas com parsing automático
 * - Utilitários para extração e manipulação de dados
 *
 * Arquitetura do adaptador:
 * - Conversores: camelToSnake, snakeToCamel para nomenclatura
 * - Transformadores de data: convertPhpDates, convertDatesToPHP
 * - Interceptors: phpRequestInterceptor, phpResponseInterceptor
 * - Utilitários: phpApiUtils para manipulação de responses
 * - Validadores: Integração com schemas Zod para type safety
 *
 * Fluxo de dados:
 * 1. Request: JS camelCase → snake_case PHP + formatação de datas
 * 2. Response: PHP snake_case → camelCase JS + conversão de datas
 * 3. Errors: Tratamento específico de códigos HTTP com formatação
 * 4. Auth: Injeção automática de tokens JWT/Bearer e CSRF
 *
 * Padrões suportados:
 * - Laravel: Validação 422, CSRF tokens, Response patterns
 * - JWT: Bearer tokens automáticos via localStorage
 * - REST: Headers padrão, Content negotiation
 * - Internacionalização: Datas em formato brasileiro
 *
 * @fileoverview Adaptador completo para integração PHP/Laravel
 * @version 2.0.0
 * @since 2024-01-20
 * @author Synapse Team
 */

import type { KyResponse, NormalizedOptions } from 'ky';
import {
  type ApiError,
  ApiErrorSchema,
  type ApiResponse,
  ApiResponseSchema,
} from '../../schemas/entities/api.schema';

/**
 * Logger especializado para debug do PHP Adapter
 */
const logger = {
  /**
   * Log de aviso para problemas não críticos
   * @param message - Mensagem de aviso
   * @param error - Erro opcional para contexto
   */
  warn: (message: string, error?: any) => console.warn(`[PHP-Adapter] ${message}`, error),

  /**
   * Log de erro para problemas críticos
   * @param message - Mensagem de erro
   * @param error - Erro opcional para contexto
   */
  error: (message: string, error?: any) => console.error(`[PHP-Adapter] ${message}`, error),
};

/**
 * ===================================================================
 * FUNÇÕES DE CONVERSÃO DE NOMENCLATURA
 * ===================================================================
 */

/**
 * Converte objetos com nomenclatura camelCase para snake_case
 * Usado para enviar dados do frontend JavaScript para backend PHP
 *
 * @template T - Tipo genérico do objeto
 * @param obj - Objeto para converter
 * @returns Objeto com chaves em snake_case
 *
 * @example
 * ```typescript
 * const jsData = { nomeUsuario: "João", dataNascimento: "01/01/1990" };
 * const phpData = camelToSnake(jsData);
 * // { nome_usuario: "João", data_nascimento: "01/01/1990" }
 * ```
 */
export function camelToSnake<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // @ts-ignore - conversão genérica de array preserva tipo
    return obj.map(camelToSnake);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Converte camelCase para snake_case usando regex
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = camelToSnake(value);
  }

  // @ts-ignore - conversão genérica mantém compatibilidade de tipo
  return converted;
}

/**
 * Converte objetos com nomenclatura snake_case para camelCase
 * Usado para receber dados do backend PHP no frontend JavaScript
 *
 * @template T - Tipo genérico do objeto
 * @param obj - Objeto para converter
 * @returns Objeto com chaves em camelCase
 *
 * @example
 * ```typescript
 * const phpData = { nome_usuario: "João", data_nascimento: "1990-01-01" };
 * const jsData = snakeToCamel(phpData);
 * // { nomeUsuario: "João", dataNascimento: "1990-01-01" }
 * ```
 */
export function snakeToCamel<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // @ts-ignore - conversão genérica de array preserva tipo
    return obj.map(snakeToCamel);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Converte snake_case para camelCase usando regex
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = snakeToCamel(value);
  }

  // @ts-ignore - conversão genérica mantém compatibilidade de tipo
  return converted;
}

/**
 * ===================================================================
 * FUNÇÕES DE CONVERSÃO DE DATAS
 * ===================================================================
 */

/**
 * Converte datas do formato ISO8601/MySQL para formato brasileiro
 * Transforma strings de data do backend PHP para exibição no frontend
 *
 * @param obj - Objeto contendo potenciais datas para conversão
 * @returns Objeto com datas convertidas para formato brasileiro
 *
 * @example
 * ```typescript
 * const phpResponse = { created_at: "2024-12-31", updated_at: "2024-12-31 23:59:59" };
 * const jsResponse = convertPhpDates(phpResponse);
 * // { created_at: "31/12/2024", updated_at: "31/12/2024" }
 * ```
 */
export function convertPhpDates(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertPhpDates);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Detecta datas no formato ISO8601/MySQL (YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Converte para formato brasileiro DD/MM/YYYY
        converted[key] = date.toLocaleDateString('pt-BR');
        continue;
      }
    }

    // Recursão para objetos aninhados
    converted[key] = convertPhpDates(value);
  }

  return converted;
}

/**
 * Converte datas do formato brasileiro para formato PHP/MySQL
 * Transforma strings de data do frontend para envio ao backend PHP
 *
 * @param obj - Objeto contendo potenciais datas para conversão
 * @returns Objeto com datas convertidas para formato PHP
 *
 * @example
 * ```typescript
 * const jsRequest = { data_inicio: "31/12/2024", data_fim: "01/01/2025" };
 * const phpRequest = convertDatesToPHP(jsRequest);
 * // { data_inicio: "2024-12-31", data_fim: "2025-01-01" }
 * ```
 */
export function convertDatesToPHP(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDatesToPHP);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Detecta datas no formato brasileiro DD/MM/YYYY
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      // Converte para formato MySQL/PHP YYYY-MM-DD
      converted[key] = `${year}-${month}-${day}`;
      continue;
    }

    // Recursão para objetos aninhados
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

/**
 * Interceptor para transformação de requisições HTTP
 *
 * Aplicado automaticamente antes de cada requisição para:
 * - Injetar tokens de autenticação (JWT Bearer + CSRF)
 * - Configurar headers padrão para APIs REST
 * - Converter nomenclatura camelCase → snake_case
 * - Transformar datas brasileiras → formato PHP
 *
 * @example
 * ```typescript
 * // Headers automáticos adicionados:
 * // Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
 * // X-CSRF-TOKEN: xsrf-token-from-meta-tag
 * // Accept: application/json
 * // Content-Type: application/json
 * // X-Requested-With: XMLHttpRequest
 * ```
 */
export const phpRequestInterceptor = {
  beforeRequest: [
    (request: Request): Request => {
      // Injeção automática de token JWT Bearer
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        request.headers.set('Authorization', `Bearer ${authToken}`);
      }

      // Injeção automática de token CSRF para Laravel
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        request.headers.set('X-CSRF-TOKEN', csrfToken);
      }

      // Headers padrão para comunicação com APIs PHP/Laravel
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('X-Requested-With', 'XMLHttpRequest');

      // Transformação automática de dados para formato PHP
      if (request.method !== 'GET' && request.body) {
        try {
          const bodyText = request.body.toString();
          const bodyObject = JSON.parse(bodyText);

          // Pipeline de conversão: JS camelCase + datas BR → PHP snake_case + datas ISO
          const phpFormattedBody = camelToSnake(convertDatesToPHP(bodyObject));

          return new Request(request, {
            body: JSON.stringify(phpFormattedBody),
          });
        } catch (error) {
          // Fallback: envia dados originais em caso de erro na conversão
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

/**
 * ===================================================================
 * UTILITÁRIOS PARA MANIPULAÇÃO DE RESPONSES DA API PHP
 * ===================================================================
 */

/**
 * Conjunto de utilitários para trabalhar com respostas da API PHP/Laravel
 * Fornece type guards e funções de extração de dados seguras
 *
 * @example
 * ```typescript
 * const response = await api.get('users/1');
 *
 * if (phpApiUtils.isSuccess(response)) {
 *   const userData = phpApiUtils.extractData(response);
 *   console.log('Usuário:', userData);
 * } else if (phpApiUtils.isError(response)) {
 *   const errors = phpApiUtils.extractErrors(response);
 *   console.error('Erros:', errors);
 * }
 * ```
 */
export const phpApiUtils = {
  /**
   * Type guard para verificar se a resposta indica sucesso
   * @param response - Resposta da API para verificar
   * @returns True se é uma resposta de sucesso
   */
  isSuccess: (response: unknown): response is ApiResponse => {
    // @ts-ignore - verificação segura de propriedade em objeto unknown
    return response && typeof response === 'object' && response.success === true;
  },

  /**
   * Type guard para verificar se a resposta indica erro
   * @param response - Resposta da API para verificar
   * @returns True se é uma resposta de erro
   */
  isError: (response: unknown): response is ApiError => {
    // @ts-ignore - verificação segura de propriedade em objeto unknown
    return response && typeof response === 'object' && response.success === false;
  },

  /**
   * Extrai dados da resposta de sucesso de forma segura
   * @param response - Resposta de sucesso da API
   * @returns Dados extraídos ou null se não existirem
   */
  extractData: <T>(response: ApiResponse<T>): T | null => {
    return response.data || null;
  },

  /**
   * Extrai todas as mensagens de erro para exibir ao usuário
   * Combina message principal com array de errors, evitando duplicação
   *
   * @param response - Resposta de erro da API
   * @returns Array com todas as mensagens de erro
   */
  extractErrors: (response: ApiError): string[] => {
    const errors = response.errors || [];

    // Adiciona message principal se não estiver já incluída nos errors
    if (response.message && !errors.includes(response.message)) {
      return [response.message, ...errors];
    }

    return errors;
  },
};
