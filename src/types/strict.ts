/**
 * UTILITÁRIOS TYPESCRIPT RIGOROSOS PARA SEGURANÇA DE TIPOS
 *
 * Este módulo fornece ferramentas avançadas para desenvolvimento TypeScript type-safe.
 * Inclui funcionalidades para:
 * - Tipos branded para validação extra de dados primitivos
 * - Criadores de tipos com validação automática
 * - Type guards para verificação segura de tipos
 * - Utilitários para manipulação de objetos e arrays
 * - Tratamento robusto de erros com Result types
 * - Acesso seguro a variáveis de ambiente
 * - Wrappers para localStorage com tipagem forte
 * - Estados de loading e resposta de API padronizados
 * - Componentes React com props base consistentes
 */

import { createModuleLogger } from '../utils/logger';

const strictLogger = createModuleLogger('Strict');

// Tipos branded para maior segurança de tipos
export type Brand<T, B> = T & { __brand: B };

export type ID<T extends string = string> = Brand<number, T>;
export type Email = Brand<string, 'Email'>;
export type CNPJ = Brand<string, 'CNPJ'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type URL = Brand<string, 'URL'>;

// Criadores de tipos com validação automática
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

// Tipos utilitários especializados
export type NonEmptyString = Brand<string, 'NonEmpty'>;
export type PositiveNumber = Brand<number, 'Positive'>;
export type NonNegativeNumber = Brand<number, 'NonNegative'>;

// Type guards para verificação segura de tipos
export const isNonEmptyString = (value: string): value is NonEmptyString => {
  return value.trim().length > 0;
};

export const isPositiveNumber = (value: number): value is PositiveNumber => {
  return value > 0;
};

export const isNonNegativeNumber = (value: number): value is NonNegativeNumber => {
  return value >= 0;
};

// Criação rigorosa de objetos com chaves obrigatórias
export type StrictKeys<T> = {
  [K in keyof T]-?: T[K] extends undefined ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
  [K in keyof T]-?: T[K] extends undefined ? never : K;
}[keyof T];

export type StrictPick<T, K extends keyof T> = {
  [P in K]-?: T[P];
};

// Tipo Result para tratamento robusto de erros
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export const success = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Variáveis de ambiente com tipagem segura
export type EnvVar<T = string> = T | undefined;

export const getEnvVar = <T = string>(
  key: string,
  transformer?: (value: string) => T
): EnvVar<T> => {
  const value = import.meta.env[key];
  if (value === undefined) {
    return undefined;
  }
  return transformer ? transformer(value) : (value as unknown as T);
};

export const requireEnvVar = <T = string>(key: string, transformer?: (value: string) => T): T => {
  const value = getEnvVar(key, transformer);
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

// Verificação exaustiva de tipos união
export const assertUnreachable = (value: never): never => {
  throw new Error(`Unreachable code reached with value: ${JSON.stringify(value)}`);
};

// Acesso seguro a arrays com validação de índice
export const safeArrayAccess = <T>(array: readonly T[], index: number): T | undefined => {
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
};

// Acesso seguro a propriedades de objeto
export const safeObjectAccess = <T, K extends keyof T>(obj: T, key: K): T[K] | undefined => {
  return obj?.[key];
};

// Utilitário para imutabilidade profunda
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Utilitário para mutabilidade (oposto de readonly)
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Conversão de propriedades opcionais para obrigatórias
export type OptionalToRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Tipos de função com assinatura rigorosa
export type StrictFunction<TArgs extends readonly unknown[], TReturn> = (...args: TArgs) => TReturn;

export type AsyncStrictFunction<TArgs extends readonly unknown[], TReturn> = (
  ...args: TArgs
) => Promise<TReturn>;

// Manipulação segura de eventos tipados
export type EventHandler<TEvent = Event> = (event: TEvent) => void;
export type AsyncEventHandler<TEvent = Event> = (event: TEvent) => Promise<void>;

// Tipos para campos de formulário com estado
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>;
};

// Wrappers padronizados para respostas de API
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

// Estados de carregamento para operações assíncronas
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncData<T, E = Error> {
  data?: T;
  loading: boolean;
  error?: E;
  lastFetch?: Date;
}

// Tipos base para props de componentes React
export type WithChildren<T = {}> = T & { children: React.ReactNode };
export type WithClassName<T = {}> = T & { className?: string };
export type WithTestId<T = {}> = T & { 'data-testid'?: string };

// Props comuns para componentes base
export type BaseComponentProps = WithClassName & WithTestId;

// Definição rigorosa de componentes funcionais
export type StrictComponent<TProps = {}> = React.FC<TProps & BaseComponentProps>;

// localStorage/sessionStorage com tipagem forte
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
      strictLogger.error(`Failed to save to localStorage:`, error);
    }
  },
  remove: (): void => {
    localStorage.removeItem(key);
  },
});

// Objetos de configuração imutáveis e tipados
export type Config<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: T[K];
};

export const createConfig = <T extends Record<string, unknown>>(config: T): Config<T> =>
  Object.freeze(config);

// Exportação de funções utilitárias consolidadas
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
