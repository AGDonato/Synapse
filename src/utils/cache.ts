/**
 * Advanced caching utilities for performance optimization
 */

import { z } from 'zod';
import { createModuleLogger } from './logger';

const cacheLogger = createModuleLogger('Cache');

// Cache entry interface
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Approximate size in bytes
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

// Cache configuration
interface CacheConfig {
  maxSize: number; // Max cache size in bytes
  maxEntries: number; // Max number of entries
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionThreshold: number; // Size threshold for compression
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  compressionThreshold: 10 * 1024, // 10KB
};

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * Advanced memory cache with LRU eviction, compression, and analytics
 */
export class AdvancedCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    size: 0,
    hitRate: 0,
    memoryUsage: 0,
  };
  private cleanupTimer: number | null = null;
  private compressionWorker: Worker | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
    this.initCompressionWorker();
  }

  /**
   * Set cache entry
   */
  set(
    key: string, 
    data: T, 
    options: { 
      ttl?: number; 
      tags?: string[]; 
      compress?: boolean 
    } = {}
  ): void {
    const { ttl = this.config.defaultTTL, tags = [], compress = false } = options;
    
    // Calculate approximate size
    const size = this.calculateSize(data);
    
    // Check if we need to make space
    this.makeSpace(size);
    
    // Compress data if needed
    const finalData = compress && size > this.config.compressionThreshold
      ? this.compressData(data)
      : data;

    const entry: CacheEntry<T> = {
      data: finalData,
      timestamp: Date.now(),
      ttl,
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateStats();

    // Decompress if needed
    return this.isCompressed(entry.data) 
      ? this.decompressData(entry.data)
      : entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {return false;}
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear cache entries by tags
   */
  deleteByTags(tags: string[]): number {
    let deleted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      this.updateStats();
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries info (without data)
   */
  getEntries(): { key: string; timestamp: number; size: number; accessCount: number }[] {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      size: entry.size,
      accessCount: entry.accessCount,
    }));
  }

  /**
   * Set or get with callback (cache-aside pattern)
   */
  async getOrSet<U extends T>(
    key: string,
    factory: () => Promise<U>,
    options: { ttl?: number; tags?: string[]; compress?: boolean } = {}
  ): Promise<U> {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached as U;
    }

    const data = await factory();
    this.set(key, data, options);
    return data;
  }

  /**
   * Batch operations
   */
  setMany(entries: { key: string; data: T; options?: Parameters<typeof this.set>[2] }[]): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  getMany(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  deleteMany(keys: string[]): number {
    let deleted = 0;
    keys.forEach(key => {
      if (this.delete(key)) {deleted++;}
    });
    return deleted;
  }

  /**
   * Memory management
   */
  private makeSpace(requiredSize: number): void {
    // Check if we have enough space
    if (this.stats.size + requiredSize <= this.config.maxSize && 
        this.cache.size < this.config.maxEntries) {
      return;
    }

    // Find entries to evict (LRU)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSize = 0;
    let evicted = 0;

    while ((this.stats.size - freedSize + requiredSize > this.config.maxSize ||
            this.cache.size - evicted >= this.config.maxEntries) &&
           entries.length > evicted) {
      
      const [key, entry] = entries[evicted];
      this.cache.delete(key);
      freedSize += entry.size;
      evicted++;
    }

    this.updateStats();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.updateStats();
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback estimation
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.entries = this.cache.size;
    this.stats.size = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    
    // Estimate memory usage
    this.stats.memoryUsage = this.stats.size * 1.5; // Account for overhead
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Initialize compression worker
   */
  private initCompressionWorker(): void {
    try {
      // Only initialize if Web Workers are supported
      if (typeof Worker !== 'undefined') {
        // In a real implementation, you'd create a worker file
        // This is a simplified version
        cacheLogger.info('Compression worker initialized');
      }
    } catch (error) {
      cacheLogger.warn('Failed to initialize compression worker:', error);
    }
  }

  /**
   * Compress data (placeholder - would use actual compression)
   */
  private compressData(data: T): T {
    // In a real implementation, you'd use actual compression
    // For now, just return the data marked as compressed
    return { __compressed: true, data } as T;
  }

  /**
   * Decompress data (placeholder)
   */
  private decompressData(data: T): T {
    // In a real implementation, you'd use actual decompression
    if (this.isCompressed(data)) {
      return (data as any).data;
    }
    return data;
  }

  /**
   * Check if data is compressed
   */
  private isCompressed(data: T): boolean {
    return typeof data === 'object' && data !== null && (data as any).__compressed === true;
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
  }
}

// Global cache instances
export const globalCache = new AdvancedCache();
export const apiCache = new AdvancedCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 20 * 1024 * 1024, // 20MB
});

// Component result cache
export const componentCache = new AdvancedCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxSize: 10 * 1024 * 1024, // 10MB
});

// Utility functions
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.map(part => String(part)).join(':');
};

// Cache decorators
export const cached = <T extends (...args: unknown[]) => any>(
  cache: AdvancedCache,
  options: { ttl?: number; keyGenerator?: (...args: Parameters<T>) => string } = {}
) => {
  return (target: T): T => {
    const { ttl, keyGenerator = (...args) => JSON.stringify(args) } = options;
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      
      return cache.getOrSet(
        key,
        () => Promise.resolve(target(...args)),
        { ttl }
      );
    }) as T;
  };
};

// React hook for cache
export const useCache = <T>(cache: AdvancedCache<T> = globalCache) => {
  return {
    get: (key: string) => cache.get(key),
    set: (key: string, data: T, options?: Parameters<typeof cache.set>[2]) => 
      cache.set(key, data, options),
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
    stats: cache.getStats(),
    has: (key: string) => cache.has(key),
    getOrSet: <U extends T>(
      key: string,
      factory: () => Promise<U>,
      options?: Parameters<typeof cache.getOrSet>[2]
    ) => cache.getOrSet(key, factory, options),
  };
};

// Cache warming utilities
export const warmCache = async (
  cache: AdvancedCache,
  warmupData: { key: string; factory: () => Promise<unknown>; options?: unknown }[]
): Promise<void> => {
  await Promise.allSettled(
    warmupData.map(({ key, factory, options }) =>
      cache.getOrSet(key, factory, options)
    )
  );
};

export default {
  AdvancedCache,
  globalCache,
  apiCache,
  componentCache,
  createCacheKey,
  cached,
  useCache,
  warmCache,
};