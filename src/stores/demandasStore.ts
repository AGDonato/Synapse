/**
 * STORE DE GERENCIAMENTO DE DEMANDAS USANDO ZUSTAND
 *
 * Este módulo implementa o gerenciamento completo de demandas jurídicas/administrativas.
 * Inclui funcionalidades para:
 * - Operações CRUD completas (criar, ler, atualizar, deletar demandas)
 * - Sistema de cache em memória com TTL de 5 minutos para otimização
 * - Filtros avançados e paginação server-side
 * - Busca textual em múltiplos campos (título, descrição, número)
 * - Agrupamento de demandas por status para análise
 * - Sincronização automática entre lista e demanda selecionada
 * - Tratamento robusto de erros com mensagens descritivas
 * - Invalidação inteligente de cache após mutações
 * - Hooks especializados para diferentes casos de uso
 * - Seletores otimizados para performance de renderização
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { adaptiveApi } from '../services/api/mockAdapter';
import type {
  CreateDemanda,
  Demanda,
  DemandaFilters,
  UpdateDemanda,
} from '../services/api/schemas';

/**
 * Interface principal do estado do store de demandas
 * Define toda a estrutura de dados e ações disponíveis
 */
interface DemandasState {
  /** Lista principal de demandas carregadas */
  demandas: Demanda[];
  /** Demanda atualmente selecionada para visualização/edição */
  selectedDemanda: Demanda | null;

  /** Estado de carregamento para exibição de spinners */
  isLoading: boolean;
  /** Mensagem de erro atual (null se não houver erro) */
  error: string | null;
  /** Filtros aplicados na busca de demandas */
  filters: DemandaFilters;
  /** Informações de paginação para navegação entre páginas */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  /** Timestamp do último fetch para controle de cache */
  lastFetch: number | null;
  /** Cache em memória indexado por ID da demanda */
  cache: Map<number, Demanda>;

  /** Busca demandas com filtros opcionais e cache inteligente */
  fetchDemandas: (filters?: Partial<DemandaFilters>) => Promise<void>;
  /** Busca uma demanda específica por ID com fallback para cache */
  fetchDemandaById: (id: number) => Promise<void>;
  /** Cria nova demanda e atualiza lista local */
  createDemanda: (data: CreateDemanda) => Promise<Demanda>;
  /** Atualiza demanda existente e sincroniza com cache */
  updateDemanda: (id: number, data: UpdateDemanda) => Promise<void>;
  /** Remove demanda e limpa do cache */
  deleteDemanda: (id: number) => Promise<void>;

  /** Define qual demanda está selecionada */
  setSelectedDemanda: (demanda: Demanda | null) => void;
  /** Atualiza filtros de busca e invalida cache */
  setFilters: (filters: Partial<DemandaFilters>) => void;
  /** Navega para página específica */
  setPage: (page: number) => void;
  /** Limpa mensagem de erro atual */
  clearError: () => void;
  /** Reseta todo o estado para valores iniciais */
  reset: () => void;

  /** Função para obter demandas filtradas com busca textual client-side */
  getFilteredDemandas: () => Demanda[];
  /** Função para obter demandas agrupadas por status para análise */
  getDemandasByStatus: () => Record<string, Demanda[]>;
  /** Contador total de demandas (server-side) */
  totalCount: number;
}

/**
 * Estado inicial do store aplicado na criação e reset
 * Valores padrão seguros e consistentes
 */
const initialState = {
  demandas: [],
  selectedDemanda: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    per_page: 10,
    sort_by: 'updated_at',
    sort_direction: 'desc' as const,
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
  lastFetch: null,
  cache: new Map<number, Demanda>(),
};

// Implementação do store
const createDemandasStore: StateCreator<
  DemandasState,
  [['zustand/subscribeWithSelector', never], ['zustand/immer', never]],
  [],
  DemandasState
> = (set, get) => ({
  ...initialState,

  /**
   * Busca lista de demandas com sistema de cache inteligente
   * Implementa TTL de 5 minutos para reduzir requisições desnecessárias
   * @param newFilters - Filtros opcionais a serem aplicados na busca
   */
  fetchDemandas: async newFilters => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
        if (newFilters) {
          state.filters = { ...state.filters, ...newFilters };
        }
      });

      const filters = { ...get().filters, ...newFilters };
      const cacheKey = JSON.stringify(filters);
      const now = Date.now();

      // Verifica cache primeiro (TTL de 5 minutos)
      const lastFetch = get().lastFetch;
      if (lastFetch && now - lastFetch < 5 * 60 * 1000) {
        set(state => {
          state.isLoading = false;
        });
        return;
      }

      const response = await adaptiveApi.demandas.list(filters);

      set(state => {
        state.demandas = response.data || [];
        state.pagination = {
          page: response.meta?.current_page || 1,
          pageSize: response.meta?.per_page || 10,
          total: response.meta?.total || 0,
          totalPages: response.meta?.last_page || 1,
        };
        state.lastFetch = now;
        state.isLoading = false;

        // Atualiza cache
        response.data?.forEach(demanda => {
          state.cache.set(demanda.id, demanda);
        });
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar demandas';
        state.isLoading = false;
      });
    }
  },

  /**
   * Busca demanda específica por ID com fallback para cache
   * Primeiro verifica cache local, depois faz requisição se necessário
   * @param id - ID da demanda a ser buscada
   */
  fetchDemandaById: async id => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // Verifica cache primeiro
      const cached = get().cache.get(id);
      if (cached) {
        set(state => {
          state.selectedDemanda = cached;
          state.isLoading = false;
        });
        return;
      }

      const demanda = await adaptiveApi.demandas.getById(id);

      set(state => {
        state.selectedDemanda = demanda;
        state.cache.set(id, demanda);
        state.isLoading = false;

        // Atualiza na lista se presente
        const index = state.demandas.findIndex(d => d.id === id);
        if (index !== -1) {
          state.demandas[index] = demanda;
        }
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar demanda';
        state.isLoading = false;
      });
    }
  },

  /**
   * Cria nova demanda e atualiza estado local
   * Adiciona no início da lista e invalida cache para nova busca
   * @param data - Dados da nova demanda a ser criada
   * @returns Promessa com a demanda criada
   */
  createDemanda: async data => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      const newDemanda = await adaptiveApi.demandas.create(data);

      set(state => {
        state.demandas.unshift(newDemanda);
        state.cache.set(newDemanda.id, newDemanda);
        state.pagination.total += 1;
        state.isLoading = false;
        state.lastFetch = null; // Invalida cache
      });

      return newDemanda;
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao criar demanda';
        state.isLoading = false;
      });
      throw error;
    }
  },

  /**
   * Atualiza demanda existente e sincroniza em todos os locais
   * Atualiza lista, cache e demanda selecionada se necessário
   * @param id - ID da demanda a ser atualizada
   * @param data - Novos dados da demanda
   */
  updateDemanda: async (id, data) => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      const updatedDemanda = await adaptiveApi.demandas.update(id, data);

      set(state => {
        // Atualiza na lista
        const index = state.demandas.findIndex(d => d.id === id);
        if (index !== -1) {
          state.demandas[index] = updatedDemanda;
        }

        // Atualiza cache
        state.cache.set(id, updatedDemanda);

        // Atualiza selecionado se for o mesmo
        if (state.selectedDemanda?.id === id) {
          state.selectedDemanda = updatedDemanda;
        }

        state.isLoading = false;
        state.lastFetch = null; // Invalida cache
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao atualizar demanda';
        state.isLoading = false;
      });
    }
  },

  /**
   * Remove demanda do sistema e limpa referências locais
   * Remove da lista, cache e desmarca se estiver selecionada
   * @param id - ID da demanda a ser removida
   */
  deleteDemanda: async id => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      await adaptiveApi.demandas.delete(id);

      set(state => {
        state.demandas = state.demandas.filter(d => d.id !== id);
        state.cache.delete(id);

        if (state.selectedDemanda?.id === id) {
          state.selectedDemanda = null;
        }

        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.isLoading = false;
        state.lastFetch = null; // Invalida cache
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao deletar demanda';
        state.isLoading = false;
      });
    }
  },

  /**
   * Define qual demanda está atualmente selecionada
   * @param demanda - Demanda a ser selecionada (ou null para desmarcar)
   */
  setSelectedDemanda: demanda => {
    set(state => {
      state.selectedDemanda = demanda;
    });
  },

  /**
   * Atualiza filtros de busca e força nova requisição
   * @param newFilters - Novos filtros a serem aplicados
   */
  setFilters: newFilters => {
    set(state => {
      state.filters = { ...state.filters, ...newFilters };
      state.lastFetch = null; // Invalida cache
    });
  },

  /**
   * Navega para página específica da paginação
   * @param page - Número da página a ser carregada
   */
  setPage: page => {
    set(state => {
      state.filters.page = page;
      state.pagination.page = page;
      state.lastFetch = null; // Invalida cache
    });
  },

  /**
   * Limpa mensagem de erro atual
   * Útil após o usuário visualizar o erro
   */
  clearError: () => {
    set(state => {
      state.error = null;
    });
  },

  /**
   * Reseta todo o estado para valores iniciais
   * Limpa cache, filtros, seleções e dados carregados
   */
  reset: () => {
    set(() => ({
      ...initialState,
      cache: new Map<number, Demanda>(),
    }));
  },

  /**
   * Função para obter demandas filtradas com busca textual client-side
   * Filtra por texto de busca em título, descrição e número
   * @returns Lista de demandas filtradas
   */
  getFilteredDemandas: () => {
    const state = get();
    const { demandas, filters } = state;

    let filtered = [...demandas];

    // Aplica filtros client-side se necessário
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.titulo.toLowerCase().includes(search) ||
          d.descricao.toLowerCase().includes(search) ||
          d.numero.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  /**
   * Função para obter demandas agrupadas por status
   * Útil para dashboards e análises estatísticas
   * @returns Objeto com arrays de demandas por status
   */
  getDemandasByStatus: () => {
    const state = get();
    const demandas = state.getFilteredDemandas();

    return demandas.reduce(
      (acc, demanda) => {
        if (!acc[demanda.status]) {
          acc[demanda.status] = [];
        }
        acc[demanda.status].push(demanda);
        return acc;
      },
      {} as Record<string, Demanda[]>
    );
  },

  /**
   * Getter computado que retorna total de demandas (server-side)
   * @returns Número total de demandas disponíveis
   */
  get totalCount() {
    return get().pagination.total;
  },
});

// Cria store com middleware (temporariamente sem persist para debug)
export const useDemandasStore = create<DemandasState>()(
  subscribeWithSelector(immer(createDemandasStore))
);

/**
 * Seletores otimizados para acesso granular ao estado
 * Previnem re-renders desnecessários ao acessar propriedades específicas
 */
export const demandasSelectors = {
  demandas: (state: DemandasState) => state.demandas,
  selectedDemanda: (state: DemandasState) => state.selectedDemanda,
  isLoading: (state: DemandasState) => state.isLoading,
  error: (state: DemandasState) => state.error,
  filters: (state: DemandasState) => state.filters,
  pagination: (state: DemandasState) => state.pagination,
  filteredDemandas: (state: DemandasState) => state.getFilteredDemandas(),
  demandasByStatus: (state: DemandasState) => state.getDemandasByStatus(),
  totalCount: (state: DemandasState) => state.totalCount,
};

/**
 * Ações extradas do store para uso externo
 * Facilitam acesso às funções sem necessidade de hooks
 */
export const demandasActions = {
  fetchDemandas: () => useDemandasStore.getState().fetchDemandas,
  fetchDemandaById: () => useDemandasStore.getState().fetchDemandaById,
  createDemanda: () => useDemandasStore.getState().createDemanda,
  updateDemanda: () => useDemandasStore.getState().updateDemanda,
  deleteDemanda: () => useDemandasStore.getState().deleteDemanda,
  setSelectedDemanda: () => useDemandasStore.getState().setSelectedDemanda,
  setFilters: () => useDemandasStore.getState().setFilters,
  setPage: () => useDemandasStore.getState().setPage,
  clearError: () => useDemandasStore.getState().clearError,
  reset: () => useDemandasStore.getState().reset,
};

/**
 * Hook especializado que retorna apenas as ações do store
 * Útil quando o componente precisa apenas executar operações
 * @returns Objeto com todas as funções de ação disponíveis
 */
export const useDemandasActions = () => {
  return {
    fetchDemandas: useDemandasStore(state => state.fetchDemandas),
    fetchDemandaById: useDemandasStore(state => state.fetchDemandaById),
    createDemanda: useDemandasStore(state => state.createDemanda),
    updateDemanda: useDemandasStore(state => state.updateDemanda),
    deleteDemanda: useDemandasStore(state => state.deleteDemanda),
    setSelectedDemanda: useDemandasStore(state => state.setSelectedDemanda),
    setFilters: useDemandasStore(state => state.setFilters),
    setPage: useDemandasStore(state => state.setPage),
    clearError: useDemandasStore(state => state.clearError),
    reset: useDemandasStore(state => state.reset),
  };
};

/**
 * Hook que retorna apenas os dados essenciais das demandas
 * Otimizado para componentes que exibem listas e informações
 * @returns Objeto com demandas, demanda selecionada, loading e pagination
 */
export const useDemandasData = () => {
  const store = useDemandasStore();
  
  return {
    demandas: store.getFilteredDemandas(),
    selectedDemanda: store.selectedDemanda,
    isLoading: store.isLoading,
    error: store.error,
    pagination: store.pagination,
    totalCount: store.totalCount,
  };
};

/**
 * Hook especializado que retorna demandas agrupadas por status
 * Étil para dashboards, gráficos e componentes de estatísticas
 * @returns Objeto com arrays de demandas organizadas por status
 */
export const useDemandasByStatus = () => {
  const store = useDemandasStore();
  return store.getDemandasByStatus();
};

export default useDemandasStore;
