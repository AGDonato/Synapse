/**
 * Hook para gerenciamento completo de demandas
 *
 * @description
 * Fornece funcionalidades CRUD completas para demandas, incluindo:
 * - Busca de todas as demandas com cache inteligente
 * - Criação, atualização e exclusão de demandas
 * - Sistema de notificação reativo para mudanças
 * - Integração com React Query para otimização de performance
 *
 * @example
 * const { demandas, isLoading, createDemanda } = useDemandas();
 *
 * @module hooks/queries/useDemandas
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { mockDemandas } from '../../data/mockDemandas';
import type { Demanda } from '../../types/entities';
import { logger } from '../../utils/logger';

// Sistema de notificação reativo para mudanças nos dados mockados
type DataChangeListener = () => void;
const demandasListeners = new Set<DataChangeListener>();

const notifyDemandasChanged = () => {
  demandasListeners.forEach(listener => listener());
};

// Simulação de chamadas API - em produção viriam de um backend real
const api = {
  /**
   * Busca todas as demandas
   * @returns Lista completa de demandas
   */
  getDemandas: async (): Promise<Demanda[]> => {
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    return mockDemandas;
  },

  /**
   * Busca demanda específica por ID
   * @param id - ID da demanda
   * @returns Demanda encontrada ou undefined
   */
  getDemandaById: async (id: number): Promise<Demanda | undefined> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 50));
    return mockDemandas.find(d => d.id === id);
  },

  /**
   * Atualiza dados de uma demanda existente
   * @param id - ID da demanda
   * @param data - Dados parciais para atualização
   * @returns Demanda atualizada
   */
  updateDemanda: async (id: number, data: Partial<Demanda>): Promise<Demanda> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDemandas[index] = { ...mockDemandas[index], ...data };
      return mockDemandas[index];
    }
    throw new Error('Demanda não encontrada');
  },

  /**
   * Cria uma nova demanda
   * @param data - Dados da demanda (sem ID)
   * @returns Nova demanda criada com ID
   */
  createDemanda: async (data: Omit<Demanda, 'id'>): Promise<Demanda> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    const newId = Math.max(...mockDemandas.map(d => d.id)) + 1;
    const newDemanda = { ...data, id: newId };
    mockDemandas.push(newDemanda);
    return newDemanda;
  },

  /**
   * Remove uma demanda do sistema
   * @param id - ID da demanda a ser removida
   */
  deleteDemanda: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDemandas.splice(index, 1);
    } else {
      throw new Error('Demanda não encontrada');
    }
  },
};

// Chaves de consulta para organização e invalidação de cache
export const demandaQueryKeys = {
  all: ['demandas'] as const,
  lists: () => [...demandaQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...demandaQueryKeys.lists(), filters] as const,
  details: () => [...demandaQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...demandaQueryKeys.details(), id] as const,
};

/**
 * Hook de compatibilidade para acesso direto aos dados mockados
 *
 * @description
 * Retorna dados mockados com estado reativo. A filtragem é
 * realizada no componente DemandasPage. Útil para desenvolvimento
 * e testes sem backend real.
 *
 * @returns Objeto com dados e métodos CRUD
 */
export const useDemandasData = () => {
  const [, forceUpdate] = useState(0);

  // Registra listener para mudanças reativas nos dados
  useEffect(() => {
    const listener = () => {
      forceUpdate(prev => prev + 1);
    };

    demandasListeners.add(listener);

    return () => {
      demandasListeners.delete(listener);
    };
  }, []);

  logger.info('🔄 useDemandasData chamado, retornando', mockDemandas.length, 'demandas');

  return {
    data: mockDemandas,
    isLoading: false,
    error: null,
    fetchDemandas: () => Promise.resolve(),
    createDemanda: async (data: Partial<Demanda>) => {
      const newId = Math.max(...mockDemandas.map(d => d.id)) + 1;
      const newDemanda = { ...data, id: newId } as Demanda;
      mockDemandas.push(newDemanda);
      notifyDemandasChanged(); // Notifica componentes sobre mudança
      return newDemanda;
    },
    updateDemanda: async (id: number, data: Partial<Demanda>) => {
      const index = mockDemandas.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDemandas[index] = { ...mockDemandas[index], ...data };
        notifyDemandasChanged(); // Notifica componentes sobre mudança
      }
    },
    deleteDemanda: async (id: number) => {
      const index = mockDemandas.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDemandas.splice(index, 1);
        notifyDemandasChanged(); // Notifica componentes sobre mudança
      }
    },
  };
};

/**
 * Hook principal para gerenciamento de demandas com React Query
 *
 * @description
 * Fornece interface completa para operações CRUD com cache
 * inteligente, otimização de performance e estados de loading.
 *
 * @returns {
 *   demandas: Array de demandas
 *   isLoading: Estado de carregamento
 *   createDemanda: Função para criar demanda
 *   updateDemanda: Função para atualizar demanda
 *   deleteDemanda: Função para deletar demanda
 *   refetch: Função para recarregar dados
 * }
 */
export const useDemandas = () => {
  const queryClient = useQueryClient();

  // Query principal para buscar todas as demandas
  const demandas = useQuery({
    queryKey: demandaQueryKeys.lists(),
    queryFn: api.getDemandas,
    // Cache estendido para dados com baixa frequência de mudança
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mutation para atualização de demanda existente
  const updateDemandaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Demanda> }) =>
      api.updateDemanda(id, data),
    onSuccess: updatedDemanda => {
      // Invalida cache das listas para forçar atualização
      queryClient.invalidateQueries({ queryKey: demandaQueryKeys.lists() });
      // Atualiza cache específico da demanda
      queryClient.setQueryData(demandaQueryKeys.detail(updatedDemanda.id), updatedDemanda);
    },
  });

  // Mutation para criação de nova demanda
  const createDemandaMutation = useMutation({
    mutationFn: api.createDemanda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandaQueryKeys.lists() });
    },
  });

  // Mutation para exclusão de demanda
  const deleteDemandaMutation = useMutation({
    mutationFn: api.deleteDemanda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandaQueryKeys.lists() });
    },
  });

  return {
    // Dados principais
    demandas: demandas.data ?? [],
    isLoading: demandas.isLoading,
    isError: demandas.isError,
    error: demandas.error,
    isRefetching: demandas.isRefetching,

    // Métodos de manipulação
    updateDemanda: updateDemandaMutation.mutate,
    createDemanda: createDemandaMutation.mutate,
    deleteDemanda: deleteDemandaMutation.mutate,

    // Estados de loading das operações
    isUpdating: updateDemandaMutation.isPending,
    isCreating: createDemandaMutation.isPending,
    isDeleting: deleteDemandaMutation.isPending,

    // Métodos auxiliares
    refetch: demandas.refetch,
  };
};

/**
 * Hook para buscar uma demanda específica
 *
 * @param id - ID da demanda desejada
 * @returns Query result com a demanda ou undefined
 */
export const useDemanda = (id: number) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: demandaQueryKeys.detail(id),
    queryFn: () => api.getDemandaById(id),
    enabled: !!id,
    // Otimização: tenta usar dados do cache da lista primeiro
    initialData: () => {
      const demandas = queryClient.getQueryData<Demanda[]>(demandaQueryKeys.lists());
      return demandas?.find(d => d.id === id);
    },
  });
};
