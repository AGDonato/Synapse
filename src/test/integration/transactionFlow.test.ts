import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TransactionManager } from '../../services/transactions/transactionManager';
import { useDemandasStore } from '../../stores/demandasStore';
import { useDocumentosStore } from '../../stores/documentosStore';
import { getCacheUtils } from '../../services/cache/adaptiveCache';
import { adaptiveApi } from '../../services/api/adaptiveApi';
import type { Demanda } from '../../types/entities';
import type { DocumentoDemanda } from '../../data/mockDocumentos';

vi.mock('../../services/cache/adaptiveCache');
vi.mock('../../services/api/adaptiveApi');

describe('Fluxo Completo de Transações Distribuídas - Integration Tests', () => {
  let transactionManager: TransactionManager;
  let mockCacheUtils: any;

  const mockDemanda: Demanda = {
    id: 1,
    numero: 'DEM-2024-001',
    titulo: 'Demanda Original',
    descricao: 'Descrição original',
    status: 'aberta',
    prioridade: 'media',
    dataInicial: '01/01/2024',
    prazo: '31/12/2024',
    orgaoId: 1,
    assuntoId: 1,
    tipoId: 1
  };

  const mockDocumento: DocumentoDemanda = {
    id: 1,
    demandaId: 1,
    tipo: 'oficio',
    numero: 'DOC-2024-001',
    assunto: 'Documento de teste',
    dataEmissao: '01/01/2024',
    status: 'rascunho',
    conteudo: 'Conteúdo original',
    destinatario: 'Destinatário Teste',
    enderecamento: 'Endereço Teste'
  };

  beforeEach(() => {
    mockCacheUtils = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      clear: vi.fn(),
      exists: vi.fn(),
      getMultiple: vi.fn(),
      setMultiple: vi.fn()
    };
    vi.mocked(getCacheUtils).mockReturnValue(mockCacheUtils);

    // Mock das APIs
    vi.mocked(adaptiveApi.demandas.update).mockResolvedValue(mockDemanda);
    vi.mocked(adaptiveApi.documentos.update).mockResolvedValue(mockDocumento);
    vi.mocked(adaptiveApi.demandas.list).mockResolvedValue({
      data: [mockDemanda],
      total: 1,
      page: 1,
      limit: 10
    });

    transactionManager = new TransactionManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cenário: Transação Simples com Rollback', () => {
    it('deve realizar commit bem-sucedido em transação simples', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      // 1. Iniciar transação
      const transaction = await transactionManager.beginTransaction();
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('startTime');

      // 2. Executar operação dentro da transação
      const updateData = {
        titulo: 'Demanda Atualizada',
        status: 'em_andamento' as const
      };

      let operationExecuted = false;
      
      await act(async () => {
        await transactionManager.commitTransaction(transaction.id, async () => {
          // Simular operação que pode falhar
          await result.current.updateDemanda(1, updateData);
          operationExecuted = true;
        });
      });

      // 3. Verificar que operação foi executada
      expect(operationExecuted).toBe(true);
      expect(result.current.demandas[0].titulo).toBe('Demanda Atualizada');
      expect(result.current.demandas[0].status).toBe('em_andamento');

      // 4. Verificar que API foi chamada
      expect(adaptiveApi.demandas.update).toHaveBeenCalledWith(1, updateData);
    });

    it('deve realizar rollback quando operação falha', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      // Simular falha na API
      vi.mocked(adaptiveApi.demandas.update).mockRejectedValueOnce(
        new Error('Falha na atualização da API')
      );

      // 1. Iniciar transação
      const transaction = await transactionManager.beginTransaction();

      // 2. Tentar operação que irá falhar
      const updateData = {
        titulo: 'Título que falhará',
        status: 'em_andamento' as const
      };

      let rollbackExecuted = false;

      await act(async () => {
        try {
          await transactionManager.commitTransaction(transaction.id, async () => {
            await result.current.updateDemanda(1, updateData);
          });
        } catch (error) {
          // Rollback automático
          rollbackExecuted = true;
        }
      });

      // 3. Verificar que rollback foi executado
      expect(rollbackExecuted).toBe(true);

      // 4. Verificar que estado original foi preservado
      expect(result.current.demandas[0].titulo).toBe('Demanda Original');
      expect(result.current.demandas[0].status).toBe('aberta');
    });
  });

  describe('Cenário: Transações Distribuídas Multi-Store', () => {
    it('deve coordenar transações entre demandas e documentos', async () => {
      const { result: demandasResult } = renderHook(() => useDemandasStore());
      const { result: documentosResult } = renderHook(() => useDocumentosStore());
      
      await act(async () => {
        demandasResult.current.setDemandas([mockDemanda]);
        documentosResult.current.setDocumentos([mockDocumento]);
      });

      // 1. Iniciar transação distribuída
      const transaction = await transactionManager.beginTransaction();

      // 2. Executar operações coordenadas
      const demandaUpdate = {
        status: 'em_andamento' as const,
        observacoes: 'Documento em elaboração'
      };

      const documentoUpdate = {
        status: 'em_elaboracao' as const,
        conteudo: 'Conteúdo atualizado'
      };

      await act(async () => {
        await transactionManager.commitTransaction(transaction.id, async () => {
          // Operação 1: Atualizar demanda
          await demandasResult.current.updateDemanda(1, demandaUpdate);
          
          // Operação 2: Atualizar documento relacionado
          await documentosResult.current.updateDocumento(1, documentoUpdate);
        });
      });

      // 3. Verificar que ambas as operações foram executadas atomicamente
      expect(demandasResult.current.demandas[0].status).toBe('em_andamento');
      expect(documentosResult.current.documentos[0].status).toBe('em_elaboracao');
      expect(documentosResult.current.documentos[0].conteudo).toBe('Conteúdo atualizado');

      // 4. Verificar que APIs foram chamadas
      expect(adaptiveApi.demandas.update).toHaveBeenCalledWith(1, demandaUpdate);
      expect(adaptiveApi.documentos.update).toHaveBeenCalledWith(1, documentoUpdate);
    });

    it('deve reverter todas as operações se uma falhar', async () => {
      const { result: demandasResult } = renderHook(() => useDemandasStore());
      const { result: documentosResult } = renderHook(() => useDocumentosStore());
      
      await act(async () => {
        demandasResult.current.setDemandas([mockDemanda]);
        documentosResult.current.setDocumentos([mockDocumento]);
      });

      // Simular sucesso na primeira operação, falha na segunda
      vi.mocked(adaptiveApi.demandas.update).mockResolvedValueOnce({
        ...mockDemanda,
        status: 'em_andamento'
      });
      vi.mocked(adaptiveApi.documentos.update).mockRejectedValueOnce(
        new Error('Falha na atualização do documento')
      );

      // 1. Iniciar transação
      const transaction = await transactionManager.beginTransaction();

      // 2. Executar operações que irão falhar parcialmente
      let transactionFailed = false;

      await act(async () => {
        try {
          await transactionManager.commitTransaction(transaction.id, async () => {
            // Esta operação deve ter sucesso
            await demandasResult.current.updateDemanda(1, { status: 'em_andamento' });
            
            // Esta operação deve falhar
            await documentosResult.current.updateDocumento(1, { status: 'em_elaboracao' });
          });
        } catch (error) {
          transactionFailed = true;
        }
      });

      // 3. Verificar que transação falhou
      expect(transactionFailed).toBe(true);

      // 4. Verificar que estados originais foram preservados
      expect(demandasResult.current.demandas[0].status).toBe('aberta');
      expect(documentosResult.current.documentos[0].status).toBe('rascunho');
    });
  });

  describe('Cenário: Detecção e Resolução de Deadlocks', () => {
    it('deve detectar e resolver deadlock entre transações concorrentes', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([
          { ...mockDemanda, id: 1 },
          { ...mockDemanda, id: 2, numero: 'DEM-2024-002' }
        ]);
      });

      // 1. Iniciar duas transações concorrentes
      const transaction1 = await transactionManager.beginTransaction();
      const transaction2 = await transactionManager.beginTransaction();

      // 2. Simular deadlock: T1 bloqueia recurso A, T2 bloqueia recurso B
      // Depois T1 tenta bloquear B e T2 tenta bloquear A

      let t1Completed = false;
      let t2Completed = false;
      let deadlockDetected = false;

      // Mock do sistema de detecção de deadlock
      const originalDetectDeadlocks = transactionManager['detectDeadlocks'];
      transactionManager['detectDeadlocks'] = vi.fn().mockImplementation(() => {
        deadlockDetected = true;
        // Simular resolução: abortar T2
        return [transaction2.id];
      });

      await act(async () => {
        // Executar transações paralelas
        const promises = [
          // Transação 1: Atualiza demanda 1, depois demanda 2
          transactionManager.commitTransaction(transaction1.id, async () => {
            await result.current.updateDemanda(1, { titulo: 'T1 - Demanda 1' });
            await new Promise(resolve => setTimeout(resolve, 100));
            await result.current.updateDemanda(2, { titulo: 'T1 - Demanda 2' });
            t1Completed = true;
          }).catch(() => {}),
          
          // Transação 2: Atualiza demanda 2, depois demanda 1
          transactionManager.commitTransaction(transaction2.id, async () => {
            await result.current.updateDemanda(2, { titulo: 'T2 - Demanda 2' });
            await new Promise(resolve => setTimeout(resolve, 100));
            await result.current.updateDemanda(1, { titulo: 'T2 - Demanda 1' });
            t2Completed = true;
          }).catch(() => {
            // T2 será abortada devido ao deadlock
          })
        ];

        // Simular timeout para deadlock
        setTimeout(() => {
          if (transactionManager['detectDeadlocks']) {
            (transactionManager as any).detectDeadlocks();
          }
        }, 150);

        await Promise.all(promises);
      });

      // 3. Verificar que deadlock foi detectado e resolvido
      expect(deadlockDetected).toBe(true);
      expect(t1Completed).toBe(true);
      expect(t2Completed).toBe(false); // T2 foi abortada

      // 4. Verificar estado final (apenas mudanças de T1)
      expect(result.current.demandas[0].titulo).toBe('T1 - Demanda 1');
      expect(result.current.demandas[1].titulo).toBe('T1 - Demanda 2');
    });
  });

  describe('Cenário: Retry Automático e Recovery', () => {
    it('deve tentar novamente operações que falharam temporariamente', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      // Simular falha temporária (primeira tentativa falha, segunda sucesso)
      let attemptCount = 0;
      vi.mocked(adaptiveApi.demandas.update).mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('Falha temporária de rede'));
        }
        return Promise.resolve({ ...mockDemanda, titulo: 'Título Atualizado' });
      });

      // 1. Iniciar transação com retry automático
      const transaction = await transactionManager.beginTransaction();

      // 2. Executar operação que falhará temporariamente
      await act(async () => {
        await transactionManager.commitTransaction(transaction.id, async () => {
          await result.current.updateDemanda(1, { titulo: 'Título Atualizado' });
        });
      });

      // 3. Verificar que operação foi tentada duas vezes
      expect(attemptCount).toBe(2);
      expect(adaptiveApi.demandas.update).toHaveBeenCalledTimes(2);

      // 4. Verificar que operação finalmente teve sucesso
      expect(result.current.demandas[0].titulo).toBe('Título Atualizado');
    });

    it('deve falhar após esgotar tentativas de retry', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      // Simular falha persistente
      vi.mocked(adaptiveApi.demandas.update).mockRejectedValue(
        new Error('Falha persistente')
      );

      // 1. Iniciar transação
      const transaction = await transactionManager.beginTransaction();

      // 2. Executar operação que continuará falhando
      let finalError: Error | null = null;

      await act(async () => {
        try {
          await transactionManager.commitTransaction(transaction.id, async () => {
            await result.current.updateDemanda(1, { titulo: 'Nunca será atualizado' });
          });
        } catch (error) {
          finalError = error as Error;
        }
      });

      // 3. Verificar que operação foi tentada múltiplas vezes
      expect(adaptiveApi.demandas.update).toHaveBeenCalledTimes(3); // Default retry count

      // 4. Verificar que falha final foi reportada
      expect(finalError).toBeInstanceOf(Error);
      expect(finalError?.message).toContain('Falha persistente');

      // 5. Verificar que estado original foi preservado
      expect(result.current.demandas[0].titulo).toBe('Demanda Original');
    });
  });

  describe('Performance e Monitoramento', () => {
    it('deve rastrear métricas de performance das transações', async () => {
      const { result } = renderHook(() => useDemandasStore());
      
      await act(async () => {
        result.current.setDemandas([mockDemanda]);
      });

      const startTime = performance.now();

      // 1. Executar transação monitorada
      const transaction = await transactionManager.beginTransaction();

      await act(async () => {
        await transactionManager.commitTransaction(transaction.id, async () => {
          await result.current.updateDemanda(1, { titulo: 'Performance Test' });
        });
      });

      const endTime = performance.now();

      // 2. Verificar que métricas foram coletadas
      const metrics = transactionManager.getMetrics();
      expect(metrics).toHaveProperty('totalTransactions');
      expect(metrics).toHaveProperty('successfulTransactions');
      expect(metrics).toHaveProperty('averageTransactionTime');

      // 3. Verificar tempo de execução razoável
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('deve limpar recursos de transações antigas', async () => {
      // 1. Criar várias transações
      const transactions = [];
      for (let i = 0; i < 10; i++) {
        transactions.push(await transactionManager.beginTransaction());
      }

      // 2. Simular passagem de tempo
      vi.advanceTimersByTime(60000); // 1 minuto

      // 3. Executar limpeza
      transactionManager['cleanup']();

      // 4. Verificar que transações antigas foram removidas
      const activeTransactions = transactionManager['activeTransactions'];
      expect(activeTransactions.size).toBe(0);

      // 5. Verificar que cache foi otimizado
      expect(mockCacheUtils.clear).toHaveBeenCalledWith(
        expect.stringMatching(/^transaction_/),
        expect.any(Object)
      );
    });
  });
});