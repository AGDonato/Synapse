/**
 * Hook para gerenciamento de filtros da página inicial
 *
 * @description
 * Centraliza todo o sistema de filtragem da HomePage:
 * - Filtros de tabelas (analista, referência, documentos)
 * - Filtros de estatísticas (anos, analistas, status, tipos)
 * - Filtros de documentos específicos
 * - Estados de dropdowns de seleção múltipla
 * - Debounce para otimização de performance
 * - Utilitários para manipulação e exibição de filtros
 *
 * @example
 * const {
 *   filtros,
 *   handleAnalistaChange,
 *   getAnalistaDisplayText,
 *   debouncedReferencia
 * } = useHomePageFilters();
 *
 * // Aplicar filtro de analista
 * handleAnalistaChange('João Silva');
 *
 * @module pages/HomePage/hooks/useHomePageFilters
 */

import { useCallback, useState } from 'react';
import { mockAnalistas } from '../../../shared/data/mockAnalistas';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import type { FiltroTabelas, FiltrosDocumentos, FiltrosEstatisticas } from '../types';

// ========== FUNÇÕES AUXILIARES ==========
// Utilitários para manipulação de arrays e exibição de texto

// Adiciona ou remove item de um array (toggle)
const toggleArrayItem = <T>(array: T[], item: T): T[] =>
  array.includes(item) ? array.filter(i => i !== item) : [...array, item];

// Gera texto de exibição para seleções múltiplas (ex: "2 analistas", "Todos os anos")
const getMultiSelectDisplayText = (
  selectedItems: string[],
  totalItems: number,
  itemName: string
): string => {
  if (selectedItems.length === 0) return ''; // Nenhum selecionado
  if (selectedItems.length === totalItems)
    // Todos selecionados
    return itemName === 'analistas' ? 'Todos' : `Todos os ${itemName}`;
  if (selectedItems.length === 1) return selectedItems[0]; // Um único item
  return `${selectedItems.length} ${itemName}`; // Múltiplos itens
};

// ========== HOOK PRINCIPAL ==========
export function useHomePageFilters() {
  // Estados dos filtros
  const [filtros, setFiltros] = useState<FiltroTabelas>({
    analista: [],
    referencia: '',
    documentos: '',
  });

  const [filtrosEstatisticas, setFiltrosEstatisticas] = useState<FiltrosEstatisticas>({
    anos: [],
    analista: [],
    demandas: {
      status: [],
      tipoDemanda: [],
      orgao: [],
    },
    documentos: {
      tipoDocumento: [],
      assunto: [],
      statusDocumento: [],
    },
  });

  const [filtrosDocumentos, setFiltrosDocumentos] = useState<FiltrosDocumentos>({
    anos: [],
  });

  // ===== CONTROLE DE DROPDOWNS =====
  // Estados para controlar visibilidade dos menus de seleção
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownAnosEstatisticasOpen, setDropdownAnosEstatisticasOpen] = useState(false);
  const [dropdownAnosDocumentosOpen, setDropdownAnosDocumentosOpen] = useState(false);

  // Valores com debounce para filtros de texto
  const debouncedReferencia = useDebounce(filtros.referencia, 300);
  const debouncedDocumentos = useDebounce(filtros.documentos, 300);

  // Função para manipular seleção múltipla de analistas
  const handleAnalistaChange = useCallback((analistaNome: string) => {
    setFiltros(prev => ({ ...prev, analista: toggleArrayItem(prev.analista, analistaNome) }));
  }, []);

  // Função para obter texto do filtro de analista
  const getAnalistaDisplayText = useCallback(
    () => getMultiSelectDisplayText(filtros.analista, mockAnalistas.length, 'analistas'),
    [filtros.analista]
  );

  // Função para manipular seleção múltipla de anos das estatísticas
  const handleAnoEstatisticasChange = useCallback((ano: string) => {
    setFiltrosEstatisticas(prev => ({ ...prev, anos: toggleArrayItem(prev.anos, ano) }));
  }, []);

  // Função para obter texto do filtro de anos
  const getAnosDisplayText = useCallback(
    (anosDisponiveis: string[]) => {
      // Se nenhum ano está selecionado, mostra "Todos os anos"
      if (filtrosEstatisticas.anos.length === 0) {
        return 'Todos os anos';
      }
      return getMultiSelectDisplayText(filtrosEstatisticas.anos, anosDisponiveis.length, 'anos');
    },
    [filtrosEstatisticas.anos]
  );

  // Função para manipular seleção múltipla de anos dos documentos
  const handleAnoDocumentosChange = useCallback((ano: string) => {
    setFiltrosDocumentos(prev => ({ ...prev, anos: toggleArrayItem(prev.anos, ano) }));
  }, []);

  // Função para obter texto do filtro de anos dos documentos
  const getAnosDocumentosDisplayText = useCallback(
    (anosDisponiveis: string[]) => {
      if (filtrosDocumentos.anos.length === anosDisponiveis.length) return '';
      return getMultiSelectDisplayText(filtrosDocumentos.anos, anosDisponiveis.length, 'anos');
    },
    [filtrosDocumentos.anos]
  );

  // Função para obter anos selecionados (ou todos se vazio)
  const getSelectedYears = useCallback(
    (anosDisponiveis: string[]) =>
      filtrosDocumentos.anos.length > 0 ? filtrosDocumentos.anos : anosDisponiveis,
    [filtrosDocumentos.anos]
  );

  return {
    // Estados
    filtros,
    filtrosEstatisticas,
    filtrosDocumentos,
    setFiltros,
    setFiltrosEstatisticas,
    setFiltrosDocumentos,

    // Estados dos dropdowns
    dropdownOpen,
    setDropdownOpen,
    dropdownAnosEstatisticasOpen,
    setDropdownAnosEstatisticasOpen,
    dropdownAnosDocumentosOpen,
    setDropdownAnosDocumentosOpen,

    // Handlers e funções utilitárias
    handleAnalistaChange,
    getAnalistaDisplayText,
    handleAnoEstatisticasChange,
    getAnosDisplayText,
    handleAnoDocumentosChange,
    getAnosDocumentosDisplayText,
    getSelectedYears,

    // Valores com debounce
    debouncedReferencia,
    debouncedDocumentos,
  };
}
