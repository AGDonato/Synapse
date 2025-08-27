/**
 * Barrel exports para sistema de backup
 */

export { BackupManager, backupManager } from './backupManager';
export { BackupScheduler, backupScheduler } from './backupScheduler';

export type {
  BackupData,
  BackupType,
  BackupScope,
  BackupOptions,
  BackupMetrics
} from './backupManager';

export type {
  BackupSchedule,
  SchedulerConfig
} from './backupScheduler';

// Inicialização automática em produção/staging
import { backupScheduler } from './backupScheduler';
import { env } from '../../config/env';

if (env.IS_PRODUCTION || env.IS_STAGING) {
  // Inicializar scheduler após um delay para não bloquear startup
  setTimeout(() => {
    backupScheduler.start().catch(console.error);
  }, 5000);
}