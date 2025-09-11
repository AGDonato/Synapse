/**
 * Hook para detecção inteligente de mudanças em formulários
 *
 * @description
 * Compara estados de formulário para detectar modificações:
 * - Comparação profunda entre estado atual e inicial
 * - Normalização de valores para comparação precisa
 * - Suporte para modo edição e criação
 * - Otimização com useMemo para performance
 * - Tratamento de valores nulos e indefinidos
 *
 * @param currentData - Dados atuais do formulário
 * @param initialData - Dados iniciais para comparação
 * @param isEditing - Se está no modo edição (padrão: false)
 * @returns Objeto com hasChanges indicando se há mudanças
 *
 * @example
 * const { hasChanges } = useFormChanges(
 *   formData,
 *   originalData,
 *   isEditing
 * );
 *
 * // Mostrar botão salvar apenas se há mudanças
 * if (hasChanges) {
 *   <button onClick={save}>Salvar</button>
 * }
 *
 * @module hooks/useFormChanges
 */

import { useMemo } from 'react';

export function useFormChanges<T extends Record<string, unknown>>(
  currentData: T,
  initialData: T,
  isEditing = false
) {
  // Comparação inteligente para detectar mudanças
  const hasChanges = useMemo(() => {
    if (isEditing) {
      // Modo edição: compara dados atuais com os originais
      if (!initialData || Object.keys(initialData).length === 0) {
        return false;
      }

      // Compara cada campo individualmente
      return Object.keys(currentData).some(key => {
        const currentValue = currentData[key];
        const initialValue = initialData[key];

        // Normaliza valores para comparação precisa
        const normalizedCurrent =
          currentValue === null || currentValue === undefined ? '' : String(currentValue).trim();
        const normalizedInitial =
          initialValue === null || initialValue === undefined ? '' : String(initialValue).trim();

        return normalizedCurrent !== normalizedInitial;
      });
    } else {
      // Modo criação: verifica se há dados preenchidos
      return Object.keys(currentData).some(key => {
        const currentValue = currentData[key];
        const normalizedCurrent =
          currentValue === null || currentValue === undefined ? '' : String(currentValue).trim();
        return normalizedCurrent !== '';
      });
    }
  }, [currentData, initialData, isEditing]);

  return {
    hasChanges,
  };
}
