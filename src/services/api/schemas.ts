import { z } from 'zod';

// Base schemas
export const IdSchema = z.number().int().positive();
export const DateSchema = z.string().datetime().or(z.date()).transform(val => 
  typeof val === 'string' ? new Date(val) : val
);
export const OptionalDateSchema = DateSchema.optional().nullable();

// Status schemas
export const StatusSchema = z.enum(['ativo', 'inativo', 'pendente', 'cancelado']);
export const PrioridadeSchema = z.enum(['baixa', 'media', 'alta', 'urgente']);

// Demanda schemas
export const TipoDemandaSchema = z.object({
  id: IdSchema,
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const OrgaoSchema = z.object({
  id: IdSchema,
  nome: z.string().min(1, 'Nome é obrigatório'),
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  sigla: z.string().min(1, 'Sigla é obrigatória'),
  tipo: z.enum(['federal', 'estadual', 'municipal']),
  ativo: z.boolean().default(true),
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

export const DemandaSchema = z.object({
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
  
  // Relationships
  tipo_demanda: TipoDemandaSchema.optional(),
  orgao_solicitante: OrgaoSchema.optional(),
  assunto: AssuntoSchema.optional(),
  documentos: z.array(z.lazy(() => DocumentoSchema)).optional(),
  
  created_at: DateSchema,
  updated_at: DateSchema,
});

// Documento schemas
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

export const DocumentoSchema = z.object({
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
  
  // Relationships
  tipo_documento: TipoDocumentoSchema.optional(),
  demanda: DemandaSchema.optional(),
  anexos: z.array(z.object({
    id: IdSchema,
    nome: z.string(),
    tipo: z.string(),
    tamanho: z.number(),
    url: z.string().url(),
  })).optional(),
  
  created_at: DateSchema,
  updated_at: DateSchema,
});

// Create/Update schemas (without auto-generated fields)
export const CreateDemandaSchema = DemandaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  tipo_demanda: true,
  orgao_solicitante: true,
  assunto: true,
  documentos: true,
});

export const UpdateDemandaSchema = CreateDemandaSchema.partial();

export const CreateDocumentoSchema = DocumentoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  tipo_documento: true,
  demanda: true,
  anexos: true,
});

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

export const CreateAutoridade = AutoridadeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  orgao: true,
});

export const UpdateAutoridadeSchema = CreateAutoridade.partial();

// List/Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(10),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).default('desc'),
});

export const ListResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  data: z.array(itemSchema),
  meta: z.object({
    current_page: z.number(),
    last_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    from: z.number().optional(),
    to: z.number().optional(),
  }),
  links: z.object({
    first: z.string().url().optional(),
    last: z.string().url().optional(),
    prev: z.string().url().optional(),
    next: z.string().url().optional(),
  }).optional(),
});

// Filter schemas
export const DemandaFiltersSchema = z.object({
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
}).merge(PaginationSchema);

export const DocumentoFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  tipo_documento_id: z.array(IdSchema).optional(),
  demanda_id: IdSchema.optional(),
  data_criacao_inicio: DateSchema.optional(),
  data_criacao_fim: DateSchema.optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

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

export type DemandaFilters = z.infer<typeof DemandaFiltersSchema>;
export type DocumentoFilters = z.infer<typeof DocumentoFiltersSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export interface ListResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
  };
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}