/**
 * Hook para gerenciamento de handlers de dropdowns da Nova Demanda
 *
 * @description
 * Centraliza toda a lógica de manipulação de dropdowns do formulário de nova demanda:
 * - Controle de abertura/fechamento de dropdowns
 * - Seleção de valores (tipo de demanda, analista, distribuidor)
 * - Gerenciamento de foco e navegação por teclado
 * - Reset de estados quando necessário
 * - Sincronização entre múltiplos dropdowns
 *
 * **Dropdowns Gerenciados**:
 * - **Tipo de Demanda**: Categorização da demanda
 * - **Analista**: Responsável pela análise da demanda
 * - **Distribuidor**: Responsável pela distribuição/envio
 *
 * **Funcionalidades**:
 * - Fechamento automático de outros dropdowns ao abrir um
 * - Foco automático após seleção para melhor UX
 * - Reset de índices selecionados
 * - Controle de estados de resultados de busca
 *
 * @example
 * const {
 *   toggleDropdown,
 *   handleTipoDemandaSelect,
 *   handleAnalistaSelect
 * } = useDropdownHandlers(setFormData, setDropdownOpen, ...);
 *
 * // Alternar dropdown
 * toggleDropdown('tipoDemanda');
 *
 * // Selecionar item
 * handleTipoDemandaSelect({ id: 1, nome: 'Análise Técnica' });
 *
 * @module pages/NovaDemandaPage/hooks/useDropdownHandlers
 */

import { useCallback } from 'react';
import type { FormDataState, DropdownState } from './useFormularioEstado';

// ========== INTERFACES DE ESTADO ==========

/**
 * Estado dos índices selecionados em cada dropdown
 * Usado para navegação por teclado (setas, enter)
 */
interface SelectedIndexState {
  /** Índice selecionado no dropdown de solicitante */
  solicitante: number;
  /** Índice selecionado no dropdown de tipo de demanda */
  tipoDemanda: number;
  /** Índice selecionado no dropdown de analista */
  analista: number;
  /** Índice selecionado no dropdown de distribuidor */
  distribuidor: number;
}

/**
 * Estado de exibição de resultados de busca
 * Controla quando mostrar listas filtradas
 */
interface ShowResultsState {
  /** Se deve mostrar resultados de busca para solicitante */
  solicitante: boolean;
}

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que gerencia todos os handlers de dropdowns do formulário
 *
 * @param setFormData - Função para atualizar dados do formulário
 * @param setDropdownOpen - Função para controlar abertura de dropdowns
 * @param setSelectedIndex - Função para controlar índices selecionados
 * @param setShowResults - Função para controlar exibição de resultados
 * @param dropdownOpen - Estado atual de abertura dos dropdowns
 * @returns Objeto com funções de manipulação dos dropdowns
 */
export const useDropdownHandlers = (
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>,
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>,
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>,
  dropdownOpen: DropdownState
) => {
  // ===== CONTROLE DE ABERTURA/FECHAMENTO =====
  /**
   * Alterna o estado de abertura de um dropdown específico
   *
   * **Comportamento**:
   * 1. Fecha todos os outros dropdowns (apenas um aberto por vez)
   * 2. Limpa resultados de busca e índices selecionados
   * 3. Se o dropdown não estava aberto, abre e foca nele
   * 4. Aplica foco automático para melhor acessibilidade
   *
   * @param field - Campo do dropdown a ser alternado
   */
  const toggleDropdown = useCallback(
    (field: 'tipoDemanda' | 'analista' | 'distribuidor') => {
      const isCurrentlyOpen = dropdownOpen[field];

      // **PASSO 1**: Fecha todos os dropdowns para garantir exclusividade
      setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });

      // **PASSO 2**: Limpa estados auxiliares
      setShowResults({ solicitante: false });
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));

      // **PASSO 3**: Se não estava aberto, abre o dropdown solicitado
      if (!isCurrentlyOpen) {
        setDropdownOpen((prev: DropdownState) => ({ ...prev, [field]: true }));
        setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, [field]: -1 }));

        // **PASSO 4**: Foca no dropdown após renderização (acessibilidade)
        setTimeout(() => {
          const dropdown = document.querySelector(`[data-dropdown="${field}"]`);
          (dropdown as HTMLElement)?.focus();
        }, 0);
      }
    },
    [dropdownOpen, setDropdownOpen, setShowResults, setSelectedIndex]
  );

  // ===== HANDLERS DE SELEÇÃO =====
  /**
   * Manipula a seleção de tipo de demanda
   *
   * **Fluxo de Seleção**:
   * 1. Atualiza o valor no formulário
   * 2. Fecha o dropdown
   * 3. Reset do índice selecionado
   * 4. Retorna foco para o trigger (UX)
   *
   * @param tipo - Objeto com id e nome do tipo selecionado
   */
  const handleTipoDemandaSelect = useCallback(
    (tipo: { id: number; nome: string }) => {
      // Atualiza dados do formulário com o tipo selecionado
      setFormData(prev => ({ ...prev, tipoDemanda: tipo }));

      // Fecha o dropdown após seleção
      setDropdownOpen(prev => ({ ...prev, tipoDemanda: false }));

      // Reset do índice para navegação por teclado
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, tipoDemanda: -1 }));

      // Retorna foco para o elemento trigger (melhor experiência)
      setTimeout(() => {
        const trigger = document.querySelector('[data-dropdown="tipoDemanda"]');
        (trigger as HTMLElement)?.focus();
      }, 0);
    },
    [setFormData, setDropdownOpen, setSelectedIndex]
  );

  /**
   * Manipula a seleção de analista responsável
   *
   * Segue o mesmo padrão do handleTipoDemandaSelect para consistência
   *
   * @param analista - Objeto com id e nome do analista selecionado
   */
  const handleAnalistaSelect = useCallback(
    (analista: { id: number; nome: string }) => {
      // Atualiza analista no formulário
      setFormData(prev => ({ ...prev, analista: analista }));

      // Fecha dropdown e reseta estados
      setDropdownOpen(prev => ({ ...prev, analista: false }));
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, analista: -1 }));

      // Foco de retorno para acessibilidade
      setTimeout(() => {
        const trigger = document.querySelector('[data-dropdown="analista"]');
        (trigger as HTMLElement)?.focus();
      }, 0);
    },
    [setFormData, setDropdownOpen, setSelectedIndex]
  );

  /**
   * Manipula a seleção de distribuidor responsável
   *
   * Segue o mesmo padrão dos outros handlers para manter consistência
   *
   * @param distribuidor - Objeto com id e nome do distribuidor selecionado
   */
  const handleDistribuidorSelect = useCallback(
    (distribuidor: { id: number; nome: string }) => {
      // Atualiza distribuidor no formulário
      setFormData(prev => ({ ...prev, distribuidor: distribuidor }));

      // Fecha dropdown e reseta estados
      setDropdownOpen(prev => ({ ...prev, distribuidor: false }));
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, distribuidor: -1 }));

      // Foco de retorno para continuidade da navegação
      setTimeout(() => {
        const trigger = document.querySelector('[data-dropdown="distribuidor"]');
        (trigger as HTMLElement)?.focus();
      }, 0);
    },
    [setFormData, setDropdownOpen, setSelectedIndex]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todas as funções de manipulação de dropdowns
   *
   * @returns Objeto com handlers para gerenciar dropdowns do formulário
   */
  return {
    /** Função para alternar abertura/fechamento de dropdowns */
    toggleDropdown,

    /** Handler para seleção de tipo de demanda */
    handleTipoDemandaSelect,

    /** Handler para seleção de analista responsável */
    handleAnalistaSelect,

    /** Handler para seleção de distribuidor responsável */
    handleDistribuidorSelect,
  };
};
