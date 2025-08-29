import { useCallback, useState } from 'react';
import { mockAnalistas } from '../../../data/mockAnalistas';
import { useDebounce } from './useDebounce';
import type { FiltroTabelas, FiltrosDocumentos, FiltrosEstatisticas } from '../types';

// Funções auxiliares para manipulação de arrays
const toggleArrayItem = <T>(array: T[], item: T): T[] =>
  array.includes(item) ? array.filter(i => i !== item) : [...array, item];

// Funções auxiliares para texto de exibição
const getMultiSelectDisplayText = (
  selectedItems: string[],
  totalItems: number,
  itemName: string
): string => {
  if (selectedItems.length === 0) return '';
  if (selectedItems.length === totalItems)
    return itemName === 'analistas' ? 'Todos' : `Todos os ${itemName}`;
  if (selectedItems.length === 1) return selectedItems[0];
  return `${selectedItems.length} ${itemName}`;
};

// Funções auxiliares para conversão de data
const parseDataBrasileira = (dataBr: string): Date | null => {
  if (!dataBr || dataBr.length !== 10) return null;
  const [dia, mes, ano] = dataBr.split('/');
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
};

const isDateInRange = (dataBr: string, dataInicio?: string, dataFim?: string): boolean => {
  if (!dataInicio && !dataFim) return true;

  const data = parseDataBrasileira(dataBr);
  if (!data) return false;

  const inicio = dataInicio ? new Date(dataInicio) : null;
  const fim = dataFim ? new Date(dataFim) : null;

  if (inicio && data < inicio) return false;
  if (fim && data > fim) return false;

  return true;
};

const formatDateToISO = (date: Date | null): string | undefined =>
  date ? date.toISOString().split('T')[0] : undefined;

export function useHomePageFilters() {
  // Estados dos filtros
  const [filtros, setFiltros] = useState<FiltroTabelas>({
    analista: [],
    referencia: '',
    documentos: '',
    dataInicio: undefined,
    dataFim: undefined,
  });

  const [filtrosEstatisticas, setFiltrosEstatisticas] = useState<FiltrosEstatisticas>({
    anos: [],
    analista: [],
    dataInicio: undefined,
    dataFim: undefined,
  });

  const [filtrosDocumentos, setFiltrosDocumentos] = useState<FiltrosDocumentos>({
    anos: [],
    dataInicio: undefined,
    dataFim: undefined,
  });

  // Estados dos dropdowns
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownAnosEstatisticasOpen, setDropdownAnosEstatisticasOpen] = useState(false);
  const [dropdownAnalistaEstatisticasOpen, setDropdownAnalistaEstatisticasOpen] = useState(false);
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
    (anosDisponiveis: string[]) =>
      getMultiSelectDisplayText(filtrosEstatisticas.anos, anosDisponiveis.length, 'anos'),
    [filtrosEstatisticas.anos]
  );

  // Função para manipular seleção múltipla de analistas das estatísticas
  const handleAnalistaEstatisticasChange = useCallback((analistaNome: string) => {
    setFiltrosEstatisticas(prev => ({
      ...prev,
      analista: toggleArrayItem(prev.analista, analistaNome),
    }));
  }, []);

  // Função para obter texto do filtro de analista das estatísticas
  const getAnalistaEstatisticasDisplayText = useCallback(
    () =>
      getMultiSelectDisplayText(filtrosEstatisticas.analista, mockAnalistas.length, 'analistas'),
    [filtrosEstatisticas.analista]
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

  // Handlers para filtros de data nas tabelas
  const handleDateRangeChange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setFiltros(prev => ({
      ...prev,
      dataInicio: formatDateToISO(startDate),
      dataFim: formatDateToISO(endDate),
    }));
  }, []);

  // Handlers para filtros de data nas estatísticas
  const handleDateRangeEstatisticasChange = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      setFiltrosEstatisticas(prev => ({
        ...prev,
        dataInicio: formatDateToISO(startDate),
        dataFim: formatDateToISO(endDate),
      }));
    },
    []
  );

  // Handlers para filtros de data nos documentos
  const handleDateRangeDocumentosChange = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      setFiltrosDocumentos(prev => ({
        ...prev,
        dataInicio: formatDateToISO(startDate),
        dataFim: formatDateToISO(endDate),
      }));
    },
    []
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
    dropdownAnalistaEstatisticasOpen,
    setDropdownAnalistaEstatisticasOpen,
    dropdownAnosDocumentosOpen,
    setDropdownAnosDocumentosOpen,

    // Handlers e funções utilitárias
    handleAnalistaChange,
    getAnalistaDisplayText,
    handleAnoEstatisticasChange,
    getAnosDisplayText,
    handleAnalistaEstatisticasChange,
    getAnalistaEstatisticasDisplayText,
    handleAnoDocumentosChange,
    getAnosDocumentosDisplayText,
    getSelectedYears,

    // Handlers para filtros de data
    handleDateRangeChange,
    handleDateRangeEstatisticasChange,
    handleDateRangeDocumentosChange,

    // Utilities
    parseDataBrasileira,
    isDateInRange,

    // Valores com debounce
    debouncedReferencia,
    debouncedDocumentos,
  };
}
