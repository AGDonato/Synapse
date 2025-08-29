/**
 * Documentos store using Zustand
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { adaptiveApi } from '../services/api/mockAdapter';
import type {
  CreateDocumento,
  Documento,
  DocumentoFilters,
  UpdateDocumento,
} from '../services/api/schemas';

// State interface
interface DocumentosState {
  // Data
  documentos: Documento[];
  selectedDocumento: Documento | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: DocumentoFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  // Search and filtering
  searchTerm: string;
  selectedTags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };

  // Cache
  lastFetch: number | null;
  cache: Map<number, Documento>;

  // Actions
  fetchDocumentos: (filters?: Partial<DocumentoFilters>) => Promise<void>;
  fetchDocumentoById: (id: number) => Promise<void>;
  createDocumento: (data: CreateDocumento) => Promise<Documento>;
  updateDocumento: (id: number, data: UpdateDocumento) => Promise<void>;
  deleteDocumento: (id: number) => Promise<void>;

  // File operations
  uploadFile: (file: File, documentoId?: number) => Promise<string>;
  downloadFile: (documentoId: number) => Promise<Blob>;
  previewFile: (documentoId: number) => Promise<string>;

  // Search and filter actions
  setSearchTerm: (term: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  clearFilters: () => void;

  // UI Actions
  setSelectedDocumento: (documento: Documento | null) => void;
  setFilters: (filters: Partial<DocumentoFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;

  // Computed
  filteredDocumentos: Documento[];
  documentosByStatus: Record<string, Documento[]>;
  documentosByType: Record<string, Documento[]>;
  totalCount: number;
  availableTags: string[];
}

// Initial state
const initialState = {
  documentos: [],
  selectedDocumento: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    per_page: 20,
    sort_by: 'data_documento',
    sort_direction: 'desc' as const,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  searchTerm: '',
  selectedTags: [],
  dateRange: {
    start: null,
    end: null,
  },
  lastFetch: null,
  cache: new Map<number, Documento>(),
};

// Store implementation
const createDocumentosStore: StateCreator<
  DocumentosState,
  [['zustand/subscribeWithSelector', never], ['zustand/immer', never]],
  [],
  DocumentosState
> = (set, get) => ({
  ...initialState,

  // Fetch documentos with caching and advanced filtering
  fetchDocumentos: async newFilters => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
        if (newFilters) {
          state.filters = { ...state.filters, ...newFilters };
        }
      });

      const filters = { ...get().filters, ...newFilters };
      const now = Date.now();

      // Check cache first (3 minutes TTL for documentos due to file operations)
      const lastFetch = get().lastFetch;
      if (lastFetch && now - lastFetch < 3 * 60 * 1000) {
        set(state => {
          state.isLoading = false;
        });
        return;
      }

      // Add search and filter params
      const searchState = get();
      const enhancedFilters = {
        ...filters,
        search: searchState.searchTerm || filters.search,
        tags: searchState.selectedTags.length > 0 ? searchState.selectedTags.join(',') : undefined,
        date_from: searchState.dateRange.start?.toISOString(),
        date_to: searchState.dateRange.end?.toISOString(),
      };

      const response = await adaptiveApi.documentos.list(enhancedFilters);

      set(state => {
        state.documentos = response.data || [];
        state.pagination = {
          page: response.meta?.current_page || 1,
          pageSize: response.meta?.per_page || 20,
          total: response.meta?.total || 0,
          totalPages: response.meta?.last_page || 1,
        };
        state.lastFetch = now;
        state.isLoading = false;

        // Update cache
        response.data?.forEach(documento => {
          state.cache.set(documento.id, documento);
        });
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar documentos';
        state.isLoading = false;
      });
    }
  },

  // Fetch single documento
  fetchDocumentoById: async id => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // Check cache first
      const cached = get().cache.get(id);
      if (cached) {
        set(state => {
          state.selectedDocumento = cached;
          state.isLoading = false;
        });
        return;
      }

      const documento = await adaptiveApi.documentos.getById(id);

      set(state => {
        state.selectedDocumento = documento;
        state.cache.set(id, documento);
        state.isLoading = false;

        // Update in list if present
        const index = state.documentos.findIndex(d => d.id === id);
        if (index !== -1) {
          state.documentos[index] = documento;
        }
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar documento';
        state.isLoading = false;
      });
    }
  },

  // Create documento
  createDocumento: async data => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      const newDocumento = await adaptiveApi.documentos.create(data);

      set(state => {
        state.documentos.unshift(newDocumento);
        state.cache.set(newDocumento.id, newDocumento);
        state.pagination.total += 1;
        state.isLoading = false;
        state.lastFetch = null; // Invalidate cache
      });

      return newDocumento;
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao criar documento';
        state.isLoading = false;
      });
      throw error;
    }
  },

  // Update documento
  updateDocumento: async (id, data) => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      const updatedDocumento = await adaptiveApi.documentos.update(id, data);

      set(state => {
        // Update in list
        const index = state.documentos.findIndex(d => d.id === id);
        if (index !== -1) {
          state.documentos[index] = updatedDocumento;
        }

        // Update cache
        state.cache.set(id, updatedDocumento);

        // Update selected if it's the same
        if (state.selectedDocumento?.id === id) {
          state.selectedDocumento = updatedDocumento;
        }

        state.isLoading = false;
        state.lastFetch = null; // Invalidate cache
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao atualizar documento';
        state.isLoading = false;
      });
    }
  },

  // Delete documento
  deleteDocumento: async id => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      await adaptiveApi.documentos.delete(id);

      set(state => {
        state.documentos = state.documentos.filter(d => d.id !== id);
        state.cache.delete(id);

        if (state.selectedDocumento?.id === id) {
          state.selectedDocumento = null;
        }

        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.isLoading = false;
        state.lastFetch = null; // Invalidate cache
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao deletar documento';
        state.isLoading = false;
      });
    }
  },

  // File operations
  uploadFile: async (file, documentoId) => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // This would be replaced with actual file upload API call
      const formData = new FormData();
      formData.append('file', file);
      if (documentoId) {
        formData.append('documento_id', documentoId.toString());
      }

      // Simulate file upload for now
      const fileUrl = URL.createObjectURL(file);

      set(state => {
        state.isLoading = false;
      });

      return fileUrl;
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao fazer upload do arquivo';
        state.isLoading = false;
      });
      throw error;
    }
  },

  downloadFile: async documentoId => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // This would be replaced with actual download API call
      const response = await fetch(`/api/documentos/${documentoId}/download`);
      const blob = await response.blob();

      set(state => {
        state.isLoading = false;
      });

      return blob;
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao baixar arquivo';
        state.isLoading = false;
      });
      throw error;
    }
  },

  previewFile: async documentoId => {
    try {
      const documento =
        get().cache.get(documentoId) || (await adaptiveApi.documentos.getById(documentoId));

      // Return preview URL or base64 content
      return documento.arquivo || '';
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao visualizar arquivo';
      });
      throw error;
    }
  },

  // Search and filter actions
  setSearchTerm: term => {
    set(state => {
      state.searchTerm = term;
      state.lastFetch = null; // Invalidate cache to trigger new search
    });
  },

  setSelectedTags: tags => {
    set(state => {
      state.selectedTags = tags;
      state.lastFetch = null; // Invalidate cache
    });
  },

  setDateRange: range => {
    set(state => {
      state.dateRange = range;
      state.lastFetch = null; // Invalidate cache
    });
  },

  clearFilters: () => {
    set(state => {
      state.searchTerm = '';
      state.selectedTags = [];
      state.dateRange = { start: null, end: null };
      state.filters = {
        page: 1,
        per_page: 20,
        sort_by: 'data_documento',
        sort_direction: 'desc',
      };
      state.lastFetch = null;
    });
  },

  // UI Actions
  setSelectedDocumento: documento => {
    set(state => {
      state.selectedDocumento = documento;
    });
  },

  setFilters: newFilters => {
    set(state => {
      state.filters = { ...state.filters, ...newFilters };
      state.lastFetch = null; // Invalidate cache
    });
  },

  setPage: page => {
    set(state => {
      state.filters.page = page;
      state.pagination.page = page;
      state.lastFetch = null; // Invalidate cache
    });
  },

  clearError: () => {
    set(state => {
      state.error = null;
    });
  },

  reset: () => {
    set(() => ({
      ...initialState,
      cache: new Map<number, Documento>(),
    }));
  },

  // Computed properties
  get filteredDocumentos() {
    const { documentos, searchTerm, selectedTags, dateRange } = get();

    let filtered = [...documentos];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.numero.toLowerCase().includes(search) ||
          d.assunto.toLowerCase().includes(search) ||
          d.destinatario.toLowerCase().includes(search) ||
          d.remetente.toLowerCase().includes(search)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(d => selectedTags.some(tag => d.tags?.includes(tag)));
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(d => {
        const docDate = new Date(d.data_documento);
        if (dateRange.start && docDate < dateRange.start) {
          return false;
        }
        if (dateRange.end && docDate > dateRange.end) {
          return false;
        }
        return true;
      });
    }

    return filtered;
  },

  get documentosByStatus() {
    const documentos = get().filteredDocumentos;

    return documentos.reduce(
      (acc, documento) => {
        if (!acc[documento.status]) {
          acc[documento.status] = [];
        }
        acc[documento.status].push(documento);
        return acc;
      },
      {} as Record<string, Documento[]>
    );
  },

  get documentosByType() {
    const documentos = get().filteredDocumentos;

    return documentos.reduce(
      (acc, documento) => {
        const tipo = documento.tipo_documento_id.toString();
        if (!acc[tipo]) {
          acc[tipo] = [];
        }
        acc[tipo].push(documento);
        return acc;
      },
      {} as Record<string, Documento[]>
    );
  },

  get totalCount() {
    return get().pagination.total;
  },

  get availableTags() {
    const documentos = get().documentos;
    const allTags = documentos.flatMap(d => d.tags || []);
    return Array.from(new Set(allTags)).sort();
  },
});

// Create store with middleware (temporarily without persist for debugging)
export const useDocumentosStore = create<DocumentosState>()(
  subscribeWithSelector(immer(createDocumentosStore))
);

// Selectors for better performance
export const documentosSelectors = {
  documentos: (state: DocumentosState) => state.documentos,
  selectedDocumento: (state: DocumentosState) => state.selectedDocumento,
  isLoading: (state: DocumentosState) => state.isLoading,
  error: (state: DocumentosState) => state.error,
  filters: (state: DocumentosState) => state.filters,
  pagination: (state: DocumentosState) => state.pagination,
  searchTerm: (state: DocumentosState) => state.searchTerm,
  selectedTags: (state: DocumentosState) => state.selectedTags,
  dateRange: (state: DocumentosState) => state.dateRange,
  filteredDocumentos: (state: DocumentosState) => state.filteredDocumentos,
  documentosByStatus: (state: DocumentosState) => state.documentosByStatus,
  documentosByType: (state: DocumentosState) => state.documentosByType,
  totalCount: (state: DocumentosState) => state.totalCount,
  availableTags: (state: DocumentosState) => state.availableTags,
};

// Hooks for specific use cases
export const useDocumentosActions = () => {
  return {
    fetchDocumentos: useDocumentosStore(state => state.fetchDocumentos),
    fetchDocumentoById: useDocumentosStore(state => state.fetchDocumentoById),
    createDocumento: useDocumentosStore(state => state.createDocumento),
    updateDocumento: useDocumentosStore(state => state.updateDocumento),
    deleteDocumento: useDocumentosStore(state => state.deleteDocumento),
    uploadFile: useDocumentosStore(state => state.uploadFile),
    downloadFile: useDocumentosStore(state => state.downloadFile),
    previewFile: useDocumentosStore(state => state.previewFile),
    setSearchTerm: useDocumentosStore(state => state.setSearchTerm),
    setSelectedTags: useDocumentosStore(state => state.setSelectedTags),
    setDateRange: useDocumentosStore(state => state.setDateRange),
    clearFilters: useDocumentosStore(state => state.clearFilters),
    setSelectedDocumento: useDocumentosStore(state => state.setSelectedDocumento),
    setFilters: useDocumentosStore(state => state.setFilters),
    setPage: useDocumentosStore(state => state.setPage),
    clearError: useDocumentosStore(state => state.clearError),
    reset: useDocumentosStore(state => state.reset),
  };
};

export const useDocumentosData = () => {
  return useDocumentosStore(state => ({
    documentos: state.filteredDocumentos,
    selectedDocumento: state.selectedDocumento,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    totalCount: state.totalCount,
    searchTerm: state.searchTerm,
    selectedTags: state.selectedTags,
    dateRange: state.dateRange,
    availableTags: state.availableTags,
  }));
};

export const useDocumentosSearch = () => {
  return {
    searchTerm: useDocumentosStore(state => state.searchTerm),
    selectedTags: useDocumentosStore(state => state.selectedTags),
    dateRange: useDocumentosStore(state => state.dateRange),
    availableTags: useDocumentosStore(state => state.availableTags),
    setSearchTerm: useDocumentosStore(state => state.setSearchTerm),
    setSelectedTags: useDocumentosStore(state => state.setSelectedTags),
    setDateRange: useDocumentosStore(state => state.setDateRange),
    clearFilters: useDocumentosStore(state => state.clearFilters),
  };
};

export const useDocumentosByStatus = () => {
  return useDocumentosStore(state => state.documentosByStatus);
};

export const useDocumentosByType = () => {
  return useDocumentosStore(state => state.documentosByType);
};

export default useDocumentosStore;
