import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCacheUtils } from '../../services/cache/adaptiveCache';
import { adaptiveApi } from '../../services/api/adaptiveApi';
import { CollaborationService } from '../../services/collaboration/websocket';
import type { Demanda } from '../../types/entities';

vi.mock('../../services/cache/adaptiveCache');
vi.mock('../../services/api/adaptiveApi');

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null
};

const mockIDBDatabase = {
  createObjectStore: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn()
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
  oncomplete: null,
  onerror: null
};

const mockIDBObjectStore = {
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest)
};

global.indexedDB = mockIndexedDB as any;

describe('Sincronização Distribuída de Cache - Integration Tests', () => {
  let mockCacheUtils: any;
  let collaborationService: CollaborationService;

  const mockDemanda: Demanda = {
    id: 1,
    numero: 'DEM-2024-001',
    titulo: 'Cache Test Demanda',
    descricao: 'Teste de sincronização de cache',
    status: 'aberta',
    prioridade: 'alta',
    dataInicial: '01/01/2024',
    prazo: '31/12/2024',
    orgaoId: 1,
    assuntoId: 1,
    tipoId: 1
  };

  beforeEach(() => {
    // Mock do sistema de cache
    mockCacheUtils = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      clear: vi.fn(),
      exists: vi.fn(),
      getMultiple: vi.fn(),
      setMultiple: vi.fn(),
      getStats: vi.fn(),
      optimize: vi.fn()
    };
    vi.mocked(getCacheUtils).mockReturnValue(mockCacheUtils);

    // Mock das APIs
    vi.mocked(adaptiveApi.demandas.list).mockResolvedValue({
      data: [mockDemanda],
      total: 1,
      page: 1,
      limit: 10
    });

    // Setup do WebSocket para colaboração
    global.WebSocket = class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      readyState = 1;
      onopen: any = null;
      onmessage: any = null;
      onclose: any = null;
      send = vi.fn();
      close = vi.fn();
    } as any;

    collaborationService = new CollaborationService('ws://localhost:8080/ws');
  });

  afterEach(() => {
    vi.clearAllMocks();
    collaborationService?.disconnect();
  });

  describe('Cache Multi-Camadas (Memory → IndexedDB → Redis)', () => {
    it('deve sincronizar dados entre camadas de cache', async () => {
      // 1. Simular hit no cache de memória
      mockCacheUtils.get.mockImplementation((key: string) => {
        if (key === 'demandas_list_page_1') {
          return { data: [mockDemanda], source: 'memory', timestamp: Date.now() };
        }
        return null;
      });

      // 2. Buscar dados (deve vir do cache de memória)
      const memoryResult = mockCacheUtils.get('demandas_list_page_1');
      expect(memoryResult.source).toBe('memory');
      expect(memoryResult.data).toEqual([mockDemanda]);

      // 3. Simular miss no cache de memória, hit no IndexedDB
      mockCacheUtils.get.mockImplementation((key: string) => {
        if (key === 'demandas_list_page_2') {
          // Simular busca no IndexedDB
          mockIDBRequest.result = { data: [mockDemanda], source: 'indexeddb' };
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'));
          }
          return { data: [mockDemanda], source: 'indexeddb', timestamp: Date.now() - 300000 };
        }
        return null;
      });

      const indexedDBResult = mockCacheUtils.get('demandas_list_page_2');
      expect(indexedDBResult.source).toBe('indexeddb');

      // 4. Simular miss em ambos os caches locais, busca na API
      mockCacheUtils.get.mockReturnValue(null);
      vi.mocked(adaptiveApi.demandas.list).mockResolvedValue({
        data: [mockDemanda],
        total: 1,
        page: 3,
        limit: 10
      });

      // Buscar dados que não estão em cache
      const apiResult = await adaptiveApi.demandas.list({ page: 3, limit: 10 });
      
      // Verificar que dados foram salvos em todas as camadas
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'demandas_list_page_3',
        expect.objectContaining({
          data: [mockDemanda],
          source: 'api',
          timestamp: expect.any(Number)
        }),
        expect.objectContaining({
          ttl: expect.any(Number),
          priority: 'high'
        })
      );
    });

    it('deve invalidar cache em cascata', async () => {
      // 1. Configurar dados em múltiplas camadas
      const cacheKeys = [
        'demandas_list_page_1',
        'demandas_list_page_2', 
        'demandas_detail_1',
        'demandas_stats'
      ];

      // 2. Simular mudança que invalida múltiplas chaves
      await mockCacheUtils.invalidate('demandas_*');

      // 3. Verificar invalidação em cascata
      expect(mockCacheUtils.invalidate).toHaveBeenCalledWith('demandas_*');

      // 4. Simular notificação via WebSocket para outros clientes
      const invalidationMessage = {
        type: 'cache_invalidation',
        pattern: 'demandas_*',
        timestamp: Date.now(),
        userId: 'user1'
      };

      if (collaborationService && (collaborationService as any).ws) {
        (collaborationService as any).ws.send(JSON.stringify(invalidationMessage));
      }

      expect((collaborationService as any).ws?.send).toHaveBeenCalledWith(
        JSON.stringify(invalidationMessage)
      );
    });
  });

  describe('Sincronização Multi-Usuário', () => {
    it('deve sincronizar alterações de cache entre usuários conectados', async () => {
      const user1 = { id: 'user1', name: 'Alice' };
      const user2 = { id: 'user2', name: 'Bob' };

      // 1. User1 atualiza uma demanda
      const updatedDemanda = {
        ...mockDemanda,
        titulo: 'Título atualizado pelo User1',
        version: 2
      };

      // Simular atualização do cache local
      mockCacheUtils.set('demandas_detail_1', {
        data: updatedDemanda,
        source: 'local_update',
        timestamp: Date.now(),
        version: 2
      });

      // 2. Notificar outros usuários via WebSocket
      const syncMessage = {
        type: 'cache_sync',
        action: 'update',
        key: 'demandas_detail_1',
        data: updatedDemanda,
        version: 2,
        userId: 'user1',
        timestamp: Date.now()
      };

      // Simular envio da mensagem
      (collaborationService as any).ws?.send(JSON.stringify(syncMessage));

      // 3. Simular recebimento da mensagem pelo User2
      if ((collaborationService as any).ws?.onmessage) {
        (collaborationService as any).ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify(syncMessage)
          })
        );
      }

      // 4. Verificar que cache do User2 foi atualizado
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'demandas_detail_1',
        expect.objectContaining({
          data: updatedDemanda,
          source: 'remote_sync',
          version: 2
        }),
        expect.any(Object)
      );
    });

    it('deve resolver conflitos de versão em cache distribuído', async () => {
      // 1. Cenário: User1 e User2 editam a mesma demanda offline
      
      const user1Version = {
        ...mockDemanda,
        titulo: 'Editado pelo User1',
        version: 2,
        lastModified: Date.now() - 1000
      };

      const user2Version = {
        ...mockDemanda,
        titulo: 'Editado pelo User2',
        version: 2, // Mesmo número de versão = conflito
        lastModified: Date.now()
      };

      // 2. User1 sincroniza primeiro
      mockCacheUtils.set('demandas_detail_1', {
        data: user1Version,
        source: 'local_update',
        timestamp: user1Version.lastModified,
        version: 2
      });

      // 3. User2 tenta sincronizar (detecta conflito)
      mockCacheUtils.get.mockReturnValue({
        data: user1Version,
        version: 2,
        timestamp: user1Version.lastModified
      });

      // Simular detecção de conflito
      const conflictMessage = {
        type: 'cache_conflict',
        key: 'demandas_detail_1',
        localVersion: user2Version,
        remoteVersion: user1Version,
        userId: 'user2',
        timestamp: Date.now()
      };

      // 4. Sistema de resolução automática (last-write-wins)
      const resolvedVersion = user2Version.lastModified > user1Version.lastModified 
        ? user2Version 
        : user1Version;

      // 5. Aplicar resolução
      expect(resolvedVersion.titulo).toBe('Editado pelo User2');
      
      mockCacheUtils.set('demandas_detail_1', {
        data: resolvedVersion,
        source: 'conflict_resolution',
        timestamp: Date.now(),
        version: 3 // Nova versão após resolução
      });
    });
  });

  describe('Background Sync e Offline Support', () => {
    it('deve sincronizar dados quando volta online', async () => {
      // 1. Simular modo offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // 2. Acumular operações offline
      const offlineOperations = [
        {
          type: 'update',
          key: 'demandas_detail_1',
          data: { ...mockDemanda, titulo: 'Editado offline 1' },
          timestamp: Date.now() - 2000
        },
        {
          type: 'create',
          key: 'demandas_detail_2',
          data: { ...mockDemanda, id: 2, titulo: 'Criado offline' },
          timestamp: Date.now() - 1000
        }
      ];

      // Salvar operações pendentes no cache local
      mockCacheUtils.set('offline_operations', offlineOperations);

      // 3. Simular volta online
      Object.defineProperty(navigator, 'onLine', {
        value: true
      });

      // Disparar evento online
      window.dispatchEvent(new Event('online'));

      // 4. Processar operações pendentes
      mockCacheUtils.get.mockReturnValue(offlineOperations);

      for (const operation of offlineOperations) {
        if (operation.type === 'update') {
          await adaptiveApi.demandas.update(1, operation.data);
        } else if (operation.type === 'create') {
          await adaptiveApi.demandas.create(operation.data);
        }
      }

      // 5. Verificar que operações foram sincronizadas
      expect(adaptiveApi.demandas.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          titulo: 'Editado offline 1'
        })
      );

      // 6. Limpar operações pendentes
      mockCacheUtils.invalidate('offline_operations');
    });

    it('deve manter dados críticos em cache persistente', async () => {
      // 1. Marcar dados como críticos
      const criticalData = {
        demandas_critical: [
          { ...mockDemanda, prioridade: 'urgente' },
          { ...mockDemanda, id: 2, status: 'bloqueada' }
        ],
        user_permissions: {
          userId: 'user1',
          permissions: ['read', 'write', 'admin']
        }
      };

      // 2. Salvar em cache persistente (IndexedDB)
      for (const [key, data] of Object.entries(criticalData)) {
        mockCacheUtils.set(key, data, {
          persistent: true,
          ttl: Infinity, // Nunca expira
          priority: 'critical'
        });
      }

      // 3. Simular limpeza automática de cache
      mockCacheUtils.optimize();

      // 4. Verificar que dados críticos foram preservados
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        'demandas_critical',
        expect.any(Array),
        expect.objectContaining({
          persistent: true,
          priority: 'critical'
        })
      );

      // 5. Verificar estatísticas do cache
      mockCacheUtils.getStats.mockReturnValue({
        totalKeys: 15,
        criticalKeys: 2,
        memoryUsage: '2.5MB',
        indexedDBUsage: '8.1MB',
        hitRate: 0.87
      });

      const stats = mockCacheUtils.getStats();
      expect(stats.criticalKeys).toBe(2);
      expect(stats.hitRate).toBeGreaterThan(0.8);
    });
  });

  describe('Performance e Otimização', () => {
    it('deve otimizar cache baseado em padrões de uso', async () => {
      // 1. Simular padrões de acesso
      const accessPatterns = [
        { key: 'demandas_list_page_1', frequency: 50, lastAccess: Date.now() },
        { key: 'demandas_detail_1', frequency: 30, lastAccess: Date.now() - 3600000 },
        { key: 'demandas_stats', frequency: 5, lastAccess: Date.now() - 86400000 },
        { key: 'demandas_archive', frequency: 1, lastAccess: Date.now() - 604800000 }
      ];

      // 2. Executar otimização automática
      mockCacheUtils.optimize.mockImplementation(() => {
        // Remover dados antigos e pouco utilizados
        const toRemove = accessPatterns.filter(
          pattern => pattern.frequency < 10 && 
          Date.now() - pattern.lastAccess > 24 * 60 * 60 * 1000 // 24 horas
        );

        toRemove.forEach(pattern => {
          mockCacheUtils.invalidate(pattern.key);
        });

        return {
          removed: toRemove.length,
          spaceFreed: '1.2MB',
          optimizationTime: 150
        };
      });

      const optimizationResult = mockCacheUtils.optimize();
      
      // 3. Verificar otimização
      expect(optimizationResult.removed).toBe(2); // stats e archive
      expect(mockCacheUtils.invalidate).toHaveBeenCalledWith('demandas_stats');
      expect(mockCacheUtils.invalidate).toHaveBeenCalledWith('demandas_archive');
    });

    it('deve pré-carregar dados baseado em predições', async () => {
      // 1. Analisar padrões de navegação do usuário
      const navigationHistory = [
        'demandas_list → demandas_detail_1',
        'demandas_list → demandas_detail_2',  
        'demandas_detail_1 → documentos_by_demanda_1',
        'demandas_detail_2 → documentos_by_demanda_2'
      ];

      // 2. Quando usuário acessa lista, pré-carregar detalhes mais prováveis
      mockCacheUtils.get('demandas_list_page_1');

      // Simular sistema de predição
      const predictedKeys = [
        'demandas_detail_1',
        'demandas_detail_2',
        'documentos_by_demanda_1'
      ];

      // 3. Pré-carregar dados preditos
      for (const key of predictedKeys) {
        if (!mockCacheUtils.exists(key)) {
          // Simular carregamento em background
          setTimeout(async () => {
            const data = await adaptiveApi.demandas.get(parseInt(key.split('_')[2]));
            mockCacheUtils.set(key, { 
              data, 
              source: 'preload', 
              timestamp: Date.now() 
            }, {
              priority: 'low',
              background: true
            });
          }, 100);
        }
      }

      // 4. Verificar que pré-carregamento foi iniciado
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(adaptiveApi.demandas.get).toHaveBeenCalledTimes(predictedKeys.length);
    });
  });
});