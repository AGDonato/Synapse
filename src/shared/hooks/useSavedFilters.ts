/**
 * Hook para gerenciamento de filtros salvos
 *
 * @description
 * Permite salvar e carregar configurações de filtros:
 * - Salvamento no localStorage com persistência
 * - Filtros padrão e personalizados
 * - Histórico de uso (data de criação e último uso)
 * - Limite de filtros salvos para gerenciar espaço
 * - Ordenação por uso recente
 *
 * @example
 * const filters = useSavedFilters({
 *   storageKey: 'demandas_filters',
 *   maxSavedFilters: 15
 * });
 *
 * // Salvar filtro atual
 * filters.saveFilter({
 *   name: 'Demandas Pendentes',
 *   filters: { status: 'pending', tipo: 'judicial' }
 * });
 *
 * // Carregar filtro salvo
 * filters.loadFilter('filter-123');
 *
 * @module hooks/useSavedFilters
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../../shared/utils/logger';

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
  lastUsed?: string;
  isDefault?: boolean;
}

interface UseSavedFiltersOptions {
  storageKey: string;
  maxSavedFilters?: number;
}

/**
 * Hook principal para filtros salvos
 *
 * @param options - Opções de configuração:
 *   - storageKey: Chave para localStorage
 *   - maxSavedFilters: Máximo de filtros salvos (padrão: 10)
 * @returns Objeto com filtros e métodos de gerenciamento
 */
export function useSavedFilters({ storageKey, maxSavedFilters = 10 }: UseSavedFiltersOptions) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega filtros salvos do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const filters = JSON.parse(stored) as SavedFilter[];
        setSavedFilters(
          filters.sort(
            (a, b) =>
              new Date(b.lastUsed ?? b.createdAt).getTime() -
              new Date(a.lastUsed ?? a.createdAt).getTime()
          )
        );
      }
    } catch (error) {
      logger.error('Erro ao carregar filtros salvos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Salva filtros no localStorage
  const saveFiltersToStorage = useCallback(
    (filters: SavedFilter[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(filters));
      } catch (error) {
        logger.error('Erro ao salvar filtros:', error);
      }
    },
    [storageKey]
  );

  /**
   * Salva um novo filtro
   * @param name - Nome do filtro
   * @param filters - Configurações do filtro
   * @returns Filtro criado
   */
  const saveFilter = useCallback(
    (name: string, filters: Record<string, unknown>) => {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name,
        filters,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      setSavedFilters(prev => {
        const updated = [newFilter, ...prev].slice(0, maxSavedFilters);
        saveFiltersToStorage(updated);
        return updated;
      });

      return newFilter;
    },
    [maxSavedFilters, saveFiltersToStorage]
  );

  /**
   * Atualiza um filtro existente
   * @param id - ID do filtro
   * @param name - Novo nome
   * @param filters - Novas configurações
   */
  const updateFilter = useCallback(
    (id: string, name: string, filters: Record<string, unknown>) => {
      setSavedFilters(prev => {
        const updated = prev.map(filter =>
          filter.id === id
            ? { ...filter, name, filters, lastUsed: new Date().toISOString() }
            : filter
        );
        saveFiltersToStorage(updated);
        return updated;
      });
    },
    [saveFiltersToStorage]
  );

  /**
   * Remove um filtro salvo
   * @param id - ID do filtro a remover
   */
  const deleteFilter = useCallback(
    (id: string) => {
      setSavedFilters(prev => {
        const updated = prev.filter(filter => filter.id !== id);
        saveFiltersToStorage(updated);
        return updated;
      });
    },
    [saveFiltersToStorage]
  );

  /**
   * Aplica um filtro salvo (atualiza data de último uso)
   * @param id - ID do filtro
   * @returns Filtro aplicado ou null
   */
  const applyFilter = useCallback(
    (id: string) => {
      const filter = savedFilters.find(f => f.id === id);
      if (!filter) {
        return null;
      }

      setSavedFilters(prev => {
        const updated = prev.map(f =>
          f.id === id ? { ...f, lastUsed: new Date().toISOString() } : f
        );
        saveFiltersToStorage(updated);
        return updated;
      });

      return filter;
    },
    [savedFilters, saveFiltersToStorage]
  );

  /**
   * Define um filtro como padrão
   * @param id - ID do filtro (null para remover padrão)
   */
  const setDefaultFilter = useCallback(
    (id: string | null) => {
      setSavedFilters(prev => {
        const updated = prev.map(filter => ({
          ...filter,
          isDefault: filter.id === id,
        }));
        saveFiltersToStorage(updated);
        return updated;
      });
    },
    [saveFiltersToStorage]
  );

  /**
   * Obtém o filtro marcado como padrão
   * @returns Filtro padrão ou null
   */
  const getDefaultFilter = useCallback(() => {
    return savedFilters.find(filter => filter.isDefault) ?? null;
  }, [savedFilters]);

  /**
   * Verifica se as configurações correspondem a um filtro salvo
   * @param filters - Configurações a verificar
   * @returns Filtro correspondente ou undefined
   */
  const findMatchingFilter = useCallback(
    (filters: Record<string, unknown>) => {
      return savedFilters.find(saved => JSON.stringify(saved.filters) === JSON.stringify(filters));
    },
    [savedFilters]
  );

  /**
   * Obtém filtros usados recentemente
   * @param limit - Quantidade máxima (padrão: 5)
   * @returns Array de filtros ordenados por uso recente
   */
  const getRecentFilters = useCallback(
    (limit = 5) => {
      return savedFilters
        .filter(filter => filter.lastUsed)
        .sort((a, b) => {
          // Já filtramos por lastUsed, então ambos têm esse campo
          const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
    },
    [savedFilters]
  );

  /**
   * Remove todos os filtros salvos
   */
  const clearAllFilters = useCallback(() => {
    setSavedFilters([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.error('Erro ao limpar filtros:', error);
    }
  }, [storageKey]);

  return {
    savedFilters,
    isLoading,
    saveFilter,
    updateFilter,
    deleteFilter,
    applyFilter,
    setDefaultFilter,
    getDefaultFilter,
    findMatchingFilter,
    getRecentFilters,
    clearAllFilters,
  };
}
