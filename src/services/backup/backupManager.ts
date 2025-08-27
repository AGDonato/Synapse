/**
 * Sistema de Backup Automático
 * Gerencia backup de dados críticos, configurações e estado da aplicação
 */

import { env } from '../../config/env';
// import { getCacheUtils } from '../cache/adaptiveCache';
import { getErrorTrackingUtils } from '../monitoring/errorTracking';
import type { Demanda } from '../../types/entities';
import type { DocumentoDemanda } from '../../data/mockDocumentos';

export interface BackupData {
  metadata: {
    version: string;
    timestamp: string;
    environment: string;
    userId?: string;
    type: BackupType;
  };
  data: {
    demandas?: Demanda[];
    documentos?: DocumentoDemanda[];
    userSettings?: Record<string, any>;
    applicationState?: Record<string, any>;
    cacheSnapshot?: Record<string, any>;
    filterSettings?: Record<string, any>;
  };
  checksum: string;
}

export type BackupType = 'manual' | 'automatic' | 'scheduled' | 'emergency';
export type BackupScope = 'all' | 'user-data' | 'application-state' | 'cache' | 'settings';

export interface BackupOptions {
  type: BackupType;
  scope: BackupScope;
  compress?: boolean;
  encrypt?: boolean;
  includeSensitiveData?: boolean;
  maxRetentionDays?: number;
}

export interface BackupMetrics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: number;
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
    retentionCleanups: 0
  };
  private scheduledBackupTimer?: number;
  private cacheUtils = getCacheUtils();
  private errorTracking = getErrorTrackingUtils();

  private constructor() {
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

      console.log('🔄 Sistema de backup inicializado');
    } catch (error) {
      console.error('Erro ao inicializar sistema de backup:', error);
      this.errorTracking.captureError(error as Error, {
        context: 'BackupManager.initializeBackupSystem'
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
      encrypt: env.IS_PRODUCTION
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

      console.log(`✅ Backup ${backupId} criado com sucesso (${backupTime}ms)`);
      return backupId;

    } catch (error) {
      this.updateMetrics(false);
      this.errorTracking.captureError(error as Error, {
        context: 'BackupManager.createBackup',
        extra: { options }
      });
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupId: string, options: {
    scope?: BackupScope;
    validateIntegrity?: boolean;
    createRestorePoint?: boolean;
  } = {}): Promise<void> {
    try {
      // Criar ponto de restauração se solicitado
      if (options.createRestorePoint) {
        await this.createBackup({
          type: 'manual',
          scope: 'all'
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

      console.log(`✅ Backup ${backupId} restaurado com sucesso`);

    } catch (error) {
      this.errorTracking.captureError(error as Error, {
        context: 'BackupManager.restoreBackup',
        extra: { backupId, options }
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
  }): Promise<{
    id: string;
    metadata: BackupData['metadata'];
    size: number;
    location: string;
  }[]> {
    try {
      const backups = await this.getStoredBackups();
      
      let filteredBackups = backups;

      // Aplicar filtros
      if (filter?.type) {
        filteredBackups = filteredBackups.filter(backup => 
          backup.metadata.type === filter.type
        );
      }

      if (filter?.dateFrom) {
        filteredBackups = filteredBackups.filter(backup =>
          new Date(backup.metadata.timestamp) >= new Date(filter.dateFrom!)
        );
      }

      if (filter?.dateTo) {
        filteredBackups = filteredBackups.filter(backup =>
          new Date(backup.metadata.timestamp) <= new Date(filter.dateTo!)
        );
      }

      // Ordenar por data (mais recente primeiro)
      filteredBackups.sort((a, b) => 
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
        location: backup.location
      }));

    } catch (error) {
      this.errorTracking.captureError(error as Error, {
        context: 'BackupManager.listBackups'
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
          maxRetentionDays: 7
        });
      } catch (error) {
        console.error('Erro no backup automático:', error);
      }
    }, intervalMs);

    // Calcular próximo backup
    this.metrics.nextScheduledBackup = new Date(
      Date.now() + intervalMs
    ).toISOString();
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
    window.addEventListener('error', (event) => {
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
      const demandas = await this.cacheUtils.get('demandas_list') || [];
      if (demandas.length > 0) {
        data.demandas = demandas;
      }

      // Coletar documentos
      const documentos = await this.cacheUtils.get('documentos_list') || [];
      if (documentos.length > 0) {
        data.documentos = documentos;
      }

      // Configurações do usuário
      const userSettings = await this.cacheUtils.get('user_settings') || {};
      if (Object.keys(userSettings).length > 0) {
        data.userSettings = userSettings;
      }

      // Filtros salvos
      const filterSettings = await this.cacheUtils.get('saved_filters') || {};
      if (Object.keys(filterSettings).length > 0) {
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
          height: window.innerHeight
        }
      };
    }

    if (scope === 'all' || scope === 'cache') {
      // Snapshot do cache crítico
      const cacheKeys = [
        'auth_token',
        'current_user',
        'app_settings',
        'feature_flags'
      ];
      
      const cacheSnapshot: Record<string, any> = {};
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
  private async saveBackup(
    backupId: string, 
    data: string, 
    options: BackupOptions
  ): Promise<void> {
    const metadata: BackupData['metadata'] = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: env.APP_ENV,
      userId: await this.getCurrentUserId(),
      type: options.type
    };

    const backupData: BackupData = {
      metadata,
      data: JSON.parse(data),
      checksum: this.calculateChecksum(data)
    };

    // Salvar no IndexedDB
    await this.cacheUtils.set(`backup_${backupId}`, backupData, {
      persistent: true,
      ttl: Infinity
    });

    // Em produção, também enviar para servidor
    if (env.IS_PRODUCTION || env.IS_STAGING) {
      try {
        await this.uploadBackupToServer(backupId, backupData);
      } catch (error) {
        console.warn('Falha no upload do backup para servidor:', error);
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
  private async restoreBackupData(
    backupData: BackupData, 
    scope?: BackupScope
  ): Promise<void> {
    const { data } = backupData;

    if (!scope || scope === 'all' || scope === 'user-data') {
      // Restaurar demandas
      if (data.demandas) {
        await this.cacheUtils.set('demandas_list', data.demandas);
        window.dispatchEvent(new CustomEvent('backup-restored', {
          detail: { type: 'demandas', count: data.demandas.length }
        }));
      }

      // Restaurar documentos
      if (data.documentos) {
        await this.cacheUtils.set('documentos_list', data.documentos);
        window.dispatchEvent(new CustomEvent('backup-restored', {
          detail: { type: 'documentos', count: data.documentos.length }
        }));
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
    window.dispatchEvent(new CustomEvent('backup-restored', {
      detail: { backupId: backupData.metadata.timestamp, scope }
    }));
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
      hash = ((hash << 5) - hash) + char;
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
    const currentUser = await this.cacheUtils.get('current_user');
    return currentUser?.id;
  }

  private shouldCreateEmergencyBackup(): boolean {
    const lastBackup = this.metrics.lastBackupTime;
    if (!lastBackup) {return true;}
    
    const timeSinceLastBackup = Date.now() - new Date(lastBackup).getTime();
    return timeSinceLastBackup > 30 * 60 * 1000; // 30 minutos
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      'ChunkLoadError',
      'Script error',
      'Network Error',
      'SecurityError'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  private async createEmergencyBackup(): Promise<void> {
    try {
      await this.createBackup({
        type: 'emergency',
        scope: 'user-data',
        compress: true
      });
    } catch (error) {
      console.error('Falha no backup de emergência:', error);
    }
  }

  // Métodos de métricas e limpeza
  private updateMetrics(success: boolean, backupTime?: number, backupSize?: number): void {
    this.metrics.totalBackups++;
    this.metrics.lastBackupTime = new Date().toISOString();

    if (success) {
      this.metrics.successfulBackups++;
      
      if (backupTime) {
        const totalTime = this.metrics.averageBackupTime * (this.metrics.successfulBackups - 1) + backupTime;
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
    await this.cacheUtils.set('backup_metrics', this.metrics, {
      persistent: true,
      ttl: Infinity
    });
  }

  private async getStoredBackups(): Promise<any[]> {
    // Simulação - em implementação real buscaria todos os backups
    return [];
  }

  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    try {
      const backups = await this.listBackups();
      const oldBackups = backups.filter(backup => 
        new Date(backup.metadata.timestamp) < cutoffDate
      );

      for (const backup of oldBackups) {
        await this.cacheUtils.invalidate(`backup_${backup.id}`);
        this.metrics.retentionCleanups++;
      }

      if (oldBackups.length > 0) {
        console.log(`🧹 Removidos ${oldBackups.length} backups antigos`);
        this.saveMetrics();
      }
    } catch (error) {
      console.error('Erro na limpeza de backups:', error);
    }
  }

  private async uploadBackupToServer(backupId: string, backupData: BackupData): Promise<void> {
    // Implementação do upload para servidor seria aqui
    // Por exemplo, usando a API do backend PHP
    console.log(`📡 Upload do backup ${backupId} para servidor (simulado)`);
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