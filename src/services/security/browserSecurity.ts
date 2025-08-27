import { logger } from "../../utils/logger";
/**
 * Browser Security Configuration
 * Implements additional client-side security measures
 */

// Security headers to apply via meta tags
const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

// Security configuration class
class BrowserSecurity {
  private initialized = false;

  // Initialize all security measures
  initialize(): void {
    if (this.initialized) {return;}

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

  // Apply security headers via meta tags
  private applySecurityHeaders(): void {
    Object.entries(SECURITY_HEADERS).forEach(([name, content]) => {
      // Remove existing header if present
      const existing = document.querySelector(`meta[http-equiv="${name}"]`);
      if (existing) {existing.remove();}

      // Add new header
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    });
  }

  // Prevent right-click context menu in production
  private preventContextMenu(): void {
    if (import.meta.env.PROD) {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.logSecurityEvent('context_menu_attempt', {
          x: e.clientX,
          y: e.clientY,
          target: e.target instanceof Element ? e.target.tagName : 'unknown',
        });
      });
    }
  }

  // Detect and discourage dev tools usage in production
  private preventDevTools(): void {
    if (import.meta.env.PROD) {
      // Method 1: Console monitoring
      let devToolsOpen = false;
      const threshold = 160;

      setInterval(() => {
        if (window.outerWidth - window.innerWidth > threshold ||
            window.outerHeight - window.innerHeight > threshold) {
          if (!devToolsOpen) {
            devToolsOpen = true;
            this.handleDevToolsDetection();
          }
        } else {
          devToolsOpen = false;
        }
      }, 500);

      // Method 2: Console.clear monitoring
      const originalClear = console.clear;
      console.clear = () => {
        this.handleDevToolsDetection();
        originalClear();
      };

      // Method 3: Debugger statement detection
      const checkDebugger = () => {
        const start = performance.now();
        debugger; // This will pause if dev tools are open
        const end = performance.now();
        
        if (end - start > 100) {
          this.handleDevToolsDetection();
        }
      };

      // Run debugger check periodically
      if (import.meta.env.PROD) {
        setInterval(checkDebugger, 5000);
      }
    }
  }

  // Handle dev tools detection
  private handleDevToolsDetection(): void {
    this.logSecurityEvent('dev_tools_detected', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });

    // Show warning in production
    if (import.meta.env.PROD) {
      alert('⚠️ Ferramentas de desenvolvedor detectadas. Por motivos de segurança, esta ação foi registrada.');
    }
  }

  // Setup console warning message
  private setupConsoleWarning(): void {
    const warningStyle = `
      color: red;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px #000;
    `;
    
    logger.info('%c🛑 PARE!', warningStyle);
    logger.info('%cEsta é uma funcionalidade do navegador destinada a desenvolvedores. Se alguém lhe disse para copiar e colar algo aqui para habilitar uma funcionalidade ou "hackear" a conta de alguém, isso é uma farsa e dará a essa pessoa acesso à sua conta.', 'color: red; font-size: 16px;');
    logger.info('%cSe você é um desenvolvedor autorizado, pode ignorar esta mensagem.', 'color: orange; font-size: 14px;');
  }

  // Prevent drag and drop of sensitive elements
  private preventDragDrop(): void {
    document.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;
      
      // Prevent dragging of sensitive elements
      if (target.tagName === 'IMG' || 
          target.closest('[data-sensitive]') ||
          target.classList.contains('sensitive-content')) {
        e.preventDefault();
        this.logSecurityEvent('drag_attempt', {
          element: target.tagName,
          className: target.className,
        });
      }
    });

    // Prevent dropping external content
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      this.logSecurityEvent('drop_attempt', {
        files: e.dataTransfer?.files.length || 0,
        types: Array.from(e.dataTransfer?.types || []),
      });
    });
  }

  // Setup keyboard restrictions
  private setupKeyboardRestrictions(): void {
    document.addEventListener('keydown', (e) => {
      // Prevent common developer shortcuts in production
      if (import.meta.env.PROD) {
        const restricted = [
          e.key === 'F12', // Dev tools
          e.ctrlKey && e.shiftKey && e.key === 'I', // Dev tools
          e.ctrlKey && e.shiftKey && e.key === 'J', // Console
          e.ctrlKey && e.key === 'U', // View source
          e.ctrlKey && e.shiftKey && e.key === 'C', // Element inspector
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

      // Prevent text selection shortcuts on sensitive content
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

  // Monitor suspicious activity patterns
  private monitorSuspiciousActivity(): void {
    let rapidClickCount = 0;
    let rapidClickTimer: number | null = null;

    document.addEventListener('click', () => {
      rapidClickCount++;
      
      if (rapidClickTimer) {clearTimeout(rapidClickTimer);}
      
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

    // Monitor for automated behavior
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

  // Handle page visibility changes (potential tab switching for attacks)
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

  // Print protection
  setupPrintProtection(): void {
    // Prevent printing of sensitive content
    window.addEventListener('beforeprint', (e) => {
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

    // Add print styles to hide sensitive content
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

  // Screen capture detection (partial)
  setupScreenCaptureDetection(): void {
    // Limited detection possible in browser, but we can detect screen sharing APIs
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

  // Copy/paste monitoring for sensitive content
  setupClipboardMonitoring(): void {
    document.addEventListener('copy', (e) => {
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

    document.addEventListener('paste', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.closest('[data-no-paste]')) {
        e.preventDefault();
        this.logSecurityEvent('paste_attempt_blocked', {
          element: target.tagName,
        });
      }
    });
  }

  // Log security events
  private logSecurityEvent(event: string, details: Record<string, unknown>): void {
    const securityLog = {
      event,
      details,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      logger.warn('Security Event:', securityLog);
    }

    // Send to analytics/monitoring service
    this.reportSecurityEvent(securityLog);
  }

  // Report security event to backend
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
      logger.error('Failed to report security event:', error);
    }
  }

  // Get or create session ID
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = this.generateSecureId();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  // Generate secure random ID
  private generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Disable security (for development)
  disable(): void {
    if (import.meta.env.DEV) {
      this.initialized = false;
      logger.info('🔓 Browser security disabled for development');
    }
  }
}

// Create and export singleton
export const browserSecurity = new BrowserSecurity();

// Auto-initialize in production
if (import.meta.env.PROD) {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      browserSecurity.initialize();
    });
  } else {
    browserSecurity.initialize();
  }
}

export default browserSecurity;