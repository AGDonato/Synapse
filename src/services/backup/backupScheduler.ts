/**
 * AGENDADOR DE BACKUP AUTOMÁTICO - GERENCIAMENTO DE CRONOGRAMAS
 *
 * Este arquivo implementa sistema de agendamento para backups automáticos.
 * Funcionalidades:
 * - Agendamento baseado em expressões CRON
 * - Múltiplas tarefas de backup com configurações independentes
 * - Controle de concorrência para evitar sobrecarga
 * - Sistema de retry com atraso configurável
 * - Monitoramento de saúde dos agendamentos
 * - Histórico de execuções e falhas
 * - Timezone configurvel para execução correta
 *
 * Características:
 * - Singleton pattern para garantir única instância
 * - Health checks periódicos dos agendamentos
 * - Integração com sistema de error tracking
 * - Controle granular de ativação/desativação
 * - Persistência de configurações via localStorage
 *
 * Uso típico:
 * - Daily backup: '0 2 * * *' (todo dia às 2h)
 * - Weekly backup: '0 1 * * 0' (domingo à1h)
 * - Hourly backup: '0 * * * *' (a cada hora)
 */

import { env } from '../../config/env';
import { type BackupOptions, type BackupScope, backupManager } from './backupManager';
import { getErrorTrackingUtils } from '../monitoring/errorTracking';
import { logger } from '../../utils/logger';

/**
 * Interface para definição de agendamento de backup
 */
export interface BackupSchedule {
  /** Identificador único do agendamento */
  id: string;
  /** Nome descritivo do agendamento */
  name: string;
  /** Se o agendamento está ativo */
  enabled: boolean;
  /** Expressão CRON para o agendamento */
  cron: string;
  /** Opções de backup a serem aplicadas */
  options: BackupOptions;
  /** Timestamp da última execução */
  lastRun?: string;
  /** Timestamp da próxima execução prevista */
  nextRun?: string;
  /** Número total de execuções */
  runCount: number;
  /** Número de falhas registradas */
  failureCount: number;
  /** Máximo de tentativas em caso de falha */
  maxRetries: number;
}

/**
 * Configuração do agendador de backups
 */
export interface SchedulerConfig {
  /** Se o agendador está globalmente ativo */
  enabled: boolean;
  /** Timezone para cálculo dos agendamentos */
  timezone: string;
  /** Máximo de backups executando simultaneamente */
  maxConcurrentBackups: number;
  /** Atraso entre tentativas em caso de falha (ms) */
  retryDelay: number;
  /** Intervalo de verificação de saúde (ms) */
  healthCheckInterval: number;
}

/**
 * Classe principal do agendador de backups
 * Implementa singleton pattern para controle centralizado
 */
export class BackupScheduler {
  /** Instância singleton */
  private static instance: BackupScheduler;
  /** Mapa de agendamentos configurados */
  private schedules = new Map<string, BackupSchedule>();
  /** Timers ativos para cada agendamento */
  private activeTimers = new Map<string, number>();
  /** Flag indicando se o agendador está ativo */
  private isRunning = false;
  /** Configuração atual do agendador */
  private config: SchedulerConfig;
  /** Timer para health checks periódicos */
  private healthCheckTimer?: number;
  /** Utilitários de rastreamento de erros */
  private errorTracking = getErrorTrackingUtils();

  private constructor() {
    this.config = {
      enabled: env.IS_PRODUCTION || env.IS_STAGING,
      timezone: env.TIMEZONE_DEFAULT || 'America/Sao_Paulo',
      maxConcurrentBackups: env.IS_PRODUCTION ? 2 : 1,
      retryDelay: 30000, // 30 segundos
      healthCheckInterval: 60000, // 1 minuto
    };

    this.initializeDefaultSchedules();
  }

  static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  /**
   * Inicializar schedules padrão baseados no ambiente
   */
  private initializeDefaultSchedules(): void {
    if (env.IS_PRODUCTION) {
      // Backup completo diário às 2h
      this.addSchedule({
        id: 'daily-full',
        name: 'Backup Completo Diário',
        enabled: true,
        cron: '0 2 * * *',
        options: {
          type: 'scheduled',
          scope: 'all',
          compress: true,
          encrypt: true,
          maxRetentionDays: 30,
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 3,
      });

      // Backup de dados do usuário a cada 4 horas
      this.addSchedule({
        id: 'hourly-userdata',
        name: 'Backup de Dados de Usuário',
        enabled: true,
        cron: '0 */4 * * *',
        options: {
          type: 'scheduled',
          scope: 'user-data',
          compress: true,
          encrypt: false,
          maxRetentionDays: 7,
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 2,
      });
    } else if (env.IS_STAGING) {
      // Backup diário às 3h em staging
      this.addSchedule({
        id: 'staging-daily',
        name: 'Backup Diário Staging',
        enabled: true,
        cron: '0 3 * * *',
        options: {
          type: 'scheduled',
          scope: 'all',
          compress: true,
          encrypt: false,
          maxRetentionDays: 14,
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 2,
      });
    } else if (env.IS_DEVELOPMENT) {
      // Backup de desenvolvimento menos frequente
      this.addSchedule({
        id: 'dev-backup',
        name: 'Backup de Desenvolvimento',
        enabled: false, // Desabilitado por padrão
        cron: '0 12 * * 0', // Domingo ao meio-dia
        options: {
          type: 'scheduled',
          scope: 'user-data',
          compress: false,
          encrypt: false,
          maxRetentionDays: 3,
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 1,
      });
    }
  }

  /**
   * Iniciar o scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler já está executando');
      return;
    }

    if (!this.config.enabled) {
      logger.info('Scheduler de backup está desabilitado');
      return;
    }

    this.isRunning = true;

    try {
      // Carregar schedules salvos
      await this.loadSchedules();

      // Iniciar timers para cada schedule
      for (const schedule of this.schedules.values()) {
        if (schedule.enabled) {
          this.scheduleNext(schedule);
        }
      }

      // Iniciar health check
      this.startHealthCheck();

      logger.info(`🕐 Backup scheduler iniciado com ${this.schedules.size} agendamentos`);
    } catch (error) {
      this.isRunning = false;
      this.errorTracking.captureError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: 'javascript',
        severity: 'high',
        context: { module: 'BackupScheduler.start' },
      });
      throw error;
    }
  }

  /**
   * Parar o scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Limpar todos os timers
    for (const timerId of this.activeTimers.values()) {
      clearTimeout(timerId);
    }
    this.activeTimers.clear();

    // Parar health check
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    logger.info('🛑 Backup scheduler parado');
  }

  /**
   * Adicionar novo schedule
   */
  addSchedule(schedule: BackupSchedule): void {
    // Validar cron expression
    if (!this.isValidCron(schedule.cron)) {
      throw new Error(`Expressão cron inválida: ${schedule.cron}`);
    }

    // Calcular próxima execução
    schedule.nextRun = this.getNextRunTime(schedule.cron);

    this.schedules.set(schedule.id, schedule);

    // Se scheduler está rodando, agendar imediatamente
    if (this.isRunning && schedule.enabled) {
      this.scheduleNext(schedule);
    }

    this.saveSchedules();
    logger.info(`📅 Schedule '${schedule.name}' adicionado`);
  }

  /**
   * Remover schedule
   */
  removeSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return false;
    }

    // Limpar timer ativo
    const timerId = this.activeTimers.get(scheduleId);
    if (timerId) {
      clearTimeout(timerId);
      this.activeTimers.delete(scheduleId);
    }

    this.schedules.delete(scheduleId);
    this.saveSchedules();

    logger.info(`🗑️ Schedule '${schedule.name}' removido`);
    return true;
  }

  /**
   * Habilitar/desabilitar schedule
   */
  toggleSchedule(scheduleId: string, enabled: boolean): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return false;
    }

    schedule.enabled = enabled;

    if (this.isRunning) {
      if (enabled) {
        this.scheduleNext(schedule);
      } else {
        const timerId = this.activeTimers.get(scheduleId);
        if (timerId) {
          clearTimeout(timerId);
          this.activeTimers.delete(scheduleId);
        }
      }
    }

    this.saveSchedules();
    logger.info(
      `${enabled ? '✅' : '❌'} Schedule '${schedule.name}' ${enabled ? 'habilitado' : 'desabilitado'}`
    );
    return true;
  }

  /**
   * Executar schedule manualmente
   */
  async runScheduleNow(scheduleId: string): Promise<string> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} não encontrado`);
    }

    return await this.executeBackup(schedule);
  }

  /**
   * Obter todos os schedules
   */
  getSchedules(): BackupSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Obter estatísticas do scheduler
   */
  getStats(): {
    totalSchedules: number;
    enabledSchedules: number;
    activeTimers: number;
    totalRuns: number;
    totalFailures: number;
    isRunning: boolean;
  } {
    const schedules = Array.from(this.schedules.values());

    return {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter(s => s.enabled).length,
      activeTimers: this.activeTimers.size,
      totalRuns: schedules.reduce((sum, s) => sum + s.runCount, 0),
      totalFailures: schedules.reduce((sum, s) => sum + s.failureCount, 0),
      isRunning: this.isRunning,
    };
  }

  /**
   * Agendar próxima execução de um schedule
   */
  private scheduleNext(schedule: BackupSchedule): void {
    // Limpar timer anterior se existir
    const existingTimer = this.activeTimers.get(schedule.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const nextRun = this.getNextRunTime(schedule.cron);
    const delay = new Date(nextRun).getTime() - Date.now();

    if (delay > 0) {
      const timerId = window.setTimeout(async () => {
        await this.executeBackup(schedule);

        // Reagendar para próxima execução se ainda habilitado
        if (schedule.enabled && this.isRunning) {
          this.scheduleNext(schedule);
        }
      }, delay);

      this.activeTimers.set(schedule.id, timerId);
      schedule.nextRun = nextRun;

      logger.info(`⏰ Schedule '${schedule.name}' agendado para ${nextRun}`);
    }
  }

  /**
   * Executar backup de um schedule
   */
  private async executeBackup(schedule: BackupSchedule): Promise<string> {
    const startTime = Date.now();

    try {
      logger.info(`🔄 Executando backup: ${schedule.name}`);

      // Verificar limite de backups concorrentes
      const activeBackups = Array.from(this.activeTimers.values()).length;
      if (activeBackups >= this.config.maxConcurrentBackups) {
        throw new Error('Limite de backups concorrentes atingido');
      }

      // Executar backup
      const backupId = await backupManager.createBackup(schedule.options);

      // Atualizar estatísticas
      schedule.runCount++;
      schedule.lastRun = new Date().toISOString();
      schedule.failureCount = 0; // Reset failure count on success

      const duration = Date.now() - startTime;
      logger.info(`✅ Backup '${schedule.name}' concluído em ${duration}ms: ${backupId}`);

      this.saveSchedules();
      return backupId;
    } catch (error) {
      schedule.failureCount++;
      schedule.lastRun = new Date().toISOString();

      this.errorTracking.captureError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: 'javascript',
        severity: 'high',
        context: {
          module: 'BackupScheduler.executeBackup',
          scheduleId: schedule.id,
          scheduleName: schedule.name,
        },
      });

      logger.error(`❌ Falha no backup '${schedule.name}':`, error);

      // Reagendar com delay se não excedeu limite de retry
      if (schedule.failureCount < schedule.maxRetries) {
        setTimeout(() => {
          if (schedule.enabled && this.isRunning) {
            this.executeBackup(schedule);
          }
        }, this.config.retryDelay * schedule.failureCount); // Exponential backoff
      }

      this.saveSchedules();
      throw error;
    }
  }

  /**
   * Health check do scheduler
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = window.setInterval(() => {
      const now = Date.now();
      let issuesFound = 0;

      for (const [scheduleId, schedule] of this.schedules.entries()) {
        if (!schedule.enabled) {
          continue;
        }

        // Verificar se timer ainda existe
        const hasTimer = this.activeTimers.has(scheduleId);
        const nextRun = schedule.nextRun ? new Date(schedule.nextRun).getTime() : 0;
        const isOverdue = nextRun > 0 && now > nextRun + 60000; // 1 minuto de tolerância

        if (!hasTimer && !isOverdue) {
          logger.warn(`⚠️ Schedule '${schedule.name}' sem timer ativo - reagendando`);
          this.scheduleNext(schedule);
          issuesFound++;
        } else if (isOverdue) {
          logger.error(`🚨 Schedule '${schedule.name}' está atrasado - executando agora`);
          this.executeBackup(schedule).catch(error =>
            logger.error('Erro executando backup atrasado:', error)
          );
          issuesFound++;
        }
      }

      if (issuesFound === 0 && env.IS_DEVELOPMENT) {
        logger.info(`💚 Health check: ${this.schedules.size} schedules OK`);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Calcular próximo horário de execução baseado no cron
   */
  private getNextRunTime(cronExpression: string): string {
    // Implementação simplificada de cron
    // Em produção, usar biblioteca como node-cron ou cron-parser

    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) {
      throw new Error('Expressão cron deve ter 5 campos');
    }

    // Para esta implementação, suportar apenas alguns casos comuns
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const nextRun = new Date(now);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    // Casos simples
    if (minute !== '*') {
      nextRun.setMinutes(parseInt(minute));
    }

    if (hour !== '*') {
      nextRun.setHours(parseInt(hour));
    }

    // Se horário já passou hoje, mover para amanhã
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toISOString();
  }

  /**
   * Validar expressão cron (simplificado)
   */
  private isValidCron(cronExpression: string): boolean {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      return false;
    }

    // Validação básica - em produção usar parser mais robusto
    for (const part of parts) {
      if (!/^(\*|\d+|\d+-\d+|\*\/\d+)$/.test(part)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Carregar schedules salvos
   */
  private async loadSchedules(): Promise<void> {
    try {
      const savedSchedules = localStorage.getItem('backup_schedules');
      if (savedSchedules) {
        const schedules: BackupSchedule[] = JSON.parse(savedSchedules);
        for (const schedule of schedules) {
          this.schedules.set(schedule.id, schedule);
        }
        logger.info(`📥 Carregados ${schedules.length} schedules salvos`);
      }
    } catch (error) {
      logger.error('Erro ao carregar schedules:', error);
    }
  }

  /**
   * Salvar schedules
   */
  private saveSchedules(): void {
    try {
      const schedules = Array.from(this.schedules.values());
      localStorage.setItem('backup_schedules', JSON.stringify(schedules));
    } catch (error) {
      logger.error('Erro ao salvar schedules:', error);
    }
  }
}

export const backupScheduler = BackupScheduler.getInstance();
