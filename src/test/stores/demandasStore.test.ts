/**
 * Testes unitários para o DemandasStore
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDemandasStore } from '../../stores/demandasStore';
import { adaptiveApi } from '../../services/api/mockAdapter';
import type { Demanda } from '../../services/api/schemas';

// Mock do adaptiveApi
vi.mock('../../services/api/mockAdapter', () => ({
  adaptiveApi: {
    demandas: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('DemandasStore', () => {
  // Dados de teste
  const mockDemanda: Demanda = {
    id: 1,
    numero: 'DEM-2024-001',
    titulo: 'Demanda de Teste',
    descricao: 'Descrição da demanda de teste',
    tipo_demanda_id: 1,
    orgao_solicitante_id: 1,
    assunto_id: 1,
    prioridade: 'alta',
    status: 'aberta',
    data_abertura: new Date('2024-01-01'),
    data_prazo: new Date('2024-01-31'),
    data_conclusao: null,
    observacoes: null,
    autos_administrativos: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockListResponse = {
    data: [mockDemanda],
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 1,
    },
  };

  beforeEach(() => {
    // Limpar o store antes de cada teste
    const { reset } = useDemandasStore.getState();
    act(() => {
      reset();
    });
    
    // Limpar todos os mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Estado Inicial', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      expect(result.current.demandas).toEqual([]);
      expect(result.current.selectedDemanda).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.pageSize).toBe(10);
    });
  });

  describe('fetchDemandas', () => {
    it('deve buscar demandas com sucesso', async () => {
      vi.mocked(adaptiveApi.demandas.list).mockResolvedValueOnce(mockListResponse);
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.fetchDemandas();
      });
      
      expect(adaptiveApi.demandas.list).toHaveBeenCalledWith({
        page: 1,
        per_page: 10,
        sort_by: 'updated_at',
        sort_direction: 'desc',
      });
      
      expect(result.current.demandas).toEqual([mockDemanda]);
      expect(result.current.pagination.total).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve aplicar filtros ao buscar demandas', async () => {
      vi.mocked(adaptiveApi.demandas.list).mockResolvedValueOnce(mockListResponse);
      
      const { result } = renderHook(() => useDemandasStore());
      
      const filters = {
        status: ['aberta', 'em_andamento'] as any,
        prioridade: ['alta'] as any,
        search: 'teste',
      };
      
      await act(async () => {
        await result.current.fetchDemandas(filters);
      });
      
      expect(adaptiveApi.demandas.list).toHaveBeenCalledWith(
        expect.objectContaining(filters)
      );
    });

    it('deve lidar com erro ao buscar demandas', async () => {
      const errorMessage = 'Erro ao buscar demandas';
      vi.mocked(adaptiveApi.demandas.list).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.fetchDemandas();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.demandas).toEqual([]);
    });

    it('deve usar cache quando disponível', async () => {
      vi.mocked(adaptiveApi.demandas.list).mockResolvedValueOnce(mockListResponse);
      
      const { result } = renderHook(() => useDemandasStore());
      
      // Primeira chamada - deve buscar do servidor
      await act(async () => {
        await result.current.fetchDemandas();
      });
      
      expect(adaptiveApi.demandas.list).toHaveBeenCalledTimes(1);
      
      // Segunda chamada imediata - deve usar cache
      await act(async () => {
        await result.current.fetchDemandas();
      });
      
      // Não deve chamar a API novamente (cache ainda válido)
      expect(adaptiveApi.demandas.list).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchDemandaById', () => {
    it('deve buscar demanda por ID com sucesso', async () => {
      vi.mocked(adaptiveApi.demandas.getById).mockResolvedValueOnce(mockDemanda);
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.fetchDemandaById(1);
      });
      
      expect(adaptiveApi.demandas.getById).toHaveBeenCalledWith(1);
      expect(result.current.selectedDemanda).toEqual(mockDemanda);
      expect(result.current.isLoading).toBe(false);
    });

    it('deve usar cache quando demanda já foi carregada', async () => {
      vi.mocked(adaptiveApi.demandas.getById).mockResolvedValueOnce(mockDemanda);
      
      const { result } = renderHook(() => useDemandasStore());
      
      // Primeira busca
      await act(async () => {
        await result.current.fetchDemandaById(1);
      });
      
      expect(adaptiveApi.demandas.getById).toHaveBeenCalledTimes(1);
      
      // Segunda busca - deve usar cache
      await act(async () => {
        await result.current.fetchDemandaById(1);
      });
      
      // Não deve chamar API novamente
      expect(adaptiveApi.demandas.getById).toHaveBeenCalledTimes(1);
      expect(result.current.selectedDemanda).toEqual(mockDemanda);
    });

    it('deve lidar com erro ao buscar demanda por ID', async () => {
      const errorMessage = 'Demanda não encontrada';
      vi.mocked(adaptiveApi.demandas.getById).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.fetchDemandaById(999);
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.selectedDemanda).toBeNull();
    });
  });

  describe('createDemanda', () => {
    const newDemandaData = {
      numero: 'DEM-2024-002',
      titulo: 'Nova Demanda',
      descricao: 'Descrição da nova demanda',
      tipo_demanda_id: 1,
      orgao_solicitante_id: 1,
      assunto_id: 1,
      prioridade: 'media' as const,
      status: 'aberta' as const,
      data_abertura: new Date('2024-01-15'),
      data_prazo: new Date('2024-02-15'),
    };

    it('deve criar nova demanda com sucesso', async () => {
      const createdDemanda = { ...mockDemanda, id: 2, ...newDemandaData };
      vi.mocked(adaptiveApi.demandas.create).mockResolvedValueOnce(createdDemanda);
      
      const { result } = renderHook(() => useDemandasStore());
      
      let createdResult: Demanda | undefined;
      
      await act(async () => {
        createdResult = await result.current.createDemanda(newDemandaData);
      });
      
      expect(adaptiveApi.demandas.create).toHaveBeenCalledWith(newDemandaData);
      expect(createdResult).toEqual(createdDemanda);
      expect(result.current.demandas).toContainEqual(createdDemanda);
      expect(result.current.pagination.total).toBe(1);
    });

    it('deve invalidar cache após criar demanda', async () => {
      const createdDemanda = { ...mockDemanda, id: 2, ...newDemandaData };
      vi.mocked(adaptiveApi.demandas.create).mockResolvedValueOnce(createdDemanda);
      
      const { result } = renderHook(() => useDemandasStore());
      
      // Setar lastFetch para simular cache
      act(() => {
        result.current.lastFetch = Date.now();
      });
      
      await act(async () => {
        await result.current.createDemanda(newDemandaData);
      });
      
      expect(result.current.lastFetch).toBeNull();
    });

    it('deve lidar com erro ao criar demanda', async () => {
      const errorMessage = 'Erro ao criar demanda';
      vi.mocked(adaptiveApi.demandas.create).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useDemandasStore());
      
      await expect(
        act(async () => {
          await result.current.createDemanda(newDemandaData);
        })
      ).rejects.toThrow(errorMessage);
      
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('updateDemanda', () => {
    const updateData = {
      titulo: 'Título Atualizado',
      status: 'em_andamento' as const,
    };

    it('deve atualizar demanda com sucesso', async () => {
      const updatedDemanda = { ...mockDemanda, ...updateData };
      vi.mocked(adaptiveApi.demandas.update).mockResolvedValueOnce(updatedDemanda);
      
      const { result } = renderHook(() => useDemandasStore());
      
      // Adicionar demanda ao store primeiro
      act(() => {
        result.current.demandas = [mockDemanda];
        result.current.selectedDemanda = mockDemanda;
      });
      
      await act(async () => {
        await result.current.updateDemanda(1, updateData);
      });
      
      expect(adaptiveApi.demandas.update).toHaveBeenCalledWith(1, updateData);
      expect(result.current.demandas[0]).toEqual(updatedDemanda);
      expect(result.current.selectedDemanda).toEqual(updatedDemanda);
    });

    it('deve atualizar cache após update', async () => {
      const updatedDemanda = { ...mockDemanda, ...updateData };
      vi.mocked(adaptiveApi.demandas.update).mockResolvedValueOnce(updatedDemanda);
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.updateDemanda(1, updateData);
      });
      
      // Verificar se cache foi atualizado
      const cached = result.current.cache.get(1);
      expect(cached).toEqual(updatedDemanda);
    });

    it('deve lidar com erro ao atualizar demanda', async () => {
      const errorMessage = 'Erro ao atualizar';
      vi.mocked(adaptiveApi.demandas.update).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.updateDemanda(1, updateData);
      });
      
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteDemanda', () => {
    it('deve deletar demanda com sucesso', async () => {
      vi.mocked(adaptiveApi.demandas.delete).mockResolvedValueOnce(undefined);
      
      const { result } = renderHook(() => useDemandasStore());
      
      // Adicionar demanda ao store
      act(() => {
        result.current.demandas = [mockDemanda];
        result.current.selectedDemanda = mockDemanda;
        result.current.pagination.total = 1;
      });
      
      await act(async () => {
        await result.current.deleteDemanda(1);
      });
      
      expect(adaptiveApi.demandas.delete).toHaveBeenCalledWith(1);
      expect(result.current.demandas).toEqual([]);
      expect(result.current.selectedDemanda).toBeNull();
      expect(result.current.pagination.total).toBe(0);
    });

    it('deve remover do cache após deletar', async () => {
      vi.mocked(adaptiveApi.demandas.delete).mockResolvedValueOnce(undefined);
      
      const { result } = renderHook(() => useDemandasStore());
      
      // Adicionar ao cache
      act(() => {
        result.current.cache.set(1, mockDemanda);
      });
      
      await act(async () => {
        await result.current.deleteDemanda(1);
      });
      
      expect(result.current.cache.has(1)).toBe(false);
    });

    it('deve lidar com erro ao deletar demanda', async () => {
      const errorMessage = 'Erro ao deletar';
      vi.mocked(adaptiveApi.demandas.delete).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        await result.current.deleteDemanda(1);
      });
      
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Ações de UI', () => {
    it('deve selecionar demanda', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      act(() => {
        result.current.setSelectedDemanda(mockDemanda);
      });
      
      expect(result.current.selectedDemanda).toEqual(mockDemanda);
    });

    it('deve limpar demanda selecionada', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      act(() => {
        result.current.setSelectedDemanda(mockDemanda);
        result.current.setSelectedDemanda(null);
      });
      
      expect(result.current.selectedDemanda).toBeNull();
    });

    it('deve atualizar filtros', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      const newFilters = {
        status: ['concluida'] as any,
        search: 'busca teste',
      };
      
      act(() => {
        result.current.setFilters(newFilters);
      });
      
      expect(result.current.filters.status).toEqual(['concluida']);
      expect(result.current.filters.search).toBe('busca teste');
      expect(result.current.lastFetch).toBeNull(); // Cache invalidado
    });

    it('deve mudar página', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      act(() => {
        result.current.setPage(3);
      });
      
      expect(result.current.filters.page).toBe(3);
      expect(result.current.pagination.page).toBe(3);
      expect(result.current.lastFetch).toBeNull();
    });

    it('deve limpar erro', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      act(() => {
        result.current.error = 'Erro teste';
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });

    it('deve resetar store completamente', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      // Modificar estado
      act(() => {
        result.current.demandas = [mockDemanda];
        result.current.selectedDemanda = mockDemanda;
        result.current.error = 'Erro teste';
        result.current.filters.page = 5;
      });
      
      // Resetar
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.demandas).toEqual([]);
      expect(result.current.selectedDemanda).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.filters.page).toBe(1);
    });
  });

  describe('Computed Properties', () => {
    it('deve filtrar demandas por busca', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      const demanda1 = { ...mockDemanda, id: 1, titulo: 'Primeira Demanda' };
      const demanda2 = { ...mockDemanda, id: 2, titulo: 'Segunda Demanda' };
      const demanda3 = { ...mockDemanda, id: 3, numero: 'DEM-ESPECIAL-001' };
      
      act(() => {
        result.current.demandas = [demanda1, demanda2, demanda3];
        result.current.filters.search = 'segunda';
      });
      
      expect(result.current.filteredDemandas).toHaveLength(1);
      expect(result.current.filteredDemandas[0]).toEqual(demanda2);
      
      // Buscar por número
      act(() => {
        result.current.filters.search = 'ESPECIAL';
      });
      
      expect(result.current.filteredDemandas).toHaveLength(1);
      expect(result.current.filteredDemandas[0]).toEqual(demanda3);
    });

    it('deve agrupar demandas por status', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      const demandaAberta = { ...mockDemanda, id: 1, status: 'aberta' as const };
      const demandaAndamento1 = { ...mockDemanda, id: 2, status: 'em_andamento' as const };
      const demandaAndamento2 = { ...mockDemanda, id: 3, status: 'em_andamento' as const };
      const demandaConcluida = { ...mockDemanda, id: 4, status: 'concluida' as const };
      
      act(() => {
        result.current.demandas = [demandaAberta, demandaAndamento1, demandaAndamento2, demandaConcluida];
      });
      
      const byStatus = result.current.demandasByStatus;
      
      expect(byStatus['aberta']).toHaveLength(1);
      expect(byStatus['em_andamento']).toHaveLength(2);
      expect(byStatus['concluida']).toHaveLength(1);
      expect(byStatus['cancelada']).toBeUndefined();
    });

    it('deve retornar total count correto', () => {
      const { result } = renderHook(() => useDemandasStore());
      
      act(() => {
        result.current.pagination.total = 42;
      });
      
      expect(result.current.totalCount).toBe(42);
    });
  });

  describe('Hooks Auxiliares', () => {
    it('useDemandasData deve retornar dados filtrados', () => {
      const { result } = renderHook(() => {
        const store = useDemandasStore();
        return store.filteredDemandas;
      });
      
      act(() => {
        useDemandasStore.getState().demandas = [mockDemanda];
      });
      
      expect(result.current).toContainEqual(mockDemanda);
    });

    it('useDemandasByStatus deve retornar demandas agrupadas', () => {
      const { result } = renderHook(() => {
        const store = useDemandasStore();
        return store.demandasByStatus;
      });
      
      const demandas = [
        { ...mockDemanda, id: 1, status: 'aberta' as const },
        { ...mockDemanda, id: 2, status: 'aberta' as const },
      ];
      
      act(() => {
        useDemandasStore.getState().demandas = demandas;
      });
      
      expect(result.current['aberta']).toHaveLength(2);
    });
  });
});