/**
 * Agendador de Backup Automático
 * Gerencia cronogramas de backup baseados em regras configuráveis
 */

import { env } from '../../config/env';
import { backupManager, type BackupOptions, type BackupScope } from './backupManager';
import { getErrorTrackingUtils } from '../monitoring/errorTracking';

export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  cron: string; // Cron expression
  options: BackupOptions;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  failureCount: number;
  maxRetries: number;
}

export interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  maxConcurrentBackups: number;
  retryDelay: number; // milliseconds
  healthCheckInterval: number; // milliseconds
}

export class BackupScheduler {
  private static instance: BackupScheduler;
  private schedules: Map<string, BackupSchedule> = new Map();
  private activeTimers: Map<string, number> = new Map();
  private isRunning = false;
  private config: SchedulerConfig;
  private healthCheckTimer?: number;
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
          maxRetentionDays: 30
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 3
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
          maxRetentionDays: 7
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 2
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
          maxRetentionDays: 14
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 2
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
          maxRetentionDays: 3
        },
        runCount: 0,
        failureCount: 0,
        maxRetries: 1
      });
    }
  }

  /**
   * Iniciar o scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Scheduler já está executando');
      return;
    }

    if (!this.config.enabled) {
      console.log('Scheduler de backup está desabilitado');
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

      console.log(`🕐 Backup scheduler iniciado com ${this.schedules.size} agendamentos`);

    } catch (error) {
      this.isRunning = false;
      this.errorTracking.captureError(error as Error, {
        context: 'BackupScheduler.start'
      });
      throw error;
    }
  }

  /**
   * Parar o scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

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

    console.log('🛑 Backup scheduler parado');
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
    console.log(`📅 Schedule '${schedule.name}' adicionado`);
  }

  /**
   * Remover schedule
   */
  removeSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    // Limpar timer ativo
    const timerId = this.activeTimers.get(scheduleId);
    if (timerId) {
      clearTimeout(timerId);
      this.activeTimers.delete(scheduleId);
    }

    this.schedules.delete(scheduleId);
    this.saveSchedules();

    console.log(`🗑️ Schedule '${schedule.name}' removido`);
    return true;
  }

  /**
   * Habilitar/desabilitar schedule
   */
  toggleSchedule(scheduleId: string, enabled: boolean): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

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
    console.log(`${enabled ? '✅' : '❌'} Schedule '${schedule.name}' ${enabled ? 'habilitado' : 'desabilitado'}`);
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
      isRunning: this.isRunning
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
      
      console.log(`⏰ Schedule '${schedule.name}' agendado para ${nextRun}`);
    }
  }

  /**
   * Executar backup de um schedule
   */
  private async executeBackup(schedule: BackupSchedule): Promise<string> {
    const startTime = Date.now();

    try {
      console.log(`🔄 Executando backup: ${schedule.name}`);

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
      console.log(`✅ Backup '${schedule.name}' concluído em ${duration}ms: ${backupId}`);

      this.saveSchedules();
      return backupId;

    } catch (error) {
      schedule.failureCount++;
      schedule.lastRun = new Date().toISOString();

      this.errorTracking.captureError(error as Error, {
        context: 'BackupScheduler.executeBackup',
        extra: { scheduleId: schedule.id, scheduleName: schedule.name }
      });

      console.error(`❌ Falha no backup '${schedule.name}':`, error);

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
        if (!schedule.enabled) continue;

        // Verificar se timer ainda existe
        const hasTimer = this.activeTimers.has(scheduleId);
        const nextRun = schedule.nextRun ? new Date(schedule.nextRun).getTime() : 0;
        const isOverdue = nextRun > 0 && now > nextRun + 60000; // 1 minuto de tolerância

        if (!hasTimer && !isOverdue) {
          console.warn(`⚠️ Schedule '${schedule.name}' sem timer ativo - reagendando`);
          this.scheduleNext(schedule);
          issuesFound++;
        } else if (isOverdue) {
          console.error(`🚨 Schedule '${schedule.name}' está atrasado - executando agora`);
          this.executeBackup(schedule).catch(console.error);
          issuesFound++;
        }
      }

      if (issuesFound === 0 && env.IS_DEVELOPMENT) {
        console.log(`💚 Health check: ${this.schedules.size} schedules OK`);
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

    let nextRun = new Date(now);
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
    if (parts.length !== 5) return false;

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
        console.log(`📥 Carregados ${schedules.length} schedules salvos`);
      }
    } catch (error) {
      console.error('Erro ao carregar schedules:', error);
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
      console.error('Erro ao salvar schedules:', error);
    }
  }
}

export const backupScheduler = BackupScheduler.getInstance();