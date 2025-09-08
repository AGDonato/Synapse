/**
 * Hook para gerenciamento completo de documentos
 *
 * @description
 * Fornece funcionalidades CRUD completas para documentos, incluindo:
 * - Busca de documentos com filtros e cache inteligente
 * - Criação, atualização e exclusão de documentos
 * - Busca de documentos por demanda associada
 * - Sistema de notificação reativo para mudanças
 * - Integração com React Query para otimização
 *
 * @example
 * const { data: documentos, isLoading } = useDocumentosData();
 *
 * @module hooks/queries/useDocumentos
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { mockDocumentos, type DocumentoDemanda } from '../../data/mockDocumentos';
import { logger } from '../../utils/logger';

// Sistema de notificação reativo para mudanças nos documentos
type DataChangeListener = () => void;
const documentosListeners = new Set<DataChangeListener>();

const notifyDocumentosChanged = () => {
  documentosListeners.forEach(listener => listener());
};

// Simulação de chamadas API - em produção viriam de um backend real
const api = {
  /**
   * Busca todos os documentos
   * @returns Lista completa de documentos
   */
  getDocumentos: async (): Promise<DocumentoDemanda[]> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    return mockDocumentos;
  },

  /**
   * Busca documento específico por ID
   * @param id - ID do documento
   * @returns Documento encontrado ou undefined
   */
  getDocumentoById: async (id: number): Promise<DocumentoDemanda | undefined> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    return mockDocumentos.find(d => d.id === id);
  },

  /**
   * Busca documentos associados a uma demanda
   * @param demandaId - ID da demanda
   * @returns Lista de documentos da demanda
   */
  getDocumentosByDemandaId: async (demandaId: number): Promise<DocumentoDemanda[]> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 50));
    return mockDocumentos.filter(d => d.demandaId === demandaId);
  },

  /**
   * Atualiza dados de um documento existente
   * @param id - ID do documento
   * @param data - Dados parciais para atualização
   * @returns Documento atualizado
   */
  updateDocumento: async (
    id: number,
    data: Partial<DocumentoDemanda>
  ): Promise<DocumentoDemanda> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    const index = mockDocumentos.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDocumentos[index] = { ...mockDocumentos[index], ...data };
      return mockDocumentos[index];
    }
    throw new Error('Documento não encontrado');
  },

  /**
   * Cria um novo documento
   * @param data - Dados do documento (sem ID)
   * @returns Novo documento criado com ID
   */
  createDocumento: async (data: Omit<DocumentoDemanda, 'id'>): Promise<DocumentoDemanda> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    const newId = Math.max(...mockDocumentos.map(d => d.id)) + 1;
    const newDocumento = { ...data, id: newId };
    mockDocumentos.push(newDocumento);
    return newDocumento;
  },

  /**
   * Remove um documento do sistema
   * @param id - ID do documento a ser removido
   */
  deleteDocumento: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    const index = mockDocumentos.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDocumentos.splice(index, 1);
    } else {
      throw new Error('Documento não encontrado');
    }
  },
};

// Chaves de consulta para organização e invalidação de cache
export const documentoQueryKeys = {
  all: ['documentos'] as const,
  lists: () => [...documentoQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...documentoQueryKeys.lists(), filters] as const,
  byDemanda: (demandaId: number) => [...documentoQueryKeys.all, 'byDemanda', demandaId] as const,
  details: () => [...documentoQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentoQueryKeys.details(), id] as const,
};

/**
 * Hook de compatibilidade para acesso direto aos dados mockados
 *
 * @description
 * Retorna dados mockados de documentos com estado reativo.
 * Útil para desenvolvimento e testes sem backend real.
 * Inclui funções auxiliares para busca e manipulação.
 *
 * @returns Objeto com dados e métodos CRUD para documentos
 */
export const useDocumentosData = () => {
  const [, forceUpdate] = useState(0);

  // Registra listener para mudanças reativas nos dados
  useEffect(() => {
    const listener = () => {
      forceUpdate(prev => prev + 1);
    };

    documentosListeners.add(listener);

    return () => {
      documentosListeners.delete(listener);
    };
  }, []);

  logger.info('📄 useDocumentosData chamado, retornando', mockDocumentos.length, 'documentos');

  /**
   * Busca documentos associados a uma demanda específica
   * @param demandaId - ID da demanda
   * @returns Array de documentos filtrados
   */
  const getDocumentosByDemandaId = (demandaId: number): DocumentoDemanda[] => {
    return mockDocumentos.filter(doc => doc.demandaId === demandaId);
  };

  return {
    data: mockDocumentos,
    isLoading: false,
    error: null,
    getDocumentosByDemandaId,
    fetchDocumentos: () => Promise.resolve(),
    createDocumento: async (data: Partial<DocumentoDemanda>) => {
      const newId = Math.max(...mockDocumentos.map(d => d.id)) + 1;
      const newDocumento = { ...data, id: newId } as DocumentoDemanda;
      mockDocumentos.push(newDocumento);
      notifyDocumentosChanged(); // Notificar mudança
      return newDocumento;
    },
    updateDocumento: async (id: number, data: Partial<DocumentoDemanda>) => {
      const index = mockDocumentos.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDocumentos[index] = { ...mockDocumentos[index], ...data };
        notifyDocumentosChanged(); // Notificar mudança
      }
    },
    deleteDocumento: async (id: number) => {
      const index = mockDocumentos.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDocumentos.splice(index, 1);
        notifyDocumentosChanged(); // Notificar mudança
      }
    },
  };
};

// Hook original para documentos (compatibilidade)
export const useDocumentos = () => {
  const queryClient = useQueryClient();

  const documentos = useQuery({
    queryKey: documentoQueryKeys.lists(),
    queryFn: api.getDocumentos,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const updateDocumentoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DocumentoDemanda> }) =>
      api.updateDocumento(id, data),
    onSuccess: updatedDocumento => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: documentoQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentoQueryKeys.byDemanda(updatedDocumento.demandaId),
      });
      // Atualizar cache específico
      queryClient.setQueryData(documentoQueryKeys.detail(updatedDocumento.id), updatedDocumento);
    },
  });

  const createDocumentoMutation = useMutation({
    mutationFn: api.createDocumento,
    onSuccess: newDocumento => {
      queryClient.invalidateQueries({ queryKey: documentoQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentoQueryKeys.byDemanda(newDocumento.demandaId),
      });
    },
  });

  const deleteDocumentoMutation = useMutation({
    mutationFn: api.deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentoQueryKeys.lists() });
    },
  });

  /**
   * Busca documentos associados a uma demanda específica
   * @param demandaId - ID da demanda
   * @returns Array de documentos filtrados
   */
  const getDocumentosByDemandaId = (demandaId: number): DocumentoDemanda[] => {
    const allDocumentos = documentos.data ?? [];
    return allDocumentos.filter(doc => doc.demandaId === demandaId);
  };

  return {
    // Dados
    documentos: documentos.data ?? [],
    isLoading: documentos.isLoading,
    isError: documentos.isError,
    error: documentos.error,
    isRefetching: documentos.isRefetching,

    // Métodos
    updateDocumento: updateDocumentoMutation.mutate,
    createDocumento: createDocumentoMutation.mutate,
    deleteDocumento: deleteDocumentoMutation.mutate,
    getDocumentosByDemandaId,

    // Estados das mutações
    isUpdating: updateDocumentoMutation.isPending,
    isCreating: createDocumentoMutation.isPending,
    isDeleting: deleteDocumentoMutation.isPending,

    // Métodos utilitários
    refetch: documentos.refetch,
  };
};

// Hook para documentos de uma demanda específica
export const useDocumentosByDemanda = (demandaId: number) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: documentoQueryKeys.byDemanda(demandaId),
    queryFn: () => api.getDocumentosByDemandaId(demandaId),
    enabled: !!demandaId,
    // Tentar usar dados do cache geral primeiro
    initialData: () => {
      const allDocumentos = queryClient.getQueryData<DocumentoDemanda[]>(
        documentoQueryKeys.lists()
      );
      return allDocumentos?.filter(d => d.demandaId === demandaId);
    },
  });
};

// Hook para um documento específico
export const useDocumento = (id: number) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: documentoQueryKeys.detail(id),
    queryFn: () => api.getDocumentoById(id),
    enabled: !!id,
    initialData: () => {
      const documentos = queryClient.getQueryData<DocumentoDemanda[]>(documentoQueryKeys.lists());
      return documentos?.find(d => d.id === id);
    },
  });
};
