// src/services/api/php-adapter.ts
import type { KyResponse } from 'ky';
import { type ApiError, ApiErrorSchema, type ApiResponse, ApiResponseSchema } from '../../schemas/entities/api.schema';

/**
 * Adaptador para integração com APIs PHP (Laravel/Symfony)
 * Converte entre formatos JavaScript e PHP
 */

// Converte camelCase para snake_case
export function camelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const converted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = camelToSnake(value);
  }
  
  return converted;
}

// Converte snake_case para camelCase
export function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const converted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = snakeToCamel(value);
  }
  
  return converted;
}

// Converte datas do formato PHP para JavaScript
export function convertPhpDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertPhpDates);
  }

  const converted: any = {};
  
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

// Converte datas do formato brasileiro para PHP
export function convertDatesToPHP(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDatesToPHP);
  }

  const converted: any = {};
  
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

// Interceptor para requisições
export const phpRequestInterceptor = {
  beforeRequest: [
    (request: Request) => {
      // Adiciona token de autorização se disponível
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        request.headers.set('Authorization', `Bearer ${authToken}`);
      }

      // Adiciona CSRF token se disponível (Laravel)
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        request.headers.set('X-CSRF-TOKEN', csrfToken);
      }

      // Adiciona headers para APIs PHP
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('X-Requested-With', 'XMLHttpRequest');

      // Converte body de camelCase para snake_case se necessário
      if (request.method !== 'GET' && request.body) {
        try {
          const bodyText = request.body.toString();
          const bodyObject = JSON.parse(bodyText);
          const convertedBody = camelToSnake(convertDatesToPHP(bodyObject));
          return new Request(request, {
            body: JSON.stringify(convertedBody)
          });
        } catch (error) {
          // Se não conseguir parsear, manda original
          console.warn('Failed to convert request body:', error);
        }
      }

      return request;
    }
  ]
};

// Interceptor para respostas
export const phpResponseInterceptor = {
  afterResponse: [
    async (request: Request, options: any, response: KyResponse) => {
      // Clona a resposta para não interferir com outras manipulações
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        
        // Converte snake_case para camelCase e datas PHP para formato brasileiro
        const convertedData = snakeToCamel(convertPhpDates(data));
        
        // Valida a estrutura da resposta
        const validatedResponse = ApiResponseSchema.parse(convertedData);
        
        // Retorna nova resposta com dados convertidos
        return new Response(JSON.stringify(validatedResponse), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (error) {
        // Se der erro na conversão, retorna resposta original
        console.warn('Failed to convert response:', error);
        return response;
      }
    }
  ],
  
  // Interceptor de erro para tratar erros PHP específicos
  onError: [
    (error: any) => {
      // Se for erro de validação do Laravel (422)
      if (error.response?.status === 422) {
        return error.response.json().then((data: any) => {
          const convertedError = snakeToCamel(data);
          const validatedError = ApiErrorSchema.parse({
            success: false,
            message: convertedError.message || 'Erro de validação',
            errors: convertedError.errors ? Object.values(convertedError.errors).flat() : [],
            code: 'VALIDATION_ERROR',
            statusCode: 422
          });
          
          throw new Error(JSON.stringify(validatedError));
        });
      }
      
      // Se for erro de autenticação (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        const authError: ApiError = {
          success: false,
          message: 'Acesso não autorizado',
          code: 'UNAUTHORIZED',
          statusCode: error.response.status
        };
        
        // Redireciona para login se necessário
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        throw new Error(JSON.stringify(authError));
      }
      
      // Para outros erros, tenta extrair mensagem
      if (error.response) {
        return error.response.json().then((data: any) => {
          const convertedError = snakeToCamel(data);
          const apiError: ApiError = {
            success: false,
            message: convertedError.message || 'Erro no servidor',
            errors: convertedError.errors,
            code: convertedError.code || 'SERVER_ERROR',
            statusCode: error.response.status
          };
          
          throw new Error(JSON.stringify(apiError));
        }).catch(() => {
          // Se não conseguir parsear, cria erro genérico
          const genericError: ApiError = {
            success: false,
            message: 'Erro no servidor',
            code: 'SERVER_ERROR',
            statusCode: error.response.status
          };
          
          throw new Error(JSON.stringify(genericError));
        });
      }
      
      throw error;
    }
  ]
};

// Utilitários para trabalhar com respostas da API PHP
export const phpApiUtils = {
  // Valida se a resposta é um sucesso
  isSuccess: (response: any): response is ApiResponse => {
    return response && response.success === true;
  },
  
  // Valida se a resposta é um erro
  isError: (response: any): response is ApiError => {
    return response && response.success === false;
  },
  
  // Extrai dados da resposta
  extractData: <T>(response: ApiResponse<T>): T | null => {
    return response.data || null;
  },
  
  // Extrai mensagens de erro
  extractErrors: (response: ApiError): string[] => {
    const errors = response.errors || [];
    if (response.message && !errors.includes(response.message)) {
      return [response.message, ...errors];
    }
    return errors;
  }
};