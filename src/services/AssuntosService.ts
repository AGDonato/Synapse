// src/services/AssuntosService.ts

import { BaseService, type ServiceResponse } from './BaseService';
import { assuntosRepository } from '../repositories/AssuntosRepository';
import type { Assunto } from '../types/entities';
import type { CreateDTO, UpdateDTO } from '../types/api';
import { ValidationError } from '../hooks/useErrorHandler';

export class AssuntosService extends BaseService<Assunto> {
  constructor() {
    super(assuntosRepository);
  }

  protected getEntityName(): string {
    return 'Assunto';
  }

  // Validação específica para criação de assuntos
  protected async validateCreate(data: CreateDTO<Assunto>): Promise<void> {
    if (!data.nome || data.nome.trim().length === 0) {
      throw new ValidationError('Nome é obrigatório');
    }

    if (data.nome.trim().length < 2) {
      throw new ValidationError('Nome deve ter pelo menos 2 caracteres');
    }

    if (data.nome.trim().length > 100) {
      throw new ValidationError('Nome deve ter no máximo 100 caracteres');
    }

    // Verificar se já existe um assunto com o mesmo nome
    const existing = await assuntosRepository.findByNome(data.nome.trim());
    if (existing) {
      throw new ValidationError('Já existe um assunto com este nome');
    }
  }

  // Validação específica para atualização de assuntos
  protected async validateUpdate(
    id: number,
    data: UpdateDTO<Assunto>
  ): Promise<void> {
    if (data.nome !== undefined) {
      if (!data.nome || data.nome.trim().length === 0) {
        throw new ValidationError('Nome é obrigatório');
      }

      if (data.nome.trim().length < 2) {
        throw new ValidationError('Nome deve ter pelo menos 2 caracteres');
      }

      if (data.nome.trim().length > 100) {
        throw new ValidationError('Nome deve ter no máximo 100 caracteres');
      }

      // Verificar se já existe outro assunto com o mesmo nome
      const existing = await assuntosRepository.findByNome(data.nome.trim());
      if (existing && existing.id !== id) {
        throw new ValidationError('Já existe um assunto com este nome');
      }
    }
  }

  // Método específico para buscar por nome
  async findByNome(nome: string): Promise<ServiceResponse<Assunto>> {
    try {
      if (!nome || nome.trim().length === 0) {
        throw new ValidationError('Nome é obrigatório para busca');
      }

      const item = await assuntosRepository.findByNome(nome.trim());

      return {
        success: true,
        data: item || undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Método para verificar se um nome já existe
  async checkNomeExists(
    nome: string,
    excludeId?: number
  ): Promise<ServiceResponse<boolean>> {
    try {
      if (!nome || nome.trim().length === 0) {
        return {
          success: true,
          data: false,
        };
      }

      const exists = await assuntosRepository.nomeExists(
        nome.trim(),
        excludeId
      );

      return {
        success: true,
        data: exists,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<boolean>;
    }
  }

  // Método para buscar por padrão de nome (regex)
  async searchByPattern(pattern: string): Promise<ServiceResponse<Assunto[]>> {
    try {
      if (!pattern || pattern.trim().length === 0) {
        throw new ValidationError('Padrão de busca é obrigatório');
      }

      const items = await assuntosRepository.findByNomePattern(pattern.trim());

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<Assunto[]>;
    }
  }
}

// Singleton instance
export const assuntosService = new AssuntosService();
