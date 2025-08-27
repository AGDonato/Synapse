// src/hooks/validation/useFormValidation.ts
import { useCallback, useMemo } from 'react';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
}

export type ValidationRule<T = any> = (value: T, context?: any) => ValidationResult;

export type ValidationSchema = Record<string, ValidationRule | ValidationRule[]>;

// Common validation rules
export const validationRules = {
  required: (message = 'Este campo é obrigatório'): ValidationRule => 
    (value) => ({
      isValid: value !== null && value !== undefined && value !== '',
      message: message,
      type: 'warning'
    }),

  minLength: (min: number, message?: string): ValidationRule => 
    (value) => {
      const str = String(value || '');
      const isValid = str.length >= min;
      return {
        isValid,
        message: message || `Deve ter pelo menos ${min} caracteres`,
        type: 'warning'
      };
    },

  maxLength: (max: number, message?: string): ValidationRule => 
    (value) => {
      const str = String(value || '');
      const isValid = str.length <= max;
      return {
        isValid,
        message: message || `Deve ter no máximo ${max} caracteres`,
        type: 'warning'
      };
    },

  pattern: (regex: RegExp, message = 'Formato inválido'): ValidationRule => 
    (value) => ({
      isValid: value ? regex.test(String(value)) : true,
      message,
      type: 'error'
    }),

  email: (message = 'Email inválido'): ValidationRule => 
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: value ? emailRegex.test(String(value)) : true,
        message,
        type: 'error'
      };
    },

  dateFormat: (format = 'DD/MM/YYYY', message?: string): ValidationRule => 
    (value) => {
      if (!value) {return { isValid: true };}
      
      const dateStr = String(value);
      const parts = dateStr.split('/');
      
      if (parts.length !== 3) {
        return {
          isValid: false,
          message: message || `Data deve estar no formato ${format}`,
          type: 'error'
        };
      }
      
      const [day, month, year] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      
      const isValidDate = date.getFullYear() === year &&
                         date.getMonth() === month - 1 &&
                         date.getDate() === day;
      
      return {
        isValid: isValidDate,
        message: message || 'Data inválida',
        type: 'error'
      };
    },

  futureDate: (message = 'Data não pode ser posterior à data atual'): ValidationRule => 
    (value) => {
      if (!value) {return { isValid: true };}
      
      const dateStr = String(value);
      const [day, month, year] = dateStr.split('/').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      return {
        isValid: inputDate <= today,
        message,
        type: 'error'
      };
    },

  conditional: (
    condition: (context: any) => boolean, 
    rule: ValidationRule, 
    message?: string
  ): ValidationRule => 
    (value, context) => {
      if (!condition(context)) {
        return { isValid: true };
      }
      return rule(value, context);
    },

  custom: (validator: (value: any, context?: any) => boolean | string): ValidationRule => 
    (value, context) => {
      const result = validator(value, context);
      if (typeof result === 'boolean') {
        return { isValid: result };
      }
      return {
        isValid: false,
        message: result,
        type: 'warning'
      };
    }
};

// Hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  schema: ValidationSchema,
  onToast?: (message: string, type: 'error' | 'warning' | 'success') => void
) {
  const validateField = useCallback((field: keyof T, value: any, context?: T): ValidationResult => {
    const rules = schema[field as string];
    if (!rules) {return { isValid: true };}

    const rulesToCheck = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of rulesToCheck) {
      const result = rule(value, context);
      if (!result.isValid) {
        return result;
      }
    }
    
    return { isValid: true };
  }, [schema]);

  const validateForm = useCallback((data: T): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields
    Object.keys(schema).forEach(field => {
      const result = validateField(field, data[field], data);
      if (!result.isValid && result.message) {
        errors[field] = result.message;
        isValid = false;
        
        // Show toast for first error found
        if (isValid && onToast && result.type) {
          onToast(result.message, result.type);
        }
      }
    });

    return { isValid, errors };
  }, [schema, validateField, onToast]);

  const getFieldError = useCallback((field: keyof T, value: any, context?: T): string | null => {
    const result = validateField(field, value, context);
    return result.isValid ? null : (result.message || 'Erro de validação');
  }, [validateField]);

  return {
    validateField,
    validateForm,
    getFieldError,
    validationRules
  };
}