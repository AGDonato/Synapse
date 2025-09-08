/**
 * ================================================================
 * AUTH CONFIG - CONFIGURADOR CENTRAL DE AUTENTICAÇÃO SYNAPSE
 * ================================================================
 *
 * Este arquivo implementa um sistema completo de configuração para autenticação
 * externa, suportando múltiplos provedores e cenários de integração.
 *
 * Funcionalidades principais:
 * - Factory patterns para criação de configurações predefinidas
 * - Suporte completo a Laravel/PHP, LDAP, OAuth2 e SAML
 * - Mapeamentos de permissões flexíveis por tipo de organização
 * - Validação robusta de configurações com warnings e errors
 * - Configurações específicas para desenvolvimento e produção
 * - Gestão centralizada de variáveis de ambiente
 * - Templates prontos para cenários comuns de integração
 *
 * Provedores suportados:
 * - Laravel/PHP Backend: Integração direta com APIs PHP/Laravel
 * - LDAP/Active Directory: Autenticação corporativa tradicional
 * - OAuth2/OIDC: Provedores externos (Google, Azure AD, etc.)
 * - SAML: Single Sign-On empresarial
 * - Mock/Dev: Configurações para desenvolvimento e testes
 *
 * Mapeamentos de permissões:
 * - Government: Para órgãos públicos e jurídicos
 * - Corporate: Para empresas e organizações privadas
 * - LDAP-based: Baseado em grupos do Active Directory
 *
 * Arquitetura de configuração:
 * - Factory functions para cada provedor
 * - Environment variables com prefixos organizados
 * - Validation system com feedback detalhado
 * - Permission mapping system flexível
 * - Development/Production modes distintos
 *
 * @fileoverview Configurador central de autenticação multi-provedor
 * @version 2.0.0
 * @since 2024-01-20
 * @author Synapse Team
 */

import type {
  AuthProviderConfig,
  CustomPHPConfig,
  LDAPConfig,
  OAuth2Config,
  PermissionMapping,
  SAMLConfig,
} from './externalAuthAdapter';
import { logger } from '../../../shared/utils/logger';

/**
 * ===================================================================
 * CONSTANTES DE VARIÁVEIS DE AMBIENTE
 * ===================================================================
 *
 * Centraliza todas as chaves de variáveis de ambiente para configuração
 * de autenticação, organizadas por categoria de provedor.
 */
export const AUTH_ENV_KEYS = {
  /** Configurações gerais de autenticação */
  AUTH_PROVIDER: 'VITE_AUTH_PROVIDER',
  AUTH_SESSION_TIMEOUT: 'VITE_AUTH_SESSION_TIMEOUT',
  AUTH_ENABLE_SSO: 'VITE_AUTH_ENABLE_SSO',
  AUTH_REQUIRE_MFA: 'VITE_AUTH_REQUIRE_MFA',

  /** Configurações para backend PHP/Laravel */
  PHP_BASE_URL: 'VITE_PHP_BASE_URL',
  PHP_LOGIN_ENDPOINT: 'VITE_PHP_LOGIN_ENDPOINT',
  PHP_REFRESH_ENDPOINT: 'VITE_PHP_REFRESH_ENDPOINT',
  PHP_LOGOUT_ENDPOINT: 'VITE_PHP_LOGOUT_ENDPOINT',
  PHP_PROFILE_ENDPOINT: 'VITE_PHP_PROFILE_ENDPOINT',
  PHP_VERIFY_ENDPOINT: 'VITE_PHP_VERIFY_ENDPOINT',
  PHP_TIMEOUT: 'VITE_PHP_TIMEOUT',

  /** Configurações para LDAP/Active Directory */
  LDAP_URL: 'VITE_LDAP_URL',
  LDAP_BIND_DN: 'VITE_LDAP_BIND_DN',
  LDAP_BIND_PASSWORD: 'VITE_LDAP_BIND_PASSWORD',
  LDAP_BASE_DN: 'VITE_LDAP_BASE_DN',
  LDAP_SEARCH_FILTER: 'VITE_LDAP_SEARCH_FILTER',

  /** Configurações para OAuth2/OIDC */
  OAUTH2_CLIENT_ID: 'VITE_OAUTH2_CLIENT_ID',
  OAUTH2_CLIENT_SECRET: 'VITE_OAUTH2_CLIENT_SECRET',
  OAUTH2_AUTH_URL: 'VITE_OAUTH2_AUTH_URL',
  OAUTH2_TOKEN_URL: 'VITE_OAUTH2_TOKEN_URL',
  OAUTH2_USER_INFO_URL: 'VITE_OAUTH2_USER_INFO_URL',
  OAUTH2_REDIRECT_URI: 'VITE_OAUTH2_REDIRECT_URI',

  /** Configurações para SAML */
  SAML_ENTRY_POINT: 'VITE_SAML_ENTRY_POINT',
  SAML_ISSUER: 'VITE_SAML_ISSUER',
  SAML_CERT: 'VITE_SAML_CERT',
} as const;

/**
 * ===================================================================
 * FACTORY FUNCTIONS PARA CONFIGURAÇÕES PREDEFINIDAS
 * ===================================================================
 */

/**
 * Cria configuração otimizada para integração com Laravel/PHP Backend
 *
 * @param baseUrl - URL base opcional (sobrescreve variável de ambiente)
 * @returns Configuração completa para autenticação PHP
 *
 * @example
 * ```typescript
 * // Usando variáveis de ambiente
 * const config = createLaravelConfig();
 *
 * // Sobrescrevendo URL
 * const config = createLaravelConfig('https://api.meudominio.com');
 * ```
 */
export function createLaravelConfig(baseUrl?: string): AuthProviderConfig {
  const url = baseUrl || import.meta.env[AUTH_ENV_KEYS.PHP_BASE_URL] || 'http://localhost:8000';

  return {
    provider: 'custom_php',
    config: {
      baseUrl: url,
      endpoints: {
        login: import.meta.env[AUTH_ENV_KEYS.PHP_LOGIN_ENDPOINT] || '/api/auth/login',
        refresh: import.meta.env[AUTH_ENV_KEYS.PHP_REFRESH_ENDPOINT] || '/api/auth/refresh',
        logout: import.meta.env[AUTH_ENV_KEYS.PHP_LOGOUT_ENDPOINT] || '/api/auth/logout',
        profile: import.meta.env[AUTH_ENV_KEYS.PHP_PROFILE_ENDPOINT] || '/api/auth/user',
        verify: import.meta.env[AUTH_ENV_KEYS.PHP_VERIFY_ENDPOINT] || '/api/auth/verify',
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: Number(import.meta.env[AUTH_ENV_KEYS.PHP_TIMEOUT]) || 15000,
    } satisfies CustomPHPConfig,
    sessionTimeout: Number(import.meta.env[AUTH_ENV_KEYS.AUTH_SESSION_TIMEOUT]) || 8 * 60 * 60, // 8 horas
    enableSSO: import.meta.env[AUTH_ENV_KEYS.AUTH_ENABLE_SSO] === 'true',
    requireMFA: import.meta.env[AUTH_ENV_KEYS.AUTH_REQUIRE_MFA] === 'true',
  };
}

/**
 * Cria configuração para autenticação LDAP/Active Directory
 *
 * @returns Configuração completa para autenticação LDAP
 *
 * @example
 * ```typescript
 * // Configuração automática via environment variables
 * const config = createLDAPConfig();
 *
 * // Requer as seguintes variáveis de ambiente:
 * // VITE_LDAP_URL=ldaps://dc.empresa.com:636
 * // VITE_LDAP_BIND_DN=cn=service-account,ou=ServiceAccounts,dc=empresa,dc=com
 * // VITE_LDAP_BIND_PASSWORD=senha_segura
 * // VITE_LDAP_BASE_DN=ou=Users,dc=empresa,dc=com
 * ```
 */
export function createLDAPConfig(): AuthProviderConfig {
  return {
    provider: 'ldap',
    config: {
      url: import.meta.env[AUTH_ENV_KEYS.LDAP_URL] || 'ldap://localhost:389',
      bindDN: import.meta.env[AUTH_ENV_KEYS.LDAP_BIND_DN] || 'cn=admin,dc=company,dc=com',
      bindPassword: import.meta.env[AUTH_ENV_KEYS.LDAP_BIND_PASSWORD] || 'password',
      baseDN: import.meta.env[AUTH_ENV_KEYS.LDAP_BASE_DN] || 'ou=users,dc=company,dc=com',
      searchFilter: import.meta.env[AUTH_ENV_KEYS.LDAP_SEARCH_FILTER] || '(uid={username})',
      attributes: ['cn', 'mail', 'employeeNumber', 'department', 'title', 'memberOf'],
      tlsOptions: {
        rejectUnauthorized: import.meta.env.PROD,
      },
    } satisfies LDAPConfig,
    sessionTimeout: Number(import.meta.env[AUTH_ENV_KEYS.AUTH_SESSION_TIMEOUT]) || 8 * 60 * 60,
    enableSSO: import.meta.env[AUTH_ENV_KEYS.AUTH_ENABLE_SSO] === 'true',
    requireMFA: import.meta.env[AUTH_ENV_KEYS.AUTH_REQUIRE_MFA] === 'true',
  };
}

// Configuração OAuth2 (para provedores externos como Google, Azure AD, etc.)
export function createOAuth2Config(): AuthProviderConfig {
  return {
    provider: 'oauth2',
    config: {
      clientId: import.meta.env[AUTH_ENV_KEYS.OAUTH2_CLIENT_ID] || '',
      clientSecret: import.meta.env[AUTH_ENV_KEYS.OAUTH2_CLIENT_SECRET] || '',
      authorizationUrl: import.meta.env[AUTH_ENV_KEYS.OAUTH2_AUTH_URL] || '',
      tokenUrl: import.meta.env[AUTH_ENV_KEYS.OAUTH2_TOKEN_URL] || '',
      userInfoUrl: import.meta.env[AUTH_ENV_KEYS.OAUTH2_USER_INFO_URL] || '',
      redirectUri:
        import.meta.env[AUTH_ENV_KEYS.OAUTH2_REDIRECT_URI] ||
        `${window.location.origin}/auth/callback`,
      scopes: ['openid', 'profile', 'email'],
    } satisfies OAuth2Config,
    sessionTimeout: Number(import.meta.env[AUTH_ENV_KEYS.AUTH_SESSION_TIMEOUT]) || 4 * 60 * 60, // 4 horas para OAuth2
    enableSSO: true,
    requireMFA: import.meta.env[AUTH_ENV_KEYS.AUTH_REQUIRE_MFA] === 'true',
  };
}

// Configuração SAML
export function createSAMLConfig(): AuthProviderConfig {
  return {
    provider: 'saml',
    config: {
      entryPoint: import.meta.env[AUTH_ENV_KEYS.SAML_ENTRY_POINT] || '',
      issuer: import.meta.env[AUTH_ENV_KEYS.SAML_ISSUER] || 'synapse-app',
      cert: import.meta.env[AUTH_ENV_KEYS.SAML_CERT] || '',
      signatureAlgorithm: 'sha256',
    } satisfies SAMLConfig,
    sessionTimeout: Number(import.meta.env[AUTH_ENV_KEYS.AUTH_SESSION_TIMEOUT]) || 4 * 60 * 60,
    enableSSO: true,
    requireMFA: false, // Normalmente tratado pelo provedor SAML
  };
}

/**
 * Mapeamentos de Permissões
 * Estes definem como funções/grupos de sistemas externos mapeiam para permissões do Synapse
 */

// Mapeamento básico de permissões para organizações governamentais/jurídicas
export const governmentPermissionMapping: PermissionMapping = {
  demandas: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor', 'admin'],
    create: ['analista', 'coordenador', 'diretor', 'admin'],
    update: ['analista', 'coordenador', 'diretor', 'admin'],
    delete: ['coordenador', 'diretor', 'admin'],
    approve: ['coordenador', 'diretor', 'admin'],
  },
  documentos: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor', 'admin'],
    create: ['analista', 'coordenador', 'diretor', 'admin'],
    update: ['analista', 'coordenador', 'diretor', 'admin'],
    delete: ['coordenador', 'diretor', 'admin'],
    sign: ['coordenador', 'diretor', 'admin'],
  },
  cadastros: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor', 'admin'],
    create: ['analista', 'coordenador', 'diretor', 'admin'],
    update: ['analista', 'coordenador', 'diretor', 'admin'],
    delete: ['coordenador', 'diretor', 'admin'],
  },
  relatorios: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor', 'admin'],
    export: ['analista', 'coordenador', 'diretor', 'admin'],
    advanced: ['coordenador', 'diretor', 'admin'],
  },
  admin: {
    system: ['admin'],
    users: ['diretor', 'admin'],
    audit: ['coordenador', 'diretor', 'admin'],
  },
};

// Mapeamento de permissões corporativo/empresarial
export const corporatePermissionMapping: PermissionMapping = {
  demandas: {
    read: ['user', 'analyst', 'manager', 'director', 'admin'],
    create: ['user', 'analyst', 'manager', 'director', 'admin'],
    update: ['analyst', 'manager', 'director', 'admin'],
    delete: ['manager', 'director', 'admin'],
    approve: ['manager', 'director', 'admin'],
  },
  documentos: {
    read: ['user', 'analyst', 'manager', 'director', 'admin'],
    create: ['user', 'analyst', 'manager', 'director', 'admin'],
    update: ['analyst', 'manager', 'director', 'admin'],
    delete: ['manager', 'director', 'admin'],
    sign: ['manager', 'director', 'admin'],
  },
  cadastros: {
    read: ['user', 'analyst', 'manager', 'director', 'admin'],
    create: ['analyst', 'manager', 'director', 'admin'],
    update: ['analyst', 'manager', 'director', 'admin'],
    delete: ['manager', 'director', 'admin'],
  },
  relatorios: {
    read: ['user', 'analyst', 'manager', 'director', 'admin'],
    export: ['analyst', 'manager', 'director', 'admin'],
    advanced: ['manager', 'director', 'admin'],
  },
  admin: {
    system: ['admin'],
    users: ['director', 'admin'],
    audit: ['manager', 'director', 'admin'],
  },
};

// Mapeamento de permissões baseado em LDAP (usando grupos LDAP)
export const ldapPermissionMapping: PermissionMapping = {
  demandas: {
    read: [
      'CN=Domain Users,CN=Users,DC=company,DC=local',
      'synapse-users',
      'synapse-managers',
      'synapse-admins',
    ],
    create: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    update: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    delete: ['synapse-managers', 'synapse-admins'],
    approve: ['synapse-managers', 'synapse-admins'],
  },
  documentos: {
    read: [
      'CN=Domain Users,CN=Users,DC=company,DC=local',
      'synapse-users',
      'synapse-managers',
      'synapse-admins',
    ],
    create: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    update: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    delete: ['synapse-managers', 'synapse-admins'],
    sign: ['synapse-managers', 'synapse-admins'],
  },
  cadastros: {
    read: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    create: ['synapse-managers', 'synapse-admins'],
    update: ['synapse-managers', 'synapse-admins'],
    delete: ['synapse-admins'],
  },
  relatorios: {
    read: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    export: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    advanced: ['synapse-managers', 'synapse-admins'],
  },
  admin: {
    system: ['synapse-admins'],
    users: ['synapse-admins'],
    audit: ['synapse-managers', 'synapse-admins'],
  },
};

/**
 * ===================================================================
 * FACTORY PRINCIPAL - DETECÇÃO AUTOMÁTICA DE CONFIGURAÇÃO
 * ===================================================================
 */

/**
 * Factory principal que cria configuração de autenticação baseada nas variáveis de ambiente
 * Detecta automaticamente o provedor via VITE_AUTH_PROVIDER e cria a configuração apropriada
 *
 * @returns Configuração de autenticação ou null para usar autenticação padrão
 *
 * @example
 * ```typescript
 * // Em .env:
 * // VITE_AUTH_PROVIDER=laravel
 * // VITE_PHP_BASE_URL=https://api.empresa.com
 *
 * const config = createAuthConfig();
 * if (config) {
 *   // Usar autenticação externa
 *   initializeAuth(config);
 * } else {
 *   // Usar autenticação interna/padrão
 *   initializeInternalAuth();
 * }
 * ```
 */
export function createAuthConfig(): AuthProviderConfig | null {
  const provider = import.meta.env[AUTH_ENV_KEYS.AUTH_PROVIDER] as string;

  if (!provider || provider === 'none' || provider === 'disabled') {
    return null; // Usar autenticação padrão/interna
  }

  switch (provider.toLowerCase()) {
    case 'laravel':
    case 'php':
    case 'custom_php':
      return createLaravelConfig();

    case 'ldap':
    case 'active_directory':
      return createLDAPConfig();

    case 'oauth2':
    case 'oidc':
      return createOAuth2Config();

    case 'saml':
      return createSAMLConfig();

    default:
      logger.warn(`Provedor de autenticação desconhecido: ${provider}`);
      return null;
  }
}

/**
 * Fábrica de Mapeamento de Permissões
 * Retorna mapeamento de permissões apropriado baseado no tipo de organização
 */
export function createPermissionMapping(type?: string): PermissionMapping {
  const orgType = type || import.meta.env.VITE_ORG_TYPE || 'government';

  switch (orgType.toLowerCase()) {
    case 'government':
    case 'public':
    case 'legal':
      return governmentPermissionMapping;

    case 'corporate':
    case 'enterprise':
    case 'private':
      return corporatePermissionMapping;

    case 'ldap':
    case 'active_directory':
      return ldapPermissionMapping;

    default:
      return governmentPermissionMapping; // Fallback padrão
  }
}

/**
 * Validação de Configuração
 * Valida configuração de autenticação para problemas comuns
 */
export function validateAuthConfig(config: AuthProviderConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações específicas do provedor
  switch (config.provider) {
    case 'custom_php': {
      const phpConfig = config.config as CustomPHPConfig;

      if (!phpConfig.baseUrl) {
        errors.push('URL base PHP é obrigatória');
      } else if (!phpConfig.baseUrl.startsWith('http')) {
        errors.push('URL base PHP deve começar com http:// ou https://');
      }

      if (phpConfig.baseUrl?.startsWith('http://') && import.meta.env.PROD) {
        warnings.push('Usar HTTP em produção não é recomendado');
      }

      if (phpConfig.timeout && phpConfig.timeout < 5000) {
        warnings.push('Timeout abaixo de 5 segundos pode causar problemas de conexão');
      }

      break;
    }

    case 'ldap': {
      const ldapConfig = config.config as LDAPConfig;

      if (!ldapConfig.url) {
        errors.push('URL LDAP é obrigatória');
      }
      if (!ldapConfig.bindDN) {
        errors.push('DN de bind LDAP é obrigatório');
      }
      if (!ldapConfig.bindPassword) {
        errors.push('Senha de bind LDAP é obrigatória');
      }
      if (!ldapConfig.baseDN) {
        errors.push('DN base LDAP é obrigatório');
      }

      if (ldapConfig.url?.startsWith('ldap://') && import.meta.env.PROD) {
        warnings.push('Usar LDAP não criptografado em produção não é recomendado');
      }

      break;
    }

    case 'oauth2': {
      const oauth2Config = config.config as OAuth2Config;

      if (!oauth2Config.clientId) {
        errors.push('ID do cliente OAuth2 é obrigatório');
      }
      if (!oauth2Config.clientSecret) {
        errors.push('Secret do cliente OAuth2 é obrigatório');
      }
      if (!oauth2Config.authorizationUrl) {
        errors.push('URL de autorização OAuth2 é obrigatória');
      }
      if (!oauth2Config.tokenUrl) {
        errors.push('URL de token OAuth2 é obrigatória');
      }
      if (!oauth2Config.userInfoUrl) {
        errors.push('URL de informações do usuário OAuth2 é obrigatória');
      }

      break;
    }

    case 'saml': {
      const samlConfig = config.config as SAMLConfig;

      if (!samlConfig.entryPoint) {
        errors.push('Ponto de entrada SAML é obrigatório');
      }
      if (!samlConfig.cert) {
        errors.push('Certificado SAML é obrigatório');
      }

      break;
    }
  }

  // Validações gerais
  if (config.sessionTimeout && config.sessionTimeout < 300) {
    warnings.push('Timeout de sessão abaixo de 5 minutos pode causar re-autenticação frequente');
  }

  if (config.sessionTimeout && config.sessionTimeout > 24 * 60 * 60) {
    warnings.push('Timeout de sessão acima de 24 horas pode ser um risco de segurança');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Configurações de Desenvolvimento/Teste
 */

// Configuração mock para teste
export function createMockConfig(): AuthProviderConfig {
  return {
    provider: 'custom_php',
    config: {
      baseUrl: 'http://localhost:3001', // Servidor mock
      endpoints: {
        login: '/mock/auth/login',
        refresh: '/mock/auth/refresh',
        logout: '/mock/auth/logout',
        profile: '/mock/auth/profile',
        verify: '/mock/auth/verify',
      },
      timeout: 5000,
    } satisfies CustomPHPConfig,
    sessionTimeout: 60 * 60, // 1 hora para teste
    enableSSO: false,
    requireMFA: false,
  };
}

// Configuração de desenvolvimento com segurança relaxada
export function createDevConfig(): AuthProviderConfig {
  return {
    provider: 'custom_php',
    config: {
      baseUrl: 'http://localhost:8000',
      endpoints: {
        login: '/api/dev/login',
        refresh: '/api/dev/refresh',
        logout: '/api/dev/logout',
        profile: '/api/dev/profile',
        verify: '/api/dev/verify',
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Development': 'true',
      },
      timeout: 10000,
    } satisfies CustomPHPConfig,
    sessionTimeout: 2 * 60 * 60, // 2 horas para desenvolvimento
    enableSSO: false,
    requireMFA: false,
  };
}

/**
 * ===================================================================
 * EXPORT PADRÃO - INTERFACE PRINCIPAL DO MÓDULO
 * ===================================================================
 */

/**
 * Export padrão consolidado com todas as funcionalidades do configurador
 * Permite importação conveniente de todas as funções e constantes
 *
 * @example
 * ```typescript
 * import authConfig from '@/services/auth/config';
 *
 * // Factory principal
 * const config = authConfig.createAuthConfig();
 *
 * // Factories específicos
 * const laravelConfig = authConfig.createLaravelConfig('https://api.com');
 * const ldapConfig = authConfig.createLDAPConfig();
 *
 * // Validação
 * const validation = authConfig.validateAuthConfig(config);
 *
 * // Mapeamentos de permissões
 * const permissions = authConfig.governmentPermissionMapping;
 * ```
 */
export default {
  /** Factory principal - detecção automática de configuração */
  createAuthConfig,
  /** Factory de mapeamento de permissões por tipo de organização */
  createPermissionMapping,
  /** Validador de configurações com warnings e errors */
  validateAuthConfig,
  /** Factory específico para Laravel/PHP */
  createLaravelConfig,
  /** Factory específico para LDAP/Active Directory */
  createLDAPConfig,
  /** Factory específico para OAuth2/OIDC */
  createOAuth2Config,
  /** Factory específico para SAML */
  createSAMLConfig,
  /** Factory para configurações de teste */
  createMockConfig,
  /** Factory para configurações de desenvolvimento */
  createDevConfig,
  /** Constantes de variáveis de ambiente */
  AUTH_ENV_KEYS,
  /** Mapeamento de permissões para órgãos públicos/jurídicos */
  governmentPermissionMapping,
  /** Mapeamento de permissões para empresas/organizações privadas */
  corporatePermissionMapping,
  /** Mapeamento de permissões baseado em grupos LDAP */
  ldapPermissionMapping,
};
