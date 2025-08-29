/**
 * SERVIÇO DE ASSUNTOS - GERENCIAMENTO DE ASSUNTOS DE DEMANDAS
 *
 * Este arquivo implementa o serviço para gerenciamento de assuntos.
 * Estende BaseService com funcionalidades específicas:
 * - Validações customizadas para nome de assunto
 * - Verificação de duplicidade por nome
 * - Busca por nome exato e padrão (regex)
 * - Validações de tamanho (2-100 caracteres)
 * - Métodos especializados para operações de assunto
 *
 * Regras de negócio:
 * - Nome obrigatório com 2-100 caracteres
 * - Não permite nomes duplicados no sistema
 * - Trim automático em todas as operações
 * - Busca case-insensitive por padrão
 *
 * Singleton instance disponível: assuntosService
 */

// src/services/AssuntosService.ts

import { BaseService, type ServiceResponse } from './BaseService';
import { assuntosRepository } from '../repositories/AssuntosRepository';
import type { Assunto } from '../types/entities';
import type { CreateDTO, UpdateDTO } from '../types/api';
import { ValidationError } from '../hooks/useErrorHandler';

/**
 * Serviço especializado para gerenciamento de assuntos
 * Estende BaseService com validações e métodos específicos
 */
export class AssuntosService extends BaseService<Assunto> {
  /**
   * Inicializa o serviço com o repository de assuntos
   */
  constructor() {
    super(assuntosRepository);
  }

  /**
   * Retorna o nome da entidade para mensagens de erro
   * @returns Nome da entidade
   */
  protected getEntityName(): string {
    return 'Assunto';
  }

  /**
   * Validação específica para criação de assuntos
   * @param data Dados do assunto a ser criado
   * @throws ValidationError se dados forem inválidos ou nome duplicado
   */
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

  /**
   * Validação específica para atualização de assuntos
   * @param id ID do assunto sendo atualizado
   * @param data Dados parciais para atualização
   * @throws ValidationError se dados forem inválidos ou nome duplicado
   */
  protected async validateUpdate(id: number, data: UpdateDTO<Assunto>): Promise<void> {
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

  /**
   * Busca assunto por nome exato
   * @param nome Nome do assunto a ser buscado
   * @returns Promise com o assunto encontrado ou undefined
   * @throws ValidationError se nome for vazio
   */
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

  /**
   * Verifica se um nome de assunto já existe no sistema
   * @param nome Nome a ser verificado
   * @param excludeId ID a ser excluído da verificação (para updates)
   * @returns Promise com boolean indicando existência
   */
  async checkNomeExists(nome: string, excludeId?: number): Promise<ServiceResponse<boolean>> {
    try {
      if (!nome || nome.trim().length === 0) {
        return {
          success: true,
          data: false,
        };
      }

      const exists = await assuntosRepository.nomeExists(nome.trim(), excludeId);

      return {
        success: true,
        data: exists,
      };
    } catch (error) {
      return this.handleError(error) as unknown as ServiceResponse<boolean>;
    }
  }

  /**
   * Busca assuntos por padrão de nome (regex)
   * @param pattern Padrão regex para busca
   * @returns Promise com array de assuntos que coincidem com o padrão
   * @throws ValidationError se padrão for vazio
   */
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

/**
 * Instância singleton do serviço de assuntos
 * Pronta para uso em toda a aplicação
 */
export const assuntosService = new AssuntosService();
