/**
 * BACKGROUND SYNC SERVICE - SINCRONIZAÇÃO OFFLINE PWA
 *
 * Este arquivo implementa sincronização em background para PWA.
 * Funcionalidades:
 * - Queue persistente para operações offline
 * - Sincronização automática quando online
 * - Sistema de retry com backoff progressivo
 * - Priorização de tarefas por importância
 * - Resolução de dependências entre tarefas
 * - Monitoramento de status da queue
 * - Persistência via localStorage/IndexedDB
 *
 * Tipos de operação:
 * - create: Criação de novas entidades
 * - update: Atualização de entidades existentes
 * - delete: Remoção de entidades
 *
 * Prioridades:
 * - high: Operações críticas (sync imediato)
 * - medium: Operações importantes (sync em lote)
 * - low: Operações não urgentes (sync quando possível)
 */

import { logger } from '../../utils/logger';

/**
 * Interface para tarefas de sincronização em background
 */
export interface SyncTask {
  /** Identificador único da tarefa */
  id: string;
  /** Tipo de operação a ser executada */
  type: 'create' | 'update' | 'delete';
  /** Tipo de entidade a ser sincronizada */
  entity: 'demanda' | 'documento' | 'cadastro';
  /** Dados da operação */
  data: unknown;
  /** Timestamp de criação da tarefa */
  timestamp: number;
  /** Número de tentativas já realizadas */
  attempts: number;
  /** Máximo de tentativas permitidas */
  maxAttempts: number;
  /** Prioridade de execução */
  priority: 'high' | 'medium' | 'low';
  /** IDs de tarefas que devem ser executadas antes */
  dependencies?: string[];
}

/**
 * Interface para status da queue de sincronização
 */
export interface SyncQueueStatus {
  /** Número de tarefas pendentes */
  pending: number;
  /** Número de tarefas que falharam */
  failed: number;
  /** Número de tarefas completadas */
  completed: number;
  /** Se está processando tarefas atualmente */
  processing: boolean;
  /** Timestamp da última sincronização */
  lastSync: number | null;
  /** Lista de erros recentes */
  errors: string[];
}

const STORAGE_KEY = 'synapse_sync_queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Backoff progressivo

/**
 * Classe principal do serviço de sincronização em background
 */
class BackgroundSyncService {
  /** Queue de tarefas pendentes */
  private queue: SyncTask[] = [];
  /** Flag indicando se está processando */
  private processing = false;
  /** ID do intervalo de sincronização */
  private syncInterval: number | null = null;
  /** Listeners para mudanças de status */
  private listeners: ((status: SyncQueueStatus) => void)[] = [];

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  /**
   * Inicializa sincronização em background
   */
  initialize(): void {
    // Registra background sync se suportado
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.registerBackgroundSync();
    }

    // Fallback: sync periódico quando online
    this.startPeriodicSync();

    logger.info('🔄 Sincronização em background inicializada');
  }

  /**
   * Adiciona tarefa à fila de sincronização
   */
  addTask(task: Omit<SyncTask, 'id' | 'timestamp' | 'attempts'>): string {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateTaskId(),
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: task.maxAttempts || MAX_RETRIES,
    };

    this.queue.push(syncTask);
    this.saveQueue();
    this.notifyListeners();

    // Aciona sync imediato se online
    if (navigator.onLine && !this.processing) {
      this.processQueue();
    }

    logger.info(
      `📋 Tarefa de sincronização adicionada: ${syncTask.type} ${syncTask.entity}`,
      syncTask
    );
    return syncTask.id;
  }

  /**
   * Processa fila de sincronização
   */
  private async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    this.notifyListeners();

    logger.info(`🔄 Processando fila de sincronização (${this.queue.length} tarefas)`);

    // Ordena tarefas por prioridade e dependências
    const sortedTasks = this.sortTasksByPriority();
    const processedIds = new Set<string>();

    for (const task of sortedTasks) {
      // Verifica se dependências estão completas
      if (task.dependencies && !task.dependencies.every(id => processedIds.has(id))) {
        continue;
      }

      try {
        await this.processTask(task);
        this.removeTask(task.id);
        processedIds.add(task.id);

        logger.info(`✅ Tarefa de sincronização concluída: ${task.id}`);
      } catch (error) {
        logger.error(`❌ Tarefa de sincronização falhou: ${task.id}`, error);

        task.attempts++;
        if (task.attempts >= task.maxAttempts) {
          logger.error(`💀 Tarefa excedeu máximo de tentativas: ${task.id}`);
          this.removeTask(task.id);
        }
      }

      // Pequeno delay para evitar sobrecarregar servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
    this.saveQueue();
    this.notifyListeners();

    logger.info(
      `✅ Processamento da fila de sincronização concluído. ${this.queue.length} tarefas restantes`
    );
  }

  /**
   * Processa tarefa individual de sincronização
   */
  private async processTask(task: SyncTask): Promise<void> {
    const delay =
      task.attempts > 0
        ? RETRY_DELAYS[task.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        : 0;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    switch (task.entity) {
      case 'demanda':
        return this.syncDemanda(task);
      case 'documento':
        return this.syncDocumento(task);
      case 'cadastro':
        return this.syncCadastro(task);
      default:
        throw new Error(`Tipo de entidade desconhecido: ${task.entity}`);
    }
  }

  /**
   * Sincroniza demanda
   */
  private async syncDemanda(task: SyncTask): Promise<void> {
    const data = task.data as Record<string, unknown>;
    const endpoint = this.getEndpoint('demandas', task.type, data.id ? String(data.id) : undefined);
    const options = this.getRequestOptions(task);

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Atualiza dados locais se necessário
    const result = await response.json();
    this.updateLocalData('demandas', task.type, result);
  }

  /**
   * Sincroniza documento
   */
  private async syncDocumento(task: SyncTask): Promise<void> {
    const data = task.data as Record<string, unknown>;
    const endpoint = this.getEndpoint(
      'documentos',
      task.type,
      data.id ? String(data.id) : undefined
    );
    const options = this.getRequestOptions(task);

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    this.updateLocalData('documentos', task.type, result);
  }

  /**
   * Sincroniza cadastro
   */
  private async syncCadastro(task: SyncTask): Promise<void> {
    const data = task.data as Record<string, unknown>;
    const endpoint = this.getEndpoint(
      'cadastros',
      task.type,
      data.id ? String(data.id) : undefined
    );
    const options = this.getRequestOptions(task);

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    this.updateLocalData('cadastros', task.type, result);
  }

  /**
   * Obtém endpoint da API para tarefa
   */
  private getEndpoint(entity: string, type: string, id?: string): string {
    const baseUrl = '/api';

    switch (type) {
      case 'create':
        return `${baseUrl}/${entity}`;
      case 'update':
        return `${baseUrl}/${entity}/${id}`;
      case 'delete':
        return `${baseUrl}/${entity}/${id}`;
      default:
        throw new Error(`Tipo de sincronização desconhecido: ${type}`);
    }
  }

  /**
   * Obtém opções de requisição para tarefa
   */
  private getRequestOptions(task: SyncTask): RequestInit {
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    switch (task.type) {
      case 'create':
        options.method = 'POST';
        options.body = JSON.stringify(task.data);
        break;
      case 'update':
        options.method = 'PUT';
        options.body = JSON.stringify(task.data);
        break;
      case 'delete':
        options.method = 'DELETE';
        break;
    }

    // Adiciona headers de autenticação se disponíveis
    const token = localStorage.getItem('auth_token');
    if (token) {
      (options.headers as any).Authorization = `Bearer ${token}`;
    }

    return options;
  }

  /**
   * Atualiza dados locais após sincronização bem-sucedida
   */
  private updateLocalData(entity: string, type: string, data: unknown): void {
    // Isso se integraria com seu gerenciamento de estado local
    // Por enquanto, apenas dispatcha eventos customizados que stores podem escutar

    const event = new CustomEvent('syncCompleted', {
      detail: { entity, type, data },
    });

    window.dispatchEvent(event);
  }

  /**
   * Ordena tarefas por prioridade e dependências
   */
  private sortTasksByPriority(): SyncTask[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return [...this.queue].sort((a, b) => {
      // Primeiro ordena por prioridade
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Depois por timestamp (mais antigo primeiro)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Remove tarefa da fila
   */
  private removeTask(id: string): void {
    this.queue = this.queue.filter(task => task.id !== id);
  }

  /**
   * Gera ID único de tarefa
   */
  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Carrega fila do armazenamento
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`📋 Carregadas ${this.queue.length} tarefas do armazenamento`);
      }
    } catch (error) {
      logger.error('Falha ao carregar fila de sincronização:', error);
      this.queue = [];
    }
  }

  /**
   * Salva fila no armazenamento
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Falha ao salvar fila de sincronização:', error);
    }
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Detecção online/offline
    window.addEventListener('online', () => {
      logger.info('🌐 De volta online - processando fila de sincronização');
      this.processQueue();
    });

    // Mudança de visibilidade (aba fica ativa)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine && this.queue.length > 0) {
        this.processQueue();
      }
    });

    // Processamento periódico
    this.startPeriodicSync();
  }

  /**
   * Registra sincronização em background com service worker
   */
  private registerBackgroundSync(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then(registration => {
          // Solicita background sync
          return (registration as any).sync.register('background-sync');
        })
        .then(() => {
          logger.info('📡 Sincronização em background registrada');
        })
        .catch(error => {
          logger.error('Falha no registro de sincronização em background:', error);
        });
    }
  }

  /**
   * Inicia sincronização periódica (fallback para navegadores sem background sync)
   */
  private startPeriodicSync(): void {
    // Limpa intervalo existente
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Processa queue a cada 30 segundos quando online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }, 30000);
  }

  /**
   * Para sincronização periódica
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Adiciona listener de status
   */
  addStatusListener(listener: (status: SyncQueueStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener de status
   */
  removeStatusListener(listener: (status: SyncQueueStatus) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifica listeners de status
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logger.error('Erro no listener de status de sincronização:', error);
      }
    });
  }

  /**
   * Obtém status atual de sincronização
   */
  getStatus(): SyncQueueStatus {
    const failed = this.queue.filter(task => task.attempts >= task.maxAttempts).length;
    const pending = this.queue.length - failed;

    return {
      pending,
      failed,
      completed: 0, // Isso seria rastreado separadamente numa implementação real
      processing: this.processing,
      lastSync: null, // Isso seria rastreado no storage
      errors: [], // Mensagens de erro recentes
    };
  }

  /**
   * Limpa todas as tarefas
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
    logger.info('🗑️ Fila de sincronização limpa');
  }

  /**
   * Tenta novamente tarefas falhadas
   */
  retryFailedTasks(): void {
    this.queue.forEach(task => {
      if (task.attempts >= task.maxAttempts) {
        task.attempts = 0;
      }
    });

    this.saveQueue();
    this.notifyListeners();

    if (navigator.onLine) {
      this.processQueue();
    }

    logger.info('🔄 Tentando novamente tarefas de sincronização falhadas');
  }

  /**
   * Obtém contador de tarefas pendentes
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Encerra sincronização em background
   */
  shutdown(): void {
    this.stopPeriodicSync();
    this.listeners = [];
    logger.info('🛑 Sincronização em background encerrada');
  }
}

// Cria instância singleton
export const backgroundSyncService = new BackgroundSyncService();

// Funções utilitárias para background sync (hook React seria implementado separadamente)
export const getBackgroundSyncUtils = () => {
  return {
    getStatus: backgroundSyncService.getStatus.bind(backgroundSyncService),
    addTask: backgroundSyncService.addTask.bind(backgroundSyncService),
    clearQueue: backgroundSyncService.clearQueue.bind(backgroundSyncService),
    retryFailedTasks: backgroundSyncService.retryFailedTasks.bind(backgroundSyncService),
    addStatusListener: backgroundSyncService.addStatusListener.bind(backgroundSyncService),
    removeStatusListener: backgroundSyncService.removeStatusListener.bind(backgroundSyncService),
  };
};

export default backgroundSyncService;
