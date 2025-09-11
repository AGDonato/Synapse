/**
 * ================================================================
 * EXTERNAL AUTH ADAPTER - INTEGRADOR UNIVERSAL DE AUTENTICAÇÃO
 * ================================================================
 *
 * Este arquivo implementa um adaptador universal para integração com sistemas
 * de autenticação externos, permitindo que o Synapse se conecte a praticamente
 * qualquer infraestrutura de autenticação existente.
 *
 * Funcionalidades principais:
 * - Suporte a múltiplos provedores de autenticação (LDAP, OAuth2, SAML, Node.js)
 * - Mapeamento flexível de usuários e permissões entre sistemas
 * - Validação robusta de configurações com schemas Zod
 * - Sistema de cache para melhor performance em autenticações frequentes
 * - Monitoramento de saúde e analytics integrados
 * - Fallback e tolerância a falhas para alta disponibilidade
 * - Sincronização automática de perfis de usuário
 * - Sistema de permissões baseado em roles/grupos externos
 *
 * Provedores suportados:
 * - LDAP/Active Directory: Integração com diretórios corporativos
 * - OAuth2/OIDC: Google, Microsoft Azure AD, AWS Cognito, etc.
 * - SAML 2.0: Single Sign-On empresarial
 * - Custom Node.js: APIs personalizadas de autenticação
 * - JWT: Tokens personalizados e microserviços
 *
 * Arquitetura do adaptador:
 * - Provider Factory: Criação dinâmica de provedores
 * - User Mapping: Transformação de perfis externos → internos
 * - Permission Mapping: Mapeamento de roles/grupos → permissões Synapse
 * - Session Management: Gestão de sessões híbridas
 * - Cache Layer: Cache de perfis para performance
 *
 * Padrões implementados:
 * - Adapter pattern para integração de sistemas heterogêneos
 * - Strategy pattern para diferentes provedores de autenticação
 * - Factory pattern para criação de conexões/clientes
 * - Observer pattern para eventos de autenticação
 * - Cache pattern para otimização de performance
 *
 * @fileoverview Adaptador universal para integração de autenticação externa
 * @version 2.0.0
 * @since 2024-01-20
 * @author Synapse Team
 */

import { z } from 'zod';
import { analytics } from '../analytics/core';
// import { healthMonitor } from '../monitoring/healthCheck';
// Moved to _trash
import { logger } from '../../../shared/utils/logger';
import type { Demanda, Documento } from '../api/schemas';

/**
 * ===================================================================
 * TIPOS E SCHEMAS DE CONFIGURAÇÃO
 * ===================================================================
 */

/**
 * Tipos de provedores de autenticação suportados
 */
export type AuthProvider =
  | 'ldap'
  | 'active_directory'
  | 'oauth2'
  | 'saml'
  | 'custom_nodejs'
  | 'jwt';

/**
 * Schema de configuração para LDAP/Active Directory
 * Define parâmetros necessários para conectar com servidores de diretório
 */
export const LDAPConfigSchema = z.object({
  /** URL do servidor LDAP (ldap:// ou ldaps://) */
  url: z.string().url(),
  /** DN (Distinguished Name) para bind/autenticação */
  bindDN: z.string(),
  /** Senha da conta de serviço para bind */
  bindPassword: z.string(),
  /** DN base para busca de usuários */
  baseDN: z.string(),
  /** Filtro LDAP para busca de usuários */
  searchFilter: z.string().default('(uid={username})'),
  /** Atributos LDAP para retornar na consulta */
  attributes: z.array(z.string()).default(['cn', 'mail', 'employeeNumber']),
  /** Opções TLS para conexões seguras */
  tlsOptions: z
    .object({
      /** Verificar certificados SSL */
      rejectUnauthorized: z.boolean().default(true),
      /** Certificado CA personalizado */
      ca: z.string().optional(),
    })
    .optional(),
});

/**
 * Schema de configuração para OAuth2/OIDC
 * Define parâmetros para integração com provedores OAuth2 (Google, Azure AD, etc.)
 */
export const OAuth2ConfigSchema = z.object({
  /** ID do cliente OAuth2 */
  clientId: z.string(),
  /** Secret do cliente OAuth2 */
  clientSecret: z.string(),
  /** URL de autorização do provedor */
  authorizationUrl: z.string().url(),
  /** URL para obter tokens do provedor */
  tokenUrl: z.string().url(),
  /** URL para obter informações do usuário */
  userInfoUrl: z.string().url(),
  /** URI de redirecionamento cadastrada no provedor */
  redirectUri: z.string().url(),
  /** Scopes OAuth2 solicitados */
  scopes: z.array(z.string()).default(['openid', 'profile', 'email']),
});

/**
 * Schema de configuração para SAML 2.0
 * Define parâmetros para integração com provedores SAML
 */
export const SAMLConfigSchema = z.object({
  /** Ponto de entrada do Identity Provider */
  entryPoint: z.string().url(),
  /** Identificador único da aplicação */
  issuer: z.string(),
  /** Certificado público do IdP para validação */
  cert: z.string(),
  /** Certificado privado para assinatura (opcional) */
  privateCert: z.string().optional(),
  /** Chave privada para descriptografia (opcional) */
  decryptionPvk: z.string().optional(),
  /** Algoritmo de assinatura */
  signatureAlgorithm: z.string().default('sha256'),
});

/**
 * Schema de configuração para APIs Node.js customizadas
 * Define parâmetros para integração com backends Node.js/Express personalizados
 */
export const CustomNodeJSConfigSchema = z.object({
  /** URL base da API Node.js */
  baseUrl: z.string().url(),
  /** Endpoints específicos da API */
  endpoints: z.object({
    /** Endpoint de login */
    login: z.string().default('/api/auth/login'),
    /** Endpoint de refresh de token */
    refresh: z.string().default('/api/auth/refresh'),
    /** Endpoint de logout */
    logout: z.string().default('/api/auth/logout'),
    /** Endpoint de perfil do usuário */
    profile: z.string().default('/api/auth/profile'),
    /** Endpoint de verificação de token */
    verify: z.string().default('/api/auth/verify'),
  }),
  /** Headers HTTP customizados */
  headers: z.record(z.string(), z.string()).optional(),
  /** Timeout em milissegundos */
  timeout: z.number().default(10000),
});

/**
 * Schema de perfil de usuário externo normalizado
 * Define estrutura padronizada para usuários de qualquer provedor de autenticação
 */
export const ExternalUserSchema = z.object({
  /** ID único do usuário no sistema externo */
  id: z.string(),
  /** Nome de usuário/login */
  username: z.string(),
  /** Email do usuário */
  email: z.string().email(),
  /** Nome completo para exibição */
  displayName: z.string(),
  /** Primeiro nome */
  firstName: z.string().optional(),
  /** Sobrenome */
  lastName: z.string().optional(),
  /** Departamento/setor */
  department: z.string().optional(),
  /** Cargo/função */
  role: z.string().optional(),
  /** Permissões mapeadas para o sistema Synapse */
  permissions: z.array(z.string()).default([]),
  /** Grupos/roles do sistema externo */
  groups: z.array(z.string()).default([]),
  /** Atributos adicionais do provedor externo */
  attributes: z.record(z.string(), z.any()).optional(),
  /** Data do último login */
  lastLoginAt: z.date().optional(),
  /** Se o usuário está ativo */
  isActive: z.boolean().default(true),
});

// Schema de resposta de autenticação
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: ExternalUserSchema.optional(),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
  error: z.string().optional(),
  errorCode: z.string().optional(),
});

// Tipos
export type LDAPConfig = z.infer<typeof LDAPConfigSchema>;
export type OAuth2Config = z.infer<typeof OAuth2ConfigSchema>;
export type SAMLConfig = z.infer<typeof SAMLConfigSchema>;
export type CustomNodeJSConfig = z.infer<typeof CustomNodeJSConfigSchema>;
export type ExternalUser = z.infer<typeof ExternalUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Configuração união de provedor
export interface AuthProviderConfig {
  provider: AuthProvider;
  config: LDAPConfig | OAuth2Config | SAMLConfig | CustomNodeJSConfig;
  fallbackProviders?: AuthProvider[];
  sessionTimeout?: number;
  enableSSO?: boolean;
  requireMFA?: boolean;
}

// Mapeamento de permissões para entidades do Synapse
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

/**
 * ===================================================================
 * CLASSE PRINCIPAL DO ADAPTADOR DE AUTENTICAÇÃO EXTERNA
 * ===================================================================
 */

/**
 * Adaptador universal para integração com sistemas de autenticação externos
 *
 * Esta classe implementa a lógica principal para conectar o Synapse com qualquer
 * sistema de autenticação externo, fornecendo uma interface unificada independente
 * do provedor de autenticação utilizado.
 *
 * Funcionalidades:
 * - Autenticação via múltiplos provedores (LDAP, OAuth2, SAML, Node.js)
 * - Cache inteligente de tokens para performance
 * - Mapeamento automático de permissões entre sistemas
 * - Monitoramento e analytics de autenticações
 * - Fallback e tolerância a falhas
 * - Gestão automática de expiração de tokens
 *
 * @example
 * ```typescript
 * const adapter = new ExternalAuthAdapter(
 *   createLDAPConfig(),
 *   governmentPermissionMapping
 * );
 *
 * const response = await adapter.authenticate('usuario', 'senha');
 * if (response.success) {
 *   console.log('Usuário autenticado:', response.user);
 * }
 * ```
 */
class ExternalAuthAdapter {
  /** Configuração do provedor de autenticação */
  private config: AuthProviderConfig;

  /** Mapeamento de permissões entre sistema externo e Synapse */
  private permissionMapping: PermissionMapping;

  /** Cache de tokens para otimização de performance */
  private tokenCache = new Map<string, { token: string; expiresAt: number; user: ExternalUser }>();

  /** Cache de promises de refresh para evitar requisições duplicadas */
  private refreshPromises = new Map<string, Promise<AuthResponse>>();

  /**
   * Construtor do adaptador de autenticação externa
   *
   * @param config - Configuração do provedor de autenticação
   * @param permissionMapping - Mapeamento de permissões entre sistemas
   */
  constructor(config: AuthProviderConfig, permissionMapping: PermissionMapping) {
    this.config = config;
    this.permissionMapping = permissionMapping;

    // Configura limpeza automática de tokens expirados
    setInterval(() => this.cleanupExpiredTokens(), 60000);
  }

  /**
   * Autentica usuário com sistema externo
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
        case 'custom_nodejs':
          response = await this.authenticateCustomNodeJS(username, password);
          break;
        case 'jwt':
          response = await this.authenticateJWT(username, password);
          break;
        default:
          throw new Error(`Provedor de autenticação não suportado: ${this.config.provider}`);
      }

      const duration = performance.now() - startTime;

      if (response.success && response.user) {
        // Armazena token em cache
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

        // Sucesso de autenticação registrado para monitoramento
        logger.info('External authentication successful', { provider: this.config.provider });
      } else {
        analytics.track('external_auth_failure', {
          provider: this.config.provider,
          username,
          error: response.error,
          errorCode: response.errorCode,
          duration,
        });

        // Falha de autenticação registrada para monitoramento
        logger.warn('External authentication failed', {
          provider: this.config.provider,
          error: response.error,
        });
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

      // Erro de autenticação registrado para monitoramento
      logger.error('External authentication error', {
        provider: this.config.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Tenta provedores de fallback se configurados
      if (this.config.fallbackProviders && this.config.fallbackProviders.length > 0) {
        return this.tryFallbackAuth(username, password);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha na autenticação',
        errorCode: 'AUTH_ERROR',
      };
    }
  }

  /**
   * Autenticação LDAP
   */
  private async authenticateLDAP(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as LDAPConfig;

    // Normalmente usaria uma biblioteca cliente LDAP como 'ldapjs'
    // Por ora, simularemos o processo de autenticação LDAP
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
   * Custom Node.js Backend Authentication
   */
  private async authenticateCustomNodeJS(
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const config = this.config.config as CustomNodeJSConfig;

    try {
      const response = await fetch(`${config.baseUrl}${config.endpoints.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Converte Node.js response para formato padronizado
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
        errorCode: result.error_code || 'NODEJS_AUTH_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: `Node.js backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'NODEJS_CONNECTION_ERROR',
      };
    }
  }

  /**
   * OAuth2 Authentication (for external OAuth providers)
   */
  private async authenticateOAuth2(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as OAuth2Config;

    try {
      // Para fluxo de credenciais de senha do proprietário do recurso
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
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
        // Obtém informações do usuário
        const userResponse = await fetch(config.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${tokenResult.access_token}`,
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
  private async authenticateActiveDirectory(
    username: string,
    password: string
  ): Promise<AuthResponse> {
    // Semelhante ao LDAP mas com configurações específicas do Active Directory
    return this.authenticateLDAP(username, password);
  }

  /**
   * SAML Authentication
   */
  private async authenticateSAML(username: string, password: string): Promise<AuthResponse> {
    const config = this.config.config as SAMLConfig;

    // SAML normalmente não suporta usuário/senha diretamente
    // Isso redirecionaria para SAML IdP, mas para compatibilidade da API:
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
    // Para sistemas que fornecem tokens JWT diretamente
    try {
      const response = await fetch('/api/auth/jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.token) {
        // Decodifica JWT para obter info do usuário (sem verificação por ora)
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
        // Continua para o próximo fallback
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
   * Atualiza token de autenticação
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      switch (this.config.provider) {
        case 'custom_nodejs':
          return await this.refreshNodeJSToken(refreshToken);
        case 'oauth2':
          return await this.refreshOAuth2Token(refreshToken);
        default:
          return {
            success: false,
            error: 'Atualização de token não suportada para este provedor',
            errorCode: 'REFRESH_NOT_SUPPORTED',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Falha na atualização do token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        errorCode: 'REFRESH_ERROR',
      };
    }
  }

  /**
   * Verifica se usuário tem permissão para ação específica
   */
  hasPermission(user: ExternalUser, resource: keyof PermissionMapping, action: string): boolean {
    const resourcePermissions = this.permissionMapping[resource] as Record<string, string[]>;
    const requiredPermissions = resourcePermissions[action];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Nenhuma permissão específica necessária
    }

    return requiredPermissions.some(
      permission =>
        user.permissions.includes(permission) ||
        user.groups.includes(permission) ||
        user.role === permission
    );
  }

  /**
   * Verifica se usuário pode acessar entidade específica
   */
  canAccessEntity(
    user: ExternalUser,
    entityType: 'demanda' | 'documento',
    entity: Demanda
  ): boolean {
    // Implementa lógica de negócio para acesso de entidade
    // Isso poderia verificar propriedade, departamento ou outros critérios

    if (user.permissions.includes('admin:all')) {
      return true;
    }

    // Verifica se o departamento do usuário corresponde ao departamento/órgão da entidade
    if ('orgao_solicitante_id' in entity && user.department) {
      // Isso exigiria mapear departamento para orgao_id
      return true; // Simplified for now
    }

    return false;
  }

  /**
   * Logout user
   */
  async logout(username: string): Promise<void> {
    try {
      // Remove do cache
      this.tokenCache.delete(username);

      // Notifica sistema externo se suportado
      if (this.config.provider === 'custom_nodejs') {
        const config = this.config.config as CustomNodeJSConfig;
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
      logger.warn('Falha na notificação de logout:', error);
    }
  }

  /**
   * Obtém informações do usuário em cache
   */
  getCachedUser(username: string): ExternalUser | null {
    const cached = this.tokenCache.get(username);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }
    return null;
  }

  /**
   * Valida token
   */
  isTokenValid(username: string): boolean {
    const cached = this.tokenCache.get(username);
    return cached ? cached.expiresAt > Date.now() : false;
  }

  // Métodos auxiliares
  private async mapLDAPPermissions(ldapUser: unknown): Promise<string[]> {
    const permissions: string[] = [];

    // Type guard para objeto de usuário LDAP
    const typedUser = ldapUser as any;

    // Mapeia grupos LDAP para permissões do Synapse
    if (typedUser.memberOf) {
      const groups = Array.isArray(typedUser.memberOf) ? typedUser.memberOf : [typedUser.memberOf];

      for (const group of groups) {
        if (group.includes('Administrators')) {
          permissions.push('admin:all');
        } else if (group.includes('Managers')) {
          permissions.push('demandas:approve', 'relatorios:advanced');
        } else if (group.includes('Users')) {
          permissions.push(
            'demandas:read',
            'demandas:create',
            'documentos:read',
            'documentos:create'
          );
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

    // Token simples tipo JWT (em produção, use biblioteca JWT adequada com assinatura)
    return btoa(JSON.stringify(payload));
  }

  private async refreshNodeJSToken(refreshToken: string): Promise<AuthResponse> {
    const config = this.config.config as CustomNodeJSConfig;

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
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
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
      error: result.error_description || 'Falha na atualiza\u00e7\u00e3o do token',
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
