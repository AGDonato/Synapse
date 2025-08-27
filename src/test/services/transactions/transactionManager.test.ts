/**
 * Testes unitários para o TransactionManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import TransactionManager, {
  TransactionError,
  DeadlockError,
  LockTimeoutError,
  ConflictError,
} from '../../../services/transactions/transactionManager';
import { analytics } from '../../../services/analytics/core';
import { healthMonitor } from '../../../services/monitoring/healthCheck';

// Mocks
vi.mock('../../../services/analytics/core', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

vi.mock('../../../services/monitoring/healthCheck', () => ({
  healthMonitor: {
    recordMetric: vi.fn(),
  },
}));

describe('TransactionManager', () => {
  let transactionManager: TransactionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    transactionManager = new TransactionManager({
      defaultTimeout: 30000,
      maxRetries: 3,
      lockTimeout: 10000,
      deadlockDetectionInterval: 5000,
      enableDistributedTransactions: true,
      isolationLevel: 'read_committed',
      autoCommit: false,
      batchSize: 100,
    });
  });

  afterEach(() => {
    transactionManager.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Início de Transação', () => {
    it('deve iniciar nova transação com sucesso', async () => {
      const transactionId = await transactionManager.beginTransaction(
        'user123',
        'session456',
        {
          isolationLevel: 'repeatable_read',
          timeout: 60000,
          name: 'test_transaction',
          priority: 'high',
        }
      );

      expect(transactionId).toBeTruthy();
      expect(transactionId).toMatch(/^txn-\d+-[a-z0-9]+$/);

      const transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction).toMatchObject({
        id: transactionId,
        state: 'active',
        isolationLevel: 'repeatable_read',
        userId: 'user123',
        sessionId: 'session456',
        metadata: {
          name: 'test_transaction',
          priority: 'high',
          retryCount: 0,
          maxRetries: 3,
        },
      });

      expect(analytics.track).toHaveBeenCalledWith('transaction_started', {
        transactionId,
        userId: 'user123',
        sessionId: 'session456',
        isolationLevel: 'repeatable_read',
        nodeId: expect.any(String),
      });

      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('active_transactions', 1);
    });

    it('deve usar valores padrão quando opções não fornecidas', async () => {
      const transactionId = await transactionManager.beginTransaction('user123', 'session456');

      const transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.isolationLevel).toBe('read_committed');
      expect(transaction?.timestamp.timeout).toBe(30000);
      expect(transaction?.metadata.priority).toBe('medium');
    });

    it('deve incrementar contador de transações ativas', async () => {
      await transactionManager.beginTransaction('user1', 'session1');
      await transactionManager.beginTransaction('user2', 'session2');

      const activeTransactions = transactionManager.getActiveTransactions();
      expect(activeTransactions).toHaveLength(2);
      expect(healthMonitor.recordMetric).toHaveBeenLastCalledWith('active_transactions', 2);
    });
  });

  describe('Operações de Transação', () => {
    let transactionId: string;

    beforeEach(async () => {
      transactionId = await transactionManager.beginTransaction('user123', 'session456');
    });

    it('deve adicionar operação à transação', async () => {
      await transactionManager.addOperation(transactionId, {
        type: 'create',
        entityType: 'demanda',
        entityId: 1,
        beforeData: null,
        afterData: { titulo: 'Nova Demanda' },
        userId: 'user123',
        metadata: {
          userAgent: 'Test Browser',
          sessionId: 'session456',
          correlationId: 'corr-123',
        },
      });

      const transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.operations).toHaveLength(1);
      expect(transaction?.operations[0]).toMatchObject({
        type: 'create',
        entityType: 'demanda',
        entityId: 1,
        afterData: { titulo: 'Nova Demanda' },
        userId: 'user123',
      });

      expect(analytics.track).toHaveBeenCalledWith('transaction_operation_added', {
        transactionId,
        operationType: 'create',
        entityType: 'demanda',
        entityId: 1,
      });
    });

    it('deve rejeitar operação em transação inativa', async () => {
      const inactiveId = 'txn-inactive-123';

      await expect(
        transactionManager.addOperation(inactiveId, {
          type: 'update',
          entityType: 'demanda',
          entityId: 1,
          beforeData: {},
          afterData: {},
          userId: 'user123',
          metadata: {},
        })
      ).rejects.toThrow(TransactionError);
    });

    it('deve rejeitar operação em transação não ativa', async () => {
      // Simular estado de transação commitada
      const transaction = transactionManager.getTransactionStatus(transactionId);
      if (transaction) {
        transaction.state = 'committed';
      }

      await expect(
        transactionManager.addOperation(transactionId, {
          type: 'update',
          entityType: 'demanda',
          entityId: 1,
          beforeData: {},
          afterData: {},
          userId: 'user123',
          metadata: {},
        })
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('Commit de Transação', () => {
    let transactionId: string;

    beforeEach(async () => {
      transactionId = await transactionManager.beginTransaction('user123', 'session456');
      await transactionManager.addOperation(transactionId, {
        type: 'create',
        entityType: 'demanda',
        entityId: 1,
        beforeData: null,
        afterData: { titulo: 'Test Demanda' },
        userId: 'user123',
        metadata: {},
      });
    });

    it('deve fazer commit com sucesso', async () => {
      const result = await transactionManager.commitTransaction(transactionId);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(transactionId);
      expect(result.affectedEntities).toHaveLength(1);
      expect(result.affectedEntities[0]).toMatchObject({
        entityType: 'demanda',
        entityId: 1,
        operation: 'create',
      });
      expect(result.metrics.operationCount).toBe(1);

      // Verificar que transação foi removida
      expect(transactionManager.getTransactionStatus(transactionId)).toBeNull();

      expect(analytics.track).toHaveBeenCalledWith('transaction_committed', {
        transactionId,
        userId: 'user123',
        operationCount: 1,
        duration: expect.any(Number),
      });

      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('transaction_success_rate', 1);
    });

    it('deve fazer rollback automático em falha de commit', async () => {
      // Simular falha no commit
      const spy = vi.spyOn(transactionManager as any, 'performLocalCommit')
        .mockRejectedValueOnce(new Error('Commit failed'));

      await expect(transactionManager.commitTransaction(transactionId))
        .rejects.toThrow(TransactionError);

      // Verificar rollback automático
      expect(transactionManager.getTransactionStatus(transactionId)).toBeNull();
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('transaction_success_rate', 0);

      spy.mockRestore();
    });

    it('deve rejeitar commit de transação inexistente', async () => {
      await expect(transactionManager.commitTransaction('invalid-id'))
        .rejects.toThrow(TransactionError);
    });
  });

  describe('Rollback de Transação', () => {
    let transactionId: string;

    beforeEach(async () => {
      transactionId = await transactionManager.beginTransaction('user123', 'session456');
      await transactionManager.addOperation(transactionId, {
        type: 'update',
        entityType: 'demanda',
        entityId: 1,
        beforeData: { titulo: 'Título Original' },
        afterData: { titulo: 'Título Atualizado' },
        userId: 'user123',
        metadata: {},
      });
      await transactionManager.addOperation(transactionId, {
        type: 'create',
        entityType: 'documento',
        entityId: 2,
        beforeData: null,
        afterData: { numero: 'DOC-001' },
        userId: 'user123',
        metadata: {},
      });
    });

    it('deve fazer rollback com sucesso', async () => {
      const result = await transactionManager.rollbackTransaction(transactionId);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(transactionId);
      expect(result.rollbackOperations).toHaveLength(2);
      
      // Verificar ordem LIFO das operações de rollback
      expect(result.rollbackOperations![0].entityType).toBe('documento');
      expect(result.rollbackOperations![0].type).toBe('delete');
      
      expect(result.rollbackOperations![1].entityType).toBe('demanda');
      expect(result.rollbackOperations![1].type).toBe('update');
      expect(result.rollbackOperations![1].afterData).toEqual({ titulo: 'Título Original' });

      expect(analytics.track).toHaveBeenCalledWith('transaction_rolled_back', {
        transactionId,
        userId: 'user123',
        operationCount: 2,
        rollbackCount: 2,
      });
    });

    it('deve lidar com falha no rollback', async () => {
      // Simular falha na execução do rollback
      const spy = vi.spyOn(transactionManager as any, 'executeRollbackOperation')
        .mockRejectedValueOnce(new Error('Rollback operation failed'));

      await expect(transactionManager.rollbackTransaction(transactionId))
        .rejects.toThrow(TransactionError);

      const transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.state).toBe('failed');

      spy.mockRestore();
    });
  });

  describe('Execução de Transação com Retry', () => {
    it('deve executar operação com sucesso', async () => {
      const mockOperation = vi.fn().mockResolvedValueOnce({ result: 'success' });

      const result = await transactionManager.executeTransaction(
        'user123',
        'session456',
        mockOperation,
        { name: 'test_operation', maxRetries: 2 }
      );

      expect(result).toEqual({ result: 'success' });
      expect(mockOperation).toHaveBeenCalledWith(expect.any(String));
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('deve fazer retry em erro retryável', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new DeadlockError('txn-123', ['txn-123', 'txn-456']))
        .mockRejectedValueOnce(new ConflictError('txn-123', 'demanda', 1))
        .mockResolvedValueOnce({ result: 'success' });

      const result = await transactionManager.executeTransaction(
        'user123',
        'session456',
        mockOperation,
        { maxRetries: 3 }
      );

      expect(result).toEqual({ result: 'success' });
      expect(mockOperation).toHaveBeenCalledTimes(3);

      // Verificar delay entre tentativas
      vi.advanceTimersByTime(2000); // Primeiro delay
      vi.advanceTimersByTime(4000); // Segundo delay (exponencial)
    });

    it('deve falhar após esgotar tentativas', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValue(new DeadlockError('txn-123', ['txn-123', 'txn-456']));

      await expect(
        transactionManager.executeTransaction(
          'user123',
          'session456',
          mockOperation,
          { maxRetries: 2 }
        )
      ).rejects.toThrow(DeadlockError);

      expect(mockOperation).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
    });

    it('deve falhar imediatamente em erro não retryável', async () => {
      const nonRetryableError = new TransactionError('Non-retryable', 'txn-123', 'VALIDATION_ERROR', false);
      const mockOperation = vi.fn().mockRejectedValueOnce(nonRetryableError);

      await expect(
        transactionManager.executeTransaction('user123', 'session456', mockOperation)
      ).rejects.toThrow(nonRetryableError);

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sistema de Bloqueios', () => {
    let transactionId: string;

    beforeEach(async () => {
      transactionId = await transactionManager.beginTransaction('user123', 'session456');
    });

    it('deve adquirir bloqueio exclusivo', async () => {
      await transactionManager.addOperation(transactionId, {
        type: 'update',
        entityType: 'demanda',
        entityId: 1,
        beforeData: {},
        afterData: {},
        userId: 'user123',
        metadata: {},
      });

      const transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.locks.has('demanda:1')).toBe(true);
    });

    it('deve detectar conflito de bloqueio', async () => {
      // Primeira transação adquire bloqueio
      await transactionManager.addOperation(transactionId, {
        type: 'update',
        entityType: 'demanda',
        entityId: 1,
        beforeData: {},
        afterData: {},
        userId: 'user123',
        metadata: {},
      });

      // Segunda transação tenta adquirir o mesmo bloqueio
      const transactionId2 = await transactionManager.beginTransaction('user456', 'session789');
      
      // Simular timeout de bloqueio
      vi.advanceTimersByTime(15000);

      await expect(
        transactionManager.addOperation(transactionId2, {
          type: 'update',
          entityType: 'demanda',
          entityId: 1,
          beforeData: {},
          afterData: {},
          userId: 'user456',
          metadata: {},
        })
      ).rejects.toThrow(LockTimeoutError);
    });

    it('deve liberar bloqueios após commit', async () => {
      await transactionManager.addOperation(transactionId, {
        type: 'update',
        entityType: 'demanda',
        entityId: 1,
        beforeData: {},
        afterData: {},
        userId: 'user123',
        metadata: {},
      });

      await transactionManager.commitTransaction(transactionId);

      // Verificar que locks foram liberados
      expect(transactionManager['locks'].has('demanda:1')).toBe(false);
    });

    it('deve liberar bloqueios após rollback', async () => {
      await transactionManager.addOperation(transactionId, {
        type: 'update',
        entityType: 'demanda',
        entityId: 1,
        beforeData: {},
        afterData: {},
        userId: 'user123',
        metadata: {},
      });

      await transactionManager.rollbackTransaction(transactionId);

      expect(transactionManager['locks'].has('demanda:1')).toBe(false);
    });
  });

  describe('Detecção de Deadlock', () => {
    it('deve detectar ciclo simples de deadlock', async () => {
      // Configurar deadlock: txn1 espera txn2, txn2 espera txn1
      const txn1 = await transactionManager.beginTransaction('user1', 'session1');
      const txn2 = await transactionManager.beginTransaction('user2', 'session2');

      // Simular waiting graph
      transactionManager['waitingGraph'].set(txn1, new Set([txn2]));
      transactionManager['waitingGraph'].set(txn2, new Set([txn1]));

      // Trigger detecção de deadlock
      vi.advanceTimersByTime(5000);

      expect(analytics.track).toHaveBeenCalledWith('deadlock_detected', {
        cycles: [[txn1, txn2]],
        victimTransactions: expect.any(Array),
        nodeId: expect.any(String),
      });
    });

    it('deve escolher vítima mais jovem no deadlock', async () => {
      const txn1 = await transactionManager.beginTransaction('user1', 'session1');
      
      // Avançar tempo antes de criar segunda transação
      vi.advanceTimersByTime(1000);
      
      const txn2 = await transactionManager.beginTransaction('user2', 'session2');

      // Simular deadlock
      transactionManager['waitingGraph'].set(txn1, new Set([txn2]));
      transactionManager['waitingGraph'].set(txn2, new Set([txn1]));

      // Forçar detecção
      const deadlockResult = transactionManager['findDeadlockCycles']();
      
      expect(deadlockResult.detected).toBe(true);
      expect(deadlockResult.victimTransactions).toContain(txn2); // Mais jovem
    });

    it('deve abortar transações vítimas de deadlock', async () => {
      const txn1 = await transactionManager.beginTransaction('user1', 'session1');
      const txn2 = await transactionManager.beginTransaction('user2', 'session2');

      // Mock rollback para verificar se foi chamado
      const rollbackSpy = vi.spyOn(transactionManager, 'rollbackTransaction')
        .mockResolvedValue({
          success: true,
          transactionId: txn2,
          affectedEntities: [],
          metrics: { duration: 0, operationCount: 0, lockWaitTime: 0, conflictCount: 0 },
        });

      transactionManager['waitingGraph'].set(txn1, new Set([txn2]));
      transactionManager['waitingGraph'].set(txn2, new Set([txn1]));

      vi.advanceTimersByTime(5000);

      expect(rollbackSpy).toHaveBeenCalled();
      
      rollbackSpy.mockRestore();
    });
  });

  describe('Limpeza e Destruição', () => {
    it('deve limpar recursos ao destruir', async () => {
      const txn1 = await transactionManager.beginTransaction('user1', 'session1');
      const txn2 = await transactionManager.beginTransaction('user2', 'session2');

      const rollbackSpy = vi.spyOn(transactionManager, 'rollbackTransaction')
        .mockResolvedValue({} as any);

      transactionManager.destroy();

      expect(rollbackSpy).toHaveBeenCalledWith(txn1);
      expect(rollbackSpy).toHaveBeenCalledWith(txn2);

      rollbackSpy.mockRestore();
    });

    it('deve parar detecção de deadlock', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      transactionManager.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Métricas e Monitoramento', () => {
    it('deve registrar métricas de transação', async () => {
      const transactionId = await transactionManager.beginTransaction('user123', 'session456');
      
      await transactionManager.addOperation(transactionId, {
        type: 'create',
        entityType: 'demanda',
        entityId: 1,
        beforeData: null,
        afterData: {},
        userId: 'user123',
        metadata: {},
      });

      await transactionManager.commitTransaction(transactionId);

      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('active_transactions', 1);
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('active_transactions', 0);
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('transaction_success_rate', 1);
    });

    it('deve registrar falhas de transação', async () => {
      const transactionId = await transactionManager.beginTransaction('user123', 'session456');
      
      // Simular falha
      const spy = vi.spyOn(transactionManager as any, 'performLocalCommit')
        .mockRejectedValueOnce(new Error('Test failure'));

      try {
        await transactionManager.commitTransaction(transactionId);
      } catch (error) {
        // Esperado
      }

      expect(healthMonitor.recordMetric).toHaveBeenCalledWith('transaction_success_rate', 0);
      
      spy.mockRestore();
    });
  });

  describe('Estados de Transação', () => {
    let transactionId: string;

    beforeEach(async () => {
      transactionId = await transactionManager.beginTransaction('user123', 'session456');
    });

    it('deve transicionar estados corretamente', async () => {
      // Estado inicial
      let transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.state).toBe('active');

      // Durante commit
      const commitPromise = transactionManager.commitTransaction(transactionId);
      
      transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.state).toBe('preparing');

      await commitPromise;
      
      // Após commit (transação removida)
      transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction).toBeNull();
    });

    it('deve definir estado como aborted durante rollback', async () => {
      const rollbackPromise = transactionManager.rollbackTransaction(transactionId);
      
      const transaction = transactionManager.getTransactionStatus(transactionId);
      expect(transaction?.state).toBe('aborted');

      await rollbackPromise;
    });
  });
});