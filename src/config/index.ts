/**
 * Configurações centralizadas da aplicação
 */

export { env, validateEnvironment, logEnvironmentConfig, isDevelopment, isProduction } from './env';
export type { AppEnvironment, LogLevel, AuthType, ThemeType } from './env';

// Naming conventions
export * from './namingConventions';

// Configurações de API
export const API_CONFIG = {
  baseURL: env.API_BASE_URL,
  timeout: env.API_TIMEOUT,
  retryAttempts: env.API_RETRY_ATTEMPTS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Configurações de WebSocket
export const WS_CONFIG = {
  url: env.WS_URL,
  reconnectAttempts: env.WS_RECONNECT_ATTEMPTS,
  reconnectInterval: env.WS_RECONNECT_INTERVAL,
  heartbeatInterval: 30000,
} as const;

// Configurações de cache
export const CACHE_CONFIG = {
  enabled: env.CACHE_ENABLED,
  ttl: env.CACHE_TTL,
  maxSize: env.CACHE_MAX_SIZE,
  redisUrl: env.REDIS_URL,
  keyPrefix: 'synapse:',
} as const;

// Configurações de upload
export const UPLOAD_CONFIG = {
  maxFileSize: env.MAX_FILE_SIZE,
  allowedTypes: env.ALLOWED_FILE_TYPES,
  endpoint: env.UPLOAD_ENDPOINT,
  chunkSize: 1024 * 1024, // 1MB chunks
} as const;

// Configurações de paginação
export const PAGINATION_CONFIG = {
  defaultPageSize: env.DEFAULT_PAGE_SIZE,
  maxPageSize: env.MAX_PAGE_SIZE,
  pageSizeOptions: [5, 10, 25, 50, 100],
} as const;

// Configurações de UI
export const UI_CONFIG = {
  theme: env.THEME_DEFAULT,
  language: env.LANGUAGE_DEFAULT,
  timezone: env.TIMEZONE_DEFAULT,
  animations: {
    duration: 300,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
  },
} as const;

// Configurações de segurança
export const SECURITY_CONFIG = {
  csrf: env.CSRF_ENABLED,
  audit: env.SECURITY_AUDIT_ENABLED,
  rateLimiting: env.RATE_LIMITING_ENABLED,
  csp: env.CONTENT_SECURITY_POLICY,
  sessionTimeout: env.AUTH_SESSION_TIMEOUT,
} as const;

// Constantes da aplicação
export const APP_CONSTANTS = {
  APP_NAME: 'Synapse',
  APP_VERSION: '1.0.0',
  COMPANY: 'Synapse Team',
  SUPPORT_EMAIL: 'suporte@synapse.local',
  DOCUMENTATION_URL: 'https://docs.synapse.local',
} as const;

// Configurações de monitoramento
export const MONITORING_CONFIG = {
  analytics: env.ANALYTICS_ENABLED,
  errorTracking: env.ERROR_TRACKING_ENABLED,
  performance: env.PERFORMANCE_MONITORING_ENABLED,
  sampleRate: env.IS_PRODUCTION ? 0.1 : 1.0, // 10% em produção, 100% em dev
} as const;

// Configurações de recursos
export const FEATURES_CONFIG = {
  pwa: env.PWA_ENABLED,
  offline: env.OFFLINE_ENABLED,
  notifications: env.NOTIFICATIONS_ENABLED,
  websocket: env.WEBSOCKET_ENABLED,
  experimental: env.EXPERIMENTAL_FEATURES,
  beta: env.BETA_FEATURES,
} as const;

// Re-export env para compatibilidade
import { env } from './env';
export { env };