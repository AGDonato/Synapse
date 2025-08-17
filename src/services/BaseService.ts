// src/services/BaseService.ts

import type { Repository } from '../repositories/BaseRepository';
import type { BaseEntity, CreateDTO, UpdateDTO } from '../types/api';
import {
  AppError,
  ValidationError,
  NotFoundError,
} from '../hooks/useErrorHandler';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ServiceListResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  error?: string;
  code?: string;
}

export interface SearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export abstract class BaseService<T extends BaseEntity> {
  protected repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  // Read operations
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

  async search(options: SearchOptions = {}): Promise<ServiceListResponse<T>> {
    try {
      const { query = '', limit, offset = 0 } = options;

      let items = query
        ? await this.repository.search(query)
        : await this.repository.findAll();

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

  // Write operations
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

  // Bulk operations
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

  // Utility methods
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

  // Protected methods for extension by subclasses
  protected abstract getEntityName(): string;

  protected async validateCreate(data: CreateDTO<T>): Promise<void> {
    // Override in subclasses for specific validation
    // Base implementation does nothing
    void data;
  }

  protected async validateUpdate(
    id: number,
    data: UpdateDTO<T>
  ): Promise<void> {
    // Override in subclasses for specific validation
    // Base implementation does nothing
    void id;
    void data;
  }

  protected async validateDelete(id: number): Promise<void> {
    // Override in subclasses for specific validation
    // Base implementation does nothing
    void id;
  }

  protected sortItems(
    items: T[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): T[] {
    return [...items].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortBy];
      const bValue = (b as Record<string, unknown>)[sortBy];

      // Convert to strings for comparison
      const aStr = String(aValue);
      const bStr = String(bValue);

      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

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
