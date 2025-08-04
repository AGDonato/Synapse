// src/schemas/entities.ts

import { z } from 'zod';
import { MESSAGES } from '../constants/messages';

// Helper function to create error messages
const required = (field: string) => MESSAGES.ERROR.REQUIRED_FIELD(field);
const minLength = (field: string, min: number) =>
  MESSAGES.VALIDATION.MIN_LENGTH(field, min);
const maxLength = (field: string, max: number) =>
  MESSAGES.VALIDATION.MAX_LENGTH(field, max);

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.number().optional(),
});

export const SimpleEntitySchema = BaseEntitySchema.extend({
  nome: z
    .string()
    .min(1, required('Nome'))
    .min(2, minLength('Nome', 2))
    .max(100, maxLength('Nome', 100))
    .trim(),
});

// Domain entity schemas
export const AssuntoSchema = SimpleEntitySchema;

export const TipoDemandaSchema = SimpleEntitySchema;

export const TipoDocumentoSchema = SimpleEntitySchema;

export const TipoIdentificadorSchema = SimpleEntitySchema;

export const DistribuidorSchema = SimpleEntitySchema;

export const TipoMidiaSchema = SimpleEntitySchema;

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
  enderecamento: z
    .string()
    .max(500, maxLength('Endereçamento', 500))
    .trim()
    .optional()
    .default(''),
});

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
  enderecamento: z
    .string()
    .max(500, maxLength('Endereçamento', 500))
    .trim()
    .optional()
    .default(''),
});

export const DemandaSchema = BaseEntitySchema.extend({
  sged: z
    .string()
    .min(1, required('SGED'))
    .regex(/^\d{4}\.\d{3}$/, 'SGED deve ter o formato YYYY.NNN'),
  tipoDemanda: z.string().min(1, required('Tipo de Demanda')),
  autosAdministrativos: z
    .string()
    .min(1, required('Autos Administrativos'))
    .trim(),
  assunto: z.string().min(1, required('Assunto')),
  orgao: z.string().min(1, required('Órgão')),
  status: z.enum(
    ['Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando'],
    {
      message: 'Status deve ser válido',
    }
  ),
  analista: z.string().min(1, required('Analista')).trim(),
  dataInicial: z
    .string()
    .min(1, required('Data Inicial'))
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Data inicial deve ser uma data válida',
    }),
  dataFinal: z
    .string()
    .refine((date) => date === '' || !isNaN(Date.parse(date)), {
      message: 'Data final deve ser uma data válida',
    })
    .transform((val) => (val === '' ? null : val))
    .nullable(),
});

// Form schemas (for creation/update operations)
export const CreateAssuntoSchema = AssuntoSchema.omit({ id: true });
export const UpdateAssuntoSchema = CreateAssuntoSchema.partial();

export const CreateTipoDemandaSchema = TipoDemandaSchema.omit({ id: true });
export const UpdateTipoDemandaSchema = CreateTipoDemandaSchema.partial();

export const CreateTipoDocumentoSchema = TipoDocumentoSchema.omit({ id: true });
export const UpdateTipoDocumentoSchema = CreateTipoDocumentoSchema.partial();

export const CreateTipoIdentificadorSchema = TipoIdentificadorSchema.omit({
  id: true,
});
export const UpdateTipoIdentificadorSchema =
  CreateTipoIdentificadorSchema.partial();

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

// Type inference from schemas
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
