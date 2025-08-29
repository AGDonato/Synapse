import { logger } from '../../utils/logger';
/**
 * Authentication and Authorization utilities
 */

import { z } from 'zod';
import { authApi, authUtils as clientAuthUtils } from '../api';

// Create combined auth interface
const apiAuth = {
  // Token management from clientAuthUtils
  setToken: clientAuthUtils.setToken,
  clearToken: clientAuthUtils.removeToken,
  getToken: () => localStorage.getItem('auth_token'),
  hasValidToken: clientAuthUtils.hasValidToken,

  // API calls from authApi
  login: authApi.login,
  logout: authApi.logout,
  me: authApi.me,
  refreshToken: authApi.refreshToken,
};

// User schema
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

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Permission definitions
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

// Role-based permissions mapping
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

// Authentication service
class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  // Initialize auth from stored data
  async initialize(): Promise<AuthState> {
    try {
      const storedToken = apiAuth.getToken();
      if (!storedToken) {
        return this.getUnauthenticatedState();
      }

      // Validate token with server
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
      logger.error('Auth initialization failed:', error);
      return this.getUnauthenticatedState();
    }
  }

  // Login
  async login(email: string, password: string): Promise<AuthState> {
    try {
      // Validate input
      const emailSchema = z.string().email();
      const passwordSchema = z.string().min(1);

      const validEmail = emailSchema.parse(email);
      const validPassword = passwordSchema.parse(password);

      // Call API
      const response = await apiAuth.login(validEmail, validPassword);

      // Validate response
      const user = UserSchema.parse(response.user);

      // Store auth data
      this.currentUser = user;
      this.authToken = response.token;
      apiAuth.setToken(response.token);

      // Update last login
      this.currentUser.lastLogin = new Date();

      return {
        isAuthenticated: true,
        user: this.currentUser,
        token: response.token,
        loading: false,
        error: null,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Call API logout if authenticated
      if (this.authToken) {
        await apiAuth.logout();
      }
    } catch (error) {
      logger.error('Logout API call failed:', error);
    } finally {
      // Always clear local state
      this.currentUser = null;
      this.authToken = null;
      apiAuth.clearToken();

      // Clear sensitive data from localStorage
      this.clearSensitiveData();
    }
  }

  // Validate token
  private async validateToken(token: string): Promise<User | null> {
    try {
      const response = await apiAuth.me();
      return UserSchema.parse(response);
    } catch (error) {
      logger.error('Token validation failed:', error);
      return null;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  // Check permissions
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) {
      return false;
    }

    return (
      this.currentUser.permissions.includes(permission) ||
      ROLE_PERMISSIONS[this.currentUser.role].includes(permission)
    );
  }

  // Check multiple permissions (OR logic)
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check multiple permissions (AND logic)
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check role
  hasRole(role: User['role']): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user can access resource
  canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}` as Permission;
    return this.hasPermission(permission);
  }

  // Refresh token
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
      logger.error('Token refresh failed:', error);
      await this.logout();
      return false;
    }
  }

  // Get current token
  getToken(): string | null {
    return this.authToken;
  }

  // Private helpers
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
    // Clear any sensitive data from localStorage
    const sensitiveKeys = ['user_preferences', 'cached_data', 'temp_data'];

    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage
    sessionStorage.clear();
  }
}

// Create singleton instance
export const authService = new AuthService();

// React hooks integration (will be used with Zustand)
export const authUtils = {
  // Check if current route requires authentication
  requiresAuth: (path: string): boolean => {
    const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
    return !publicRoutes.includes(path);
  },

  // Check if current route requires specific permission
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

  // Format user display name
  formatUserName: (user: User): string => {
    return user.name || user.email.split('@')[0] || 'Usuário';
  },

  // Get user avatar URL or initials
  getUserAvatar: (user: User): string => {
    // Return initials if no avatar
    const names = user.name.split(' ');
    const initials =
      names.length > 1
        ? `${names[0]?.[0]}${names[names.length - 1]?.[0]}`
        : names[0]?.substring(0, 2);

    return initials?.toUpperCase() || 'U';
  },

  // Check if user session is about to expire
  isSessionExpiring: (token: string): boolean => {
    try {
      // Decode JWT token (simple base64 decode for payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      return exp - now < fifteenMinutes;
    } catch {
      return true; // Assume expiring if can't decode
    }
  },
};

// Security utilities
export const securityUtils = {
  // Generate secure session ID
  generateSessionId: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Hash sensitive data (for client-side comparison)
  hashData: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Validate password strength
  validatePasswordStrength: (
    password: string
  ): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Senha deve ter pelo menos 8 caracteres');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos uma letra maiúscula');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos uma letra minúscula');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Inclua pelo menos um número');
    }

    // Special character check
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

  // Check for common passwords
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

// Export default auth service
export default authService;
