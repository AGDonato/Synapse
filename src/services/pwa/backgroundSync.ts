/**
 * Background Sync Service
 * Handles offline data synchronization for PWA functionality
 */

import { logger } from '../../utils/logger';

export interface SyncTask {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'demanda' | 'documento' | 'cadastro';
  data: unknown;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[]; // IDs of tasks this depends on
}

export interface SyncQueueStatus {
  pending: number;
  failed: number;
  completed: number;
  processing: boolean;
  lastSync: number | null;
  errors: string[];
}

const STORAGE_KEY = 'synapse_sync_queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Progressive backoff

/**
 * Background Sync Service
 */
class BackgroundSyncService {
  private queue: SyncTask[] = [];
  private processing = false;
  private syncInterval: number | null = null;
  private listeners: ((status: SyncQueueStatus) => void)[] = [];

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  /**
   * Initialize background sync
   */
  initialize(): void {
    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.registerBackgroundSync();
    }

    // Fallback: periodic sync when online
    this.startPeriodicSync();

    logger.info('🔄 Background sync initialized');
  }

  /**
   * Add task to sync queue
   */
  addTask(task: Omit<SyncTask, 'id' | 'timestamp' | 'attempts'>): string {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateTaskId(),
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: task.maxAttempts || MAX_RETRIES,
    };

    this.queue.push(syncTask);
    this.saveQueue();
    this.notifyListeners();

    // Trigger immediate sync if online
    if (navigator.onLine && !this.processing) {
      this.processQueue();
    }

    logger.info(`📋 Added sync task: ${syncTask.type} ${syncTask.entity}`, syncTask);
    return syncTask.id;
  }

  /**
   * Process sync queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    this.notifyListeners();

    logger.info(`🔄 Processing sync queue (${this.queue.length} tasks)`);

    // Sort tasks by priority and dependencies
    const sortedTasks = this.sortTasksByPriority();
    const processedIds = new Set<string>();

    for (const task of sortedTasks) {
      // Check if dependencies are completed
      if (task.dependencies && !task.dependencies.every(id => processedIds.has(id))) {
        continue;
      }

      try {
        await this.processTask(task);
        this.removeTask(task.id);
        processedIds.add(task.id);

        logger.info(`✅ Sync task completed: ${task.id}`);
      } catch (error) {
        logger.error(`❌ Sync task failed: ${task.id}`, error);

        task.attempts++;
        if (task.attempts >= task.maxAttempts) {
          logger.error(`💀 Task exceeded max attempts: ${task.id}`);
          this.removeTask(task.id);
        }
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
    this.saveQueue();
    this.notifyListeners();

    logger.info(`✅ Sync queue processing completed. ${this.queue.length} tasks remaining`);
  }

  /**
   * Process individual sync task
   */
  private async processTask(task: SyncTask): Promise<void> {
    const delay =
      task.attempts > 0
        ? RETRY_DELAYS[task.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        : 0;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    switch (task.entity) {
      case 'demanda':
        return this.syncDemanda(task);
      case 'documento':
        return this.syncDocumento(task);
      case 'cadastro':
        return this.syncCadastro(task);
      default:
        throw new Error(`Unknown entity type: ${task.entity}`);
    }
  }

  /**
   * Sync demanda
   */
  private async syncDemanda(task: SyncTask): Promise<void> {
    const data = task.data as Record<string, unknown>;
    const endpoint = this.getEndpoint('demandas', task.type, data.id ? String(data.id) : undefined);
    const options = this.getRequestOptions(task);

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local data if needed
    const result = await response.json();
    this.updateLocalData('demandas', task.type, result);
  }

  /**
   * Sync documento
   */
  private async syncDocumento(task: SyncTask): Promise<void> {
    const data = task.data as Record<string, unknown>;
    const endpoint = this.getEndpoint(
      'documentos',
      task.type,
      data.id ? String(data.id) : undefined
    );
    const options = this.getRequestOptions(task);

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    this.updateLocalData('documentos', task.type, result);
  }

  /**
   * Sync cadastro
   */
  private async syncCadastro(task: SyncTask): Promise<void> {
    const data = task.data as Record<string, unknown>;
    const endpoint = this.getEndpoint(
      'cadastros',
      task.type,
      data.id ? String(data.id) : undefined
    );
    const options = this.getRequestOptions(task);

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    this.updateLocalData('cadastros', task.type, result);
  }

  /**
   * Get API endpoint for task
   */
  private getEndpoint(entity: string, type: string, id?: string): string {
    const baseUrl = '/api';

    switch (type) {
      case 'create':
        return `${baseUrl}/${entity}`;
      case 'update':
        return `${baseUrl}/${entity}/${id}`;
      case 'delete':
        return `${baseUrl}/${entity}/${id}`;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  /**
   * Get request options for task
   */
  private getRequestOptions(task: SyncTask): RequestInit {
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    switch (task.type) {
      case 'create':
        options.method = 'POST';
        options.body = JSON.stringify(task.data);
        break;
      case 'update':
        options.method = 'PUT';
        options.body = JSON.stringify(task.data);
        break;
      case 'delete':
        options.method = 'DELETE';
        break;
    }

    // Add authentication headers if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      (options.headers as any).Authorization = `Bearer ${token}`;
    }

    return options;
  }

  /**
   * Update local data after successful sync
   */
  private updateLocalData(entity: string, type: string, data: unknown): void {
    // This would integrate with your local state management
    // For now, just dispatch custom events that stores can listen to

    const event = new CustomEvent('syncCompleted', {
      detail: { entity, type, data },
    });

    window.dispatchEvent(event);
  }

  /**
   * Sort tasks by priority and dependencies
   */
  private sortTasksByPriority(): SyncTask[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return [...this.queue].sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Remove task from queue
   */
  private removeTask(id: string): void {
    this.queue = this.queue.filter(task => task.id !== id);
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load queue from storage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`📋 Loaded ${this.queue.length} tasks from storage`);
      }
    } catch (error) {
      logger.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to storage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      logger.info('🌐 Back online - processing sync queue');
      this.processQueue();
    });

    // Visibility change (tab becomes active)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine && this.queue.length > 0) {
        this.processQueue();
      }
    });

    // Periodic processing
    this.startPeriodicSync();
  }

  /**
   * Register background sync with service worker
   */
  private registerBackgroundSync(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then(registration => {
          // Request background sync
          return (registration as any).sync.register('background-sync');
        })
        .then(() => {
          logger.info('📡 Background sync registered');
        })
        .catch(error => {
          logger.error('Background sync registration failed:', error);
        });
    }
  }

  /**
   * Start periodic sync (fallback for browsers without background sync)
   */
  private startPeriodicSync(): void {
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Process queue every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }, 30000);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add status listener
   */
  addStatusListener(listener: (status: SyncQueueStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove status listener
   */
  removeStatusListener(listener: (status: SyncQueueStatus) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify status listeners
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logger.error('Error in sync status listener:', error);
      }
    });
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncQueueStatus {
    const failed = this.queue.filter(task => task.attempts >= task.maxAttempts).length;
    const pending = this.queue.length - failed;

    return {
      pending,
      failed,
      completed: 0, // This would be tracked separately in a real implementation
      processing: this.processing,
      lastSync: null, // This would be tracked in storage
      errors: [], // Recent error messages
    };
  }

  /**
   * Clear all tasks
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
    logger.info('🗑️ Sync queue cleared');
  }

  /**
   * Retry failed tasks
   */
  retryFailedTasks(): void {
    this.queue.forEach(task => {
      if (task.attempts >= task.maxAttempts) {
        task.attempts = 0;
      }
    });

    this.saveQueue();
    this.notifyListeners();

    if (navigator.onLine) {
      this.processQueue();
    }

    logger.info('🔄 Retrying failed sync tasks');
  }

  /**
   * Get pending tasks count
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Shutdown background sync
   */
  shutdown(): void {
    this.stopPeriodicSync();
    this.listeners = [];
    logger.info('🛑 Background sync shutdown');
  }
}

// Create singleton instance
export const backgroundSyncService = new BackgroundSyncService();

// Utility functions for background sync (React hook would be implemented separately)
export const getBackgroundSyncUtils = () => {
  return {
    getStatus: backgroundSyncService.getStatus.bind(backgroundSyncService),
    addTask: backgroundSyncService.addTask.bind(backgroundSyncService),
    clearQueue: backgroundSyncService.clearQueue.bind(backgroundSyncService),
    retryFailedTasks: backgroundSyncService.retryFailedTasks.bind(backgroundSyncService),
    addStatusListener: backgroundSyncService.addStatusListener.bind(backgroundSyncService),
    removeStatusListener: backgroundSyncService.removeStatusListener.bind(backgroundSyncService),
  };
};

export default backgroundSyncService;
