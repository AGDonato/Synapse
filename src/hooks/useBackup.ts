/**
 * Hook para integração com sistema de backup
 */

import { useCallback, useEffect, useState } from 'react';
import { backupManager, backupScheduler, type BackupMetrics, type BackupOptions, type BackupSchedule, type BackupScope, type BackupType } from '../services/backup';

interface BackupState {
  isBackupInProgress: boolean;
  lastBackupId?: string;
  lastBackupTime?: string;
  error?: string;
}

interface BackupListItem {
  id: string;
  type: BackupType;
  timestamp: string;
  size: number;
  environment: string;
}

export function useBackup() {
  const [backupState, setBackupState] = useState<BackupState>({
    isBackupInProgress: false
  });

  const [backupList, setBackupList] = useState<BackupListItem[]>([]);
  const [metrics, setMetrics] = useState<BackupMetrics | null>(null);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);

  /**
   * Criar backup manual
   */
  const createBackup = useCallback(async (
    options: BackupOptions = {
      type: 'manual',
      scope: 'all',
      compress: true
    }
  ): Promise<string | null> => {
    setBackupState(prev => ({ 
      ...prev, 
      isBackupInProgress: true, 
      error: undefined 
    }));

    try {
      const backupId = await backupManager.createBackup(options);
      
      setBackupState(prev => ({
        ...prev,
        isBackupInProgress: false,
        lastBackupId: backupId,
        lastBackupTime: new Date().toISOString()
      }));

      // Atualizar lista de backups
      await refreshBackupList();
      refreshMetrics();

      return backupId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setBackupState(prev => ({
        ...prev,
        isBackupInProgress: false,
        error: errorMessage
      }));

      throw error;
    }
  }, []);

  /**
   * Restaurar backup
   */
  const restoreBackup = useCallback(async (
    backupId: string,
    options: {
      scope?: BackupScope;
      createRestorePoint?: boolean;
    } = {}
  ): Promise<void> => {
    setBackupState(prev => ({ 
      ...prev, 
      isBackupInProgress: true, 
      error: undefined 
    }));

    try {
      await backupManager.restoreBackup(backupId, options);
      
      setBackupState(prev => ({
        ...prev,
        isBackupInProgress: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na restauração';
      
      setBackupState(prev => ({
        ...prev,
        isBackupInProgress: false,
        error: errorMessage
      }));

      throw error;
    }
  }, []);

  /**
   * Atualizar lista de backups
   */
  const refreshBackupList = useCallback(async (filter?: {
    type?: BackupType;
    limit?: number;
  }): Promise<void> => {
    try {
      const backups = await backupManager.listBackups(filter);
      
      const mappedBackups: BackupListItem[] = backups.map(backup => ({
        id: backup.id,
        type: backup.metadata.type,
        timestamp: backup.metadata.timestamp,
        size: backup.size,
        environment: backup.metadata.environment
      }));

      setBackupList(mappedBackups);
    } catch (error) {
      logger.error('Erro ao carregar lista de backups:', error);
      setBackupList([]);
    }
  }, []);

  /**
   * Atualizar métricas
   */
  const refreshMetrics = useCallback(() => {
    const currentMetrics = backupManager.getMetrics();
    setMetrics(currentMetrics);
  }, []);

  /**
   * Atualizar schedules
   */
  const refreshSchedules = useCallback(() => {
    const currentSchedules = backupScheduler.getSchedules();
    setSchedules(currentSchedules);
  }, []);

  /**
   * Adicionar schedule
   */
  const addSchedule = useCallback((schedule: Omit<BackupSchedule, 'runCount' | 'failureCount'>): void => {
    const newSchedule: BackupSchedule = {
      ...schedule,
      runCount: 0,
      failureCount: 0
    };

    backupScheduler.addSchedule(newSchedule);
    refreshSchedules();
  }, [refreshSchedules]);

  /**
   * Remover schedule
   */
  const removeSchedule = useCallback((scheduleId: string): boolean => {
    const result = backupScheduler.removeSchedule(scheduleId);
    if (result) {
      refreshSchedules();
    }
    return result;
  }, [refreshSchedules]);

  /**
   * Habilitar/desabilitar schedule
   */
  const toggleSchedule = useCallback((scheduleId: string, enabled: boolean): boolean => {
    const result = backupScheduler.toggleSchedule(scheduleId, enabled);
    if (result) {
      refreshSchedules();
    }
    return result;
  }, [refreshSchedules]);

  /**
   * Executar schedule manualmente
   */
  const runScheduleNow = useCallback(async (scheduleId: string): Promise<string> => {
    setBackupState(prev => ({ 
      ...prev, 
      isBackupInProgress: true, 
      error: undefined 
    }));

    try {
      const backupId = await backupScheduler.runScheduleNow(scheduleId);
      
      setBackupState(prev => ({
        ...prev,
        isBackupInProgress: false,
        lastBackupId: backupId,
        lastBackupTime: new Date().toISOString()
      }));

      await refreshBackupList();
      refreshMetrics();
      refreshSchedules();

      return backupId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na execução do schedule';
      
      setBackupState(prev => ({
        ...prev,
        isBackupInProgress: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [refreshBackupList, refreshMetrics, refreshSchedules]);

  /**
   * Obter estatísticas do scheduler
   */
  const getSchedulerStats = useCallback(() => {
    return backupScheduler.getStats();
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setBackupState(prev => ({ ...prev, error: undefined }));
  }, []);

  /**
   * Efeito para carregar dados iniciais
   */
  useEffect(() => {
    const loadInitialData = async () => {
      await refreshBackupList({ limit: 10 });
      refreshMetrics();
      refreshSchedules();
    };

    loadInitialData();
  }, [refreshBackupList, refreshMetrics, refreshSchedules]);

  /**
   * Efeito para escutar eventos de backup
   */
  useEffect(() => {
    const handleBackupRestored = (event: CustomEvent) => {
      logger.info('Backup restaurado:', event.detail);
      // Recarregar dados se necessário
      window.location.reload();
    };

    window.addEventListener('backup-restored', handleBackupRestored as EventListener);

    return () => {
      window.removeEventListener('backup-restored', handleBackupRestored as EventListener);
    };
  }, []);

  return {
    // Estado
    ...backupState,
    backupList,
    metrics,
    schedules,

    // Ações de backup
    createBackup,
    restoreBackup,
    
    // Ações de lista e métricas
    refreshBackupList,
    refreshMetrics,
    
    // Ações de scheduling
    addSchedule,
    removeSchedule,
    toggleSchedule,
    runScheduleNow,
    refreshSchedules,
    getSchedulerStats,
    
    // Utilidades
    clearError,
    
    // Helpers para templates comuns
    createQuickBackup: useCallback(() => createBackup({
      type: 'manual',
      scope: 'user-data',
      compress: true
    }), [createBackup]),
    
    createFullBackup: useCallback(() => createBackup({
      type: 'manual',
      scope: 'all',
      compress: true,
      encrypt: true
    }), [createBackup])
  };
}

/**
 * Hook simplificado apenas para status de backup
 */
export function useBackupStatus() {
  const [metrics, setMetrics] = useState<BackupMetrics | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      const currentMetrics = backupManager.getMetrics();
      setMetrics(currentMetrics);
      setLastBackup(currentMetrics.lastBackupTime || null);
    };

    // Atualizar imediatamente
    updateStatus();

    // Atualizar a cada minuto
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    lastBackup,
    hasRecentBackup: lastBackup ? Date.now() - new Date(lastBackup).getTime() < 24 * 60 * 60 * 1000 : false, // Últimas 24h
    backupHealthy: metrics ? metrics.successfulBackups > metrics.failedBackups : true
  };
}