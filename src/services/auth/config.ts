/**
 * Authentication Configuration Service
 * 
 * Provides configuration templates and utilities for setting up external authentication
 * providers. This makes it easy for the PHP backend integrator to configure the 
 * authentication system according to their specific setup.
 */

import type { 
  AuthProviderConfig, 
  CustomPHPConfig, 
  LDAPConfig, 
  OAuth2Config, 
  PermissionMapping,
  SAMLConfig 
} from './externalAuthAdapter';

// Environment variable keys for configuration
export const AUTH_ENV_KEYS = {
  // General
  AUTH_PROVIDER: 'VITE_AUTH_PROVIDER',
  AUTH_SESSION_TIMEOUT: 'VITE_AUTH_SESSION_TIMEOUT',
  AUTH_ENABLE_SSO: 'VITE_AUTH_ENABLE_SSO',
  AUTH_REQUIRE_MFA: 'VITE_AUTH_REQUIRE_MFA',
  
  // PHP Backend
  PHP_BASE_URL: 'VITE_PHP_BASE_URL',
  PHP_LOGIN_ENDPOINT: 'VITE_PHP_LOGIN_ENDPOINT',
  PHP_REFRESH_ENDPOINT: 'VITE_PHP_REFRESH_ENDPOINT',
  PHP_LOGOUT_ENDPOINT: 'VITE_PHP_LOGOUT_ENDPOINT',
  PHP_PROFILE_ENDPOINT: 'VITE_PHP_PROFILE_ENDPOINT',
  PHP_VERIFY_ENDPOINT: 'VITE_PHP_VERIFY_ENDPOINT',
  PHP_TIMEOUT: 'VITE_PHP_TIMEOUT',
  
  // LDAP/Active Directory
  LDAP_URL: 'VITE_LDAP_URL',
  LDAP_BIND_DN: 'VITE_LDAP_BIND_DN',
  LDAP_BIND_PASSWORD: 'VITE_LDAP_BIND_PASSWORD',
  LDAP_BASE_DN: 'VITE_LDAP_BASE_DN',
  LDAP_SEARCH_FILTER: 'VITE_LDAP_SEARCH_FILTER',
  
  // OAuth2
  OAUTH2_CLIENT_ID: 'VITE_OAUTH2_CLIENT_ID',
  OAUTH2_CLIENT_SECRET: 'VITE_OAUTH2_CLIENT_SECRET',
  OAUTH2_AUTH_URL: 'VITE_OAUTH2_AUTH_URL',
  OAUTH2_TOKEN_URL: 'VITE_OAUTH2_TOKEN_URL',
  OAUTH2_USER_INFO_URL: 'VITE_OAUTH2_USER_INFO_URL',
  OAUTH2_REDIRECT_URI: 'VITE_OAUTH2_REDIRECT_URI',
  
  // SAML
  SAML_ENTRY_POINT: 'VITE_SAML_ENTRY_POINT',
  SAML_ISSUER: 'VITE_SAML_ISSUER',
  SAML_CERT: 'VITE_SAML_CERT',
} as const;

/**
 * Configuration Templates
 * These provide ready-to-use configurations for common scenarios
 */

// Laravel/PHP Backend Configuration
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
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: Number(import.meta.env[AUTH_ENV_KEYS.PHP_TIMEOUT]) || 15000,
    } satisfies CustomPHPConfig,
    sessionTimeout: Number(import.meta.env[AUTH_ENV_KEYS.AUTH_SESSION_TIMEOUT]) || 8 * 60 * 60, // 8 hours
    enableSSO: import.meta.env[AUTH_ENV_KEYS.AUTH_ENABLE_SSO] === 'true',
    requireMFA: import.meta.env[AUTH_ENV_KEYS.AUTH_REQUIRE_MFA] === 'true',
  };
}

// LDAP/Active Directory Configuration
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

// OAuth2 Configuration (for external providers like Google, Azure AD, etc.)
export function createOAuth2Config(): AuthProviderConfig {
  return {
    provider: 'oauth2',
    config: {
      clientId: import.meta.env[AUTH_ENV_KEYS.OAUTH2_CLIENT_ID] || '',
      clientSecret: import.meta.env[AUTH_ENV_KEYS.OAUTH2_CLIENT_SECRET] || '',
      authorizationUrl: import.meta.env[AUTH_ENV_KEYS.OAUTH2_AUTH_URL] || '',
      tokenUrl: import.meta.env[AUTH_ENV_KEYS.OAUTH2_TOKEN_URL] || '',
      userInfoUrl: import.meta.env[AUTH_ENV_KEYS.OAUTH2_USER_INFO_URL] || '',
      redirectUri: import.meta.env[AUTH_ENV_KEYS.OAUTH2_REDIRECT_URI] || `${window.location.origin}/auth/callback`,
      scopes: ['openid', 'profile', 'email'],
    } satisfies OAuth2Config,
    sessionTimeout: Number(import.meta.env[AUTH_ENV_KEYS.AUTH_SESSION_TIMEOUT]) || 4 * 60 * 60, // 4 hours for OAuth2
    enableSSO: true,
    requireMFA: import.meta.env[AUTH_ENV_KEYS.AUTH_REQUIRE_MFA] === 'true',
  };
}

// SAML Configuration
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
    requireMFA: false, // Usually handled by SAML provider
  };
}

/**
 * Permission Mappings
 * These define how external system roles/groups map to Synapse permissions
 */

// Basic permission mapping for government/legal organizations
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

// Corporate/enterprise permission mapping
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

// LDAP-based permission mapping (using LDAP groups)
export const ldapPermissionMapping: PermissionMapping = {
  demandas: {
    read: ['CN=Domain Users,CN=Users,DC=company,DC=local', 'synapse-users', 'synapse-managers', 'synapse-admins'],
    create: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    update: ['synapse-users', 'synapse-managers', 'synapse-admins'],
    delete: ['synapse-managers', 'synapse-admins'],
    approve: ['synapse-managers', 'synapse-admins'],
  },
  documentos: {
    read: ['CN=Domain Users,CN=Users,DC=company,DC=local', 'synapse-users', 'synapse-managers', 'synapse-admins'],
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
 * Configuration Factory
 * Creates authentication configuration based on environment variables
 */
export function createAuthConfig(): AuthProviderConfig | null {
  const provider = import.meta.env[AUTH_ENV_KEYS.AUTH_PROVIDER] as string;
  
  if (!provider || provider === 'none' || provider === 'disabled') {
    return null; // Use default/internal authentication
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
      console.warn(`Unknown authentication provider: ${provider}`);
      return null;
  }
}

/**
 * Permission Mapping Factory
 * Returns appropriate permission mapping based on organization type
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
      return governmentPermissionMapping; // Default fallback
  }
}

/**
 * Configuration Validation
 * Validates authentication configuration for common issues
 */
export function validateAuthConfig(config: AuthProviderConfig): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[]; 
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Provider-specific validations
  switch (config.provider) {
    case 'custom_php': {
      const phpConfig = config.config as CustomPHPConfig;
      
      if (!phpConfig.baseUrl) {
        errors.push('PHP base URL is required');
      } else if (!phpConfig.baseUrl.startsWith('http')) {
        errors.push('PHP base URL must start with http:// or https://');
      }
      
      if (phpConfig.baseUrl?.startsWith('http://') && import.meta.env.PROD) {
        warnings.push('Using HTTP in production is not recommended');
      }
      
      if (phpConfig.timeout && phpConfig.timeout < 5000) {
        warnings.push('Timeout below 5 seconds might cause connection issues');
      }
      
      break;
    }
    
    case 'ldap': {
      const ldapConfig = config.config as LDAPConfig;
      
      if (!ldapConfig.url) {
        errors.push('LDAP URL is required');
      }
      if (!ldapConfig.bindDN) {
        errors.push('LDAP bind DN is required');
      }
      if (!ldapConfig.bindPassword) {
        errors.push('LDAP bind password is required');
      }
      if (!ldapConfig.baseDN) {
        errors.push('LDAP base DN is required');
      }
      
      if (ldapConfig.url?.startsWith('ldap://') && import.meta.env.PROD) {
        warnings.push('Using unencrypted LDAP in production is not recommended');
      }
      
      break;
    }
    
    case 'oauth2': {
      const oauth2Config = config.config as OAuth2Config;
      
      if (!oauth2Config.clientId) {
        errors.push('OAuth2 client ID is required');
      }
      if (!oauth2Config.clientSecret) {
        errors.push('OAuth2 client secret is required');
      }
      if (!oauth2Config.authorizationUrl) {
        errors.push('OAuth2 authorization URL is required');
      }
      if (!oauth2Config.tokenUrl) {
        errors.push('OAuth2 token URL is required');
      }
      if (!oauth2Config.userInfoUrl) {
        errors.push('OAuth2 user info URL is required');
      }
      
      break;
    }
    
    case 'saml': {
      const samlConfig = config.config as SAMLConfig;
      
      if (!samlConfig.entryPoint) {
        errors.push('SAML entry point is required');
      }
      if (!samlConfig.cert) {
        errors.push('SAML certificate is required');
      }
      
      break;
    }
  }

  // General validations
  if (config.sessionTimeout && config.sessionTimeout < 300) {
    warnings.push('Session timeout below 5 minutes might cause frequent re-authentication');
  }
  
  if (config.sessionTimeout && config.sessionTimeout > 24 * 60 * 60) {
    warnings.push('Session timeout above 24 hours might be a security risk');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Development/Testing Configurations
 */

// Mock configuration for testing
export function createMockConfig(): AuthProviderConfig {
  return {
    provider: 'custom_php',
    config: {
      baseUrl: 'http://localhost:3001', // Mock server
      endpoints: {
        login: '/mock/auth/login',
        refresh: '/mock/auth/refresh',
        logout: '/mock/auth/logout',
        profile: '/mock/auth/profile',
        verify: '/mock/auth/verify',
      },
      timeout: 5000,
    } satisfies CustomPHPConfig,
    sessionTimeout: 60 * 60, // 1 hour for testing
    enableSSO: false,
    requireMFA: false,
  };
}

// Development configuration with relaxed security
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
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Development': 'true',
      },
      timeout: 10000,
    } satisfies CustomPHPConfig,
    sessionTimeout: 2 * 60 * 60, // 2 hours for development
    enableSSO: false,
    requireMFA: false,
  };
}

export default {
  createAuthConfig,
  createPermissionMapping,
  validateAuthConfig,
  createLaravelConfig,
  createLDAPConfig,
  createOAuth2Config,
  createSAMLConfig,
  createMockConfig,
  createDevConfig,
  AUTH_ENV_KEYS,
  governmentPermissionMapping,
  corporatePermissionMapping,
  ldapPermissionMapping,
};