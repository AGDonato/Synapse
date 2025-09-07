/**
 * CENTRAL DE SERVICES - EXPORTS E UTILITÁRIOS
 *
 * Este arquivo serve como ponto central para todos os serviços do sistema.
 * Organiza exports por categoria para facilitar importação:
 * - Base Service: Classe abstrata e interfaces para CRUD
 * - Domain Services: Serviços de entidades específicas (Assuntos, Órgãos)
 * - API Services: Cliente HTTP e adapters para APIs
 * - Analytics Services: Métricas e telemetria
 * - Monitoring Services: Health checks e observabilidade
 * - PWA Services: Service Worker e funcionalidades offline
 * - Security Services: Autenticação, CSRF, auditoria
 *
 * Padrão de uso:
 * - Import específico: import { assuntosService } from './services'
 * - Import de tipos: import type { ServiceResponse } from './services'
 * - Import de categoria: import { authService, csrfService } from './services'
 *
 * Evita exports conflitantes e mantém APIs bem definidas.
 */

// src/services/index.ts

/**
 * Base service e interfaces compartilhadas
 * Note: Base services have been removed due to missing repository dependencies
 */
// Removed BaseService exports - missing repository dependencies

/**
 * Serviços de domínio específicos
 * Note: Domain services have been removed due to missing repository dependencies
 */
// Removed OrgaosService exports - missing repository dependencies

/**
 * Serviços de API
 * - Cliente HTTP configurado
 * - Adapters para diferentes backends
 * - Schemas e validações de API
 */
export * from './api';

/**
 * Serviços de analytics e métricas
 * - Core analytics para telemetria
 * - Tracking de eventos do usuário
 */
export * from './analytics/core';

/**
 * Serviços de monitoramento
 * - Health checks para status da aplicação
 * - Métricas de performance e uptime
 * Note: Monitoring services are currently mocked/disabled
 */
// export * from './monitoring/healthCheck'; // Module doesn't exist

/**
 * Serviços PWA (Progressive Web App)
 * - Service Worker registration e management
 * - Funcionalidades offline e cache
 * Note: PWA services are currently not implemented
 */
// export * from './pwa/serviceWorkerRegistration'; // Module doesn't exist

/**
 * Serviços de segurança
 * - Authentication service e user management
 * - CSRF protection e token management
 * - Security audit e compliance reporting
 * Nota: Sem authUtils para evitar conflitos com API
 */
export {
  authService,
  csrfService,
  securityAuditService,
  type User,
  securityConfig,
  type SecurityIssue,
  type SecurityAuditReport,
} from './security';
