/**
 * Configuração centralizada de variáveis de ambiente
 * Todas as variáveis de ambiente são tipadas e validadas
 */

// Tipos para as configurações
export type AppEnvironment = 'development' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type AuthType = 'php' | 'ldap' | 'oauth2' | 'saml';
export type ThemeType = 'light' | 'dark' | 'system';

interface EnvironmentConfig {
  // Ambiente
  NODE_ENV: string;
  APP_ENV: AppEnvironment;
  IS_DEVELOPMENT: boolean;
  IS_STAGING: boolean;
  IS_PRODUCTION: boolean;

  // API
  API_BASE_URL: string;
  API_TIMEOUT: number;
  API_RETRY_ATTEMPTS: number;

  // WebSocket
  WS_URL: string;
  WS_RECONNECT_ATTEMPTS: number;
  WS_RECONNECT_INTERVAL: number;

  // Autenticação
  AUTH_ENDPOINT: string;
  AUTH_TYPE: AuthType;
  AUTH_REFRESH_THRESHOLD: number;
  AUTH_SESSION_TIMEOUT: number;

  // Autenticação Externa
  PHP_AUTH_URL: string;
  PHP_SESSION_NAME: string;
  LDAP_ENABLED: boolean;
  LDAP_URL?: string;
  LDAP_BASE_DN?: string;
  OAUTH2_ENABLED: boolean;
  OAUTH2_CLIENT_ID?: string;
  OAUTH2_REDIRECT_URI?: string;
  SAML_ENABLED: boolean;
  SAML_ENTRY_POINT?: string;
  SAML_ISSUER?: string;

  // Cache
  CACHE_ENABLED: boolean;
  CACHE_TTL: number;
  CACHE_MAX_SIZE: number;
  REDIS_URL: string;

  // Monitoramento
  ANALYTICS_ENABLED: boolean;
  ANALYTICS_ENDPOINT?: string;
  ERROR_TRACKING_ENABLED: boolean;
  PERFORMANCE_MONITORING_ENABLED: boolean;

  // Recursos
  PWA_ENABLED: boolean;
  OFFLINE_ENABLED: boolean;
  NOTIFICATIONS_ENABLED: boolean;
  WEBSOCKET_ENABLED: boolean;

  // Segurança
  CSRF_ENABLED: boolean;
  SECURITY_AUDIT_ENABLED: boolean;
  RATE_LIMITING_ENABLED: boolean;
  CONTENT_SECURITY_POLICY?: string;

  // Debug
  DEBUG_MODE: boolean;
  LOG_LEVEL: LogLevel;
  MOCK_DATA: boolean;
  SHOW_DEV_TOOLS: boolean;

  // Upload
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  UPLOAD_ENDPOINT: string;

  // Paginação
  DEFAULT_PAGE_SIZE: number;
  MAX_PAGE_SIZE: number;

  // UI
  THEME_DEFAULT: ThemeType;
  LANGUAGE_DEFAULT: string;
  TIMEZONE_DEFAULT: string;

  // Recursos Experimentais
  EXPERIMENTAL_FEATURES: boolean;
  BETA_FEATURES: boolean;
}

/**
 * Função helper para obter variável de ambiente com valor padrão
 */
function getEnvVar(key: string, defaultValue = ''): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * Função helper para obter variável de ambiente como boolean
 */
function getEnvBool(key: string, defaultValue = false): boolean {
  const value = getEnvVar(key).toLowerCase();
  return value === 'true' || value === '1';
}

/**
 * Função helper para obter variável de ambiente como número
 */
function getEnvNumber(key: string, defaultValue = 0): number {
  const value = getEnvVar(key);
  return value ? parseInt(value, 10) || defaultValue : defaultValue;
}

/**
 * Função helper para obter variável de ambiente como array
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = getEnvVar(key);
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
}

/**
 * Configuração principal exportada
 */
export const env: EnvironmentConfig = {
  // Ambiente
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  APP_ENV: (getEnvVar('VITE_APP_ENV', 'development') as AppEnvironment),
  IS_DEVELOPMENT: getEnvVar('VITE_APP_ENV', 'development') === 'development',
  IS_STAGING: getEnvVar('VITE_APP_ENV', 'development') === 'staging',
  IS_PRODUCTION: getEnvVar('VITE_APP_ENV', 'development') === 'production',

  // API
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8080/api'),
  API_TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 30000),
  API_RETRY_ATTEMPTS: getEnvNumber('VITE_API_RETRY_ATTEMPTS', 3),

  // WebSocket
  WS_URL: getEnvVar('VITE_WS_URL', 'ws://localhost:8080/ws'),
  WS_RECONNECT_ATTEMPTS: getEnvNumber('VITE_WS_RECONNECT_ATTEMPTS', 5),
  WS_RECONNECT_INTERVAL: getEnvNumber('VITE_WS_RECONNECT_INTERVAL', 3000),

  // Autenticação
  AUTH_ENDPOINT: getEnvVar('VITE_AUTH_ENDPOINT', 'http://localhost:8080/auth'),
  AUTH_TYPE: (getEnvVar('VITE_AUTH_TYPE', 'php') as AuthType),
  AUTH_REFRESH_THRESHOLD: getEnvNumber('VITE_AUTH_REFRESH_THRESHOLD', 300000),
  AUTH_SESSION_TIMEOUT: getEnvNumber('VITE_AUTH_SESSION_TIMEOUT', 3600000),

  // Autenticação Externa
  PHP_AUTH_URL: getEnvVar('VITE_PHP_AUTH_URL', 'http://localhost:8080/auth/php'),
  PHP_SESSION_NAME: getEnvVar('VITE_PHP_SESSION_NAME', 'PHPSESSID'),
  LDAP_ENABLED: getEnvBool('VITE_LDAP_ENABLED', false),
  LDAP_URL: getEnvVar('VITE_LDAP_URL') || undefined,
  LDAP_BASE_DN: getEnvVar('VITE_LDAP_BASE_DN') || undefined,
  OAUTH2_ENABLED: getEnvBool('VITE_OAUTH2_ENABLED', false),
  OAUTH2_CLIENT_ID: getEnvVar('VITE_OAUTH2_CLIENT_ID') || undefined,
  OAUTH2_REDIRECT_URI: getEnvVar('VITE_OAUTH2_REDIRECT_URI') || undefined,
  SAML_ENABLED: getEnvBool('VITE_SAML_ENABLED', false),
  SAML_ENTRY_POINT: getEnvVar('VITE_SAML_ENTRY_POINT') || undefined,
  SAML_ISSUER: getEnvVar('VITE_SAML_ISSUER') || undefined,

  // Cache
  CACHE_ENABLED: getEnvBool('VITE_CACHE_ENABLED', true),
  CACHE_TTL: getEnvNumber('VITE_CACHE_TTL', 600000),
  CACHE_MAX_SIZE: getEnvNumber('VITE_CACHE_MAX_SIZE', 100),
  REDIS_URL: getEnvVar('VITE_REDIS_URL', 'redis://localhost:6379'),

  // Monitoramento
  ANALYTICS_ENABLED: getEnvBool('VITE_ANALYTICS_ENABLED', false),
  ANALYTICS_ENDPOINT: getEnvVar('VITE_ANALYTICS_ENDPOINT') || undefined,
  ERROR_TRACKING_ENABLED: getEnvBool('VITE_ERROR_TRACKING_ENABLED', false),
  PERFORMANCE_MONITORING_ENABLED: getEnvBool('VITE_PERFORMANCE_MONITORING_ENABLED', false),

  // Recursos
  PWA_ENABLED: getEnvBool('VITE_PWA_ENABLED', true),
  OFFLINE_ENABLED: getEnvBool('VITE_OFFLINE_ENABLED', true),
  NOTIFICATIONS_ENABLED: getEnvBool('VITE_NOTIFICATIONS_ENABLED', true),
  WEBSOCKET_ENABLED: getEnvBool('VITE_WEBSOCKET_ENABLED', true),

  // Segurança
  CSRF_ENABLED: getEnvBool('VITE_CSRF_ENABLED', true),
  SECURITY_AUDIT_ENABLED: getEnvBool('VITE_SECURITY_AUDIT_ENABLED', false),
  RATE_LIMITING_ENABLED: getEnvBool('VITE_RATE_LIMITING_ENABLED', true),
  CONTENT_SECURITY_POLICY: getEnvVar('VITE_CONTENT_SECURITY_POLICY') || undefined,

  // Debug
  DEBUG_MODE: getEnvBool('VITE_DEBUG_MODE', false),
  LOG_LEVEL: (getEnvVar('VITE_LOG_LEVEL', 'warn') as LogLevel),
  MOCK_DATA: getEnvBool('VITE_MOCK_DATA', false),
  SHOW_DEV_TOOLS: getEnvBool('VITE_SHOW_DEV_TOOLS', false),

  // Upload
  MAX_FILE_SIZE: getEnvNumber('VITE_MAX_FILE_SIZE', 10485760), // 10MB
  ALLOWED_FILE_TYPES: getEnvArray('VITE_ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'jpg', 'png']),
  UPLOAD_ENDPOINT: getEnvVar('VITE_UPLOAD_ENDPOINT', 'http://localhost:8080/upload'),

  // Paginação
  DEFAULT_PAGE_SIZE: getEnvNumber('VITE_DEFAULT_PAGE_SIZE', 10),
  MAX_PAGE_SIZE: getEnvNumber('VITE_MAX_PAGE_SIZE', 100),

  // UI
  THEME_DEFAULT: (getEnvVar('VITE_THEME_DEFAULT', 'light') as ThemeType),
  LANGUAGE_DEFAULT: getEnvVar('VITE_LANGUAGE_DEFAULT', 'pt-BR'),
  TIMEZONE_DEFAULT: getEnvVar('VITE_TIMEZONE_DEFAULT', 'America/Sao_Paulo'),

  // Recursos Experimentais
  EXPERIMENTAL_FEATURES: getEnvBool('VITE_EXPERIMENTAL_FEATURES', false),
  BETA_FEATURES: getEnvBool('VITE_BETA_FEATURES', false),
};

/**
 * Validação das configurações essenciais
 */
export function validateEnvironment(): string[] {
  const errors: string[] = [];

  // Validar URLs obrigatórias
  if (!env.API_BASE_URL) {
    errors.push('VITE_API_BASE_URL é obrigatória');
  }

  if (!env.AUTH_ENDPOINT) {
    errors.push('VITE_AUTH_ENDPOINT é obrigatória');
  }

  // Validar configuração de autenticação
  if (env.LDAP_ENABLED && !env.LDAP_URL) {
    errors.push('VITE_LDAP_URL é obrigatória quando LDAP está habilitado');
  }

  if (env.OAUTH2_ENABLED && !env.OAUTH2_CLIENT_ID) {
    errors.push('VITE_OAUTH2_CLIENT_ID é obrigatório quando OAuth2 está habilitado');
  }

  if (env.SAML_ENABLED && !env.SAML_ENTRY_POINT) {
    errors.push('VITE_SAML_ENTRY_POINT é obrigatório quando SAML está habilitado');
  }

  // Validar configuração de cache
  if (env.CACHE_ENABLED && !env.REDIS_URL) {
    errors.push('VITE_REDIS_URL é obrigatória quando cache está habilitado');
  }

  // Validar monitoramento
  if (env.ANALYTICS_ENABLED && !env.ANALYTICS_ENDPOINT) {
    errors.push('VITE_ANALYTICS_ENDPOINT é obrigatório quando analytics está habilitado');
  }

  return errors;
}

/**
 * Log das configurações (apenas em desenvolvimento)
 */
export function logEnvironmentConfig(): void {
  if (env.IS_DEVELOPMENT && env.DEBUG_MODE) {
    console.group('🔧 Configuração de Ambiente');
    console.log('Ambiente:', env.APP_ENV);
    console.log('API URL:', env.API_BASE_URL);
    console.log('WebSocket URL:', env.WS_URL);
    console.log('Auth Type:', env.AUTH_TYPE);
    console.log('Debug Mode:', env.DEBUG_MODE);
    console.log('PWA Enabled:', env.PWA_ENABLED);
    console.log('Cache Enabled:', env.CACHE_ENABLED);
    console.groupEnd();
  }
}

/**
 * Verificar se está em modo de desenvolvimento
 */
export const isDevelopment = env.IS_DEVELOPMENT;

/**
 * Verificar se está em modo de produção
 */
export const isProduction = env.IS_PRODUCTION;

/**
 * Export padrão
 */
export default env;