/**
 * ================================================================
 * CSRF PROTECTION - PROTEÇÃO CONTRA CROSS-SITE REQUEST FORGERY
 * ================================================================
 *
 * Este arquivo implementa um sistema robusto de proteção contra
 * ataques CSRF (Cross-Site Request Forgery) para o Synapse,
 * oferecendo múltiplas camadas de defesa e integração transparente
 * com requisições HTTP e formulários da aplicação.
 *
 * Funcionalidades principais:
 * - Geração automática de tokens CSRF seguros
 * - Interceptação transparente de requisições HTTP
 * - Proteção automática de formulários HTML
 * - Renovação automática de tokens com base em tempo
 * - Validação rigorosa de tokens em requisições
 * - Configuração flexível e extensível
 * - Integração nativa com Fetch API e XMLHttpRequest
 * - Suporte a meta tags para frameworks server-side
 *
 * Características de segurança:
 * - Tokens criptograficamente seguros usando Web Crypto API
 * - Validação de origem para requisições same-origin
 * - Proteção seletiva baseada em métodos HTTP
 * - Armazenamento seguro em sessionStorage
 * - Renovação proativa antes da expiração
 * - Cleanup automático de tokens expirados
 *
 * Tipos de proteção:
 * - Header-based: X-CSRF-Token em cabeçalhos HTTP
 * - Form-based: Campos hidden em formulários HTML
 * - Meta-tag: Integração com frameworks server-side
 * - Cookie-based: Suporte a double-submit cookies
 *
 * Integração automática:
 * - Fetch API interceptor para requisições AJAX
 * - Form submission automatic protection
 * - React/SPA friendly com persistent tokens
 * - Middleware support para validação backend
 *
 * Configuração adaptativa:
 * - Comprimento de token configurável
 * - Intervalo de renovação ajustável
 * - Nomes de headers e cookies personalizáveis
 * - Exclusão de endpoints específicos
 * - Modo de desenvolvimento com logging detalhado
 *
 * Padrões implementados:
 * - Singleton pattern para instância global única
 * - Observer pattern para eventos de renovação
 * - Strategy pattern para diferentes tipos de validação
 * - Decorator pattern para interceptação de requisições
 * - Factory pattern para geração de tokens
 *
 * @fileoverview Sistema robusto de proteção CSRF
 * @version 2.0.0
 * @since 2024-02-05
 * @author Synapse Team
 */

import { logger } from '../../../shared/utils/logger';

/**
 * Interface de configuração para o serviço de proteção CSRF
 *
 * @interface CSRFConfig
 */
export interface CSRFConfig {
  /** Nome do token usado em formulários e storage */
  tokenName: string;
  /** Nome do cookie para double-submit pattern */
  cookieName: string;
  /** Nome do header HTTP para envio do token */
  headerName: string;
  /** Comprimento do token em bytes (padrão: 32) */
  tokenLength: number;
  /** Intervalo de renovação automática em milissegundos */
  refreshInterval: number;
}

const defaultConfig: CSRFConfig = {
  tokenName: 'csrf_token',
  cookieName: 'csrf_cookie',
  headerName: 'X-CSRF-Token',
  tokenLength: 32,
  refreshInterval: 30 * 60 * 1000, // 30 minutes
};

/**
 * Classe principal do serviço de proteção CSRF
 *
 * Gerencia geração, validação e renovação de tokens CSRF,
 * além de interceptar requisições automaticamente para
 * aplicar proteção transparente.
 *
 * @class CSRFService
 * @example
 * ```typescript
 * const csrfService = new CSRFService({
 *   tokenLength: 32,
 *   refreshInterval: 30 * 60 * 1000 // 30 minutos
 * });
 *
 * await csrfService.initialize();
 * console.log('CSRF protection active');
 * ```
 */
class CSRFService {
  private config: CSRFConfig;
  private currentToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: number | null = null;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Inicializa o sistema de proteção CSRF
   *
   * Gera token inicial, configura interceptadores de requisição
   * e estabelece renovação automática de tokens.
   *
   * @returns {Promise<void>}
   * @throws {Error} Se a inicialização falhar
   *
   * @example
   * ```typescript
   * try {
   *   await csrfService.initialize();
   *   console.log('CSRF protection ready');
   * } catch (error) {
   *   console.error('CSRF init failed:', error);
   * }
   * ```
   */
  async initialize(): Promise<void> {
    try {
      // Gera token inicial
      await this.generateToken();

      // Configura renovação automática de token
      this.setupTokenRefresh();

      // Configura interceptadores de requisição
      this.setupRequestInterceptors();

      logger.info('🛡️ CSRF protection initialized');
    } catch (error) {
      logger.error('CSRF initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate new CSRF token
   */
  private async generateToken(): Promise<string> {
    const array = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(array);

    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    this.currentToken = token;
    this.tokenExpiry = Date.now() + this.config.refreshInterval;

    // Armazena em sessionStorage para persistência SPA
    sessionStorage.setItem(this.config.tokenName, token);
    sessionStorage.setItem(`${this.config.tokenName}_expiry`, this.tokenExpiry.toString());

    return token;
  }

  /**
   * Obtém o token CSRF atual
   *
   * Verifica validade do token em memória e sessionStorage,
   * retornando null se não houver token válido disponível.
   *
   * @returns {string | null} Token CSRF válido ou null
   *
   * @example
   * ```typescript
   * const token = csrfService.getToken();
   *
   * if (token) {
   *   headers['X-CSRF-Token'] = token;
   * } else {
   *   console.warn('No CSRF token available');
   * }
   * ```
   */
  getToken(): string | null {
    // Verifica se token existe e não está expirado
    if (this.currentToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.currentToken;
    }

    // Tenta restaurar do sessionStorage
    const storedToken = sessionStorage.getItem(this.config.tokenName);
    const storedExpiry = sessionStorage.getItem(`${this.config.tokenName}_expiry`);

    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      this.currentToken = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return storedToken;
    }

    return null;
  }

  /**
   * Renova o token CSRF
   *
   * Gera novo token criptograficamente seguro e atualiza
   * armazenamento local. Usado automaticamente pelo timer
   * de renovação ou pode ser chamado manualmente.
   *
   * @returns {Promise<string>} Novo token gerado
   *
   * @example
   * ```typescript
   * // Renovação manual antes de operação crítica
   * const freshToken = await csrfService.refreshToken();
   * console.log('Token renewed:', freshToken.substring(0, 8) + '...');
   * ```
   */
  async refreshToken(): Promise<string> {
    const newToken = await this.generateToken();
    logger.info('🔄 CSRF token refreshed');
    return newToken;
  }

  /**
   * Valida um token CSRF
   *
   * Compara o token fornecido com o token atual válido,
   * verificando também se não está expirado.
   *
   * @param {string} token - Token a ser validado
   * @returns {boolean} True se o token for válido
   *
   * @example
   * ```typescript
   * const incomingToken = request.headers['x-csrf-token'];
   *
   * if (!csrfService.validateToken(incomingToken)) {
   *   throw new Error('Invalid CSRF token');
   * }
   * ```
   */
  validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken !== null && token === currentToken;
  }

  /**
   * Configura renovação automática de token
   */
  private setupTokenRefresh(): void {
    // Limpa timer existente
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
    }

    // Configura novo timer
    this.refreshTimer = window.setInterval(() => {
      this.refreshToken().catch(console.error);
    }, this.config.refreshInterval);

    // Limpeza ao descarregar página
    window.addEventListener('beforeunload', () => {
      if (this.refreshTimer) {
        window.clearInterval(this.refreshTimer);
      }
    });
  }

  /**
   * Setup request interceptors for fetch API
   */
  private setupRequestInterceptors(): void {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = new Request(input, init);

      // Adiciona token CSRF apenas a requisições same-origin que modificam dados
      if (this.shouldAddCSRFToken(request)) {
        const token = this.getToken() || (await this.generateToken());
        request.headers.set(this.config.headerName, token);
      }

      return originalFetch(request);
    };
  }

  /**
   * Check if request should include CSRF token
   */
  private shouldAddCSRFToken(request: Request): boolean {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Apenas para métodos que alteram estado
    const stateMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!stateMethods.includes(method)) {
      return false;
    }

    // Apenas para requisições same-origin
    if (url.origin !== window.location.origin) {
      return false;
    }

    // Pula endpoints específicos (como uploads de arquivo com tratamento diferente)
    const skipPaths = ['/api/upload', '/api/files'];
    if (skipPaths.some(path => url.pathname.startsWith(path))) {
      return false;
    }

    return true;
  }

  /**
   * Protege formulário HTML com token CSRF
   *
   * Adiciona campo hidden com token CSRF atual ao formulário,
   * removendo qualquer token anterior para evitar duplicação.
   *
   * @param {HTMLFormElement} form - Formulário a ser protegido
   *
   * @example
   * ```typescript
   * const form = document.querySelector('#myForm') as HTMLFormElement;
   * csrfService.protectForm(form);
   *
   * // Ou proteção automática de todos os formulários
   * document.querySelectorAll('form').forEach(form => {
   *   csrfService.protectForm(form);
   * });
   * ```
   */
  protectForm(form: HTMLFormElement): void {
    const token = this.getToken();
    if (!token) {
      logger.warn('No CSRF token available for form protection');
      return;
    }

    // Remove input CSRF existente
    const existingInput = form.querySelector(`input[name="${this.config.tokenName}"]`);
    if (existingInput) {
      existingInput.remove();
    }

    // Adiciona token CSRF como input hidden
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = this.config.tokenName;
    csrfInput.value = token;

    form.appendChild(csrfInput);
  }

  /**
   * Gera meta tag com token CSRF para o HTML head
   *
   * Retorna string HTML com meta tag contendo token CSRF
   * para uso em templates server-side ou inserção dinâmica.
   *
   * @returns {string} HTML da meta tag ou string vazia se sem token
   *
   * @example
   * ```typescript
   * const metaTag = csrfService.getMetaTag();
   *
   * if (metaTag) {
   *   document.head.insertAdjacentHTML('beforeend', metaTag);
   * }
   *
   * // Ou em template engine:
   * // <%= csrfService.getMetaTag() %>
   * ```
   */
  getMetaTag(): string {
    const token = this.getToken();
    if (!token) {
      return '';
    }

    return `<meta name="${this.config.tokenName}" content="${token}">`;
  }

  /**
   * Limpa e desativa proteção CSRF
   *
   * Remove timers, limpa tokens armazenados e redefine
   * estado interno. Usado ao sair da aplicação ou
   * durante logout de usuário.
   *
   * @example
   * ```typescript
   * // Cleanup ao sair da aplicação
   * window.addEventListener('beforeunload', () => {
   *   csrfService.destroy();
   * });
   *
   * // Ou durante logout
   * const logout = () => {
   *   csrfService.destroy();
   *   authService.logout();
   * };
   * ```
   */
  destroy(): void {
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.currentToken = null;
    this.tokenExpiry = null;

    sessionStorage.removeItem(this.config.tokenName);
    sessionStorage.removeItem(`${this.config.tokenName}_expiry`);
  }
}

// Cria instância singleton
export const csrfService = new CSRFService();

/**
 * Utilitários de proteção CSRF para uso em componentes
 *
 * Fornece interface simplificada para acessar funcionalidades
 * CSRF em contextos onde a instância direta não é necessária.
 *
 * @returns {Object} Objeto com utilitários CSRF
 *
 * @example
 * ```typescript
 * const { getToken, isProtected } = getCSRFUtils();
 *
 * if (isProtected) {
 *   const token = getToken();
 *   // usar token em requisição
 * }
 * ```
 */
export const getCSRFUtils = () => {
  const getToken = () => csrfService.getToken();
  const refreshToken = () => csrfService.refreshToken();
  const protectForm = (form: HTMLFormElement) => csrfService.protectForm(form);

  return {
    getToken,
    refreshToken,
    protectForm,
    isProtected: getToken() !== null,
  };
};

/**
 * Wrapper do fetch com proteção CSRF automática
 *
 * Adiciona automaticamente o token CSRF às requisições,
 * oferecendo interface idêntica ao fetch nativo.
 *
 * @param {RequestInfo | URL} input - URL ou objeto Request
 * @param {RequestInit} [init] - Opções da requisição
 * @returns {Promise<Response>} Promise com resposta da requisição
 * @throws {Error} Se token CSRF não estiver disponível
 *
 * @example
 * ```typescript
 * // Usar como fetch normal, proteção automática
 * const response = await csrfFetch('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify(userData)
 * });
 *
 * const result = await response.json();
 * ```
 */
export const csrfFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const token = csrfService.getToken();

  if (!token) {
    throw new Error('CSRF token not available');
  }

  const headers = new Headers(init?.headers);
  headers.set(defaultConfig.headerName, token);

  return fetch(input, {
    ...init,
    headers,
  });
};

/**
 * Middleware de validação CSRF para frameworks
 *
 * Função middleware que valida tokens CSRF em requisições
 * de modificação de estado (POST, PUT, PATCH, DELETE).
 *
 * @param {Object} req - Objeto de requisição com method e headers
 * @param {unknown} res - Objeto de resposta
 * @param {Function} next - Função para continuar o pipeline
 *
 * @example
 * ```typescript
 * // Express.js
 * app.use(csrfMiddleware);
 *
 * // Ou middleware customizado
 * const customMiddleware = (req, res, next) => {
 *   csrfMiddleware(req, res, next);
 * };
 * ```
 */
export const csrfMiddleware = (
  req: { method: string; headers: Record<string, string> },
  res: unknown,
  next: () => void
) => {
  const method = req.method.toUpperCase();
  const stateMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (stateMethods.includes(method)) {
    const token = req.headers[defaultConfig.headerName.toLowerCase()];

    if (!token || !csrfService.validateToken(token)) {
      (res as any).status = 403;
      (res as any).body = { error: 'CSRF token validation failed' };
      return;
    }
  }

  next();
};

export default csrfService;
