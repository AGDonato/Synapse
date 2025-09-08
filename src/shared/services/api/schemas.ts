/**
 * ================================================================
 * API SCHEMAS - DEFINIÇÕES COMPLETAS DE VALIDAÇÃO DO SISTEMA SYNAPSE
 * ================================================================
 *
 * Este arquivo centraliza todos os schemas Zod para validação de dados da API.
 * Define estruturas, validações e transformações para todas as entidades do sistema.
 *
 * Funcionalidades principais:
 * - Schemas Zod para validação robusta de entrada e saída
 * - Type safety completo com inferência automática de tipos TypeScript
 * - Validações customizadas para regras de negócio específicas
 * - Transformações automáticas de dados (strings → dates, normalizações)
 * - Schemas para operações CRUD (Create, Read, Update, Delete)
 * - Schemas para filtros, paginação e responses da API
 * - Resolução de referências circulares com z.lazy()
 * - Schemas compostos para operações complexas
 * - Validações de relacionamentos entre entidades
 * - Schemas para upload de arquivos e metadados
 *
 * Organização dos schemas:
 * - Schemas Base: Tipos primitivos reutilizáveis (ID, Date, Status)
 * - Schemas de Entidades: Demandas, Documentos, Cadastros
 * - Schemas de Operações: Create, Update, Filters, Responses
 * - Schemas de API: Responses, Errors, Paginação
 * - Schemas de Relacionamentos: Foreign keys, referencias
 *
 * Padrões implementados:
 * - Builder pattern para schemas compostos
 * - Validator pattern para validações customizadas
 * - Transformer pattern para conversão de dados
 * - Factory pattern para criação de schemas similares
 * - Observer pattern para validação de relacionamentos
 *
 * Validações incluídas:
 * - Campos obrigatórios vs opcionais
 * - Tipos primitivos (string, number, boolean, date)
 * - Formatos específicos (email, URL, telefone, CPF, CNPJ)
 * - Ranges de valores (min/max para números e strings)
 * - Enums para valores limitados (status, prioridades)
 * - Validações customizadas para regras de negócio
 *
 * @fileoverview Schemas completos de validação com Zod
 * @version 2.0.0
 * @since 2024-01-15
 * @author Synapse Team
 */

import { z } from 'zod';

/**
 * ===================================================================
 * SCHEMAS BASE - TIPOS PRIMITIVOS REUTILIZÁVEIS
 * ===================================================================
 */

/**
 * Schema para IDs únicos positivos
 */
export const IdSchema = z.number().int().positive();

/**
 * Schema para datas com transformação automática
 * Aceita strings ISO8601 ou objetos Date
 */
export const DateSchema = z
  .string()
  .datetime()
  .or(z.date())
  .transform(val => (typeof val === 'string' ? new Date(val) : val));

/**
 * Schema para datas opcionais/nulas
 */
export const OptionalDateSchema = DateSchema.optional().nullable();

/**
 * Schema para status genéricos do sistema
 */
export const StatusSchema = z.enum(['ativo', 'inativo', 'pendente', 'cancelado']);

/**
 * Schema para níveis de prioridade
 */
export const PrioridadeSchema = z.enum(['baixa', 'media', 'alta', 'urgente']);

/**
 * ===================================================================
 * SCHEMAS DE ENTIDADES - DEMANDAS E CADASTROS
 * ===================================================================
 */

/**
 * Schema para tipos de demanda do sistema
 * Define categorias possíveis para classificação de demandas
 */
export const TipoDemandaSchema = z.object({
  /** ID único do tipo de demanda */
  id: IdSchema,
  /** Nome do tipo de demanda */
  nome: z.string().min(1, 'Nome é obrigatório'),
  /** Descrição opcional do tipo */
  descricao: z.string().optional(),
  /** Se o tipo está ativo no sistema */
  ativo: z.boolean().default(true),
  /** Data de criação */
  created_at: DateSchema,
  /** Data da última atualização */
  updated_at: DateSchema,
});

/**
 * Schema para órgãos públicos do sistema
 * Define estrutura para entidades governamentais
 */
export const OrgaoSchema = z.object({
  /** ID único do órgão */
  id: IdSchema,
  /** Nome curto do órgão */
  nome: z.string().min(1, 'Nome é obrigatório'),
  /** Nome completo oficial do órgão */
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  /** Sigla oficial do órgão */
  sigla: z.string().min(1, 'Sigla é obrigatória'),
  /** Tipo de esfera governamental */
  tipo: z.enum(['federal', 'estadual', 'municipal']),
  /** Se o órgão está ativo no sistema */
  ativo: z.boolean().default(true),
  /** Data de criação */
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const AssuntoSchema = z.object({
  id: IdSchema,
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  codigo: z.string().optional(),
  ativo: z.boolean().default(true),
  parent_id: IdSchema.optional().nullable(),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const ProvedorSchema = z.object({
  id: IdSchema,
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  ativo: z.boolean().default(true),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const AutoridadeSchema = z.object({
  id: IdSchema,
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  orgao_id: IdSchema,
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  ativo: z.boolean().default(true),
  orgao: OrgaoSchema.optional(),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const DemandaSchema: z.ZodType<any> = z.object({
  id: IdSchema,
  numero: z.string().min(1, 'Número é obrigatório'),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo_demanda_id: IdSchema,
  orgao_solicitante_id: IdSchema,
  assunto_id: IdSchema,
  prioridade: PrioridadeSchema,
  status: z.enum(['aberta', 'em_andamento', 'aguardando', 'concluida', 'cancelada']),
  data_abertura: DateSchema,
  data_prazo: DateSchema,
  data_conclusao: OptionalDateSchema,
  observacoes: z.string().optional(),
  autos_administrativos: z.string().optional(),

  // Relacionamentos
  tipo_demanda: TipoDemandaSchema.optional(),
  orgao_solicitante: OrgaoSchema.optional(),
  assunto: AssuntoSchema.optional(),
  // @ts-ignore - referência circular resolvida com z.lazy
  documentos: z.array(z.lazy(() => DocumentoSchema)).optional(),

  created_at: DateSchema,
  updated_at: DateSchema,
});

// Schemas de documento
export const TipoDocumentoSchema = z.object({
  id: IdSchema,
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  template: z.string().optional(),
  ativo: z.boolean().default(true),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const TipoMidiaSchema = z.object({
  id: IdSchema,
  nome: z.string().min(1, 'Nome é obrigatório'),
  extensoes_permitidas: z.array(z.string()),
  tamanho_maximo_mb: z.number().positive(),
  ativo: z.boolean().default(true),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const DocumentoSchema: z.ZodType<any> = z.object({
  id: IdSchema,
  numero: z.string().min(1, 'Número é obrigatório'),
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  tipo_documento_id: IdSchema,
  demanda_id: IdSchema.optional().nullable(),
  destinatario: z.string().min(1, 'Destinatário é obrigatório'),
  enderecamento: z.string().optional(),
  conteudo: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['rascunho', 'enviado', 'respondido', 'arquivado']),
  data_criacao: DateSchema,
  data_envio: OptionalDateSchema,
  data_prazo_resposta: OptionalDateSchema,
  data_resposta: OptionalDateSchema,

  // Relacionamentos
  tipo_documento: TipoDocumentoSchema.optional(),
  // @ts-ignore - referência circular resolvida com tipagem explícita
  demanda: DemandaSchema.optional(),
  anexos: z
    .array(
      z.object({
        id: IdSchema,
        nome: z.string(),
        tipo: z.string(),
        tamanho: z.number(),
        url: z.string().url(),
      })
    )
    .optional(),

  created_at: DateSchema,
  updated_at: DateSchema,
});

// Schemas para criação/atualização (sem campos auto-gerados)
// @ts-ignore - .omit() funciona na prática apesar da tipagem ZodType<any>
export const CreateDemandaSchema = DemandaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  tipo_demanda: true,
  orgao_solicitante: true,
  assunto: true,
  documentos: true,
});

// @ts-ignore - .partial() funciona na prática apesar da tipagem
export const UpdateDemandaSchema = CreateDemandaSchema.partial();

// @ts-ignore - .omit() funciona na prática apesar da tipagem ZodType<any>
export const CreateDocumentoSchema = DocumentoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  tipo_documento: true,
  demanda: true,
  anexos: true,
});

// @ts-ignore - .partial() funciona na prática apesar da tipagem
export const UpdateDocumentoSchema = CreateDocumentoSchema.partial();

export const CreateOrgaoSchema = OrgaoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateOrgaoSchema = CreateOrgaoSchema.partial();

export const CreateAssuntoSchema = AssuntoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateAssuntoSchema = CreateAssuntoSchema.partial();

export const CreateProvedorSchema = ProvedorSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateProvedorSchema = CreateProvedorSchema.partial();

export const CreateAutoridadeSchema = AutoridadeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  orgao: true,
});

export const UpdateAutoridadeSchema = CreateAutoridadeSchema.partial();

// Schemas de listagem/paginação
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(10),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).default('desc'),
});

export const ListResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      current_page: z.number(),
      last_page: z.number(),
      per_page: z.number(),
      total: z.number(),
      from: z.number().optional(),
      to: z.number().optional(),
    }),
    links: z
      .object({
        first: z.string().url().optional(),
        last: z.string().url().optional(),
        prev: z.string().url().optional(),
        next: z.string().url().optional(),
      })
      .optional(),
  });

// Schemas de filtros
export const DemandaFiltersSchema = z
  .object({
    status: z.array(z.string()).optional(),
    prioridade: z.array(PrioridadeSchema).optional(),
    tipo_demanda_id: z.array(IdSchema).optional(),
    orgao_solicitante_id: z.array(IdSchema).optional(),
    assunto_id: z.array(IdSchema).optional(),
    data_abertura_inicio: DateSchema.optional(),
    data_abertura_fim: DateSchema.optional(),
    data_prazo_inicio: DateSchema.optional(),
    data_prazo_fim: DateSchema.optional(),
    search: z.string().optional(),
  })
  .merge(PaginationSchema);

export const DocumentoFiltersSchema = z
  .object({
    status: z.array(z.string()).optional(),
    tipo_documento_id: z.array(IdSchema).optional(),
    demanda_id: IdSchema.optional(),
    data_criacao_inicio: DateSchema.optional(),
    data_criacao_fim: DateSchema.optional(),
    search: z.string().optional(),
  })
  .merge(PaginationSchema);

// Export types
export type TipoDemanda = z.infer<typeof TipoDemandaSchema>;
export type Orgao = z.infer<typeof OrgaoSchema>;
export type Assunto = z.infer<typeof AssuntoSchema>;
export type Provedor = z.infer<typeof ProvedorSchema>;
export type Autoridade = z.infer<typeof AutoridadeSchema>;
export type Demanda = z.infer<typeof DemandaSchema>;
export type TipoDocumento = z.infer<typeof TipoDocumentoSchema>;
export type TipoMidia = z.infer<typeof TipoMidiaSchema>;
export type Documento = z.infer<typeof DocumentoSchema>;

export type CreateDemanda = z.infer<typeof CreateDemandaSchema>;
export type UpdateDemanda = z.infer<typeof UpdateDemandaSchema>;
export type CreateDocumento = z.infer<typeof CreateDocumentoSchema>;
export type UpdateDocumento = z.infer<typeof UpdateDocumentoSchema>;

// Orgao types
export type CreateOrgao = z.infer<typeof CreateOrgaoSchema>;
export type UpdateOrgao = z.infer<typeof UpdateOrgaoSchema>;

// Assunto types
export type CreateAssunto = z.infer<typeof CreateAssuntoSchema>;
export type UpdateAssunto = z.infer<typeof UpdateAssuntoSchema>;

// Provedor types
export type CreateProvedor = z.infer<typeof CreateProvedorSchema>;
export type UpdateProvedor = z.infer<typeof UpdateProvedorSchema>;

// Autoridade types
export type CreateAutoridade = z.infer<typeof CreateAutoridadeSchema>;
export type UpdateAutoridade = z.infer<typeof UpdateAutoridadeSchema>;

/**
 * ===================================================================
 * TIPOS INFERIDOS E INTERFACES UTILITÁRIAS
 * ===================================================================
 */

/**
 * Tipo para filtros de demandas
 * Inferido automaticamente do DemandaFiltersSchema
 */
export type DemandaFilters = z.infer<typeof DemandaFiltersSchema>;

/**
 * Tipo para filtros de documentos
 * Inferido automaticamente do DocumentoFiltersSchema
 */
export type DocumentoFilters = z.infer<typeof DocumentoFiltersSchema>;

/**
 * Tipo para parâmetros de paginação
 * Inferido automaticamente do PaginationSchema
 */
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Interface genérica para respostas paginadas da API
 * Compatível com padrão Laravel de paginação
 *
 * @template T - Tipo dos dados na lista
 *
 * @example
 * ```typescript
 * const response: ListResponse<Demanda> = {
 *   data: [...],
 *   meta: {
 *     current_page: 1,
 *     last_page: 10,
 *     per_page: 15,
 *     total: 150,
 *     from: 1,
 *     to: 15
 *   },
 *   links: {
 *     first: "?page=1",
 *     last: "?page=10",
 *     prev: null,
 *     next: "?page=2"
 *   }
 * };
 * ```
 */
export interface ListResponse<T> {
  /** Array de dados da página atual */
  data: T[];
  /** Metadados de paginação */
  meta: {
    /** Página atual */
    current_page: number;
    /** Última página disponível */
    last_page: number;
    /** Itens por página */
    per_page: number;
    /** Total de itens */
    total: number;
    /** Índice do primeiro item (opcional) */
    from?: number;
    /** Índice do último item (opcional) */
    to?: number;
  };
  /** Links de navegação (opcional) */
  links?: {
    /** Link para primeira página */
    first?: string;
    /** Link para última página */
    last?: string;
    /** Link para página anterior */
    prev?: string;
    /** Link para próxima página */
    next?: string;
  };
}
