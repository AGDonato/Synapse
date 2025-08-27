import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { mockDemandas } from '../../data/mockDemandas';
import type { Demanda } from '../../types/entities';
import { useDemandasStore } from '../../stores/demandasStore';

// Simulação de API calls que em produção viriam de um backend
const api = {
  // Buscar todas as demandas
  getDemandas: async (): Promise<Demanda[]> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    return mockDemandas;
  },

  // Buscar demanda por ID
  getDemandaById: async (id: number): Promise<Demanda | undefined> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 50));
    return mockDemandas.find(d => d.id === id);
  },

  // Atualizar demanda
  updateDemanda: async (id: number, data: Partial<Demanda>): Promise<Demanda> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDemandas[index] = { ...mockDemandas[index], ...data };
      return mockDemandas[index];
    }
    throw new Error('Demanda não encontrada');
  },

  // Criar nova demanda
  createDemanda: async (data: Omit<Demanda, 'id'>): Promise<Demanda> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    const newId = Math.max(...mockDemandas.map(d => d.id)) + 1;
    const newDemanda = { ...data, id: newId };
    mockDemandas.push(newDemanda);
    return newDemanda;
  },

  // Deletar demanda
  deleteDemanda: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDemandas.splice(index, 1);
    } else {
      throw new Error('Demanda não encontrada');
    }
  }
};

// Query keys para organizar o cache
export const demandaQueryKeys = {
  all: ['demandas'] as const,
  lists: () => [...demandaQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...demandaQueryKeys.lists(), filters] as const,
  details: () => [...demandaQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...demandaQueryKeys.details(), id] as const,
};

// Hook de compatibilidade que retorna todos os dados mockados 
// A filtragem é feita na página DemandasPage
export const useDemandasData = () => {
  logger.info('🔄 useDemandasData chamado, retornando', mockDemandas.length, 'demandas');
  
  return {
    data: mockDemandas,
    isLoading: false,
    error: null,
    fetchDemandas: () => Promise.resolve(),
    createDemanda: async (data: unknown) => {
      const newId = Math.max(...mockDemandas.map(d => d.id)) + 1;
      const newDemanda = { ...data, id: newId };
      mockDemandas.push(newDemanda);
      return newDemanda;
    },
    updateDemanda: async (id: number, data: unknown) => {
      const index = mockDemandas.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDemandas[index] = { ...mockDemandas[index], ...data };
      }
    },
    deleteDemanda: async (id: number) => {
      const index = mockDemandas.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDemandas.splice(index, 1);
      }
    },
  };
};

// Hook original para buscar demandas com cache inteligente (compatibilidade)
export const useDemandas = () => {
  const queryClient = useQueryClient();

  // Query para buscar todas as demandas
  const demandas = useQuery({
    queryKey: demandaQueryKeys.lists(),
    queryFn: api.getDemandas,
    // Cache mais longo para dados que mudam pouco
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mutation para atualizar demanda
  const updateDemandaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Demanda> }) => 
      api.updateDemanda(id, data),
    onSuccess: (updatedDemanda) => {
      // Invalidar cache das listas
      queryClient.invalidateQueries({ queryKey: demandaQueryKeys.lists() });
      // Atualizar cache específico
      queryClient.setQueryData(
        demandaQueryKeys.detail(updatedDemanda.id),
        updatedDemanda
      );
    },
  });

  // Mutation para criar demanda
  const createDemandaMutation = useMutation({
    mutationFn: api.createDemanda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandaQueryKeys.lists() });
    },
  });

  // Mutation para deletar demanda
  const deleteDemandaMutation = useMutation({
    mutationFn: api.deleteDemanda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandaQueryKeys.lists() });
    },
  });

  return {
    // Dados
    demandas: demandas.data ?? [],
    isLoading: demandas.isLoading,
    isError: demandas.isError,
    error: demandas.error,
    isRefetching: demandas.isRefetching,

    // Métodos
    updateDemanda: updateDemandaMutation.mutate,
    createDemanda: createDemandaMutation.mutate,
    deleteDemanda: deleteDemandaMutation.mutate,

    // Estados das mutações
    isUpdating: updateDemandaMutation.isPending,
    isCreating: createDemandaMutation.isPending,
    isDeleting: deleteDemandaMutation.isPending,

    // Métodos utilitários
    refetch: demandas.refetch,
  };
};

// Hook específico para uma demanda
export const useDemanda = (id: number) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: demandaQueryKeys.detail(id),
    queryFn: () => api.getDemandaById(id),
    enabled: !!id,
    // Tentar usar dados do cache da lista primeiro
    initialData: () => {
      const demandas = queryClient.getQueryData<Demanda[]>(demandaQueryKeys.lists());
      return demandas?.find(d => d.id === id);
    },
  });
};