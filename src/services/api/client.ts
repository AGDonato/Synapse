// src/services/api/client.ts
import ky from 'ky';
import { phpRequestInterceptor, phpResponseInterceptor } from './php-adapter';

// Configuração base do cliente HTTP para PHP backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000; // 30 segundos

// Cliente HTTP principal configurado para PHP
export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504]
  },
  hooks: {
    beforeRequest: phpRequestInterceptor.beforeRequest,
    afterResponse: phpResponseInterceptor.afterResponse,
    beforeError: phpResponseInterceptor.onError
  }
});

// Cliente para upload de arquivos (sem JSON conversion)
export const fileUploadClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 60000, // 1 minuto para uploads
  retry: {
    limit: 1,
    methods: []
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Adiciona CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
          request.headers.set('X-CSRF-TOKEN', csrfToken);
        }

        // Remove Content-Type para FormData
        if (request.body instanceof FormData) {
          request.headers.delete('Content-Type');
        }

        return request;
      }
    ],
    afterResponse: phpResponseInterceptor.afterResponse,
    beforeError: phpResponseInterceptor.onError
  }
});

// Utilitários de autenticação
export const authUtils = {
  // Define token JWT
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  
  // Remove token
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },
  
  // Verifica se tem token válido
  hasValidToken: (): boolean => {
    const token = localStorage.getItem('auth_token');
    if (!token) {return false;}
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  },
  
  // Inicializa autenticação (chamado no app startup)
  initialize: () => {
    const token = localStorage.getItem('auth_token');
    if (token && authUtils.hasValidToken()) {
      authUtils.setToken(token);
    } else {
      authUtils.removeToken();
    }
  }
};

// Token refresh logic will be handled separately in the auth service

// Higher-level API wrapper with validation
export const api = {
  get: async <T>(url: string, schema: { parse: (data: unknown) => T }, options?: Record<string, unknown>): Promise<{ data: T }> => {
    const response = await apiClient.get(url, options);
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  post: async <T>(url: string, body: unknown, schema: { parse: (data: unknown) => T }, options?: Record<string, unknown>): Promise<{ data: T }> => {
    const response = await apiClient.post(url, { json: body, ...options });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  put: async <T>(url: string, body: unknown, schema: { parse: (data: unknown) => T }, options?: Record<string, unknown>): Promise<{ data: T }> => {
    const response = await apiClient.put(url, { json: body, ...options });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },

  delete: async (url: string, options?: Record<string, unknown>): Promise<void> => {
    await apiClient.delete(url, options);
  },

  uploadFile: async <T>(url: string, file: File, schema: { parse: (data: unknown) => T }): Promise<{ data: T }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fileUploadClient.post(url, { body: formData });
    const data = await response.json();
    const validated = schema.parse(data);
    return { data: validated };
  },
};

// Export httpClient for direct access when needed
export const httpClient = apiClient;