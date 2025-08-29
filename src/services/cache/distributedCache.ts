/**
 * Gerenciador de Cache Distribuído
 *
 * Orquestra múltiplas camadas de cache (Redis, armazenamento do navegador, memória)
 * para performance otimizada em ambientes multi-usuário.
 */

import RedisAdapter, { type CacheOptions, type RedisConfig } from './redisAdapter';
import { analytics } from '../analytics/core';
import { healthMonitor } from '../monitoring/healthCheck';
import { logger } from '../../utils/logger';

// Tipos de camada de cache
type CacheLayer = 'memory' | 'indexeddb' | 'localstorage' | 'redis';

// Tipos de estratégia de cache
type CacheStrategy =
  | 'redis-first'
  | 'memory-first'
  | 'write-through'
  | 'write-behind'
  | 'cache-aside';

// Configuração de cache multi-camada
interface DistributedCacheConfig {
  layers: CacheLayer[];
  strategy: CacheStrategy;
  redis?: Partial<RedisConfig>;
  memory: {
    maxSize: number;
    ttlDefault: number;
  };
  indexedDB: {
    database: string;
    version: number;
    storeName: string;
  };
  localStorage: {
    keyPrefix: string;
    maxSize: number;
  };
  syncInterval: number; // ms
  conflictResolution: 'last-write-wins' | 'version-based' | 'merge';
}

// Entrada de cache com versionamento para resolução de conflitos
interface VersionedCacheEntry<T = any> {
  data: T;
  version: number;
  timestamp: number;
  source: CacheLayer;
  metadata: {
    userId?: string;
    nodeId?: string;
    tags: string[];
    dependencies: string[];
  };
}

// Interface da camada de cache
interface ICacheLayer {
  get<T>(key: string): Promise<VersionedCacheEntry<T> | null>;
  set<T>(key: string, entry: VersionedCacheEntry<T>, options?: CacheOptions): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): Promise<unknown>;
}

// Camada de cache em memória
class MemoryCache implements ICacheLayer {
  private cache = new Map<string, VersionedCacheEntry>();
  private maxSize: number;
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<VersionedCacheEntry<T> | null> {
    const entry = this.cache.get(key) as VersionedCacheEntry<T> | undefined;

    if (entry) {
      // Atualizar ordem de acesso para LRU
      this.accessOrder.set(key, ++this.accessCounter);
      return entry;
    }

    return null;
  }

  async set<T>(key: string, entry: VersionedCacheEntry<T>): Promise<boolean> {
    // Remover se na capacidade máxima
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
    return true;
  }

  async delete(key: string): Promise<boolean> {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  async getStats(): Promise<unknown> {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      accessCounter: this.accessCounter,
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Number.MAX_SAFE_INTEGER;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }
}

// Camada de cache IndexedDB
class IndexedDBCache implements ICacheLayer {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;
  private version: number;

  constructor(dbName: string, storeName: string, version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('version', 'version');
        }
      };
    });
  }

  async get<T>(key: string): Promise<VersionedCacheEntry<T> | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.entry : null);
      };
    });
  }

  async set<T>(key: string, entry: VersionedCacheEntry<T>): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, entry });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async delete(key: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getStats(): Promise<unknown> {
    if (!this.db) {
      return { size: 0 };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ size: request.result });
    });
  }
}

// Camada de cache localStorage
class LocalStorageCache implements ICacheLayer {
  private keyPrefix: string;
  private maxSize: number;

  constructor(keyPrefix: string, maxSize = 100) {
    this.keyPrefix = keyPrefix;
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<VersionedCacheEntry<T> | null> {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const data = localStorage.getItem(`${this.keyPrefix}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('localStorage get error:', error);
      return null;
    }
  }

  async set<T>(key: string, entry: VersionedCacheEntry<T>): Promise<boolean> {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    try {
      // Check size limit
      const currentSize = this.getCurrentSize();
      if (currentSize >= this.maxSize) {
        await this.evictOldest();
      }

      localStorage.setItem(`${this.keyPrefix}${key}`, JSON.stringify(entry));
      return true;
    } catch (error) {
      logger.error('localStorage set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    try {
      localStorage.removeItem(`${this.keyPrefix}${key}`);
      return true;
    } catch (error) {
      logger.error('localStorage delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('localStorage clear error:', error);
    }
  }

  async getStats(): Promise<unknown> {
    if (typeof localStorage === 'undefined') {
      return { size: 0 };
    }

    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          count++;
        }
      }
    } catch (error) {
      logger.error('localStorage stats error:', error);
    }

    return { size: count };
  }

  private getCurrentSize(): number {
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          count++;
        }
      }
    } catch (error) {
      logger.error('getCurrentSize error:', error);
    }
    return count;
  }

  private async evictOldest(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            const entry = JSON.parse(data);
            if (entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
              oldestKey = key;
            }
          }
        }
      }

      if (oldestKey) {
        localStorage.removeItem(oldestKey);
      }
    } catch (error) {
      logger.error('evictOldest error:', error);
    }
  }
}

// Wrapper da camada de cache Redis
class RedisCacheLayer implements ICacheLayer {
  private redis: RedisAdapter;

  constructor(redis: RedisAdapter) {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<VersionedCacheEntry<T> | null> {
    return await this.redis.get<VersionedCacheEntry<T>>(key);
  }

  async set<T>(
    key: string,
    entry: VersionedCacheEntry<T>,
    options?: CacheOptions
  ): Promise<boolean> {
    return await this.redis.set(key, entry, options);
  }

  async delete(key: string): Promise<boolean> {
    return await this.redis.delete(key);
  }

  async clear(): Promise<void> {
    return await this.redis.clear();
  }

  async getStats(): Promise<unknown> {
    return await this.redis.getStats();
  }
}

// Gerenciador principal de cache distribuído
class DistributedCache {
  private config: DistributedCacheConfig;
  private layers = new Map<CacheLayer, ICacheLayer>();
  private redis?: RedisAdapter;
  private syncTimer?: number;
  private nodeId: string;

  constructor(config: Partial<DistributedCacheConfig> = {}) {
    this.nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.config = {
      layers: ['memory', 'indexeddb', 'redis'],
      strategy: 'redis-first',
      memory: {
        maxSize: 1000,
        ttlDefault: 300, // 5 minutes
      },
      indexedDB: {
        database: 'synapse-cache',
        version: 1,
        storeName: 'cache-entries',
      },
      localStorage: {
        keyPrefix: 'synapse:cache:',
        maxSize: 100,
      },
      syncInterval: 30000, // 30 seconds
      conflictResolution: 'version-based',
      ...config,
    };

    this.initializeLayers();
    this.startSyncProcess();
  }

  private initializeLayers(): void {
    for (const layerType of this.config.layers) {
      switch (layerType) {
        case 'memory':
          this.layers.set('memory', new MemoryCache(this.config.memory.maxSize));
          break;

        case 'indexeddb':
          this.layers.set(
            'indexeddb',
            new IndexedDBCache(
              this.config.indexedDB.database,
              this.config.indexedDB.storeName,
              this.config.indexedDB.version
            )
          );
          break;

        case 'localstorage':
          this.layers.set(
            'localstorage',
            new LocalStorageCache(
              this.config.localStorage.keyPrefix,
              this.config.localStorage.maxSize
            )
          );
          break;

        case 'redis':
          if (this.config.redis) {
            this.redis = new RedisAdapter({
              host: 'localhost',
              port: 6379,
              maxRetries: 3,
              retryDelayOnFailover: 100,
              enableOfflineQueue: false,
              maxRetriesPerRequest: 3,
              lazyConnect: true,
              keepAlive: 30000,
              family: 4,
              ...this.config.redis,
            });
            this.layers.set('redis', new RedisCacheLayer(this.redis));
          }
          break;
      }
    }
  }

  private startSyncProcess(): void {
    if (this.config.syncInterval > 0) {
      this.syncTimer = window.setInterval(() => {
        this.syncLayers().catch(error => {
          logger.error('Cache sync error:', error);
        });
      }, this.config.syncInterval);
    }
  }

  /**
   * Obter dados do cache usando estratégia configurada
   */
  async get<T>(key: string): Promise<T | null> {
    const layersToCheck = this.getLayersInOrder();

    for (const layerType of layersToCheck) {
      const layer = this.layers.get(layerType);
      if (!layer) {
        continue;
      }

      try {
        const entry = await layer.get<T>(key);
        if (entry && this.isEntryValid(entry)) {
          // Popular camadas de maior prioridade
          await this.populateUpperLayers(key, entry, layerType);

          analytics.track('cache_hit', {
            key,
            layer: layerType,
            strategy: this.config.strategy,
          });

          healthMonitor.addHealthCheck(() => ({
            name: 'cache_hit_rate',
            status: 'healthy' as const,
            value: 1,
            timestamp: Date.now(),
          }));

          return entry.data;
        }
      } catch (error) {
        logger.error(`Cache get error from ${layerType}:`, error);
        continue;
      }
    }

    analytics.track('cache_miss', {
      key,
      strategy: this.config.strategy,
    });

    healthMonitor.addHealthCheck(() => ({
      name: 'cache_miss_rate',
      status: 'healthy' as const,
      value: 0,
      timestamp: Date.now(),
    }));

    return null;
  }

  /**
   * Definir dados no cache usando estratégia configurada
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions & { userId?: string } = {}
  ): Promise<boolean> {
    const entry: VersionedCacheEntry<T> = {
      data,
      version: Date.now(), // Simple versioning
      timestamp: Date.now(),
      source: this.getPreferredWriteLayer(),
      metadata: {
        userId: options.userId,
        nodeId: this.nodeId,
        tags: options.tags || [],
        dependencies: [],
      },
    };

    let success = false;
    const layersToWrite = this.getWriteLayers();

    for (const layerType of layersToWrite) {
      const layer = this.layers.get(layerType);
      if (!layer) {
        continue;
      }

      try {
        const result = await layer.set(key, entry, options);
        if (result) {
          success = true;

          analytics.track('cache_set', {
            key,
            layer: layerType,
            size: this.estimateSize(data),
            strategy: this.config.strategy,
          });
        }
      } catch (error) {
        logger.error(`Cache set error in ${layerType}:`, error);
      }
    }

    return success;
  }

  /**
   * Deletar dados de todas as camadas de cache
   */
  async delete(key: string): Promise<boolean> {
    let anySuccess = false;

    for (const [layerType, layer] of this.layers.entries()) {
      try {
        const result = await layer.delete(key);
        if (result) {
          anySuccess = true;

          analytics.track('cache_delete', {
            key,
            layer: layerType,
          });
        }
      } catch (error) {
        logger.error(`Cache delete error in ${layerType}:`, error);
      }
    }

    return anySuccess;
  }

  /**
   * Limpar todas as camadas de cache
   */
  async clear(): Promise<void> {
    for (const [layerType, layer] of this.layers.entries()) {
      try {
        await layer.clear();

        analytics.track('cache_clear', {
          layer: layerType,
        });
      } catch (error) {
        logger.error(`Cache clear error in ${layerType}:`, error);
      }
    }
  }

  /**
   * Obter estatísticas abrangentes do cache
   */
  async getStats(): Promise<Record<string, unknown>> {
    const stats: Record<string, unknown> = {};

    for (const [layerType, layer] of this.layers.entries()) {
      try {
        stats[layerType] = await layer.getStats();
      } catch (error) {
        stats[layerType] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Add Redis connection status if available
    if (this.redis && stats.redis && typeof stats.redis === 'object') {
      (stats.redis as Record<string, unknown>).connected = this.redis.isConnectionActive();
      (stats.redis as Record<string, unknown>).health = await this.redis.getHealthStatus();
    }

    stats.config = {
      strategy: this.config.strategy,
      layers: this.config.layers,
      nodeId: this.nodeId,
      syncInterval: this.config.syncInterval,
    };

    return stats;
  }

  /**
   * Padrões avançados de cache
   */

  // Cache-aside com suporte multi-camada
  async cacheAside<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions & { userId?: string } = {}
  ): Promise<T> {
    // Tentar cache primeiro
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Buscar da fonte
    try {
      const data = await fetchFunction();

      // Armazenar no cache
      await this.set(key, data, options);

      return data;
    } catch (error) {
      logger.error('Cache-aside fetch error:', error);
      throw error;
    }
  }

  // Bloqueio distribuído para seções críticas
  async withLock<T>(resource: string, operation: () => Promise<T>, timeout = 5000): Promise<T> {
    if (!this.redis) {
      // Fallback: apenas executar a operação (sem bloqueio distribuído)
      return await operation();
    }

    const lockValue = await this.redis.acquireLock(resource, 10000, timeout);
    if (!lockValue) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      return await operation();
    } finally {
      await this.redis.releaseLock(resource, lockValue);
    }
  }

  /**
   * Métodos auxiliares privados
   */

  private getLayersInOrder(): CacheLayer[] {
    switch (this.config.strategy) {
      case 'redis-first':
        return (['redis', 'memory', 'indexeddb', 'localstorage'] as CacheLayer[]).filter(l =>
          this.config.layers.includes(l)
        );

      case 'memory-first':
        return (['memory', 'indexeddb', 'localstorage', 'redis'] as CacheLayer[]).filter(l =>
          this.config.layers.includes(l)
        );

      default:
        return this.config.layers;
    }
  }

  private getWriteLayers(): CacheLayer[] {
    switch (this.config.strategy) {
      case 'write-through':
        return this.config.layers; // Escrever em todas as camadas

      case 'write-behind':
        return ['memory']; // Escrever na camada rápida primeiro, sincronizar depois

      default:
        return this.config.layers;
    }
  }

  private getPreferredWriteLayer(): CacheLayer {
    if (this.config.layers.includes('redis')) {
      return 'redis';
    }
    if (this.config.layers.includes('memory')) {
      return 'memory';
    }
    if (this.config.layers.includes('indexeddb')) {
      return 'indexeddb';
    }
    return 'localstorage';
  }

  private isEntryValid<T>(entry: VersionedCacheEntry<T>): boolean {
    // Adicionar lógica de validação TTL aqui se necessário
    return true;
  }

  private async populateUpperLayers<T>(
    key: string,
    entry: VersionedCacheEntry<T>,
    sourceLayer: CacheLayer
  ): Promise<void> {
    const layers = this.getLayersInOrder();
    const sourceIndex = layers.indexOf(sourceLayer);

    if (sourceIndex <= 0) {
      return;
    } // Já na camada superior

    // Popular camadas acima da fonte
    for (let i = 0; i < sourceIndex; i++) {
      const layer = this.layers.get(layers[i]);
      if (layer) {
        try {
          await layer.set(key, entry);
        } catch (error) {
          logger.error(`Failed to populate layer ${layers[i]}:`, error);
        }
      }
    }
  }

  private async syncLayers(): Promise<void> {
    // Implementar lógica de sincronização de camadas
    // Isso pode envolver comparação de versões e resolução de conflitos
    logger.debug('Sincronizando camadas de cache...');

    analytics.track('cache_sync_started', {
      nodeId: this.nodeId,
      layers: this.config.layers,
    });
  }

  private estimateSize(data: unknown): number {
    try {
      return new TextEncoder().encode(JSON.stringify(data)).length;
    } catch {
      return 0;
    }
  }

  /**
   * Limpar recursos
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }
}

// Função de fábrica
export function createDistributedCache(config?: Partial<DistributedCacheConfig>): DistributedCache {
  return new DistributedCache(config);
}

// Instância global de cache
let globalDistributedCache: DistributedCache | null = null;

export function getGlobalDistributedCache(): DistributedCache {
  if (!globalDistributedCache) {
    globalDistributedCache = createDistributedCache({
      layers: ['memory', 'indexeddb', 'redis'],
      strategy: 'redis-first',
      redis: {
        host: import.meta.env.VITE_REDIS_HOST || 'localhost',
        port: Number(import.meta.env.VITE_REDIS_PORT) || 6379,
        password: import.meta.env.VITE_REDIS_PASSWORD,
        keyPrefix: 'synapse:distributed:',
      },
    });
  }

  return globalDistributedCache;
}

export default DistributedCache;
export type { DistributedCacheConfig, VersionedCacheEntry, CacheLayer };
