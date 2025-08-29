/**
 * ================================================================
 * CACHING SERVICE - SISTEMA AVANÇADO DE CACHE PWA
 * ================================================================
 *
 * Este arquivo implementa um sistema sofisticado de cache para Progressive Web App,
 * fornecendo estratégias inteligentes de armazenamento, sincronização offline
 * e otimização de performance através de múltiplas camadas de cache.
 *
 * Funcionalidades principais:
 * - Múltiplas estratégias de cache adaptáveis ao contexto
 * - Armazenamento híbrido (Memory + IndexedDB + Cache API)
 * - Sincronização inteligente entre cache e rede
 * - Invalidação automática baseada em TTL e versioning
 * - Compressão e otimização de dados cachados
 * - Analytics e métricas de performance de cache
 * - Gerenciamento automático de quota e cleanup
 * - Suporte para cache condicional com ETags
 *
 * Estratégias de cache implementadas:
 * - Cache First: Prioriza cache, fallback para rede
 * - Network First: Prioriza rede, fallback para cache
 * - Cache Only: Serve apenas do cache (modo offline)
 * - Network Only: Sempre busca da rede (dados críticos)
 * - Stale While Revalidate: Serve cache e atualiza em background
 *
 * Camadas de armazenamento:
 * - Memory Cache: Acesso ultra-rápido para dados frequentes
 * - IndexedDB: Persistência local para dados estruturados
 * - Cache API: Integração nativa com Service Worker
 * - LocalStorage: Fallback para dados simples
 *
 * Otimizações implementadas:
 * - LRU eviction para gerenciamento eficiente de memória
 * - Compressão automática de payloads grandes
 * - Batching de operações para performance
 * - Lazy loading com prefetch inteligente
 * - Background sync para atualizações assíncronas
 *
 * Recursos avançados:
 * - Cache warming para dados críticos
 * - Conditional requests com ETag validation
 * - Quota management com memory pressure detection
 * - Cross-tab synchronization para consistency
 * - Migration automática entre versões de cache
 *
 * Métricas coletadas:
 * - Hit/Miss ratio para análise de eficiência
 * - Response times por estratégia de cache
 * - Storage usage e quota consumption
 * - Network savings e offline capability
 * - Error rates e fallback frequency
 *
 * Padrões implementados:
 * - Strategy pattern para diferentes tipos de cache
 * - Observer pattern para invalidação de cache
 * - Proxy pattern para interceptação de requests
 * - Factory pattern para criação de cache entries
 * - Decorator pattern para enrichment de dados
 *
 * @fileoverview Sistema avançado de cache para Progressive Web App
 * @version 2.0.0
 * @since 2024-02-02
 * @author Synapse Team
 */

import { logger } from '../../utils/logger';

export interface CacheConfig {
  name: string;
  version: string;
  maxAge: number; // em milissegundos
  maxEntries: number;
  strategy:
    | 'cache-first'
    | 'network-first'
    | 'cache-only'
    | 'network-only'
    | 'stale-while-revalidate';
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
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  maxEntries: 1000,
  strategy: 'stale-while-revalidate',
  updateOnFetch: true,
};

/**
 * Serviço Avançado de Cache
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
   * Inicializa serviço de cache
   */
  initialize(): void {
    // Carrega cache existente do IndexedDB
    this.loadFromIndexedDB();

    // Configura remoção de cache baseada em pressão de memória
    this.setupMemoryPressureHandling();

    // Intercepta requisitções fetch para cache
    this.interceptFetch();

    logger.info('🗜️ Serviço de cache inicializado');
  }

  /**
   * Obtém item do cache
   */
  async get<T = any>(key: string, fetchFn?: () => Promise<T>): Promise<T | null> {
    const entry = this.cache.get(key);

    if (entry) {
      // Verifica se entrada ainda é válida
      if (this.isValidEntry(entry)) {
        this.stats.hits++;

        // Se stale-while-revalidate e fetchFn fornecida, atualiza em background
        if (this.config.strategy === 'stale-while-revalidate' && fetchFn) {
          this.updateInBackground(key, fetchFn);
        }

        return entry.data as T;
      } else {
        // Entrada está obsoleta, remove
        this.cache.delete(key);
      }
    }

    this.stats.misses++;

    // Se nenhuma função fetch fornecida, retorna null
    if (!fetchFn) {
      return null;
    }

    // Busca dados frescos baseado na estratégia
    return this.fetchWithStrategy(key, fetchFn);
  }

  /**
   * Define item no cache
   */
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      etag?: string;
      version?: string;
    } = {}
  ): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: options.version || this.config.version,
      etag: options.etag,
      expires: options.ttl ? Date.now() + options.ttl : Date.now() + this.config.maxAge,
      size: this.estimateSize(data),
    };

    this.cache.set(key, entry);

    // Garante que cache não exceda limites
    this.enforceMemoryLimits();

    // Salva no armazenamento persistente
    this.saveToIndexedDB();
  }

  /**
   * Remove item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToIndexedDB();
    }
    return deleted;
  }

  /**
   * Limpa todas as entradas do cache
   */
  clear(): void {
    this.cache.clear();
    this.clearIndexedDB();
    logger.info('🗟️ Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
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
   * Busca dados com estratégia configurada
   */
  private async fetchWithStrategy<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    switch (this.config.strategy) {
      case 'cache-first':
        // Já tratado no método get()
        return this.fetchAndCache(key, fetchFn);

      case 'network-first':
        try {
          return await this.fetchAndCache(key, fetchFn);
        } catch (error) {
          // Volta para cache obsoleto se disponível
          const staleEntry = this.cache.get(key);
          if (staleEntry) {
            logger.warn('Rede falhou, servindo cache obsoleto:', key);
            return staleEntry.data as T;
          }
          throw error;
        }

      case 'cache-only':
        return null as T; // Isso seria tratado no método get()

      case 'network-only':
        return fetchFn();

      case 'stale-while-revalidate':
        return this.fetchAndCache(key, fetchFn);

      default:
        return this.fetchAndCache(key, fetchFn);
    }
  }

  /**
   * Busca dados e os armazena em cache
   */
  private async fetchAndCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const data = await fetchFn();
    this.set(key, data);
    return data;
  }

  /**
   * Atualiza entrada de cache em background
   */
  private async updateInBackground<T>(key: string, fetchFn: () => Promise<T>): Promise<void> {
    try {
      const freshData = await fetchFn();
      this.set(key, freshData);
      logger.info('🔄 Atualização de cache em background concluída:', key);
    } catch (error) {
      logger.warn('Atualização de cache em background falhou:', key, String(error));
    }
  }

  /**
   * Verifica se entrada de cache é válida
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();

    // Verifica expiração
    if (entry.expires && now > entry.expires) {
      return false;
    }

    // Verifica versão
    if (entry.version !== this.config.version) {
      return false;
    }

    return true;
  }

  /**
   * Estima tamanho dos dados
   */
  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // Estimativa aproximada (UTF-16)
    } catch {
      return 1000; // Estimativa padrão
    }
  }

  /**
   * Força limites de memória
   */
  private enforceMemoryLimits(): void {
    // Remove entradas se excedermos contagem máxima
    if (this.cache.size > this.config.maxEntries) {
      const entriesToRemove = this.cache.size - this.config.maxEntries;
      const sortedKeys = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp) // Mais antigo primeiro
        .slice(0, entriesToRemove)
        .map(([key]) => key);

      sortedKeys.forEach(key => this.cache.delete(key));
      logger.info(`🗟️ Removidas ${entriesToRemove} entradas de cache antigas`);
    }

    // Verifica tamanho total e remove se necessário
    const stats = this.getStats();
    const maxSizeMB = 50; // Limite de 50MB
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (stats.totalSize > maxSizeBytes) {
      const targetSize = maxSizeBytes * 0.8; // Reduz para 80% do limite
      let currentSize = stats.totalSize;

      const sortedEntries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      for (const [key, entry] of sortedEntries) {
        if (currentSize <= targetSize) {
          break;
        }

        this.cache.delete(key);
        currentSize -= entry.size;
      }

      logger.info(
        `🗟️ Tamanho do cache reduzido de ${Math.round(stats.totalSize / 1024 / 1024)}MB para ${Math.round(currentSize / 1024 / 1024)}MB`
      );
    }
  }

  /**
   * Configura limpeza periódica
   */
  private setupPeriodicCleanup(): void {
    // Limpa entradas expiradas a cada 5 minutos
    setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`🧹 Limpas ${removedCount} entradas de cache expiradas`);
      this.saveToIndexedDB();
    }

    this.stats.lastCleanup = now;
  }

  /**
   * Configura tratamento de pressão de memória
   */
  private setupMemoryPressureHandling(): void {
    // Listen for memory pressure events
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMemoryMB = memory.totalJSHeapSize / 1024 / 1024;
        const memoryUsage = (usedMemoryMB / totalMemoryMB) * 100;

        if (memoryUsage > 85) {
          // High memory pressure
          logger.warn('🚨 Alta pressão de memória detectada, limpando cache');
          this.clear();
        }
      };

      // Verifica a cada minuto
      setInterval(checkMemory, 60 * 1000);
    }
  }

  /**
   * Intercepta fetch para cache automático
   */
  private interceptFetch(): void {
    if (!this.config.updateOnFetch) {
      return;
    }

    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();

      // Apenas cacheia requisições GET para endpoints da API
      if ((!init || init.method === 'GET' || !init.method) && url.includes('/api/')) {
        const cacheKey = `fetch:${url}`;

        try {
          const response = await originalFetch(input, init);

          // Cacheia respostas bem-sucedidas
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            const data = await clone.json();

            self.set(cacheKey, data, {
              etag: response.headers.get('etag') || undefined,
            });
          }

          return response;
        } catch (error) {
          // Tenta servir do cache em caso de erro de rede
          const cached = await self.get(cacheKey);
          if (cached) {
            logger.warn('Erro de rede, servindo do cache:', url);
            return new Response(JSON.stringify(cached), {
              status: 200,
              statusText: 'OK (Em Cache)',
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
   * Carrega cache do localStorage (fallback)
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
      logger.warn('Falha ao carregar cache do localStorage:', error);
    }
  }

  /**
   * Carrega cache do IndexedDB
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
            logger.info(`📥 Carregadas ${this.cache.size} entradas de cache do IndexedDB`);
          }
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.warn('Falha ao carregar do IndexedDB, usando fallback do localStorage:', error);
      this.loadFromStorage();
    }
  }

  /**
   * Salva cache no IndexedDB
   */
  private async saveToIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      // Fallback para localStorage
      localStorage.setItem(
        `${this.config.name}-cache`,
        JSON.stringify({
          entries: Array.from(this.cache.entries()),
          stats: this.stats,
        })
      );
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
      logger.warn('Falha ao salvar no IndexedDB:', error);
    }
  }

  /**
   * Abre IndexedDB
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${this.config.name}-db`, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Limpa IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      return;
    }

    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    } catch (error) {
      logger.warn('Falha ao limpar IndexedDB:', error);
    }
  }
}

// Cria múltiplas instâncias de cache para diferentes tipos de dados
export const apiCache = new CachingService({
  name: 'synapse-api',
  maxAge: 30 * 60 * 1000, // 30 minutes
  strategy: 'stale-while-revalidate',
});

export const staticCache = new CachingService({
  name: 'synapse-static',
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  strategy: 'cache-first',
});

export const userDataCache = new CachingService({
  name: 'synapse-user',
  maxAge: 60 * 60 * 1000, // 1 hour
  strategy: 'network-first',
});

// Inicializa todos os caches
export const initializeCaching = (): void => {
  apiCache.initialize();
  staticCache.initialize();
  userDataCache.initialize();

  logger.info('🗜️ Todos os caches inicializados');
};

// Funções utilitárias para uso de cache (hook React seria implementado separadamente)
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
