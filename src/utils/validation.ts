/**
 * Runtime validation utilities with Zod integration
 */

import { z } from 'zod';
import type { Result} from '../types/strict';
import { failure, success } from '../types/strict';

// Validation error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class MultiValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationError[]
  ) {
    super(message);
    this.name = 'MultiValidationError';
  }
}

// Validation result type
export type ValidationResult<T> = Result<T, ValidationError | MultiValidationError>;

// Safe validation function
export const safeValidate = <T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  fieldName = 'value'
): ValidationResult<T> => {
  try {
    const result = schema.safeParse(value);
    
    if (result.success) {
      return success(result.data);
    }
    
    const errors = result.error.errors.map(
      (err) => new ValidationError(
        err.message,
        err.path.join('.') || fieldName,
        err.code === 'invalid_type' ? value : err.received
      )
    );
    
    if (errors.length === 1) {
      return failure(errors[0]);
    }
    
    return failure(
      new MultiValidationError(
        `Multiple validation errors for ${fieldName}`,
        errors
      )
    );
  } catch (error) {
    return failure(
      new ValidationError(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fieldName,
        value
      )
    );
  }
};

// Validation helpers
export const validate = <T>(schema: z.ZodSchema<T>, value: unknown): T => {
  const result = safeValidate(schema, value);
  if (result.success) {
    return result.data;
  }
  throw result.error;
};

// Form validation utilities
export interface FormFieldValidator<T> {
  schema: z.ZodSchema<T>;
  required?: boolean;
  custom?: (value: T) => string | null;
}

export type FormValidators<T extends Record<string, unknown>> = {
  [K in keyof T]?: FormFieldValidator<T[K]>;
};

export type FormErrors<T extends Record<string, unknown>> = {
  [K in keyof T]?: string;
};

export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  validators: FormValidators<T>
): { isValid: boolean; errors: FormErrors<T> } => {
  const errors: FormErrors<T> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const fieldKey = field as keyof T;
    const value = data[fieldKey];
    
    if (!validator) {continue;}

    // Check if required field is missing
    if (validator.required && (value === undefined || value === null || value === '')) {
      errors[fieldKey] = 'Este campo é obrigatório';
      isValid = false;
      continue;
    }

    // Skip validation for optional empty fields
    if (!validator.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Schema validation
    const validationResult = safeValidate(validator.schema, value, field);
    if (!validationResult.success) {
      const error = validationResult.error;
      if (error instanceof MultiValidationError) {
        errors[fieldKey] = error.errors.map(e => e.message).join(', ');
      } else {
        errors[fieldKey] = error.message;
      }
      isValid = false;
      continue;
    }

    // Custom validation
    if (validator.custom) {
      const customError = validator.custom(validationResult.data);
      if (customError) {
        errors[fieldKey] = customError;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

// Common validation schemas
export const commonSchemas = {
  // Basic types
  id: z.number().int().positive('ID deve ser um número positivo'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(
    /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    'Telefone deve estar no formato (00) 00000-0000'
  ),
  cnpj: z.string().regex(
    /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    'CNPJ deve estar no formato 00.000.000/0000-00'
  ),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  
  // Text fields
  nonEmptyString: z.string().min(1, 'Campo não pode estar vazio').trim(),
  shortText: z.string().max(255, 'Texto muito longo (máximo 255 caracteres)').trim(),
  longText: z.string().max(5000, 'Texto muito longo (máximo 5000 caracteres)').trim(),
  
  // Dates
  dateString: z.string().datetime('Data inválida'),
  futureDate: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    'Data deve ser futura'
  ),
  pastDate: z.string().datetime().refine(
    (date) => new Date(date) < new Date(),
    'Data deve ser passada'
  ),
  
  // Status and enums
  status: z.enum(['ativo', 'inativo'], {
    errorMap: () => ({ message: 'Status deve ser ativo ou inativo' })
  }),
  priority: z.enum(['baixa', 'media', 'alta', 'urgente'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  
  // File validation
  file: z.instanceof(File, { message: 'Arquivo inválido' }),
  imageFile: z.instanceof(File).refine(
    (file) => file.type.startsWith('image/'),
    'Arquivo deve ser uma imagem'
  ),
  pdfFile: z.instanceof(File).refine(
    (file) => file.type === 'application/pdf',
    'Arquivo deve ser um PDF'
  ),
  
  // Arrays
  nonEmptyArray: <T>(itemSchema: z.ZodSchema<T>) => 
    z.array(itemSchema).min(1, 'Lista não pode estar vazia'),
  
  // Optional fields
  optionalString: z.string().optional().nullable(),
  optionalNumber: z.number().optional().nullable(),
  optionalDate: z.string().datetime().optional().nullable(),
};

// Entity-specific validation schemas
export const entitySchemas = {
  demanda: {
    numero: z.string().min(1, 'Número é obrigatório'),
    titulo: z.string().min(1, 'Título é obrigatório').max(255),
    descricao: z.string().min(1, 'Descrição é obrigatória').max(5000),
    prioridade: commonSchemas.priority,
    data_prazo: z.string().datetime().refine(
      (date) => new Date(date) >= new Date(),
      'Prazo deve ser hoje ou no futuro'
    ),
  },
  
  documento: {
    numero: z.string().min(1, 'Número é obrigatório'),
    assunto: z.string().min(1, 'Assunto é obrigatório').max(500),
    destinatario: z.string().min(1, 'Destinatário é obrigatório'),
    enderecamento: commonSchemas.optionalString,
    data_prazo_resposta: z.string().datetime().optional().nullable().refine(
      (date) => !date || new Date(date) >= new Date(),
      'Prazo de resposta deve ser futuro'
    ),
  },
  
  orgao: {
    nome: z.string().min(1, 'Nome é obrigatório').max(255),
    nomeCompleto: z.string().min(1, 'Nome completo é obrigatório').max(500),
    sigla: z.string().min(1, 'Sigla é obrigatória').max(20),
    tipo: z.enum(['federal', 'estadual', 'municipal']),
  },
  
  assunto: {
    nome: z.string().min(1, 'Nome é obrigatório').max(255),
    descricao: commonSchemas.optionalString,
    codigo: commonSchemas.optionalString,
  },
  
  provedor: {
    nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório').max(255),
    razaoSocial: z.string().min(1, 'Razão social é obrigatória').max(255),
    cnpj: commonSchemas.cnpj,
    email: z.string().email().optional().nullable(),
    telefone: commonSchemas.phone.optional().nullable(),
  },
  
  autoridade: {
    nome: z.string().min(1, 'Nome é obrigatório').max(255),
    cargo: z.string().min(1, 'Cargo é obrigatório').max(255),
    orgao_id: commonSchemas.id,
    email: z.string().email().optional().nullable(),
    telefone: commonSchemas.phone.optional().nullable(),
  },
};

// Validation utilities for specific use cases
export const validateId = (value: unknown): number => {
  return validate(commonSchemas.id, value);
};

export const validateEmail = (value: unknown): string => {
  return validate(commonSchemas.email, value);
};

export const validateRequired = <T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  fieldName: string
): T => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} é obrigatório`, fieldName, value);
  }
  return validate(schema, value);
};

// Batch validation
export const validateBatch = <T extends Record<string, unknown>>(
  items: T[],
  validator: (item: T) => ValidationResult<T>
): { valid: T[]; invalid: { item: T; error: ValidationError | MultiValidationError }[] } => {
  const valid: T[] = [];
  const invalid: { item: T; error: ValidationError | MultiValidationError }[] = [];

  for (const item of items) {
    const result = validator(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ item, error: result.error });
    }
  }

  return { valid, invalid };
};

// Error formatting utilities
export const formatValidationError = (error: ValidationError | MultiValidationError): string => {
  if (error instanceof MultiValidationError) {
    return error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
  }
  return `${error.field}: ${error.message}`;
};

export const formatFormErrors = <T extends Record<string, unknown>>(
  errors: FormErrors<T>
): string => {
  return Object.entries(errors)
    .filter(([, error]) => error)
    .map(([field, error]) => `${field}: ${error}`)
    .join('\n');
};

// Export validation utilities
export const validationUtils = {
  safeValidate,
  validate,
  validateForm,
  validateId,
  validateEmail,
  validateRequired,
  validateBatch,
  formatValidationError,
  formatFormErrors,
  ValidationError,
  MultiValidationError,
} as const;