/**
 * Hook para gerenciamento de filtros de provedores
 *
 * @description
 * Controla filtros e limites de exibição para provedores:
 * - Filtro por tipo (decisão judicial ou administrativo)
 * - Limite de quantidade de provedores exibidos
 * - Geração automática de subtítulos descritivos
 * - Estado dos filtros ativos
 *
 * @example
 * const filters = useProviderFilters();
 *
 * // Alternar entre tipos
 * filters.toggleFilter('decisaoJudicial');
 *
 * // Definir limite de exibição
 * filters.setProviderLimit(10);
 *
 * // Obter descrição dos filtros ativos
 * const subtitle = filters.getSubtitle(); // "Decisão Judicial"
 *
 * @module hooks/useProviderFilters
 */

import { useState } from 'react';

export interface FilterState {
  decisaoJudicial: boolean;
  administrativo: boolean;
}

export type ProviderLimitType = 5 | 10 | 'all';

export interface UseProviderFiltersReturn {
  filters: FilterState;
  toggleFilter: (filterType: keyof FilterState) => void;
  getSubjects: () => string[];
  getSubtitle: () => string;
  providerLimit: ProviderLimitType;
  setProviderLimit: (limit: ProviderLimitType) => void;
  getLimitSubtitle: () => string;
}

/**
 * Hook principal para filtros de provedores
 *
 * @param initialState - Estado inicial dos filtros (padrão: decisão judicial ativo)
 * @param initialLimit - Limite inicial de provedores (padrão: todos)
 * @returns Objeto com estados e métodos de controle de filtros
 */
export function useProviderFilters(
  initialState: FilterState = {
    decisaoJudicial: true,
    administrativo: false,
  },
  initialLimit: ProviderLimitType = 'all'
): UseProviderFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(initialState);
  const [providerLimit, setProviderLimit] = useState<ProviderLimitType>(initialLimit);

  /**
   * Alterna entre os tipos de filtro (mutuamente exclusivos)
   * @param filterType - Tipo do filtro a ativar
   */
  const toggleFilter = (filterType: keyof FilterState) => {
    setFilters(prev => {
      if (filterType === 'decisaoJudicial') {
        return {
          decisaoJudicial: true,
          administrativo: false,
        };
      } else if (filterType === 'administrativo') {
        return {
          decisaoJudicial: false,
          administrativo: true,
        };
      }
      return prev;
    });
  };

  /**
   * Retorna lista de assuntos ativos nos filtros
   * @returns Array com os tipos de filtros ativos
   */
  const getSubjects = () => {
    const decisaoJudicialSubjects = ['Encaminhamento de decisão judicial'];
    const administrativoSubjects = [
      'Requisição de dados cadastrais',
      'Requisição de dados cadastrais e preservação de dados',
      'Solicitação de dados cadastrais',
    ];

    const allowedSubjects: string[] = [];
    if (filters.decisaoJudicial) {
      allowedSubjects.push(...decisaoJudicialSubjects);
    }
    if (filters.administrativo) {
      allowedSubjects.push(...administrativoSubjects);
    }

    return allowedSubjects;
  };

  /**
   * Gera subtítulo descritivo dos filtros ativos
   * @returns String descritiva do filtro ativo
   */
  const getSubtitle = () => {
    if (filters.decisaoJudicial) {
      return 'Filtro: Decisão Judicial';
    } else {
      return 'Filtro: Administrativo';
    }
  };

  /**
   * Gera subtítulo descritivo do limite de provedores
   * @returns String descritiva do limite aplicado
   */
  const getLimitSubtitle = () => {
    switch (providerLimit) {
      case 5:
        return 'Top 5 provedores mais demandados';
      case 10:
        return 'Top 10 provedores mais demandados';
      case 'all':
        return 'Todos os provedores';
      default:
        return 'Todos os provedores';
    }
  };

  return {
    filters,
    toggleFilter,
    getSubjects,
    getSubtitle,
    providerLimit,
    setProviderLimit,
    getLimitSubtitle,
  };
}
