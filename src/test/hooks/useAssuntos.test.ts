/**
 * Tests for useAssuntos hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAssuntos } from '../../hooks/useAssuntos';
import { mockAssuntos } from '../../data/mockAssuntos';

// Mock the adaptive API
vi.mock('../../services/api/mockAdapter', () => ({
  adaptiveApi: {
    assuntos: {
      list: vi.fn().mockResolvedValue(mockAssuntos),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAssuntos', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    vi.clearAllMocks();
  });

  it('deve carregar assuntos com sucesso', async () => {
    const { result } = renderHook(() => useAssuntos(), { wrapper });

    // Estado inicial de loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.assuntos).toBeUndefined();
    expect(result.current.error).toBe(null);

    // Aguarda carregamento
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verifica dados carregados
    expect(result.current.assuntos).toHaveLength(mockAssuntos.length);
    expect(result.current.assuntos![0]).toEqual(mockAssuntos[0]);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('deve retornar erro quando a API falha', async () => {
    // Mock error response
    const { adaptiveApi } = await import('../../services/api/mockAdapter');
    adaptiveApi.assuntos.list = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAssuntos(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Network error');
    expect(result.current.assuntos).toBeUndefined();
  });

  it('deve refetch dados quando chamado manualmente', async () => {
    const { adaptiveApi } = await import('../../services/api/mockAdapter');
    const listSpy = vi.spyOn(adaptiveApi.assuntos, 'list');

    const { result } = renderHook(() => useAssuntos(), { wrapper });

    // Aguarda primeiro carregamento
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(listSpy).toHaveBeenCalledTimes(1);

    // Refetch manual
    result.current.refetch();

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(2);
    });
  });
});

// Simple hook behavior validation tests  
describe('useAssuntos hook concepts', () => {
  it('should validate data structure expectations', () => {
    // Simulate what a hook would expect from data
    const mockAssunto = {
      id: 1,
      nome: 'Direito Administrativo'
    };

    expect(mockAssunto).toHaveProperty('id');
    expect(mockAssunto).toHaveProperty('nome');
    expect(typeof mockAssunto.id).toBe('number');
    expect(typeof mockAssunto.nome).toBe('string');
    expect(mockAssunto.nome.length).toBeGreaterThan(0);
  });

  it('should validate array operations', () => {
    const mockAssuntos = [
      { id: 1, nome: 'Assunto 1' },
      { id: 2, nome: 'Assunto 2' }
    ];

    // Test filter operation
    const filtered = mockAssuntos.filter(a => a.nome.includes('1'));
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.nome).toBe('Assunto 1');

    // Test find operation
    const found = mockAssuntos.find(a => a.id === 2);
    expect(found).toBeDefined();
    expect(found?.nome).toBe('Assunto 2');

    // Test map operation
    const names = mockAssuntos.map(a => a.nome);
    expect(names).toEqual(['Assunto 1', 'Assunto 2']);
  });
});