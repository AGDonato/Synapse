// src/hooks/useProviderFilters.ts
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

export function useProviderFilters(
  initialState: FilterState = {
    decisaoJudicial: true,
    administrativo: false,
  },
  initialLimit: ProviderLimitType = 'all'
): UseProviderFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(initialState);
  const [providerLimit, setProviderLimit] =
    useState<ProviderLimitType>(initialLimit);

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

  const getSubtitle = () => {
    if (filters.decisaoJudicial) {
      return 'Filtro: Decisão Judicial';
    } else {
      return 'Filtro: Administrativo';
    }
  };

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
