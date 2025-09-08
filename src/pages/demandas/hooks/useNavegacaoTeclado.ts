/**
 * Hook para navegação por teclado em elementos interativos da Nova Demanda
 *
 * @description
 * Implementa navegação completa por teclado para melhorar acessibilidade:
 * - Navegação com setas (ArrowUp/ArrowDown) em listas e dropdowns
 * - Seleção com Enter de itens destacados
 * - Escape para fechar elementos abertos
 * - Tab para navegação sequencial
 * - Scroll automático para manter item selecionado visível
 * - Suporte para busca autocomplete e dropdowns de seleção
 *
 * **Elementos Suportados**:
 * - **Campo Solicitante**: Lista de autocomplete com busca
 * - **Dropdowns**: Tipo de demanda, analista, distribuidor
 * - **Navegação Visual**: Highlight de itens selecionados
 * - **Scroll Inteligente**: Mantém item focado visível
 *
 * **Teclas de Controle**:
 * - **↓ (ArrowDown)**: Próximo item ou ativar busca se lista fechada
 * - **↑ (ArrowUp)**: Item anterior
 * - **Enter**: Selecionar item destacado
 * - **Escape**: Fechar lista/dropdown
 * - **Tab**: Fechar e continuar navegação sequencial
 *
 * **Acessibilidade**:
 * - Compatível com leitores de tela
 * - Navegação via teclado padrão ARIA
 * - Scroll automático para elementos fora da viewport
 * - Prevenção de bubbling em eventos críticos
 *
 * @example
 * const {
 *   handleKeyDown,
 *   handleDropdownKeyDown
 * } = useNavegacaoTeclado(
 *   searchResults,
 *   showResults,
 *   selectedIndex,
 *   setSelectedIndex,
 *   setShowResults
 * );
 *
 * // Input de busca
 * <input
 *   onKeyDown={(e) => handleKeyDown(e, selectSolicitanteResult, handleSolicitanteSearch)}
 * />
 *
 * // Dropdown
 * <div onKeyDown={(e) => handleDropdownKeyDown(e, 'analista', analistas, selectAnalista, dropdownOpen, setDropdownOpen)}>
 *
 * @module pages/NovaDemandaPage/hooks/useNavegacaoTeclado
 */

import { useCallback } from 'react';
import type { DropdownState } from './useFormularioEstado';

// ========== INTERFACES ==========

/**
 * Estado dos índices selecionados para cada elemento navegável
 * Usado para controlar qual item está destacado em cada lista
 */
interface SelectedIndexState {
  /** Índice selecionado na lista de solicitantes */
  solicitante: number;
  /** Índice selecionado na lista de tipos de demanda */
  tipoDemanda: number;
  /** Índice selecionado na lista de analistas */
  analista: number;
  /** Índice selecionado na lista de distribuidores */
  distribuidor: number;
}

/**
 * Estado de exibição das listas de resultados
 * Controla quais listas estão visíveis para navegação
 */
interface ShowResultsState {
  /** Se a lista de solicitantes está visível */
  solicitante: boolean;
}

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que implementa navegação por teclado para elementos interativos
 *
 * @param searchResults - Resultados das buscas (solicitante autocomplete)
 * @param showResults - Estado de exibição das listas de resultados
 * @param selectedIndex - Índices dos itens selecionados
 * @param setSelectedIndex - Função para atualizar índices selecionados
 * @param setShowResults - Função para controlar exibição de listas
 * @returns Objeto com funções de navegação
 */
export const useNavegacaoTeclado = (
  searchResults: { solicitante: string[] },
  showResults: ShowResultsState,
  selectedIndex: SelectedIndexState,
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>,
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>
) => {
  // ===== UTILITÁRIO: SCROLL AUTOMÁTICO =====
  /**
   * Rola automaticamente para manter o item selecionado visível
   *
   * **Funcionalidade**:
   * - Encontra container da lista de resultados
   * - Localiza item específico pelo índice
   * - Executa scroll suave para manter item visível
   * - Usa setTimeout para aguardar DOM update
   *
   * **Configuração do Scroll**:
   * - behavior: 'smooth' = animação suave
   * - block: 'nearest' = mínimo scroll necessário
   *
   * @param index - Índice do item que deve ficar visível
   */
  const scrollToSelectedItem = useCallback((index: number) => {
    // setTimeout garante que DOM foi atualizado antes do scroll
    setTimeout(() => {
      // ===== BUSCA DO CONTAINER =====
      const searchContainer = document.querySelector('[data-field="solicitante"]');
      const resultsContainer = searchContainer?.querySelector(
        '.searchResults, [class*="searchResults"]'
      );

      // Container não encontrado = lista não visível
      if (!resultsContainer) return;

      // ===== BUSCA DO ITEM ESPECÍFICO =====
      const selectedItem = resultsContainer.children[index] as HTMLElement;

      // ===== EXECUÇÃO DO SCROLL =====
      if (selectedItem && resultsContainer) {
        selectedItem.scrollIntoView({
          behavior: 'smooth', // Animação suave
          block: 'nearest', // Scroll mínimo necessário
        });
      }
    }, 0);
  }, []);

  // ===== NAVEGAÇÃO EM LISTA DE AUTOCOMPLETE =====
  /**
   * Handler para navegação por teclado em campo de autocomplete (solicitante)
   *
   * **Funcionalidades**:
   * - Navegação com setas entre resultados filtrados
   * - Seleção com Enter do item destacado
   * - Escape/Tab para fechar lista
   * - Auto-busca com seta para baixo se lista fechada
   *
   * **Comportamentos Especiais**:
   * - ↓ em campo vazio = inicia busca com valor atual
   * - Enter = seleciona item destacado e fecha lista
   * - Escape = fecha lista sem seleção
   * - Tab = fecha lista e continua navegação
   *
   * @param e - Evento de teclado
   * @param callback - Função para processar seleção do item
   * @param handleSolicitanteSearch - Função de busca (opcional)
   */
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      callback: (value: string) => void,
      handleSolicitanteSearch?: (query: string) => void
    ) => {
      const results = searchResults.solicitante;
      const isListVisible = showResults.solicitante;

      // ===== CASO ESPECIAL: ATIVAR BUSCA =====
      // Se lista não está visível e usuário pressiona ↓, ativa busca
      if (e.key === 'ArrowDown' && !isListVisible && handleSolicitanteSearch) {
        e.preventDefault();
        const input = e.target as HTMLInputElement;
        const currentValue = input.value;
        handleSolicitanteSearch(currentValue);
        return;
      }

      // ===== VALIDAÇÃO: LISTA DEVE TER RESULTADOS =====
      if (results.length === 0) return;

      const currentIndex = selectedIndex.solicitante;

      // ===== PROCESSAMENTO POR TECLA =====
      switch (e.key) {
        // **SETA PARA BAIXO**: Próximo item
        case 'ArrowDown': {
          e.preventDefault();
          // Não ultrapassa o último item
          const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : currentIndex;
          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: nextIndex }));
          scrollToSelectedItem(nextIndex);
          break;
        }

        // **SETA PARA CIMA**: Item anterior
        case 'ArrowUp': {
          e.preventDefault();
          // Não vai antes do primeiro item
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: prevIndex }));
          scrollToSelectedItem(prevIndex);
          break;
        }

        // **ENTER**: Selecionar item atual
        case 'Enter':
          e.preventDefault();
          e.stopPropagation(); // Evita submissão do formulário

          if (currentIndex >= 0 && currentIndex < results.length) {
            const selectedValue = results[currentIndex];
            callback(selectedValue);
            // Fecha lista e limpa seleção após escolha
            setShowResults((prev: ShowResultsState) => ({ ...prev, solicitante: false }));
            setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));
          }
          break;

        // **ESCAPE**: Cancelar sem seleção
        case 'Escape':
          setShowResults((prev: ShowResultsState) => ({ ...prev, solicitante: false }));
          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));
          break;

        // **TAB**: Fechar e continuar navegação
        case 'Tab':
          setShowResults((prev: ShowResultsState) => ({ ...prev, solicitante: false }));
          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));
          break;
      }
    },
    [
      searchResults.solicitante,
      showResults.solicitante,
      selectedIndex.solicitante,
      setSelectedIndex,
      setShowResults,
      scrollToSelectedItem,
    ]
  );

  // ===== NAVEGAÇÃO EM DROPDOWNS =====
  /**
   * Handler para navegação por teclado em dropdowns de seleção
   *
   * **Funcionalidades**:
   * - Navegação vertical em listas de opções
   * - Seleção com Enter da opção destacada
   * - Escape/Tab para fechar dropdown
   * - Scroll automático para opção selecionada
   *
   * **Diferenças do Autocomplete**:
   * - Trabalha com objetos {id, nome} ao invés de strings
   * - Usa seletores específicos para elementos de dropdown
   * - Suporta múltiplos dropdowns via parâmetro field
   *
   * **Navegação Circular**:
   * - Não implementada: para no primeiro/último item
   * - Iniciação inteligente: -1 vai para índice 0 na primeira navegação
   *
   * @param e - Evento de teclado
   * @param field - Campo do dropdown (tipoDemanda, analista, distribuidor)
   * @param options - Lista de opções disponíveis
   * @param selectCallback - Função para processar seleção
   * @param dropdownOpen - Estado de abertura dos dropdowns
   * @param setDropdownOpen - Função para controlar abertura
   */
  const handleDropdownKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      field: 'tipoDemanda' | 'analista' | 'distribuidor',
      options: { id: number; nome: string }[],
      selectCallback: (option: { id: number; nome: string }) => void,
      dropdownOpen: Record<string, boolean>,
      setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>
    ) => {
      // ===== VALIDAÇÕES INICIAIS =====
      // Só processa se dropdown estiver aberto e tiver opções
      if (!dropdownOpen[field] || options.length === 0) return;

      const currentIndex = selectedIndex[field];

      // ===== PROCESSAMENTO POR TECLA =====
      switch (e.key) {
        // **SETA PARA BAIXO**: Próxima opção
        case 'ArrowDown': {
          e.preventDefault();

          // ===== CÁLCULO DO PRÓXIMO ÍNDICE =====
          const nextIndex =
            currentIndex === -1 // Primeiro uso: vai para 0
              ? 0
              : currentIndex < options.length - 1 // Não ultrapassa último
                ? currentIndex + 1
                : currentIndex;

          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, [field]: nextIndex }));

          // ===== SCROLL PARA OPÇÃO SELECIONADA =====
          setTimeout(() => {
            const dropdown = document.querySelector(
              `[data-dropdown="${field}"][class*="multiSelectDropdown"]`
            );
            if (dropdown) {
              const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
              const focusedItem = items[nextIndex] as HTMLElement;
              if (focusedItem) {
                focusedItem.scrollIntoView({
                  block: 'nearest',
                  behavior: 'smooth',
                });
              }
            }
          }, 0);
          break;
        }

        // **SETA PARA CIMA**: Opção anterior
        case 'ArrowUp': {
          e.preventDefault();

          // ===== CÁLCULO DO ÍNDICE ANTERIOR =====
          const prevIndex =
            currentIndex === -1
              ? 0 // Primeiro uso: vai para 0
              : currentIndex > 0
                ? currentIndex - 1 // Volta um
                : currentIndex; // Para no primeiro

          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, [field]: prevIndex }));

          // ===== SCROLL PARA OPÇÃO SELECIONADA =====
          setTimeout(() => {
            const dropdown = document.querySelector(
              `[data-dropdown="${field}"][class*="multiSelectDropdown"]`
            );
            if (dropdown) {
              const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
              const focusedItem = items[prevIndex] as HTMLElement;
              if (focusedItem) {
                focusedItem.scrollIntoView({
                  block: 'nearest',
                  behavior: 'smooth',
                });
              }
            }
          }, 0);
          break;
        }

        // **TAB**: Fechar e continuar navegação
        case 'Tab':
          setDropdownOpen((prev: DropdownState) => ({ ...prev, [field]: false }));
          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, [field]: -1 }));
          break;

        // **ENTER**: Selecionar opção atual
        case 'Enter':
          e.preventDefault();
          e.stopPropagation(); // Evita submissão do formulário

          if (currentIndex >= 0 && currentIndex < options.length) {
            selectCallback(options[currentIndex]);
            // Dropdown se fecha automaticamente via selectCallback
          }
          break;

        // **ESCAPE**: Cancelar sem seleção
        case 'Escape':
          e.preventDefault();
          setDropdownOpen((prev: DropdownState) => ({ ...prev, [field]: false }));
          setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, [field]: -1 }));
          break;
      }
    },
    [selectedIndex, setSelectedIndex]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todas as funções de navegação por teclado
   *
   * @returns Objeto com handlers de navegação
   */
  return {
    /** Handler para navegação em campo de autocomplete (solicitante) */
    handleKeyDown,

    /** Handler para navegação em dropdowns de seleção */
    handleDropdownKeyDown,

    /** Utilitário para scroll automático em listas */
    scrollToSelectedItem,
  };
};
