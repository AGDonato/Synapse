/**
 * Hook para atrasar a execução de mudanças em valores
 *
 * @description
 * Útil para otimizar performance em operações custosas como:
 * - Buscas em tempo real (evita requests a cada tecla)
 * - Validações de formulário
 * - Atualizações de estado que disparam cálculos pesados
 * - Filtros e pesquisas em listas grandes
 *
 * @param value - Valor a ser atrasado
 * @param delay - Tempo de atraso em milissegundos
 * @returns Valor atrasado (debounced)
 *
 * @example
 * // Busca com debounce de 500ms
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // Só executa a busca após 500ms sem digitação
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 *
 * @module hooks/useDebounce
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cria timer para atualizar valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa timer anterior se valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
