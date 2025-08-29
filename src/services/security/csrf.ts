import { logger } from '../../utils/logger';
/**
 * CSRF Protection utilities
 * Cross-Site Request Forgery protection for the Synapse application
 */

export interface CSRFConfig {
  tokenName: string;
  cookieName: string;
  headerName: string;
  tokenLength: number;
  refreshInterval: number; // in milliseconds
}

const defaultConfig: CSRFConfig = {
  tokenName: 'csrf_token',
  cookieName: 'csrf_cookie',
  headerName: 'X-CSRF-Token',
  tokenLength: 32,
  refreshInterval: 30 * 60 * 1000, // 30 minutes
};

/**
 * CSRF Protection Service
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
   * Initialize CSRF protection
   */
  async initialize(): Promise<void> {
    try {
      // Generate initial token
      await this.generateToken();

      // Setup automatic token refresh
      this.setupTokenRefresh();

      // Setup request interceptors
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

    // Store in sessionStorage for SPA persistence
    sessionStorage.setItem(this.config.tokenName, token);
    sessionStorage.setItem(`${this.config.tokenName}_expiry`, this.tokenExpiry.toString());

    return token;
  }

  /**
   * Get current CSRF token
   */
  getToken(): string | null {
    // Check if token exists and is not expired
    if (this.currentToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.currentToken;
    }

    // Try to restore from sessionStorage
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
   * Refresh CSRF token
   */
  async refreshToken(): Promise<string> {
    const newToken = await this.generateToken();
    logger.info('🔄 CSRF token refreshed');
    return newToken;
  }

  /**
   * Validate CSRF token
   */
  validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken !== null && token === currentToken;
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
    }

    // Setup new timer
    this.refreshTimer = window.setInterval(() => {
      this.refreshToken().catch(console.error);
    }, this.config.refreshInterval);

    // Cleanup on page unload
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

      // Only add CSRF token to same-origin requests that modify data
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

    // Only for state-changing methods
    const stateMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!stateMethods.includes(method)) {
      return false;
    }

    // Only for same-origin requests
    if (url.origin !== window.location.origin) {
      return false;
    }

    // Skip for specific endpoints (like file uploads with different handling)
    const skipPaths = ['/api/upload', '/api/files'];
    if (skipPaths.some(path => url.pathname.startsWith(path))) {
      return false;
    }

    return true;
  }

  /**
   * Create CSRF-protected form
   */
  protectForm(form: HTMLFormElement): void {
    const token = this.getToken();
    if (!token) {
      logger.warn('No CSRF token available for form protection');
      return;
    }

    // Remove existing CSRF input
    const existingInput = form.querySelector(`input[name="${this.config.tokenName}"]`);
    if (existingInput) {
      existingInput.remove();
    }

    // Add CSRF token as hidden input
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = this.config.tokenName;
    csrfInput.value = token;

    form.appendChild(csrfInput);
  }

  /**
   * Get CSRF meta tag for HTML head
   */
  getMetaTag(): string {
    const token = this.getToken();
    if (!token) {
      return '';
    }

    return `<meta name="${this.config.tokenName}" content="${token}">`;
  }

  /**
   * Cleanup CSRF protection
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

// Create singleton instance
export const csrfService = new CSRFService();

/**
 * CSRF protection utilities (React hook would be implemented separately)
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
 * CSRF-protected fetch wrapper
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
 * Middleware function for frameworks
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
