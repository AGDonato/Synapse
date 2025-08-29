/**
 * SERVIÇO DE ÓRGÃOS - GERENCIAMENTO DE ÓRGÃOS PÚBLICOS
 *
 * Este arquivo implementa o serviço para gerenciamento de órgãos públicos.
 * Estende BaseService com funcionalidades específicas:
 * - Validações customizadas para nome completo de órgão
 * - Verificação de duplicidade por nome completo
 * - Busca por nome completo e status ativo
 * - Validações de tamanho (2-200 caracteres)
 * - Métodos especializados para operações de órgão
 *
 * Regras de negócio:
 * - Nome completo obrigatório com 2-200 caracteres
 * - Não permite nomes completos duplicados
 * - Trim automático em todas as operações
 * - Filtragem por status ativo disponível
 * - Utiliza nomeFantasia como campo de busca principal
 *
 * Singleton instance disponível: orgaosService
 */

// src/services/OrgaosService.ts

import { BaseService, type ServiceResponse } from './BaseService';
import { orgaosRepository } from '../repositories/OrgaosRepository';
import type { Orgao } from '../types/entities';
import type { CreateDTO, UpdateDTO } from '../types/api';
import { ValidationError } from '../hooks/useErrorHandler';

/**
 * Serviço especializado para gerenciamento de órgãos públicos
 * Estende BaseService com validações e métodos específicos
 */
export class OrgaosService extends BaseService<Orgao> {
  /**
   * Inicializa o serviço com o repository de órgãos
   */
  constructor() {
    super(orgaosRepository);
  }

  /**
   * Retorna o nome da entidade para mensagens de erro
   * @returns Nome da entidade
   */
  protected getEntityName(): string {
    return 'Órgão';
  }

  /**
   * Validação específica para criação de órgãos
   * @param data Dados do órgão a ser criado
   * @throws ValidationError se dados forem inválidos ou nome duplicado
   */
  protected async validateCreate(data: CreateDTO<Orgao>): Promise<void> {
    if (!data.nomeCompleto || data.nomeCompleto.trim().length === 0) {
      throw new ValidationError('Nome completo é obrigatório');
    }

    if (data.nomeCompleto.trim().length < 2) {
      throw new ValidationError('Nome completo deve ter pelo menos 2 caracteres');
    }

    if (data.nomeCompleto.trim().length > 200) {
      throw new ValidationError('Nome completo deve ter no máximo 200 caracteres');
    }

    // Verificar se já existe um órgão com o mesmo nome
    const existing = await orgaosRepository.findByNomeFantasia(data.nomeCompleto.trim());
    if (existing) {
      throw new ValidationError('Já existe um órgão com este nome');
    }
  }

  /**
   * Validação específica para atualização de órgãos
   * @param id ID do órgão sendo atualizado
   * @param data Dados parciais para atualização
   * @throws ValidationError se dados forem inválidos ou nome duplicado
   */
  protected async validateUpdate(id: number, data: UpdateDTO<Orgao>): Promise<void> {
    if (data.nomeCompleto !== undefined) {
      if (!data.nomeCompleto || data.nomeCompleto.trim().length === 0) {
        throw new ValidationError('Nome completo é obrigatório');
      }

      if (data.nomeCompleto.trim().length < 2) {
        throw new ValidationError('Nome completo deve ter pelo menos 2 caracteres');
      }

      if (data.nomeCompleto.trim().length > 200) {
        throw new ValidationError('Nome completo deve ter no máximo 200 caracteres');
      }

      // Verificar se já existe outro órgão com o mesmo nome
      const existing = await orgaosRepository.findByNomeFantasia(data.nomeCompleto.trim());
      if (existing && existing.id !== id) {
        throw new ValidationError('Já existe um órgão com este nome');
      }
    }
  }

  /**
   * Busca órgão por nome completo exato
   * @param nomeCompleto Nome completo do órgão a ser buscado
   * @returns Promise com o órgão encontrado ou undefined
   * @throws ValidationError se nome completo for vazio
   */
  async findByNomeCompleto(nomeCompleto: string): Promise<ServiceResponse<Orgao>> {
    try {
      if (!nomeCompleto || nomeCompleto.trim().length === 0) {
        throw new ValidationError('Nome completo é obrigatório para busca');
      }

      const item = await orgaosRepository.findByNomeFantasia(nomeCompleto.trim());

      return {
        success: true,
        data: item || undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Verifica se um nome completo de órgão já existe no sistema
   * @param nomeCompleto Nome completo a ser verificado
   * @param excludeId ID a ser excluído da verificação (para updates)
   * @returns Promise com boolean indicando existência
   */
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

      const exists = await orgaosRepository.nomeCompletoExists(nomeCompleto.trim(), excludeId);

      return {
        success: true,
        data: exists,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<boolean>;
    }
  }

  /**
   * Busca todos os órgãos com status ativo
   * @returns Promise com array de órgãos ativos
   */
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

/**
 * Instância singleton do serviço de órgãos
 * Pronta para uso em toda a aplicação
 */
export const orgaosService = new OrgaosService();
