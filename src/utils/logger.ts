/**
 * Sistema de Logging Centralizado
 * Substitui console.log por um sistema mais robusto e controlado
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  userId?: string;
  sessionId?: string;
  url?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  console: boolean;
  remote: boolean;
  storage: boolean;
  maxStorageEntries: number;
  remoteEndpoint?: string;
  enableStackTrace: boolean;
  enableUserTracking: boolean;
}

class Logger {
  private config: LoggerConfig;
  private storageKey = 'synapse_logs';
  private sessionId: string;
  private readonly levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    security: 4,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: true,
      level: import.meta.env.PROD ? 'warn' : 'debug',
      console: !import.meta.env.PROD,
      remote: import.meta.env.PROD,
      storage: true,
      maxStorageEntries: 1000,
      remoteEndpoint: '/api/logs',
      enableStackTrace: !import.meta.env.PROD,
      enableUserTracking: import.meta.env.PROD,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger(): void {
    // Setup error boundary logging
    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        this.error('Global Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', event => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise,
        });
      });

      // Performance monitoring
      if ('performance' in window && this.config.level === 'debug') {
        this.setupPerformanceMonitoring();
      }
    }

    // Clean old logs periodically
    this.cleanOldLogs();
  }

  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              this.warn('Long Task Detected', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return this.levels[level] >= this.levels[this.config.level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (context) {
      entry.context = context;
    }
    if (data) {
      entry.data = data;
    }

    // Add user info if enabled
    if (this.config.enableUserTracking && typeof window !== 'undefined') {
      const user = this.getCurrentUser();
      if (user) {
        entry.userId = user;
      }
    }

    return entry;
  }

  private getCurrentUser(): string | undefined {
    // Try to get user from various sources
    try {
      // From localStorage
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.id || parsed.email || parsed.username;
      }

      // From sessionStorage
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        return parsed.id || parsed.email || parsed.username;
      }
    } catch {
      // Ignore errors
    }

    return undefined;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.console) {
      return;
    }

    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const context = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${context} ${entry.message}`;

    const consoleMethod = this.getConsoleMethod(entry.level);

    if (entry.data) {
      consoleMethod(message, entry.data);
    } else {
      consoleMethod(message);
    }

    // Add stack trace for errors in development
    if (entry.level === 'error' && this.config.enableStackTrace) {
      console.trace();
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336; font-weight: bold',
      security: 'color: #9C27B0; font-weight: bold; background: #FFF3E0',
    };
    return styles[level];
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
      case 'security':
        return console.error;
      default:
        return console.log;
    }
  }

  private logToStorage(entry: LogEntry): void {
    if (!this.config.storage || typeof window === 'undefined') {
      return;
    }

    try {
      const existingLogs = this.getStoredLogs();
      const updatedLogs = [...existingLogs, entry];

      // Keep only recent logs
      if (updatedLogs.length > this.config.maxStorageEntries) {
        updatedLogs.splice(0, updatedLogs.length - this.config.maxStorageEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(updatedLogs));
    } catch (error) {
      // Storage might be full or unavailable
      console.warn('Failed to store log entry:', error);
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remote || !this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Remote logging failed, store locally as fallback
      this.logToStorage(entry);
    }
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, data, context);

    // Log to console
    this.logToConsole(entry);

    // Log to storage
    this.logToStorage(entry);

    // Log to remote endpoint
    if (this.config.remote) {
      this.logToRemote(entry).catch(() => {
        // Silent fail for remote logging
      });
    }
  }

  // Public logging methods
  public debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  public info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  public warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  public error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  public security(message: string, data?: unknown, context?: string): void {
    this.log('security', message, data, context);
  }

  // Utility methods
  public getStoredLogs(): LogEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  public clearStoredLogs(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(this.storageKey);
  }

  public exportLogs(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private cleanOldLogs(): void {
    // Clean logs older than 7 days
    const logs = this.getStoredLogs();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > sevenDaysAgo);

    if (recentLogs.length !== logs.length) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
      } catch {
        // Storage error, ignore
      }
    }
  }

  // Performance timing helpers
  public time(label: string): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    console.time(label);
  }

  public timeEnd(label: string): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`);
  }

  public measure(name: string, startMark: string, endMark?: string): void {
    if (!this.shouldLog('debug') || typeof performance === 'undefined') {
      return;
    }

    try {
      const measure = performance.measure(name, startMark, endMark);
      this.debug(`Performance measure: ${name}`, {
        duration: measure.duration,
        startTime: measure.startTime,
      });
    } catch (error) {
      this.warn('Failed to measure performance', { name, startMark, endMark, error });
    }
  }

  // Context helpers
  public createContext(context: string) {
    return {
      debug: (message: string, data?: unknown) => this.debug(message, data, context),
      info: (message: string, data?: unknown) => this.info(message, data, context),
      warn: (message: string, data?: unknown) => this.warn(message, data, context),
      error: (message: string, data?: unknown) => this.error(message, data, context),
      security: (message: string, data?: unknown) => this.security(message, data, context),
    };
  }
}

// Create global logger instance
export const logger = new Logger();

// Export context creators for specific modules
export const createModuleLogger = (moduleName: string) => logger.createContext(moduleName);

// Development helpers
if (import.meta.env.DEV) {
  // Expose logger to window for debugging
  (window as Record<string, unknown>).logger = logger;

  // Add helpful development logs
  logger.info('🚀 Synapse Application Started', {
    mode: import.meta.env.MODE,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

export default logger;
