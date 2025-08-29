/**
 * BASE SERVICE - CLASSE ABSTRATA PARA SERVIÇOS CRUD
 *
 * Este arquivo define a classe base para todos os serviços do sistema.
 * Implementa operações CRUD padronizadas e utilities comuns:
 * - Operações de leitura (getAll, getById, search)
 * - Operações de escrita (create, update, delete)
 * - Operações em lote (bulkCreate, bulkDelete)
 * - Utilitários (count, exists)
 * - Tratamento consistente de erros
 * - Validações customizáveis por subclasse
 * - Ordenação e paginação client-side
 *
 * Padrão de resposta unificado:
 * - ServiceResponse<T>: operações single
 * - ServiceListResponse<T>: operações de lista
 * - Sempre inclui success boolean e error handling
 *
 * Extensão:
 * - Subclasses devem implementar getEntityName()
 * - Podem sobrescrever validateCreate/Update/Delete
 * - Repository pattern para persistência
 */

// src/services/BaseService.ts

import type { Repository } from '../repositories/BaseRepository';
import type { BaseEntity, CreateDTO, UpdateDTO } from '../types/api';
import { AppError, NotFoundError, ValidationError } from '../hooks/useErrorHandler';

/**
 * Interface para resposta padrão de operações de serviço
 * @template T Tipo da entidade retornada
 */
export interface ServiceResponse<T> {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  /** Dados retornados pela operação (opcional) */
  data?: T;
  /** Mensagem de erro em caso de falha */
  error?: string;
  /** Código do erro para identificação programada */
  code?: string;
}

/**
 * Interface para resposta de operações que retornam listas
 * @template T Tipo da entidade na lista
 */
export interface ServiceListResponse<T> {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  /** Array de dados retornados (opcional) */
  data?: T[];
  /** Número total de itens na lista */
  total?: number;
  /** Mensagem de erro em caso de falha */
  error?: string;
  /** Código do erro para identificação programada */
  code?: string;
}

/**
 * Opções para busca e paginação de entidades
 */
export interface SearchOptions {
  /** Termo de busca textual */
  query?: string;
  /** Limite de itens a retornar */
  limit?: number;
  /** Número de itens a pular (offset) */
  offset?: number;
  /** Campo para ordenação */
  sortBy?: string;
  /** Direção da ordenação */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Classe abstrata base para todos os serviços do sistema
 * @template T Tipo da entidade que o serviço gerencia
 */
export abstract class BaseService<T extends BaseEntity> {
  /** Repository para persistência da entidade */
  protected repository: Repository<T>;

  /**
   * Construtor base que recebe o repository da entidade
   * @param repository Repository para operações de persistência
   */
  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  /**
   * Busca todas as entidades
   * @returns Promise com lista de todas as entidades
   */
  async getAll(): Promise<ServiceListResponse<T>> {
    try {
      const items = await this.repository.findAll();
      return {
        success: true,
        data: items,
        total: items.length,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceListResponse<T>;
    }
  }

  /**
   * Busca entidade por ID
   * @param id ID da entidade a ser buscada
   * @returns Promise com a entidade encontrada
   * @throws ValidationError se ID for inválido
   * @throws NotFoundError se entidade não existir
   */
  async getById(id: number): Promise<ServiceResponse<T>> {
    try {
      if (!id || id <= 0) {
        throw new ValidationError('ID inválido');
      }

      const item = await this.repository.findById(id);
      if (!item) {
        throw new NotFoundError(this.getEntityName(), id);
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Busca entidades com filtros, ordenação e paginação
   * @param options Opções de busca, ordenação e paginação
   * @returns Promise com lista de entidades filtradas
   */
  async search(options: SearchOptions = {}): Promise<ServiceListResponse<T>> {
    try {
      const { query = '', limit, offset = 0 } = options;

      let items = query ? await this.repository.search(query) : await this.repository.findAll();

      // Apply sorting if specified
      if (options.sortBy) {
        items = this.sortItems(items, options.sortBy, options.sortOrder);
      }

      // Apply pagination if specified
      if (limit !== undefined) {
        const start = offset;
        const end = start + limit;
        items = items.slice(start, end);
      }

      return {
        success: true,
        data: items,
        total: items.length,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceListResponse<T>;
    }
  }

  /**
   * Cria nova entidade
   * @param data Dados para criação da entidade
   * @returns Promise com a entidade criada
   * @throws ValidationError se dados forem inválidos
   */
  async create(data: CreateDTO<T>): Promise<ServiceResponse<T>> {
    try {
      // Validate data before creating
      await this.validateCreate(data);

      const item = await this.repository.create(data);

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Atualiza entidade existente
   * @param id ID da entidade a ser atualizada
   * @param data Dados parciais para atualização
   * @returns Promise com a entidade atualizada
   * @throws ValidationError se ID for inválido
   * @throws NotFoundError se entidade não existir
   */
  async update(id: number, data: UpdateDTO<T>): Promise<ServiceResponse<T>> {
    try {
      if (!id || id <= 0) {
        throw new ValidationError('ID inválido');
      }

      // Check if item exists
      const exists = await this.repository.exists(id);
      if (!exists) {
        throw new NotFoundError(this.getEntityName(), id);
      }

      // Validate data before updating
      await this.validateUpdate(id, data);

      const item = await this.repository.update(id, data);

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Remove entidade por ID
   * @param id ID da entidade a ser removida
   * @returns Promise com confirmação da remoção
   * @throws ValidationError se ID for inválido
   * @throws NotFoundError se entidade não existir
   */
  async delete(id: number): Promise<ServiceResponse<void>> {
    try {
      if (!id || id <= 0) {
        throw new ValidationError('ID inválido');
      }

      // Check if item exists
      const exists = await this.repository.exists(id);
      if (!exists) {
        throw new NotFoundError(this.getEntityName(), id);
      }

      // Validate deletion (check dependencies, permissions, etc.)
      await this.validateDelete(id);

      await this.repository.delete(id);

      return {
        success: true,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<void>;
    }
  }

  /**
   * Cria múltiplas entidades em lote
   * @param dataArray Array de dados para criação
   * @returns Promise com lista das entidades criadas
   * @throws ValidationError se array for inválido ou vazio
   */
  async bulkCreate(dataArray: CreateDTO<T>[]): Promise<ServiceListResponse<T>> {
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw new ValidationError('Array de dados inválido ou vazio');
      }

      // Validate all items before creating any
      for (let i = 0; i < dataArray.length; i++) {
        await this.validateCreate(dataArray[i]);
      }

      const items = await this.repository.bulkCreate(dataArray);

      return {
        success: true,
        data: items,
        total: items.length,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceListResponse<T>;
    }
  }

  /**
   * Remove múltiplas entidades em lote
   * @param ids Array de IDs das entidades a serem removidas
   * @returns Promise com confirmação da remoção
   * @throws ValidationError se algum ID for inválido
   * @throws NotFoundError se alguma entidade não existir
   */
  async bulkDelete(ids: number[]): Promise<ServiceResponse<void>> {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('Array de IDs inválido ou vazio');
      }

      // Validate all IDs
      for (const id of ids) {
        if (!id || id <= 0) {
          throw new ValidationError(`ID inválido: ${id}`);
        }

        const exists = await this.repository.exists(id);
        if (!exists) {
          throw new NotFoundError(this.getEntityName(), id);
        }

        await this.validateDelete(id);
      }

      await this.repository.bulkDelete(ids);

      return {
        success: true,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<void>;
    }
  }

  /**
   * Conta o número total de entidades
   * @returns Promise com o número total de entidades
   */
  async count(): Promise<ServiceResponse<number>> {
    try {
      const total = await this.repository.count();
      return {
        success: true,
        data: total,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<number>;
    }
  }

  /**
   * Verifica se entidade existe por ID
   * @param id ID da entidade a ser verificada
   * @returns Promise com boolean indicando existência
   */
  async exists(id: number): Promise<ServiceResponse<boolean>> {
    try {
      if (!id || id <= 0) {
        return {
          success: true,
          data: false,
        };
      }

      const exists = await this.repository.exists(id);
      return {
        success: true,
        data: exists,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<boolean>;
    }
  }

  /**
   * Método abstrato que deve retornar o nome da entidade
   * Usado em mensagens de erro e logs
   * @returns Nome da entidade para exibição
   */
  protected abstract getEntityName(): string;

  /**
   * Validação customizada antes da criação
   * Pode ser sobrescrita por subclasses para validações específicas
   * @param data Dados a serem validados
   * @throws ValidationError se dados forem inválidos
   */
  protected async validateCreate(data: CreateDTO<T>): Promise<void> {
    // Override in subclasses for specific validation
    // Base implementation does nothing
    void data;
  }

  /**
   * Validação customizada antes da atualização
   * Pode ser sobrescrita por subclasses para validações específicas
   * @param id ID da entidade sendo atualizada
   * @param data Dados de atualização a serem validados
   * @throws ValidationError se dados forem inválidos
   */
  protected async validateUpdate(id: number, data: UpdateDTO<T>): Promise<void> {
    // Override in subclasses for specific validation
    // Base implementation does nothing
    void id;
    void data;
  }

  /**
   * Validação customizada antes da remoção
   * Pode ser sobrescrita para verificar dependências, permissões, etc.
   * @param id ID da entidade sendo removida
   * @throws ValidationError se remoção não for permitida
   */
  protected async validateDelete(id: number): Promise<void> {
    // Override in subclasses for specific validation
    // Base implementation does nothing
    void id;
  }

  /**
   * Ordena array de entidades por campo especificado
   * @param items Array de entidades a serem ordenadas
   * @param sortBy Campo para ordenação
   * @param sortOrder Direção da ordenação (padrão: 'asc')
   * @returns Array ordenado (não modifica o original)
   */
  protected sortItems(items: T[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): T[] {
    return [...items].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortBy];
      const bValue = (b as Record<string, unknown>)[sortBy];

      // Convert to strings for comparison
      const aStr = String(aValue);
      const bStr = String(bValue);

      if (aStr < bStr) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Trata erros de forma consistente, convertendo para ServiceResponse
   * @param error Erro capturado durante operação
   * @returns ServiceResponse com informações do erro
   */
  protected handleError(error: unknown): ServiceResponse<T> {
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
        code: error.code?.toString(),
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }

    return {
      success: false,
      error: 'Erro desconhecido',
      code: 'UNKNOWN_ERROR',
    };
  }
}
