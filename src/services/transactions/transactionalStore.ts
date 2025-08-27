/**
 * Transactional Store Integration
 * 
 * Wraps existing Zustand stores with transaction capabilities for ACID compliance
 * in multi-user environments. Provides automatic rollback and conflict resolution.
 */

import { getGlobalTransactionManager } from './transactionManager';
import type { 
  EntityType, 
  OperationType, 
  TransactionConfig,
  TransactionOperation 
} from './transactionManager';
import type { StateCreator } from 'zustand';
import { analytics } from '../analytics/core';

// Transactional store interface
interface TransactionalStore<T> {
  // Transaction control
  beginTransaction(): Promise<string>;
  commitTransaction(transactionId: string): Promise<void>;
  rollbackTransaction(transactionId: string): Promise<void>;
  
  // Transactional operations
  transactionalUpdate<K extends keyof T>(
    key: K,
    updater: (current: T[K]) => T[K],
    transactionId?: string
  ): Promise<void>;
  
  transactionalSet<K extends keyof T>(
    key: K,
    value: T[K],
    transactionId?: string
  ): Promise<void>;
  
  transactionalDelete<K extends keyof T>(
    key: K,
    transactionId?: string
  ): Promise<void>;
  
  // Optimistic updates with rollback
  optimisticUpdate<K extends keyof T>(
    key: K,
    updater: (current: T[K]) => T[K],
    onCommit?: () => Promise<void>,
    onRollback?: () => Promise<void>
  ): Promise<void>;
  
  // State snapshots for rollback
  createSnapshot(): T;
  restoreSnapshot(snapshot: T): void;
  
  // Conflict resolution
  resolveConflict<K extends keyof T>(
    key: K,
    localValue: T[K],
    remoteValue: T[K],
    strategy: 'local' | 'remote' | 'merge' | 'manual'
  ): Promise<T[K]>;
}

// Transaction metadata for operations
interface TransactionMetadata {
  userId: string;
  sessionId: string;
  userAgent?: string;
  correlationId?: string;
  timestamp: number;
}

// Transactional middleware for Zustand
export function transactional<T extends object>(
  entityType: EntityType,
  getId: (state: T) => string | number = () => 'singleton'
) {
  return <S extends T>(
    stateCreator: StateCreator<S, [], [], S>
  ): StateCreator<S & TransactionalStore<S>, [], [], S & TransactionalStore<S>> => {
    return (set, get, api) => {
      const transactionManager = getGlobalTransactionManager();
      let currentTransactionId: string | null = null;
      const snapshots = new Map<string, S>();
      const pendingOperations = new Map<string, TransactionOperation[]>();

      // Original state
      const baseStore = stateCreator(set, get, api);

      // Enhanced transactional store
      const transactionalStore: TransactionalStore<S> = {
        // Begin a new transaction
        async beginTransaction(): Promise<string> {
          const userId = getCurrentUserId();
          const sessionId = getCurrentSessionId();
          
          const transactionId = await transactionManager.beginTransaction(userId, sessionId, {
            name: `${entityType}_transaction`,
            description: `Transaction for ${entityType} operations`,
          });
          
          currentTransactionId = transactionId;
          
          // Create snapshot
          snapshots.set(transactionId, { ...get() });
          pendingOperations.set(transactionId, []);
          
          analytics.track('store_transaction_started', {
            entityType,
            transactionId,
            userId,
          });
          
          return transactionId;
        },

        // Commit the current transaction
        async commitTransaction(transactionId: string): Promise<void> {
          try {
            await transactionManager.commitTransaction(transactionId);
            
            // Clean up
            snapshots.delete(transactionId);
            pendingOperations.delete(transactionId);
            
            if (currentTransactionId === transactionId) {
              currentTransactionId = null;
            }
            
            analytics.track('store_transaction_committed', {
              entityType,
              transactionId,
              operationCount: pendingOperations.get(transactionId)?.length || 0,
            });
          } catch (error) {
            // Auto-rollback on commit failure
            await this.rollbackTransaction(transactionId);
            throw error;
          }
        },

        // Rollback the current transaction
        async rollbackTransaction(transactionId: string): Promise<void> {
          try {
            await transactionManager.rollbackTransaction(transactionId);
            
            // Restore snapshot
            const snapshot = snapshots.get(transactionId);
            if (snapshot) {
              set(() => snapshot);
            }
            
            // Clean up
            snapshots.delete(transactionId);
            pendingOperations.delete(transactionId);
            
            if (currentTransactionId === transactionId) {
              currentTransactionId = null;
            }
            
            analytics.track('store_transaction_rolled_back', {
              entityType,
              transactionId,
            });
          } catch (error) {
            console.error('Transaction rollback failed:', error);
            throw error;
          }
        },

        // Transactional update
        async transactionalUpdate<K extends keyof S>(
          key: K,
          updater: (current: S[K]) => S[K],
          transactionId?: string
        ): Promise<void> {
          const txnId = transactionId || currentTransactionId;
          if (!txnId) {
            throw new Error('No active transaction. Call beginTransaction() first.');
          }

          const currentState = get();
          const beforeValue = currentState[key];
          const afterValue = updater(beforeValue);
          
          // Add operation to transaction
          await transactionManager.addOperation(txnId, {
            type: 'update',
            entityType,
            entityId: getId(currentState),
            beforeData: beforeValue,
            afterData: afterValue,
            userId: getCurrentUserId(),
            metadata: getTransactionMetadata(),
          });

          // Apply update
          set((state) => ({ ...state, [key]: afterValue }));
          
          // Track pending operation
          const operations = pendingOperations.get(txnId) || [];
          operations.push({
            id: `op-${Date.now()}`,
            type: 'update',
            entityType,
            entityId: getId(currentState),
            beforeData: beforeValue,
            afterData: afterValue,
            timestamp: Date.now(),
            userId: getCurrentUserId(),
            metadata: getTransactionMetadata(),
          });
          pendingOperations.set(txnId, operations);
        },

        // Transactional set
        async transactionalSet<K extends keyof S>(
          key: K,
          value: S[K],
          transactionId?: string
        ): Promise<void> {
          await this.transactionalUpdate(key, () => value, transactionId);
        },

        // Transactional delete (set to undefined/null)
        async transactionalDelete<K extends keyof S>(
          key: K,
          transactionId?: string
        ): Promise<void> {
          const txnId = transactionId || currentTransactionId;
          if (!txnId) {
            throw new Error('No active transaction. Call beginTransaction() first.');
          }

          const currentState = get();
          const beforeValue = currentState[key];
          
          // Add operation to transaction
          await transactionManager.addOperation(txnId, {
            type: 'delete',
            entityType,
            entityId: getId(currentState),
            beforeData: beforeValue,
            afterData: null,
            userId: getCurrentUserId(),
            metadata: getTransactionMetadata(),
          });

          // Apply deletion (set to undefined)
          set((state) => {
            const newState = { ...state };
            delete newState[key];
            return newState;
          });
        },

        // Optimistic update with automatic rollback on error
        async optimisticUpdate<K extends keyof S>(
          key: K,
          updater: (current: S[K]) => S[K],
          onCommit?: () => Promise<void>,
          onRollback?: () => Promise<void>
        ): Promise<void> {
          const transactionId = await this.beginTransaction();
          
          try {
            // Apply optimistic update
            await this.transactionalUpdate(key, updater, transactionId);
            
            // Execute commit callback if provided
            if (onCommit) {
              await onCommit();
            }
            
            // Commit transaction
            await this.commitTransaction(transactionId);
            
            analytics.track('optimistic_update_succeeded', {
              entityType,
              key: String(key),
            });
          } catch (error) {
            // Rollback on any error
            await this.rollbackTransaction(transactionId);
            
            // Execute rollback callback if provided
            if (onRollback) {
              try {
                await onRollback();
              } catch (rollbackError) {
                console.error('Rollback callback failed:', rollbackError);
              }
            }
            
            analytics.track('optimistic_update_failed', {
              entityType,
              key: String(key),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            
            throw error;
          }
        },

        // Create state snapshot
        createSnapshot(): S {
          return { ...get() };
        },

        // Restore state snapshot
        restoreSnapshot(snapshot: S): void {
          set(() => snapshot);
        },

        // Resolve conflicts between local and remote state
        async resolveConflict<K extends keyof S>(
          key: K,
          localValue: S[K],
          remoteValue: S[K],
          strategy: 'local' | 'remote' | 'merge' | 'manual'
        ): Promise<S[K]> {
          switch (strategy) {
            case 'local':
              analytics.track('conflict_resolved', {
                entityType,
                key: String(key),
                strategy: 'local',
              });
              return localValue;
              
            case 'remote':
              analytics.track('conflict_resolved', {
                entityType,
                key: String(key),
                strategy: 'remote',
              });
              return remoteValue;
              
            case 'merge':
              // Basic merge strategy - can be customized per entity type
              const merged = await this.mergeValues(key, localValue, remoteValue);
              analytics.track('conflict_resolved', {
                entityType,
                key: String(key),
                strategy: 'merge',
              });
              return merged;
              
            case 'manual':
              // Throw error to trigger manual resolution UI
              throw new Error(`Manual conflict resolution required for ${entityType}.${String(key)}`);
              
            default:
              throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
          }
        },

        // Merge two values (basic implementation)
        async mergeValues<K extends keyof S>(
          key: K,
          localValue: S[K],
          remoteValue: S[K]
        ): Promise<S[K]> {
          // Basic merge logic - can be enhanced per field type
          if (typeof localValue === 'object' && typeof remoteValue === 'object') {
            return { ...remoteValue, ...localValue } as S[K];
          }
          
          // For primitive values, prefer remote (last writer wins)
          return remoteValue;
        },
      };

      return {
        ...baseStore,
        ...transactionalStore,
      };
    };
  };
}

// Utility functions
function getCurrentUserId(): string {
  // In a real implementation, this would get the current user ID from auth context
  return 'current-user-id';
}

function getCurrentSessionId(): string {
  // In a real implementation, this would get the current session ID
  return 'current-session-id';
}

function getTransactionMetadata(): TransactionMetadata {
  return {
    userId: getCurrentUserId(),
    sessionId: getCurrentSessionId(),
    userAgent: navigator.userAgent,
    correlationId: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
}

// Higher-order function for transactional operations
export function withTransaction<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  entityType: EntityType,
  options?: {
    maxRetries?: number;
    timeout?: number;
    isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  }
) {
  return async (...args: T): Promise<R> => {
    const transactionManager = getGlobalTransactionManager();
    
    return await transactionManager.executeTransaction(
      getCurrentUserId(),
      getCurrentSessionId(),
      async (transactionId) => {
        return await operation(...args);
      },
      {
        maxRetries: options?.maxRetries,
        timeout: options?.timeout,
        isolationLevel: options?.isolationLevel,
        name: `${entityType}_operation`,
      }
    );
  };
}

// Transaction hook for React components
export function useTransaction(entityType: EntityType) {
  const transactionManager = getGlobalTransactionManager();

  return {
    execute: <T>(
      operation: (transactionId: string) => Promise<T>,
      options?: {
        maxRetries?: number;
        timeout?: number;
        name?: string;
      }
    ) => {
      return transactionManager.executeTransaction(
        getCurrentUserId(),
        getCurrentSessionId(),
        operation,
        {
          ...options,
          name: options?.name || `${entityType}_hook_operation`,
        }
      );
    },
    
    getActiveTransactions: () => {
      return transactionManager.getActiveTransactions();
    },
    
    getTransactionStatus: (transactionId: string) => {
      return transactionManager.getTransactionStatus(transactionId);
    },
  };
}

export default transactional;
export type { TransactionalStore, TransactionMetadata };