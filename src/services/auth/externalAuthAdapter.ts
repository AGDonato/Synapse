/**
 * External Authentication Integration Adapter
 * 
 * Handles integration with existing authentication systems where users
 * already have login credentials. Supports multiple authentication providers
 * including LDAP, Active Directory, OAuth2, SAML, and custom PHP backends.
 */

import { z } from 'zod';
import { analytics } from '../analytics/core';
import { healthMonitor } from '../monitoring/healthCheck';
import type { Demanda, Documento } from '../api/schemas';

// Authentication Provider Types
export type AuthProvider = 'ldap' | 'active_directory' | 'oauth2' | 'saml' | 'custom_php' | 'jwt';

// Configuration schemas
export const LDAPConfigSchema = z.object({
  url: z.string().url(),
  bindDN: z.string(),
  bindPassword: z.string(),
  baseDN: z.string(),
  searchFilter: z.string().default('(uid={username})'),
  attributes: z.array(z.string()).default(['cn', 'mail', 'employeeNumber']),
  tlsOptions: z.object({
    rejectUnauthorized: z.boolean().default(true),
    ca: z.string().optional(),
  }).optional(),
});

export const OAuth2ConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  userInfoUrl: z.string().url(),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).default(['openid', 'profile', 'email']),
});

export const SAMLConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string(),
  cert: z.string(),
  privateCert: z.string().optional(),
  decryptionPvk: z.string().optional(),
  signatureAlgorithm: z.string().default('sha256'),
});

export const CustomPHPConfigSchema = z.object({
  baseUrl: z.string().url(),
  endpoints: z.object({
    login: z.string().default('/api/auth/login'),
    refresh: z.string().default('/api/auth/refresh'),
    logout: z.string().default('/api/auth/logout'),
    profile: z.string().default('/api/auth/profile'),
    verify: z.string().default('/api/auth/verify'),
  }),
  headers: z.record(z.string()).optional(),
  timeout: z.number().default(10000),
});

// User profile schema
export const ExternalUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  groups: z.array(z.string()).default([]),
  attributes: z.record(z.any()).optional(),
  lastLoginAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Authentication response schema
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: ExternalUserSchema.optional(),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
  error: z.string().optional(),
  errorCode: z.string().optional(),
});

// Types
export type LDAPConfig = z.infer<typeof LDAPConfigSchema>;
export type OAuth2Config = z.infer<typeof OAuth2ConfigSchema>;
export type SAMLConfig = z.infer<typeof SAMLConfigSchema>;
export type CustomPHPConfig = z.infer<typeof CustomPHPConfigSchema>;
export type ExternalUser = z.infer<typeof ExternalUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Provider configuration union
export interface AuthProviderConfig {
  provider: AuthProvider;
  config: LDAPConfig | OAuth2Config | SAMLConfig | CustomPHPConfig;
  fallbackProviders?: AuthProvider[];
  sessionTimeout?: number;
  enableSSO?: boolean;
  requireMFA?: boolean;
}

// Permission mapping for Synapse entities
export interface PermissionMapping {
  demandas: {
    read: string[];
    create: string[];
    update: string[];
    delete: string[];
    approve: string[];
  };
  documentos: {
    read: string[];
    create: string[];
    update: string[];
    delete: string[];
    sign: string[];
  };
  cadastros: {
    read: string[];
    create: string[];
    update: string[];
    delete: string[];
  };
  relatorios: {
    read: string[];
    export: string[];
    advanced: string[];
  };
  admin: {
    system: string[];
    users: string[];
    audit: string[];
  };
}

class ExternalAuthAdapter {
  private config: AuthProviderConfig;
  private permissionMapping: PermissionMapping;
  private tokenCache = new Map<string, { token: string; expiresAt: number; user: ExternalUser }>();
  private refreshPromises = new Map<string, Promise<AuthResponse>>();

  constructor(config: AuthProviderConfig, permissionMapping: PermissionMapping) {
    this.config = config;
    this.permissionMapping = permissionMapping;
    
    // Setup token cleanup interval
    setInterval(() => this.cleanupExpiredTokens(), 60000); // Every minute
  }

  /**
   * Authenticate user with external system
   */
  async authenticate(username: string, password: string): Promise<AuthResponse> {
    const startTime = performance.now();
    
    try {
      analytics.track('external_auth_attempt', {
        provider: this.config.provider,
        username: username,
        timestamp: Date.now(),
      });

      let response: AuthResponse;

      switch (this.config.provider) {
        case 'ldap':
          response = await this.authenticateLDAP(username, password);
          break;
        case 'active_directory':
          response = await this.authenticateActiveDirectory(username, password);
          break;
        case 'oauth2':
          response = await this.authenticateOAuth2(username, password);
          break;
        case 'saml':
          response = await this.authenticateSAML(username, password);
          break;
        case 'custom_php':
          response = await this.authenticateCustomPHP(username, password);
          break;
        case 'jwt':
          response = await this.authenticateJWT(username, password);
          break;
        default:
          throw new Error(`Unsupported authentication provider: ${this.config.provider}`);
      }

      const duration = performance.now() - startTime;

      if (response.success && response.user) {
        // Cache token
        if (response.token) {
          const expiresAt = Date.now() + (response.expiresIn || 3600) * 1000;
          this.tokenCache.set(username, {
            token: response.token,
            expiresAt,
            user: response.user,
          });
        }

        analytics.track('external_auth_success', {
          provider: this.config.provider,
          userId: response.user.id,
          duration,
          hasPermissions: response.user.permissions.length > 0,
        });

        // Update health monitoring
        healthMonitor.recordMetric('auth_success_rate', 1);
      } else {
        analytics.track('external_auth_failure', {
          provider: this.config.provider,
          username,
          error: response.error,
          errorCode: response.errorCode,
          duration,
        });

        healthMonitor.recordMetric('auth_success_rate', 0);
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      analytics.track('external_auth_error', {
        provider: this.config.provider,
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      healthMonitor.recordMetric('auth_success_rate', 0);

      // Try fallback providers if configured
      if (this.config.fallbackProviders && this.config.fallbackProviders.length > 0) {
        return this.tryFallbackAuth(username, password);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errorCode: 'AUTH_ERROR',
      };
    }
  }

  /**
   * LDAP Authentication
   */
  private async authenticateLDAP(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as LDAPConfig;
    
    // This would typically use an LDAP client library like 'ldapjs'
    // For now, we'll simulate the LDAP authentication process
    try {
      const response = await fetch('/api/auth/ldap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          config: {
            url: config.url,
            baseDN: config.baseDN,
            searchFilter: config.searchFilter.replace('{username}', username),
            attributes: config.attributes,
          },
        }),
      });

      const result = await response.json();
      
      if (result.success && result.user) {
        const user: ExternalUser = {
          id: result.user.dn || username,
          username,
          email: result.user.mail || `${username}@company.local`,
          displayName: result.user.cn || username,
          firstName: result.user.givenName,
          lastName: result.user.sn,
          department: result.user.department,
          role: result.user.title,
          permissions: await this.mapLDAPPermissions(result.user),
          groups: result.user.memberOf || [],
          attributes: result.user,
          isActive: !result.user.userAccountControl || !(result.user.userAccountControl & 0x2),
        };

        return {
          success: true,
          user,
          token: this.generateSessionToken(user),
          expiresIn: this.config.sessionTimeout || 3600,
        };
      }

      return {
        success: false,
        error: result.error || 'LDAP authentication failed',
        errorCode: 'LDAP_AUTH_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: `LDAP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'LDAP_CONNECTION_ERROR',
      };
    }
  }

  /**
   * Custom PHP Backend Authentication
   */
  private async authenticateCustomPHP(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as CustomPHPConfig;
    
    try {
      const response = await fetch(`${config.baseUrl}${config.endpoints.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Convert PHP snake_case to camelCase
        const user: ExternalUser = {
          id: result.user.id || result.user.user_id,
          username: result.user.username || result.user.login,
          email: result.user.email,
          displayName: result.user.display_name || result.user.name,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          department: result.user.department,
          role: result.user.role || result.user.user_role,
          permissions: result.user.permissions || [],
          groups: result.user.groups || [],
          attributes: result.user,
          lastLoginAt: result.user.last_login_at ? new Date(result.user.last_login_at) : undefined,
          isActive: result.user.is_active !== false,
        };

        return {
          success: true,
          user,
          token: result.token || result.access_token,
          refreshToken: result.refresh_token,
          expiresIn: result.expires_in || 3600,
        };
      }

      return {
        success: false,
        error: result.message || result.error || 'Authentication failed',
        errorCode: result.error_code || 'PHP_AUTH_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: `PHP backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'PHP_CONNECTION_ERROR',
      };
    }
  }

  /**
   * OAuth2 Authentication (for external OAuth providers)
   */
  private async authenticateOAuth2(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as OAuth2Config;
    
    try {
      // For resource owner password credentials flow
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username,
          password,
          scope: config.scopes.join(' '),
        }),
      });

      const tokenResult = await tokenResponse.json();

      if (tokenResult.access_token) {
        // Get user info
        const userResponse = await fetch(config.userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${tokenResult.access_token}`,
          },
        });

        const userResult = await userResponse.json();

        const user: ExternalUser = {
          id: userResult.sub || userResult.id,
          username: userResult.preferred_username || username,
          email: userResult.email,
          displayName: userResult.name,
          firstName: userResult.given_name,
          lastName: userResult.family_name,
          permissions: userResult.permissions || [],
          groups: userResult.groups || [],
          attributes: userResult,
          isActive: true,
        };

        return {
          success: true,
          user,
          token: tokenResult.access_token,
          refreshToken: tokenResult.refresh_token,
          expiresIn: tokenResult.expires_in,
        };
      }

      return {
        success: false,
        error: tokenResult.error_description || 'OAuth2 authentication failed',
        errorCode: 'OAUTH2_AUTH_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: `OAuth2 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'OAUTH2_CONNECTION_ERROR',
      };
    }
  }

  /**
   * Active Directory Authentication
   */
  private async authenticateActiveDirectory(username: string, password: string): Promise<AuthResponse> {
    // Similar to LDAP but with Active Directory specific configurations
    return this.authenticateLDAP(username, password);
  }

  /**
   * SAML Authentication
   */
  private async authenticateSAML(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as SAMLConfig;
    
    // SAML typically doesn't support username/password directly
    // This would redirect to SAML IdP, but for API compatibility:
    try {
      const response = await fetch('/api/auth/saml/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          entryPoint: config.entryPoint,
          issuer: config.issuer,
        }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: `SAML authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'SAML_AUTH_FAILED',
      };
    }
  }

  /**
   * JWT Token Authentication
   */
  private async authenticateJWT(username: string, password: string): Promise<AuthResponse> {
    // For systems that provide JWT tokens directly
    try {
      const response = await fetch('/api/auth/jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      
      if (result.token) {
        // Decode JWT to get user info (without verification for now)
        const payload = JSON.parse(atob(result.token.split('.')[1]));
        
        const user: ExternalUser = {
          id: payload.sub || payload.user_id,
          username: payload.username || username,
          email: payload.email,
          displayName: payload.name,
          permissions: payload.permissions || [],
          groups: payload.groups || [],
          attributes: payload,
          isActive: true,
        };

        return {
          success: true,
          user,
          token: result.token,
          expiresIn: payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 3600,
        };
      }

      return {
        success: false,
        error: result.error || 'JWT authentication failed',
        errorCode: 'JWT_AUTH_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: `JWT authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'JWT_ERROR',
      };
    }
  }

  /**
   * Try fallback authentication providers
   */
  private async tryFallbackAuth(username: string, password: string): Promise<AuthResponse> {
    if (!this.config.fallbackProviders) {
      return {
        success: false,
        error: 'Primary authentication failed and no fallback configured',
        errorCode: 'NO_FALLBACK',
      };
    }

    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        const originalProvider = this.config.provider;
        this.config.provider = fallbackProvider;
        
        const result = await this.authenticate(username, password);
        
        this.config.provider = originalProvider; // Restore original
        
        if (result.success) {
          analytics.track('fallback_auth_success', {
            originalProvider: originalProvider,
            fallbackProvider,
            username,
          });
          return result;
        }
      } catch (error) {
        // Continue to next fallback
        continue;
      }
    }

    return {
      success: false,
      error: 'All authentication providers failed',
      errorCode: 'ALL_PROVIDERS_FAILED',
    };
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      switch (this.config.provider) {
        case 'custom_php':
          return await this.refreshPHPToken(refreshToken);
        case 'oauth2':
          return await this.refreshOAuth2Token(refreshToken);
        default:
          return {
            success: false,
            error: 'Token refresh not supported for this provider',
            errorCode: 'REFRESH_NOT_SUPPORTED',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'REFRESH_ERROR',
      };
    }
  }

  /**
   * Check if user has permission for specific action
   */
  hasPermission(user: ExternalUser, resource: keyof PermissionMapping, action: string): boolean {
    const resourcePermissions = this.permissionMapping[resource] as Record<string, string[]>;
    const requiredPermissions = resourcePermissions[action];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    return requiredPermissions.some(permission => 
      user.permissions.includes(permission) || 
      user.groups.includes(permission) ||
      user.role === permission
    );
  }

  /**
   * Check if user can access specific entity
   */
  canAccessEntity(user: ExternalUser, entityType: 'demanda' | 'documento', entity: Demanda | Documento): boolean {
    // Implement business logic for entity access
    // This could check ownership, department, or other criteria
    
    if (user.permissions.includes('admin:all')) {
      return true;
    }

    // Check if user's department matches entity's department/orgao
    if ('orgao_solicitante_id' in entity && user.department) {
      // This would require mapping department to orgao_id
      return true; // Simplified for now
    }

    return false;
  }

  /**
   * Logout user
   */
  async logout(username: string): Promise<void> {
    try {
      // Remove from cache
      this.tokenCache.delete(username);

      // Notify external system if supported
      if (this.config.provider === 'custom_php') {
        const config = this.config.config as CustomPHPConfig;
        await fetch(`${config.baseUrl}${config.endpoints.logout}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify({ username }),
        });
      }

      analytics.track('external_auth_logout', {
        provider: this.config.provider,
        username,
      });
    } catch (error) {
      logger.warn('Logout notification failed:', error);
    }
  }

  /**
   * Get cached user info
   */
  getCachedUser(username: string): ExternalUser | null {
    const cached = this.tokenCache.get(username);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }
    return null;
  }

  /**
   * Validate token
   */
  isTokenValid(username: string): boolean {
    const cached = this.tokenCache.get(username);
    return cached ? cached.expiresAt > Date.now() : false;
  }

  // Helper methods
  private async mapLDAPPermissions(ldapUser: unknown): Promise<string[]> {
    const permissions: string[] = [];
    
    // Map LDAP groups to Synapse permissions
    if (ldapUser.memberOf) {
      const groups = Array.isArray(ldapUser.memberOf) ? ldapUser.memberOf : [ldapUser.memberOf];
      
      for (const group of groups) {
        if (group.includes('Administrators')) {
          permissions.push('admin:all');
        } else if (group.includes('Managers')) {
          permissions.push('demandas:approve', 'relatorios:advanced');
        } else if (group.includes('Users')) {
          permissions.push('demandas:read', 'demandas:create', 'documentos:read', 'documentos:create');
        }
      }
    }

    return permissions;
  }

  private generateSessionToken(user: ExternalUser): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.config.sessionTimeout || 3600),
    };

    // Simple JWT-like token (in production, use proper JWT library with signing)
    return btoa(JSON.stringify(payload));
  }

  private async refreshPHPToken(refreshToken: string): Promise<AuthResponse> {
    const config = this.config.config as CustomPHPConfig;
    
    const response = await fetch(`${config.baseUrl}${config.endpoints.refresh}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return await response.json();
  }

  private async refreshOAuth2Token(refreshToken: string): Promise<AuthResponse> {
    const config = this.config.config as OAuth2Config;
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const result = await response.json();
    
    if (result.access_token) {
      return {
        success: true,
        token: result.access_token,
        refreshToken: result.refresh_token,
        expiresIn: result.expires_in,
      };
    }

    return {
      success: false,
      error: result.error_description || 'Token refresh failed',
      errorCode: 'REFRESH_FAILED',
    };
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [username, cached] of this.tokenCache.entries()) {
      if (cached.expiresAt <= now) {
        this.tokenCache.delete(username);
      }
    }
  }
}

export default ExternalAuthAdapter;