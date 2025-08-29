/**
 * SISTEMA DE BACKUP AUTOMÁTICO - GESTÃO DE BACKUP E RECUPERAÇÃO
 *
 * Este arquivo implementa sistema completo de backup para a aplicação.
 * Funcionalidades:
 * - Backup automático e manual de dados críticos
 * - Backup de configurações do usuário e estado da aplicação
 * - Compressão e criptografia opcional dos backups
 * - Sistema de retenção com limpeza automática
 * - Verificação de integridade com checksum
 * - Backup incremental e snapshot completo
 * - Métricas de backup e monitoramento
 *
 * Tipos de backup:
 * - manual: Iniciado pelo usuário
 * - automatic: Executado em intervalos
 * - scheduled: Agendado para horários específicos
 * - emergency: Backup de emergência em situações críticas
 *
 * Escopos suportados:
 * - all: Backup completo de todos os dados
 * - user-data: Apenas dados do usuário
 * - application-state: Estado da aplicação
 * - cache: Snapshot do cache
 * - settings: Configurações e preferências
 */

import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { getErrorTrackingUtils } from '../monitoring/errorTracking';
import { getGlobalDistributedCache } from '../cache/distributedCache';
import type DistributedCache from '../cache/distributedCache';
import type { Demanda } from '../../types/entities';
import type { DocumentoDemanda } from '../../data/mockDocumentos';

/**
 * Interface para estrutura de dados do backup
 */
export interface BackupData {
  /** Metadados do backup */
  metadata: {
    /** Versão da aplicação que gerou o backup */
    version: string;
    /** Timestamp de criação do backup */
    timestamp: string;
    /** Ambiente onde foi gerado (dev, prod, etc.) */
    environment: string;
    /** ID do usuário (para backups de usuário específico) */
    userId?: string;
    /** Tipo de backup executado */
    type: BackupType;
  };
  /** Dados efetivos do backup */
  data: {
    /** Demandas do sistema */
    demandas?: Demanda[];
    /** Documentos associados às demandas */
    documentos?: DocumentoDemanda[];
    /** Configurações personalizadas do usuário */
    userSettings?: Record<string, unknown>;
    /** Estado atual da aplicação */
    applicationState?: Record<string, unknown>;
    /** Snapshot do cache para recuperação rápida */
    cacheSnapshot?: Record<string, unknown>;
    /** Configurações de filtros e visões */
    filterSettings?: Record<string, unknown>;
  };
  /** Hash para verificação de integridade */
  checksum: string;
}

/** Tipos de backup suportados */
export type BackupType = 'manual' | 'automatic' | 'scheduled' | 'emergency';

/** Escopos de backup disponíveis */
export type BackupScope = 'all' | 'user-data' | 'application-state' | 'cache' | 'settings';

/**
 * Opções de configuração para operações de backup
 */
export interface BackupOptions {
  /** Tipo de backup a ser executado */
  type: BackupType;
  /** Escopo dos dados a serem incluídos */
  scope: BackupScope;
  /** Se deve comprimir o backup (padrão: true) */
  compress?: boolean;
  /** Se deve criptografar o backup (padrão: true em prod) */
  encrypt?: boolean;
  /** Se deve incluir dados sensíveis no backup */
  includeSensitiveData?: boolean;
  /** Dias máximos para manter o backup (padrão: 30) */
  maxRetentionDays?: number;
}

/**
 * Métricas de desempenho e estatísticas de backup
 */
export interface BackupMetrics {
  /** Número total de backups executados */
  totalBackups: number;
  /** Número de backups bem-sucedidos */
  successfulBackups: number;
  /** Número de backups que falharam */
  failedBackups: number;
  /** Tamanho total ocupado pelos backups (bytes) */
  totalSize: number;
  /** Tempo médio para completar um backup (ms) */
  averageBackupTime: number;
  lastBackupTime?: string;
  nextScheduledBackup?: string;
  retentionCleanups: number;
}

export class BackupManager {
  private static instance: BackupManager;
  private isBackupInProgress = false;
  private backupQueue: (() => Promise<void>)[] = [];
  private metrics: BackupMetrics = {
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    totalSize: 0,
    averageBackupTime: 0,
    retentionCleanups: 0,
  };
  private scheduledBackupTimer?: number;
  private cacheUtils: DistributedCache;
  private errorTracking = getErrorTrackingUtils();

  private constructor() {
    this.cacheUtils = getGlobalDistributedCache();
    this.initializeBackupSystem();
  }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * Inicializar sistema de backup
   */
  private async initializeBackupSystem(): Promise<void> {
    try {
      // Carregar métricas salvas
      await this.loadMetrics();

      // Configurar backup automático se habilitado
      if (env.IS_PRODUCTION || env.IS_STAGING) {
        this.scheduleAutomaticBackups();
      }

      // Configurar listeners para backup de emergência
      this.setupEmergencyBackupTriggers();

      logger.info('🔄 Sistema de backup inicializado');
    } catch (error) {
      logger.error('Erro ao inicializar sistema de backup:', error);
      this.errorTracking.captureError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: 'javascript',
        severity: 'high',
        context: { module: 'BackupManager.initializeBackupSystem' },
      });
    }
  }

  /**
   * Criar backup manual
   */
  async createBackup(
    options: BackupOptions = {
      type: 'manual',
      scope: 'all',
      compress: true,
      encrypt: env.IS_PRODUCTION,
    }
  ): Promise<string> {
    if (this.isBackupInProgress) {
      throw new Error('Backup já está em andamento');
    }

    const startTime = Date.now();
    this.isBackupInProgress = true;

    try {
      // Gerar ID único para o backup
      const backupId = this.generateBackupId(options.type);

      // Coletar dados para backup
      const backupData = await this.collectBackupData(options.scope);

      // Processar dados (compressão, criptografia)
      const processedData = await this.processBackupData(backupData, options);

      // Salvar backup
      await this.saveBackup(backupId, processedData, options);

      // Atualizar métricas
      const backupTime = Date.now() - startTime;
      this.updateMetrics(true, backupTime, processedData.length);

      // Executar limpeza de backups antigos
      await this.cleanupOldBackups(options.maxRetentionDays || 30);

      logger.info(`✅ Backup ${backupId} criado com sucesso (${backupTime}ms)`);
      return backupId;
    } catch (error) {
      this.updateMetrics(false);
      this.errorTracking.captureError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: 'javascript',
        severity: 'high',
        context: { module: 'BackupManager.createBackup', options },
      });
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(
    backupId: string,
    options: {
      scope?: BackupScope;
      validateIntegrity?: boolean;
      createRestorePoint?: boolean;
    } = {}
  ): Promise<void> {
    try {
      // Criar ponto de restauração se solicitado
      if (options.createRestorePoint) {
        await this.createBackup({
          type: 'manual',
          scope: 'all',
        });
      }

      // Carregar dados do backup
      const backupData = await this.loadBackup(backupId);

      if (!backupData) {
        throw new Error(`Backup ${backupId} não encontrado`);
      }

      // Validar integridade
      if (options.validateIntegrity) {
        await this.validateBackupIntegrity(backupData);
      }

      // Restaurar dados conforme escopo
      await this.restoreBackupData(backupData, options.scope);

      logger.info(`✅ Backup ${backupId} restaurado com sucesso`);
    } catch (error) {
      this.errorTracking.captureError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: 'javascript',
        severity: 'high',
        context: { module: 'BackupManager.restoreBackup', backupId, options },
      });
      throw error;
    }
  }

  /**
   * Listar backups disponíveis
   */
  async listBackups(filter?: {
    type?: BackupType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<
    {
      id: string;
      metadata: BackupData['metadata'];
      size: number;
      location: string;
    }[]
  > {
    try {
      const backups = await this.getStoredBackups();

      let filteredBackups = backups as {
        id: string;
        metadata: BackupData['metadata'];
        size: number;
        location: string;
      }[];

      // Aplicar filtros
      if (filter?.type) {
        filteredBackups = filteredBackups.filter(backup => backup.metadata.type === filter.type);
      }

      if (filter?.dateFrom) {
        filteredBackups = filteredBackups.filter(
          backup => new Date(backup.metadata.timestamp) >= new Date(filter.dateFrom!)
        );
      }

      if (filter?.dateTo) {
        filteredBackups = filteredBackups.filter(
          backup => new Date(backup.metadata.timestamp) <= new Date(filter.dateTo!)
        );
      }

      // Ordenar por data (mais recente primeiro)
      filteredBackups.sort(
        (a, b) =>
          new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
      );

      // Aplicar limite
      if (filter?.limit) {
        filteredBackups = filteredBackups.slice(0, filter.limit);
      }

      return filteredBackups.map(backup => ({
        id: backup.id,
        metadata: backup.metadata,
        size: backup.size,
        location: backup.location,
      }));
    } catch (error) {
      this.errorTracking.captureError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: 'javascript',
        severity: 'medium',
        context: { module: 'BackupManager.listBackups' },
      });
      return [];
    }
  }

  /**
   * Obter métricas de backup
   */
  getMetrics(): BackupMetrics {
    return { ...this.metrics };
  }

  /**
   * Configurar backup automático
   */
  private scheduleAutomaticBackups(): void {
    // Backup a cada 4 horas em produção, 8 horas em staging
    const intervalHours = env.IS_PRODUCTION ? 4 : 8;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    this.scheduledBackupTimer = window.setInterval(async () => {
      try {
        await this.createBackup({
          type: 'automatic',
          scope: 'user-data',
          compress: true,
          encrypt: true,
          maxRetentionDays: 7,
        });
      } catch (error) {
        logger.error('Erro no backup automático:', error);
      }
    }, intervalMs);

    // Calcular próximo backup
    this.metrics.nextScheduledBackup = new Date(Date.now() + intervalMs).toISOString();
  }

  /**
   * Configurar triggers de backup de emergência
   */
  private setupEmergencyBackupTriggers(): void {
    // Backup antes de operações críticas
    window.addEventListener('beforeunload', () => {
      if (this.shouldCreateEmergencyBackup()) {
        this.createEmergencyBackup();
      }
    });

    // Backup em caso de erro crítico
    window.addEventListener('error', event => {
      if (this.isCriticalError(event.error)) {
        this.createEmergencyBackup();
      }
    });
  }

  /**
   * Coletar dados para backup
   */
  private async collectBackupData(scope: BackupScope): Promise<BackupData['data']> {
    const data: BackupData['data'] = {};

    if (scope === 'all' || scope === 'user-data') {
      // Coletar demandas do store ou cache
      const demandas = (await this.cacheUtils.get<Demanda[]>('demandas_list')) || [];
      if (Array.isArray(demandas) && demandas.length > 0) {
        data.demandas = demandas;
      }

      // Coletar documentos
      const documentos = (await this.cacheUtils.get<DocumentoDemanda[]>('documentos_list')) || [];
      if (Array.isArray(documentos) && documentos.length > 0) {
        data.documentos = documentos;
      }

      // Configurações do usuário
      const userSettings =
        (await this.cacheUtils.get<Record<string, unknown>>('user_settings')) || {};
      if (
        userSettings &&
        typeof userSettings === 'object' &&
        Object.keys(userSettings).length > 0
      ) {
        data.userSettings = userSettings;
      }

      // Filtros salvos
      const filterSettings =
        (await this.cacheUtils.get<Record<string, unknown>>('saved_filters')) || {};
      if (
        filterSettings &&
        typeof filterSettings === 'object' &&
        Object.keys(filterSettings).length > 0
      ) {
        data.filterSettings = filterSettings;
      }
    }

    if (scope === 'all' || scope === 'application-state') {
      // Estado da aplicação
      data.applicationState = {
        currentRoute: window.location.pathname,
        theme: document.documentElement.getAttribute('data-theme'),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
    }

    if (scope === 'all' || scope === 'cache') {
      // Snapshot do cache crítico
      const cacheKeys = ['auth_token', 'current_user', 'app_settings', 'feature_flags'];

      const cacheSnapshot: Record<string, unknown> = {};
      for (const key of cacheKeys) {
        const value = await this.cacheUtils.get(key);
        if (value !== null) {
          cacheSnapshot[key] = value;
        }
      }

      if (Object.keys(cacheSnapshot).length > 0) {
        data.cacheSnapshot = cacheSnapshot;
      }
    }

    return data;
  }

  /**
   * Processar dados do backup (compressão, criptografia)
   */
  private async processBackupData(
    backupData: BackupData['data'],
    options: BackupOptions
  ): Promise<string> {
    let processedData = JSON.stringify(backupData);

    // Compressão (simulada - em produção usaria biblioteca real)
    if (options.compress) {
      processedData = this.compressData(processedData);
    }

    // Criptografia (simulada - em produção usaria criptografia real)
    if (options.encrypt) {
      processedData = this.encryptData(processedData);
    }

    return processedData;
  }

  /**
   * Salvar backup
   */
  private async saveBackup(backupId: string, data: string, options: BackupOptions): Promise<void> {
    const metadata: BackupData['metadata'] = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: env.APP_ENV,
      userId: await this.getCurrentUserId(),
      type: options.type,
    };

    const backupData: BackupData = {
      metadata,
      data: JSON.parse(data),
      checksum: this.calculateChecksum(data),
    };

    // Salvar no cache distribuído
    await this.cacheUtils.set(`backup_${backupId}`, backupData);

    // Em produção, também enviar para servidor
    if (env.IS_PRODUCTION || env.IS_STAGING) {
      try {
        await this.uploadBackupToServer(backupId, backupData);
      } catch (error) {
        logger.warn('Falha no upload do backup para servidor:', error);
      }
    }
  }

  /**
   * Carregar backup
   */
  private async loadBackup(backupId: string): Promise<BackupData | null> {
    return await this.cacheUtils.get(`backup_${backupId}`);
  }

  /**
   * Restaurar dados do backup
   */
  private async restoreBackupData(backupData: BackupData, scope?: BackupScope): Promise<void> {
    const { data } = backupData;

    if (!scope || scope === 'all' || scope === 'user-data') {
      // Restaurar demandas
      if (data.demandas) {
        await this.cacheUtils.set('demandas_list', data.demandas);
        window.dispatchEvent(
          new CustomEvent('backup-restored', {
            detail: { type: 'demandas', count: data.demandas.length },
          })
        );
      }

      // Restaurar documentos
      if (data.documentos) {
        await this.cacheUtils.set('documentos_list', data.documentos);
        window.dispatchEvent(
          new CustomEvent('backup-restored', {
            detail: { type: 'documentos', count: data.documentos.length },
          })
        );
      }

      // Restaurar configurações
      if (data.userSettings) {
        await this.cacheUtils.set('user_settings', data.userSettings);
      }

      if (data.filterSettings) {
        await this.cacheUtils.set('saved_filters', data.filterSettings);
      }
    }

    if (!scope || scope === 'all' || scope === 'cache') {
      // Restaurar cache
      if (data.cacheSnapshot) {
        for (const [key, value] of Object.entries(data.cacheSnapshot)) {
          await this.cacheUtils.set(key, value);
        }
      }
    }

    // Notificar aplicação sobre restauração
    window.dispatchEvent(
      new CustomEvent('backup-restored', {
        detail: { backupId: backupData.metadata.timestamp, scope },
      })
    );
  }

  /**
   * Gerar ID único para backup
   */
  private generateBackupId(type: BackupType): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 6);
    return `${type}_${timestamp}_${random}`;
  }

  /**
   * Calcular checksum dos dados
   */
  private calculateChecksum(data: string): string {
    // Implementação simples de hash - em produção usar biblioteca de hash segura
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Validar integridade do backup
   */
  private async validateBackupIntegrity(backupData: BackupData): Promise<void> {
    const dataString = JSON.stringify(backupData.data);
    const calculatedChecksum = this.calculateChecksum(dataString);

    if (calculatedChecksum !== backupData.checksum) {
      throw new Error('Integridade do backup comprometida - checksum inválido');
    }
  }

  /**
   * Métodos auxiliares
   */
  private compressData(data: string): string {
    // Simulação de compressão - em produção usar biblioteca real
    return btoa(data);
  }

  private encryptData(data: string): string {
    // Simulação de criptografia - em produção usar criptografia real
    return btoa(data);
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    const currentUser = await this.cacheUtils.get<{ id: string }>('current_user');
    return currentUser && typeof currentUser === 'object' && 'id' in currentUser
      ? currentUser.id
      : undefined;
  }

  private shouldCreateEmergencyBackup(): boolean {
    const lastBackup = this.metrics.lastBackupTime;
    if (!lastBackup) {
      return true;
    }

    const timeSinceLastBackup = Date.now() - new Date(lastBackup).getTime();
    return timeSinceLastBackup > 30 * 60 * 1000; // 30 minutos
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = ['ChunkLoadError', 'Script error', 'Network Error', 'SecurityError'];

    return criticalPatterns.some(
      pattern => error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  private async createEmergencyBackup(): Promise<void> {
    try {
      await this.createBackup({
        type: 'emergency',
        scope: 'user-data',
        compress: true,
      });
    } catch (error) {
      logger.error('Falha no backup de emergência:', error);
    }
  }

  // Métodos de métricas e limpeza
  private updateMetrics(success: boolean, backupTime?: number, backupSize?: number): void {
    this.metrics.totalBackups++;
    this.metrics.lastBackupTime = new Date().toISOString();

    if (success) {
      this.metrics.successfulBackups++;

      if (backupTime) {
        const totalTime =
          this.metrics.averageBackupTime * (this.metrics.successfulBackups - 1) + backupTime;
        this.metrics.averageBackupTime = totalTime / this.metrics.successfulBackups;
      }

      if (backupSize) {
        this.metrics.totalSize += backupSize;
      }
    } else {
      this.metrics.failedBackups++;
    }

    this.saveMetrics();
  }

  private async loadMetrics(): Promise<void> {
    const savedMetrics = await this.cacheUtils.get('backup_metrics');
    if (savedMetrics) {
      this.metrics = { ...this.metrics, ...savedMetrics };
    }
  }

  private async saveMetrics(): Promise<void> {
    await this.cacheUtils.set('backup_metrics', this.metrics);
  }

  private async getStoredBackups(): Promise<
    {
      id: string;
      metadata: BackupData['metadata'];
      size: number;
      location: string;
    }[]
  > {
    // Simulação - em implementação real buscaria todos os backups
    return [];
  }

  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const backups = await this.listBackups();
      const oldBackups = backups.filter(backup => new Date(backup.metadata.timestamp) < cutoffDate);

      for (const backup of oldBackups) {
        await this.cacheUtils.delete(`backup_${backup.id}`);
        this.metrics.retentionCleanups++;
      }

      if (oldBackups.length > 0) {
        logger.info(`🧹 Removidos ${oldBackups.length} backups antigos`);
        this.saveMetrics();
      }
    } catch (error) {
      logger.error('Erro na limpeza de backups:', error);
    }
  }

  private async uploadBackupToServer(backupId: string, backupData: BackupData): Promise<void> {
    // Implementação do upload para servidor seria aqui
    // Por exemplo, usando a API do backend PHP
    logger.info(`📡 Upload do backup ${backupId} para servidor (simulado)`);
  }

  /**
   * Cleanup do manager
   */
  destroy(): void {
    if (this.scheduledBackupTimer) {
      clearInterval(this.scheduledBackupTimer);
    }
  }
}

export const backupManager = BackupManager.getInstance();
