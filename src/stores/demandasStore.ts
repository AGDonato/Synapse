/**
 * Demandas store using Zustand
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { adaptiveApi } from '../services/api/mockAdapter';
import type { CreateDemanda, Demanda, DemandaFilters, UpdateDemanda } from '../services/api/schemas';

// State interface
interface DemandasState {
  // Data
  demandas: Demanda[];
  selectedDemanda: Demanda | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: DemandaFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // Cache
  lastFetch: number | null;
  cache: Map<number, Demanda>;
  
  // Actions
  fetchDemandas: (filters?: Partial<DemandaFilters>) => Promise<void>;
  fetchDemandaById: (id: number) => Promise<void>;
  createDemanda: (data: CreateDemanda) => Promise<Demanda>;
  updateDemanda: (id: number, data: UpdateDemanda) => Promise<void>;
  deleteDemanda: (id: number) => Promise<void>;
  
  // UI Actions
  setSelectedDemanda: (demanda: Demanda | null) => void;
  setFilters: (filters: Partial<DemandaFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
  
  // Computed
  filteredDemandas: Demanda[];
  demandasByStatus: Record<string, Demanda[]>;
  totalCount: number;
}

// Initial state
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

// Store implementation
const createDemandasStore: StateCreator<
  DemandasState,
  [["zustand/subscribeWithSelector", never], ["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  DemandasState
> = (set, get) => ({
  ...initialState,

  // Fetch demandas with caching
  fetchDemandas: async (newFilters) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
        if (newFilters) {
          state.filters = { ...state.filters, ...newFilters };
        }
      });

      const filters = { ...get().filters, ...newFilters };
      const cacheKey = JSON.stringify(filters);
      const now = Date.now();
      
      // Check cache first (5 minutes TTL)
      if (get().lastFetch && now - get().lastFetch < 5 * 60 * 1000) {
        set((state) => {
          state.isLoading = false;
        });
        return;
      }

      const response = await adaptiveApi.demandas.list(filters);

      set((state) => {
        state.demandas = response.data || [];
        state.pagination = {
          page: response.meta?.current_page || 1,
          pageSize: response.meta?.per_page || 10,
          total: response.meta?.total || 0,
          totalPages: response.meta?.last_page || 1,
        };
        state.lastFetch = now;
        state.isLoading = false;
        
        // Update cache
        response.data?.forEach(demanda => {
          state.cache.set(demanda.id, demanda);
        });
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar demandas';
        state.isLoading = false;
      });
    }
  },

  // Fetch single demanda
  fetchDemandaById: async (id) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      // Check cache first
      const cached = get().cache.get(id);
      if (cached) {
        set((state) => {
          state.selectedDemanda = cached;
          state.isLoading = false;
        });
        return;
      }

      const demanda = await adaptiveApi.demandas.getById(id);

      set((state) => {
        state.selectedDemanda = demanda;
        state.cache.set(id, demanda);
        state.isLoading = false;
        
        // Update in list if present
        const index = state.demandas.findIndex(d => d.id === id);
        if (index !== -1) {
          state.demandas[index] = demanda;
        }
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar demanda';
        state.isLoading = false;
      });
    }
  },

  // Create demanda
  createDemanda: async (data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      const newDemanda = await adaptiveApi.demandas.create(data);

      set((state) => {
        state.demandas.unshift(newDemanda);
        state.cache.set(newDemanda.id, newDemanda);
        state.pagination.total += 1;
        state.isLoading = false;
        state.lastFetch = null; // Invalidate cache
      });

      return newDemanda;
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Erro ao criar demanda';
        state.isLoading = false;
      });
      throw error;
    }
  },

  // Update demanda
  updateDemanda: async (id, data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      const updatedDemanda = await adaptiveApi.demandas.update(id, data);

      set((state) => {
        // Update in list
        const index = state.demandas.findIndex(d => d.id === id);
        if (index !== -1) {
          state.demandas[index] = updatedDemanda;
        }
        
        // Update cache
        state.cache.set(id, updatedDemanda);
        
        // Update selected if it's the same
        if (state.selectedDemanda?.id === id) {
          state.selectedDemanda = updatedDemanda;
        }
        
        state.isLoading = false;
        state.lastFetch = null; // Invalidate cache
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Erro ao atualizar demanda';
        state.isLoading = false;
      });
    }
  },

  // Delete demanda
  deleteDemanda: async (id) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      await adaptiveApi.demandas.delete(id);

      set((state) => {
        state.demandas = state.demandas.filter(d => d.id !== id);
        state.cache.delete(id);
        
        if (state.selectedDemanda?.id === id) {
          state.selectedDemanda = null;
        }
        
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.isLoading = false;
        state.lastFetch = null; // Invalidate cache
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Erro ao deletar demanda';
        state.isLoading = false;
      });
    }
  },

  // UI Actions
  setSelectedDemanda: (demanda) => {
    set((state) => {
      state.selectedDemanda = demanda;
    });
  },

  setFilters: (newFilters) => {
    set((state) => {
      state.filters = { ...state.filters, ...newFilters };
      state.lastFetch = null; // Invalidate cache
    });
  },

  setPage: (page) => {
    set((state) => {
      state.filters.page = page;
      state.pagination.page = page;
      state.lastFetch = null; // Invalidate cache
    });
  },

  clearError: () => {
    set((state) => {
      state.error = null;
    });
  },

  reset: () => {
    set(() => ({
      ...initialState,
      cache: new Map<number, Demanda>(),
    }));
  },

  // Computed properties
  get filteredDemandas() {
    const { demandas, filters } = get();
    
    let filtered = [...demandas];
    
    // Apply client-side filters if needed
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.titulo.toLowerCase().includes(search) ||
        d.descricao.toLowerCase().includes(search) ||
        d.numero.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  },

  get demandasByStatus() {
    const demandas = get().filteredDemandas;
    
    return demandas.reduce((acc, demanda) => {
      if (!acc[demanda.status]) {
        acc[demanda.status] = [];
      }
      acc[demanda.status].push(demanda);
      return acc;
    }, {} as Record<string, Demanda[]>);
  },

  get totalCount() {
    return get().pagination.total;
  },
});

// Create store with middleware (temporarily without persist for debugging)
export const useDemandasStore = create<DemandasState>()(
  subscribeWithSelector(
    immer(
      createDemandasStore
    )
  )
);

// Selectors for better performance
export const demandasSelectors = {
  demandas: (state: DemandasState) => state.demandas,
  selectedDemanda: (state: DemandasState) => state.selectedDemanda,
  isLoading: (state: DemandasState) => state.isLoading,
  error: (state: DemandasState) => state.error,
  filters: (state: DemandasState) => state.filters,
  pagination: (state: DemandasState) => state.pagination,
  filteredDemandas: (state: DemandasState) => state.filteredDemandas,
  demandasByStatus: (state: DemandasState) => state.demandasByStatus,
  totalCount: (state: DemandasState) => state.totalCount,
};

// Actions for better performance
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

// Hooks for specific use cases
export const useDemandasActions = () => {
  return {
    fetchDemandas: useDemandasStore((state) => state.fetchDemandas),
    fetchDemandaById: useDemandasStore((state) => state.fetchDemandaById),
    createDemanda: useDemandasStore((state) => state.createDemanda),
    updateDemanda: useDemandasStore((state) => state.updateDemanda),
    deleteDemanda: useDemandasStore((state) => state.deleteDemanda),
    setSelectedDemanda: useDemandasStore((state) => state.setSelectedDemanda),
    setFilters: useDemandasStore((state) => state.setFilters),
    setPage: useDemandasStore((state) => state.setPage),
    clearError: useDemandasStore((state) => state.clearError),
    reset: useDemandasStore((state) => state.reset),
  };
};

export const useDemandasData = () => {
  return useDemandasStore((state) => ({
    demandas: state.filteredDemandas,
    selectedDemanda: state.selectedDemanda,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    totalCount: state.totalCount,
  }));
};

export const useDemandasByStatus = () => {
  return useDemandasStore((state) => state.demandasByStatus);
};

export default useDemandasStore;