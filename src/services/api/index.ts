// API Layer - Main exports
export { api, httpClient, authUtils } from './client';
export { apiEndpoints as endpoints } from './endpoints';
export * from './schemas';

// Re-export commonly used APIs for convenience
export { 
  demandasApi,
  documentosApi,
  orgaosApi,
  assuntosApi,
  provedoresApi,
  autoridadesApi,
  tiposApi,
  authApi
} from './endpoints';