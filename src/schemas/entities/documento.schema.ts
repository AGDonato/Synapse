/**
 * SCHEMAS PARA ENTIDADE DOCUMENTO
 *
 * Este arquivo define a estrutura e validação para documentos do sistema.
 * Implementa schemas para:
 * - Entidade completa de documento com vínculo à demanda
 * - Gerenciamento de arquivos anexos (URLs/caminhos)
 * - Operações CRUD com validações específicas
 * - Sistema de filtros avançados para buscas
 * - Controle de datas de envio e resposta
 * - Campos de auditoria para rastreabilidade
 *
 * Documentos são sempre vinculados a uma demanda principal.
 * Utiliza schemas comuns reutilizáveis do common.schema.ts.
 * Fornece tipos TypeScript derivados para type safety.
 */

// src/schemas/entities/documento.schema.ts
import { z } from 'zod';
import {
  DateSchema,
  IdSchema,
  NomeSchema,
  OptionalDateSchema,
  SgedSchema,
  StatusSchema,
} from './common.schema';

/**
 * Schema principal para entidade Documento
 * Define estrutura completa vinculada a uma demanda
 *
 * Identificação e vínculo:
 * - id: identificador único do documento
 * - demandaId, sgedDemanda: vínculo com demanda principal
 *
 * Conteúdo e classificação:
 * - tipoDocumento: categoria do documento
 * - destinatario, enderecamento: informações do destinatário
 * - assunto: resumo do conteúdo
 * - autosAdministrativos: número de processo (opcional)
 * - tipoMidia: formato de envio (físico/digital)
 *
 * Controle temporal:
 * - dataEnvio: data obrigatória do envio
 * - dataResposta: data de retorno (opcional)
 *
 * Gerenciamento:
 * - status: estado atual do documento
 * - observacoes: comentários adicionais
 * - arquivos: URLs ou caminhos dos anexos
 *
 * Auditoria:
 * - Timestamps e IDs dos responsáveis pelas operações
 */
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

/**
 * Schema para criação de novo documento
 * - Remove id (gerado automaticamente pelo sistema)
 * - Remove campos de auditoria (preenchidos pelo backend)
 * - Mantém vinculação obrigatória com demanda
 * - Preserva validações de campos obrigatórios
 */
export const CreateDocumentoSchema = DocumentoSchema.omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPor: true,
  atualizadoPor: true,
});

/**
 * Schema para atualização de documento existente
 * - Todos os campos são opcionais (atualizações parciais)
 * - ID permanece obrigatório para identificação
 * - Permite atualizar arquivos anexos individualmente
 */
export const UpdateDocumentoSchema = DocumentoSchema.partial().required({ id: true });

/**
 * Schema para filtros avançados de documentos
 * Permite combinação de múltiplos critérios:
 *
 * Filtros de seleção múltipla:
 * - status: arrays para seleção de múltiplos estados
 * - tipoDocumento, tipoMidia: categorização e formato
 * - destinatario, assunto: conteúdo e destinatário
 *
 * Filtros de vínculo:
 * - demandaId, sgedDemanda: filtro por demanda específica
 *
 * Filtros temporais:
 * - dataEnvioInicio/Fim: range para data de envio
 * - dataRespostaInicio/Fim: range para data de resposta
 *
 * Busca textual:
 * - search: termo livre para busca em múltiplos campos
 */
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

/**
 * Tipos TypeScript inferidos dos schemas
 * Utilizados em toda a aplicação para type safety
 *
 * - Documento: tipo completo da entidade com auditoria
 * - CreateDocumento: tipo para criação (sem campos gerados)
 * - UpdateDocumento: tipo para atualização (campos opcionais)
 * - DocumentoFilters: tipo para parâmetros de filtro avançado
 */
export type Documento = z.infer<typeof DocumentoSchema>;
export type CreateDocumento = z.infer<typeof CreateDocumentoSchema>;
export type UpdateDocumento = z.infer<typeof UpdateDocumentoSchema>;
export type DocumentoFilters = z.infer<typeof DocumentoFiltersSchema>;
