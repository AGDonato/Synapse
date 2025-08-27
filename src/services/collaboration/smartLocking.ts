/**
 * Smart Locking System
 * Sistema de bloqueios inteligentes por campo/seção
 * Otimizado para colaboração de até 4 usuários
 */

import { type ActiveUser, type DocumentLock, collaborationService } from './websocket';

export interface FieldLock {
  fieldId: string;
  fieldName: string;
  userId: string;
  userName: string;
  sessionId: string;
  entityType: string;
  entityId: number;
  lockedAt: number;
  expiresAt: number;
  lockType: 'field' | 'section' | 'document';
  metadata?: Record<string, any>;
}

export interface LockRequest {
  fieldId: string;
  fieldName: string;
  entityType: string;
  entityId: number;
  lockType?: 'field' | 'section' | 'document';
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface LockConflict {
  fieldId: string;
  requestedBy: string;
  currentOwner: string;
  lockType: string;
  conflictType: 'field_locked' | 'section_overlap' | 'document_locked';
  suggestedActions: string[];
}

/**
 * Gerenciador de bloqueios inteligentes
 */
class SmartLockManager {
  private fieldLocks = new Map<string, FieldLock>();
  private lockTimeouts = new Map<string, number>();
  private defaultTimeout = 5 * 60 * 1000; // 5 minutos
  private maxConcurrentLocks = 10; // Por usuário

  // Configurações de conflito
  private conflictRules = {
    // Campos que não podem ser editados simultaneamente
    exclusiveFields: new Set([
      'status',
      'assignee',
      'priority',
      'finalDate',
      'conclusion'
    ]),

    // Seções que são mutuamente exclusivas
    exclusiveSections: new Map([
      ['header', ['title', 'description', 'type', 'priority']],
      ['details', ['content', 'observations', 'attachments']],
      ['metadata', ['tags', 'category', 'assignee', 'dueDate']],
      ['conclusion', ['finalDate', 'conclusion', 'status']]
    ]),

    // Campos que podem ser editados simultaneamente
    nonBlockingFields: new Set([
      'tags',
      'observations',
      'attachments',
      'comments'
    ])
  };

  constructor() {
    this.setupEventListeners();
    this.startCleanupTimer();
  }

  /**
   * Solicitar bloqueio de campo
   */
  async requestFieldLock(request: LockRequest): Promise<{
    success: boolean;
    lock?: FieldLock;
    conflict?: LockConflict;
    message?: string;
  }> {
    const { fieldId, fieldName, entityType, entityId, lockType = 'field', timeout } = request;

    // Verificar se usuário já tem muitos locks
    const userLocks = this.getUserLocks(this.getCurrentUserId());
    if (userLocks.length >= this.maxConcurrentLocks) {
      return {
        success: false,
        message: 'Limite de bloqueios simultâneos atingido'
      };
    }

    // Verificar conflitos
    const conflict = this.checkConflicts(request);
    if (conflict) {
      return {
        success: false,
        conflict,
        message: `Campo bloqueado por ${conflict.currentOwner}`
      };
    }

    // Criar bloqueio
    const lock: FieldLock = {
      fieldId,
      fieldName,
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      sessionId: this.getCurrentSessionId(),
      entityType,
      entityId,
      lockedAt: Date.now(),
      expiresAt: Date.now() + (timeout || this.defaultTimeout),
      lockType,
      metadata: request.metadata
    };

    // Salvar bloqueio
    this.fieldLocks.set(fieldId, lock);

    // Configurar timeout automático
    this.setLockTimeout(fieldId, lock.expiresAt);

    // Notificar outros usuários
    this.broadcastLockChange('field_locked', lock);

    // Log para debug
    console.log(`🔒 Campo '${fieldName}' bloqueado por ${lock.userName}`);

    return {
      success: true,
      lock
    };
  }

  /**
   * Liberar bloqueio de campo
   */
  async releaseFieldLock(fieldId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const lock = this.fieldLocks.get(fieldId);
    
    if (!lock) {
      return {
        success: false,
        message: 'Bloqueio não encontrado'
      };
    }

    // Verificar se o usuário atual é o dono do lock
    const currentUserId = this.getCurrentUserId();
    if (lock.userId !== currentUserId) {
      return {
        success: false,
        message: 'Você não possui este bloqueio'
      };
    }

    // Remover bloqueio
    this.fieldLocks.delete(fieldId);

    // Limpar timeout
    const timeoutId = this.lockTimeouts.get(fieldId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.lockTimeouts.delete(fieldId);
    }

    // Notificar outros usuários
    this.broadcastLockChange('field_unlocked', lock);

    console.log(`🔓 Campo '${lock.fieldName}' liberado por ${lock.userName}`);

    return {
      success: true
    };
  }

  /**
   * Verificar se campo está bloqueado
   */
  isFieldLocked(fieldId: string): boolean {
    const lock = this.fieldLocks.get(fieldId);
    
    if (!lock) {return false;}

    // Verificar se lock expirou
    if (Date.now() > lock.expiresAt) {
      this.releaseFieldLock(fieldId);
      return false;
    }

    // Verificar se é o próprio usuário
    return lock.userId !== this.getCurrentUserId();
  }

  /**
   * Obter informações do lock
   */
  getFieldLock(fieldId: string): FieldLock | null {
    const lock = this.fieldLocks.get(fieldId);
    
    if (lock && Date.now() > lock.expiresAt) {
      this.releaseFieldLock(fieldId);
      return null;
    }

    return lock || null;
  }

  /**
   * Obter todos os locks do usuário
   */
  getUserLocks(userId?: string): FieldLock[] {
    const targetUserId = userId || this.getCurrentUserId();
    return Array.from(this.fieldLocks.values())
      .filter(lock => lock.userId === targetUserId);
  }

  /**
   * Obter todos os locks da entidade
   */
  getEntityLocks(entityType: string, entityId: number): FieldLock[] {
    return Array.from(this.fieldLocks.values())
      .filter(lock => lock.entityType === entityType && lock.entityId === entityId);
  }

  /**
   * Estender tempo de bloqueio
   */
  async extendLock(fieldId: string, additionalTime = 300000): Promise<boolean> {
    const lock = this.fieldLocks.get(fieldId);
    
    if (!lock || lock.userId !== this.getCurrentUserId()) {
      return false;
    }

    // Estender tempo
    lock.expiresAt = Math.min(lock.expiresAt + additionalTime, lock.lockedAt + 30 * 60 * 1000); // Máximo 30min
    
    // Reconfigurar timeout
    this.setLockTimeout(fieldId, lock.expiresAt);

    // Notificar mudança
    this.broadcastLockChange('field_lock_extended', lock);

    return true;
  }

  /**
   * Forçar liberação de bloqueio (admin apenas)
   */
  async forceReleaseLock(fieldId: string): Promise<boolean> {
    if (!this.isCurrentUserAdmin()) {
      return false;
    }

    const lock = this.fieldLocks.get(fieldId);
    if (lock) {
      this.fieldLocks.delete(fieldId);
      
      const timeoutId = this.lockTimeouts.get(fieldId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.lockTimeouts.delete(fieldId);
      }

      this.broadcastLockChange('field_lock_forced_release', lock);
      return true;
    }

    return false;
  }

  /**
   * Verificar conflitos de bloqueio
   */
  private checkConflicts(request: LockRequest): LockConflict | null {
    const { fieldId, fieldName, entityType, entityId } = request;

    // Verificar bloqueio direto no campo
    const existingLock = this.fieldLocks.get(fieldId);
    if (existingLock && Date.now() < existingLock.expiresAt) {
      return {
        fieldId,
        requestedBy: this.getCurrentUserName(),
        currentOwner: existingLock.userName,
        lockType: existingLock.lockType,
        conflictType: 'field_locked',
        suggestedActions: [
          'Aguardar liberação do campo',
          'Editar outro campo',
          'Contatar o usuário que possui o bloqueio'
        ]
      };
    }

    // Verificar campos exclusivos
    if (this.conflictRules.exclusiveFields.has(fieldName)) {
      const conflictingLocks = Array.from(this.fieldLocks.values())
        .filter(lock => 
          lock.entityType === entityType &&
          lock.entityId === entityId &&
          this.conflictRules.exclusiveFields.has(lock.fieldName) &&
          Date.now() < lock.expiresAt
        );

      if (conflictingLocks.length > 0) {
        const conflict = conflictingLocks[0];
        return {
          fieldId,
          requestedBy: this.getCurrentUserName(),
          currentOwner: conflict.userName,
          lockType: 'exclusive_field',
          conflictType: 'field_locked',
          suggestedActions: [
            'Aguardar conclusão da edição',
            'Trabalhar em outra seção'
          ]
        };
      }
    }

    // Verificar sobreposição de seções
    const sectionConflict = this.checkSectionConflicts(fieldName, entityType, entityId);
    if (sectionConflict) {
      return sectionConflict;
    }

    return null;
  }

  /**
   * Verificar conflitos de seção
   */
  private checkSectionConflicts(fieldName: string, entityType: string, entityId: number): LockConflict | null {
    for (const [section, fields] of this.conflictRules.exclusiveSections.entries()) {
      if (fields.includes(fieldName)) {
        // Verificar se algum outro campo da seção está bloqueado
        const conflictingLocks = Array.from(this.fieldLocks.values())
          .filter(lock => 
            lock.entityType === entityType &&
            lock.entityId === entityId &&
            fields.includes(lock.fieldName) &&
            lock.fieldName !== fieldName &&
            Date.now() < lock.expiresAt
          );

        if (conflictingLocks.length > 0) {
          const conflict = conflictingLocks[0];
          return {
            fieldId: `section-${section}`,
            requestedBy: this.getCurrentUserName(),
            currentOwner: conflict.userName,
            lockType: 'section',
            conflictType: 'section_overlap',
            suggestedActions: [
              `Aguardar liberação da seção '${section}'`,
              'Trabalhar em outra seção',
              'Coordenar edição com outros usuários'
            ]
          };
        }
      }
    }

    return null;
  }

  /**
   * Configurar timeout automático do lock
   */
  private setLockTimeout(fieldId: string, expiresAt: number): void {
    // Limpar timeout anterior se existir
    const existingTimeout = this.lockTimeouts.get(fieldId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Configurar novo timeout
    const delay = expiresAt - Date.now();
    if (delay > 0) {
      const timeoutId = window.setTimeout(() => {
        this.releaseFieldLock(fieldId);
      }, delay);
      
      this.lockTimeouts.set(fieldId, timeoutId);
    }
  }

  /**
   * Broadcast de mudanças de lock
   */
  private broadcastLockChange(eventType: string, lock: FieldLock): void {
    // Usar sistema de colaboração existente
    if (collaborationService) {
      collaborationService.broadcastUpdate(lock.entityType, lock.entityId, {
        type: eventType,
        lock: {
          fieldId: lock.fieldId,
          fieldName: lock.fieldName,
          userId: lock.userId,
          userName: lock.userName,
          lockType: lock.lockType,
          lockedAt: lock.lockedAt,
          expiresAt: lock.expiresAt
        }
      });
    }

    // Emitir evento local
    window.dispatchEvent(new CustomEvent('field-lock-change', {
      detail: { eventType, lock }
    }));
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Cleanup ao sair da página
    window.addEventListener('beforeunload', () => {
      this.releaseAllUserLocks();
    });

    // Cleanup quando tab fica inativa
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Reduzir timeout dos locks quando usuário sai da aba
        const userLocks = this.getUserLocks();
        userLocks.forEach(lock => {
          const remainingTime = lock.expiresAt - Date.now();
          if (remainingTime > 60000) { // Se tem mais que 1 minuto
            lock.expiresAt = Date.now() + 60000; // Reduzir para 1 minuto
            this.setLockTimeout(lock.fieldId, lock.expiresAt);
          }
        });
      }
    });

    // Listener para eventos de colaboração
    window.addEventListener('collaboration-event', (event: any) => {
      const { type, data } = event.detail;
      
      if (type === 'user_left') {
        // Limpar locks do usuário que saiu
        this.releaseUserLocks(data.userId);
      }
    });
  }

  /**
   * Timer de limpeza automática
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredLocks: string[] = [];

      for (const [fieldId, lock] of this.fieldLocks.entries()) {
        if (now > lock.expiresAt) {
          expiredLocks.push(fieldId);
        }
      }

      expiredLocks.forEach(fieldId => {
        this.releaseFieldLock(fieldId);
      });
    }, 30000); // A cada 30 segundos
  }

  /**
   * Liberar todos os locks do usuário
   */
  private releaseAllUserLocks(): void {
    const userId = this.getCurrentUserId();
    const userLocks = this.getUserLocks(userId);
    
    userLocks.forEach(lock => {
      this.releaseFieldLock(lock.fieldId);
    });
  }

  /**
   * Liberar locks de usuário específico
   */
  private releaseUserLocks(userId: string): void {
    const userLocks = this.getUserLocks(userId);
    
    userLocks.forEach(lock => {
      this.fieldLocks.delete(lock.fieldId);
      
      const timeoutId = this.lockTimeouts.get(lock.fieldId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.lockTimeouts.delete(timeoutId);
      }

      this.broadcastLockChange('field_unlocked', lock);
    });
  }

  /**
   * Utilitários de usuário
   */
  private getCurrentUserId(): string {
    // Integrar com sistema de autenticação
    return localStorage.getItem('user_id') || 'anonymous';
  }

  private getCurrentUserName(): string {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.name || user.username || user.email || 'Usuário';
      } catch {}
    }
    return 'Usuário Anônimo';
  }

  private getCurrentSessionId(): string {
    return sessionStorage.getItem('session_id') || 'no-session';
  }

  private isCurrentUserAdmin(): boolean {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role === 'admin';
      } catch {}
    }
    return false;
  }

  /**
   * Estatísticas de bloqueios
   */
  getStatistics() {
    const now = Date.now();
    const activeLocks = Array.from(this.fieldLocks.values())
      .filter(lock => now < lock.expiresAt);

    const locksByType = activeLocks.reduce((acc, lock) => {
      acc[lock.lockType] = (acc[lock.lockType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locksByUser = activeLocks.reduce((acc, lock) => {
      acc[lock.userName] = (acc[lock.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActiveLocks: activeLocks.length,
      locksByType,
      locksByUser,
      averageLockDuration: this.calculateAverageLockDuration(activeLocks),
      oldestLock: activeLocks.reduce((oldest, lock) => 
        !oldest || lock.lockedAt < oldest.lockedAt ? lock : oldest, 
        null as FieldLock | null
      )
    };
  }

  private calculateAverageLockDuration(locks: FieldLock[]): number {
    if (locks.length === 0) {return 0;}
    
    const totalDuration = locks.reduce((sum, lock) => 
      sum + (lock.expiresAt - lock.lockedAt), 0
    );
    
    return totalDuration / locks.length;
  }
}

// Singleton instance
export const smartLockManager = new SmartLockManager();

// Hook para usar no React
export const useSmartLocking = (entityType?: string, entityId?: number) => {
  const [locks, setLocks] = React.useState<FieldLock[]>([]);

  React.useEffect(() => {
    if (entityType && entityId) {
      const entityLocks = smartLockManager.getEntityLocks(entityType, entityId);
      setLocks(entityLocks);
    }

    const handleLockChange = () => {
      if (entityType && entityId) {
        const entityLocks = smartLockManager.getEntityLocks(entityType, entityId);
        setLocks(entityLocks);
      }
    };

    window.addEventListener('field-lock-change', handleLockChange);
    
    return () => {
      window.removeEventListener('field-lock-change', handleLockChange);
    };
  }, [entityType, entityId]);

  return {
    locks,
    requestLock: smartLockManager.requestFieldLock.bind(smartLockManager),
    releaseLock: smartLockManager.releaseFieldLock.bind(smartLockManager),
    isFieldLocked: smartLockManager.isFieldLocked.bind(smartLockManager),
    getFieldLock: smartLockManager.getFieldLock.bind(smartLockManager),
    extendLock: smartLockManager.extendLock.bind(smartLockManager),
    getUserLocks: () => smartLockManager.getUserLocks(),
    getStatistics: smartLockManager.getStatistics.bind(smartLockManager),
  };
};

export default smartLockManager;