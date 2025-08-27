/**
 * Code quality utilities and standards enforcement
 */

// Type-safe error handling
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
    };
  }
}

// Result type for better error handling
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E = AppError>(error: E): Result<never, E> => ({ success: false, error });

// Safe async wrapper
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  errorContext?: string
): Promise<Result<T>> => {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR',
          500,
          { context: errorContext, originalError: error }
        );
    return failure(appError);
  }
};

// Type guards for better type safety
export const isNotNull = <T>(value: T | null): value is T => value !== null;
export const isNotUndefined = <T>(value: T | undefined): value is T => value !== undefined;
export const isDefined = <T>(value: T | null | undefined): value is T => 
  value !== null && value !== undefined;

export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => 
  typeof value === 'number' && !isNaN(value);
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value);
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Utility for exhaustive switch cases
export const assertNever = (x: never): never => {
  throw new AppError(`Unexpected value: ${JSON.stringify(x)}`, 'EXHAUSTIVE_CHECK_FAILED');
};

// Deep readonly utility
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

// Immutable update utilities
export const updateObject = <T extends Record<string, unknown>>(
  obj: T,
  updates: Partial<T>
): T => ({ ...obj, ...updates });

export const updateArray = <T>(
  array: readonly T[],
  index: number,
  update: T | ((item: T) => T)
): T[] => {
  const newArray = [...array];
  newArray[index] = typeof update === 'function' 
    ? (update as (item: T) => T)(array[index])
    : update;
  return newArray;
};

export const removeFromArray = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): T[] => array.filter((item, index) => !predicate(item, index));

// Functional programming utilities
export const pipe = <T>(...fns: ((arg: T) => T)[]) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value);

export const compose = <T>(...fns: ((arg: T) => T)[]) => (value: T): T =>
  fns.reduceRight((acc, fn) => fn(acc), value);

// Debounce utility with proper cleanup
export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): {
  (...args: Args): void;
  cancel: () => void;
} => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFn = (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
};

// Throttle utility
export const throttle = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): {
  (...args: Args): void;
  cancel: () => void;
} => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const throttledFn = (...args: Args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };

  throttledFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttledFn;
};

// Retry utility with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  }
): Promise<T> => {
  const { maxRetries, initialDelay, maxDelay, backoffFactor } = options;
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw new AppError('Max retries exceeded', 'MAX_RETRIES_EXCEEDED');
};

// Memoization utility
export const memoize = <Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  keyFn?: (...args: Args) => string
): {
  (...args: Args): Return;
  cache: Map<string, Return>;
  clear: () => void;
} => {
  const cache = new Map<string, Return>();

  const memoizedFn = (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoizedFn.cache = cache;
  memoizedFn.clear = () => cache.clear();

  return memoizedFn;
};

// Deep equality check
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {return true;}

  if (a == null || b == null) {return false;}

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {return false;}
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) {return false;}
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
};

// ID generation
export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${random}`;
};

// URL-safe slug generation
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove multiple hyphens
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {return '0 B';}
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format relative time
export const formatRelativeTime = (date: Date | string | number): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {return 'agora mesmo';}
  if (diffMinutes < 60) {return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;}
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;}
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;}
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {return `${diffWeeks} semana${diffWeeks > 1 ? 's' : ''} atrás`;}
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {return `${diffMonths} mês${diffMonths > 1 ? 'es' : ''} atrás`;}
  
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ano${diffYears > 1 ? 's' : ''} atrás`;
};

// Environment utilities
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

import { createModuleLogger } from './logger';

const codeQualityLogger = createModuleLogger('CodeQuality');

// Development helpers
export const devLog = (...args: unknown[]): void => {
  if (isDevelopment) {
    codeQualityLogger.debug('[DEV]', { args });
  }
};

export const devWarn = (...args: unknown[]): void => {
  if (isDevelopment) {
    codeQualityLogger.warn('[DEV WARN]', { args });
  }
};

export const devError = (...args: unknown[]): void => {
  if (isDevelopment) {
    codeQualityLogger.error('[DEV ERROR]', { args });
  }
};

// Performance measurement
export const measurePerformance = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    
    devLog(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const end = performance.now();
    devError(`Performance [${name}] failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
};

export default {
  AppError,
  success,
  failure,
  safeAsync,
  isNotNull,
  isNotUndefined,
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  assertNever,
  updateObject,
  updateArray,
  removeFromArray,
  pipe,
  compose,
  debounce,
  throttle,
  retryWithBackoff,
  memoize,
  deepEqual,
  generateId,
  createSlug,
  formatFileSize,
  formatRelativeTime,
  isDevelopment,
  isProduction,
  isTest,
  devLog,
  devWarn,
  devError,
  measurePerformance,
};