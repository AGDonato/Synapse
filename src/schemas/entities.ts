/**
 * SCHEMAS PARA ENTIDADES DE DOMÍNIO DO SISTEMA
 *
 * Este arquivo define schemas para todas as entidades de domínio do Synapse.
 * Implementa validações completas para:
 * - Entidades simples: Assunto, TipoDemanda, TipoDocumento, etc.
 * - Entidades complexas: Autoridade, Orgão, Provedor, Demanda
 * - Schemas base reutilizáveis (BaseEntity, SimpleEntity)
 * - Operações CRUD para todas as entidades
 * - Mensagens de erro personalizadas e localizadas
 *
 * Características:
 * - Mensagens de validação em português brasileiro
 * - Validações de tamanho e formato específicas
 * - Transformações automáticas (trim, defaults)
 * - Schemas separados para criação e atualização
 * - Tipos TypeScript derivados para type safety
 *
 * Diferentes dos schemas em entities/, este arquivo foca em:
 * - Entidades de negócio específicas do domínio
 * - Validações de regras de negócio
 * - Mensagens de erro localizadas em PT-BR
 */

// src/schemas/entities.ts

import { z } from 'zod';

/**
 * Funções auxiliares para mensagens de erro personalizadas
 * Mensagens em português brasileiro para validação de formulários
 */
const required = (field: string) => `${field} é obrigatório.`;
const minLength = (field: string, min: number) => `${field} deve ter pelo menos ${min} caracteres.`;
const maxLength = (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres.`;

/**
 * Schema base para todas as entidades
 * - id: identificador numérico opcional (gerado pelo sistema)
 * - Base para herança por outras entidades
 */
export const BaseEntitySchema = z.object({
  id: z.number().optional(),
});

/**
 * Schema para entidades simples com apenas nome
 * - Estende BaseEntity com campo nome validado
 * - Validação: obrigatório, 2-100 caracteres, trim automático
 * - Usado por: Assunto, TipoDemanda, TipoDocumento, etc.
 */
export const SimpleEntitySchema = BaseEntitySchema.extend({
  nome: z
    .string()
    .min(1, required('Nome'))
    .min(2, minLength('Nome', 2))
    .max(100, maxLength('Nome', 100))
    .trim(),
});

/**
 * Schemas para entidades simples do domínio
 * Todas estendem SimpleEntitySchema com validação de nome padrão
 */

/** Schema para assuntos de demandas */
export const AssuntoSchema = SimpleEntitySchema;

/** Schema para tipos de demanda */
export const TipoDemandaSchema = SimpleEntitySchema;

/** Schema para tipos de documento */
export const TipoDocumentoSchema = SimpleEntitySchema;

/** Schema para tipos de identificador */
export const TipoIdentificadorSchema = SimpleEntitySchema;

/** Schema para distribuidores */
export const DistribuidorSchema = SimpleEntitySchema;

/** Schema para tipos de mídia */
export const TipoMidiaSchema = SimpleEntitySchema;

/**
 * Schema para autoridades do sistema
 * - nome: nome da autoridade (2-100 caracteres)
 * - cargo: posição/função da autoridade (2-100 caracteres)
 * - Ambos campos obrigatórios com trim automático
 */
export const AutoridadeSchema = BaseEntitySchema.extend({
  nome: z
    .string()
    .min(1, required('Nome'))
    .min(2, minLength('Nome', 2))
    .max(100, maxLength('Nome', 100))
    .trim(),
  cargo: z
    .string()
    .min(1, required('Cargo'))
    .min(2, minLength('Cargo', 2))
    .max(100, maxLength('Cargo', 100))
    .trim(),
});

/**
 * Schema para órgãos públicos
 * - abreviacao: sigla do órgão (2-20 caracteres, obrigatório)
 * - nomeCompleto: denominação oficial (3-200 caracteres, obrigatório)
 * - enderecamento: informações de endereçamento (até 500 caracteres, opcional)
 * - Default vazio para enderecamento quando não informado
 */
export const OrgaoSchema = BaseEntitySchema.extend({
  abreviacao: z
    .string()
    .min(1, required('Abreviação'))
    .min(2, minLength('Abreviação', 2))
    .max(20, maxLength('Abreviação', 20))
    .trim(),
  nomeCompleto: z
    .string()
    .min(1, required('Nome Completo'))
    .min(3, minLength('Nome Completo', 3))
    .max(200, maxLength('Nome Completo', 200))
    .trim(),
  enderecamento: z.string().max(500, maxLength('Endereçamento', 500)).trim().optional().default(''),
});

/**
 * Schema para provedores/empresas
 * - nomeFantasia: nome comercial (2-100 caracteres, obrigatório)
 * - razaoSocial: denominação jurídica (2-200 caracteres, obrigatório)
 * - enderecamento: informações de endereçamento (até 500 caracteres, opcional)
 * - Default vazio para enderecamento quando não informado
 */
export const ProvedorSchema = BaseEntitySchema.extend({
  nomeFantasia: z
    .string()
    .min(1, required('Nome Fantasia'))
    .min(2, minLength('Nome Fantasia', 2))
    .max(100, maxLength('Nome Fantasia', 100))
    .trim(),
  razaoSocial: z
    .string()
    .min(1, required('Razão Social'))
    .min(2, minLength('Razão Social', 2))
    .max(200, maxLength('Razão Social', 200))
    .trim(),
  enderecamento: z.string().max(500, maxLength('Endereçamento', 500)).trim().optional().default(''),
});

/**
 * Schema para demandas do sistema
 * Entidade principal que agrega documentos e processos
 *
 * Campos obrigatórios:
 * - sged: código no formato YYYY.NNN
 * - tipoDemanda, assunto, orgao, analista: classificação e responsabilidade
 * - dataInicial: início do processo
 * - autosAdministrativos: número do processo
 * - status: estado atual da demanda
 *
 * Campos opcionais:
 * - dataFinal: término do processo (transforma string vazia em null)
 *
 * Validações especiais:
 * - SGED segue padrão YYYY.NNN
 * - Status limitado a valores específicos
 * - Datas validadas como Date parseables
 */
export const DemandaSchema = BaseEntitySchema.extend({
  sged: z
    .string()
    .min(1, required('SGED'))
    .regex(/^\d{4}\.\d{3}$/, 'SGED deve ter o formato YYYY.NNN'),
  tipoDemanda: z.string().min(1, required('Tipo de Demanda')),
  autosAdministrativos: z.string().min(1, required('Autos Administrativos')).trim(),
  assunto: z.string().min(1, required('Assunto')),
  orgao: z.string().min(1, required('Órgão')),
  status: z.enum(['Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando'], {
    message: 'Status deve ser válido',
  }),
  analista: z.string().min(1, required('Analista')).trim(),
  dataInicial: z
    .string()
    .min(1, required('Data Inicial'))
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'Data inicial deve ser uma data válida',
    }),
  dataFinal: z
    .string()
    .refine(date => date === '' || !isNaN(Date.parse(date)), {
      message: 'Data final deve ser uma data válida',
    })
    .transform(val => (val === '' ? null : val))
    .nullable(),
});

/**
 * Schemas para operações de formulário (criação e atualização)
 *
 * Padrão:
 * - CreateXSchema: remove id (gerado pelo sistema)
 * - UpdateXSchema: torna todos os campos opcionais (atualização parcial)
 */
export const CreateAssuntoSchema = AssuntoSchema.omit({ id: true });
export const UpdateAssuntoSchema = CreateAssuntoSchema.partial();

export const CreateTipoDemandaSchema = TipoDemandaSchema.omit({ id: true });
export const UpdateTipoDemandaSchema = CreateTipoDemandaSchema.partial();

export const CreateTipoDocumentoSchema = TipoDocumentoSchema.omit({ id: true });
export const UpdateTipoDocumentoSchema = CreateTipoDocumentoSchema.partial();

export const CreateTipoIdentificadorSchema = TipoIdentificadorSchema.omit({
  id: true,
});
export const UpdateTipoIdentificadorSchema = CreateTipoIdentificadorSchema.partial();

export const CreateDistribuidorSchema = DistribuidorSchema.omit({ id: true });
export const UpdateDistribuidorSchema = CreateDistribuidorSchema.partial();

export const CreateTipoMidiaSchema = TipoMidiaSchema.omit({ id: true });
export const UpdateTipoMidiaSchema = CreateTipoMidiaSchema.partial();

export const CreateAutoridadeSchema = AutoridadeSchema.omit({ id: true });
export const UpdateAutoridadeSchema = CreateAutoridadeSchema.partial();

export const CreateOrgaoSchema = OrgaoSchema.omit({ id: true });
export const UpdateOrgaoSchema = CreateOrgaoSchema.partial();

export const CreateProvedorSchema = ProvedorSchema.omit({ id: true });
export const UpdateProvedorSchema = CreateProvedorSchema.partial();

export const CreateDemandaSchema = DemandaSchema.omit({ id: true });
export const UpdateDemandaSchema = CreateDemandaSchema.partial();

/**
 * Tipos TypeScript inferidos dos schemas
 * Utilizados para type safety em formulários e operações CRUD
 *
 * Padrão de nomenclatura:
 * - CreateXInput: tipo para criação de entidade
 * - UpdateXInput: tipo para atualização de entidade
 */
export type CreateAssuntoInput = z.infer<typeof CreateAssuntoSchema>;
export type UpdateAssuntoInput = z.infer<typeof UpdateAssuntoSchema>;

export type CreateAutoridadeInput = z.infer<typeof CreateAutoridadeSchema>;
export type UpdateAutoridadeInput = z.infer<typeof UpdateAutoridadeSchema>;

export type CreateOrgaoInput = z.infer<typeof CreateOrgaoSchema>;
export type UpdateOrgaoInput = z.infer<typeof UpdateOrgaoSchema>;

export type CreateProvedorInput = z.infer<typeof CreateProvedorSchema>;
export type UpdateProvedorInput = z.infer<typeof UpdateProvedorSchema>;

export type CreateDemandaInput = z.infer<typeof CreateDemandaSchema>;
export type UpdateDemandaInput = z.infer<typeof UpdateDemandaSchema>;
