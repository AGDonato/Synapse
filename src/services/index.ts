// src/services/index.ts

// Base service
export { 
  BaseService, 
  type ServiceResponse, 
  type ServiceListResponse, 
  type SearchOptions 
} from './BaseService';

// Specific services
export { AssuntosService, assuntosService } from './AssuntosService';
export { OrgaosService, orgaosService } from './OrgaosService';

// API services
export * from './api';

// Analytics services
export * from './analytics/core';

// Monitoring services
export * from './monitoring/healthCheck';

// PWA services
export * from './pwa/serviceWorkerRegistration';

// Security services
export * from './security';