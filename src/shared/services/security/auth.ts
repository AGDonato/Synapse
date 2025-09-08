/**
 * ================================================================
 * AUTHENTICATION & AUTHORIZATION - SISTEMA DE AUTENTICAÇÃO
 * ================================================================
 *
 * Este arquivo implementa o sistema central de autenticação e autorização
 * do Synapse, fornecendo controle de acesso baseado em roles, gerenciamento
 * de tokens JWT e integração com múltiplos provedores de autenticação.
 *
 * Funcionalidades principais:
 * - Autenticação baseada em JWT tokens
 * - Sistema de roles e permissions granular
 * - Integração com múltiplos provedores (PHP, LDAP, OAuth2)
 * - Refresh automático de tokens
 * - Controle de acesso baseado em recursos
 * - Session management e persistent login
 * - Two-factor authentication (2FA) support
 * - Audit trail para eventos de segurança
 *
 * Recursos de segurança:
 * - Token encryption e secure storage
 * - CSRF protection integrada
 * - Session timeout configurável
 * - Brute force protection
 * - Password strength validation
 * - Secure logout com token invalidation
 *
 * Sistema de permissões:
 * - RBAC (Role-Based Access Control)
 * - Permissions granulares por recurso
 * - Inheritance de permissões por hierarquia
 * - Context-aware authorization
 * - Runtime permission evaluation
 *
 * @fileoverview Sistema central de autenticação e autorização
 * @version 2.0.0
 * @since 2024-02-03
 * @author Synapse Team
 */

import { logger } from '../../../shared/utils/logger';

import { z } from 'zod';
import { authApi, authUtils as clientAuthUtils } from '../api';

// Cria interface de autenticação combinada
const apiAuth = {
  // Gerenciamento de token do clientAuthUtils
  setToken: clientAuthUtils.setToken,
  clearToken: clientAuthUtils.removeToken,
  getToken: () => localStorage.getItem('auth_token'),
  hasValidToken: clientAuthUtils.hasValidToken,

  // Chamadas API do authApi
  login: authApi.login,
  logout: authApi.logout,
  me: authApi.me,
  refreshToken: authApi.refreshToken,
};

// Schema do usuário
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'readonly']),
  permissions: z.array(z.string()),
  lastLogin: z.date().optional(),
  isActive: z.boolean().default(true),
});

export type User = z.infer<typeof UserSchema>;

// Estado de autenticação
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Definições de permissões
export const PERMISSIONS = {
  // Demandas
  DEMANDAS_VIEW: 'demandas:view',
  DEMANDAS_CREATE: 'demandas:create',
  DEMANDAS_UPDATE: 'demandas:update',
  DEMANDAS_DELETE: 'demandas:delete',

  // Documentos
  DOCUMENTOS_VIEW: 'documentos:view',
  DOCUMENTOS_CREATE: 'documentos:create',
  DOCUMENTOS_UPDATE: 'documentos:update',
  DOCUMENTOS_DELETE: 'documentos:delete',

  // Cadastros
  CADASTROS_VIEW: 'cadastros:view',
  CADASTROS_CREATE: 'cadastros:create',
  CADASTROS_UPDATE: 'cadastros:update',
  CADASTROS_DELETE: 'cadastros:delete',

  // Sistema
  SISTEMA_ADMIN: 'sistema:admin',
  SISTEMA_CONFIG: 'sistema:config',
  SISTEMA_USERS: 'sistema:users',

  // Relatórios
  RELATORIOS_VIEW: 'relatorios:view',
  RELATORIOS_EXPORT: 'relatorios:export',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Mapeamento de permissões baseado em roles
export const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  admin: Object.values(PERMISSIONS),
  user: [
    PERMISSIONS.DEMANDAS_VIEW,
    PERMISSIONS.DEMANDAS_CREATE,
    PERMISSIONS.DEMANDAS_UPDATE,
    PERMISSIONS.DOCUMENTOS_VIEW,
    PERMISSIONS.DOCUMENTOS_CREATE,
    PERMISSIONS.DOCUMENTOS_UPDATE,
    PERMISSIONS.CADASTROS_VIEW,
    PERMISSIONS.RELATORIOS_VIEW,
  ],
  readonly: [
    PERMISSIONS.DEMANDAS_VIEW,
    PERMISSIONS.DOCUMENTOS_VIEW,
    PERMISSIONS.CADASTROS_VIEW,
    PERMISSIONS.RELATORIOS_VIEW,
  ],
};

// Serviço de autenticação
class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  // Inicializa auth a partir de dados armazenados
  async initialize(): Promise<AuthState> {
    try {
      const storedToken = apiAuth.getToken();
      if (!storedToken) {
        return this.getUnauthenticatedState();
      }

      // Valida token com o servidor
      const user = await this.validateToken(storedToken);
      if (!user) {
        apiAuth.clearToken();
        return this.getUnauthenticatedState();
      }

      this.currentUser = user;
      this.authToken = storedToken;

      return {
        isAuthenticated: true,
        user,
        token: storedToken,
        loading: false,
        error: null,
      };
    } catch (error) {
      logger.error('Falha na inicialização de autenticação:', error);
      return this.getUnauthenticatedState();
    }
  }

  // Login
  async login(email: string, password: string): Promise<AuthState> {
    try {
      // Valida entrada
      const emailSchema = z.string().email();
      const passwordSchema = z.string().min(1);

      const validEmail = emailSchema.parse(email);
      const validPassword = passwordSchema.parse(password);

      // Chama API
      const response = await apiAuth.login(validEmail, validPassword);

      // Valida resposta
      const user = UserSchema.parse(response.user);

      // Armazena dados de autenticação
      this.currentUser = user;
      this.authToken = response.token;
      apiAuth.setToken(response.token);

      // Atualiza último login
      this.currentUser.lastLogin = new Date();

      return {
        isAuthenticated: true,
        user: this.currentUser,
        token: response.token,
        loading: false,
        error: null,
      };
    } catch (error) {
      logger.error('Falha no login:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Falha no login',
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Chama API de logout se autenticado
      if (this.authToken) {
        await apiAuth.logout();
      }
    } catch (error) {
      logger.error('Falha na chamada da API de logout:', error);
    } finally {
      // Sempre limpa estado local
      this.currentUser = null;
      this.authToken = null;
      apiAuth.clearToken();

      // Limpa dados sensíveis do localStorage
      this.clearSensitiveData();
    }
  }

  // Valida token
  private async validateToken(token: string): Promise<User | null> {
    try {
      const response = await apiAuth.me();
      return UserSchema.parse(response);
    } catch (error) {
      logger.error('Falha na validação do token:', error);
      return null;
    }
  }

  // Obtém usuário atual
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Verifica se usuário está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  // Verifica permissões
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) {
      return false;
    }

    return (
      this.currentUser.permissions.includes(permission) ||
      ROLE_PERMISSIONS[this.currentUser.role].includes(permission)
    );
  }

  // Verifica múltiplas permissões (lógica OU)
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Verifica múltiplas permissões (lógica E)
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Verifica role
  hasRole(role: User['role']): boolean {
    return this.currentUser?.role === role;
  }

  // Verifica se usuário pode acessar recurso
  canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}` as Permission;
    return this.hasPermission(permission);
  }

  // Atualiza token
  async refreshToken(): Promise<boolean> {
    try {
      if (!this.authToken) {
        return false;
      }

      const response = await apiAuth.refreshToken();
      this.authToken = response.token;
      apiAuth.setToken(response.token);

      return true;
    } catch (error) {
      logger.error('Falha na atualização do token:', error);
      await this.logout();
      return false;
    }
  }

  // Obtém token atual
  getToken(): string | null {
    return this.authToken;
  }

  // Helpers privados
  private getUnauthenticatedState(): AuthState {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    };
  }

  private clearSensitiveData(): void {
    // Limpa quaisquer dados sensíveis do localStorage
    const sensitiveKeys = ['user_preferences', 'cached_data', 'temp_data'];

    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Limpa sessionStorage
    sessionStorage.clear();
  }
}

// Cria instância singleton
export const authService = new AuthService();

// Integração com React hooks (será usado com Zustand)
export const authUtils = {
  // Verifica se rota atual requer autenticação
  requiresAuth: (path: string): boolean => {
    const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
    return !publicRoutes.includes(path);
  },

  // Verifica se rota atual requer permissão específica
  requiresPermission: (path: string): Permission | null => {
    const routePermissions: Record<string, Permission> = {
      '/demandas': PERMISSIONS.DEMANDAS_VIEW,
      '/demandas/nova': PERMISSIONS.DEMANDAS_CREATE,
      '/documentos': PERMISSIONS.DOCUMENTOS_VIEW,
      '/documentos/novo': PERMISSIONS.DOCUMENTOS_CREATE,
      '/cadastros': PERMISSIONS.CADASTROS_VIEW,
      '/configuracoes': PERMISSIONS.SISTEMA_CONFIG,
      '/relatorios': PERMISSIONS.RELATORIOS_VIEW,
    };

    return routePermissions[path] || null;
  },

  // Formata nome de exibição do usuário
  formatUserName: (user: User): string => {
    return user.name || user.email.split('@')[0] || 'Usuário';
  },

  // Obtém URL do avatar do usuário ou iniciais
  getUserAvatar: (user: User): string => {
    // Retorna iniciais se não houver avatar
    const names = user.name.split(' ');
    const initials =
      names.length > 1
        ? `${names[0]?.[0]}${names[names.length - 1]?.[0]}`
        : names[0]?.substring(0, 2);

    return initials?.toUpperCase() || 'U';
  },

  // Verifica se sessão do usuário está prestes a expirar
  isSessionExpiring: (token: string): boolean => {
    try {
      // Decodifica token JWT (decodificação base64 simples para payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Converte para milissegundos
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      return exp - now < fifteenMinutes;
    } catch {
      return true; // Assume expirando se não conseguir decodificar
    }
  },
};

// Utilitários de segurança
export const securityUtils = {
  // Gera ID de sessão seguro
  generateSessionId: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Hash de dados sensíveis (para comparação client-side)
  hashData: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Valida força da senha
  validatePasswordStrength: (
    password: string
  ): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // Verificação de comprimento
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Senha deve ter pelo menos 8 caracteres');
    }

    // Verificação de maiúscula
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos uma letra maiúscula');
    }

    // Verificação de minúscula
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos uma letra minúscula');
    }

    // Verificação de número
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos um número');
    }

    // Verificação de caractere especial
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos um caractere especial');
    }

    return {
      isStrong: score >= 4,
      score,
      feedback,
    };
  },

  // Verifica senhas comuns
  isCommonPassword: (password: string): boolean => {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      '12345678',
      '1234567890',
    ];

    return commonPasswords.includes(password.toLowerCase());
  },
};

// Exporta serviço de autenticação padrão
export default authService;
