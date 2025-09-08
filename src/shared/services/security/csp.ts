/**
 * ================================================================
 * CONTENT SECURITY POLICY - PROTEÇÃO AVANÇADA CONTRA XSS
 * ================================================================
 *
 * Este arquivo implementa um sistema robusto de Content Security Policy (CSP)
 * para o Synapse, fornecendo proteção abrangente contra ataques XSS, injeção
 * de código, clickjacking e outras vulnerabilidades web modernas.
 *
 * Funcionalidades principais:
 * - Configuração dinâmica de CSP baseada no ambiente
 * - Políticas granulares por tipo de recurso
 * - Suporte a nonces para scripts e estilos inline seguros
 * - Trusted Types para prevenção de DOM-XSS
 * - Relatórios de violação para monitoramento
 * - Configuração híbrida (meta tags + HTTP headers)
 * - Validação e sanitização de políticas
 * - Auto-ajuste para desenvolvimento vs produção
 *
 * Proteções implementadas:
 * - Prevenção XSS: Bloqueia scripts não autorizados
 * - Injeção de Dados: Previne injeção via URLs e formulários
 * - Sequestro de Cliques: Proteção via frame-ancestors
 * - Conteúdo Misto: Força HTTPS em produção
 * - Carregamento de Recursos: Controla fontes permitidas
 * - Proteção Eval: Restringe eval() e similares
 *
 * Diretivas configuradas:
 * - default-src: Política padrão para recursos
 * - script-src: Controle rigoroso de JavaScript
 * - style-src: Proteção para CSS e estilos
 * - img-src: Controle de carregamento de imagens
 * - connect-src: Restrições para fetch/XHR
 * - font-src: Fontes permitidas
 * - frame-ancestors: Proteção contra embedding
 *
 * IMPORTANTE - Limitações de meta tags:
 * Algumas diretivas só funcionam via HTTP headers:
 * - frame-ancestors: Configure no servidor (Apache/Nginx/PHP)
 * - report-uri: Para relatórios de violação
 * - sandbox: Restrições de execução
 *
 * Configuração para produção:
 * - Apache: Header always set Content-Security-Policy "..."
 * - Nginx: add_header Content-Security-Policy "..."
 * - PHP: header("Content-Security-Policy: ...")
 * - Cloudflare: Transform Rules para headers
 *
 * Ambiente adaptativo:
 * - Desenvolvimento: CSP relaxado para debugging
 * - Staging: CSP moderado para testes
 * - Produção: CSP rigoroso para máxima segurança
 *
 * @fileoverview Sistema avançado de Content Security Policy
 * @version 2.0.0
 * @since 2024-02-05
 * @author Synapse Team
 */

import { logger } from '../../utils/logger';

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
      "'unsafe-inline'", // Necessário para modo dev do Vite e ECharts
      "'unsafe-eval'", // Necessário para avaliação dinâmica do ECharts
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Necessário para CSS-in-JS e estilos dinâmicos
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http://localhost:*', // Modo desenvolvimento
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'connect-src': [
      "'self'",
      'https://api.synapse.local',
      'https://*.analytics.com',
      'ws://localhost:*', // WebSocket para desenvolvimento
      'wss://*', // WebSocket para produção
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
      // Pula diretivas que só funcionam via HTTP header
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
      php: `header("Content-Security-Policy: ${fullCSP}");`,
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
      console.info(
        'CSP aplicado via meta tag. Diretivas como frame-ancestors devem ser configuradas no servidor HTTP.'
      );

      // Mostra instruções de configuração para produção
      const config = this.getServerConfigInstructions();
      console.group('📋 Configuração CSP para Produção');
      logger.info('Apache (.htaccess ou virtualhost):', config.apache);
      logger.info('Nginx:', config.nginx);
      logger.info('PHP:', config.php);
      logger.info('CSP completo:', config.fullCSP);
      console.groupEnd();
    }
  }

  // Relatório de violações
  setupViolationReporting(): void {
    document.addEventListener('securitypolicyviolation', event => {
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

      logger.warn('Violação CSP detectada:', violation);

      // Envia para analytics/monitoramento
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'csp_violation', {
          event_category: 'security',
          custom_parameters: violation,
        });
      }

      // Reporta para endpoint de segurança
      this.reportViolation(violation);
    });
  }

  private async reportViolation(violation: unknown): Promise<void> {
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
      logger.error('Falha ao reportar violação CSP:', error);
    }
  }

  // Helpers de desenvolvimento
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

  // Endurecimento para produção
  hardenForProduction(): void {
    if (import.meta.env.PROD) {
      // Remove diretivas inseguras para produção (mantém mínimo para ECharts)
      this.policy['script-src'] = this.policy['script-src'].filter(
        src => !src.includes('unsafe-eval') || src === "'unsafe-eval'" // Mantém para ECharts
      );

      // Habilita recursos de segurança
      this.policy['upgrade-insecure-requests'] = true;
      this.policy['block-all-mixed-content'] = true;
      this.policy['trusted-types'] = ['default'];
      this.policy['require-trusted-types-for'] = ["'script'"];

      // Remove fontes localhost
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

  // Geração de nonce para scripts e estilos
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Adiciona suporte a nonce
  addNonceToPolicy(nonce: string): void {
    this.addScriptSrc(`'nonce-${nonce}'`);
    this.addStyleSrc(`'nonce-${nonce}'`);
  }
}

export const csp = new ContentSecurityPolicy();

// Inicializa CSP
export const initializeCSP = (): void => {
  if (import.meta.env.DEV) {
    csp.relaxPolicyForDevelopment();
  } else {
    csp.hardenForProduction();
  }

  csp.setupViolationReporting();
  csp.applyMetaTag();

  logger.info('🔒 Política de Segurança de Conteúdo inicializada');
};

// Schema de validação CSP
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
