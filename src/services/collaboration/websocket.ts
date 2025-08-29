/**
 * WEBSOCKET - COLABORAÇÃO EM TEMPO REAL MULTI-USUÁRIO
 *
 * Este arquivo implementa sistema de colaboração tempo real via WebSocket.
 * Funcionalidades:
 * - Comunicação bidirecional em tempo real
 * - Presença de usuários com indicação visual
 * - Sistema de bloqueios para evitar conflitos
 * - Sincronização automática de mudanças
 * - Indicação de typing e cursor em tempo real
 * - Notificações de eventos de colaboração
 * - Reconexão automática em caso de queda
 *
 * Eventos suportados:
 * - user_joined/left: Entrada/saída de usuários
 * - document_locked/unlocked: Controle de acesso exclusivo
 * - document/demanda_updated: Sincronização de mudanças
 * - typing/cursor_moved: Feedback visual em tempo real
 * - status_changed: Mudanças de status
 *
 * Otimizado para até 4 usuários colaborando simultaneamente.
 */

import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';

/**
 * Interface para eventos de colaboração em tempo real
 */
export interface CollaborationEvent {
  /** Tipo do evento de colaboração */
  type:
    | 'user_joined' // Usuário entrou na sessão
    | 'user_left' // Usuário saiu da sessão
    | 'document_locked' // Documento foi bloqueado
    | 'document_unlocked' // Documento foi desbloqueado
    | 'document_updated' // Documento foi atualizado
    | 'demanda_updated' // Demanda foi atualizada
    | 'status_changed' // Status foi alterado
    | 'typing' // Usuário está digitando
    | 'cursor_moved'; // Cursor foi movido
  /** ID do usuário que gerou o evento */
  userId: string;
  /** Nome do usuário para exibição */
  userName: string;
  /** Tipo da entidade afetada */
  entityType: 'demanda' | 'documento' | 'cadastro';
  /** ID da entidade específica */
  entityId: number;
  /** Dados adicionais do evento */
  data?: unknown;
  /** Timestamp do evento */
  timestamp: number;
  /** ID da sessão WebSocket */
  sessionId: string;
}

/**
 * Interface para usuários ativos na colaboração
 */
export interface ActiveUser {
  /** ID único do usuário */
  userId: string;
  /** Nome de exibição do usuário */
  userName: string;
  /** ID da sessão WebSocket */
  sessionId: string;
  /** Timestamp da última atividade */
  lastActivity: number;
  /** Entidade que está sendo editada atualmente */
  currentEntity?: {
    /** Tipo da entidade */
    type: string;
    /** ID da entidade */
    id: number;
    /** Se está em modo de edição */
    isEditing: boolean;
  };
  /** URL do avatar do usuário */
  avatar?: string;
  /** Posição atual do cursor */
  cursorPosition?: { x: number; y: number };
}

/**
 * Interface para bloqueios de documento
 */
export interface DocumentLock {
  /** Tipo da entidade bloqueada */
  entityType: string;
  /** ID da entidade bloqueada */
  entityId: number;
  /** ID do usuário que possui o bloqueio */
  userId: string;
  /** Nome do usuário para exibição */
  userName: string;
  /** ID da sessão que criou o bloqueio */
  sessionId: string;
  /** Timestamp de criação do bloqueio */
  lockedAt: number;
  /** Timestamp de expiração automática */
  expiresAt: number;
}

interface WebSocketConfig {
  /** URL do servidor WebSocket */
  url: string;
  /** Intervalo entre tentativas de reconexão (ms) */
  reconnectInterval: number;
  /** Número máximo de tentativas de reconexão */
  maxReconnectAttempts: number;
  /** Intervalo de heartbeat para manter conexão viva (ms) */
  heartbeatInterval: number;
  /** Timeout de bloqueio de documento em milissegundos */
  lockTimeout: number;
  /** Timeout para indicador de digitação (ms) */
  typingTimeout: number;
}

const defaultConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  lockTimeout: 5 * 60 * 1000, // 5 minutos
  typingTimeout: 2000, // 2 segundos
};

/**
 * Serviço de Colaboração em Tempo Real
 */
class CollaborationService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private typingTimer: number | null = null;

  // Gerenciamento de estado
  private activeUsers = new Map<string, ActiveUser>();
  private documentLocks = new Map<string, DocumentLock>();
  private eventListeners = new Map<string, ((event: CollaborationEvent) => void)[]>();

  // Estado do usuário atual
  private currentUser: { userId: string; userName: string; sessionId: string } | null = null;
  private currentEntity: { type: string; id: number } | null = null;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupEventListeners();
  }

  /**
   * Inicializa conexão WebSocket
   */
  async connect(userId: string, userName: string): Promise<void> {
    if (this.isConnected) {
      logger.warn('WebSocket já conectado');
      return;
    }

    this.currentUser = {
      userId,
      userName,
      sessionId: this.generateSessionId(),
    };

    try {
      await this.establishConnection();
      this.startHeartbeat();
      logger.info('🔗 Serviço de colaboração WebSocket conectado');
    } catch (error) {
      logger.error('Falha ao conectar no serviço de colaboração:', error);
      throw error;
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Desconexão do cliente');
      this.ws = null;
    }

    this.isConnected = false;
    this.stopHeartbeat();
    this.cleanup();

    logger.info('🔌 Serviço de colaboração WebSocket desconectado');
  }

  /**
   * Entra na entidade (documento/demanda) para colaboração
   */
  async joinEntity(entityType: string, entityId: number): Promise<void> {
    if (!this.isConnected || !this.currentUser) {
      throw new Error('Não conectado ao serviço de colaboração');
    }

    // Sai da entidade atual se for diferente
    if (
      this.currentEntity &&
      (this.currentEntity.type !== entityType || this.currentEntity.id !== entityId)
    ) {
      await this.leaveEntity();
    }

    this.currentEntity = { type: entityType, id: entityId };

    const event: CollaborationEvent = {
      type: 'user_joined',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as CollaborationEvent['entityType'],
      entityId,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
    logger.info(`👥 Entrou em ${entityType} ${entityId} para colaboração`);
  }

  /**
   * Sai da entidade atual
   */
  async leaveEntity(): Promise<void> {
    if (!this.currentEntity || !this.currentUser) {
      return;
    }

    const event: CollaborationEvent = {
      type: 'user_left',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: this.currentEntity.type as CollaborationEvent['entityType'],
      entityId: this.currentEntity.id,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);

    // Libera quaisquer bloqueios
    await this.releaseLock(this.currentEntity.type, this.currentEntity.id);

    this.currentEntity = null;
    logger.info('👋 Saiu da colaboração da entidade');
  }

  /**
   * Adquire bloqueio para edição
   */
  async acquireLock(entityType: string, entityId: number): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    const lockKey = `${entityType}:${entityId}`;
    const existingLock = this.documentLocks.get(lockKey);

    // Verifica se já está bloqueado por outro usuário
    if (existingLock && existingLock.userId !== this.currentUser.userId) {
      if (Date.now() < existingLock.expiresAt) {
        logger.warn(`Documento bloqueado por ${existingLock.userName}`);
        return false;
      }
      // Bloqueio expirou, remove
      this.documentLocks.delete(lockKey);
    }

    // Cria novo bloqueio
    const lock: DocumentLock = {
      entityType,
      entityId,
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      sessionId: this.currentUser.sessionId,
      lockedAt: Date.now(),
      expiresAt: Date.now() + this.config.lockTimeout,
    };

    this.documentLocks.set(lockKey, lock);

    const event: CollaborationEvent = {
      type: 'document_locked',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as CollaborationEvent['entityType'],
      entityId,
      data: { lock },
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);

    // Auto-libera bloqueio após timeout
    setTimeout(() => {
      this.releaseLock(entityType, entityId);
    }, this.config.lockTimeout);

    logger.info(`🔒 Bloqueio adquirido para ${entityType} ${entityId}`);
    return true;
  }

  /**
   * Libera bloqueio
   */
  async releaseLock(entityType: string, entityId: number): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    const lockKey = `${entityType}:${entityId}`;
    const lock = this.documentLocks.get(lockKey);

    if (!lock || lock.userId !== this.currentUser.userId) {
      return; // Não é nosso bloqueio
    }

    this.documentLocks.delete(lockKey);

    const event: CollaborationEvent = {
      type: 'document_unlocked',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as CollaborationEvent['entityType'],
      entityId,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
    logger.info(`🔓 Bloqueio liberado para ${entityType} ${entityId}`);
  }

  /**
   * Transmite atualização de documento/demanda
   */
  broadcastUpdate(entityType: string, entityId: number, data: unknown): void {
    if (!this.currentUser) {
      return;
    }

    const event: CollaborationEvent = {
      type: entityType === 'documento' ? 'document_updated' : 'demanda_updated',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as CollaborationEvent['entityType'],
      entityId,
      data,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
  }

  /**
   * Transmite indicador de digitação
   */
  broadcastTyping(entityType: string, entityId: number, fieldName: string): void {
    if (!this.currentUser) {
      return;
    }

    // Limpa timer de digitação existente
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    const event: CollaborationEvent = {
      type: 'typing',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as CollaborationEvent['entityType'],
      entityId,
      data: { fieldName, isTyping: true },
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);

    // Para de digitar após timeout
    this.typingTimer = window.setTimeout(() => {
      const stopTypingEvent: CollaborationEvent = {
        ...event,
        data: { fieldName, isTyping: false },
        timestamp: Date.now(),
      };
      this.sendMessage(stopTypingEvent);
    }, this.config.typingTimeout);
  }

  /**
   * Obtém usuários ativos da entidade atual
   */
  getActiveUsers(): ActiveUser[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Verifica se entidade está bloqueada
   */
  isEntityLocked(entityType: string, entityId: number): DocumentLock | null {
    const lockKey = `${entityType}:${entityId}`;
    const lock = this.documentLocks.get(lockKey);

    if (lock && Date.now() > lock.expiresAt) {
      this.documentLocks.delete(lockKey);
      return null;
    }

    return lock || null;
  }

  /**
   * Adiciona listener de evento
   */
  addEventListener(eventType: string, handler: (event: CollaborationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(handler);
  }

  /**
   * Remove listener de evento
   */
  removeEventListener(eventType: string, handler: (event: CollaborationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Métodos privados
   */
  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.url}?userId=${this.currentUser!.userId}&sessionId=${this.currentUser!.sessionId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = event => {
          this.handleMessage(event);
        };

        this.ws.onclose = event => {
          this.handleClose(event);
        };

        this.ws.onerror = error => {
          logger.error('Erro WebSocket:', error);
          if (!this.isConnected) {
            reject(error);
          }
        };

        // Timeout de conexão
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const collaborationEvent: CollaborationEvent = JSON.parse(event.data);

      // Atualiza estado interno baseado no evento
      this.updateInternalState(collaborationEvent);

      // Notifica listeners
      this.notifyListeners(collaborationEvent.type, collaborationEvent);
    } catch (error) {
      logger.error('Falha ao analisar mensagem WebSocket:', error);
    }
  }

  private updateInternalState(event: CollaborationEvent): void {
    switch (event.type) {
      case 'user_joined':
        this.activeUsers.set(event.userId, {
          userId: event.userId,
          userName: event.userName,
          sessionId: event.sessionId,
          lastActivity: event.timestamp,
        });
        break;

      case 'user_left':
        this.activeUsers.delete(event.userId);
        break;

      case 'document_locked':
        if (event.data && typeof event.data === 'object' && 'lock' in event.data) {
          const lockKey = `${event.entityType}:${event.entityId}`;
          this.documentLocks.set(lockKey, (event.data as any).lock);
        }
        break;

      case 'document_unlocked':
        const unlockKey = `${event.entityType}:${event.entityId}`;
        this.documentLocks.delete(unlockKey);
        break;
    }
  }

  private notifyListeners(eventType: string, event: CollaborationEvent): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const allListeners = this.eventListeners.get('*') || [];

    [...listeners, ...allListeners].forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Erro no listener de evento de colaboração:', error);
      }
    });
  }

  private handleClose(event: CloseEvent): void {
    this.isConnected = false;

    if (event.code === 1000) {
      // Fechamento normal
      return;
    }

    logger.warn('Conexão WebSocket perdida, tentando reconectar...');
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Número máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(async () => {
      if (this.currentUser && !this.isConnected) {
        try {
          await this.establishConnection();
          this.startHeartbeat();

          // Reentra na entidade atual se houver
          if (this.currentEntity) {
            await this.joinEntity(this.currentEntity.type, this.currentEntity.id);
          }

          logger.info('✅ WebSocket reconectado com sucesso');
        } catch (error) {
          logger.error('Reconexão falhhou:', error);
          this.attemptReconnect();
        }
      }
    }, this.config.reconnectInterval * this.reconnectAttempts);
  }

  private sendMessage(event: CollaborationEvent): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(event));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Limpeza ao descarregar página
    window.addEventListener('beforeunload', () => {
      this.leaveEntity();
      this.disconnect();
    });

    // Trata mudança de visibilidade
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Usuário mudou de aba, libera bloqueios
        if (this.currentEntity) {
          this.releaseLock(this.currentEntity.type, this.currentEntity.id);
        }
      }
    });
  }

  private cleanup(): void {
    this.activeUsers.clear();
    this.documentLocks.clear();
    this.currentEntity = null;

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }
}

// Cria instância singleton
export const collaborationService = new CollaborationService();

// Hook React para funcionalidades de colaboração
export const useCollaboration = (entityType?: string, entityId?: number) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLocked, setIsLocked] = useState<DocumentLock | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Atualiza usuários ativos
    const updateUsers = () => {
      setActiveUsers(collaborationService.getActiveUsers());
    };

    // Atualiza status de bloqueio
    const updateLockStatus = () => {
      if (entityType && entityId) {
        setIsLocked(collaborationService.isEntityLocked(entityType, entityId));
      }
    };

    // Listeners de eventos
    const handleUserJoined = () => updateUsers();
    const handleUserLeft = () => updateUsers();
    const handleLockChanged = () => updateLockStatus();

    collaborationService.addEventListener('user_joined', handleUserJoined);
    collaborationService.addEventListener('user_left', handleUserLeft);
    collaborationService.addEventListener('document_locked', handleLockChanged);
    collaborationService.addEventListener('document_unlocked', handleLockChanged);

    // Atualizações iniciais
    updateUsers();
    updateLockStatus();

    return () => {
      collaborationService.removeEventListener('user_joined', handleUserJoined);
      collaborationService.removeEventListener('user_left', handleUserLeft);
      collaborationService.removeEventListener('document_locked', handleLockChanged);
      collaborationService.removeEventListener('document_unlocked', handleLockChanged);
    };
  }, [entityType, entityId]);

  return {
    activeUsers,
    isLocked,
    isConnected,
    joinEntity: (type: string, id: number) => collaborationService.joinEntity(type, id),
    leaveEntity: () => collaborationService.leaveEntity(),
    acquireLock: (type: string, id: number) => collaborationService.acquireLock(type, id),
    releaseLock: (type: string, id: number) => collaborationService.releaseLock(type, id),
    broadcastUpdate: (type: string, id: number, data: unknown) =>
      collaborationService.broadcastUpdate(type, id, data),
    broadcastTyping: (type: string, id: number, field: string) =>
      collaborationService.broadcastTyping(type, id, field),
    addEventListener: (type: string, handler: (event: CollaborationEvent) => void) =>
      collaborationService.addEventListener(type, handler),
    removeEventListener: (type: string, handler: (event: CollaborationEvent) => void) =>
      collaborationService.removeEventListener(type, handler),
  };
};

export default collaborationService;
