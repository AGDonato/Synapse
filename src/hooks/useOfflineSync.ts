// src/hooks/useOfflineSync.ts

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import type { BaseEntity, CreateDTO, UpdateDTO } from '../types/api';

export interface OfflineOperation<T extends BaseEntity> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  data?: CreateDTO<T> | UpdateDTO<T>;
  entityId?: number;
  timestamp: number;
  retryCount?: number;
}

export interface UseOfflineSyncReturn<T extends BaseEntity> {
  // Offline state
  isOnline: boolean;
  pendingOperations: OfflineOperation<T>[];
  syncInProgress: boolean;

  // Operations
  queueOperation: (operation: Omit<OfflineOperation<T>, 'id' | 'timestamp'>) => void;
  syncPendingOperations: () => Promise<void>;
  clearPendingOperations: () => void;
  removePendingOperation: (operationId: string) => void;
}

export function useOfflineSync<T extends BaseEntity>(
  entityType: string,
  syncHandler: (operation: OfflineOperation<T>) => Promise<boolean>
): UseOfflineSyncReturn<T> {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation<T>[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const pendingOpsKey = `pending_ops_${entityType}`;

  // Load pending operations from storage
  useEffect(() => {
    const stored = storage.get<OfflineOperation<T>[]>(pendingOpsKey);
    if (stored) {
      setPendingOperations(stored);
    }
  }, [pendingOpsKey]);

  // Save pending operations to storage
  const savePendingOperations = useCallback((operations: OfflineOperation<T>[]) => {
    storage.set(pendingOpsKey, operations);
    setPendingOperations(operations);
  }, [pendingOpsKey]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (pendingOperations.length > 0) {
        syncPendingOperations();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingOperations.length]);

  // Queue operation for offline sync
  const queueOperation = useCallback((
    operation: Omit<OfflineOperation<T>, 'id' | 'timestamp'>
  ) => {
    const newOperation: OfflineOperation<T> = {
      ...operation,
      id: `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const updated = [...pendingOperations, newOperation];
    savePendingOperations(updated);
  }, [pendingOperations, savePendingOperations, entityType]);

  // Sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || syncInProgress || pendingOperations.length === 0) {
      return;
    }

    setSyncInProgress(true);

    try {
      const remainingOperations: OfflineOperation<T>[] = [];

      for (const operation of pendingOperations) {
        try {
          const success = await syncHandler(operation);
          
          if (!success) {
            // Retry logic
            const retryCount = (operation.retryCount || 0) + 1;
            if (retryCount < 3) {
              remainingOperations.push({
                ...operation,
                retryCount,
              });
            } else {
              console.warn('Operation failed after 3 retries:', operation);
            }
          }
        } catch (error) {
          console.error('Error syncing operation:', operation, error);
          
          // Keep operation for retry
          const retryCount = (operation.retryCount || 0) + 1;
          if (retryCount < 3) {
            remainingOperations.push({
              ...operation,
              retryCount,
            });
          }
        }
      }

      savePendingOperations(remainingOperations);
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress, pendingOperations, syncHandler, savePendingOperations]);

  // Clear all pending operations
  const clearPendingOperations = useCallback(() => {
    savePendingOperations([]);
  }, [savePendingOperations]);

  // Remove specific pending operation
  const removePendingOperation = useCallback((operationId: string) => {
    const filtered = pendingOperations.filter(op => op.id !== operationId);
    savePendingOperations(filtered);
  }, [pendingOperations, savePendingOperations]);

  // Auto-sync on mount if online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && !syncInProgress) {
      const timeoutId = setTimeout(() => {
        syncPendingOperations();
      }, 1000); // Delay to avoid immediate sync on mount

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, pendingOperations.length, syncInProgress, syncPendingOperations]);

  return {
    // Offline state
    isOnline,
    pendingOperations,
    syncInProgress,

    // Operations
    queueOperation,
    syncPendingOperations,
    clearPendingOperations,
    removePendingOperation,
  };
}