/**
 * SISTEMA DE LOGGING CENTRALIZADO E AVANÇADO
 *
 * Este módulo fornece um sistema completo de logging que substitui console.log
 * por uma solução mais robusta e controlada. Inclui funcionalidades para:
 * - Diferentes níveis de log (debug, info, warn, error, security)
 * - Armazenamento local e remoto de logs
 * - Rastreamento de usuários e sessões
 * - Monitoramento de performance e tarefas longas
 * - Captura automática de erros globais
 * - Exportação e limpeza automática de logs
 * - Contextos específicos por módulo
 * - Configuração flexível para desenvolvimento e produção
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

  /**
   * Inicializa o logger com configuração personalizada
   * @param config - Configuração parcial do logger
   */
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

  /**
   * Gera um identificador único para a sessão atual
   * @returns ID da sessão baseado em timestamp e string aleatória
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa o sistema de logging com captura de erros globais
   * Configura listeners para erros não tratados e monitoramento de performance
   */
  private initializeLogger(): void {
    // Configuração de captura de erros globais
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
        this.error('Rejeição de Promise Não Tratada', {
          reason: event.reason,
          promise: event.promise,
        });
      });

      // Monitoramento de performance
      if ('performance' in window && this.config.level === 'debug') {
        this.setupPerformanceMonitoring();
      }
    }

    // Limpeza periódica de logs antigos
    this.cleanOldLogs();
  }

  /**
   * Configura monitoramento de performance para detectar tarefas lentas
   * Registra tasks que demoram mais de 50ms para execução
   */
  private setupPerformanceMonitoring(): void {
    // Monitora tarefas longas
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) {
              // Tarefas que demoram mais de 50ms
              this.warn('Tarefa Longa Detectada', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver não suportado
      }
    }
  }

  /**
   * Verifica se uma mensagem deve ser registrada baseado no nível configurado
   * @param level - Nível da mensagem
   * @returns true se deve ser registrada
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return this.levels[level] >= this.levels[this.config.level];
  }

  /**
   * Cria uma entrada de log com todas as informações necessárias
   * @param level - Nível do log
   * @param message - Mensagem principal
   * @param data - Dados adicionais opcionais
   * @param context - Contexto/módulo da mensagem
   * @returns Entrada de log completa
   */
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

    // Adiciona informações do usuário se habilitado
    if (this.config.enableUserTracking && typeof window !== 'undefined') {
      const user = this.getCurrentUser();
      if (user) {
        entry.userId = user;
      }
    }

    return entry;
  }

  /**
   * Obtém identificação do usuário atual de várias fontes possíveis
   * @returns ID do usuário ou undefined se não encontrado
   */
  private getCurrentUser(): string | undefined {
    // Tenta obter usuário de várias fontes
    try {
      // Do localStorage
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.id || parsed.email || parsed.username;
      }

      // Do sessionStorage
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        return parsed.id || parsed.email || parsed.username;
      }
    } catch {
      // Ignora erros
    }

    return undefined;
  }

  /**
   * Registra mensagem no console do navegador com formatação colorida
   * @param entry - Entrada de log a ser exibida
   */
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

    // Adiciona stack trace para erros em desenvolvimento
    if (entry.level === 'error' && this.config.enableStackTrace) {
      console.trace();
    }
  }

  /**
   * Obtém estilo CSS para colorir mensagens no console
   * @param level - Nível do log
   * @returns String com estilo CSS
   */
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

  /**
   * Obtém método apropriado do console para cada nível
   * @param level - Nível do log
   * @returns Função do console correspondente
   */
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

  /**
   * Armazena entrada de log no localStorage do navegador
   * Mantém apenas as entradas mais recentes para evitar estouro de memória
   * @param entry - Entrada de log a ser armazenada
   */
  private logToStorage(entry: LogEntry): void {
    if (!this.config.storage || typeof window === 'undefined') {
      return;
    }

    try {
      const existingLogs = this.getStoredLogs();
      const updatedLogs = [...existingLogs, entry];

      // Mantém apenas logs recentes
      if (updatedLogs.length > this.config.maxStorageEntries) {
        updatedLogs.splice(0, updatedLogs.length - this.config.maxStorageEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(updatedLogs));
    } catch (error) {
      // Storage pode estar cheio ou indisponível
      console.warn('Failed to store log entry:', error);
    }
  }

  /**
   * Envia entrada de log para servidor remoto
   * Em caso de falha, armazena localmente como fallback
   * @param entry - Entrada de log a ser enviada
   */
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
      // Logging remoto falhou, armazena localmente como fallback
      this.logToStorage(entry);
    }
  }

  /**
   * Método principal de logging que distribui a mensagem para todos os destinos
   * @param level - Nível do log
   * @param message - Mensagem principal
   * @param data - Dados adicionais opcionais
   * @param context - Contexto/módulo da mensagem
   */
  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, data, context);

    // Registra no console
    this.logToConsole(entry);

    // Registra no armazenamento local
    this.logToStorage(entry);

    // Registra no endpoint remoto
    if (this.config.remote) {
      this.logToRemote(entry).catch(() => {
        // Falha silenciosa para logging remoto
      });
    }
  }

  // Métodos públicos de logging
  /**
   * Registra mensagem de debug (apenas em desenvolvimento)
   * @param message - Mensagem de debug
   * @param data - Dados adicionais opcionais
   * @param context - Contexto da mensagem
   */
  public debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  /**
   * Registra mensagem informativa
   * @param message - Mensagem informativa
   * @param data - Dados adicionais opcionais
   * @param context - Contexto da mensagem
   */
  public info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  /**
   * Registra mensagem de aviso
   * @param message - Mensagem de aviso
   * @param data - Dados adicionais opcionais
   * @param context - Contexto da mensagem
   */
  public warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  /**
   * Registra mensagem de erro
   * @param message - Mensagem de erro
   * @param data - Dados adicionais opcionais
   * @param context - Contexto da mensagem
   */
  public error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  /**
   * Registra mensagem relacionada à segurança (alta prioridade)
   * @param message - Mensagem de segurança
   * @param data - Dados adicionais opcionais
   * @param context - Contexto da mensagem
   */
  public security(message: string, data?: unknown, context?: string): void {
    this.log('security', message, data, context);
  }

  // Métodos utilitários
  /**
   * Recupera todos os logs armazenados localmente
   * @returns Array com todas as entradas de log armazenadas
   */
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

  /**
   * Remove todos os logs armazenados localmente
   */
  public clearStoredLogs(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Exporta todos os logs em formato JSON para download
   * @returns String JSON com todos os logs formatados
   */
  public exportLogs(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Define o nível mínimo de logs a serem registrados
   * @param level - Novo nível mínimo de logging
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Atualiza a configuração do logger
   * @param config - Configuração parcial a ser mesclada
   */
  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Remove automaticamente logs mais antigos que 7 dias
   * Executa limpeza para manter o armazenamento otimizado
   */
  private cleanOldLogs(): void {
    // Limpa logs mais antigos que 7 dias
    const logs = this.getStoredLogs();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > sevenDaysAgo);

    if (recentLogs.length !== logs.length) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
      } catch {
        // Erro de armazenamento, ignora
      }
    }
  }

  // Métodos auxiliares para medição de performance
  /**
   * Inicia um timer de performance com label específico
   * @param label - Rótulo do timer para identificação
   */
  public time(label: string): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    console.time(label);
  }

  /**
   * Finaliza um timer de performance e registra o resultado
   * @param label - Rótulo do timer a ser finalizado
   */
  public timeEnd(label: string): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`);
  }

  /**
   * Cria uma medição de performance entre dois pontos
   * @param name - Nome da medição
   * @param startMark - Marca inicial da medição
   * @param endMark - Marca final da medição (opcional)
   */
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

  // Métodos auxiliares para contexto
  /**
   * Cria um logger com contexto específico para um módulo
   * @param context - Nome do contexto/módulo
   * @returns Objeto com métodos de log pré-configurados com contexto
   */
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

// Cria instância global do logger
export const logger = new Logger();

// Exporta criadores de contexto para módulos específicos
export const createModuleLogger = (moduleName: string) => logger.createContext(moduleName);

// Auxiliares para desenvolvimento
if (import.meta.env.DEV) {
  // Expõe logger na window para debug
  (window as unknown as Record<string, unknown>).logger = logger;

  // Adiciona logs úteis para desenvolvimento
  logger.info('🚀 Synapse Application Started', {
    mode: import.meta.env.MODE,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

export default logger;
