/**
 * ================================================================
 * BACKUP SERVICE - PONTO DE ENTRADA DO SISTEMA DE BACKUP
 * ================================================================
 *
 * Este arquivo serve como ponto de entrada centralizado para todo o sistema
 * de backup e recuperação de dados do Synapse, fornecendo uma interface
 * unificada para gerenciamento de backups automáticos e manuais.
 *
 * Funcionalidades principais:
 * - Exportação centralizada de classes e tipos de backup
 * - Inicialização automática do scheduler em produção/staging
 * - Gerenciamento de ciclo de vida do sistema de backup
 * - Interface unificada para componentes externos
 * - Auto-configuração baseada em ambiente
 *
 * Componentes exportados:
 * - BackupManager: Gerenciamento central de operações de backup
 * - BackupScheduler: Agendamento e execução automática de backups
 * - Tipos e interfaces: Definições TypeScript para type safety
 *
 * Estratégias de backup:
 * - Backup incremental: Apenas mudanças desde último backup
 * - Backup completo: Snapshot completo do sistema
 * - Backup seletivo: Backup de entidades específicas
 * - Backup em tempo real: Replicação contínua de mudanças críticas
 *
 * Armazenamento suportado:
 * - Local Storage: Backup no navegador do usuário
 * - IndexedDB: Armazenamento estruturado local
 * - Remote API: Sincronização com servidor backend
 * - Cloud Storage: Integração com S3, Azure Blob, etc.
 *
 * Inicialização automática:
 * - Detecção de ambiente via variáveis ENV
 * - Start automático em produção/staging
 * - Delay configurável para não impactar startup
 * - Error handling com fallback gracioso
 *
 * Padrões implementados:
 * - Module pattern para encapsulamento
 * - Facade pattern para interface simplificada
 * - Singleton pattern para instâncias únicas
 * - Observer pattern para eventos de backup
 *
 * @fileoverview Ponto de entrada do sistema de backup e recuperação
 * @version 2.0.0
 * @since 2024-01-25
 * @author Synapse Team
 */

export { BackupManager, backupManager } from './backupManager';
export { BackupScheduler, backupScheduler } from './backupScheduler';

export type {
  BackupData,
  BackupType,
  BackupScope,
  BackupOptions,
  BackupMetrics,
} from './backupManager';

export type { BackupSchedule, SchedulerConfig } from './backupScheduler';

/**
 * ===================================================================
 * INICIALIZAÇÃO AUTOMÁTICA DO SISTEMA DE BACKUP
 * ===================================================================
 */

/**
 * Configuração de inicialização automática do scheduler de backup
 *
 * Em ambientes de produção e staging, o scheduler é inicializado
 * automaticamente após um delay configurável para evitar impacto
 * no tempo de startup da aplicação.
 */
import { backupScheduler } from './backupScheduler';
import { env } from '../../config/env';

if (env.IS_PRODUCTION || env.IS_STAGING) {
  // Inicializar scheduler após um delay para não bloquear startup
  setTimeout(() => {
    backupScheduler.start().catch(console.error);
  }, 5000);
}
