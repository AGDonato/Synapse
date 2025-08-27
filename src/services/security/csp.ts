/**
 * Content Security Policy configuration for enhanced security
 * Prevents XSS, data injection, and other common web vulnerabilities
 * 
 * IMPORTANTE: Algumas diretivas CSP só funcionam via cabeçalhos HTTP:
 * - frame-ancestors: Deve ser configurada no servidor web (Apache/Nginx/etc)
 * - report-uri/report-to: Para relatórios de violação
 * 
 * Para produção, configure no servidor:
 * - Apache: Header always set Content-Security-Policy "..."
 * - Nginx: add_header Content-Security-Policy "..."
 * - PHP: header("Content-Security-Policy: ...")
 */

import { z } from 'zod';

interface CSPPolicy {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'child-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
  'trusted-types'?: string[];
  'require-trusted-types-for'?: string[];
}

class ContentSecurityPolicy {
  private policy: CSPPolicy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite dev mode and ECharts
      "'unsafe-eval'", // Required for ECharts dynamic evaluation
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and dynamic styles
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http://localhost:*', // Dev mode
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'connect-src': [
      "'self'",
      'https://api.synapse.local',
      'https://*.analytics.com',
      'ws://localhost:*', // WebSocket for dev
      'wss://*', // WebSocket for production
    ],
    'media-src': ["'self'", 'blob:', 'data:'],
    'object-src': ["'none'"],
    'child-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': import.meta.env.PROD,
    'block-all-mixed-content': import.meta.env.PROD,
    'trusted-types': import.meta.env.PROD ? ['default'] : undefined,
    'require-trusted-types-for': import.meta.env.PROD ? ["'script'"] : undefined,
  };

  generateCSPHeader(): string {
    const directives: string[] = [];

    Object.entries(this.policy).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          directives.push(key);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        directives.push(`${key} ${value.join(' ')}`);
      }
    });

    return directives.join('; ');
  }

  generateMetaCSP(): string {
    // Diretivas que NÃO funcionam via meta tag (só via HTTP header)
    const httpOnlyDirectives = ['frame-ancestors', 'report-uri', 'report-to'];
    const directives: string[] = [];

    Object.entries(this.policy).forEach(([key, value]) => {
      // Pular diretivas que só funcionam via HTTP header
      if (httpOnlyDirectives.includes(key)) {
        return;
      }

      if (typeof value === 'boolean') {
        if (value) {
          directives.push(key);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        directives.push(`${key} ${value.join(' ')}`);
      }
    });

    return directives.join('; ');
  }

  /**
   * Gera instruções para configuração no servidor HTTP
   * Para ser usado durante o deploy em produção
   */
  getServerConfigInstructions(): {
    apache: string;
    nginx: string;
    php: string;
    fullCSP: string;
  } {
    const fullCSP = this.generateCSPHeader();
    
    return {
      fullCSP,
      apache: `Header always set Content-Security-Policy "${fullCSP}"`,
      nginx: `add_header Content-Security-Policy "${fullCSP}";`,
      php: `header("Content-Security-Policy: ${fullCSP}");`
    };
  }

  addScriptSrc(src: string): void {
    if (!this.policy['script-src'].includes(src)) {
      this.policy['script-src'].push(src);
    }
  }

  addStyleSrc(src: string): void {
    if (!this.policy['style-src'].includes(src)) {
      this.policy['style-src'].push(src);
    }
  }

  addConnectSrc(src: string): void {
    if (!this.policy['connect-src'].includes(src)) {
      this.policy['connect-src'].push(src);
    }
  }

  applyMetaTag(): void {
    const existingTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingTag) {
      existingTag.remove();
    }

    const metaTag = document.createElement('meta');
    metaTag.setAttribute('http-equiv', 'Content-Security-Policy');
    metaTag.setAttribute('content', this.generateMetaCSP());
    document.head.appendChild(metaTag);

    // Log informativo sobre diretivas não aplicadas
    if (import.meta.env.DEV) {
      console.info('CSP aplicado via meta tag. Diretivas como frame-ancestors devem ser configuradas no servidor HTTP.');
      
      // Mostrar instruções de configuração para produção
      const config = this.getServerConfigInstructions();
      console.group('📋 Configuração CSP para Produção');
      console.log('Apache (.htaccess ou virtualhost):', config.apache);
      console.log('Nginx:', config.nginx);
      console.log('PHP:', config.php);
      console.log('CSP completo:', config.fullCSP);
      console.groupEnd();
    }
  }

  // Violation reporting
  setupViolationReporting(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        blockedURI: event.blockedURI,
        columnNumber: event.columnNumber,
        disposition: event.disposition,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        lineNumber: event.lineNumber,
        originalPolicy: event.originalPolicy,
        referrer: event.referrer,
        sample: event.sample,
        sourceFile: event.sourceFile,
        statusCode: event.statusCode,
        violatedDirective: event.violatedDirective,
      };

      console.warn('CSP Violation detected:', violation);
      
      // Send to analytics/monitoring
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'csp_violation', {
          event_category: 'security',
          custom_parameters: violation,
        });
      }

      // Report to security endpoint
      this.reportViolation(violation);
    });
  }

  private async reportViolation(violation: any): Promise<void> {
    try {
      await fetch('/api/security/csp-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violation,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }

  // Development helpers
  relaxPolicyForDevelopment(): void {
    if (import.meta.env.DEV) {
      this.addScriptSrc('http://localhost:*');
      this.addStyleSrc('http://localhost:*');
      this.addConnectSrc('http://localhost:*');
      this.addConnectSrc('ws://localhost:*');
      this.policy['upgrade-insecure-requests'] = false;
      this.policy['block-all-mixed-content'] = false;
      this.policy['trusted-types'] = undefined;
      this.policy['require-trusted-types-for'] = undefined;
    }
  }

  // Production hardening
  hardenForProduction(): void {
    if (import.meta.env.PROD) {
      // Remove unsafe directives for production (keep minimal for ECharts)
      this.policy['script-src'] = this.policy['script-src'].filter(
        src => !src.includes('unsafe-eval') || src === "'unsafe-eval'" // Keep for ECharts
      );
      
      // Enable security features
      this.policy['upgrade-insecure-requests'] = true;
      this.policy['block-all-mixed-content'] = true;
      this.policy['trusted-types'] = ['default'];
      this.policy['require-trusted-types-for'] = ["'script'"];
      
      // Remove localhost sources
      Object.keys(this.policy).forEach(key => {
        const value = this.policy[key as keyof CSPPolicy];
        if (Array.isArray(value)) {
          (this.policy[key as keyof CSPPolicy] as string[]) = value.filter(
            src => typeof src === 'string' && !src.includes('localhost')
          );
        }
      });
    }
  }

  // Nonce generation for scripts and styles
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Add nonce support
  addNonceToPolicy(nonce: string): void {
    this.addScriptSrc(`'nonce-${nonce}'`);
    this.addStyleSrc(`'nonce-${nonce}'`);
  }
}

export const csp = new ContentSecurityPolicy();

// Initialize CSP
export const initializeCSP = (): void => {
  if (import.meta.env.DEV) {
    csp.relaxPolicyForDevelopment();
  } else {
    csp.hardenForProduction();
  }

  csp.setupViolationReporting();
  csp.applyMetaTag();

  console.log('🔒 Content Security Policy initialized');
};

// CSP validation schema
export const cspViolationSchema = z.object({
  blockedURI: z.string(),
  columnNumber: z.number(),
  disposition: z.string(),
  documentURI: z.string(),
  effectiveDirective: z.string(),
  lineNumber: z.number(),
  originalPolicy: z.string(),
  referrer: z.string(),
  sample: z.string(),
  sourceFile: z.string(),
  statusCode: z.number(),
  violatedDirective: z.string(),
});

export type CSPViolation = z.infer<typeof cspViolationSchema>;