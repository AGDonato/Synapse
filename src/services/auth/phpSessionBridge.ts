/**
 * PHP Session Bridge
 * Integração com sistema de autenticação PHP existente
 * Gerencia sincronização de sessões entre PHP e React
 */

import { env } from '../../config/env';
import { phpApiClient } from '../api/phpApiClient';
import type { User } from '../security/auth';

export interface PHPSession {
  session_id: string;
  user_id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  expires_at: string;
  last_activity: string;
  csrf_token: string;
  ip_address: string;
  user_agent: string;
}

export interface PHPAuthResponse {
  success: boolean;
  user?: User;
  session?: PHPSession;
  token?: string;
  message?: string;
  errors?: string[];
}

/**
 * Bridge para integração com sistema PHP
 */
class PHPSessionBridge {
  private sessionCheckInterval?: number;
  private syncInterval = 30000; // 30 segundos
  private isAuthenticated = false;
  private currentUser: User | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.setupEventListeners();
    this.initializeSession();
  }

  /**
   * Inicializar sessão verificando cookie PHP
   */
  async initializeSession(): Promise<boolean> {
    try {
      // Verificar se existe cookie de sessão PHP
      const phpSessionId = this.getPHPSessionId();
      if (!phpSessionId) {
        return false;
      }

      // Validar sessão com backend PHP
      const response = await this.validatePHPSession();
      if (response.success && response.user) {
        this.setAuthenticatedUser(response.user, response.session);
        this.startSessionSync();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Erro ao inicializar sessão PHP:', error);
      return false;
    }
  }

  /**
   * Login usando sistema PHP existente
   */
  async login(credentials: { username: string; password: string }): Promise<PHPAuthResponse> {
    try {
      const response = await phpApiClient.post<PHPAuthResponse>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
        remember: true // Para manter sessão ativa
      });

      if (response.success && response.data?.user) {
        const { user, session } = response.data;
        this.setAuthenticatedUser(user, session);
        this.startSessionSync();
        
        return {
          success: true,
          user,
          session,
          token: session?.csrf_token
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Falha na autenticação',
        errors: response.data?.errors
      };

    } catch (error: unknown) {
      logger.error('Erro no login PHP:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor',
        errors: [error.message]
      };
    }
  }

  /**
   * Logout do sistema PHP
   */
  async logout(): Promise<void> {
    try {
      // Notificar backend PHP sobre logout
      await phpApiClient.post('/auth/logout');
    } catch (error) {
      logger.error('Erro ao fazer logout no PHP:', error);
    } finally {
      this.clearAuthenticatedUser();
      this.stopSessionSync();
      
      // Limpar cookies PHP
      this.clearPHPSession();
      
      // Redirecionar para página de login se necessário
      this.handleLogoutRedirect();
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated && this.currentUser !== null;
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obter session ID atual
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Validar sessão atual com PHP
   */
  async validateCurrentSession(): Promise<boolean> {
    try {
      const response = await this.validatePHPSession();
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Refresh da sessão PHP
   */
  async refreshSession(): Promise<boolean> {
    try {
      const response = await phpApiClient.post<PHPAuthResponse>('/auth/refresh');
      
      if (response.success && response.data?.user) {
        this.setAuthenticatedUser(response.data.user, response.data.session);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Erro ao renovar sessão:', error);
      return false;
    }
  }

  /**
   * Obter token CSRF do PHP
   */
  getCSRFToken(): string | null {
    // Tentar obter do localStorage primeiro
    const stored = localStorage.getItem('php_csrf_token');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expires > Date.now()) {
          return parsed.token;
        }
      } catch {}
    }

    // Fallback: tentar obter do meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return metaToken || null;
  }

  /**
   * Implementações privadas
   */
  private async validatePHPSession(): Promise<PHPAuthResponse> {
    const response = await phpApiClient.get<PHPAuthResponse>('/auth/check-session');
    return response.data || { success: false };
  }

  private setAuthenticatedUser(user: User, session?: PHPSession): void {
    this.isAuthenticated = true;
    this.currentUser = user;
    this.sessionId = session?.session_id || null;

    // Armazenar dados localmente
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    if (session) {
      localStorage.setItem('php_session', JSON.stringify(session));
      
      // Armazenar token CSRF
      if (session.csrf_token) {
        localStorage.setItem('php_csrf_token', JSON.stringify({
          token: session.csrf_token,
          expires: Date.now() + 60 * 60 * 1000 // 1 hora
        }));
      }
    }

    // Emitir evento de login
    window.dispatchEvent(new CustomEvent('php-auth-login', { 
      detail: { user, session } 
    }));
  }

  private clearAuthenticatedUser(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.sessionId = null;

    // Limpar dados locais
    localStorage.removeItem('auth_user');
    localStorage.removeItem('php_session');
    localStorage.removeItem('php_csrf_token');

    // Emitir evento de logout
    window.dispatchEvent(new CustomEvent('php-auth-logout'));
  }

  private getPHPSessionId(): string | null {
    // Tentar obter do cookie PHP
    const sessionName = env.PHP_SESSION_NAME || 'PHPSESSID';
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === sessionName && value) {
        return value;
      }
    }

    return null;
  }

  private clearPHPSession(): void {
    const sessionName = env.PHP_SESSION_NAME || 'PHPSESSID';
    document.cookie = `${sessionName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }

  private startSessionSync(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = window.setInterval(async () => {
      const isValid = await this.validateCurrentSession();
      
      if (!isValid) {
        logger.warn('Sessão PHP expirada, fazendo logout...');
        await this.logout();
      }
    }, this.syncInterval);
  }

  private stopSessionSync(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = undefined;
    }
  }

  private setupEventListeners(): void {
    // Listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isAuthenticated) {
        // Verificar sessão quando usuário volta para a aba
        this.validateCurrentSession().then(isValid => {
          if (!isValid) {
            this.logout();
          }
        });
      }
    });

    // Listener para antes de fechar a página
    window.addEventListener('beforeunload', () => {
      this.stopSessionSync();
    });

    // Listener para storage events (sincronização entre abas)
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_user') {
        if (event.newValue) {
          // Usuário logou em outra aba
          const user = JSON.parse(event.newValue);
          this.setAuthenticatedUser(user);
        } else {
          // Usuário fez logout em outra aba
          this.clearAuthenticatedUser();
        }
      }
    });
  }

  private handleLogoutRedirect(): void {
    // Verificar se devemos redirecionar
    const currentPath = window.location.pathname;
    const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
    
    if (!publicRoutes.includes(currentPath)) {
      // Redirecionar para login mantendo a URL de destino
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `/login?return=${returnUrl}`;
    }
  }

  /**
   * Utilitários para integração
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
    }

    return headers;
  }

  /**
   * Verificar permissão específica
   */
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }

  /**
   * Verificar múltiplas permissões (OR logic)
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verificar múltiplas permissões (AND logic)  
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Obter tempo restante da sessão
   */
  getSessionTimeRemaining(): number {
    const sessionData = localStorage.getItem('php_session');
    if (!sessionData) {return 0;}

    try {
      const session: PHPSession = JSON.parse(sessionData);
      const expiresAt = new Date(session.expires_at).getTime();
      const now = Date.now();
      
      return Math.max(0, expiresAt - now);
    } catch {
      return 0;
    }
  }
}

// Singleton instance
export const phpSessionBridge = new PHPSessionBridge();

// Hook para usar no React
export const usePHPAuth = () => {
  return {
    isAuthenticated: phpSessionBridge.isUserAuthenticated(),
    user: phpSessionBridge.getCurrentUser(),
    sessionId: phpSessionBridge.getSessionId(),
    login: phpSessionBridge.login.bind(phpSessionBridge),
    logout: phpSessionBridge.logout.bind(phpSessionBridge),
    refreshSession: phpSessionBridge.refreshSession.bind(phpSessionBridge),
    hasPermission: phpSessionBridge.hasPermission.bind(phpSessionBridge),
    hasAnyPermission: phpSessionBridge.hasAnyPermission.bind(phpSessionBridge),
    hasAllPermissions: phpSessionBridge.hasAllPermissions.bind(phpSessionBridge),
    getSessionTimeRemaining: phpSessionBridge.getSessionTimeRemaining.bind(phpSessionBridge),
    getAuthHeaders: phpSessionBridge.getAuthHeaders.bind(phpSessionBridge),
  };
};

export default phpSessionBridge;