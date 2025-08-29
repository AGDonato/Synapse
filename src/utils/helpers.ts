// src/utils/helpers.ts

import { removeAccents } from './formatters';

/**
 * Debounce function to limit the rate of function execution
 */
export const debounce = <T extends (...args: unknown[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generic search function that works with any object
 */
export const searchItems = <T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields?: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) {
    return items;
  }

  const normalizedSearchTerm = removeAccents(searchTerm.toLowerCase());

  return items.filter(item => {
    const fieldsToSearch = searchFields || Object.keys(item);

    return fieldsToSearch.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return removeAccents(value.toLowerCase()).includes(normalizedSearchTerm);
      }
      return false;
    });
  });
};

/**
 * Sort array of objects by a specific key
 */
export const sortItems = <T extends Record<string, any>>(
  items: T[],
  sortKey: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === bValue) {
      return 0;
    }

    const comparison = aValue < bValue ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * Check if an object is empty
 */
export const isEmpty = (obj: unknown): boolean => {
  if (obj == null) {
    return true;
  }
  if (Array.isArray(obj) || typeof obj === 'string') {
    return obj.length === 0;
  }
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }
  return false;
};

/**
 * Generate a random ID
 */
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * Safely get nested object property
 */
export const safeGet = <T>(obj: unknown, path: string, defaultValue: T): T => {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }

  return result !== undefined ? (result as T) : defaultValue;
};

/**
 * Create a promise that resolves after a specified delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayTime);
    }
  }

  throw lastError!;
};
