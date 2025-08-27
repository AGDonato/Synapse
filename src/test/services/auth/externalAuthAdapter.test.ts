/**
 * Testes unitários para o ExternalAuthAdapter
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import ExternalAuthAdapter, { 
  type AuthProviderConfig, 
  type ExternalUser,
  type PermissionMapping 
} from '../../../services/auth/externalAuthAdapter';
import { analytics } from '../../../services/analytics/core';
import { healthMonitor } from '../../../services/monitoring/healthCheck';

// Mocks
vi.mock('../../../services/analytics/core', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

vi.mock('../../../services/monitoring/healthCheck', () => ({
  healthMonitor: {
    recordMetric: vi.fn(),
  },
}));

// Mock fetch global
global.fetch = vi.fn();

describe('ExternalAuthAdapter', () => {
  let adapter: ExternalAuthAdapter;
  let config: AuthProviderConfig;
  let permissionMapping: PermissionMapping;

  // Dados de teste
  const mockUser: ExternalUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    department: 'IT',
    role: 'analyst',
    permissions: ['demandas:read', 'demandas:create'],
    groups: ['users', 'analysts'],
    isActive: true,
    lastLoginAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuração padrão para testes
    config = {
      provider: 'custom_php',
      config: {
        baseUrl: 'http://localhost:8000',
        endpoints: {
          login: '/api/auth/login',
          refresh: '/api/auth/refresh',
          logout: '/api/auth/logout',
          profile: '/api/auth/profile',
          verify: '/api/auth/verify',
        },
        timeout: 10000,
      },
      sessionTimeout: 3600,
      enableSSO: false,
      requireMFA: false,
    };

    permissionMapping = {
      demandas: {
        read: ['user', 'analyst', 'manager'],
        create: ['analyst', 'manager'],
        update: ['analyst', 'manager'],
        delete: ['manager'],
        approve: ['manager'],
      },
      documentos: {
        read: ['user', 'analyst', 'manager'],
        create: ['analyst', 'manager'],
        update: ['analyst', 'manager'],
        delete: ['manager'],
        sign: ['manager'],
      },
      cadastros: {
        read: ['user', 'analyst', 'manager'],
        create: ['manager'],
        update: ['manager'],
        delete: ['manager'],
      },
      relatorios: {
        read: ['user', 'analyst', 'manager'],
        export: ['analyst', 'manager'],
        advanced: ['manager'],
      },
      admin: {
        system: ['admin'],
        users: ['admin'],
        audit: ['admin', 'manager'],
      },
    };

    adapter = new ExternalAuthAdapter(config, permissionMapping);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Autenticação PHP Backend', () => {
    it('deve autenticar com sucesso via backend PHP', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          display_name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
          department: 'IT',
          role: 'analyst',
          permissions: ['demandas:read', 'demandas:create'],
          groups: ['users', 'analysts'],
          is_active: true,
          last_login_at: '2024-01-15T10:00:00Z',
        },
        token: 'jwt-token-123',
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.authenticate('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
      });
      expect(result.token).toBe('jwt-token-123');
      expect(result.refreshToken).toBe('refresh-token-123');

      // Verificar analytics
      expect(analytics.track).toHaveBeenCalledWith('external_auth_success', expect.any(Object));
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('auth_success_rate', 1);
    });

    it('deve lidar com falha de autenticação', async () => {
      const mockResponse = {
        success: false,
        error: 'Credenciais inválidas',
        error_code: 'INVALID_CREDENTIALS',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.authenticate('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciais inválidas');
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');

      // Verificar analytics de falha
      expect(analytics.track).toHaveBeenCalledWith('external_auth_failure', expect.any(Object));
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('auth_success_rate', 0);
    });

    it('deve lidar com erro de conexão', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await adapter.authenticate('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('PHP backend connection failed');
      expect(result.errorCode).toBe('PHP_CONNECTION_ERROR');

      expect(analytics.track).toHaveBeenCalledWith('external_auth_error', expect.any(Object));
    });

    it('deve converter snake_case para camelCase', async () => {
      const mockResponse = {
        success: true,
        user: {
          user_id: '456',
          username: 'testuser2',
          email: 'test2@example.com',
          display_name: 'Test User 2',
          first_name: 'Test',
          last_name: 'User2',
          user_role: 'manager',
          is_active: true,
        },
        access_token: 'token-456',
        refresh_token: 'refresh-456',
        expires_in: 7200,
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.authenticate('testuser2', 'password');

      expect(result.user?.id).toBe('456');
      expect(result.user?.displayName).toBe('Test User 2');
      expect(result.user?.role).toBe('manager');
      expect(result.token).toBe('token-456');
    });
  });

  describe('Autenticação LDAP', () => {
    beforeEach(() => {
      config = {
        provider: 'ldap',
        config: {
          url: 'ldap://localhost:389',
          bindDN: 'cn=admin,dc=company,dc=com',
          bindPassword: 'adminpass',
          baseDN: 'ou=users,dc=company,dc=com',
          searchFilter: '(uid={username})',
          attributes: ['cn', 'mail', 'memberOf'],
        },
        sessionTimeout: 3600,
        enableSSO: true,
        requireMFA: false,
      };
      adapter = new ExternalAuthAdapter(config, permissionMapping);
    });

    it('deve autenticar via LDAP com sucesso', async () => {
      const mockLdapResponse = {
        success: true,
        user: {
          dn: 'uid=testuser,ou=users,dc=company,dc=com',
          cn: 'Test User',
          mail: 'test@company.com',
          memberOf: ['CN=Administrators,CN=Groups,DC=company,DC=com'],
          employeeNumber: '12345',
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLdapResponse,
      } as Response);

      const result = await adapter.authenticate('testuser', 'password');

      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.email).toBe('test@company.com');
      expect(result.user?.groups).toContain('CN=Administrators,CN=Groups,DC=company,DC=com');
    });

    it('deve mapear grupos LDAP para permissões', async () => {
      const mockLdapResponse = {
        success: true,
        user: {
          dn: 'uid=manager,ou=users,dc=company,dc=com',
          cn: 'Manager User',
          mail: 'manager@company.com',
          memberOf: ['CN=Managers,CN=Groups,DC=company,DC=com'],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLdapResponse,
      } as Response);

      const result = await adapter.authenticate('manager', 'password');

      expect(result.success).toBe(true);
      expect(result.user?.permissions).toContain('demandas:approve');
      expect(result.user?.permissions).toContain('relatorios:advanced');
    });
  });

  describe('Autenticação OAuth2', () => {
    beforeEach(() => {
      config = {
        provider: 'oauth2',
        config: {
          clientId: 'client-123',
          clientSecret: 'secret-123',
          authorizationUrl: 'https://oauth.provider.com/authorize',
          tokenUrl: 'https://oauth.provider.com/token',
          userInfoUrl: 'https://oauth.provider.com/userinfo',
          redirectUri: 'http://localhost:5173/callback',
          scopes: ['openid', 'profile', 'email'],
        },
        sessionTimeout: 3600,
        enableSSO: true,
        requireMFA: false,
      };
      adapter = new ExternalAuthAdapter(config, permissionMapping);
    });

    it('deve autenticar via OAuth2 com sucesso', async () => {
      // Mock token response
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'oauth-access-token',
            refresh_token: 'oauth-refresh-token',
            expires_in: 3600,
          }),
        } as Response)
        // Mock userinfo response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'oauth-user-123',
            preferred_username: 'oauthuser',
            email: 'oauth@example.com',
            name: 'OAuth User',
            given_name: 'OAuth',
            family_name: 'User',
            permissions: ['read', 'write'],
            groups: ['users'],
          }),
        } as Response);

      const result = await adapter.authenticate('oauthuser', 'password');

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('oauth-user-123');
      expect(result.user?.username).toBe('oauthuser');
      expect(result.user?.email).toBe('oauth@example.com');
      expect(result.token).toBe('oauth-access-token');
      expect(result.refreshToken).toBe('oauth-refresh-token');
    });
  });

  describe('Fallback de Autenticação', () => {
    beforeEach(() => {
      config = {
        provider: 'ldap',
        config: {
          url: 'ldap://primary.com:389',
          bindDN: 'cn=admin',
          bindPassword: 'pass',
          baseDN: 'dc=company',
          searchFilter: '(uid={username})',
        },
        fallbackProviders: ['custom_php'],
        sessionTimeout: 3600,
        enableSSO: false,
        requireMFA: false,
      };
      adapter = new ExternalAuthAdapter(config, permissionMapping);
    });

    it('deve tentar fallback quando provider primário falha', async () => {
      // Primeira tentativa (LDAP) falha
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('LDAP connection failed'))
        // Fallback (PHP) sucede
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id: 'fallback-user',
              username: 'testuser',
              email: 'test@fallback.com',
              display_name: 'Fallback User',
              is_active: true,
            },
            token: 'fallback-token',
            expires_in: 3600,
          }),
        } as Response);

      const result = await adapter.authenticate('testuser', 'password');

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@fallback.com');
      expect(result.token).toBe('fallback-token');

      expect(analytics.track).toHaveBeenCalledWith('fallback_auth_success', expect.any(Object));
    });

    it('deve falhar se todos os providers falharem', async () => {
      config.fallbackProviders = ['custom_php', 'oauth2'];
      adapter = new ExternalAuthAdapter(config, permissionMapping);

      // Todos falham
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('LDAP failed'))
        .mockRejectedValueOnce(new Error('PHP failed'))
        .mockRejectedValueOnce(new Error('OAuth2 failed'));

      const result = await adapter.authenticate('testuser', 'password');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALL_PROVIDERS_FAILED');
    });
  });

  describe('Gerenciamento de Permissões', () => {
    it('deve verificar permissão corretamente', () => {
      const userWithPermission: ExternalUser = {
        ...mockUser,
        role: 'analyst',
        groups: ['analysts'],
      };

      const hasPermission = adapter.hasPermission(userWithPermission, 'demandas', 'create');
      expect(hasPermission).toBe(true);

      const noPermission = adapter.hasPermission(userWithPermission, 'demandas', 'delete');
      expect(noPermission).toBe(false);
    });

    it('deve verificar permissão por grupo', () => {
      const userWithGroup: ExternalUser = {
        ...mockUser,
        permissions: [],
        groups: ['manager'],
      };

      const hasPermission = adapter.hasPermission(userWithGroup, 'demandas', 'approve');
      expect(hasPermission).toBe(true);
    });

    it('deve verificar permissão por role', () => {
      const userWithRole: ExternalUser = {
        ...mockUser,
        permissions: [],
        groups: [],
        role: 'manager',
      };

      const hasPermission = adapter.hasPermission(userWithRole, 'demandas', 'delete');
      expect(hasPermission).toBe(true);
    });

    it('deve permitir acesso se não há permissões requeridas', () => {
      const emptyMapping: PermissionMapping = {
        ...permissionMapping,
        demandas: {
          ...permissionMapping.demandas,
          read: [],
        },
      };

      const adapterNoPerms = new ExternalAuthAdapter(config, emptyMapping);
      const hasPermission = adapterNoPerms.hasPermission(mockUser, 'demandas', 'read');
      
      expect(hasPermission).toBe(true);
    });
  });

  describe('Refresh Token', () => {
    it('deve renovar token PHP com sucesso', async () => {
      const mockRefreshResponse = {
        success: true,
        token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      } as Response);

      const result = await adapter.refreshToken('old-refresh-token');

      expect(result.success).toBe(true);
      expect(result.token).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'old-refresh-token' }),
        })
      );
    });

    it('deve renovar token OAuth2 com sucesso', async () => {
      config.provider = 'oauth2';
      config.config = {
        clientId: 'client-123',
        clientSecret: 'secret-123',
        authorizationUrl: 'https://oauth.provider.com/authorize',
        tokenUrl: 'https://oauth.provider.com/token',
        userInfoUrl: 'https://oauth.provider.com/userinfo',
        redirectUri: 'http://localhost:5173/callback',
        scopes: ['openid', 'profile', 'email'],
      };
      adapter = new ExternalAuthAdapter(config, permissionMapping);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-oauth-token',
          refresh_token: 'new-oauth-refresh',
          expires_in: 3600,
        }),
      } as Response);

      const result = await adapter.refreshToken('oauth-refresh-token');

      expect(result.success).toBe(true);
      expect(result.token).toBe('new-oauth-token');
    });

    it('deve retornar erro para providers sem suporte a refresh', async () => {
      config.provider = 'saml';
      adapter = new ExternalAuthAdapter(config, permissionMapping);

      const result = await adapter.refreshToken('some-token');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('REFRESH_NOT_SUPPORTED');
    });
  });

  describe('Logout', () => {
    it('deve fazer logout e limpar cache', async () => {
      // Simular token em cache
      adapter['tokenCache'].set('testuser', {
        token: 'cached-token',
        expiresAt: Date.now() + 3600000,
        user: mockUser,
      });

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await adapter.logout('testuser');

      expect(adapter['tokenCache'].has('testuser')).toBe(false);
      expect(analytics.track).toHaveBeenCalledWith('external_auth_logout', expect.any(Object));
    });

    it('deve continuar mesmo se notificação de logout falhar', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.logout('testuser')).resolves.not.toThrow();
      expect(adapter['tokenCache'].has('testuser')).toBe(false);
    });
  });

  describe('Cache de Token', () => {
    it('deve armazenar token em cache após autenticação', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            display_name: 'Test User',
            is_active: true,
          },
          token: 'cached-token-123',
          expires_in: 3600,
        }),
      } as Response);

      await adapter.authenticate('testuser', 'password');

      const cached = adapter.getCachedUser('testuser');
      expect(cached).toMatchObject({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('deve retornar null para token expirado', () => {
      adapter['tokenCache'].set('testuser', {
        token: 'expired-token',
        expiresAt: Date.now() - 1000, // Expirado
        user: mockUser,
      });

      const cached = adapter.getCachedUser('testuser');
      expect(cached).toBeNull();
    });

    it('deve validar token corretamente', () => {
      adapter['tokenCache'].set('testuser', {
        token: 'valid-token',
        expiresAt: Date.now() + 3600000,
        user: mockUser,
      });

      expect(adapter.isTokenValid('testuser')).toBe(true);

      // Token expirado
      adapter['tokenCache'].set('testuser2', {
        token: 'expired-token',
        expiresAt: Date.now() - 1000,
        user: mockUser,
      });

      expect(adapter.isTokenValid('testuser2')).toBe(false);
      expect(adapter.isTokenValid('nonexistent')).toBe(false);
    });
  });

  describe('Acesso a Entidades', () => {
    it('deve permitir acesso admin a qualquer entidade', () => {
      const adminUser: ExternalUser = {
        ...mockUser,
        permissions: ['admin:all'],
      };

      const demanda = { id: 1, orgao_solicitante_id: 123 };
      const canAccess = adapter.canAccessEntity(adminUser, 'demanda', demanda);
      
      expect(canAccess).toBe(true);
    });

    it('deve verificar acesso baseado em departamento', () => {
      const userWithDept: ExternalUser = {
        ...mockUser,
        department: 'Finance',
        permissions: [],
      };

      const demanda = { id: 1, orgao_solicitante_id: 456 };
      const canAccess = adapter.canAccessEntity(userWithDept, 'demanda', demanda);
      
      // Simplificado para teste - retorna true se tem departamento
      expect(canAccess).toBe(true);
    });

    it('deve negar acesso sem permissões especiais', () => {
      const basicUser: ExternalUser = {
        ...mockUser,
        permissions: [],
        department: undefined,
      };

      const documento = { id: 1 };
      const canAccess = adapter.canAccessEntity(basicUser, 'documento', documento);
      
      expect(canAccess).toBe(false);
    });
  });
});