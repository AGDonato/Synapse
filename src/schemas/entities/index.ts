/**
 * CENTRAL DE EXPORTS DOS SCHEMAS DE ENTIDADES
 *
 * Este arquivo serve como ponto central para todos os schemas do sistema.
 * Facilita importação unificada dos schemas e tipos em toda a aplicação.
 *
 * Schemas disponíveis:
 * - common.schema: Validações reutilizáveis (datas, IDs, status, prioridade)
 * - api.schema: Estruturas de API (responses, errors, pagination, JWT)
 * - demanda.schema: Entidade demanda com CRUD e filtros
 * - documento.schema: Entidade documento com vínculo a demanda
 *
 * Padrão de uso:
 * - Import específico: import { DemandaSchema } from './schemas/entities'
 * - Import múltiplo: import { DemandaSchema, DocumentoSchema } from './schemas/entities'
 * - Import de tipos: import type { Demanda, Documento } from './schemas/entities'
 *
 * Todos os schemas utilizam Zod para validação runtime e inferência de tipos.
 */

// src/schemas/entities/index.ts

/**
 * Schemas para entidade Demanda
 * - DemandaSchema, CreateDemandaSchema, UpdateDemandaSchema
 * - DemandaFiltersSchema
 * - Tipos: Demanda, CreateDemanda, UpdateDemanda, DemandaFilters
 */
export * from './demanda.schema';

/**
 * Schemas para entidade Documento
 * - DocumentoSchema, CreateDocumentoSchema, UpdateDocumentoSchema
 * - DocumentoFiltersSchema
 * - Tipos: Documento, CreateDocumento, UpdateDocumento, DocumentoFilters
 */
export * from './documento.schema';

/**
 * Schemas comuns reutilizáveis
 * - DateSchema, OptionalDateSchema, StatusSchema, PrioridadeSchema
 * - IdSchema, NomeSchema, EmailSchema, TelefoneSchema, SgedSchema
 */
export * from './common.schema';

/**
 * Schemas para operações de API
 * - ApiResponseSchema, ApiErrorSchema, PaginationSchema
 * - FileUploadSchema, JwtPayloadSchema
 * - Tipos: ApiResponse, ApiError, Pagination, FileUpload, JwtPayload
 */
export * from './api.schema';
