/**
 * ================================================================
 * API LAYER - PONTO DE ENTRADA PRINCIPAL
 * ================================================================
 *
 * Este arquivo exporta todas as APIs consolidadas para integração com PHP.
 * Use este ponto único para importar qualquer funcionalidade da API.
 */

// Camada de API - Exportações principais
export { api, httpClient, authUtils, getApiMetrics, clearApiCache, healthCheck } from './client';

export { apiEndpoints as endpoints, PHP_ENDPOINTS } from './endpoints';

export * from './schemas';

// Re-exportação das APIs mais utilizadas por conveniência
export {
  demandasApi,
  documentosApi,
  orgaosApi,
  assuntosApi,
  provedoresApi,
  autoridadesApi,
  tiposApi,
  authApi,
  uploadApi,
  relatoriosApi,
  sistemaApi,
} from './endpoints';
