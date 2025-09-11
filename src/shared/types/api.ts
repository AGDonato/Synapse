/**
 * DEFINIÇÕES DE TIPOS PARA API E SERVIÇOS
 *
 * Este módulo define todas as interfaces TypeScript para comunicação com APIs e serviços.
 * Inclui definições para:
 * - Tipos genéricos para operações CRUD (Create, Update, Delete)
 * - Estruturas padronizadas de resposta da API
 * - Tipos para paginação de resultados
 * - Interfaces para busca e filtragem
 * - Padrões de tratamento de erro consistentes
 * - Wrappers type-safe para operações de serviço
 */

import type { BaseEntity } from './entities';

// Re-exporta BaseEntity para conveniência
export type { BaseEntity } from './entities';

// Tipos genéricos para operações CRUD
/**
 * Tipo para criação de entidades - remove o campo 'id' da entidade base
 * Usado para payloads de criação onde o ID é gerado pelo servidor
 */
export type CreateDTO<T extends BaseEntity> = Omit<T, 'id'>;

/**
 * Tipo para atualização de entidades - torna todos os campos opcionais
 * Permite atualizações parciais de entidades existentes
 */
export type UpdateDTO<T extends BaseEntity> = Partial<CreateDTO<T>>;

// Tipos de resposta da API
/**
 * Interface padrão para respostas da API
 * Fornece estrutura consistente para todas as operações
 * @template T - Tipo dos dados retornados pela operação
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Interface para estrutura de erros da API
 * Padroniza informações de erro retornadas pelos serviços
 */
export interface ApiError {
  message: string;
  code?: string | number;
  details?: unknown;
}

// Tipos para paginação
/**
 * Parâmetros para requisições paginadas
 * Define configurações de paginação e ordenação
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resposta paginada da API
 * Inclui dados e metadados de paginação
 * @template T - Tipo dos itens na lista paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Tipos para busca e filtragem
/**
 * Parâmetros para operações de busca
 * Suporta busca textual e filtros dinâmicos
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
}

// Resultados de operações de serviço
/**
 * Tipo união para resultados de operações de serviço
 * Implementa padrão Result para tratamento type-safe de sucesso/erro
 * @template T - Tipo dos dados em caso de sucesso
 */
export type ServiceResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiError;
    };
