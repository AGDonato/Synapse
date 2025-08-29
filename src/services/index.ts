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
 * - BaseService: Classe abstrata para CRUD padronizado
 * - ServiceResponse: Interface de resposta padrão
 * - ServiceListResponse: Interface para operações de lista
 * - SearchOptions: Parâmetros de busca e paginação
 */
export {
  BaseService,
  type ServiceResponse,
  type ServiceListResponse,
  type SearchOptions,
} from './BaseService';

/**
 * Serviços de domínio específicos
 * - AssuntosService: Gerenciamento de assuntos de demandas
 * - OrgaosService: Gerenciamento de órgãos públicos
 * - Inclui instâncias singleton prontas para uso
 */
export { AssuntosService, assuntosService } from './AssuntosService';
export { OrgaosService, orgaosService } from './OrgaosService';

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
 */
export * from './monitoring/healthCheck';

/**
 * Serviços PWA (Progressive Web App)
 * - Service Worker registration e management
 * - Funcionalidades offline e cache
 */
export * from './pwa/serviceWorkerRegistration';

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
