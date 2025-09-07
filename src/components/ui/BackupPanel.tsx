import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Download,
  HardDrive,
  RotateCcw,
  Settings,
  Shield,
  Upload,
  User,
  XCircle,
} from 'lucide-react';
import { useBackup } from '../../hooks/useBackup';
import type { BackupScope, BackupType } from '../../services/backup';
import { createModuleLogger } from '../../utils/logger';
import styles from './BackupPanel.module.css';

const logger = createModuleLogger('BackupPanel');

interface BackupPanelProps {
  onClose?: () => void;
}

export const BackupPanel: React.FC<BackupPanelProps> = ({ onClose }) => {
  const {
    isBackupInProgress,
    error,
    backupList,
    metrics,
    schedules,
    createBackup,
    restoreBackup,
    createQuickBackup,
    createFullBackup,
    refreshBackupList,
    clearError,
    getSchedulerStats,
  } = useBackup();

  const [selectedScope, setSelectedScope] = useState<BackupScope>('user-data');
  const [showSchedules, setShowSchedules] = useState(false);
  const [showRestore, setShowRestore] = useState(false);

  const handleCreateBackup = async () => {
    try {
      clearError();
      await createBackup({
        type: 'manual',
        scope: selectedScope,
        compress: true,
        encrypt: selectedScope === 'all',
      });
    } catch (error) {
      logger.error('Erro ao criar backup:', error);
    }
  };

  const handleQuickActions = {
    quickBackup: () => createQuickBackup(),
    fullBackup: () => createFullBackup(),
    refreshList: () => refreshBackupList(),
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (
      !confirm(
        'Tem certeza que deseja restaurar este backup? Esta ação irá substituir os dados atuais.'
      )
    ) {
      return;
    }

    try {
      clearError();
      await restoreBackup(backupId, {
        scope: 'all',
        createRestorePoint: true,
      });
    } catch (error) {
      logger.error('Erro ao restaurar backup:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDateTime = (isoString: string): string => {
    return new Date(isoString).toLocaleString('pt-BR');
  };

  const getBackupTypeIcon = (type: BackupType) => {
    switch (type) {
      case 'manual':
        return <User size={16} />;
      case 'automatic':
        return <RotateCcw size={16} />;
      case 'scheduled':
        return <Clock size={16} />;
      case 'emergency':
        return <AlertTriangle size={16} />;
      default:
        return <Database size={16} />;
    }
  };

  const getScopeIcon = (scope: BackupScope) => {
    switch (scope) {
      case 'all':
        return <Database size={16} />;
      case 'user-data':
        return <User size={16} />;
      case 'application-state':
        return <Cpu size={16} />;
      case 'cache':
        return <HardDrive size={16} />;
      case 'settings':
        return <Settings size={16} />;
      default:
        return <Database size={16} />;
    }
  };

  const schedulerStats = getSchedulerStats();

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <Shield size={24} />
          <h2>Sistema de Backup</h2>
        </div>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} aria-label='Fechar'>
            <XCircle size={20} />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={clearError} className={styles.clearErrorButton}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {metrics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Database size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{metrics.totalBackups}</span>
              <span className={styles.statLabel}>Total de Backups</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <CheckCircle size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{metrics.successfulBackups}</span>
              <span className={styles.statLabel}>Sucessos</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <HardDrive size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatFileSize(metrics.totalSize)}</span>
              <span className={styles.statLabel}>Tamanho Total</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Clock size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {metrics.lastBackupTime ? formatDateTime(metrics.lastBackupTime) : 'Nenhum'}
              </span>
              <span className={styles.statLabel}>Último Backup</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${!showSchedules && !showRestore ? styles.active : ''}`}
          onClick={() => {
            setShowSchedules(false);
            setShowRestore(false);
          }}
        >
          <Download size={16} />
          Criar Backup
        </button>

        <button
          className={`${styles.tab} ${showRestore ? styles.active : ''}`}
          onClick={() => {
            setShowRestore(true);
            setShowSchedules(false);
          }}
        >
          <Upload size={16} />
          Restaurar
        </button>

        <button
          className={`${styles.tab} ${showSchedules ? styles.active : ''}`}
          onClick={() => {
            setShowSchedules(true);
            setShowRestore(false);
          }}
        >
          <Calendar size={16} />
          Agendamentos
        </button>
      </div>

      {/* Create Backup Tab */}
      {!showSchedules && !showRestore && (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <h3>Ações Rápidas</h3>
            <div className={styles.quickActions}>
              <button
                className={styles.quickButton}
                onClick={handleQuickActions.quickBackup}
                disabled={isBackupInProgress}
              >
                <User size={16} />
                Backup Rápido
                <span className={styles.quickButtonDesc}>Dados do usuário</span>
              </button>

              <button
                className={styles.quickButton}
                onClick={handleQuickActions.fullBackup}
                disabled={isBackupInProgress}
              >
                <Database size={16} />
                Backup Completo
                <span className={styles.quickButtonDesc}>Todos os dados</span>
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Backup Personalizado</h3>
            <div className={styles.customBackup}>
              <div className={styles.formGroup}>
                <label htmlFor='scope-select'>Escopo do Backup:</label>
                <select
                  id='scope-select'
                  value={selectedScope}
                  onChange={e => setSelectedScope(e.target.value as BackupScope)}
                  className={styles.select}
                >
                  <option value='all'>Todos os dados</option>
                  <option value='user-data'>Dados do usuário</option>
                  <option value='application-state'>Estado da aplicação</option>
                  <option value='cache'>Cache</option>
                  <option value='settings'>Configurações</option>
                </select>
              </div>

              <button
                className={styles.createButton}
                onClick={handleCreateBackup}
                disabled={isBackupInProgress}
              >
                {isBackupInProgress ? (
                  <>
                    <RotateCcw size={16} className={styles.spinning} />
                    Criando Backup...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Criar Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Tab */}
      {showRestore && (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Restaurar Backup</h3>
              <button className={styles.refreshButton} onClick={handleQuickActions.refreshList}>
                <RotateCcw size={16} />
                Atualizar
              </button>
            </div>

            <div className={styles.backupList}>
              {backupList.length === 0 ? (
                <div className={styles.emptyState}>
                  <Database size={48} />
                  <p>Nenhum backup disponível</p>
                  <span>Crie um backup primeiro para poder restaurar</span>
                </div>
              ) : (
                backupList.map((backup: any) => (
                  <div key={backup.id} className={styles.backupItem}>
                    <div className={styles.backupInfo}>
                      <div className={styles.backupHeader}>
                        <div className={styles.backupType}>
                          {getBackupTypeIcon(backup.type)}
                          <span className={styles.backupTypeText}>
                            {backup.type === 'manual'
                              ? 'Manual'
                              : backup.type === 'automatic'
                                ? 'Automático'
                                : backup.type === 'scheduled'
                                  ? 'Agendado'
                                  : 'Emergência'}
                          </span>
                        </div>
                        <span className={styles.backupEnv}>{backup.environment}</span>
                      </div>

                      <div className={styles.backupDetails}>
                        <span className={styles.backupTime}>
                          {formatDateTime(backup.timestamp)}
                        </span>
                        <span className={styles.backupSize}>{formatFileSize(backup.size)}</span>
                      </div>
                    </div>

                    <button
                      className={styles.restoreButton}
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={isBackupInProgress}
                    >
                      <Upload size={16} />
                      Restaurar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {showSchedules && (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Agendamentos de Backup</h3>
              <div className={styles.schedulerStats}>
                <span>
                  {schedulerStats.enabledSchedules}/{schedulerStats.totalSchedules} ativos
                </span>
              </div>
            </div>

            <div className={styles.schedulesList}>
              {schedules.length === 0 ? (
                <div className={styles.emptyState}>
                  <Calendar size={48} />
                  <p>Nenhum agendamento configurado</p>
                  <span>Configure backups automáticos para garantir segurança contínua</span>
                </div>
              ) : (
                schedules.map((schedule: any) => (
                  <div key={schedule.id} className={styles.scheduleItem}>
                    <div className={styles.scheduleInfo}>
                      <div className={styles.scheduleHeader}>
                        <h4>{schedule.name}</h4>
                        <div className={styles.scheduleStatus}>
                          {schedule.enabled ? (
                            <span className={styles.statusActive}>
                              <CheckCircle size={14} />
                              Ativo
                            </span>
                          ) : (
                            <span className={styles.statusInactive}>
                              <XCircle size={14} />
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.scheduleDetails}>
                        <span>Cron: {schedule.cron}</span>
                        {schedule.nextRun && (
                          <span>Próxima: {formatDateTime(schedule.nextRun)}</span>
                        )}
                        <span>Execuções: {schedule.runCount}</span>
                        {schedule.failureCount > 0 && (
                          <span className={styles.failures}>Falhas: {schedule.failureCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
