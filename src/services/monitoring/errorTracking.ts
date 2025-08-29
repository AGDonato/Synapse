import * as React from 'react';
import { logger } from '../../utils/logger';
/**
 * Error Tracking Service
 * Advanced error monitoring and reporting for production environments
 */

export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'react' | 'promise' | 'network' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  context: Record<string, unknown>;
  fingerprint: string; // For error deduplication
  count: number; // How many times this error occurred
  firstSeen: number;
  lastSeen: number;
  resolved: boolean;
  tags: string[];
}

export interface ErrorReport {
  errors: ErrorInfo[];
  summary: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
    newInLast24h: number;
  };
  period: {
    start: number;
    end: number;
  };
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  maxErrors: number;
  reportInterval: number;
  ignoredErrors: (string | RegExp)[];
  environment: 'development' | 'staging' | 'production';
  endpoint?: string;
  beforeSend?: (error: ErrorInfo) => ErrorInfo | null;
}

const defaultConfig: ErrorTrackingConfig = {
  enabled: true,
  maxErrors: 100,
  reportInterval: 5 * 60 * 1000, // 5 minutes
  ignoredErrors: [
    /Script error/,
    /Non-Error promise rejection captured/,
    /ResizeObserver loop limit exceeded/,
    /Loading chunk \d+ failed/,
    /ChunkLoadError/,
  ],
  environment:
    (import.meta as any).env?.MODE || ('development' as ErrorTrackingConfig['environment']),
};

/**
 * Error Tracking Service
 */
class ErrorTrackingService {
  private config: ErrorTrackingConfig;
  private errors = new Map<string, ErrorInfo>();
  private sessionId: string;
  private reportTimer: number | null = null;
  private errorBuffer: ErrorInfo[] = [];

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize error tracking
   */
  private initialize(): void {
    // Global error handler
    window.addEventListener('error', event => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        type: 'javascript',
        severity: this.determineSeverity(event.error, event.message),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', event => {
      this.captureError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'promise',
        severity: 'medium',
        context: {
          reason: event.reason,
        },
      });
    });

    // Network error tracking (fetch/xhr failures)
    this.interceptNetworkErrors();

    // React error boundary integration
    this.setupReactErrorCapture();

    // Performance error tracking
    this.setupPerformanceMonitoring();

    // Security error tracking
    this.setupSecurityErrorCapture();

    // Start periodic reporting
    this.startPeriodicReporting();

    logger.info('🐛 Error tracking initialized');
  }

  /**
   * Manually capture error
   */
  captureError(error: Partial<ErrorInfo>): string {
    if (!this.config.enabled) {
      return '';
    }

    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: error.type || 'javascript',
      severity: error.severity || 'medium',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      context: error.context || {},
      fingerprint: '',
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      resolved: false,
      tags: error.tags || [],
    };

    // Generate fingerprint for deduplication
    errorInfo.fingerprint = this.generateFingerprint(errorInfo);

    // Check if error should be ignored
    if (this.shouldIgnoreError(errorInfo)) {
      return '';
    }

    // Apply beforeSend hook
    const processedError = this.config.beforeSend?.(errorInfo) || errorInfo;
    if (!processedError) {
      return '';
    }

    // Deduplicate similar errors
    const existing = this.errors.get(processedError.fingerprint);
    if (existing) {
      existing.count++;
      existing.lastSeen = Date.now();
      existing.context = { ...existing.context, ...processedError.context };
    } else {
      this.errors.set(processedError.fingerprint, processedError);
    }

    // Add to buffer for batch reporting
    this.errorBuffer.push(processedError);

    // Immediate reporting for critical errors
    if (processedError.severity === 'critical') {
      this.reportErrors([processedError]);
    }

    // Limit stored errors
    if (this.errors.size > this.config.maxErrors) {
      const oldestKey = this.errors.keys().next().value;
      if (oldestKey !== undefined) {
        this.errors.delete(oldestKey);
      }
    }

    logger.error('📊 Error captured:', processedError);

    return errorInfo.id;
  }

  /**
   * Capture React component errors
   */
  captureReactError(error: Error, errorInfo: { componentStack: string }): string {
    return this.captureError({
      message: error.message,
      stack: error.stack,
      type: 'react',
      severity: 'high',
      context: {
        componentStack: errorInfo.componentStack,
        reactVersion: (window as any).React?.version || 'unknown',
      },
      tags: ['react', 'component'],
    });
  }

  /**
   * Capture network errors
   */
  private interceptNetworkErrors(): void {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        if (!response.ok) {
          this.captureError({
            message: `Network error: ${response.status} ${response.statusText}`,
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              url: response.url,
              status: response.status,
              statusText: response.statusText,
              method: args[1]?.method || 'GET',
            },
            tags: ['network', 'fetch'],
          });
        }

        return response;
      } catch (error) {
        this.captureError({
          message: `Network request failed: ${error}`,
          stack: (error as Error).stack,
          type: 'network',
          severity: 'high',
          context: {
            url: typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || 'unknown',
            method: args[1]?.method || 'GET',
          },
          tags: ['network', 'fetch', 'failure'],
        });
        throw error;
      }
    };
  }

  /**
   * Setup React error boundary integration
   */
  private setupReactErrorCapture(): void {
    // This would be used by ErrorBoundary components
    (window as any).__ERROR_TRACKING__ = {
      captureError: this.captureError.bind(this),
      captureReactError: this.captureReactError.bind(this),
    };
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 50) {
              // Task longer than 50ms
              this.captureError({
                message: `Long task detected: ${entry.duration}ms`,
                type: 'performance',
                severity: entry.duration > 100 ? 'medium' : 'low',
                context: {
                  duration: entry.duration,
                  name: entry.name,
                  startTime: entry.startTime,
                },
                tags: ['performance', 'long-task'],
              });
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        logger.warn('PerformanceObserver not supported:', error);
      }
    }

    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if ((entry as any).value > 0.1) {
              // CLS threshold
              this.captureError({
                message: `Layout shift detected: ${(entry as any).value}`,
                type: 'performance',
                severity: (entry as any).value > 0.25 ? 'medium' : 'low',
                context: {
                  value: (entry as any).value,
                  sources: (entry as any).sources,
                },
                tags: ['performance', 'cls'],
              });
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        logger.warn('Layout shift observer not supported:', error);
      }
    }
  }

  /**
   * Setup security error capture
   */
  private setupSecurityErrorCapture(): void {
    // CSP violations
    document.addEventListener('securitypolicyviolation', event => {
      this.captureError({
        message: `CSP violation: ${event.violatedDirective}`,
        type: 'security',
        severity: 'high',
        context: {
          directive: event.violatedDirective,
          blockedURI: event.blockedURI,
          originalPolicy: event.originalPolicy,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
        },
        tags: ['security', 'csp'],
      });
    });
  }

  /**
   * Start periodic error reporting
   */
  private startPeriodicReporting(): void {
    this.reportTimer = window.setInterval(() => {
      if (this.errorBuffer.length > 0) {
        this.reportErrors([...this.errorBuffer]);
        this.errorBuffer = [];
      }
    }, this.config.reportInterval);
  }

  /**
   * Report errors to external service
   */
  private async reportErrors(errors: ErrorInfo[]): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors,
          environment: this.config.environment,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      logger.error('Failed to report errors:', error);
    }
  }

  /**
   * Generate error report
   */
  generateReport(startTime?: number, endTime?: number): ErrorReport {
    const now = Date.now();
    const start = startTime || now - 24 * 60 * 60 * 1000; // Last 24 hours
    const end = endTime || now;

    const filteredErrors = Array.from(this.errors.values()).filter(
      error => error.timestamp >= start && error.timestamp <= end
    );

    const summary = {
      total: filteredErrors.length,
      byType: this.groupBy(filteredErrors, 'type'),
      bySeverity: this.groupBy(filteredErrors, 'severity'),
      unresolved: filteredErrors.filter(e => !e.resolved).length,
      newInLast24h: filteredErrors.filter(e => e.firstSeen >= now - 24 * 60 * 60 * 1000).length,
    };

    return {
      errors: filteredErrors,
      summary,
      period: { start, end },
    };
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): boolean {
    const errorsArray = Array.from(this.errors.values());
    for (const error of errorsArray) {
      if (error.id === errorId || error.fingerprint === errorId) {
        error.resolved = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Get error details
   */
  getError(errorId: string): ErrorInfo | null {
    const errorsArray = Array.from(this.errors.values());
    for (const error of errorsArray) {
      if (error.id === errorId || error.fingerprint === errorId) {
        return error;
      }
    }
    return null;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.clear();
    this.errorBuffer = [];
  }

  /**
   * Stop error tracking
   */
  stop(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    // Report remaining errors
    if (this.errorBuffer.length > 0) {
      this.reportErrors([...this.errorBuffer]);
    }
  }

  /**
   * Helper methods
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: ErrorInfo): string {
    const components = [
      error.message,
      error.type,
      error.stack?.split('\n')[0] || '', // First line of stack
    ];

    return btoa(components.join('|'))
      .replace(/[+=\/]/g, '')
      .substr(0, 16);
  }

  private shouldIgnoreError(error: ErrorInfo): boolean {
    return this.config.ignoredErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern);
      }
      return pattern.test(error.message);
    });
  }

  private determineSeverity(error: Error, message: string): ErrorInfo['severity'] {
    // Critical errors
    if (
      message.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError'
    ) {
      return 'high';
    }

    // Security-related errors
    if (message.includes('CSP') || message.includes('security') || message.includes('blocked')) {
      return 'high';
    }

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }

    // Default
    return 'medium';
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = String(item[key]);
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

// Create singleton instance
export const errorTrackingService = new ErrorTrackingService();

// Error Boundary integration utility (React implementation would be separate)
export const createErrorTrackingWrapper = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return class ErrorTrackingWrapper extends React.Component<P> {
    componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
      errorTrackingService.captureReactError(error, errorInfo);
    }

    render() {
      return React.createElement(Component, this.props as P);
    }
  };
};

// Utility functions for error tracking (React hook would be implemented separately)
export const getErrorTrackingUtils = () => {
  return {
    captureError: errorTrackingService.captureError.bind(errorTrackingService),
    captureReactError: errorTrackingService.captureReactError.bind(errorTrackingService),
    resolveError: errorTrackingService.resolveError.bind(errorTrackingService),
    getError: errorTrackingService.getError.bind(errorTrackingService),
    generateReport: errorTrackingService.generateReport.bind(errorTrackingService),
  };
};

export default errorTrackingService;
