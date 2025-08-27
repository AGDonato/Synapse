// src/schemas/entities/common.schema.ts
import { z } from 'zod';

// Schemas comuns para validação
export const DateSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA')
  .refine(
    (date) => {
      const [day, month, year] = date.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.getFullYear() === year && 
             dateObj.getMonth() === month - 1 && 
             dateObj.getDate() === day;
    },
    'Data inválida'
  );

export const OptionalDateSchema = z.union([DateSchema, z.literal(''), z.null()]).optional();

export const StatusSchema = z.enum(['ativo', 'inativo'], {
  errorMap: () => ({ message: 'Status deve ser "ativo" ou "inativo"' })
});

export const PrioridadeSchema = z.enum(['baixa', 'media', 'alta', 'urgente'], {
  errorMap: () => ({ message: 'Prioridade deve ser "baixa", "media", "alta" ou "urgente"' })
});

export const SgedSchema = z
  .string()
  .min(1, 'SGED é obrigatório')
  .regex(/^\d+$/, 'SGED deve conter apenas números');

export const IdSchema = z.number().int().positive('ID deve ser um número positivo');

export const NomeSchema = z
  .string()
  .min(1, 'Nome é obrigatório')
  .max(255, 'Nome deve ter no máximo 255 caracteres')
  .trim();

export const EmailSchema = z
  .string()
  .email('Email inválido')
  .optional();

export const TelefoneSchema = z
  .string()
  .regex(/^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/, 'Telefone inválido')
  .optional();