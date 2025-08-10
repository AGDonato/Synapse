// src/hooks/useFormChanges.ts
import { useMemo } from 'react';

/**
 * Hook para detectar mudanças em formulários
 * Compara o estado atual com o estado inicial para determinar se houve mudanças
 */
export function useFormChanges<T extends Record<string, unknown>>(
  currentData: T,
  initialData: T,
  isEditing = false
) {
  // Comparar estados para detectar mudanças
  const hasChanges = useMemo(() => {
    if (isEditing) {
      // Modo edição: compara com dados originais
      if (!initialData || Object.keys(initialData).length === 0) {
        return false;
      }

      // Comparar cada campo do currentData com initialData
      return Object.keys(currentData).some((key) => {
        const currentValue = currentData[key];
        const initialValue = initialData[key];

        // Normalizar valores para comparação
        const normalizedCurrent =
          currentValue === null || currentValue === undefined
            ? ''
            : String(currentValue).trim();
        const normalizedInitial =
          initialValue === null || initialValue === undefined
            ? ''
            : String(initialValue).trim();

        return normalizedCurrent !== normalizedInitial;
      });
    } else {
      // Modo criação: verifica se há dados preenchidos
      return Object.keys(currentData).some((key) => {
        const currentValue = currentData[key];
        const normalizedCurrent =
          currentValue === null || currentValue === undefined
            ? ''
            : String(currentValue).trim();
        return normalizedCurrent !== '';
      });
    }
  }, [currentData, initialData, isEditing]);

  return {
    hasChanges,
  };
}
