/**
 * Testes unitários para o CollaborationService (WebSocket)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import CollaborationService from '../../../services/collaboration/websocket';
import { analytics } from '../../../services/analytics/core';

// Mocks
vi.mock('../../../services/analytics/core', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.simulateOpen(), 0);
  }

  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateClose(code: number = 1000, reason: string = '') {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  simulateError(error: Error) {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.simulateClose();
  });
}

// @ts-ignore
global.WebSocket = MockWebSocket;

describe('CollaborationService', () => {
  let service: CollaborationService;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CollaborationService();
    
    // Capturar instância do WebSocket após criação
    vi.spyOn(global, 'WebSocket').mockImplementation((url) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket as any;
    });
  });

  afterEach(() => {
    service.disconnect();
    vi.restoreAllMocks();
  });

  describe('Conexão WebSocket', () => {
    it('deve conectar com sucesso', async () => {
      const connectPromise = service.connect('user123', 'Test User');
      
      // Aguardar próximo tick para WebSocket abrir
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await expect(connectPromise).resolves.toBeUndefined();
      expect(service.isConnected()).toBe(true);
      expect(analytics.track).toHaveBeenCalledWith('websocket_connected', {
        userId: 'user123',
        userName: 'Test User',
      });
    });

    it('deve lidar com erro de conexão', async () => {
      const connectPromise = service.connect('user123', 'Test User');
      
      // Simular erro antes de abrir
      await new Promise(resolve => setTimeout(resolve, 0));
      mockWebSocket.simulateError(new Error('Connection failed'));
      
      await expect(connectPromise).rejects.toThrow('Failed to connect to collaboration server');
      expect(service.isConnected()).toBe(false);
    });

    it('deve reconectar automaticamente após desconexão', async () => {
      await service.connect('user123', 'Test User');
      
      // Simular desconexão não intencional
      mockWebSocket.simulateClose(1006, 'Connection lost');
      
      // Aguardar tentativa de reconexão
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(analytics.track).toHaveBeenCalledWith('websocket_reconnecting', {
        attempt: 1,
      });
    });

    it('deve parar de reconectar após máximo de tentativas', async () => {
      await service.connect('user123', 'Test User');
      service['reconnectAttempts'] = 5; // Máximo de tentativas
      
      mockWebSocket.simulateClose(1006, 'Connection lost');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(analytics.track).toHaveBeenCalledWith('websocket_reconnect_failed', {
        attempts: 5,
      });
    });

    it('deve desconectar corretamente', async () => {
      await service.connect('user123', 'Test User');
      
      service.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
      expect(analytics.track).toHaveBeenCalledWith('websocket_disconnected', {
        userId: 'user123',
      });
    });
  });

  describe('Gerenciamento de Salas', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
    });

    it('deve entrar em uma sala de entidade', async () => {
      const joinPromise = service.joinEntity('demanda', 1);
      
      // Simular resposta do servidor
      setTimeout(() => {
        mockWebSocket.simulateMessage({
          type: 'joined',
          entityType: 'demanda',
          entityId: 1,
          users: [
            { userId: 'user123', userName: 'Test User' },
            { userId: 'user456', userName: 'Other User' },
          ],
        });
      }, 10);
      
      await joinPromise;
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'join',
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
        userName: 'Test User',
      }));
      
      expect(analytics.track).toHaveBeenCalledWith('collaboration_joined', {
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
      });
    });

    it('deve sair de uma sala de entidade', () => {
      service.leaveEntity('demanda', 1);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'leave',
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
      }));
      
      expect(analytics.track).toHaveBeenCalledWith('collaboration_left', {
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
      });
    });

    it('deve retornar usuários na sala', async () => {
      // Configurar estado da sala
      await service.joinEntity('demanda', 1);
      
      mockWebSocket.simulateMessage({
        type: 'joined',
        entityType: 'demanda',
        entityId: 1,
        users: [
          { userId: 'user123', userName: 'Test User' },
          { userId: 'user456', userName: 'Other User' },
        ],
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const users = service.getRoomUsers('demanda', 1);
      
      expect(users).toHaveLength(2);
      expect(users).toContainEqual({ userId: 'user123', userName: 'Test User' });
      expect(users).toContainEqual({ userId: 'user456', userName: 'Other User' });
    });
  });

  describe('Sistema de Bloqueio', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
      await service.joinEntity('demanda', 1);
    });

    it('deve adquirir bloqueio com sucesso', async () => {
      const lockPromise = service.acquireLock('demanda', 1);
      
      // Simular resposta de sucesso
      setTimeout(() => {
        mockWebSocket.simulateMessage({
          type: 'lock_acquired',
          entityType: 'demanda',
          entityId: 1,
          userId: 'user123',
          lockId: 'lock-123',
        });
      }, 10);
      
      const result = await lockPromise;
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'lock',
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
      }));
    });

    it('deve falhar ao adquirir bloqueio quando já está bloqueado', async () => {
      const lockPromise = service.acquireLock('demanda', 1);
      
      // Simular resposta de falha
      setTimeout(() => {
        mockWebSocket.simulateMessage({
          type: 'lock_failed',
          entityType: 'demanda',
          entityId: 1,
          reason: 'Already locked by user456',
          lockedBy: 'user456',
        });
      }, 10);
      
      const result = await lockPromise;
      
      expect(result).toBe(false);
    });

    it('deve liberar bloqueio', () => {
      service.releaseLock('demanda', 1);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'unlock',
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
      }));
      
      expect(analytics.track).toHaveBeenCalledWith('collaboration_lock_released', {
        entityType: 'demanda',
        entityId: 1,
        userId: 'user123',
      });
    });

    it('deve verificar status de bloqueio', async () => {
      // Simular lock ativo
      mockWebSocket.simulateMessage({
        type: 'lock_acquired',
        entityType: 'demanda',
        entityId: 1,
        userId: 'user456',
        lockId: 'lock-456',
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(service.isLocked('demanda', 1)).toBe(true);
      expect(service.getLockOwner('demanda', 1)).toBe('user456');
    });
  });

  describe('Broadcast de Atualizações', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
      await service.joinEntity('demanda', 1);
    });

    it('deve transmitir atualização para a sala', () => {
      const updateData = {
        field: 'titulo',
        value: 'Novo Título',
        version: 2,
      };
      
      service.broadcastUpdate('demanda', 1, updateData);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'update',
        entityType: 'demanda',
        entityId: 1,
        data: updateData,
        userId: 'user123',
        timestamp: expect.any(Number),
      }));
    });

    it('deve transmitir operação de campo', () => {
      service.broadcastFieldOperation('demanda', 1, 'descricao', 'Descrição atualizada', 'update');
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'field_operation',
        entityType: 'demanda',
        entityId: 1,
        field: 'descricao',
        value: 'Descrição atualizada',
        operation: 'update',
        userId: 'user123',
        timestamp: expect.any(Number),
      }));
    });

    it('deve transmitir posição do cursor', () => {
      service.broadcastCursor('demanda', 1, 'titulo', 10, 15);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'cursor',
        entityType: 'demanda',
        entityId: 1,
        field: 'titulo',
        position: { start: 10, end: 15 },
        userId: 'user123',
      }));
    });
  });

  describe('Handlers de Eventos', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
    });

    it('deve registrar e executar callback de evento', async () => {
      const callback = vi.fn();
      service.on('user_joined', callback);
      
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: 'user456',
        userName: 'New User',
        entityType: 'demanda',
        entityId: 1,
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(callback).toHaveBeenCalledWith({
        userId: 'user456',
        userName: 'New User',
        entityType: 'demanda',
        entityId: 1,
      });
    });

    it('deve remover callback de evento', () => {
      const callback = vi.fn();
      const unsubscribe = service.on('user_left', callback);
      
      unsubscribe();
      
      mockWebSocket.simulateMessage({
        type: 'user_left',
        userId: 'user456',
      });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('deve executar múltiplos callbacks para o mesmo evento', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      service.on('update_received', callback1);
      service.on('update_received', callback2);
      
      mockWebSocket.simulateMessage({
        type: 'update_received',
        data: { test: 'data' },
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Heartbeat e Manutenção de Conexão', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
    });

    it('deve enviar ping periodicamente', async () => {
      // Avançar o tempo para trigger do heartbeat
      vi.useFakeTimers();
      
      vi.advanceTimersByTime(30000); // 30 segundos
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'ping',
        timestamp: expect.any(Number),
      }));
      
      vi.useRealTimers();
    });

    it('deve processar pong do servidor', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      mockWebSocket.simulateMessage({
        type: 'pong',
        timestamp: Date.now(),
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Pong received');
      
      consoleSpy.mockRestore();
    });

    it('deve detectar conexão perdida se não receber pong', async () => {
      vi.useFakeTimers();
      
      // Enviar ping
      vi.advanceTimersByTime(30000);
      
      // Não receber pong e timeout
      vi.advanceTimersByTime(10000);
      
      // Deve tentar reconectar
      expect(analytics.track).toHaveBeenCalledWith('websocket_ping_timeout');
      
      vi.useRealTimers();
    });
  });

  describe('Presença de Usuário', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
      await service.joinEntity('demanda', 1);
    });

    it('deve atualizar presença ao receber user_joined', () => {
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: 'user789',
        userName: 'New User',
        entityType: 'demanda',
        entityId: 1,
      });
      
      const users = service.getRoomUsers('demanda', 1);
      expect(users).toContainEqual({ userId: 'user789', userName: 'New User' });
    });

    it('deve remover presença ao receber user_left', () => {
      // Adicionar usuário primeiro
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: 'user789',
        userName: 'User to Leave',
        entityType: 'demanda',
        entityId: 1,
      });
      
      // Remover usuário
      mockWebSocket.simulateMessage({
        type: 'user_left',
        userId: 'user789',
        entityType: 'demanda',
        entityId: 1,
      });
      
      const users = service.getRoomUsers('demanda', 1);
      expect(users).not.toContainEqual({ userId: 'user789', userName: 'User to Leave' });
    });

    it('deve obter cursor de outro usuário', () => {
      mockWebSocket.simulateMessage({
        type: 'cursor',
        userId: 'user456',
        entityType: 'demanda',
        entityId: 1,
        field: 'titulo',
        position: { start: 5, end: 10 },
      });
      
      const cursor = service.getUserCursor('user456');
      expect(cursor).toEqual({
        field: 'titulo',
        position: { start: 5, end: 10 },
      });
    });
  });

  describe('Tratamento de Erros', () => {
    beforeEach(async () => {
      await service.connect('user123', 'Test User');
    });

    it('deve lidar com mensagem mal formada', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simular mensagem inválida
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { data: 'invalid json' }));
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('deve lidar com erro ao enviar mensagem', () => {
      // Fechar conexão para simular erro
      mockWebSocket.readyState = WebSocket.CLOSED;
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      service.broadcastUpdate('demanda', 1, { test: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not connected');
      
      consoleSpy.mockRestore();
    });

    it('deve rejeitar operações quando desconectado', async () => {
      service.disconnect();
      
      await expect(service.joinEntity('demanda', 1)).rejects.toThrow('WebSocket not connected');
      await expect(service.acquireLock('demanda', 1)).rejects.toThrow('WebSocket not connected');
    });
  });

  describe('Limpeza e Estado', () => {
    it('deve limpar recursos ao desconectar', async () => {
      await service.connect('user123', 'Test User');
      
      // Adicionar alguns estados
      await service.joinEntity('demanda', 1);
      service.on('test', vi.fn());
      
      service.disconnect();
      
      expect(service['rooms'].size).toBe(0);
      expect(service['locks'].size).toBe(0);
      expect(service['callbacks'].size).toBe(0);
      expect(service['userCursors'].size).toBe(0);
    });

    it('deve retornar status correto de conexão', async () => {
      expect(service.isConnected()).toBe(false);
      
      await service.connect('user123', 'Test User');
      expect(service.isConnected()).toBe(true);
      
      service.disconnect();
      expect(service.isConnected()).toBe(false);
    });

    it('deve retornar informações do usuário atual', async () => {
      await service.connect('user456', 'Another User');
      
      expect(service.getCurrentUser()).toEqual({
        userId: 'user456',
        userName: 'Another User',
      });
    });
  });
});