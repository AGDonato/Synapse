import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CollaborationService } from '../../services/collaboration/websocket';
import { TransactionManager } from '../../services/transactions/transactionManager';
import { useDemandasStore } from '../../stores/demandasStore';
import { getCacheUtils } from '../../services/cache/adaptiveCache';
import type { Demanda } from '../../types/entities';

vi.mock('../../services/cache/adaptiveCache');

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simular conexão bem-sucedida após um delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Simular eco da mensagem para testes
    setTimeout(() => {
      if (this.onmessage) {
        const parsedData = JSON.parse(data);
        this.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ 
            ...parsedData, 
            status: 'acknowledged',
            timestamp: Date.now() 
          })
        }));
      }
    }, 50);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, reason: 'Normal closure' }));
    }
  }

  // Método auxiliar para simulação
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('Fluxo Completo de Colaboração Multi-Usuário - Integration Tests', () => {
  let collaborationService: CollaborationService;
  let transactionManager: TransactionManager;
  let mockCacheUtils: any;
  let mockWebSocket: MockWebSocket;

  const mockUser1 = {
    id: 'user1',
    name: 'Alice',
    avatar: '/avatars/alice.jpg'
  };

  const mockUser2 = {
    id: 'user2',
    name: 'Bob',
    avatar: '/avatars/bob.jpg'
  };

  const mockDemanda: Demanda = {
    id: 1,
    numero: 'DEM-2024-001',
    titulo: 'Demanda de Teste Colaborativo',
    descricao: 'Teste de edição colaborativa',
    status: 'aberta',
    prioridade: 'alta',
    dataInicial: '01/01/2024',
    prazo: '31/12/2024',
    orgaoId: 1,
    assuntoId: 1,
    tipoId: 1
  };

  beforeEach(() => {
    mockCacheUtils = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      clear: vi.fn()
    };
    vi.mocked(getCacheUtils).mockReturnValue(mockCacheUtils);

    collaborationService = new CollaborationService('ws://localhost:8080/ws');
    transactionManager = new TransactionManager();
    
    // Aguardar conexão
    setTimeout(() => {
      mockWebSocket = (collaborationService as any).ws;
    }, 150);
  });

  afterEach(() => {
    collaborationService?.disconnect();
    vi.clearAllMocks();
  });

  describe('Cenário: Edição Simultânea por 2 Usuários', () => {
    it('deve gerenciar bloqueios e conflitos em edição simultânea', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      // Simular dados iniciais
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      // Aguardar conexão WebSocket
      await new Promise(resolve => setTimeout(resolve, 150));

      // 1. User1 entra na sala de edição
      await act(async () => {
        await collaborationService.joinRoom('demanda-1', mockUser1);
      });

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'join_room',
          roomId: 'demanda-1',
          user: mockUser1,
          timestamp: expect.any(Number)
        })
      );

      // 2. Simular User1 obtendo bloqueio no campo 'titulo'
      mockWebSocket.simulateMessage({
        type: 'lock_acquired',
        roomId: 'demanda-1',
        resourceId: 'demanda-1',
        fieldId: 'titulo',
        userId: 'user1',
        lockId: 'lock-titulo-123',
        timestamp: Date.now()
      });

      // 3. User2 tenta entrar na sala
      await act(async () => {
        await collaborationService.joinRoom('demanda-1', mockUser2);
      });

      // 4. User2 tenta obter bloqueio no mesmo campo
      const lockResult = await collaborationService.requestLock('demanda-1', 'titulo', mockUser2.id);
      
      // Simular resposta do servidor negando o bloqueio
      mockWebSocket.simulateMessage({
        type: 'lock_denied',
        roomId: 'demanda-1',
        resourceId: 'demanda-1',
        fieldId: 'titulo',
        userId: 'user2',
        lockedBy: 'user1',
        timestamp: Date.now()
      });

      expect(lockResult).toBe(false);

      // 5. User1 faz uma alteração
      await act(async () => {
        await collaborationService.broadcastChange('demanda-1', {
          type: 'field_change',
          fieldId: 'titulo',
          oldValue: 'Demanda de Teste Colaborativo',
          newValue: 'Demanda de Teste Colaborativo - EDITADO',
          userId: 'user1',
          timestamp: Date.now()
        });
      });

      // 6. User2 recebe a mudança em tempo real
      mockWebSocket.simulateMessage({
        type: 'field_changed',
        roomId: 'demanda-1',
        resourceId: 'demanda-1',
        change: {
          fieldId: 'titulo',
          newValue: 'Demanda de Teste Colaborativo - EDITADO',
          userId: 'user1',
          timestamp: Date.now()
        }
      });

      // Verificar se store foi atualizado
      expect(result.current.demandas[0].titulo).toBe('Demanda de Teste Colaborativo - EDITADO');
    });

    it('deve sincronizar alterações e resolver conflitos automaticamente', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // 1. Cenário de conflito: dois usuários editando campos diferentes simultaneamente
      
      // User1 edita título
      const transaction1 = await transactionManager.beginTransaction();
      const change1 = {
        id: 1,
        titulo: 'Novo Título por User1',
        version: 1
      };

      // User2 edita descrição simultaneamente
      const transaction2 = await transactionManager.beginTransaction();
      const change2 = {
        id: 1,
        descricao: 'Nova descrição por User2',
        version: 1
      };

      // 2. Commits simultâneos
      await act(async () => {
        // User1 commita primeiro
        await transactionManager.commitTransaction(transaction1.id, () => {
          result.current.updateDemanda(1, change1);
          return Promise.resolve();
        });

        // User2 commita depois (detecta conflito de versão)
        try {
          await transactionManager.commitTransaction(transaction2.id, () => {
            result.current.updateDemanda(1, change2);
            return Promise.resolve();
          });
        } catch (error) {
          // Esperado: conflito de versão
        }
      });

      // 3. Sistema deve resolver automaticamente (merge)
      mockWebSocket.simulateMessage({
        type: 'conflict_resolved',
        roomId: 'demanda-1',
        resourceId: 'demanda-1',
        mergedData: {
          id: 1,
          titulo: 'Novo Título por User1', // Mantém mudança do User1
          descricao: 'Nova descrição por User2', // Integra mudança do User2
          version: 2
        },
        timestamp: Date.now()
      });

      // Verificar se dados foram mesclados corretamente
      const finalDemanda = result.current.demandas[0];
      expect(finalDemanda.titulo).toBe('Novo Título por User1');
      expect(finalDemanda.descricao).toBe('Nova descrição por User2');
    });
  });

  describe('Cenário: Múltiplos Usuários (4 simultaneamente)', () => {
    const users = [
      { id: 'user1', name: 'Alice', avatar: '/avatars/alice.jpg' },
      { id: 'user2', name: 'Bob', avatar: '/avatars/bob.jpg' },
      { id: 'user3', name: 'Carol', avatar: '/avatars/carol.jpg' },
      { id: 'user4', name: 'David', avatar: '/avatars/david.jpg' }
    ];

    it('deve gerenciar presença de 4 usuários simultâneos', async () => {
      await new Promise(resolve => setTimeout(resolve, 150));

      // 1. Todos os usuários entram na sala
      for (const user of users) {
        await act(async () => {
          await collaborationService.joinRoom('demanda-1', user);
        });

        // Simular resposta do servidor
        mockWebSocket.simulateMessage({
          type: 'user_joined',
          roomId: 'demanda-1',
          user: user,
          activeUsers: users.slice(0, users.indexOf(user) + 1),
          timestamp: Date.now()
        });
      }

      // 2. Verificar que todos os usuários estão sendo rastreados
      const activeUsers = collaborationService.getActiveUsers('demanda-1');
      expect(activeUsers).toHaveLength(4);
      expect(activeUsers.map(u => u.id)).toEqual(['user1', 'user2', 'user3', 'user4']);

      // 3. Simular distribuição de bloqueios
      const lockAssignments = [
        { userId: 'user1', fieldId: 'titulo' },
        { userId: 'user2', fieldId: 'descricao' },
        { userId: 'user3', fieldId: 'prioridade' },
        { userId: 'user4', fieldId: 'prazo' }
      ];

      for (const assignment of lockAssignments) {
        mockWebSocket.simulateMessage({
          type: 'lock_acquired',
          roomId: 'demanda-1',
          resourceId: 'demanda-1',
          fieldId: assignment.fieldId,
          userId: assignment.userId,
          lockId: `lock-${assignment.fieldId}-${Date.now()}`,
          timestamp: Date.now()
        });
      }

      // 4. Verificar que cada usuário pode editar seu campo designado
      for (const assignment of lockAssignments) {
        const canEdit = collaborationService.canUserEdit('demanda-1', assignment.fieldId, assignment.userId);
        expect(canEdit).toBe(true);
      }

      // 5. Verificar que usuários não podem editar campos de outros
      expect(collaborationService.canUserEdit('demanda-1', 'titulo', 'user2')).toBe(false);
      expect(collaborationService.canUserEdit('demanda-1', 'descricao', 'user1')).toBe(false);
    });

    it('deve lidar com desconexões e reconexões de usuários', async () => {
      await new Promise(resolve => setTimeout(resolve, 150));

      // 1. Todos entram na sala
      for (const user of users) {
        await collaborationService.joinRoom('demanda-1', user);
      }

      // 2. User2 se desconecta inesperadamente
      mockWebSocket.simulateMessage({
        type: 'user_disconnected',
        roomId: 'demanda-1',
        userId: 'user2',
        reason: 'network_error',
        timestamp: Date.now()
      });

      // 3. Verificar que bloqueios do User2 foram liberados
      mockWebSocket.simulateMessage({
        type: 'locks_released',
        roomId: 'demanda-1',
        userId: 'user2',
        releasedLocks: ['lock-descricao-123'],
        timestamp: Date.now()
      });

      // 4. User3 pode agora obter o bloqueio da descrição
      const lockResult = await collaborationService.requestLock('demanda-1', 'descricao', 'user3');
      
      mockWebSocket.simulateMessage({
        type: 'lock_acquired',
        roomId: 'demanda-1',
        resourceId: 'demanda-1',
        fieldId: 'descricao',
        userId: 'user3',
        lockId: 'lock-descricao-456',
        timestamp: Date.now()
      });

      expect(lockResult).toBe(true);

      // 5. User2 se reconecta
      await act(async () => {
        await collaborationService.joinRoom('demanda-1', users[1]);
      });

      mockWebSocket.simulateMessage({
        type: 'user_rejoined',
        roomId: 'demanda-1',
        user: users[1],
        activeUsers: users,
        timestamp: Date.now()
      });

      // 6. Verificar sincronização de estado atual
      expect(collaborationService.getActiveUsers('demanda-1')).toHaveLength(4);
      expect(collaborationService.canUserEdit('demanda-1', 'descricao', 'user3')).toBe(true);
      expect(collaborationService.canUserEdit('demanda-1', 'descricao', 'user2')).toBe(false);
    });
  });

  describe('Performance e Escalabilidade', () => {
    it('deve manter performance com múltiplas operações simultâneas', async () => {
      const startTime = performance.now();
      
      await new Promise(resolve => setTimeout(resolve, 150));

      // Simular 100 operações simultâneas de diferentes usuários
      const operations = Array.from({ length: 100 }, (_, i) => {
        const userId = `user${i % 4 + 1}`;
        const fieldId = `field${i % 10}`;
        
        return collaborationService.broadcastChange('demanda-1', {
          type: 'field_change',
          fieldId: fieldId,
          oldValue: `old_value_${i}`,
          newValue: `new_value_${i}`,
          userId: userId,
          timestamp: Date.now() + i
        });
      });

      await act(async () => {
        await Promise.all(operations);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Deve processar 100 operações em menos de 1 segundo
      expect(executionTime).toBeLessThan(1000);
      
      // Verificar que todas as mensagens foram enviadas
      expect(mockWebSocket.send).toHaveBeenCalledTimes(100);
    });

    it('deve gerenciar memória eficientemente com cache de operações', async () => {
      await new Promise(resolve => setTimeout(resolve, 150));

      // Simular muitas operações para testar limpeza de cache
      for (let i = 0; i < 1000; i++) {
        await collaborationService.broadcastChange('demanda-1', {
          type: 'field_change',
          fieldId: 'test_field',
          oldValue: `value_${i}`,
          newValue: `value_${i + 1}`,
          userId: 'user1',
          timestamp: Date.now()
        });
      }

      // Verificar que cache foi otimizado (mantém apenas últimas 100 operações)
      expect(mockCacheUtils.set).toHaveBeenCalledWith(
        expect.stringMatching(/^collaboration_operations_/),
        expect.any(Array),
        expect.objectContaining({
          ttl: expect.any(Number),
          maxSize: 100
        })
      );
    });
  });
});