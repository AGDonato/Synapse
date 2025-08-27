/**
 * Integration tests for API layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { adaptiveApi } from '../../services/api/mockAdapter';
import { api, APIError, ValidationError } from '../../services/api/client';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Adaptive API', () => {
    it('deve usar mocks por padrão', async () => {
      const demandas = await adaptiveApi.demandas.list();
      
      expect(demandas).toBeDefined();
      expect(Array.isArray(demandas.data)).toBe(true);
      expect(demandas.meta).toBeDefined();
    });

    it('deve simular delay realista', async () => {
      const startTime = Date.now();
      await adaptiveApi.demandas.list();
      const endTime = Date.now();
      
      // Mock should simulate some delay
      expect(endTime - startTime).toBeGreaterThan(200);
    });

    it('deve manter estado entre chamadas CRUD', async () => {
      // Create
      const newDemanda = {
        numero: 'TEST-001',
        titulo: 'Demanda de Teste',
        descricao: 'Teste de integração',
        prioridade: 'media' as const,
        status: 'aberta' as const,
        data_abertura: new Date().toISOString(),
        data_prazo: new Date(Date.now() + 86400000).toISOString(),
        tipo_demanda_id: 1,
        orgao_solicitante_id: 1,
        assunto_id: 1,
      };

      const created = await adaptiveApi.demandas.create(newDemanda);
      expect(created.id).toBeDefined();
      expect(created.titulo).toBe(newDemanda.titulo);

      // Read
      const found = await adaptiveApi.demandas.getById(created.id);
      expect(found).toEqual(created);

      // Update
      const updatedData = { titulo: 'Título Atualizado' };
      const updated = await adaptiveApi.demandas.update(created.id, updatedData);
      expect(updated.titulo).toBe(updatedData.titulo);

      // Delete
      await expect(adaptiveApi.demandas.delete(created.id)).resolves.toBeUndefined();
      
      // Verify deletion
      await expect(adaptiveApi.demandas.getById(created.id)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros de rede', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(api.get('test', {})).rejects.toThrow('Network error');
    });

    it('deve lidar com respostas de erro HTTP', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          message: 'Validation failed',
          validation_errors: {
            title: ['Title is required'],
            email: ['Invalid email format'],
          },
        }),
      });

      await expect(api.get('test', {})).rejects.toThrow(ValidationError);
    });

    it('deve lidar com respostas JSON malformadas', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(api.get('test', {})).rejects.toThrow();
    });

    it('deve lidar com timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 35000))
      );

      await expect(api.get('test', {})).rejects.toThrow();
    });
  });

  describe('Authentication Flow', () => {
    it('deve incluir token nas requisições quando autenticado', async () => {
      const token = 'test-token';
      const { auth } = await import('../../services/api/client');
      
      auth.setToken(token);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: {} }),
      });

      await api.get('test', {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('deve limpar token em caso de erro 401', async () => {
      const { auth } = await import('../../services/api/client');
      
      auth.setToken('expired-token');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          message: 'Token expired',
        }),
      });

      // Mock window.location.href assignment
      delete (window as any).location;
      (window as any).location = { href: '' };

      await expect(api.get('test', {})).rejects.toThrow(APIError);
      expect(auth.getToken()).toBe(null);
    });
  });

  describe('Request Retry Logic', () => {
    it('deve tentar novamente em caso de erro temporário', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: vi.fn().mockResolvedValue({
              message: 'Service unavailable',
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ data: 'success' }),
        });
      });

      const result = await api.get('test', {});
      expect(result).toEqual({ data: 'success' });
      expect(callCount).toBe(3);
    });

    it('não deve tentar novamente para métodos POST', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({
          message: 'Service unavailable',
        }),
      });

      await expect(api.post('test', {}, {})).rejects.toThrow(APIError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Validation', () => {
    it('deve validar respostas com schema Zod', async () => {
      const { z } = await import('zod');
      
      const validResponse = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: validResponse,
        }),
      });

      const schema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      });

      const result = await api.get('test', schema);
      expect(result.data).toEqual(validResponse);
    });

    it('deve rejeitar respostas que não passam na validação', async () => {
      const { z } = await import('zod');
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: {
            id: 'not-a-number',
            name: 123,
            email: 'invalid-email',
          },
        }),
      });

      const schema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      });

      await expect(api.get('test', schema)).rejects.toThrow();
    });
  });

  describe('File Upload', () => {
    it('deve fazer upload de arquivos corretamente', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            url: 'https://example.com/test.txt',
            name: 'test.txt',
            size: file.size,
          },
        }),
      });

      const { z } = await import('zod');
      const schema = z.object({
        id: z.number(),
        url: z.string().url(),
        name: z.string(),
        size: z.number(),
      });

      const result = await api.uploadFile('upload', file, schema);
      
      expect(result.data.name).toBe('test.txt');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('deve incluir campos adicionais no upload', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const additionalFields = { category: 'document', tags: 'important' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: { id: 1, url: 'test.txt' },
        }),
      });

      const { z } = await import('zod');
      const schema = z.object({ id: z.number(), url: z.string() });

      await api.uploadFile('upload', file, schema, additionalFields);

      const formData = mockFetch.mock.calls[0]![1]!.body as FormData;
      expect(formData.get('category')).toBe('document');
      expect(formData.get('tags')).toBe('important');
    });
  });

  describe('Health Check', () => {
    it('deve retornar true para servidor saudável', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const { healthCheck } = await import('../../services/api/client');
      const isHealthy = await healthCheck();
      
      expect(isHealthy).toBe(true);
    });

    it('deve retornar false para servidor não responsivo', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const { healthCheck } = await import('../../services/api/client');
      const isHealthy = await healthCheck();
      
      expect(isHealthy).toBe(false);
    });

    it('deve ter timeout curto para health check', async () => {
      const startTime = Date.now();
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const { healthCheck } = await import('../../services/api/client');
      const isHealthy = await healthCheck();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(6000); // Should timeout before 10s
      expect(isHealthy).toBe(false);
    });
  });
});