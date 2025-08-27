/**
 * Type guards for runtime type checking
 */

import type { z } from 'zod';

// Basic type guards
export const isString = (value: unknown): value is string => 
  typeof value === 'string';

export const isNumber = (value: unknown): value is number => 
  typeof value === 'number' && !isNaN(value);

export const isBoolean = (value: unknown): value is boolean => 
  typeof value === 'boolean';

export const isArray = <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] => {
  if (!Array.isArray(value)) {return false;}
  if (!itemGuard) {return true;}
  return value.every(itemGuard);
};

export const isObject = (value: unknown): value is Record<string, unknown> => 
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isFunction = (value: unknown): value is Function => 
  typeof value === 'function';

export const isDate = (value: unknown): value is Date => 
  value instanceof Date && !isNaN(value.getTime());

export const isPromise = <T = unknown>(value: unknown): value is Promise<T> => 
  value instanceof Promise || (isObject(value) && isFunction(value.then));

// Null/undefined checks
export const isDefined = <T>(value: T | undefined): value is T => 
  value !== undefined;

export const isNotNull = <T>(value: T | null): value is T => 
  value !== null;

export const isNotNullish = <T>(value: T | null | undefined): value is T => 
  value !== null && value !== undefined;

// String validation guards
export const isNonEmptyString = (value: unknown): value is string => 
  isString(value) && value.trim().length > 0;

export const isEmail = (value: unknown): value is string => {
  if (!isString(value)) {return false;}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isCNPJ = (value: unknown): value is string => {
  if (!isString(value)) {return false;}
  // Remove formatting
  const numbers = value.replace(/\D/g, '');
  if (numbers.length !== 14) {return false;}
  
  // Validate CNPJ algorithm
  const digits = numbers.split('').map(Number);
  
  // First verification digit
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digits[12] !== digit1) {return false;}
  
  // Second verification digit
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return digits[13] === digit2;
};

export const isPhoneNumber = (value: unknown): value is string => {
  if (!isString(value)) {return false;}
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(value);
};

export const isUrl = (value: unknown): value is string => {
  if (!isString(value)) {return false;}
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// Number validation guards
export const isPositiveNumber = (value: unknown): value is number => 
  isNumber(value) && value > 0;

export const isNonNegativeNumber = (value: unknown): value is number => 
  isNumber(value) && value >= 0;

export const isInteger = (value: unknown): value is number => 
  isNumber(value) && Number.isInteger(value);

export const isInRange = (min: number, max: number) => 
  (value: unknown): value is number => 
    isNumber(value) && value >= min && value <= max;

// Array validation guards
export const isNonEmptyArray = <T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T
): value is [T, ...T[]] => {
  return isArray(value, itemGuard) && value.length > 0;
};

export const hasLength = (length: number) => 
  <T>(value: T[]): value is T[] => 
    value.length === length;

export const hasMinLength = (minLength: number) => 
  <T>(value: T[]): value is T[] => 
    value.length >= minLength;

export const hasMaxLength = (maxLength: number) => 
  <T>(value: T[]): value is T[] => 
    value.length <= maxLength;

// Object validation guards
export const hasProperty = <K extends string>(
  key: K
) => <T>(obj: T): obj is T & Record<K, unknown> =>
  isObject(obj) && key in obj;

export const hasPropertyOfType = <K extends string, V>(
  key: K,
  typeGuard: (value: unknown) => value is V
) => <T>(obj: T): obj is T & Record<K, V> => {
  if (!hasProperty(key)(obj)) {return false;}
  return typeGuard(obj[key]);
};

// Entity validation guards
export const isValidId = (value: unknown): value is number => 
  isInteger(value) && value > 0;

export const isValidStatus = (validStatuses: readonly string[]) => 
  (value: unknown): value is string => 
    isString(value) && validStatuses.includes(value);

export const isValidPriority = isValidStatus(['baixa', 'media', 'alta', 'urgente'] as const);

// Date validation guards
export const isValidDateString = (value: unknown): value is string => {
  if (!isString(value)) {return false;}
  const date = new Date(value);
  return isDate(date);
};

export const isDateInFuture = (value: Date): boolean => 
  value.getTime() > Date.now();

export const isDateInPast = (value: Date): boolean => 
  value.getTime() < Date.now();

// File validation guards
export const isFile = (value: unknown): value is File => 
  value instanceof File;

export const hasFileExtension = (extensions: string[]) => 
  (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? extensions.includes(extension) : false;
  };

export const isFileSizeValid = (maxSizeBytes: number) => 
  (file: File): boolean => file.size <= maxSizeBytes;

// Form validation guards
export const isFormValid = <T extends Record<string, unknown>>(
  form: T,
  validators: { [K in keyof T]?: (value: T[K]) => boolean }
): boolean => {
  return Object.entries(validators).every(([key, validator]) => {
    const value = form[key as keyof T];
    return validator ? validator(value) : true;
  });
};

// API response validation guards
export const isApiResponse = <T>(
  value: unknown,
  dataValidator: (data: unknown) => data is T
): value is { data: T; message?: string } => {
  if (!isObject(value)) {return false;}
  if (!hasProperty('data')(value)) {return false;}
  return dataValidator(value.data);
};

export const isPaginatedResponse = <T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
} => {
  if (!isObject(value)) {return false;}
  if (!hasProperty('data')(value) || !hasProperty('meta')(value)) {return false;}
  if (!isArray(value.data, itemValidator)) {return false;}
  
  const meta = value.meta;
  if (!isObject(meta)) {return false;}
  
  return (
    hasPropertyOfType('current_page', isNumber)(meta) &&
    hasPropertyOfType('last_page', isNumber)(meta) &&
    hasPropertyOfType('per_page', isNumber)(meta) &&
    hasPropertyOfType('total', isNumber)(meta)
  );
};

// Zod integration
export const createZodGuard = <T>(schema: z.ZodSchema<T>) => 
  (value: unknown): value is T => {
    const result = schema.safeParse(value);
    return result.success;
  };

// Error guards
export const isError = (value: unknown): value is Error => 
  value instanceof Error;

export const isApiError = (value: unknown): value is {
  message: string;
  status: number;
  code?: string;
} => {
  if (!isObject(value)) {return false;}
  return (
    hasPropertyOfType('message', isString)(value) &&
    hasPropertyOfType('status', isNumber)(value)
  );
};

// React-specific guards
export const isReactElement = (value: unknown): value is React.ReactElement => 
  isObject(value) && hasProperty('type')(value) && hasProperty('props')(value);

export const isComponent = <P = any>(
  value: unknown
): value is React.ComponentType<P> => 
  isFunction(value) || (isObject(value) && hasProperty('render')(value));

// Export all guards
export const typeGuards = {
  // Basic types
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  isDate,
  isPromise,
  
  // Null/undefined
  isDefined,
  isNotNull,
  isNotNullish,
  
  // Strings
  isNonEmptyString,
  isEmail,
  isCNPJ,
  isPhoneNumber,
  isUrl,
  
  // Numbers
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  isInRange,
  
  // Arrays
  isNonEmptyArray,
  hasLength,
  hasMinLength,
  hasMaxLength,
  
  // Objects
  hasProperty,
  hasPropertyOfType,
  
  // Entities
  isValidId,
  isValidStatus,
  isValidPriority,
  
  // Dates
  isValidDateString,
  isDateInFuture,
  isDateInPast,
  
  // Files
  isFile,
  hasFileExtension,
  isFileSizeValid,
  
  // Forms
  isFormValid,
  
  // API
  isApiResponse,
  isPaginatedResponse,
  
  // Errors
  isError,
  isApiError,
  
  // React
  isReactElement,
  isComponent,
  
  // Utilities
  createZodGuard,
} as const;