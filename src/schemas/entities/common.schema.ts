/**
 * SCHEMAS COMUNS PARA VALIDAÇÃO ZOD
 *
 * Este arquivo define schemas reutilizáveis usados em todo o sistema.
 * Implementa validações consistentes para:
 * - Formatos de data brasileiro (DD/MM/AAAA)
 * - Padrões de status e prioridade
 * - Validações de campos básicos (nome, email, telefone)
 * - Schemas de identificadores únicos (ID, SGED)
 * - Validações opcionais com fallbacks seguros
 *
 * Utiliza Zod para validação runtime e inferência de tipos TypeScript.
 * Todos os schemas incluem mensagens de erro em português.
 * Patterns de validação seguem padrões brasileiros quando aplicável.
 */

// src/schemas/entities/common.schema.ts
import { z } from 'zod';
/**
 * Schema para validação de datas no formato brasileiro DD/MM/AAAA
 * - Valida formato com regex
 * - Verifica se a data é válida (não aceita 31/02/2024)
 * - Usado em campos de data em formulários
 */
export const DateSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA')
  .refine(date => {
    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  }, 'Data inválida');

/**
 * Schema para datas opcionais
 * - Aceita data válida, string vazia, null ou undefined
 * - Usado em campos de data não obrigatórios
 */
export const OptionalDateSchema = z.union([DateSchema, z.literal(''), z.null()]).optional();

/**
 * Schema para status padrão do sistema
 * - Valores: 'ativo' | 'inativo'
 * - Usado para controle de visibilidade/disponibilidade
 */
export const StatusSchema = z.enum(['ativo', 'inativo'], {
  message: 'Status deve ser "ativo" ou "inativo"',
});

/**
 * Schema para níveis de prioridade
 * - Valores: 'baixa' | 'media' | 'alta' | 'urgente'
 * - Usado em demandas e documentos para classificação
 */
export const PrioridadeSchema = z.enum(['baixa', 'media', 'alta', 'urgente'], {
  message: 'Prioridade deve ser "baixa", "media", "alta" ou "urgente"',
});

/**
 * Schema para código SGED (Sistema de Gestão Eletrônica de Documentos)
 * - String numérica obrigatória
 * - Usado para identificação única de documentos
 */
export const SgedSchema = z
  .string()
  .min(1, 'SGED é obrigatório')
  .regex(/^\d+$/, 'SGED deve conter apenas números');

/**
 * Schema para IDs numéricos do sistema
 * - Número inteiro positivo
 * - Usado para chaves primárias e referências
 */
export const IdSchema = z.number().int().positive('ID deve ser um número positivo');

/**
 * Schema para campos de nome padrão
 * - String obrigatória com trim automático
 * - Limite de 255 caracteres para compatibilidade com banco
 * - Usado em entidades, pessoas, organizações
 */
export const NomeSchema = z
  .string()
  .min(1, 'Nome é obrigatório')
  .max(255, 'Nome deve ter no máximo 255 caracteres')
  .trim();

/**
 * Schema para endereços de email opcionais
 * - Validação de formato de email
 * - Campo opcional (pode ser undefined)
 */
export const EmailSchema = z.string().email('Email inválido').optional();

/**
 * Schema para telefones brasileiros opcionais
 * - Suporta formatos: (11) 99999-9999, 11 99999-9999, +55 11 99999-9999
 * - Aceita celulares (9 dígitos) e fixos (8 dígitos)
 * - Campo opcional para flexibilidade
 */
export const TelefoneSchema = z
  .string()
  .regex(/^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/, 'Telefone inválido')
  .optional();
