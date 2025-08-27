// src/hooks/usePesquisas.ts

import { useCallback } from 'react';

// Tipos
export interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

type ToastType = 'error' | 'success' | 'warning';

interface UsePesquisasProps {
  pesquisas: PesquisaItem[];
  setPesquisas: (pesquisas: PesquisaItem[]) => void;
  onShowToast: (message: string, type: ToastType) => void;
  onFocusNewRow?: (index: number) => void;
  onFocusNewColumn?: (index: number) => void;
}

interface UsePesquisasReturn {
  addPesquisa: () => void;
  removePesquisa: () => void;
  updatePesquisa: (
    index: number,
    field: keyof PesquisaItem,
    value: string
  ) => void;
  togglePesquisaComplementar: (index: number) => void;
  handleTipoPesquisaSelect: (
    index: number,
    tipo: string,
    setDropdownOpen: (
      updater: (prev: Record<string, boolean>) => Record<string, boolean>
    ) => void,
    setSelectedIndex: (
      updater: (prev: Record<string, number>) => Record<string, number>
    ) => void
  ) => void;
}

export const usePesquisas = ({
  pesquisas,
  setPesquisas,
  onShowToast,
  onFocusNewRow,
  onFocusNewColumn,
}: UsePesquisasProps): UsePesquisasReturn => {
  // Adicionar nova pesquisa
  const addPesquisa = useCallback(() => {
    const newPesquisas = [...pesquisas, { tipo: '', identificador: '' }];
    setPesquisas(newPesquisas);

    // Foco na nova linha criada (última posição)
    if (onFocusNewRow) {
      setTimeout(() => {
        onFocusNewRow(newPesquisas.length - 1);
      }, 16);
    }
  }, [pesquisas, setPesquisas, onFocusNewRow]);

  // Remover última pesquisa
  const removePesquisa = useCallback(() => {
    if (pesquisas.length > 1) {
      setPesquisas(pesquisas.slice(0, -1));
    } else {
      onShowToast('Deve haver pelo menos uma linha de pesquisa.', 'error');
    }
  }, [pesquisas, setPesquisas, onShowToast]);

  // Atualizar pesquisa
  const updatePesquisa = useCallback(
    (index: number, field: keyof PesquisaItem, value: string) => {
      const updatedPesquisas = [...pesquisas];
      updatedPesquisas[index] = { ...updatedPesquisas[index], [field]: value };
      setPesquisas(updatedPesquisas);
    },
    [pesquisas, setPesquisas]
  );

  // Toggle campo complementar
  const togglePesquisaComplementar = useCallback(
    (index: number) => {
      const updatedPesquisas = [...pesquisas];
      const isAddingColumn = updatedPesquisas[index].complementar === undefined;

      if (updatedPesquisas[index].complementar !== undefined) {
        delete updatedPesquisas[index].complementar;
      } else {
        updatedPesquisas[index].complementar = '';
      }
      setPesquisas(updatedPesquisas);

      // Foco na nova coluna criada
      if (isAddingColumn && onFocusNewColumn) {
        setTimeout(() => {
          onFocusNewColumn(index);
        }, 16);
      }
    },
    [pesquisas, setPesquisas, onFocusNewColumn]
  );

  // Handler para seleção de tipo de pesquisa
  const handleTipoPesquisaSelect = useCallback(
    (
      index: number,
      tipo: string,
      setDropdownOpen: (
        updater: (prev: Record<string, boolean>) => Record<string, boolean>
      ) => void,
      setSelectedIndex: (
        updater: (prev: Record<string, number>) => Record<string, number>
      ) => void
    ) => {
      const updatedPesquisas = [...pesquisas];
      updatedPesquisas[index].tipo = tipo;
      setPesquisas(updatedPesquisas);

      const fieldKey = `tipoPesquisa_${index}`;
      setDropdownOpen(prev => ({ ...prev, [fieldKey]: false }));
      setSelectedIndex(prev => ({ ...prev, [fieldKey]: -1 }));

      // Retornar foco para o trigger
      setTimeout(() => {
        const trigger = document.querySelector(
          `[data-dropdown="${fieldKey}"]`
        )!;
        if (trigger) {
          trigger.focus();
        }
      }, 0);
    },
    [pesquisas, setPesquisas]
  );

  return {
    addPesquisa,
    removePesquisa,
    updatePesquisa,
    togglePesquisaComplementar,
    handleTipoPesquisaSelect,
  };
};
