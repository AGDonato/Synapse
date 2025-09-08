/**
 * ================================================================
 * SECURITY SERVICE - SISTEMA CENTRALIZADO DE SEGURANÇA
 * ================================================================
 *
 * Este arquivo implementa o sistema centralizado de segurança do Synapse,
 * fornecendo uma camada abrangente de proteção contra ameaças web modernas
 * incluindo XSS, CSRF, injeções, vazamentos de dados e ataques diversos.
 *
 * Funcionalidades principais:
 * - Content Security Policy (CSP) para prevenção de XSS
 * - Sanitização abrangente de inputs e outputs
 * - Autenticação segura com tokens e refresh automático
 * - Proteção de navegador contra devtools e screen capture
 * - Proteção CSRF para requisições de estado
 * - Auditoria de segurança contínua e monitoramento
 * - Detecção de atividades suspeitas em tempo real
 *
 * Camadas de segurança implementadas:
 * - Application Layer: CSP, sanitização, autenticação
 * - Browser Layer: Proteção contra devtools, print, clipboard
 * - Network Layer: HTTPS enforcement, CSRF tokens
 * - Data Layer: Criptografia, sanitização, validação
 * - Audit Layer: Logging, monitoramento, alertas
 *
 * Proteções contra ameaças:
 * - Cross-Site Scripting (XSS): CSP + sanitização
 * - Cross-Site Request Forgery (CSRF): Tokens + validação
 * - Injeção de código: Validação + sanitização
 * - Session hijacking: Tokens seguros + renovação
 * - Data leakage: Proteção de tela + clipboard
 * - Social engineering: Auditoria + monitoramento
 *
 * Compliance e padrões:
 * - OWASP Top 10 mitigation
 * - LGPD data protection compliance
 * - Government security standards
 * - Enterprise security best practices
 *
 * Configuração adaptativa:
 * - Desenvolvimento: Segurança relaxada para debugging
 * - Staging: Segurança moderada para testes
 * - Produção: Segurança máxima para operação
 *
 * Padrões implementados:
 * - Defense in Depth: Múltiplas camadas de proteção
 * - Principle of Least Privilege: Acesso mínimo necessário
 * - Fail Secure: Falha em estado seguro
 * - Security by Design: Segurança desde o design
 * - Zero Trust: Verificação contínua de confiança
 *
 * @fileoverview Sistema centralizado de segurança e proteção
 * @version 2.0.0
 * @since 2024-01-28
 * @author Synapse Team
 */

/**
 * ===================================================================
 * EXPORTAÇÃO DE MÓDULOS DE SEGURANÇA
 * ===================================================================
 */
export * from './csp';
export * from './sanitization';
export * from './auth';
export * from './browserSecurity';
export * from './csrf';
export * from './audit';

/**
 * ===================================================================
 * RE-EXPORTAÇÃO DE SERVIÇOS PRINCIPAIS
 * ===================================================================
 */
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
 * Inicializa todos os módulos de segurança da aplicação
 *
 * Configura e ativa todas as camadas de segurança incluindo CSP,
 * autenticação, proteção de navegador, CSRF e auditoria.
 * Estabelece listeners globais e handlers de erro para monitoramento.
 *
 * @returns Promise que resolve quando todos os módulos estão inicializados
 *
 * @example
 * ```typescript
 * // Na inicialização da aplicação
 * await initializeSecurity();
 * console.log('Sistema de segurança ativo');
 * ```
 */
export const initializeSecurity = async (): Promise<void> => {
  try {
    securityLogger.info('Initializing security modules...');

    // Inicializa CSP
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

    // Configura listeners de eventos de segurança
    setupGlobalSecurityListeners();

    // Configura error boundary para erros de segurança
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
 * Configura listeners globais para eventos de segurança
 *
 * Estabelece monitoramento global para detectar e responder
 * automaticamente a eventos suspeitos incluindo erros de autenticação,
 * violações CSP e injeções de elementos não autorizados.
 *
 * @private
 */
const setupGlobalSecurityListeners = (): void => {
  // Handle authentication errors globally
  window.addEventListener('unhandledrejection', event => {
    if (event.reason?.name === 'AuthenticationError') {
      securityLogger.warn('Authentication error detected, redirecting to login');
      authService.logout();
      window.location.href = '/login';
    }
  });

  // Handle network errors that might indicate security issues
  window.addEventListener('error', event => {
    if (event.error?.name === 'NetworkError' && event.error?.message?.includes('CSP')) {
      securityLogger.security('Potential CSP violation detected', {
        error: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    }
  });

  // Monitora injeções suspeitas de iframe
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
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
 * Configura captura e tratamento de erros de segurança
 *
 * Intercepta e analisa erros do console para identificar
 * eventos relacionados à segurança, realizando log e
 * notificação apropriados.
 *
 * @private
 */
const setupSecurityErrorHandling = (): void => {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    // Verifica erros relacionados à segurança
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

    // Chama console.error original
    originalConsoleError.apply(console, args);
  };
};

/**
 * Registra erros relacionados à segurança no sistema de auditoria
 *
 * Envia erros de segurança para endpoint de auditoria para
 * análise posterior e resposta a incidentes.
 *
 * @param error - Dados do erro de segurança para logging
 * @returns Promise que resolve quando erro foi registrado
 * @private
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
    securityLogger.warn('Failed to log security error:', err);
  }
};

/**
 * Objeto de configuração global para todos os aspectos de segurança
 *
 * Define parâmetros e thresholds para cada camada de segurança,
 * com valores adaptativos baseados no ambiente de execução.
 *
 * @example
 * ```typescript
 * // Customizar configurações de segurança
 * securityConfig.auth.maxLoginAttempts = 5;
 * securityConfig.browser.preventDevTools = false;
 * ```
 */
export const securityConfig = {
  // Configuração CSP
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
    preventTextSelection: false, // Apenas para conteúdo sensível específico
    preventPrinting: false, // Apenas para conteúdo específico
    preventScreenCapture: import.meta.env.PROD,
    logSuspiciousActivity: true,
  },

  // Configuração de segurança da API
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
 * Utilitários de segurança para uso em componentes
 *
 * Coleção de funções auxiliares para aplicar proteções de segurança
 * a elementos DOM, validar contextos e gerar valores seguros.
 *
 * @example
 * ```typescript
 * // Marcar elemento como sensível
 * securityHelpers.markAsSensitive(document.getElementById('sensitive-data'));
 *
 * // Validar origem para postMessage
 * if (securityHelpers.validateOrigin(event.origin)) {
 *   // Processar mensagem
 * }
 *
 * // Gerar nonce para script inline
 * const nonce = securityHelpers.generateNonce();
 * ```
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

  // Valida se elemento está em contexto seguro
  isSecureContext: (): boolean => {
    return (
      window.isSecureContext &&
      window.location.protocol === 'https:' &&
      !window.location.hostname.includes('localhost')
    );
  },

  // Verifica se está rodando em produção
  isProduction: (): boolean => {
    return import.meta.env.PROD;
  },

  // Gera nonce para scripts/estilos inline
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  // Valida origem para postMessage
  validateOrigin: (origin: string): boolean => {
    const allowedOrigins = ['https://synapse.gov.br', 'https://api.synapse.gov.br'];

    if (import.meta.env.DEV) {
      allowedOrigins.push('http://localhost:5173');
      allowedOrigins.push('http://127.0.0.1:5173');
    }

    return allowedOrigins.includes(origin);
  },
};

/**
 * Verifica status atual de segurança da aplicação
 *
 * Analisa vários aspectos de segurança e fornece relatório
 * com problemas identificados e recomendações de melhorias.
 *
 * @returns Objeto com status, issues e recomendações de segurança
 *
 * @example
 * ```typescript
 * const status = getSecurityStatus();
 *
 * if (!status.isSecure) {
 *   console.warn('Problemas de segurança:', status.issues);
 *   console.info('Recomendações:', status.recommendations);
 * }
 * ```
 */
export const getSecurityStatus = (): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Verifica HTTPS
  if (!window.location.protocol.startsWith('https') && import.meta.env.PROD) {
    issues.push('Site não está usando HTTPS');
    recommendations.push('Configure HTTPS para produção');
  }

  // Verifica CSP
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    issues.push('Content Security Policy não configurado');
    recommendations.push('Configure CSP para prevenir XSS');
  }

  // Verifica contexto seguro
  if (!window.isSecureContext && import.meta.env.PROD) {
    issues.push('Contexto não é seguro');
    recommendations.push('Verifique configuração HTTPS');
  }

  // Verifica autenticação
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

/**
 * ===================================================================
 * EXPORTAÇÃO PADRÃO DE INICIALIZAÇÃO DE SEGURANÇA
 * ===================================================================
 */
export default initializeSecurity;
