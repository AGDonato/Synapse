/**
 * Strict TypeScript utilities for type safety
 */

// Branded types for better type safety
export type Brand<T, B> = T & { __brand: B };

export type ID<T extends string = string> = Brand<number, T>;
export type Email = Brand<string, 'Email'>;
export type CNPJ = Brand<string, 'CNPJ'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type URL = Brand<string, 'URL'>;

// Type-safe ID creators
export const createID = <T extends string>(value: number): ID<T> => value as ID<T>;
export const createEmail = (value: string): Email => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(`Invalid email: ${value}`);
  }
  return value as Email;
};

export const createCNPJ = (value: string): CNPJ => {
  if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value)) {
    throw new Error(`Invalid CNPJ format: ${value}`);
  }
  return value as CNPJ;
};

// Utility types
export type NonEmptyString = Brand<string, 'NonEmpty'>;
export type PositiveNumber = Brand<number, 'Positive'>;
export type NonNegativeNumber = Brand<number, 'NonNegative'>;

// Type guards
export const isNonEmptyString = (value: string): value is NonEmptyString => {
  return value.trim().length > 0;
};

export const isPositiveNumber = (value: number): value is PositiveNumber => {
  return value > 0;
};

export const isNonNegativeNumber = (value: number): value is NonNegativeNumber => {
  return value >= 0;
};

// Strict object creation
export type StrictKeys<T> = {
  [K in keyof T]-?: T[K] extends undefined ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
  [K in keyof T]-?: T[K] extends undefined ? never : K;
}[keyof T];

export type StrictPick<T, K extends keyof T> = {
  [P in K]-?: T[P];
};

// Result type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T>(data: T): Result<T, never> => ({ 
  success: true, 
  data 
});

export const failure = <E>(error: E): Result<never, E> => ({ 
  success: false, 
  error 
});

// Type-safe environment variables
export type EnvVar<T = string> = T | undefined;

export const getEnvVar = <T = string>(
  key: string,
  transformer?: (value: string) => T
): EnvVar<T> => {
  const value = import.meta.env[key];
  if (value === undefined) {return undefined;}
  return transformer ? transformer(value) : (value as unknown as T);
};

export const requireEnvVar = <T = string>(
  key: string,
  transformer?: (value: string) => T
): T => {
  const value = getEnvVar(key, transformer);
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

// Exhaustive checking
export const assertUnreachable = (value: never): never => {
  throw new Error(`Unreachable code reached with value: ${JSON.stringify(value)}`);
};

// Type-safe array access
export const safeArrayAccess = <T>(
  array: readonly T[], 
  index: number
): T | undefined => {
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
};

// Type-safe object property access
export const safeObjectAccess = <T, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined => {
  return obj?.[key];
};

// Deep readonly utility
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Mutable utility (opposite of readonly)
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Optional to required conversion
export type OptionalToRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Strict function types
export type StrictFunction<TArgs extends readonly unknown[], TReturn> = 
  (...args: TArgs) => TReturn;

export type AsyncStrictFunction<TArgs extends readonly unknown[], TReturn> = 
  (...args: TArgs) => Promise<TReturn>;

// Type-safe event handling
export type EventHandler<TEvent = Event> = (event: TEvent) => void;
export type AsyncEventHandler<TEvent = Event> = (event: TEvent) => Promise<void>;

// Form field types
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>;
};

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: number;
  requestId: string;
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncData<T, E = Error> {
  data?: T;
  loading: boolean;
  error?: E;
  lastFetch?: Date;
}

// Component prop types
export type WithChildren<T = {}> = T & { children: React.ReactNode };
export type WithClassName<T = {}> = T & { className?: string };
export type WithTestId<T = {}> = T & { 'data-testid'?: string };

// Common component props
export type BaseComponentProps = WithClassName & WithTestId;

// Strict component definition
export type StrictComponent<TProps = {}> = React.FC<TProps & BaseComponentProps>;

// Type-safe localStorage/sessionStorage
export type StorageKey = string;
export type StorageValue<T> = T;

export const createTypedStorage = <T>(key: StorageKey, defaultValue: T) => ({
  get: (): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage:`, error);
    }
  },
  remove: (): void => {
    localStorage.removeItem(key);
  }
});

// Type-safe configuration objects
export type Config<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: T[K];
};

export const createConfig = <T extends Record<string, unknown>>(
  config: T
): Config<T> => Object.freeze(config);

// Export utility functions
export const typeUtils = {
  success,
  failure,
  createID,
  createEmail,
  createCNPJ,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  assertUnreachable,
  safeArrayAccess,
  safeObjectAccess,
  getEnvVar,
  requireEnvVar,
  createTypedStorage,
  createConfig,
} as const;