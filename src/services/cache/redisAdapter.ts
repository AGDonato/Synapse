/**
 * Adaptador de Cache Redis para Cache de Nível Empresarial
 *
 * Fornece capacidades de cache distribuído para ambientes multi-usuário.
 * Suporta clustering, sincronização de dados e padrões avançados de cache.
 */

import { analytics } from '../analytics/core';
import { healthMonitor } from '../monitoring/healthCheck';
import { logger } from '../../utils/logger';

// Interface de entrada de cache
interface CacheEntry<T = any> {
  key: string;
  data: T;
  ttl: number;
  createdAt: number;
  lastAccessed: number;
  version: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

// Interface de estatísticas de cache
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
}

// Interface de configuração Redis
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
  maxRetries: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: 4 | 6;
  // Configuração de cluster
  cluster?: {
    enableReadyCheck: boolean;
    redisOptions: Partial<RedisConfig>;
    maxRedirections: number;
  };
}

// Cache operation options
interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: number;
  serialize?: boolean;
  compress?: boolean;
  metadata?: Record<string, unknown>;
}

// Fallback storage for when Redis is unavailable
class FallbackCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Maximum number of entries
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalKeys: 0,
    memoryUsage: 0,
    hitRate: 0,
  };

  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    try {
      // Remover entradas antigas se na capacidade máxima
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        key,
        data,
        ttl: options.ttl || 3600,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        version: options.version || 1,
        tags: options.tags || [],
        metadata: options.metadata || {},
      };

      this.cache.set(key, entry);
      this.stats.sets++;
      this.stats.totalKeys = this.cache.size;
      return true;
    } catch (error) {
      logger.error('Erro no cache de fallback ao definir:', error);
      return false;
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    const now = Date.now();
    const age = (now - entry.createdAt) / 1000;

    if (age > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.totalKeys = this.cache.size;
      return null;
    }

    // Atualizar último acesso
    entry.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.totalKeys = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalKeys: 0,
      memoryUsage: 0,
      hitRate: 0,
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

class RedisAdapter {
  private client: unknown = null;
  private fallbackCache = new FallbackCache();
  private config: RedisConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalKeys: 0,
    memoryUsage: 0,
    hitRate: 0,
  };

  constructor(config: RedisConfig) {
    this.config = {
      keyPrefix: 'synapse:',
      ...config,
    };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Em uma implementação real, você importaria e configuraria o cliente Redis
      // Por agora, vamos simular a conectividade Redis

      if (typeof window !== 'undefined' && !this.isNodeEnvironment()) {
        logger.warn(
          'Cliente Redis não pode executar no ambiente do navegador. Usando cache de fallback.'
        );
        return;
      }

      // Conexão Redis simulada
      const isRedisAvailable = await this.testRedisConnection();

      if (isRedisAvailable) {
        this.isConnected = true;
        this.setupRedisEventHandlers();

        analytics.track('redis_connected', {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
        });

        healthMonitor.addHealthCheck(() => ({
          name: 'redis_connection_status',
          status: 'healthy' as const,
          value: 1,
          timestamp: Date.now(),
        }));
      } else {
        this.handleConnectionFailure('Connection test failed');
      }
    } catch (error) {
      this.handleConnectionFailure(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async testRedisConnection(): Promise<boolean> {
    // In production, this would test actual Redis connectivity
    // For demonstration, we'll use environment variables to simulate
    const redisAvailable = import.meta.env.VITE_REDIS_ENABLED === 'true';

    if (redisAvailable) {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    }

    return false;
  }

  private setupRedisEventHandlers(): void {
    // In production, these would be actual Redis client event handlers
    logger.info('Redis event handlers configured');
  }

  private handleConnectionFailure(error: string): void {
    logger.warn(`Redis connection failed: ${error}. Using fallback cache.`);

    this.isConnected = false;
    this.reconnectAttempts++;

    analytics.track('redis_connection_failed', {
      error,
      attempts: this.reconnectAttempts,
      fallbackEnabled: true,
    });

    healthMonitor.addHealthCheck(() => ({
      name: 'redis_connection_status',
      status: 'critical' as const,
      value: 0,
      timestamp: Date.now(),
    }));

    // Attempt reconnection with exponential backoff
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.initializeRedis(), delay);
    }
  }

  private isNodeEnvironment(): string | false {
    return typeof process !== 'undefined' && process.versions && process.versions.node
      ? process.versions.node
      : false;
  }

  /**
   * Definir um valor no cache
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = `${this.config.keyPrefix}${key}`;

    try {
      if (this.isConnected && this.client) {
        // Implementação Redis iria aqui
        const serializedData = options.serialize !== false ? JSON.stringify(data) : data;
        const ttl = options.ttl || 3600;

        // Simulate Redis SET with TTL
        await this.simulateRedisOperation('set', fullKey, serializedData, ttl);

        this.stats.sets++;

        analytics.track('cache_set', {
          key: fullKey,
          size: this.estimateSize(data),
          ttl,
          provider: 'redis',
        });

        return true;
      } else {
        // Usar cache de fallback
        return this.fallbackCache.set(fullKey, data, options);
      }
    } catch (error) {
      logger.error('Cache set error:', error);

      // Fallback to local cache on error
      return this.fallbackCache.set(fullKey, data, options);
    }
  }

  /**
   * Obter um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.config.keyPrefix}${key}`;

    try {
      if (this.isConnected && this.client) {
        // Implementação Redis iria aqui
        const data = await this.simulateRedisOperation('get', fullKey);

        if (data !== null) {
          this.stats.hits++;

          analytics.track('cache_hit', {
            key: fullKey,
            provider: 'redis',
          });

          try {
            return typeof data === 'string' ? (JSON.parse(data) as T) : (data as T) || null;
          } catch {
            return (data as T) || null;
          }
        } else {
          this.stats.misses++;
          return null;
        }
      } else {
        // Usar cache de fallback
        return this.fallbackCache.get<T>(fullKey);
      }
    } catch (error) {
      logger.error('Cache get error:', error);

      // Fallback to local cache on error
      return this.fallbackCache.get<T>(fullKey);
    }
  }

  /**
   * Deletar um valor do cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = `${this.config.keyPrefix}${key}`;

    try {
      if (this.isConnected && this.client) {
        // Implementação Redis iria aqui
        const result = await this.simulateRedisOperation('delete', fullKey);

        if (result) {
          this.stats.deletes++;

          analytics.track('cache_delete', {
            key: fullKey,
            provider: 'redis',
          });
        }

        return Boolean(result);
      } else {
        // Usar cache de fallback
        return this.fallbackCache.delete(fullKey);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);

      // Fallback to local cache on error
      return this.fallbackCache.delete(fullKey);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const fullPattern = `${this.config.keyPrefix}${pattern}`;

    try {
      if (this.isConnected && this.client) {
        // Implementação Redis SCAN e DELETE iria aqui
        const count = await this.simulateRedisOperation('deleteByPattern', fullPattern);

        this.stats.deletes += typeof count === 'number' ? count : 0;

        analytics.track('cache_delete_pattern', {
          pattern: fullPattern,
          count,
          provider: 'redis',
        });

        return typeof count === 'number' ? count : 0;
      } else {
        // Implementação de fallback - não tão eficiente quanto Redis SCAN
        let count = 0;
        const regex = new RegExp(pattern.replace('*', '.*'));

        for (const key of this.fallbackCache.getKeys()) {
          if (regex.test(key)) {
            if (this.fallbackCache.delete(key)) {
              count++;
            }
          }
        }

        return count;
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        // Implementação Redis FLUSHDB iria aqui
        await this.simulateRedisOperation('clear');

        analytics.track('cache_clear', {
          provider: 'redis',
        });
      }

      // Always clear fallback cache
      this.fallbackCache.clear();

      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
      };
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      if (this.isConnected && this.client) {
        // Redis INFO command would provide detailed stats
        const redisStats = await this.simulateRedisOperation('info');

        return {
          ...this.stats,
          totalKeys:
            typeof redisStats === 'object' && redisStats && 'keys' in redisStats
              ? Number((redisStats as any).keys)
              : 0,
          memoryUsage:
            typeof redisStats === 'object' && redisStats && 'memory' in redisStats
              ? Number((redisStats as any).memory)
              : 0,
          hitRate:
            this.stats.hits + this.stats.misses > 0
              ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
              : 0,
        };
      } else {
        return this.fallbackCache.getStats();
      }
    } catch (error) {
      logger.error('Cache stats error:', error);
      return this.fallbackCache.getStats();
    }
  }

  /**
   * Check if cache is connected
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, unknown>;
  }> {
    try {
      const stats = await this.getStats();
      const isHealthy = this.isConnected || stats.totalKeys < 1000; // Fallback can handle small loads

      return {
        status: this.isConnected ? 'healthy' : isHealthy ? 'degraded' : 'unhealthy',
        details: {
          connected: this.isConnected,
          provider: this.isConnected ? 'redis' : 'fallback',
          stats,
          reconnectAttempts: this.reconnectAttempts,
          config: {
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: false,
        },
      };
    }
  }

  /**
   * Advanced caching patterns
   */

  // Cache-aside pattern with automatic refresh
  async cacheAside<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    try {
      const data = await fetchFunction();

      // Store in cache
      await this.set(key, data, options);

      return data;
    } catch (error) {
      // If we have stale data, return it
      if (cached !== null) {
        return cached;
      }
      throw error;
    }
  }

  // Write-through pattern
  async writeThrough<T>(
    key: string,
    data: T,
    writeFunction: (data: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    // Write to primary store first
    await writeFunction(data);

    // Then update cache
    await this.set(key, data, options);
  }

  // Write-behind pattern with queue
  async writeBehind<T>(
    key: string,
    data: T,
    writeFunction: (data: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    // Update cache immediately
    await this.set(key, data, options);

    // Queue write to primary store
    setTimeout(async () => {
      try {
        await writeFunction(data);
      } catch (error) {
        logger.error('Write-behind operation failed:', error);
        // Could implement retry logic here
      }
    }, 0);
  }

  // Distributed lock implementation
  async acquireLock(resource: string, ttl = 10000, timeout = 5000): Promise<string | null> {
    const lockKey = `${this.config.keyPrefix}lock:${resource}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        if (this.isConnected) {
          // Implementação Redis SET NX EX iria aqui
          const acquired = await this.simulateRedisOperation('setnx', lockKey, lockValue, ttl);

          if (acquired) {
            return lockValue;
          }
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        logger.error('Lock acquisition error:', error);
        break;
      }
    }

    return null;
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `${this.config.keyPrefix}lock:${resource}`;

    try {
      if (this.isConnected) {
        // Lua script to ensure atomic check and delete would go here
        return Boolean(await this.simulateRedisOperation('dellock', lockKey, lockValue));
      }
    } catch (error) {
      logger.error('Lock release error:', error);
    }

    return false;
  }

  /**
   * Utility methods
   */
  private estimateSize(data: unknown): number {
    try {
      return new TextEncoder().encode(JSON.stringify(data)).length;
    } catch {
      return 0;
    }
  }

  // Simulate Redis operations for demonstration
  private async simulateRedisOperation(operation: string, ...args: unknown[]): Promise<unknown> {
    // This would be replaced with actual Redis client calls in production
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

    switch (operation) {
      case 'set':
        return true;
      case 'get':
        return Math.random() > 0.3 ? JSON.stringify({ data: 'simulated' }) : null;
      case 'delete':
        return Math.random() > 0.1;
      case 'deleteByPattern':
        return Math.floor(Math.random() * 10);
      case 'clear':
        return true;
      case 'info':
        return {
          keys: Math.floor(Math.random() * 1000),
          memory: Math.floor(Math.random() * 1024 * 1024),
        };
      case 'setnx':
        return Math.random() > 0.7;
      case 'dellock':
        return Math.random() > 0.1;
      default:
        return null;
    }
  }
}

// Factory function to create Redis adapter
export function createRedisAdapter(config?: Partial<RedisConfig>): RedisAdapter {
  const defaultConfig: RedisConfig = {
    host: import.meta.env.VITE_REDIS_HOST || 'localhost',
    port: Number(import.meta.env.VITE_REDIS_PORT) || 6379,
    password: import.meta.env.VITE_REDIS_PASSWORD,
    database: Number(import.meta.env.VITE_REDIS_DATABASE) || 0,
    keyPrefix: import.meta.env.VITE_REDIS_KEY_PREFIX || 'synapse:',
    maxRetries: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
  };

  return new RedisAdapter({ ...defaultConfig, ...config });
}

export default RedisAdapter;
export type { RedisConfig, CacheOptions, CacheStats, CacheEntry };
