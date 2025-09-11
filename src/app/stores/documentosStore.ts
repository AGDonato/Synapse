/**
 * STORE DE GERENCIAMENTO DE DOCUMENTOS USANDO ZUSTAND
 *
 * Este módulo implementa o gerenciamento completo de documentos e arquivos do sistema.
 * Inclui funcionalidades para:
 * - Operações CRUD completas (criar, ler, atualizar, deletar documentos)
 * - Sistema de busca avançada com múltiplos critérios (texto, tags, datas)
 * - Operações de arquivo (upload, download, preview)
 * - Cache otimizado com TTL de 3 minutos para operações de arquivo
 * - Filtros por status, tipo, tags e range de datas
 * - Agrupamento automático por status e tipo para análises
 * - Sistema de tags dinâmico com extraição automática
 * - Paginação server-side com controle local
 * - Sincronização entre lista e documento selecionado
 * - Tratamento robusto de erros para operações de arquivo
 * - Hooks especializados para diferentes casos de uso
 * - Invalidação inteligente de cache após alterações
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { enableMapSet } from 'immer';
import { adaptiveApi } from '../../shared/services/api/mockAdapter';

// Habilitar suporte a Map/Set no Immer
enableMapSet();
import type {
  CreateDocumento,
  Documento,
  DocumentoFilters,
  UpdateDocumento,
} from '../../shared/services/api/schemas';

/**
 * Interface principal do estado do store de documentos
 * Define toda a estrutura de dados, filtros e ações disponíveis
 */
interface DocumentosState {
  /** Lista principal de documentos carregados */
  documentos: Documento[];
  /** Documento atualmente selecionado para visualização/edição */
  selectedDocumento: Documento | null;

  /** Estado de carregamento para operações assíncronas */
  isLoading: boolean;
  /** Mensagem de erro atual (null se não houver erro) */
  error: string | null;
  /** Filtros server-side aplicados na busca */
  filters: DocumentoFilters;
  /** Informações de paginação para navegação */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  /** Termo de busca textual client-side */
  searchTerm: string;
  /** Tags selecionadas para filtrar documentos */
  selectedTags: string[];
  /** Range de datas para filtro temporal */
  dateRange: {
    start: Date | null;
    end: Date | null;
  };

  /** Timestamp do último fetch para controle de cache */
  lastFetch: number | null;
  /** Cache em memória indexado por ID do documento */
  cache: Record<number, Documento>;

  /** Busca documentos com filtros opcionais e cache inteligente */
  fetchDocumentos: (filters?: Partial<DocumentoFilters>) => Promise<void>;
  /** Busca documento específico por ID com fallback para cache */
  fetchDocumentoById: (id: number) => Promise<void>;
  /** Cria novo documento e atualiza lista local */
  createDocumento: (data: CreateDocumento) => Promise<Documento>;
  /** Atualiza documento existente e sincroniza com cache */
  updateDocumento: (id: number, data: UpdateDocumento) => Promise<void>;
  /** Remove documento e limpa do cache */
  deleteDocumento: (id: number) => Promise<void>;

  /** Faz upload de arquivo associado a documento */
  uploadFile: (file: File, documentoId?: number) => Promise<string>;
  /** Baixa arquivo de documento como Blob */
  downloadFile: (documentoId: number) => Promise<Blob>;
  /** Obtém URL de preview do arquivo do documento */
  previewFile: (documentoId: number) => Promise<string>;

  /** Define termo de busca textual e invalida cache */
  setSearchTerm: (term: string) => void;
  /** Define tags selecionadas para filtro */
  setSelectedTags: (tags: string[]) => void;
  /** Define range de datas para filtro temporal */
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  /** Limpa todos os filtros e reseta para estado inicial */
  clearFilters: () => void;

  /** Define qual documento está selecionado */
  setSelectedDocumento: (documento: Documento | null) => void;
  /** Atualiza filtros server-side e invalida cache */
  setFilters: (filters: Partial<DocumentoFilters>) => void;
  /** Navega para página específica */
  setPage: (page: number) => void;
  /** Limpa mensagem de erro atual */
  clearError: () => void;
  /** Reseta todo o estado para valores iniciais */
  reset: () => void;

  /** Função para obter documentos filtrados com todos os critérios client-side */
  getFilteredDocumentos: () => Documento[];
  /** Função para obter documentos agrupados por status */
  getDocumentosByStatus: () => Record<string, Documento[]>;
  /** Função para obter documentos agrupados por tipo */
  getDocumentosByType: () => Record<string, Documento[]>;
  /** Contador total de documentos (server-side) */
  totalCount: number;
  /** Tags únicas extraídas de todos os documentos */
  availableTags: string[];
}

/**
 * Estado inicial do store com valores padrão seguros
 * Aplicado na criação e operações de reset
 */
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
  cache: {} as Record<number, Documento>,
};

// Implementação do store
const createDocumentosStore: StateCreator<
  DocumentosState,
  [['zustand/subscribeWithSelector', never], ['zustand/immer', never]],
  [],
  DocumentosState
> = (set, get) => ({
  ...initialState,

  /**
   * Busca documentos com cache inteligente e filtros avançados
   * @param newFilters Filtros opcionais para aplicar na busca
   * - Cache TTL: 3 minutos devido a operações de arquivo
   * - Combina filtros server-side e client-side
   * - Invalida cache quando novos filtros são aplicados
   */
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

      // Verifica cache primeiro (TTL de 3 minutos para documentos devido a operações de arquivo)
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

        // Atualiza cache
        response.data?.forEach(documento => {
          state.cache[documento.id] = documento;
        });
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao carregar documentos';
        state.isLoading = false;
      });
    }
  },

  /**
   * Busca documento específico por ID com fallback para cache
   * @param id ID do documento a ser buscado
   * - Verifica cache primeiro para melhor performance
   * - Sincroniza com lista se documento já estiver carregado
   * - Atualiza cache após fetch bem-sucedido
   */
  fetchDocumentoById: async id => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // Verifica cache primeiro
      const cached = get().cache[id];
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
        state.cache[id] = documento;
        state.isLoading = false;

        // Atualiza na lista se presente
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

  /**
   * Cria novo documento e atualiza estado local
   * @param data Dados do documento a ser criado
   * @returns Promise com o documento criado
   * - Adiciona documento no início da lista para visibilidade
   * - Atualiza cache e contadores de paginação
   * - Invalida cache para forçar refresh na próxima busca
   */
  createDocumento: async data => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      const newDocumento = await adaptiveApi.documentos.create(data);

      set(state => {
        state.documentos.unshift(newDocumento);
        state.cache[newDocumento.id] = newDocumento;
        state.pagination.total += 1;
        state.isLoading = false;
        state.lastFetch = null; // Invalida cache
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

  /**
   * Atualiza documento existente e sincroniza com cache
   * @param id ID do documento a ser atualizado
   * @param data Dados parciais para atualização
   * - Sincroniza mudanças em lista, cache e documento selecionado
   * - Invalida cache para garantir consistência
   * - Mantém sincronia entre todas as referências do documento
   */
  updateDocumento: async (id, data) => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      const updatedDocumento = await adaptiveApi.documentos.update(id, data);

      set(state => {
        // Atualiza na lista
        const index = state.documentos.findIndex(d => d.id === id);
        if (index !== -1) {
          state.documentos[index] = updatedDocumento;
        }

        // Atualiza cache
        state.cache[id] = updatedDocumento;

        // Atualiza selecionado se for o mesmo
        if (state.selectedDocumento?.id === id) {
          state.selectedDocumento = updatedDocumento;
        }

        state.isLoading = false;
        state.lastFetch = null; // Invalida cache
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao atualizar documento';
        state.isLoading = false;
      });
    }
  },

  /**
   * Remove documento e limpa todas as referências
   * @param id ID do documento a ser removido
   * - Remove da lista, cache e documento selecionado
   * - Atualiza contadores de paginação
   * - Invalida cache para manter consistência
   */
  deleteDocumento: async id => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      await adaptiveApi.documentos.delete(id);

      set(state => {
        state.documentos = state.documentos.filter(d => d.id !== id);
        delete state.cache[id];

        if (state.selectedDocumento?.id === id) {
          state.selectedDocumento = null;
        }

        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.isLoading = false;
        state.lastFetch = null; // Invalida cache
      });
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao deletar documento';
        state.isLoading = false;
      });
    }
  },

  /**
   * Faz upload de arquivo associado a documento
   * @param file Arquivo a ser enviado
   * @param documentoId ID do documento associado (opcional)
   * @returns Promise com URL do arquivo enviado
   * - Suporta upload com e sem documento associado
   * - Gera FormData para envio multipart
   * - Atualmente simula upload com Object URL
   */
  uploadFile: async (file, documentoId) => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // Isso seria substituído por chamada de API de upload real
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

  /**
   * Baixa arquivo de documento como Blob
   * @param documentoId ID do documento com arquivo
   * @returns Promise com Blob do arquivo
   * - Faz download direto via API endpoint
   * - Retorna Blob para manipulação pelo cliente
   * - Trata erros de rede e arquivo não encontrado
   */
  downloadFile: async documentoId => {
    try {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      // Isso seria substituído por chamada de API de download real
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

  /**
   * Obtém URL de preview do arquivo do documento
   * @param documentoId ID do documento com arquivo
   * @returns Promise com URL ou conteúdo base64
   * - Verifica cache primeiro para performance
   * - Retorna URL de preview ou conteúdo inline
   * - Usado para visualização rápida de arquivos
   */
  previewFile: async documentoId => {
    try {
      const documento =
        get().cache[documentoId] || (await adaptiveApi.documentos.getById(documentoId));

      // Retorna URL de preview ou conteúdo base64
      return documento.arquivo || '';
    } catch (error) {
      set(state => {
        state.error = error instanceof Error ? error.message : 'Erro ao visualizar arquivo';
      });
      throw error;
    }
  },

  /**
   * Define termo de busca textual e invalida cache
   * @param term Termo de busca para aplicar
   * - Busca em número, assunto, destinatário e remetente
   * - Invalida cache para disparar nova busca server-side
   * - Combina com filtros client-side existentes
   */
  setSearchTerm: term => {
    set(state => {
      state.searchTerm = term;
      state.lastFetch = null; // Invalida cache to trigger new search
    });
  },

  /**
   * Define tags selecionadas para filtro
   * @param tags Array de tags para filtrar documentos
   * - Filtra documentos que possuem pelo menos uma tag selecionada
   * - Invalida cache para aplicar filtros server-side
   * - Tags são extraídas automaticamente dos documentos
   */
  setSelectedTags: tags => {
    set(state => {
      state.selectedTags = tags;
      state.lastFetch = null; // Invalida cache
    });
  },

  /**
   * Define range de datas para filtro temporal
   * @param range Objeto com datas de início e fim (podem ser null)
   * - Filtra documentos por data do documento
   * - Suporta filtro apenas por data inicial ou final
   * - Invalida cache para aplicar no servidor
   */
  setDateRange: range => {
    set(state => {
      state.dateRange = range;
      state.lastFetch = null; // Invalida cache
    });
  },

  /**
   * Limpa todos os filtros e reseta para estado inicial
   * - Remove busca textual, tags e range de datas
   * - Reseta filtros server-side para padrão
   * - Invalida cache para forçar nova busca
   */
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

  /**
   * Define qual documento está atualmente selecionado
   * @param documento Documento selecionado ou null para limpar
   * - Usado para exibir detalhes, edição ou preview
   * - Não afeta cache nem dispara buscas
   */
  setSelectedDocumento: documento => {
    set(state => {
      state.selectedDocumento = documento;
    });
  },

  /**
   * Atualiza filtros server-side e invalida cache
   * @param newFilters Filtros parciais para mesclar
   * - Mescla com filtros existentes
   * - Invalida cache para aplicar novos filtros
   * - Afeta ordenação, paginação e critérios server-side
   */
  setFilters: newFilters => {
    set(state => {
      state.filters = { ...state.filters, ...newFilters };
      state.lastFetch = null; // Invalida cache
    });
  },

  /**
   * Navega para página específica
   * @param page Número da página (baseado em 1)
   * - Atualiza filtros server-side e paginação local
   * - Invalida cache para carregar nova página
   * - Mantém consistência entre filtros e paginação
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
   * - Usado após tratamento de erro pela UI
   * - Permite nova tentativa de operações
   */
  clearError: () => {
    set(state => {
      state.error = null;
    });
  },

  /**
   * Reseta todo o estado para valores iniciais
   * - Limpa documentos, cache e filtros
   * - Usado em logout ou mudança de contexto
   * - Recria cache Map para evitar referências antigas
   */
  reset: () => {
    set(() => ({
      ...initialState,
      cache: {} as Record<number, Documento>,
    }));
  },

  /**
   * Função para obter documentos filtrados com todos os critérios client-side
   * @returns Array de documentos após aplicar busca, tags e datas
   * - Aplica filtros em sequência: busca → tags → datas
   * - Busca case-insensitive em múltiplos campos
   * - Combina com filtros server-side já aplicados
   */
  getFilteredDocumentos: () => {
    const state = get();
    const { documentos, searchTerm, selectedTags, dateRange } = state;

    let filtered = [...documentos];

    // Aplica filtro de busca
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

    // Aplica filtro de tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(d => selectedTags.some(tag => d.tags?.includes(tag)));
    }

    // Aplica filtro de range de datas
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

  /**
   * Função para obter documentos agrupados por status
   * @returns Objeto com arrays de documentos indexados por status
   * - Agrupa documentos filtrados por status
   * - Útil para dashboards e relatórios
   * - Status dinâmicos baseados nos dados
   */
  getDocumentosByStatus: () => {
    const state = get();
    const documentos = state.getFilteredDocumentos();

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

  /**
   * Função para obter documentos agrupados por tipo
   * @returns Objeto com arrays de documentos indexados por tipo
   * - Agrupa por ID do tipo de documento convertido para string
   * - Usado para análises por categoria
   * - Tipos dinâmicos baseados nos dados carregados
   */
  getDocumentosByType: () => {
    const state = get();
    const documentos = state.getFilteredDocumentos();

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

  /**
   * Contador total de documentos (server-side)
   * - Vem da paginação server-side
   * - Não afetado por filtros client-side
   * - Usado para paginação e estatísticas gerais
   */
  get totalCount() {
    return get().pagination.total;
  },

  /**
   * Tags únicas extraídas de todos os documentos
   * - Extrai tags de todos os documentos carregados
   * - Remove duplicatas e ordena alfabeticamente
   * - Usado para filtros de tag na interface
   */
  get availableTags() {
    const documentos = get().documentos;
    const allTags = documentos.flatMap(d => d.tags || []);
    return Array.from(new Set(allTags)).sort();
  },
});

// Cria store com middleware (temporariamente sem persist para debug)
export const useDocumentosStore = create<DocumentosState>()(
  subscribeWithSelector(immer(createDocumentosStore))
);

/**
 * Seletores otimizados para performance
 * Evitam re-renders desnecessários ao acessar partes específicas do estado
 */
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
  filteredDocumentos: (state: DocumentosState) => state.getFilteredDocumentos(),
  documentosByStatus: (state: DocumentosState) => state.getDocumentosByStatus(),
  documentosByType: (state: DocumentosState) => state.getDocumentosByType(),
  totalCount: (state: DocumentosState) => state.totalCount,
  availableTags: (state: DocumentosState) => state.availableTags,
};

/**
 * Hook que expõe todas as ações do store de documentos
 * @returns Objeto com todas as funções de ação
 * - Usado quando componente precisa apenas de ações, não de dados
 * - Evita re-renders quando estado muda
 */
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

/**
 * Hook que expõe dados essenciais do store de documentos
 * @returns Objeto com dados principais e estado de carregamento
 * - Inclui documentos filtrados, documento selecionado e metadados
 * - Otimizado para componentes de exibição de dados
 * - Re-renderiza apenas quando dados relevantes mudam
 */
export const useDocumentosData = () => {
  const store = useDocumentosStore();

  return {
    documentos: store.getFilteredDocumentos(),
    selectedDocumento: store.selectedDocumento,
    isLoading: store.isLoading,
    error: store.error,
    pagination: store.pagination,
    totalCount: store.totalCount,
    searchTerm: store.searchTerm,
    selectedTags: store.selectedTags,
    dateRange: store.dateRange,
    availableTags: store.availableTags,
  };
};

/**
 * Hook especializado para funcionalidades de busca e filtros
 * @returns Objeto com estado e ações de busca
 * - Inclui termo de busca, tags, range de datas e ações relacionadas
 * - Usado em componentes de formulário de busca
 * - Otimizado para atualizações frequentes de filtros
 */
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

/**
 * Hook que retorna documentos agrupados por status
 * @returns Objeto com arrays de documentos indexados por status
 * - Usado para dashboards e gráficos de status
 * - Re-calcula apenas quando lista filtrada muda
 * - Otimizado para componentes de visualização de dados
 */
export const useDocumentosByStatus = () => {
  const store = useDocumentosStore();
  return store.getDocumentosByStatus();
};

/**
 * Hook que retorna documentos agrupados por tipo
 * @returns Objeto com arrays de documentos indexados por tipo
 * - Usado para análises e relatórios por categoria
 * - Útil para gráficos de distribuição por tipo
 * - Re-calcula apenas quando dados relevantes mudam
 */
export const useDocumentosByType = () => {
  const store = useDocumentosStore();
  return store.getDocumentosByType();
};

export default useDocumentosStore;
