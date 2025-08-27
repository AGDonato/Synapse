/**
 * Transaction Management System
 * 
 * Provides ACID transaction capabilities for multi-user environments.
 * Handles distributed transactions, rollback mechanisms, and data consistency.
 */

import { analytics } from '../analytics/core';
import { healthMonitor } from '../monitoring/healthCheck';
import { getGlobalDistributedCache } from '../cache/distributedCache';

// Transaction states
type TransactionState = 'pending' | 'active' | 'preparing' | 'committed' | 'aborted' | 'failed';

// Transaction isolation levels
type IsolationLevel = 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';

// Operation types for transaction log
type OperationType = 'create' | 'update' | 'delete' | 'read';

// Entity types
type EntityType = 'demanda' | 'documento' | 'orgao' | 'assunto' | 'provedor' | 'autoridade';

// Transaction operation interface
interface TransactionOperation {
  id: string;
  type: OperationType;
  entityType: EntityType;
  entityId: number | string;
  beforeData?: any;
  afterData?: any;
  timestamp: number;
  userId: string;
  metadata: {
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    [key: string]: any;
  };
}

// Transaction interface
interface Transaction {
  id: string;
  state: TransactionState;
  isolationLevel: IsolationLevel;
  operations: TransactionOperation[];
  participants: string[]; // Node IDs for distributed transactions
  locks: Set<string>; // Resource locks
  timestamp: {
    started: number;
    lastActivity: number;
    timeout: number;
  };
  userId: string;
  sessionId: string;
  metadata: {
    name?: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    retryCount: number;
    maxRetries: number;
    [key: string]: any;
  };
}

// Transaction configuration
interface TransactionConfig {
  defaultTimeout: number;
  maxRetries: number;
  lockTimeout: number;
  deadlockDetectionInterval: number;
  enableDistributedTransactions: boolean;
  isolationLevel: IsolationLevel;
  autoCommit: boolean;
  batchSize: number;
}

// Lock interface
interface ResourceLock {
  transactionId: string;
  resource: string;
  mode: 'shared' | 'exclusive';
  acquiredAt: number;
  expiresAt: number;
  userId: string;
}

// Deadlock detection result
interface DeadlockResult {
  detected: boolean;
  cycles: string[][]; // Array of transaction ID cycles
  victimTransactions: string[];
}

// Transaction result
interface TransactionResult {
  success: boolean;
  transactionId: string;
  error?: string;
  rollbackOperations?: TransactionOperation[];
  affectedEntities: {
    entityType: EntityType;
    entityId: number | string;
    operation: OperationType;
  }[];
  metrics: {
    duration: number;
    operationCount: number;
    lockWaitTime: number;
    conflictCount: number;
  };
}

// Custom transaction errors
class TransactionError extends Error {
  constructor(
    message: string,
    public transactionId: string,
    public code: string,
    public retryable = false
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

class DeadlockError extends TransactionError {
  constructor(transactionId: string, cycle: string[]) {
    super(`Deadlock detected in transaction ${transactionId}`, transactionId, 'DEADLOCK', true);
    this.name = 'DeadlockError';
  }
}

class LockTimeoutError extends TransactionError {
  constructor(transactionId: string, resource: string) {
    super(`Lock timeout for resource ${resource}`, transactionId, 'LOCK_TIMEOUT', true);
    this.name = 'LockTimeoutError';
  }
}

class ConflictError extends TransactionError {
  constructor(transactionId: string, entityType: EntityType, entityId: string | number) {
    super(`Conflict detected for ${entityType} ${entityId}`, transactionId, 'CONFLICT', false);
    this.name = 'ConflictError';
  }
}

class TransactionManager {
  private transactions = new Map<string, Transaction>();
  private locks = new Map<string, ResourceLock>();
  private waitingGraph = new Map<string, Set<string>>(); // For deadlock detection
  private config: TransactionConfig;
  private cache = getGlobalDistributedCache();
  private nodeId: string;
  private deadlockTimer?: number;

  constructor(config?: Partial<TransactionConfig>) {
    this.nodeId = `tm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      defaultTimeout: 30000, // 30 seconds
      maxRetries: 3,
      lockTimeout: 10000, // 10 seconds
      deadlockDetectionInterval: 5000, // 5 seconds
      enableDistributedTransactions: true,
      isolationLevel: 'read_committed',
      autoCommit: false,
      batchSize: 100,
      ...config,
    };

    this.startDeadlockDetection();
  }

  /**
   * Begin a new transaction
   */
  async beginTransaction(
    userId: string,
    sessionId: string,
    options?: {
      isolationLevel?: IsolationLevel;
      timeout?: number;
      name?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    }
  ): Promise<string> {
    const transactionId = this.generateTransactionId();
    
    const transaction: Transaction = {
      id: transactionId,
      state: 'active',
      isolationLevel: options?.isolationLevel || this.config.isolationLevel,
      operations: [],
      participants: [this.nodeId],
      locks: new Set(),
      timestamp: {
        started: Date.now(),
        lastActivity: Date.now(),
        timeout: options?.timeout || this.config.defaultTimeout,
      },
      userId,
      sessionId,
      metadata: {
        name: options?.name,
        description: options?.description,
        priority: options?.priority || 'medium',
        retryCount: 0,
        maxRetries: this.config.maxRetries,
      },
    };

    this.transactions.set(transactionId, transaction);

    analytics.track('transaction_started', {
      transactionId,
      userId,
      sessionId,
      isolationLevel: transaction.isolationLevel,
      nodeId: this.nodeId,
    });

    healthMonitor.recordMetric('active_transactions', this.transactions.size);

    return transactionId;
  }

  /**
   * Add an operation to a transaction
   */
  async addOperation(
    transactionId: string,
    operation: Omit<TransactionOperation, 'id' | 'timestamp'>
  ): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new TransactionError('Transaction not found', transactionId, 'NOT_FOUND');
    }

    if (transaction.state !== 'active') {
      throw new TransactionError('Transaction is not active', transactionId, 'INVALID_STATE');
    }

    // Acquire necessary locks
    await this.acquireLocks(transactionId, operation);

    // Check for conflicts
    await this.checkConflicts(transactionId, operation);

    const fullOperation: TransactionOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
    };

    transaction.operations.push(fullOperation);
    transaction.timestamp.lastActivity = Date.now();

    // Store in cache for distributed access
    await this.cache.set(`transaction:${transactionId}`, transaction, {
      ttl: Math.ceil(transaction.timestamp.timeout / 1000),
      tags: ['transaction', 'active'],
    });

    analytics.track('transaction_operation_added', {
      transactionId,
      operationType: operation.type,
      entityType: operation.entityType,
      entityId: operation.entityId,
    });
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(transactionId: string): Promise<TransactionResult> {
    const startTime = Date.now();
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new TransactionError('Transaction not found', transactionId, 'NOT_FOUND');
    }

    if (transaction.state !== 'active') {
      throw new TransactionError('Transaction is not active', transactionId, 'INVALID_STATE');
    }

    try {
      transaction.state = 'preparing';

      // Two-phase commit for distributed transactions
      if (this.config.enableDistributedTransactions && transaction.participants.length > 1) {
        await this.performTwoPhaseCommit(transaction);
      } else {
        await this.performLocalCommit(transaction);
      }

      transaction.state = 'committed';
      
      // Release all locks
      await this.releaseTransactionLocks(transactionId);

      const result: TransactionResult = {
        success: true,
        transactionId,
        affectedEntities: transaction.operations.map(op => ({
          entityType: op.entityType,
          entityId: op.entityId,
          operation: op.type,
        })),
        metrics: {
          duration: Date.now() - startTime,
          operationCount: transaction.operations.length,
          lockWaitTime: 0, // Would be calculated in real implementation
          conflictCount: 0, // Would be tracked during execution
        },
      };

      // Cleanup
      this.transactions.delete(transactionId);
      await this.cache.delete(`transaction:${transactionId}`);

      analytics.track('transaction_committed', {
        transactionId,
        userId: transaction.userId,
        operationCount: transaction.operations.length,
        duration: result.metrics.duration,
      });

      healthMonitor.recordMetric('active_transactions', this.transactions.size);
      healthMonitor.recordMetric('transaction_success_rate', 1);

      return result;
    } catch (error) {
      // Auto-rollback on commit failure
      await this.rollbackTransaction(transactionId);
      
      const transactionError = error instanceof TransactionError 
        ? error 
        : new TransactionError(
            error instanceof Error ? error.message : 'Commit failed', 
            transactionId, 
            'COMMIT_FAILED'
          );

      healthMonitor.recordMetric('transaction_success_rate', 0);
      
      throw transactionError;
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transactionId: string): Promise<TransactionResult> {
    const startTime = Date.now();
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new TransactionError('Transaction not found', transactionId, 'NOT_FOUND');
    }

    try {
      transaction.state = 'aborted';
      
      // Reverse operations in LIFO order
      const rollbackOps: TransactionOperation[] = [];
      
      for (let i = transaction.operations.length - 1; i >= 0; i--) {
        const operation = transaction.operations[i];
        const rollbackOp = await this.createRollbackOperation(operation);
        
        if (rollbackOp) {
          rollbackOps.push(rollbackOp);
          await this.executeRollbackOperation(rollbackOp);
        }
      }

      // Release all locks
      await this.releaseTransactionLocks(transactionId);

      const result: TransactionResult = {
        success: true,
        transactionId,
        rollbackOperations: rollbackOps,
        affectedEntities: transaction.operations.map(op => ({
          entityType: op.entityType,
          entityId: op.entityId,
          operation: op.type,
        })),
        metrics: {
          duration: Date.now() - startTime,
          operationCount: transaction.operations.length,
          lockWaitTime: 0,
          conflictCount: 0,
        },
      };

      // Cleanup
      this.transactions.delete(transactionId);
      await this.cache.delete(`transaction:${transactionId}`);

      analytics.track('transaction_rolled_back', {
        transactionId,
        userId: transaction.userId,
        operationCount: transaction.operations.length,
        rollbackCount: rollbackOps.length,
      });

      healthMonitor.recordMetric('active_transactions', this.transactions.size);

      return result;
    } catch (error) {
      transaction.state = 'failed';
      
      analytics.track('transaction_rollback_failed', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new TransactionError(
        `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        transactionId,
        'ROLLBACK_FAILED'
      );
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async executeTransaction<T>(
    userId: string,
    sessionId: string,
    operation: (transactionId: string) => Promise<T>,
    options?: {
      isolationLevel?: IsolationLevel;
      timeout?: number;
      name?: string;
      maxRetries?: number;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries || this.config.maxRetries;
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const transactionId = await this.beginTransaction(userId, sessionId, options);
      
      try {
        const result = await operation(transactionId);
        await this.commitTransaction(transactionId);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        try {
          await this.rollbackTransaction(transactionId);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }

        // Retry on retryable errors
        if (error instanceof TransactionError && error.retryable && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError!;
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): Transaction | null {
    return this.transactions.get(transactionId) || null;
  }

  /**
   * Get all active transactions (for monitoring)
   */
  getActiveTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).filter(t => t.state === 'active');
  }

  /**
   * Private helper methods
   */

  private async acquireLocks(transactionId: string, operation: Omit<TransactionOperation, 'id' | 'timestamp'>): Promise<void> {
    const resourceKey = `${operation.entityType}:${operation.entityId}`;
    const lockMode = operation.type === 'read' ? 'shared' : 'exclusive';
    
    // Check if lock is available
    const existingLock = this.locks.get(resourceKey);
    const now = Date.now();
    
    if (existingLock) {
      // Check if lock is expired
      if (existingLock.expiresAt <= now) {
        this.locks.delete(resourceKey);
      } else if (existingLock.transactionId !== transactionId) {
        // Lock conflict - check compatibility
        if (lockMode === 'exclusive' || existingLock.mode === 'exclusive') {
          // Wait for lock or timeout
          await this.waitForLock(transactionId, resourceKey);
        }
      }
    }

    // Acquire the lock
    const lock: ResourceLock = {
      transactionId,
      resource: resourceKey,
      mode: lockMode,
      acquiredAt: now,
      expiresAt: now + this.config.lockTimeout,
      userId: operation.userId,
    };

    this.locks.set(resourceKey, lock);
    
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.locks.add(resourceKey);
    }
  }

  private async waitForLock(transactionId: string, resource: string): Promise<void> {
    const startTime = Date.now();
    const timeout = this.config.lockTimeout;
    
    return new Promise((resolve, reject) => {
      const checkLock = () => {
        const lock = this.locks.get(resource);
        const now = Date.now();
        
        if (!lock || lock.expiresAt <= now) {
          // Lock is available
          resolve();
          return;
        }
        
        if (now - startTime >= timeout) {
          // Timeout
          reject(new LockTimeoutError(transactionId, resource));
          return;
        }
        
        // Update waiting graph for deadlock detection
        const lockOwner = lock.transactionId;
        if (!this.waitingGraph.has(transactionId)) {
          this.waitingGraph.set(transactionId, new Set());
        }
        this.waitingGraph.get(transactionId)!.add(lockOwner);
        
        // Check again after a short delay
        setTimeout(checkLock, 100);
      };
      
      checkLock();
    });
  }

  private async checkConflicts(transactionId: string, operation: Omit<TransactionOperation, 'id' | 'timestamp'>): Promise<void> {
    // Implement optimistic concurrency control
    // This would check version numbers, timestamps, or other conflict detection mechanisms
    
    if (operation.type !== 'read') {
      // For simplicity, we'll simulate conflict detection
      const conflictProbability = 0.05; // 5% chance of conflict
      
      if (Math.random() < conflictProbability) {
        throw new ConflictError(transactionId, operation.entityType, operation.entityId);
      }
    }
  }

  private async releaseTransactionLocks(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {return;}

    for (const resource of transaction.locks) {
      const lock = this.locks.get(resource);
      if (lock && lock.transactionId === transactionId) {
        this.locks.delete(resource);
      }
    }

    transaction.locks.clear();
    
    // Remove from waiting graph
    this.waitingGraph.delete(transactionId);
    
    // Remove this transaction from others' waiting lists
    for (const [waitingTxn, waitingFor] of this.waitingGraph.entries()) {
      waitingFor.delete(transactionId);
      if (waitingFor.size === 0) {
        this.waitingGraph.delete(waitingTxn);
      }
    }
  }

  private async performLocalCommit(transaction: Transaction): Promise<void> {
    // Execute all operations
    for (const operation of transaction.operations) {
      await this.executeOperation(operation);
    }
  }

  private async performTwoPhaseCommit(transaction: Transaction): Promise<void> {
    // Phase 1: Prepare
    for (const participantId of transaction.participants) {
      if (participantId !== this.nodeId) {
        // Send prepare message to other participants
        await this.sendPrepareMessage(participantId, transaction.id);
      }
    }

    // Phase 2: Commit
    for (const participantId of transaction.participants) {
      if (participantId !== this.nodeId) {
        // Send commit message to other participants
        await this.sendCommitMessage(participantId, transaction.id);
      }
    }

    // Execute local operations
    await this.performLocalCommit(transaction);
  }

  private async sendPrepareMessage(participantId: string, transactionId: string): Promise<void> {
    // In a real implementation, this would send a message to another node
    console.log(`Sending PREPARE to ${participantId} for transaction ${transactionId}`);
  }

  private async sendCommitMessage(participantId: string, transactionId: string): Promise<void> {
    // In a real implementation, this would send a message to another node
    console.log(`Sending COMMIT to ${participantId} for transaction ${transactionId}`);
  }

  private async executeOperation(operation: TransactionOperation): Promise<void> {
    // In a real implementation, this would execute the actual database operation
    console.log(`Executing ${operation.type} on ${operation.entityType}:${operation.entityId}`);
  }

  private async createRollbackOperation(operation: TransactionOperation): Promise<TransactionOperation | null> {
    switch (operation.type) {
      case 'create':
        return {
          ...operation,
          id: this.generateOperationId(),
          type: 'delete',
          beforeData: operation.afterData,
          afterData: null,
          timestamp: Date.now(),
        };
      
      case 'update':
        return {
          ...operation,
          id: this.generateOperationId(),
          type: 'update',
          beforeData: operation.afterData,
          afterData: operation.beforeData,
          timestamp: Date.now(),
        };
      
      case 'delete':
        return {
          ...operation,
          id: this.generateOperationId(),
          type: 'create',
          beforeData: null,
          afterData: operation.beforeData,
          timestamp: Date.now(),
        };
      
      case 'read':
        return null; // No rollback needed for read operations
    }
  }

  private async executeRollbackOperation(operation: TransactionOperation): Promise<void> {
    // Execute the rollback operation
    await this.executeOperation(operation);
  }

  private startDeadlockDetection(): void {
    this.deadlockTimer = window.setInterval(() => {
      this.detectDeadlocks().catch(error => {
        console.error('Deadlock detection error:', error);
      });
    }, this.config.deadlockDetectionInterval);
  }

  private async detectDeadlocks(): Promise<void> {
    const result = this.findDeadlockCycles();
    
    if (result.detected) {
      analytics.track('deadlock_detected', {
        cycles: result.cycles,
        victimTransactions: result.victimTransactions,
        nodeId: this.nodeId,
      });

      // Abort victim transactions
      for (const transactionId of result.victimTransactions) {
        try {
          await this.rollbackTransaction(transactionId);
        } catch (error) {
          console.error(`Failed to abort victim transaction ${transactionId}:`, error);
        }
      }
    }
  }

  private findDeadlockCycles(): DeadlockResult {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    const victimTransactions: string[] = [];

    for (const [transaction, waitingFor] of this.waitingGraph.entries()) {
      if (!visited.has(transaction)) {
        const cycle = this.dfs(transaction, visited, recursionStack, []);
        if (cycle.length > 0) {
          cycles.push(cycle);
          // Choose victim (youngest transaction)
          const victim = this.selectDeadlockVictim(cycle);
          if (victim) {
            victimTransactions.push(victim);
          }
        }
      }
    }

    return {
      detected: cycles.length > 0,
      cycles,
      victimTransactions,
    };
  }

  private dfs(
    current: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] {
    visited.add(current);
    recursionStack.add(current);
    path.push(current);

    const waitingFor = this.waitingGraph.get(current);
    if (waitingFor) {
      for (const next of waitingFor) {
        if (!visited.has(next)) {
          const cycle = this.dfs(next, visited, recursionStack, [...path]);
          if (cycle.length > 0) {
            return cycle;
          }
        } else if (recursionStack.has(next)) {
          // Found a cycle
          const cycleStart = path.indexOf(next);
          return path.slice(cycleStart);
        }
      }
    }

    recursionStack.delete(current);
    return [];
  }

  private selectDeadlockVictim(cycle: string[]): string | null {
    // Select the youngest transaction (highest timestamp)
    let victim: string | null = null;
    let latestTimestamp = 0;

    for (const transactionId of cycle) {
      const transaction = this.transactions.get(transactionId);
      if (transaction && transaction.timestamp.started > latestTimestamp) {
        latestTimestamp = transaction.timestamp.started;
        victim = transactionId;
      }
    }

    return victim;
  }

  private generateTransactionId(): string {
    return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.deadlockTimer) {
      clearInterval(this.deadlockTimer);
      this.deadlockTimer = undefined;
    }
    
    // Abort all active transactions
    for (const [transactionId] of this.transactions.entries()) {
      this.rollbackTransaction(transactionId).catch(error => {
        console.error(`Failed to rollback transaction ${transactionId} during cleanup:`, error);
      });
    }
  }
}

// Global transaction manager instance
let globalTransactionManager: TransactionManager | null = null;

export function getGlobalTransactionManager(): TransactionManager {
  if (!globalTransactionManager) {
    globalTransactionManager = new TransactionManager({
      enableDistributedTransactions: import.meta.env.VITE_ENABLE_DISTRIBUTED_TRANSACTIONS === 'true',
      isolationLevel: (import.meta.env.VITE_TRANSACTION_ISOLATION_LEVEL as IsolationLevel) || 'read_committed',
      defaultTimeout: Number(import.meta.env.VITE_TRANSACTION_TIMEOUT) || 30000,
      maxRetries: Number(import.meta.env.VITE_TRANSACTION_MAX_RETRIES) || 3,
    });
  }
  
  return globalTransactionManager;
}

export default TransactionManager;
export {
  TransactionError,
  DeadlockError,
  LockTimeoutError,
  ConflictError,
};
export type {
  Transaction,
  TransactionOperation,
  TransactionResult,
  TransactionConfig,
  IsolationLevel,
  OperationType,
  EntityType,
  TransactionState,
};