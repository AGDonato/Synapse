/**
 * Security Audit Service
 * Automated security assessment and vulnerability detection
 */

import { authService, securityUtils } from './auth';
import { csrfService } from './csrf';
import { logger } from '../../utils/logger';

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'authentication' | 'authorization' | 'data-protection' | 'network' | 'configuration' | 'content-security';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  detected: Date;
  resolved: boolean;
}

export interface SecurityAuditReport {
  timestamp: Date;
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  recommendations: string[];
  compliance: {
    lgpd: boolean;
    iso27001: boolean;
    owasp: boolean;
  };
}

/**
 * Security Audit Service
 */
class SecurityAuditService {
  private auditHistory: SecurityAuditReport[] = [];
  private monitoringActive = false;
  private monitoringTimer: number | null = null;

  /**
   * Run comprehensive security audit
   */
  async runAudit(): Promise<SecurityAuditReport> {
    logger.info('🔍 Starting security audit...');
    
    const issues: SecurityIssue[] = [];
    const timestamp = new Date();

    try {
      // Authentication & Authorization checks
      issues.push(...await this.auditAuthentication());
      issues.push(...await this.auditAuthorization());
      
      // Network Security checks
      issues.push(...await this.auditNetworkSecurity());
      
      // Content Security Policy checks
      issues.push(...await this.auditContentSecurity());
      
      // Data Protection checks
      issues.push(...await this.auditDataProtection());
      
      // Configuration checks
      issues.push(...await this.auditConfiguration());
      
      // Browser Security checks
      issues.push(...await this.auditBrowserSecurity());
      
      // Generate report
      const report = this.generateReport(issues, timestamp);
      
      // Store in history
      this.auditHistory.push(report);
      
      // Limit history to last 10 audits
      if (this.auditHistory.length > 10) {
        this.auditHistory = this.auditHistory.slice(-10);
      }
      
      logger.info(`✅ Security audit completed. Score: ${report.score}/100 (${report.grade})`);
      logger.info(`Found ${report.issues.length} security issues:`, report.summary);
      
      return report;
    } catch (error) {
      logger.error('Security audit failed:', error);
      throw error;
    }
  }

  /**
   * Audit authentication mechanisms
   */
  private async auditAuthentication(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'authentication';

    // Check if user is authenticated in production
    if (securityUtils.isProduction() && !authService.isAuthenticated()) {
      issues.push({
        id: 'auth-001',
        severity: 'high',
        category,
        title: 'Usuário não autenticado em produção',
        description: 'Sistema em produção sem autenticação ativa',
        recommendation: 'Implementar autenticação obrigatória para ambiente de produção',
        impact: 'Acesso não autorizado a dados sensíveis',
        detected: new Date(),
        resolved: false,
      });
    }

    // Check token security
    const token = authService.authToken;
    if (token) {
      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        const now = Date.now();
        
        if (exp < now) {
          issues.push({
            id: 'auth-002',
            severity: 'high',
            category,
            title: 'Token de autenticação expirado',
            description: 'Token JWT está expirado',
            recommendation: 'Renovar token automaticamente ou redirecionar para login',
            impact: 'Falha na autenticação e acesso negado',
            detected: new Date(),
            resolved: false,
          });
        }
        
        // Check token lifetime (should not be longer than 24 hours)
        const lifetime = exp - (payload.iat * 1000);
        if (lifetime > 24 * 60 * 60 * 1000) {
          issues.push({
            id: 'auth-003',
            severity: 'medium',
            category,
            title: 'Token com validade muito longa',
            description: 'Token JWT válido por mais de 24 horas',
            recommendation: 'Reduzir tempo de vida do token para no máximo 24 horas',
            impact: 'Maior janela de exposição em caso de comprometimento',
            detected: new Date(),
            resolved: false,
          });
        }
      } catch (error) {
        issues.push({
          id: 'auth-004',
          severity: 'high',
          category,
          title: 'Token malformado',
          description: 'Token JWT não pode ser decodificado',
          recommendation: 'Verificar formato do token e geração correta',
          impact: 'Falhas na autenticação',
          detected: new Date(),
          resolved: false,
        });
      }
    }

    return issues;
  }

  /**
   * Audit authorization mechanisms
   */
  private async auditAuthorization(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'authorization';

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Check for overprivileged users
      if (currentUser.role === 'admin' && currentUser.permissions.length > 20) {
        issues.push({
          id: 'authz-001',
          severity: 'medium',
          category,
          title: 'Usuário com privilégios excessivos',
          description: 'Usuário admin possui muitas permissões',
          recommendation: 'Aplicar princípio do menor privilégio',
          impact: 'Maior risco em caso de comprometimento da conta',
          detected: new Date(),
          resolved: false,
        });
      }
      
      // Check for inactive users still authenticated
      if (currentUser.lastLogin) {
        const daysSinceLogin = (Date.now() - currentUser.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLogin > 90) {
          issues.push({
            id: 'authz-002',
            severity: 'low',
            category,
            title: 'Usuário inativo há muito tempo',
            description: `Último login há ${Math.floor(daysSinceLogin)} dias`,
            recommendation: 'Implementar desativação automática de contas inativas',
            impact: 'Contas abandonadas podem ser comprometidas',
            detected: new Date(),
            resolved: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Audit network security
   */
  private async auditNetworkSecurity(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'network';

    // Check HTTPS
    if (securityUtils.isProduction() && window.location.protocol !== 'https:') {
      issues.push({
        id: 'net-001',
        severity: 'critical',
        category,
        title: 'Site não está usando HTTPS',
        description: 'Conexão insegura em ambiente de produção',
        recommendation: 'Configurar HTTPS com certificado válido',
        impact: 'Dados em trânsito podem ser interceptados',
        detected: new Date(),
        resolved: false,
      });
    }

    // Check secure context
    if (!window.isSecureContext && securityUtils.isProduction()) {
      issues.push({
        id: 'net-002',
        severity: 'high',
        category,
        title: 'Contexto não seguro',
        description: 'Navegador não considera o contexto seguro',
        recommendation: 'Verificar configuração HTTPS e certificados',
        impact: 'APIs de segurança podem não funcionar',
        detected: new Date(),
        resolved: false,
      });
    }

    // Check mixed content
    if (window.location.protocol === 'https:') {
      const images = document.querySelectorAll('img[src^="http:"]');
      const scripts = document.querySelectorAll('script[src^="http:"]');
      const stylesheets = document.querySelectorAll('link[href^="http:"]');
      
      if (images.length > 0 || scripts.length > 0 || stylesheets.length > 0) {
        issues.push({
          id: 'net-003',
          severity: 'medium',
          category,
          title: 'Conteúdo misto detectado',
          description: 'Recursos HTTP em página HTTPS',
          recommendation: 'Usar apenas recursos HTTPS',
          impact: 'Warnings de segurança e possível bloqueio de conteúdo',
          detected: new Date(),
          resolved: false,
        });
      }
    }

    return issues;
  }

  /**
   * Audit Content Security Policy
   */
  private async auditContentSecurity(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'content-security';

    // Check CSP header
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')!;
    if (!cspMeta) {
      issues.push({
        id: 'csp-001',
        severity: 'high',
        category,
        title: 'Content Security Policy não configurado',
        description: 'Cabeçalho CSP ausente',
        recommendation: 'Implementar CSP restritivo',
        impact: 'Vulnerável a ataques XSS',
        detected: new Date(),
        resolved: false,
      });
    } else {
      const cspValue = cspMeta.content;
      
      // Check for unsafe directives
      if (cspValue.includes("'unsafe-eval'")) {
        issues.push({
          id: 'csp-002',
          severity: 'medium',
          category,
          title: 'CSP permite eval()',
          description: "Directiva 'unsafe-eval' presente",
          recommendation: 'Remover unsafe-eval e refatorar código',
          impact: 'Possível execução de código malicioso',
          detected: new Date(),
          resolved: false,
        });
      }
      
      if (cspValue.includes("'unsafe-inline'")) {
        issues.push({
          id: 'csp-003',
          severity: 'low',
          category,
          title: 'CSP permite scripts inline',
          description: "Directiva 'unsafe-inline' presente",
          recommendation: 'Usar nonces ou hashes para scripts inline',
          impact: 'Risco reduzido de XSS',
          detected: new Date(),
          resolved: false,
        });
      }
    }

    // Check for CSRF protection
    if (!csrfService.getToken()) {
      issues.push({
        id: 'csp-004',
        severity: 'medium',
        category,
        title: 'Proteção CSRF não ativa',
        description: 'Token CSRF não encontrado',
        recommendation: 'Ativar proteção CSRF',
        impact: 'Vulnerável a ataques CSRF',
        detected: new Date(),
        resolved: false,
      });
    }

    return issues;
  }

  /**
   * Audit data protection
   */
  private async auditDataProtection(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'data-protection';

    // Check localStorage for sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'pin'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        const value = localStorage.getItem(key);
        if (value && value.length > 10) {
          issues.push({
            id: 'data-001',
            severity: 'medium',
            category,
            title: 'Dados sensíveis em localStorage',
            description: `Chave sensível encontrada: ${key}`,
            recommendation: 'Mover dados sensíveis para sessionStorage ou não armazenar',
            impact: 'Dados persistentes podem ser acessados por outros scripts',
            detected: new Date(),
            resolved: false,
          });
        }
      }
    }

    // Check for console.log in production
    if (securityUtils.isProduction()) {
      // This is a simplified check - in reality, build tools should handle this
      const scripts = document.querySelectorAll('script');
      let hasConsoleLogs = false;
      
      scripts.forEach(script => {
        if (script.textContent?.includes('console.log')) {
          hasConsoleLogs = true;
        }
      });
      
      if (hasConsoleLogs) {
        issues.push({
          id: 'data-002',
          severity: 'low',
          category,
          title: 'Console.log em produção',
          description: 'Statements de debug encontrados',
          recommendation: 'Remover console.log do build de produção',
          impact: 'Possível vazamento de informações',
          detected: new Date(),
          resolved: false,
        });
      }
    }

    return issues;
  }

  /**
   * Audit configuration
   */
  private async auditConfiguration(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'configuration';

    // Check environment variables exposure
    if (import.meta.env.DEV && securityUtils.isProduction()) {
      issues.push({
        id: 'config-001',
        severity: 'critical',
        category,
        title: 'Modo desenvolvimento em produção',
        description: 'Variável DEV ativa em produção',
        recommendation: 'Configurar corretamente variáveis de ambiente',
        impact: 'Exposição de informações de debug',
        detected: new Date(),
        resolved: false,
      });
    }

    return issues;
  }

  /**
   * Audit browser security features
   */
  private async auditBrowserSecurity(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const category = 'configuration';

    // Check SameSite cookies
    const cookies = document.cookie.split(';');
    const insecureCookies = cookies.filter(cookie => 
      !cookie.includes('SameSite=Strict') && 
      !cookie.includes('SameSite=Lax')
    );

    if (insecureCookies.length > 0) {
      issues.push({
        id: 'browser-001',
        severity: 'low',
        category,
        title: 'Cookies sem SameSite',
        description: 'Cookies sem atributo SameSite encontrados',
        recommendation: 'Configurar SameSite=Strict ou SameSite=Lax',
        impact: 'Possível vulnerabilidade CSRF',
        detected: new Date(),
        resolved: false,
      });
    }

    return issues;
  }

  /**
   * Generate audit report
   */
  private generateReport(issues: SecurityIssue[], timestamp: Date): SecurityAuditReport {
    const summary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      info: issues.filter(i => i.severity === 'info').length,
    };

    // Calculate score (100 - weighted issues)
    const score = Math.max(0, 100 - (
      summary.critical * 20 +
      summary.high * 10 +
      summary.medium * 5 +
      summary.low * 2 +
      summary.info * 1
    ));

    // Determine grade
    let grade: SecurityAuditReport['grade'];
    if (score >= 95) {grade = 'A+';}
    else if (score >= 90) {grade = 'A';}
    else if (score >= 85) {grade = 'B+';}
    else if (score >= 80) {grade = 'B';}
    else if (score >= 75) {grade = 'C+';}
    else if (score >= 70) {grade = 'C';}
    else if (score >= 60) {grade = 'D';}
    else {grade = 'F';}

    // Generate recommendations
    const recommendations: string[] = [];
    if (summary.critical > 0) {
      recommendations.push('Corrigir imediatamente problemas críticos');
    }
    if (summary.high > 0) {
      recommendations.push('Priorizar correção de problemas de alta severidade');
    }
    if (summary.medium + summary.low > 5) {
      recommendations.push('Planejar correção gradual dos demais problemas');
    }
    
    // Check compliance
    const compliance = {
      lgpd: summary.critical === 0 && summary.high <= 1,
      iso27001: summary.critical === 0 && summary.high === 0 && summary.medium <= 2,
      owasp: summary.critical === 0 && summary.high <= 2,
    };

    return {
      timestamp,
      score,
      grade,
      issues,
      summary,
      recommendations,
      compliance,
    };
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMinutes = 60): void {
    if (this.monitoringActive) {
      logger.warn('Security monitoring already active');
      return;
    }

    this.monitoringActive = true;
    
    this.monitoringTimer = window.setInterval(async () => {
      try {
        const report = await this.runAudit();
        
        // Alert on critical issues
        if (report.summary.critical > 0) {
          logger.error('🚨 Critical security issues detected:', report.summary);
        }
        
        // Notify about score changes
        if (this.auditHistory.length > 1) {
          const previousScore = this.auditHistory[this.auditHistory.length - 2].score;
          const scoreDiff = report.score - previousScore;
          
          if (Math.abs(scoreDiff) >= 10) {
            logger.info(`📊 Security score changed: ${previousScore} → ${report.score} (${scoreDiff > 0 ? '+' : ''}${scoreDiff})`);
          }
        }
      } catch (error) {
        logger.error('Security monitoring failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    logger.info(`🔍 Security monitoring started (${intervalMinutes} min intervals)`);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      window.clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    this.monitoringActive = false;
    logger.info('🔍 Security monitoring stopped');
  }

  /**
   * Get audit history
   */
  getAuditHistory(): SecurityAuditReport[] {
    return [...this.auditHistory];
  }

  /**
   * Get latest audit report
   */
  getLatestReport(): SecurityAuditReport | null {
    return this.auditHistory[this.auditHistory.length - 1] || null;
  }

  /**
   * Export audit report as JSON
   */
  exportReport(report?: SecurityAuditReport): string {
    const reportToExport = report || this.getLatestReport();
    if (!reportToExport) {
      throw new Error('No audit report available');
    }
    
    return JSON.stringify(reportToExport, null, 2);
  }
}

// Create singleton instance
export const securityAuditService = new SecurityAuditService();

// Export types
export type { SecurityIssue, SecurityAuditReport };

export default securityAuditService;