/**
 * Índice de hooks especializados da HomePage
 *
 * @description
 * Exportação centralizada dos hooks específicos da página inicial:
 * - Gerenciamento de filtros avançados para tabelas e estatísticas
 * - Controle de estado dos modais de visualização
 * - Processamento de dados estatísticos e métricas
 * - Utilitários de performance (debounce)
 *
 * @module pages/HomePage/hooks/index
 */

// ========== HOOKS ESPECIALIZADOS DA HOMEPAGE ==========
export { useHomePageFilters } from './useHomePageFilters'; // Sistema de filtros da página inicial
export { useModalManagement } from './useModalManagement'; // Gerenciamento de modais

// ========== HOOKS COMPARTILHADOS ==========
export { useDebounce } from '../../../hooks/useDebounce'; // Otimização de performance
