// Mock backup service types
export type BackupType =
  | 'full'
  | 'incremental'
  | 'quick'
  | 'manual'
  | 'automatic'
  | 'scheduled'
  | 'emergency';
export type BackupScope =
  | 'all'
  | 'user-data'
  | 'system-config'
  | 'cache'
  | 'application-state'
  | 'settings';

export interface BackupConfig {
  type: BackupType;
  scope: BackupScope;
  compress?: boolean;
  encrypt?: boolean;
}
