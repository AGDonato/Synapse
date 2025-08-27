/**
 * Security Module - Central security configuration
 */

// Security modules
export * from './csp';
export * from './sanitization';
export * from './auth';
export * from './browserSecurity';
export * from './csrf';
export * from './audit';

// Re-export main services
export { csp, initializeCSP } from './csp';
export { sanitizer, sanitize } from './sanitization';
export { authService, authUtils, securityUtils } from './auth';
export { browserSecurity } from './browserSecurity';
export { csrfService, getCSRFUtils, csrfFetch } from './csrf';
export { securityAuditService } from './audit';

import { initializeCSP } from './csp';
import { browserSecurity } from './browserSecurity';
import { authService } from './auth';
import { csrfService } from './csrf';
import { securityAuditService } from './audit';
import { createModuleLogger } from '../../utils/logger';

const securityLogger = createModuleLogger('Security');

/**
 * Initialize all security modules
 */
export const initializeSecurity = async (): Promise<void> => {
  try {
    securityLogger.info('Initializing security modules...');

    // Initialize CSP
    initializeCSP();

    // Initialize browser security
    if (import.meta.env.PROD) {
      browserSecurity.initialize();
      browserSecurity.setupPrintProtection();
      browserSecurity.setupScreenCaptureDetection();
      browserSecurity.setupClipboardMonitoring();
    }

    // Initialize authentication
    await authService.initialize();

    // Initialize CSRF protection
    await csrfService.initialize();

    // Setup security event listeners
    setupGlobalSecurityListeners();

    // Setup error boundary for security errors
    setupSecurityErrorHandling();

    // Run initial security audit
    if (import.meta.env.PROD) {
      securityAuditService.runAudit().then(report => {
        securityLogger.info(`Initial security audit: ${report.score}/100 (${report.grade})`);
        
        // Start monitoring every hour in production
        securityAuditService.startMonitoring(60);
      });
    }

    securityLogger.info('Security modules initialized successfully');
  } catch (error) {
    securityLogger.error('Security initialization failed:', error);
    throw error;
  }
};

/**
 * Setup global security event listeners
 */
const setupGlobalSecurityListeners = (): void => {
  // Handle authentication errors globally
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AuthenticationError') {
      securityLogger.warn('Authentication error detected, redirecting to login');
      authService.logout();
      window.location.href = '/login';
    }
  });

  // Handle network errors that might indicate security issues
  window.addEventListener('error', (event) => {
    if (event.error?.name === 'NetworkError' && 
        event.error?.message?.includes('CSP')) {
      securityLogger.security('Potential CSP violation detected', {
        error: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    }
  });

  // Monitor for suspicious iframe injections
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'IFRAME' && !element.hasAttribute('data-authorized')) {
            securityLogger.security('Unauthorized iframe detected', {
              tagName: element.tagName,
              src: element.getAttribute('src'),
              id: element.id,
            });
            element.remove();
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * Setup security error handling
 */
const setupSecurityErrorHandling = (): void => {
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    // Check for security-related errors
    const errorMessage = args.join(' ').toLowerCase();
    
    const securityKeywords = [
      'csp violation',
      'blocked by csp',
      'xss',
      'script injection',
      'unauthorized',
      'authentication failed',
    ];

    if (securityKeywords.some(keyword => errorMessage.includes(keyword))) {
      // Log security error
      logSecurityError({
        type: 'security_error',
        message: errorMessage,
        timestamp: Date.now(),
        url: window.location.href,
      });
    }

    // Call original console.error
    originalConsoleError.apply(console, args);
  };
};

/**
 * Log security-related errors
 */
const logSecurityError = async (error: Record<string, unknown>): Promise<void> => {
  try {
    await fetch('/api/security/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
    });
  } catch (err) {
    console.warn('Failed to log security error:', err);
  }
};

/**
 * Security configuration object
 */
export const securityConfig = {
  // CSP configuration
  csp: {
    enabled: true,
    reportViolations: import.meta.env.PROD,
    strictMode: import.meta.env.PROD,
  },
  
  // Authentication configuration
  auth: {
    tokenRefreshThreshold: 15 * 60 * 1000, // 15 minutes
    maxLoginAttempts: 3,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    passwordMinLength: 8,
    requireStrongPassword: import.meta.env.PROD,
  },
  
  // Browser security configuration
  browser: {
    preventDevTools: import.meta.env.PROD,
    preventContextMenu: import.meta.env.PROD,
    preventTextSelection: false, // Only for specific sensitive content
    preventPrinting: false, // Only for specific content
    preventScreenCapture: import.meta.env.PROD,
    logSuspiciousActivity: true,
  },
  
  // API security configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    validateResponses: true,
    sanitizeInputs: true,
    preventCSRF: true,
  },
  
  // Data protection configuration
  data: {
    encryptSensitiveData: import.meta.env.PROD,
    sanitizeInputs: true,
    validateOutputs: true,
    preventDataLeaks: true,
  },
} as const;

/**
 * Security utilities for components
 */
export const securityHelpers = {
  // Mark element as sensitive (no copy, no print, etc.)
  markAsSensitive: (element: HTMLElement): void => {
    element.setAttribute('data-sensitive', 'true');
    element.setAttribute('data-no-copy', 'true');
    element.setAttribute('data-no-print', 'true');
    element.classList.add('sensitive-content');
  },

  // Mark element as non-selectable
  markAsNonSelectable: (element: HTMLElement): void => {
    element.setAttribute('data-no-select', 'true');
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
  },

  // Validate if element is in secure context
  isSecureContext: (): boolean => {
    return window.isSecureContext && 
           window.location.protocol === 'https:' &&
           !window.location.hostname.includes('localhost');
  },

  // Check if running in production
  isProduction: (): boolean => {
    return import.meta.env.PROD;
  },

  // Generate nonce for inline scripts/styles
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  // Validate origin for postMessage
  validateOrigin: (origin: string): boolean => {
    const allowedOrigins = [
      'https://synapse.gov.br',
      'https://api.synapse.gov.br',
    ];
    
    if (import.meta.env.DEV) {
      allowedOrigins.push('http://localhost:5173');
      allowedOrigins.push('http://127.0.0.1:5173');
    }
    
    return allowedOrigins.includes(origin);
  },
};

/**
 * Security status checker
 */
export const getSecurityStatus = (): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check HTTPS
  if (!window.location.protocol.startsWith('https') && import.meta.env.PROD) {
    issues.push('Site não está usando HTTPS');
    recommendations.push('Configure HTTPS para produção');
  }

  // Check CSP
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    issues.push('Content Security Policy não configurado');
    recommendations.push('Configure CSP para prevenir XSS');
  }

  // Check secure context
  if (!window.isSecureContext && import.meta.env.PROD) {
    issues.push('Contexto não é seguro');
    recommendations.push('Verifique configuração HTTPS');
  }

  // Check authentication
  if (!authService.isAuthenticated() && securityHelpers.isProduction()) {
    issues.push('Usuário não autenticado');
    recommendations.push('Realizar login para acessar recursos');
  }

  return {
    isSecure: issues.length === 0,
    issues,
    recommendations,
  };
};

// Export default security initialization
export default initializeSecurity;