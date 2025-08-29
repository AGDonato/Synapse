/**
 * SCHEMAS PARA ENTIDADE DEMANDA
 *
 * Este arquivo define a estrutura e validação para demandas do sistema.
 * Implementa schemas para:
 * - Entidade completa de demanda com campos obrigatórios e opcionais
 * - Operações CRUD (criar, atualizar) com validações específicas
 * - Sistema de filtros avançados para buscas e relatórios
 * - Campos de auditoria para rastreabilidade
 * - Validação de datas e ranges temporais
 *
 * Utiliza schemas comuns reutilizáveis do common.schema.ts.
 * Fornece tipos TypeScript derivados para type safety.
 * Estrutura alinhada com modelo de dados do sistema.
 */

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
  TelefoneSchema,
} from './common.schema';

/**
 * Schema principal para entidade Demanda
 * Define estrutura completa com todos os campos disponíveis
 *
 * Campos principais:
 * - id, sged: identificadores únicos
 * - tipoDemanda, assunto: classificação e descrição
 * - orgaoRequisitante, autoridade: partes envolvidas
 * - autosAdministrativos: número de processo (opcional)
 * - dataInicial/dataFinal: período da demanda
 * - status, prioridade: estado e importância
 * - observacoes: comentários adicionais
 *
 * Auditoria:
 * - Timestamps de criação e atualização
 * - IDs dos usuários responsáveis pelas operações
 */
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

/**
 * Schema para criação de nova demanda
 * - Remove id (gerado automaticamente pelo sistema)
 * - Remove campos de auditoria (preenchidos pelo backend)
 * - Mantém todas as validações dos campos obrigatórios
 */
export const CreateDemandaSchema = DemandaSchema.omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPor: true,
  atualizadoPor: true,
});

/**
 * Schema para atualização de demanda existente
 * - Todos os campos são opcionais (permite atualizações parciais)
 * - ID permanece obrigatório para identificação
 * - Campos de auditoria são tratados pelo backend
 */
export const UpdateDemandaSchema = DemandaSchema.partial().required({ id: true });

/**
 * Schema para filtros avançados de demandas
 * Permite combinação de múltiplos critérios:
 *
 * Filtros de seleção múltipla:
 * - status, prioridade: arrays para seleção de múltiplos valores
 * - tipoDemanda, assunto, orgaoRequisitante, autoridade: categorização
 * - analista: filtro por responsável
 *
 * Filtros temporais:
 * - dataInicialInicio/Fim: range para data inicial
 * - dataFinalInicio/Fim: range para data final
 *
 * Busca textual:
 * - search: termo livre para busca em múltiplos campos
 */
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

/**
 * Tipos TypeScript inferidos dos schemas
 * Utilizados em toda a aplicação para type safety
 *
 * - Demanda: tipo completo da entidade
 * - CreateDemanda: tipo para criação (sem auditoria)
 * - UpdateDemanda: tipo para atualização (campos opcionais)
 * - DemandaFilters: tipo para parâmetros de filtro
 */
export type Demanda = z.infer<typeof DemandaSchema>;
export type CreateDemanda = z.infer<typeof CreateDemandaSchema>;
export type UpdateDemanda = z.infer<typeof UpdateDemandaSchema>;
export type DemandaFilters = z.infer<typeof DemandaFiltersSchema>;
