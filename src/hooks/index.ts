/**
 * Índice central dos hooks da aplicação Synapse
 *
 * @description
 * Exportação centralizada e organizada de todos os hooks customizados:
 * - Analytics & Performance: Monitoramento e métricas de uso
 * - Core Functionality: Funcionalidades essenciais da aplicação
 * - Document Management: Gestão completa de documentos
 * - Filters & Providers: Sistema de filtros e provedores
 * - Query Hooks: Integração com APIs e cache de dados
 *
 * @module hooks/index
 */

// ========== ANALYTICS & PERFORMANCE ==========
// Hooks para monitoramento, métricas e otimização de performance
export { useAnalytics } from './useAnalytics'; // Rastreamento de eventos e comportamento
export { usePerformance } from './usePerformance'; // Monitoramento de performance de componentes
export { usePerformanceTracking } from './usePerformanceTracking'; // Rastreamento detalhado de métricas

// ========== CORE FUNCTIONALITY ==========
// Funcionalidades essenciais e utilitários gerais da aplicação
export { useBackup } from './useBackup'; // Sistema de backup e restauração de dados
export { useCrud, type UseCrudConfig, type UseCrudReturn } from './useCrud'; // Operações CRUD genéricas
export { useDebounce } from './useDebounce'; // Otimização de performance com debounce
export { useKeyboardShortcuts } from './useKeyboardShortcuts'; // Atalhos de teclado globais
export { useNotifications } from './useNotifications'; // Sistema de notificações do usuário
export { useServiceWorker } from './useServiceWorker'; // Integração com PWA e service worker

// ========== DOCUMENT MANAGEMENT ==========
// Hooks especializados para gestão completa de documentos
export { useDocumentHandlers } from './useDocumentHandlers'; // Manipulação de eventos de documentos
export { useDocumentSections } from './useDocumentSections'; // Controle de seções visíveis
export { useDocumentSubmission } from './useDocumentSubmission'; // Submissão e envio de documentos
export { useNovoDocumentoValidation } from './useNovoDocumentoValidation'; // Validação de formulários
export { usePesquisas } from './usePesquisas'; // Gerenciamento de pesquisas
export { useRetificacoes } from './useRetificacoes'; // Controle de retificações
export { useSearchHandlers } from './useSearchHandlers'; // Manipuladores de busca

// ========== FILTERS & PROVIDERS ==========
// Sistema de filtragem avançada e gerenciamento de provedores
export { useProviderFilters } from './useProviderFilters'; // Filtros específicos de provedores
export { useSavedFilters } from './useSavedFilters'; // Persistência de filtros personalizados

// ========== QUERY HOOKS ==========
// Integração com APIs, cache inteligente e gerenciamento de estado
export { useDemandasData, useDemandas, useDemanda, demandaQueryKeys } from './queries/useDemandas'; // Gestão completa de demandas
export {
  useDocumentosData,
  useDocumentos,
  useDocumentosByDemanda,
  useDocumento,
  documentoQueryKeys,
} from './queries/useDocumentos'; // Gestão completa de documentos
