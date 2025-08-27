/**
 * WebSocket Service for Real-time Collaboration
 * Handles multi-user collaboration with conflict resolution
 */

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'document_locked' | 'document_unlocked' | 
        'document_updated' | 'demanda_updated' | 'status_changed' | 'typing' | 'cursor_moved';
  userId: string;
  userName: string;
  entityType: 'demanda' | 'documento' | 'cadastro';
  entityId: number;
  data?: any;
  timestamp: number;
  sessionId: string;
}

export interface ActiveUser {
  userId: string;
  userName: string;
  sessionId: string;
  lastActivity: number;
  currentEntity?: {
    type: string;
    id: number;
    isEditing: boolean;
  };
  avatar?: string;
  cursorPosition?: { x: number; y: number };
}

export interface DocumentLock {
  entityType: string;
  entityId: number;
  userId: string;
  userName: string;
  sessionId: string;
  lockedAt: number;
  expiresAt: number;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  lockTimeout: number; // in milliseconds
  typingTimeout: number;
}

const defaultConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  lockTimeout: 5 * 60 * 1000, // 5 minutes
  typingTimeout: 2000, // 2 seconds
};

/**
 * Real-time Collaboration Service
 */
class CollaborationService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private typingTimer: number | null = null;
  
  // State management
  private activeUsers = new Map<string, ActiveUser>();
  private documentLocks = new Map<string, DocumentLock>();
  private eventListeners = new Map<string, ((event: CollaborationEvent) => void)[]>();
  
  // Current user state
  private currentUser: { userId: string; userName: string; sessionId: string } | null = null;
  private currentEntity: { type: string; id: number } | null = null;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupEventListeners();
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(userId: string, userName: string): Promise<void> {
    if (this.isConnected) {
      console.warn('WebSocket already connected');
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
      console.log('🔗 WebSocket collaboration service connected');
    } catch (error) {
      console.error('Failed to connect to collaboration service:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.stopHeartbeat();
    this.cleanup();
    
    console.log('🔌 WebSocket collaboration service disconnected');
  }

  /**
   * Join entity (document/demanda) for collaboration
   */
  async joinEntity(entityType: string, entityId: number): Promise<void> {
    if (!this.isConnected || !this.currentUser) {
      throw new Error('Not connected to collaboration service');
    }

    // Leave current entity if different
    if (this.currentEntity && 
        (this.currentEntity.type !== entityType || this.currentEntity.id !== entityId)) {
      await this.leaveEntity();
    }

    this.currentEntity = { type: entityType, id: entityId };
    
    const event: CollaborationEvent = {
      type: 'user_joined',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as any,
      entityId,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
    console.log(`👥 Joined ${entityType} ${entityId} for collaboration`);
  }

  /**
   * Leave current entity
   */
  async leaveEntity(): Promise<void> {
    if (!this.currentEntity || !this.currentUser) {return;}

    const event: CollaborationEvent = {
      type: 'user_left',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: this.currentEntity.type as any,
      entityId: this.currentEntity.id,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
    
    // Release any locks
    await this.releaseLock(this.currentEntity.type, this.currentEntity.id);
    
    this.currentEntity = null;
    console.log('👋 Left entity collaboration');
  }

  /**
   * Acquire lock for editing
   */
  async acquireLock(entityType: string, entityId: number): Promise<boolean> {
    if (!this.currentUser) {return false;}

    const lockKey = `${entityType}:${entityId}`;
    const existingLock = this.documentLocks.get(lockKey);
    
    // Check if already locked by someone else
    if (existingLock && existingLock.userId !== this.currentUser.userId) {
      if (Date.now() < existingLock.expiresAt) {
        console.warn(`Document locked by ${existingLock.userName}`);
        return false;
      }
      // Lock expired, remove it
      this.documentLocks.delete(lockKey);
    }

    // Create new lock
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
      entityType: entityType as any,
      entityId,
      data: { lock },
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
    
    // Auto-release lock after timeout
    setTimeout(() => {
      this.releaseLock(entityType, entityId);
    }, this.config.lockTimeout);

    console.log(`🔒 Acquired lock for ${entityType} ${entityId}`);
    return true;
  }

  /**
   * Release lock
   */
  async releaseLock(entityType: string, entityId: number): Promise<void> {
    if (!this.currentUser) {return;}

    const lockKey = `${entityType}:${entityId}`;
    const lock = this.documentLocks.get(lockKey);
    
    if (!lock || lock.userId !== this.currentUser.userId) {
      return; // Not our lock
    }

    this.documentLocks.delete(lockKey);

    const event: CollaborationEvent = {
      type: 'document_unlocked',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as any,
      entityId,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
    console.log(`🔓 Released lock for ${entityType} ${entityId}`);
  }

  /**
   * Broadcast document/demanda update
   */
  broadcastUpdate(entityType: string, entityId: number, data: any): void {
    if (!this.currentUser) {return;}

    const event: CollaborationEvent = {
      type: entityType === 'documento' ? 'document_updated' : 'demanda_updated',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as any,
      entityId,
      data,
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);
  }

  /**
   * Broadcast typing indicator
   */
  broadcastTyping(entityType: string, entityId: number, fieldName: string): void {
    if (!this.currentUser) {return;}

    // Clear existing typing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    const event: CollaborationEvent = {
      type: 'typing',
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      entityType: entityType as any,
      entityId,
      data: { fieldName, isTyping: true },
      timestamp: Date.now(),
      sessionId: this.currentUser.sessionId,
    };

    this.sendMessage(event);

    // Stop typing after timeout
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
   * Get active users for current entity
   */
  getActiveUsers(): ActiveUser[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Check if entity is locked
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
   * Add event listener
   */
  addEventListener(eventType: string, handler: (event: CollaborationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
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
   * Private methods
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

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(error);
          }
        };

        // Connection timeout
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
      
      // Update internal state based on event
      this.updateInternalState(collaborationEvent);
      
      // Notify listeners
      this.notifyListeners(collaborationEvent.type, collaborationEvent);
      
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
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
        if (event.data?.lock) {
          const lockKey = `${event.entityType}:${event.entityId}`;
          this.documentLocks.set(lockKey, event.data.lock);
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
        console.error('Error in collaboration event listener:', error);
      }
    });
  }

  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
    
    if (event.code === 1000) {
      // Normal close
      return;
    }
    
    console.warn('WebSocket connection lost, attempting to reconnect...');
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(async () => {
      if (this.currentUser && !this.isConnected) {
        try {
          await this.establishConnection();
          this.startHeartbeat();
          
          // Rejoin current entity if any
          if (this.currentEntity) {
            await this.joinEntity(this.currentEntity.type, this.currentEntity.id);
          }
          
          console.log('✅ WebSocket reconnected successfully');
        } catch (error) {
          console.error('Reconnection failed:', error);
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
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.leaveEntity();
      this.disconnect();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tabs, release locks
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

// Create singleton instance
export const collaborationService = new CollaborationService();

// React hook for collaboration features
export const useCollaboration = (entityType?: string, entityId?: number) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLocked, setIsLocked] = useState<DocumentLock | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update active users
    const updateUsers = () => {
      setActiveUsers(collaborationService.getActiveUsers());
    };

    // Update lock status
    const updateLockStatus = () => {
      if (entityType && entityId) {
        setIsLocked(collaborationService.isEntityLocked(entityType, entityId));
      }
    };

    // Event listeners
    const handleUserJoined = () => updateUsers();
    const handleUserLeft = () => updateUsers();
    const handleLockChanged = () => updateLockStatus();

    collaborationService.addEventListener('user_joined', handleUserJoined);
    collaborationService.addEventListener('user_left', handleUserLeft);
    collaborationService.addEventListener('document_locked', handleLockChanged);
    collaborationService.addEventListener('document_unlocked', handleLockChanged);

    // Initial updates
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
    broadcastUpdate: (type: string, id: number, data: any) => collaborationService.broadcastUpdate(type, id, data),
    broadcastTyping: (type: string, id: number, field: string) => collaborationService.broadcastTyping(type, id, field),
    addEventListener: (type: string, handler: (event: CollaborationEvent) => void) => collaborationService.addEventListener(type, handler),
    removeEventListener: (type: string, handler: (event: CollaborationEvent) => void) => collaborationService.removeEventListener(type, handler),
  };
};

export default collaborationService;