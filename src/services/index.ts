// src/services/index.ts

// Base service
export {
  BaseService,
  type ServiceResponse,
  type ServiceListResponse,
  type SearchOptions,
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

// Security services (sem authUtils para evitar conflito com API)
export {
  authService,
  csrfService,
  securityAuditService,
  type User,
  securityConfig,
  type SecurityIssue,
  type SecurityAuditReport,
} from './security';
