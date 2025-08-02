// src/hooks/useFormValidation.ts

import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface UseFormValidationReturn<T> {
  errors: ValidationErrors;
  isValid: boolean;
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: any) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setFieldError: (field: keyof T, error: string) => void;
}

export function useFormValidation<T>(
  schema: z.ZodSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = useCallback(
    (data: T): boolean => {
      try {
        schema.parse(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: ValidationErrors = {};

          error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            newErrors[path] = issue.message;
          });

          setErrors(newErrors);
          return false;
        }
        return false;
      }
    },
    [schema]
  );

  const validateField = useCallback(
    (field: keyof T, value: any): boolean => {
      try {
        // Get the field schema by checking if it exists in the schema shape
        const fieldSchema = (schema as any).shape?.[field];

        if (fieldSchema) {
          fieldSchema.parse(value);
          setErrors((prev) => ({ ...prev, [field as string]: undefined }));
          return true;
        }

        return true; // If field schema not found, consider it valid
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.issues[0]?.message || 'Invalid value';
          setErrors((prev) => ({ ...prev, [field as string]: fieldError }));
          return false;
        }
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => ({ ...prev, [field as string]: undefined }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field as string]: error }));
  }, []);

  const isValid = Object.values(errors).every((error) => !error);

  return {
    errors,
    isValid,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}
