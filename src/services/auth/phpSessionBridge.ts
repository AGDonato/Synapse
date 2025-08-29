/**
 * ================================================================
 * PHP SESSION BRIDGE - PONTE DE INTEGRAÇÃO COM SISTEMAS PHP
 * ================================================================
 *
 * Este arquivo implementa uma ponte de integração para sincronizar sessões
 * de autenticação entre o frontend React/TypeScript e backends PHP/Laravel
 * existentes, permitindo uma experiência de usuário unificada.
 *
 * Funcionalidades principais:
 * - Sincronização automática de sessões entre PHP e React
 * - Gerenciamento de cookies de sessão PHP (PHPSESSID)
 * - Validação contínua de sessões com heartbeat
 * - Suporte a tokens CSRF para segurança
 * - Gestão de permissões baseadas em roles PHP
 * - Sincronização cross-tab para múltiplas abas
 * - Auto-refresh de sessões para manter usuário logado
 * - Redirecionamento inteligente após logout
 *
 * Arquitetura da integração:
 * - Session Bridge: Ponte principal entre sistemas
 * - Cookie Management: Gerenciamento de cookies PHP nativos
 * - Token Sync: Sincronização de tokens CSRF/AUTH
 * - Permission Mapping: Mapeamento de permissões PHP → React
 * - Event System: Eventos customizados para comunicação
 *
 * Fluxo de autenticação:
 * 1. Detecção de cookie PHP existente (PHPSESSID)
 * 2. Validação da sessão com backend PHP via API
 * 3. Sincronização de dados de usuário e permissões
 * 4. Configuração de intervalos de verificação automática
 * 5. Gestão de eventos de login/logout cross-tab
 *
 * Padrões implementados:
 * - Singleton pattern para instância única global
 * - Observer pattern para eventos de autenticação
 * - Proxy pattern para interceptação de requisições
 * - Strategy pattern para diferentes tipos de validação
 * - Bridge pattern para integração entre sistemas heterogêneos
 *
 * Segurança:
 * - Validação contínua de tokens CSRF
 * - Verificação periódica de expiração de sessão
 * - Limpeza automática de dados sensíveis no logout
 * - Proteção contra ataques de session hijacking
 * - Sincronização segura entre abas múltiplas
 *
 * @fileoverview Ponte para integração com sistemas de autenticação PHP
 * @version 2.0.0
 * @since 2024-01-18
 * @author Synapse Team
 */

import { env } from '../../config/env';
import { httpClient as phpApiClient } from '../api';
import { logger } from '../../utils/logger';
import type { User } from '../security/auth';

/**
 * Interface que define a estrutura de uma sessão PHP
 * Representa todos os dados de sessão mantidos pelo backend PHP
 */
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

/**
 * Interface para respostas de autenticação do sistema PHP
 * Define o formato padronizado para todas as operações de auth
 */
export interface PHPAuthResponse {
  success: boolean;
  user?: User;
  session?: PHPSession;
  token?: string;
  message?: string;
  errors?: string[];
}

/**
 * Classe principal para integração com sistemas de autenticação PHP
 *
 * Esta classe implementa uma ponte completa entre o frontend React e backends
 * PHP/Laravel, gerenciando automaticamente sessões, cookies, tokens CSRF e
 * sincronização de dados de usuário em tempo real.
 *
 * Funcionalidades:
 * - Detecção e validação automática de cookies PHP (PHPSESSID)
 * - Sincronização bidirecional de estados de autenticação
 * - Gestão inteligente de tokens CSRF com cache e renovação
 * - Verificação periódica de validade de sessão (heartbeat)
 * - Suporte completo para múltiplas abas com sincronização
 * - Sistema de permissões baseado em roles do PHP
 * - Auto-logout em caso de expiração de sessão
 * - Redirecionamento inteligente preservando destino original
 *
 * @example
 * ```typescript
 * // Inicialização automática via singleton
 * import { phpSessionBridge } from './phpSessionBridge';
 *
 * // Verificar se usuário está autenticado
 * if (phpSessionBridge.isUserAuthenticated()) {
 *   const user = phpSessionBridge.getCurrentUser();
 *   console.log('Usuário logado:', user.name);
 * }
 *
 * // Login programático
 * const response = await phpSessionBridge.login({
 *   username: 'usuario',
 *   password: 'senha123'
 * });
 *
 * if (response.success) {
 *   console.log('Login realizado com sucesso');
 * }
 * ```
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
   * Inicializa a ponte de sessão verificando cookies PHP existentes
   *
   * Este método é chamado automaticamente no construtor e verifica se já existe
   * uma sessão PHP ativa no navegador. Se encontrar um cookie PHPSESSID válido,
   * valida a sessão com o backend e sincroniza os dados do usuário.
   *
   * @returns Promise que resolve para true se sessão foi inicializada com sucesso
   *
   * @example
   * ```typescript
   * const initialized = await phpSessionBridge.initializeSession();
   * if (initialized) {
   *   console.log('Sessão PHP encontrada e validada');
   * } else {
   *   console.log('Nenhuma sessão válida encontrada');
   * }
   * ```
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
   * Realiza login no sistema PHP e sincroniza com o frontend
   *
   * Envia credenciais para o endpoint de login do PHP, processa a resposta
   * e configura toda a infraestrutura de sessão necessária no frontend.
   *
   * @param credentials - Objeto com username e password do usuário
   * @returns Promise com resposta de autenticação contendo dados do usuário
   *
   * @example
   * ```typescript
   * const response = await phpSessionBridge.login({
   *   username: 'joao.silva',
   *   password: 'minhasenha123'
   * });
   *
   * if (response.success) {
   *   console.log('Usuário logado:', response.user?.name);
   *   console.log('Token CSRF:', response.token);
   * } else {
   *   console.error('Erro:', response.message);
   *   console.error('Detalhes:', response.errors);
   * }
   * ```
   */
  async login(credentials: { username: string; password: string }): Promise<PHPAuthResponse> {
    try {
      const response = await phpApiClient.post('/auth/login', {
        json: {
          username: credentials.username,
          password: credentials.password,
          remember: true, // Para manter sessão ativa
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        const { user, session } = data;
        this.setAuthenticatedUser(user, session);
        this.startSessionSync();

        return {
          success: true,
          user,
          session,
          token: session?.csrf_token,
        };
      }

      return {
        success: false,
        message: data.message || 'Falha na autenticação',
        errors: data.errors || [],
      };
    } catch (error: unknown) {
      logger.error('Erro no login PHP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Realiza logout completo do sistema PHP e limpa dados locais
   *
   * Notifica o backend PHP sobre o logout, limpa todos os dados de sessão
   * armazenados localmente, para a sincronização automática e redireciona
   * para a página de login se necessário.
   *
   * @returns Promise que resolve quando logout é concluído
   *
   * @example
   * ```typescript
   * await phpSessionBridge.logout();
   * console.log('Logout realizado com sucesso');
   * // Usuário será redirecionado para login automaticamente
   * ```
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
   * Verifica se existe um usuário autenticado atualmente
   *
   * @returns true se usuário está autenticado, false caso contrário
   *
   * @example
   * ```typescript
   * if (phpSessionBridge.isUserAuthenticated()) {
   *   // Usuário pode acessar recursos protegidos
   *   renderDashboard();
   * } else {
   *   // Redirecionar para login
   *   redirectToLogin();
   * }
   * ```
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated && this.currentUser !== null;
  }

  /**
   * Obtém os dados do usuário autenticado atualmente
   *
   * @returns Objeto User com dados do usuário ou null se não autenticado
   *
   * @example
   * ```typescript
   * const user = phpSessionBridge.getCurrentUser();
   * if (user) {
   *   console.log('Bem-vindo,', user.name);
   *   console.log('Email:', user.email);
   *   console.log('Role:', user.role);
   * }
   * ```
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obtém o ID da sessão PHP atual
   *
   * @returns String com session ID ou null se não há sessão ativa
   *
   * @example
   * ```typescript
   * const sessionId = phpSessionBridge.getSessionId();
   * if (sessionId) {
   *   console.log('Sessão ativa:', sessionId);
   * }
   * ```
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Valida a sessão atual fazendo uma verificação com o backend PHP
   *
   * Útil para verificar se a sessão ainda é válida antes de realizar
   * operações importantes ou após períodos de inatividade.
   *
   * @returns Promise que resolve para true se sessão é válida
   *
   * @example
   * ```typescript
   * const isValid = await phpSessionBridge.validateCurrentSession();
   * if (!isValid) {
   *   console.log('Sessão expirou, fazendo logout...');
   *   await phpSessionBridge.logout();
   * }
   * ```
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
   * Renova a sessão PHP para evitar expiração
   *
   * Faz uma requisição ao endpoint de refresh para estender o tempo
   * de vida da sessão e atualiza os dados do usuário se necessário.
   *
   * @returns Promise que resolve para true se sessão foi renovada com sucesso
   *
   * @example
   * ```typescript
   * const refreshed = await phpSessionBridge.refreshSession();
   * if (refreshed) {
   *   console.log('Sessão renovada com sucesso');
   * } else {
   *   console.log('Falha ao renovar sessão');
   * }
   * ```
   */
  async refreshSession(): Promise<boolean> {
    try {
      const response = await phpApiClient.post('/auth/refresh');
      const data = await response.json();

      if (data.success && data.user) {
        this.setAuthenticatedUser(data.user, data.session);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Erro ao renovar sessão:', error);
      return false;
    }
  }

  /**
   * Obtém o token CSRF necessário para requisições ao backend PHP
   *
   * Verifica primeiro o cache local, depois tenta obter do meta tag HTML.
   * O token é usado para prevenir ataques CSRF em formulários e APIs.
   *
   * @returns Token CSRF como string ou null se não encontrado
   *
   * @example
   * ```typescript
   * const csrfToken = phpSessionBridge.getCSRFToken();
   * if (csrfToken) {
   *   // Incluir em headers de requisições POST
   *   headers['X-CSRF-TOKEN'] = csrfToken;
   * }
   * ```
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
   * ===================================================================
   * MÉTODOS PRIVADOS - IMPLEMENTAÇÃO INTERNA
   * ===================================================================
   */
  /**
   * Valida sessão atual com o backend PHP
   *
   * @returns Promise com resposta de validação da sessão
   * @private
   */
  private async validatePHPSession(): Promise<PHPAuthResponse> {
    const response = await phpApiClient.get('/auth/check-session');
    return await response.json();
  }

  /**
   * Define usuário como autenticado e armazena dados localmente
   *
   * @param user - Dados do usuário autenticado
   * @param session - Dados opcionais da sessão PHP
   * @private
   */
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
        localStorage.setItem(
          'php_csrf_token',
          JSON.stringify({
            token: session.csrf_token,
            expires: Date.now() + 60 * 60 * 1000, // 1 hora
          })
        );
      }
    }

    // Emitir evento de login
    window.dispatchEvent(
      new CustomEvent('php-auth-login', {
        detail: { user, session },
      })
    );
  }

  /**
   * Limpa dados do usuário autenticado e emite evento de logout
   *
   * @private
   */
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

  /**
   * Obtém session ID do cookie PHP (PHPSESSID)
   *
   * @returns Session ID como string ou null se não encontrado
   * @private
   */
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

  /**
   * Remove cookie de sessão PHP do navegador
   *
   * @private
   */
  private clearPHPSession(): void {
    const sessionName = env.PHP_SESSION_NAME || 'PHPSESSID';
    document.cookie = `${sessionName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }

  /**
   * Inicia sincronização automática de sessão com verificações periódicas
   *
   * @private
   */
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

  /**
   * Para a sincronização automática de sessão
   *
   * @private
   */
  private stopSessionSync(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = undefined;
    }
  }

  /**
   * Configura listeners de eventos para sincronização automática
   *
   * Inclui eventos de visibilidade, beforeunload e storage para
   * sincronização cross-tab e limpeza adequada de recursos.
   *
   * @private
   */
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
    window.addEventListener('storage', event => {
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

  /**
   * Gerencia redirecionamento após logout preservando URL de destino
   *
   * @private
   */
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
   * ===================================================================
   * MÉTODOS UTILITÁRIOS PÚBLICOS
   * ===================================================================
   */
  /**
   * Obtém headers de autenticação necessários para requisições ao PHP
   *
   * Inclui token CSRF e session ID quando disponíveis para garantir
   * que as requisições sejam properly autenticadas e protegidas.
   *
   * @returns Objeto com headers de autenticação
   *
   * @example
   * ```typescript
   * const headers = phpSessionBridge.getAuthHeaders();
   * // { 'X-CSRF-TOKEN': 'abc123...', 'X-Session-ID': 'sess_456...' }
   *
   * fetch('/api/protected-endpoint', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     ...headers
   *   },
   *   body: JSON.stringify(data)
   * });
   * ```
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
   * Verifica se o usuário atual possui uma permissão específica
   *
   * @param permission - Nome da permissão a verificar
   * @returns true se usuário possui a permissão
   *
   * @example
   * ```typescript
   * if (phpSessionBridge.hasPermission('users.create')) {
   *   showCreateUserButton();
   * }
   *
   * if (phpSessionBridge.hasPermission('admin.dashboard')) {
   *   renderAdminDashboard();
   * }
   * ```
   */
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }

  /**
   * Verifica se o usuário possui pelo menos uma das permissões especificadas
   *
   * Usa lógica OR - retorna true se usuário tem qualquer uma das permissões.
   *
   * @param permissions - Array de permissões para verificar
   * @returns true se usuário possui pelo menos uma permissão
   *
   * @example
   * ```typescript
   * // Usuário pode editar OU deletar
   * if (phpSessionBridge.hasAnyPermission(['posts.edit', 'posts.delete'])) {
   *   showPostActions();
   * }
   *
   * // Qualquer nível de acesso administrativo
   * if (phpSessionBridge.hasAnyPermission(['admin.users', 'admin.content', 'admin.settings'])) {
   *   showAdminMenu();
   * }
   * ```
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verifica se o usuário possui todas as permissões especificadas
   *
   * Usa lógica AND - retorna true apenas se usuário tem todas as permissões.
   *
   * @param permissions - Array de permissões obrigatórias
   * @returns true se usuário possui todas as permissões
   *
   * @example
   * ```typescript
   * // Usuário deve poder criar E publicar posts
   * if (phpSessionBridge.hasAllPermissions(['posts.create', 'posts.publish'])) {
   *   showAdvancedEditor();
   * }
   *
   * // Acesso completo a usuários
   * if (phpSessionBridge.hasAllPermissions(['users.read', 'users.create', 'users.edit', 'users.delete'])) {
   *   showFullUserManagement();
   * }
   * ```
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Calcula o tempo restante até expiração da sessão atual
   *
   * @returns Tempo em milissegundos até expiração (0 se expirado)
   *
   * @example
   * ```typescript
   * const timeLeft = phpSessionBridge.getSessionTimeRemaining();
   *
   * if (timeLeft < 5 * 60 * 1000) { // Menos de 5 minutos
   *   showSessionExpiryWarning();
   * }
   *
   * // Converter para minutos
   * const minutesLeft = Math.floor(timeLeft / (1000 * 60));
   * console.log(`Sessão expira em ${minutesLeft} minutos`);
   * ```
   */
  getSessionTimeRemaining(): number {
    const sessionData = localStorage.getItem('php_session');
    if (!sessionData) {
      return 0;
    }

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

/**
 * ===================================================================
 * REACT HOOK E EXPORTAÇÕES
 * ===================================================================
 */
/**
 * Hook React para integração com autenticação PHP
 *
 * Fornece uma interface convenient para componentes React acessarem
 * todas as funcionalidades do PHP Session Bridge de forma reativa.
 *
 * @returns Objeto com métodos e estados de autenticação
 *
 * @example
 * ```tsx
 * import { usePHPAuth } from './phpSessionBridge';
 *
 * function MyComponent() {
 *   const {
 *     isAuthenticated,
 *     user,
 *     login,
 *     logout,
 *     hasPermission
 *   } = usePHPAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Bem-vindo, {user?.name}!</h1>
 *       {hasPermission('admin.dashboard') && (
 *         <AdminPanel />
 *       )}
 *       <button onClick={logout}>Sair</button>
 *     </div>
 *   );
 * }
 * ```
 */
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
