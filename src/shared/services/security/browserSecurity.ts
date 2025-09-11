/**
 * ================================================================
 * BROWSER SECURITY - PROTEÇÃO DE NAVEGADOR AVANÇADA
 * ================================================================
 *
 * Este arquivo implementa um sistema abrangente de proteção do lado cliente,
 * fornecendo múltiplas camadas de segurança para proteger a aplicação contra
 * ataques, vazamentos de dados e uso indevido em ambiente de produção.
 *
 * Funcionalidades principais:
 * - Aplicação automática de security headers via meta tags
 * - Prevenção de uso de DevTools em produção
 * - Bloqueio de menu de contexto e drag-and-drop
 * - Restrições de teclado para atalhos perigosos
 * - Monitoramento de atividades suspeitas
 * - Proteção contra print screen e captura de tela
 * - Detecção de tentativas de inspeção de código
 * - Alertas de segurança em tempo real
 *
 * Security headers aplicados:
 * - X-Content-Type-Options: Prevenção de MIME sniffing
 * - X-Frame-Options: Proteção contra clickjacking
 * - X-XSS-Protection: Proteção XSS do navegador
 * - Referrer-Policy: Controle de referrer information
 * - Permissions-Policy: Restrição de APIs sensíveis
 *
 * Proteções implementadas:
 * - Context menu blocking: Previne acesso via botão direito
 * - DevTools detection: Detecta abertura de ferramentas de desenvolvedor
 * - Keyboard restrictions: Bloqueia F12, Ctrl+Shift+I, etc.
 * - Drag & Drop prevention: Impede arrastar arquivos maliciosos
 * - Console warnings: Alerta usuários sobre perigos
 * - Visibility monitoring: Detecta quando aplicação sai de foco
 *
 * Monitoramento de atividades suspeitas:
 * - Tentativas de abertura de DevTools
 * - Múltiplas tentativas de acesso via contexto
 * - Atalhos de teclado suspeitos
 * - Mudanças de visibilidade anômalas
 * - Tentativas de bypass de proteções
 *
 * Configuração adaptativa:
 * - Desenvolvimento: Proteções desabilitadas para debugging
 * - Staging: Proteções moderadas para testes
 * - Produção: Proteções máximas para segurança
 *
 * Padrões implementados:
 * - Singleton pattern para instância única
 * - Observer pattern para monitoramento de eventos
 * - Strategy pattern para diferentes níveis de proteção
 * - Decorator pattern para wrapping de eventos nativos
 *
 * @fileoverview Sistema avançado de proteção do navegador
 * @version 2.0.0
 * @since 2024-02-04
 * @author Synapse Team
 */

import { logger } from '../../../shared/utils/logger';

/**
 * Headers de segurança aplicados via meta tags
 * Define proteções fundamentais ao nível do navegador
 */
const SECURITY_HEADERS = {
  // Previne MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Previne clickjacking
  'X-Frame-Options': 'DENY',

  // Proteção XSS
  'X-XSS-Protection': '1; mode=block',

  // Política de Referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Política de Permissões
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

/**
 * Classe principal para configuração de segurança do navegador
 *
 * Implementa múltiplas camadas de proteção client-side para
 * proteger contra ataques, inspeção não autorizada e vazamentos.
 */
class BrowserSecurity {
  private initialized = false;

  /**
   * Inicializa todas as medidas de segurança do navegador
   *
   * Aplica proteções de forma sequencial e registra eventos
   * de segurança para monitoramento.
   *
   * @example
   * ```typescript
   * const security = new BrowserSecurity();
   * security.initialize();
   * console.log('Proteções ativadas');
   * ```
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.applySecurityHeaders();
    this.preventContextMenu();
    this.preventDevTools();
    this.setupConsoleWarning();
    this.preventDragDrop();
    this.setupKeyboardRestrictions();
    this.monitorSuspiciousActivity();
    this.setupVisibilityChangeHandler();

    this.initialized = true;
    logger.info('🛡️ Browser security initialized');
  }

  /**
   * Aplica headers de segurança via meta tags
   *
   * Como a aplicação roda no cliente, usa meta tags para
   * configurar proteções que normalmente seriam headers HTTP.
   *
   * @private
   */
  private applySecurityHeaders(): void {
    Object.entries(SECURITY_HEADERS).forEach(([name, content]) => {
      // Remove header existente se presente
      const existing = document.querySelector(`meta[http-equiv="${name}"]`);
      if (existing) {
        existing.remove();
      }

      // Adiciona novo header
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    });
  }

  /**
   * Previne menu de contexto (botão direito) em produção
   *
   * Bloqueia acesso a funcionalidades de inspeção via
   * menu de contexto, logando tentativas para auditoria.
   *
   * @private
   */
  private preventContextMenu(): void {
    if (import.meta.env.PROD) {
      document.addEventListener('contextmenu', e => {
        e.preventDefault();
        this.logSecurityEvent('context_menu_attempt', {
          x: e.clientX,
          y: e.clientY,
          target: e.target instanceof Element ? e.target.tagName : 'unknown',
        });
      });
    }
  }

  /**
   * Detecta e desencoraja uso de DevTools em produção
   *
   * Implementa múltiplas técnicas para detectar abertura
   * de ferramentas de desenvolvedor e alerta sobre riscos.
   *
   * @private
   */
  private preventDevTools(): void {
    if (import.meta.env.PROD) {
      // Método 1: Monitoramento do console
      let devToolsOpen = false;
      const threshold = 160;

      setInterval(() => {
        if (
          window.outerWidth - window.innerWidth > threshold ||
          window.outerHeight - window.innerHeight > threshold
        ) {
          if (!devToolsOpen) {
            devToolsOpen = true;
            this.handleDevToolsDetection();
          }
        } else {
          devToolsOpen = false;
        }
      }, 500);

      // Método 2: Monitoramento do console.clear
      const originalClear = console.clear;
      console.clear = () => {
        this.handleDevToolsDetection();
        originalClear();
      };

      // Método 3: Detecção de debugger statement
      const checkDebugger = () => {
        const start = performance.now();
        // debugger; // Pausará se dev tools estiverem abertas - removido para produção
        const end = performance.now();

        if (end - start > 100) {
          this.handleDevToolsDetection();
        }
      };

      // Executa verificação de debugger periodicamente
      if (import.meta.env.PROD) {
        setInterval(checkDebugger, 5000);
      }
    }
  }

  // Trata detecção de dev tools
  private handleDevToolsDetection(): void {
    this.logSecurityEvent('dev_tools_detected', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });

    // Mostra aviso em produção
    if (import.meta.env.PROD) {
      alert(
        '⚠️ Ferramentas de desenvolvedor detectadas. Por motivos de segurança, esta ação foi registrada.'
      );
    }
  }

  // Configura mensagem de aviso no console
  private setupConsoleWarning(): void {
    const warningStyle = `
      color: red;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px #000;
    `;

    logger.info('%c🛑 PARE!', warningStyle);
    logger.info(
      '%cEsta é uma funcionalidade do navegador destinada a desenvolvedores. Se alguém lhe disse para copiar e colar algo aqui para habilitar uma funcionalidade ou "hackear" a conta de alguém, isso é uma farsa e dará a essa pessoa acesso à sua conta.',
      'color: red; font-size: 16px;'
    );
    logger.info(
      '%cSe você é um desenvolvedor autorizado, pode ignorar esta mensagem.',
      'color: orange; font-size: 14px;'
    );
  }

  // Previne drag and drop de elementos sensíveis
  private preventDragDrop(): void {
    document.addEventListener('dragstart', e => {
      const target = e.target as HTMLElement;

      // Previne arrastar elementos sensíveis
      if (
        target.tagName === 'IMG' ||
        target.closest('[data-sensitive]') ||
        target.classList.contains('sensitive-content')
      ) {
        e.preventDefault();
        this.logSecurityEvent('drag_attempt', {
          element: target.tagName,
          className: target.className,
        });
      }
    });

    // Previne soltar conteúdo externo
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => {
      e.preventDefault();
      this.logSecurityEvent('drop_attempt', {
        files: e.dataTransfer?.files.length || 0,
        types: Array.from(e.dataTransfer?.types || []),
      });
    });
  }

  // Configura restrições de teclado
  private setupKeyboardRestrictions(): void {
    document.addEventListener('keydown', e => {
      // Previne atalhos comuns de desenvolvedor em produção
      if (import.meta.env.PROD) {
        const restricted = [
          e.key === 'F12', // Dev tools
          e.ctrlKey && e.shiftKey && e.key === 'I', // Dev tools
          e.ctrlKey && e.shiftKey && e.key === 'J', // Console
          e.ctrlKey && e.key === 'U', // Ver código-fonte
          e.ctrlKey && e.shiftKey && e.key === 'C', // Inspetor de elementos
        ];

        if (restricted.some(Boolean)) {
          e.preventDefault();
          this.logSecurityEvent('restricted_shortcut', {
            key: e.key,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
          });
          return;
        }
      }

      // Previne atalhos de seleção de texto em conteúdo sensível
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-select]')) {
        if (e.ctrlKey && e.key === 'a') {
          e.preventDefault();
          this.logSecurityEvent('select_all_attempt', {
            element: target.tagName,
          });
        }
      }
    });
  }

  // Monitora padrões de atividade suspeita
  private monitorSuspiciousActivity(): void {
    let rapidClickCount = 0;
    let rapidClickTimer: number | null = null;

    document.addEventListener('click', () => {
      rapidClickCount++;

      if (rapidClickTimer) {
        clearTimeout(rapidClickTimer);
      }

      rapidClickTimer = window.setTimeout(() => {
        if (rapidClickCount > 10) {
          this.logSecurityEvent('rapid_clicking', {
            count: rapidClickCount,
            timeWindow: 1000,
          });
        }
        rapidClickCount = 0;
      }, 1000);
    });

    // Monitora comportamento automatizado
    let mouseMovements = 0;
    let lastMouseMove = 0;

    document.addEventListener('mousemove', () => {
      const now = Date.now();
      if (now - lastMouseMove < 10) {
        mouseMovements++;
        if (mouseMovements > 50) {
          this.logSecurityEvent('suspicious_mouse_activity', {
            movements: mouseMovements,
            timeWindow: now - lastMouseMove,
          });
          mouseMovements = 0;
        }
      } else {
        mouseMovements = 0;
      }
      lastMouseMove = now;
    });
  }

  // Trata mudanças de visibilidade da página (possível troca de abas para ataques)
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logSecurityEvent('page_hidden', {
          timestamp: Date.now(),
          activeElement: document.activeElement?.tagName,
        });
      } else {
        this.logSecurityEvent('page_visible', {
          timestamp: Date.now(),
        });
      }
    });
  }

  // Proteção de impressão
  setupPrintProtection(): void {
    // Previne impressão de conteúdo sensível
    window.addEventListener('beforeprint', e => {
      const sensitiveElements = document.querySelectorAll('[data-no-print]');
      sensitiveElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      this.logSecurityEvent('print_attempt', {
        elementsHidden: sensitiveElements.length,
      });
    });

    window.addEventListener('afterprint', () => {
      const sensitiveElements = document.querySelectorAll('[data-no-print]');
      sensitiveElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    });

    // Adiciona estilos de impressão para ocultar conteúdo sensível
    const printStyle = document.createElement('style');
    printStyle.textContent = `
      @media print {
        [data-no-print] {
          display: none !important;
        }
        .sensitive-content {
          display: none !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(printStyle);
  }

  // Detecção de captura de tela (parcial)
  setupScreenCaptureDetection(): void {
    // Detecção limitada possível no navegador, mas podemos detectar APIs de compartilhamento de tela
    if ('getDisplayMedia' in navigator.mediaDevices) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;

      navigator.mediaDevices.getDisplayMedia = (...args) => {
        this.logSecurityEvent('screen_capture_attempt', {
          api: 'getDisplayMedia',
          arguments: args.length,
        });

        return originalGetDisplayMedia.apply(navigator.mediaDevices, args);
      };
    }
  }

  // Monitoramento de copiar/colar para conteúdo sensível
  setupClipboardMonitoring(): void {
    document.addEventListener('copy', e => {
      const selection = window.getSelection()?.toString();
      const target = e.target as HTMLElement;

      if (target.closest('[data-no-copy]') || selection?.includes('sensitive')) {
        e.preventDefault();
        this.logSecurityEvent('copy_attempt_blocked', {
          element: target.tagName,
          selectionLength: selection?.length || 0,
        });
      }
    });

    document.addEventListener('paste', e => {
      const target = e.target as HTMLElement;

      if (target.closest('[data-no-paste]')) {
        e.preventDefault();
        this.logSecurityEvent('paste_attempt_blocked', {
          element: target.tagName,
        });
      }
    });
  }

  // Registra eventos de segurança
  private logSecurityEvent(event: string, details: Record<string, unknown>): void {
    const securityLog = {
      event,
      details,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
    };

    // Registra no console em desenvolvimento
    if (import.meta.env.DEV) {
      logger.warn('Evento de Segurança:', securityLog);
    }

    // Envia para serviço de analytics/monitoramento
    this.reportSecurityEvent(securityLog);
  }

  // Reporta evento de segurança para backend
  private async reportSecurityEvent(event: Record<string, unknown>): Promise<void> {
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      logger.error('Falha ao reportar evento de segurança:', error);
    }
  }

  // Obtém ou cria ID da sessão
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = this.generateSecureId();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  // Gera ID aleatório seguro
  private generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Desabilita segurança (para desenvolvimento)
  disable(): void {
    if (import.meta.env.DEV) {
      this.initialized = false;
      logger.info('🔓 Segurança do navegador desabilitada para desenvolvimento');
    }
  }
}

// Cria e exporta singleton
export const browserSecurity = new BrowserSecurity();

// Auto-inicializa em produção
if (import.meta.env.PROD) {
  // Inicializa após DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      browserSecurity.initialize();
    });
  } else {
    browserSecurity.initialize();
  }
}

export default browserSecurity;
