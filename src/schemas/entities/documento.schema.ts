// src/schemas/entities/documento.schema.ts
import { z } from 'zod';
import { 
  DateSchema, 
  IdSchema, 
  NomeSchema, 
  OptionalDateSchema,
  SgedSchema,
  StatusSchema
} from './common.schema';

// Schema para Documento
export const DocumentoSchema = z.object({
  id: IdSchema,
  demandaId: IdSchema,
  sgedDemanda: SgedSchema,
  tipoDocumento: NomeSchema,
  destinatario: NomeSchema,
  enderecamento: z.string().optional(),
  assunto: NomeSchema,
  autosAdministrativos: z.string().optional(),
  tipoMidia: NomeSchema,
  dataEnvio: DateSchema,
  dataResposta: OptionalDateSchema,
  status: StatusSchema,
  observacoes: z.string().optional(),
  arquivos: z.array(z.string()).optional(), // URLs ou nomes dos arquivos
  
  // Campos de auditoria
  criadoEm: z.date().optional(),
  atualizadoEm: z.date().optional(),
  criadoPor: IdSchema.optional(),
  atualizadoPor: IdSchema.optional(),
});

// Schema para criação
export const CreateDocumentoSchema = DocumentoSchema.omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPor: true,
  atualizadoPor: true,
});

// Schema para atualização
export const UpdateDocumentoSchema = DocumentoSchema.partial().required({ id: true });

// Schema para filtros
export const DocumentoFiltersSchema = z.object({
  status: z.array(StatusSchema).optional(),
  tipoDocumento: z.array(z.string()).optional(),
  tipoMidia: z.array(z.string()).optional(),
  destinatario: z.array(z.string()).optional(),
  assunto: z.array(z.string()).optional(),
  demandaId: IdSchema.optional(),
  sgedDemanda: SgedSchema.optional(),
  dataEnvioInicio: OptionalDateSchema,
  dataEnvioFim: OptionalDateSchema,
  dataRespostaInicio: OptionalDateSchema,
  dataRespostaFim: OptionalDateSchema,
  search: z.string().optional(),
});

// Tipos inferidos
export type Documento = z.infer<typeof DocumentoSchema>;
export type CreateDocumento = z.infer<typeof CreateDocumentoSchema>;
export type UpdateDocumento = z.infer<typeof UpdateDocumentoSchema>;
export type DocumentoFilters = z.infer<typeof DocumentoFiltersSchema>;