/**
 * Advanced Caching Service for PWA
 * Implements intelligent caching strategies and offline data management
 */

import { logger } from '../../utils/logger';

export interface CacheConfig {
  name: string;
  version: string;
  maxAge: number; // in milliseconds
  maxEntries: number;
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate';
  updateOnFetch: boolean;
}

export interface CacheEntry {
  data: unknown;
  timestamp: number;
  version: string;
  etag?: string;
  expires?: number;
  size: number;
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  name: 'synapse-cache',
  version: '1.0.0',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 1000,
  strategy: 'stale-while-revalidate',
  updateOnFetch: true,
};

/**
 * Advanced Caching Service
 */
class CachingService {
  private config: CacheConfig;
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    lastCleanup: Date.now(),
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
    this.setupPeriodicCleanup();
  }

  /**
   * Initialize caching service
   */
  initialize(): void {
    // Load existing cache from IndexedDB
    this.loadFromIndexedDB();
    
    // Setup cache eviction based on memory pressure
    this.setupMemoryPressureHandling();
    
    // Intercept fetch requests for caching
    this.interceptFetch();
    
    logger.info('🗄️ Caching service initialized');
  }

  /**
   * Get item from cache
   */
  async get<T = any>(key: string, fetchFn?: () => Promise<T>): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if entry is still valid
      if (this.isValidEntry(entry)) {
        this.stats.hits++;
        
        // If stale-while-revalidate and fetchFn provided, update in background
        if (this.config.strategy === 'stale-while-revalidate' && fetchFn) {
          this.updateInBackground(key, fetchFn);
        }
        
        return entry.data;
      } else {
        // Entry is stale, remove it
        this.cache.delete(key);
      }
    }
    
    this.stats.misses++;
    
    // If no fetch function provided, return null
    if (!fetchFn) {
      return null;
    }
    
    // Fetch fresh data based on strategy
    return this.fetchWithStrategy(key, fetchFn);
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, options: {
    ttl?: number;
    etag?: string;
    version?: string;
  } = {}): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: options.version || this.config.version,
      etag: options.etag,
      expires: options.ttl ? Date.now() + options.ttl : Date.now() + this.config.maxAge,
      size: this.estimateSize(data),
    };

    this.cache.set(key, entry);
    
    // Ensure cache doesn't exceed limits
    this.enforceMemoryLimits();
    
    // Save to persistent storage
    this.saveToIndexedDB();
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToIndexedDB();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.clearIndexedDB();
    logger.info('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    const entryCount = this.cache.size;
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalSize,
      entryCount,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      lastCleanup: this.stats.lastCleanup,
    };
  }

  /**
   * Fetch data with configured strategy
   */
  private async fetchWithStrategy<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    switch (this.config.strategy) {
      case 'cache-first':
        // Already handled in get() method
        return this.fetchAndCache(key, fetchFn);
        
      case 'network-first':
        try {
          return await this.fetchAndCache(key, fetchFn);
        } catch (error) {
          // Fall back to stale cache if available
          const staleEntry = this.cache.get(key);
          if (staleEntry) {
            logger.warn('Network failed, serving stale cache:', key);
            return staleEntry.data;
          }
          throw error;
        }
        
      case 'cache-only':
        return null; // This would be handled in get() method
        
      case 'network-only':
        return fetchFn();
        
      case 'stale-while-revalidate':
        return this.fetchAndCache(key, fetchFn);
        
      default:
        return this.fetchAndCache(key, fetchFn);
    }
  }

  /**
   * Fetch data and cache it
   */
  private async fetchAndCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const data = await fetchFn();
    this.set(key, data);
    return data;
  }

  /**
   * Update cache entry in background
   */
  private async updateInBackground<T>(key: string, fetchFn: () => Promise<T>): Promise<void> {
    try {
      const freshData = await fetchFn();
      this.set(key, freshData);
      logger.info('🔄 Background cache update completed:', key);
    } catch (error) {
      logger.warn('Background cache update failed:', key, error);
    }
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    
    // Check expiration
    if (entry.expires && now > entry.expires) {
      return false;
    }
    
    // Check version
    if (entry.version !== this.config.version) {
      return false;
    }
    
    return true;
  }

  /**
   * Estimate size of data
   */
  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default estimate
    }
  }

  /**
   * Enforce memory limits
   */
  private enforceMemoryLimits(): void {
    // Remove entries if we exceed max count
    if (this.cache.size > this.config.maxEntries) {
      const entriesToRemove = this.cache.size - this.config.maxEntries;
      const sortedKeys = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp) // Oldest first
        .slice(0, entriesToRemove)
        .map(([key]) => key);
      
      sortedKeys.forEach(key => this.cache.delete(key));
      logger.info(`🗑️ Removed ${entriesToRemove} old cache entries`);
    }
    
    // Check total size and remove if necessary
    const stats = this.getStats();
    const maxSizeMB = 50; // 50MB limit
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (stats.totalSize > maxSizeBytes) {
      const targetSize = maxSizeBytes * 0.8; // Reduce to 80% of limit
      let currentSize = stats.totalSize;
      
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      for (const [key, entry] of sortedEntries) {
        if (currentSize <= targetSize) {break;}
        
        this.cache.delete(key);
        currentSize -= entry.size;
      }
      
      logger.info(`🗑️ Cache size reduced from ${Math.round(stats.totalSize / 1024 / 1024)}MB to ${Math.round(currentSize / 1024 / 1024)}MB`);
    }
  }

  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.info(`🧹 Cleaned up ${removedCount} expired cache entries`);
      this.saveToIndexedDB();
    }
    
    this.stats.lastCleanup = now;
  }

  /**
   * Setup memory pressure handling
   */
  private setupMemoryPressureHandling(): void {
    // Listen for memory pressure events
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMemoryMB = memory.totalJSHeapSize / 1024 / 1024;
        const memoryUsage = (usedMemoryMB / totalMemoryMB) * 100;
        
        if (memoryUsage > 85) { // High memory pressure
          logger.warn('🚨 High memory pressure detected, clearing cache');
          this.clear();
        }
      };
      
      // Check every minute
      setInterval(checkMemory, 60 * 1000);
    }
  }

  /**
   * Intercept fetch for automatic caching
   */
  private interceptFetch(): void {
    if (!this.config.updateOnFetch) {return;}
    
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();
      
      // Only cache GET requests to API endpoints
      if ((!init || init.method === 'GET' || !init.method) && url.includes('/api/')) {
        const cacheKey = `fetch:${url}`;
        
        try {
          const response = await originalFetch(input, init);
          
          // Cache successful responses
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            const data = await clone.json();
            
            self.set(cacheKey, data, {
              etag: response.headers.get('etag') || undefined,
            });
          }
          
          return response;
        } catch (error) {
          // Try to serve from cache on network error
          const cached = await self.get(cacheKey);
          if (cached) {
            logger.warn('Network error, serving from cache:', url);
            return new Response(JSON.stringify(cached), {
              status: 200,
              statusText: 'OK (Cached)',
              headers: { 'Content-Type': 'application/json' },
            });
          }
          
          throw error;
        }
      }
      
      return originalFetch(input, init);
    };
  }

  /**
   * Load cache from localStorage (fallback)
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(`${this.config.name}-cache`);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.entries);
        this.stats = { ...this.stats, ...data.stats };
      }
    } catch (error) {
      logger.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Load cache from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      return this.loadFromStorage(); // Fallback
    }

    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get('entries');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          if (request.result) {
            this.cache = new Map(request.result.data);
            logger.info(`📥 Loaded ${this.cache.size} cache entries from IndexedDB`);
          }
          resolve();
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.warn('Failed to load from IndexedDB, using localStorage fallback:', error);
      this.loadFromStorage();
    }
  }

  /**
   * Save cache to IndexedDB
   */
  private async saveToIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      // Fallback to localStorage
      localStorage.setItem(`${this.config.name}-cache`, JSON.stringify({
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
      }));
      return;
    }

    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await store.put({
        id: 'entries',
        data: Array.from(this.cache.entries()),
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.warn('Failed to save to IndexedDB:', error);
    }
  }

  /**
   * Open IndexedDB
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${this.config.name}-db`, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {return;}

    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    } catch (error) {
      logger.warn('Failed to clear IndexedDB:', error);
    }
  }
}

// Create multiple cache instances for different data types
export const apiCache = new CachingService({
  name: 'synapse-api',
  maxAge: 30 * 60 * 1000, // 30 minutes
  strategy: 'stale-while-revalidate',
});

export const staticCache = new CachingService({
  name: 'synapse-static',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  strategy: 'cache-first',
});

export const userDataCache = new CachingService({
  name: 'synapse-user',
  maxAge: 60 * 60 * 1000, // 1 hour
  strategy: 'network-first',
});

// Initialize all caches
export const initializeCaching = (): void => {
  apiCache.initialize();
  staticCache.initialize();
  userDataCache.initialize();
  
  logger.info('🗄️ All caches initialized');
};

// Utility functions for cache usage (React hook would be implemented separately)
export const getCacheUtils = (cacheInstance: CachingService = apiCache) => {
  return {
    get: cacheInstance.get.bind(cacheInstance),
    set: cacheInstance.set.bind(cacheInstance),
    delete: cacheInstance.delete.bind(cacheInstance),
    clear: cacheInstance.clear.bind(cacheInstance),
    getStats: cacheInstance.getStats.bind(cacheInstance),
  };
};

export default CachingService;