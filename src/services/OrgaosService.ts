// src/services/OrgaosService.ts

import { BaseService, type ServiceResponse } from './BaseService';
import { orgaosRepository } from '../repositories/OrgaosRepository';
import type { Orgao } from '../types/entities';
import type { CreateDTO, UpdateDTO } from '../types/api';
import { ValidationError } from '../hooks/useErrorHandler';

export class OrgaosService extends BaseService<Orgao> {
  constructor() {
    super(orgaosRepository);
  }

  protected getEntityName(): string {
    return 'Órgão';
  }

  // Validação específica para criação de órgãos
  protected async validateCreate(data: CreateDTO<Orgao>): Promise<void> {
    if (!data.nomeCompleto || data.nomeCompleto.trim().length === 0) {
      throw new ValidationError('Nome completo é obrigatório');
    }

    if (data.nomeCompleto.trim().length < 2) {
      throw new ValidationError(
        'Nome completo deve ter pelo menos 2 caracteres'
      );
    }

    if (data.nomeCompleto.trim().length > 200) {
      throw new ValidationError(
        'Nome completo deve ter no máximo 200 caracteres'
      );
    }

    // Verificar se já existe um órgão com o mesmo nome
    const existing = await orgaosRepository.findByNomeFantasia(
      data.nomeCompleto.trim()
    );
    if (existing) {
      throw new ValidationError('Já existe um órgão com este nome');
    }
  }

  // Validação específica para atualização de órgãos
  protected async validateUpdate(
    id: number,
    data: UpdateDTO<Orgao>
  ): Promise<void> {
    if (data.nomeCompleto !== undefined) {
      if (!data.nomeCompleto || data.nomeCompleto.trim().length === 0) {
        throw new ValidationError('Nome completo é obrigatório');
      }

      if (data.nomeCompleto.trim().length < 2) {
        throw new ValidationError(
          'Nome completo deve ter pelo menos 2 caracteres'
        );
      }

      if (data.nomeCompleto.trim().length > 200) {
        throw new ValidationError(
          'Nome completo deve ter no máximo 200 caracteres'
        );
      }

      // Verificar se já existe outro órgão com o mesmo nome
      const existing = await orgaosRepository.findByNomeFantasia(
        data.nomeCompleto.trim()
      );
      if (existing && existing.id !== id) {
        throw new ValidationError('Já existe um órgão com este nome');
      }
    }
  }

  // Método específico para buscar por nome completo
  async findByNomeCompleto(
    nomeCompleto: string
  ): Promise<ServiceResponse<Orgao>> {
    try {
      if (!nomeCompleto || nomeCompleto.trim().length === 0) {
        throw new ValidationError('Nome completo é obrigatório para busca');
      }

      const item = await orgaosRepository.findByNomeFantasia(
        nomeCompleto.trim()
      );

      return {
        success: true,
        data: item || undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Método para verificar se um nome completo já existe
  async checkNomeCompletoExists(
    nomeCompleto: string,
    excludeId?: number
  ): Promise<ServiceResponse<boolean>> {
    try {
      if (!nomeCompleto || nomeCompleto.trim().length === 0) {
        return {
          success: true,
          data: false,
        };
      }

      const exists = await orgaosRepository.nomeCompletoExists(
        nomeCompleto.trim(),
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

  // Método para buscar órgãos ativos
  async getActive(): Promise<ServiceResponse<Orgao[]>> {
    try {
      const items = await orgaosRepository.findActive();

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<Orgao[]>;
    }
  }
}

// Singleton instance
export const orgaosService = new OrgaosService();
