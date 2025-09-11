/**
 * ================================================================
 * API LAYER - PONTO DE ENTRADA PRINCIPAL DO SISTEMA SYNAPSE
 * ================================================================
 *
 * Este arquivo é o ponto de entrada centralizado para toda a camada de API do sistema.
 * Fornece exportações organizadas e convenientes para acesso a todas as funcionalidades da API.
 *
 * Funcionalidades exportadas:
 * - Cliente HTTP base com retry automático e cache
 * - APIs REST completas para todas as entidades
 * - Utilitários de autenticação JWT
 * - Schemas de validação Zod
 * - Métricas e monitoramento
 * - Health checks e configurações
 *
 * Organização das exportações:
 * - Clientes HTTP: api, httpClient (clientes base)
 * - Autenticação: authUtils (JWT e sessões)
 * - Utilitários: getApiMetrics, clearApiCache, healthCheck
 * - Endpoints: apiEndpoints consolidado + APIs individuais
 * - Schemas: Todos os schemas Zod para validação
 * - Referência: NODEJS_ENDPOINTS (mapeamento para backend)
 *
 * @example
 * ```typescript
 * // Importação do objeto consolidado
 * import { endpoints } from '@/services/api';
 * const demandas = await endpoints.demandas.list();
 *
 * // Importação de APIs específicas
 * import { demandasApi, authApi } from '@/services/api';
 * const user = await authApi.me();
 *
 * // Importação de utilitários
 * import { api, authUtils, getApiMetrics } from '@/services/api';
 * const metrics = getApiMetrics();
 * ```
 *
 * @fileoverview Ponto de entrada central para toda a camada de API
 * @version 2.0.0
 * @since 2024-01-15
 */

/**
 * Exporta clientes HTTP base e utilitários de infraestrutura
 *
 * - api: Cliente de alto nível com validação automática
 * - httpClient: Cliente ky.js base para casos especiais
 * - authUtils: Utilitários para gerenciamento de tokens JWT
 * - getApiMetrics: Função para obter métricas de performance
 * - clearApiCache: Função para limpeza manual do cache
 * - healthCheck: Função para verificar saúde da API
 */
export { api, httpClient, authUtils, getApiMetrics, clearApiCache, healthCheck } from './client';

/**
 * Exporta endpoints consolidados e mapeamento de referência
 *
 * - endpoints: Objeto com todas as APIs organizadas
 * - NODEJS_ENDPOINTS: Mapeamento de URLs para referência do backend
 */
export { apiEndpoints as endpoints, NODEJS_ENDPOINTS } from './endpoints';

/**
 * Re-exporta todos os schemas de validação Zod
 * Inclui schemas para entidades, filtros, operações CRUD e validações
 */
export * from './schemas';

/**
 * Re-exportação das APIs individuais mais utilizadas
 *
 * Permite importação direta das APIs específicas sem necessidade
 * de navegar pelo objeto consolidado endpoints
 *
 * @example
 * ```typescript
 * import { demandasApi, authApi } from '@/services/api';
 *
 * // Usar APIs diretamente
 * const demandas = await demandasApi.list();
 * const user = await authApi.me();
 * ```
 */
export {
  /** API para operações com demandas */
  demandasApi,
  /** API para operações com documentos */
  documentosApi,
  /** API para operações com órgãos */
  orgaosApi,
  /** API para operações com assuntos */
  assuntosApi,
  /** API para operações com provedores */
  provedoresApi,
  /** API para operações com autoridades */
  autoridadesApi,
  /** API para tipos e metadados */
  tiposApi,
  /** API para autenticação e sessões */
  authApi,
  /** API para upload de arquivos */
  uploadApi,
  /** API para relatórios e métricas */
  relatoriosApi,
  /** API para monitoramento de sistema */
  sistemaApi,
} from './endpoints';
