import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ExternalAuthAdapter } from '../../services/auth/ExternalAuthAdapter';
import { useDemandasStore } from '../../stores/demandasStore';
import { useDocumentosStore } from '../../stores/documentosStore';
import { getCacheUtils } from '../../services/cache/adaptiveCache';
import { adaptiveApi } from '../../services/api/adaptiveApi';

vi.mock('../../services/api/adaptiveApi');
vi.mock('../../services/cache/adaptiveCache');

describe('Fluxo Completo de Autenticação Externa - Integration Tests', () => {
  let authAdapter: ExternalAuthAdapter;
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockCacheUtils: any;

  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    groups: ['users', 'admin'],
    permissions: ['read', 'write', 'admin'],
    department: 'TI',
    lastLogin: new Date().toISOString()
  };

  const mockAuthResponse = {
    success: true,
    user: mockUser,
    token: 'jwt-token-123',
    refreshToken: 'refresh-token-456',
    expiresIn: 3600
  };

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockCacheUtils = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      clear: vi.fn()
    };
    vi.mocked(getCacheUtils).mockReturnValue(mockCacheUtils);

    vi.mocked(adaptiveApi.demandas.list).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10
    });

    authAdapter = new ExternalAuthAdapter({
      phpEndpoint: 'http://localhost:8080/auth',
      ldapConfig: {
        url: 'ldap://localhost:389',
        baseDN: 'dc=example,dc=com'
      },
      oauth2Config: {
        clientId: 'test-client',
        redirectUri: 'http://localhost:3000/callback'
      },
      samlConfig: {
        entryPoint: 'http://localhost:8080/saml',
        issuer: 'synapse-app'
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo de Autenticação com Backend PHP', () => {
    it('deve realizar autenticação completa e inicializar stores', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse
      });

      const { result: demandasResult } = renderHook(() => useDemandasStore());
      const { result: documentosResult } = renderHook(() => useDocumentosStore());

      // 1. Realizar autenticação
      const authResult = await authAdapter.authenticate('testuser', 'password');

      expect(authResult.success).toBe(true);
      expect(authResult.user).toEqual(mockUser);
      expect(authResult.token).toBe('jwt-token-123');

      // 2. Verificar se token foi salvo no cache
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'auth_token',
        'jwt-token-123',
        expect.objectContaining({ ttl: 3600000 })
      );

      // 3. Verificar se dados do usuário foram salvos
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'current_user',
        mockUser,
        expect.objectContaining({ ttl: 3600000 })
      );

      // 4. Simular inicialização dos stores com usuário autenticado
      await act(async () => {
        await demandasResult.current.fetchDemandas();
        await documentosResult.current.fetchDocumentos();
      });

      // 5. Verificar se API foi chamada com token de autenticação
      expect(adaptiveApi.demandas.list).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer jwt-token-123'
          })
        })
      );
    });

    it('deve realizar fallback para LDAP quando PHP falha', async () => {
      // 1. Simular falha do PHP
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'PHP server error' })
      });

      // 2. Simular sucesso do LDAP
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAuthResponse,
          provider: 'LDAP',
          user: { ...mockUser, provider: 'LDAP' }
        })
      });

      const authResult = await authAdapter.authenticate('testuser', 'password');

      expect(authResult.success).toBe(true);
      expect(authResult.user.provider).toBe('LDAP');

      // Verificar que ambas as tentativas foram feitas
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Primeira chamada para PHP
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:8080/auth', expect.any(Object));
      
      // Segunda chamada para LDAP
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('ldap'), expect.any(Object));
    });

    it('deve manter sessão ativa com refresh token', async () => {
      // 1. Autenticação inicial
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse
      });

      await authAdapter.authenticate('testuser', 'password');

      // 2. Simular token expirado
      mockCacheUtils.get.mockImplementation((key) => {
        if (key === 'auth_token') return null; // Token expirado
        if (key === 'refresh_token') return 'refresh-token-456';
        if (key === 'current_user') return mockUser;
        return null;
      });

      // 3. Simular refresh bem-sucedido
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAuthResponse,
          token: 'new-jwt-token-789'
        })
      });

      const refreshResult = await authAdapter.refreshToken();

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.token).toBe('new-jwt-token-789');

      // Verificar se novo token foi salvo
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'auth_token',
        'new-jwt-token-789',
        expect.objectContaining({ ttl: 3600000 })
      );
    });
  });

  describe('Integração com Permissões e Autorização', () => {
    it('deve filtrar dados baseado em permissões do usuário', async () => {
      const userWithLimitedPermissions = {
        ...mockUser,
        permissions: ['read'], // Apenas leitura
        groups: ['users'] // Sem grupo admin
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAuthResponse,
          user: userWithLimitedPermissions
        })
      });

      const authResult = await authAdapter.authenticate('limiteduser', 'password');
      expect(authResult.success).toBe(true);

      // Simular resposta da API filtrada por permissões
      vi.mocked(adaptiveApi.demandas.list).mockResolvedValue({
        data: [
          { id: 1, titulo: 'Demanda Pública', status: 'aberta' },
          // Demandas confidenciais seriam filtradas no backend
        ],
        total: 1,
        page: 1,
        limit: 10
      });

      const { result } = renderHook(() => useDemandasStore());

      await act(async () => {
        await result.current.fetchDemandas();
      });

      // Verificar que API foi chamada com permissões corretas
      expect(adaptiveApi.demandas.list).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-Permissions': 'read',
            'X-User-Groups': 'users'
          })
        })
      );
    });

    it('deve negar acesso a funcionalidades restritas', async () => {
      const userWithoutAdminPermissions = {
        ...mockUser,
        permissions: ['read', 'write'],
        groups: ['users']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAuthResponse,
          user: userWithoutAdminPermissions
        })
      });

      await authAdapter.authenticate('regularuser', 'password');

      // Verificar método de verificação de permissão
      const hasAdminPermission = authAdapter.hasPermission('admin');
      expect(hasAdminPermission).toBe(false);

      const hasWritePermission = authAdapter.hasPermission('write');
      expect(hasWritePermission).toBe(true);

      const isInAdminGroup = authAdapter.isInGroup('admin');
      expect(isInAdminGroup).toBe(false);
    });
  });

  describe('Tratamento de Erros e Recuperação', () => {
    it('deve lidar com perda de conexão durante autenticação', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const authResult = await authAdapter.authenticate('testuser', 'password');

      expect(authResult.success).toBe(false);
      expect(authResult.error).toContain('Network error');
      expect(authResult.needsRetry).toBe(true);
    });

    it('deve invalidar cache quando detectar token inválido', async () => {
      // Simular token salvo no cache
      mockCacheUtils.get.mockImplementation((key) => {
        if (key === 'auth_token') return 'invalid-token';
        if (key === 'current_user') return mockUser;
        return null;
      });

      // Simular resposta de token inválido da API
      vi.mocked(adaptiveApi.demandas.list).mockRejectedValue(
        new Error('Token inválido - 401 Unauthorized')
      );

      const { result } = renderHook(() => useDemandasStore());

      await act(async () => {
        try {
          await result.current.fetchDemandas();
        } catch (error) {
          // Esperado falhar
        }
      });

      // Verificar se cache foi limpo
      expect(mockCacheUtils.invalidate).toHaveBeenCalledWith('auth_token');
      expect(mockCacheUtils.invalidate).toHaveBeenCalledWith('current_user');
    });
  });

  describe('Sincronização Multi-Usuário', () => {
    it('deve sincronizar permissões entre múltiplas sessões', async () => {
      // Simular usuário com permissões atualizadas
      const updatedUser = {
        ...mockUser,
        permissions: [...mockUser.permissions, 'delete'],
        groups: [...mockUser.groups, 'supervisor']
      };

      // 1. Autenticação inicial
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse
      });

      await authAdapter.authenticate('testuser', 'password');

      // 2. Simular webhook de atualização de permissões
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: updatedUser,
          timestamp: new Date().toISOString()
        })
      });

      await authAdapter.syncUserPermissions();

      // Verificar se cache foi atualizado
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'current_user',
        updatedUser,
        expect.any(Object)
      );

      // Verificar novas permissões
      expect(authAdapter.hasPermission('delete')).toBe(true);
      expect(authAdapter.isInGroup('supervisor')).toBe(true);
    });
  });
});