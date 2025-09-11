/**
 * FUNÇÕES AUXILIARES GENÉRICAS
 *
 * Este módulo contém funções utilitárias genéricas que são usadas em todo o sistema.
 * Inclui funcionalidades para:
 * - Controle de execução (debounce)
 * - Busca e ordenação de dados
 * - Clonagem profunda de objetos
 * - Validações básicas
 * - Manipulação segura de objetos
 * - Controle de promises e retry
 */

import { removeAccents } from './formatters';

/**
 * Limita a taxa de execução de uma função (debounce)
 * Útil para evitar chamadas excessivas em eventos como digitação ou scroll
 * @param func - Função a ser limitada
 * @param wait - Tempo de espera em milissegundos
 * @returns Função com debounce aplicado
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
 * Busca genérica em array de objetos
 * Remove acentos e ignora maiúsculas/minúsculas na busca
 * @param items - Array de itens para buscar
 * @param searchTerm - Termo de busca
 * @param searchFields - Campos específicos para buscar (opcional)
 * @returns Array filtrado com os resultados
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
 * Ordena array de objetos por uma chave específica
 * @param items - Array de itens para ordenar
 * @param sortKey - Chave do objeto para ordenação
 * @param direction - Direção da ordenação ('asc' ou 'desc')
 * @returns Array ordenado
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
 * Clona profundamente um objeto
 * Cria uma cópia completa sem referências ao objeto original
 * @param obj - Objeto a ser clonado
 * @returns Cópia profunda do objeto
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
 * Verifica se um objeto está vazio
 * @param obj - Objeto, array ou string para verificar
 * @returns true se estiver vazio, false caso contrário
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
 * Gera um ID único baseado em timestamp
 * @returns ID numérico único
 */
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * Acessa propriedade aninhada de objeto com segurança
 * Evita erros ao acessar propriedades que podem não existir
 * @param obj - Objeto de origem
 * @param path - Caminho da propriedade (ex: 'user.name.first')
 * @param defaultValue - Valor padrão se a propriedade não existir
 * @returns Valor da propriedade ou valor padrão
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
 * Cria uma promise que resolve após um tempo especificado
 * Útil para criar delays em código assíncrono
 * @param ms - Tempo de espera em milissegundos
 * @returns Promise que resolve após o delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Executa uma função com retry e backoff exponencial
 * Tenta executar novamente em caso de erro, com delay crescente
 * @param fn - Função assíncrona para executar
 * @param maxAttempts - Número máximo de tentativas (padrão: 3)
 * @param baseDelay - Delay base em milissegundos (padrão: 1000)
 * @returns Promise com o resultado da função
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

      // Backoff exponencial: 1s, 2s, 4s, etc.
      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayTime);
    }
  }

  throw lastError!;
};
