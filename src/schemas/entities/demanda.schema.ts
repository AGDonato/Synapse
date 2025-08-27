// src/schemas/entities/demanda.schema.ts
import { z } from 'zod';
import { 
  DateSchema, 
  EmailSchema, 
  IdSchema, 
  NomeSchema, 
  OptionalDateSchema,
  PrioridadeSchema,
  SgedSchema,
  StatusSchema,
  TelefoneSchema
} from './common.schema';

// Schema para Demanda
export const DemandaSchema = z.object({
  id: IdSchema,
  sged: SgedSchema,
  tipoDemanda: NomeSchema,
  assunto: NomeSchema,
  orgaoRequisitante: NomeSchema,
  autoridade: NomeSchema,
  autosAdministrativos: z.string().optional(),
  dataInicial: DateSchema,
  dataFinal: OptionalDateSchema,
  status: StatusSchema,
  prioridade: PrioridadeSchema,
  observacoes: z.string().optional(),
  
  // Campos de auditoria
  criadoEm: z.date().optional(),
  atualizadoEm: z.date().optional(),
  criadoPor: IdSchema.optional(),
  atualizadoPor: IdSchema.optional(),
});

// Schema para criação (sem id e campos de auditoria)
export const CreateDemandaSchema = DemandaSchema.omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPor: true,
  atualizadoPor: true,
});

// Schema para atualização (todos os campos opcionais exceto id)
export const UpdateDemandaSchema = DemandaSchema.partial().required({ id: true });

// Schema para filtros
export const DemandaFiltersSchema = z.object({
  status: z.array(StatusSchema).optional(),
  prioridade: z.array(PrioridadeSchema).optional(),
  tipoDemanda: z.array(z.string()).optional(),
  assunto: z.array(z.string()).optional(),
  orgaoRequisitante: z.array(z.string()).optional(),
  autoridade: z.array(z.string()).optional(),
  analista: z.array(z.string()).optional(),
  dataInicialInicio: OptionalDateSchema,
  dataInicialFim: OptionalDateSchema,
  dataFinalInicio: OptionalDateSchema,
  dataFinalFim: OptionalDateSchema,
  search: z.string().optional(),
});

// Tipos inferidos dos schemas
export type Demanda = z.infer<typeof DemandaSchema>;
export type CreateDemanda = z.infer<typeof CreateDemandaSchema>;
export type UpdateDemanda = z.infer<typeof UpdateDemandaSchema>;
export type DemandaFilters = z.infer<typeof DemandaFiltersSchema>;