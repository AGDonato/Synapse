import { useCallback, useState } from 'react';
import { mockAnalistas } from '../../../data/mockAnalistas';
import { useDebounce } from './useDebounce';
import type { FiltroTabelas, FiltrosDocumentos, FiltrosEstatisticas } from '../types';

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
    setFiltros(prev => {
      const currentAnalistas = prev.analista;
      const newAnalistas = currentAnalistas.includes(analistaNome)
        ? currentAnalistas.filter(item => item !== analistaNome)
        : [...currentAnalistas, analistaNome];
      return { ...prev, analista: newAnalistas };
    });
  }, []);

  // Função para obter texto do filtro de analista
  const getAnalistaDisplayText = useCallback(() => {
    if (filtros.analista.length === 0) {
      return '';
    }
    if (filtros.analista.length === mockAnalistas.length) {
      return 'Todos';
    }
    if (filtros.analista.length === 1) {
      return filtros.analista[0];
    }
    return `${filtros.analista.length} analistas`;
  }, [filtros.analista]);

  // Função para manipular seleção múltipla de anos das estatísticas
  const handleAnoEstatisticasChange = useCallback((ano: string) => {
    setFiltrosEstatisticas(prev => {
      const currentAnos = prev.anos;
      const newAnos = currentAnos.includes(ano)
        ? currentAnos.filter(item => item !== ano)
        : [...currentAnos, ano];
      return { ...prev, anos: newAnos };
    });
  }, []);

  // Função para obter texto do filtro de anos
  const getAnosDisplayText = useCallback((anosDisponiveis: string[]) => {
    if (filtrosEstatisticas.anos.length === 0) {
      return '';
    }
    if (filtrosEstatisticas.anos.length === anosDisponiveis.length) {
      return 'Todos os anos';
    }
    if (filtrosEstatisticas.anos.length === 1) {
      return filtrosEstatisticas.anos[0];
    }
    return `${filtrosEstatisticas.anos.length} anos`;
  }, [filtrosEstatisticas.anos]);

  // Função para manipular seleção múltipla de analistas das estatísticas
  const handleAnalistaEstatisticasChange = useCallback((analistaNome: string) => {
    setFiltrosEstatisticas(prev => {
      const currentAnalistas = prev.analista;
      const newAnalistas = currentAnalistas.includes(analistaNome)
        ? currentAnalistas.filter(item => item !== analistaNome)
        : [...currentAnalistas, analistaNome];
      return { ...prev, analista: newAnalistas };
    });
  }, []);

  // Função para obter texto do filtro de analista das estatísticas
  const getAnalistaEstatisticasDisplayText = useCallback(() => {
    if (filtrosEstatisticas.analista.length === 0) {
      return '';
    }
    if (filtrosEstatisticas.analista.length === mockAnalistas.length) {
      return 'Todos';
    }
    if (filtrosEstatisticas.analista.length === 1) {
      return filtrosEstatisticas.analista[0];
    }
    return `${filtrosEstatisticas.analista.length} analistas`;
  }, [filtrosEstatisticas.analista]);

  // Função para manipular seleção múltipla de anos dos documentos
  const handleAnoDocumentosChange = useCallback((ano: string) => {
    setFiltrosDocumentos(prev => {
      const currentAnos = prev.anos;
      const newAnos = currentAnos.includes(ano)
        ? currentAnos.filter(item => item !== ano)
        : [...currentAnos, ano];
      return { ...prev, anos: newAnos };
    });
  }, []);

  // Função para obter texto do filtro de anos dos documentos
  const getAnosDocumentosDisplayText = useCallback((anosDisponiveis: string[]) => {
    if (filtrosDocumentos.anos.length === 0) {
      return '';
    }
    if (filtrosDocumentos.anos.length === anosDisponiveis.length) {
      return '';
    }
    if (filtrosDocumentos.anos.length === 1) {
      return filtrosDocumentos.anos[0];
    }
    return `${filtrosDocumentos.anos.length} anos`;
  }, [filtrosDocumentos.anos]);

  // Função para obter anos selecionados (ou todos se vazio)
  const getSelectedYears = useCallback((anosDisponiveis: string[]) => {
    return filtrosDocumentos.anos.length > 0
      ? filtrosDocumentos.anos
      : anosDisponiveis;
  }, [filtrosDocumentos.anos]);

  // Handlers para filtros de data nas tabelas
  const handleDateRangeChange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setFiltros(prev => ({
      ...prev,
      dataInicio: startDate ? startDate.toISOString().split('T')[0] : undefined,
      dataFim: endDate ? endDate.toISOString().split('T')[0] : undefined,
    }));
  }, []);

  // Handlers para filtros de data nas estatísticas
  const handleDateRangeEstatisticasChange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setFiltrosEstatisticas(prev => ({
      ...prev,
      dataInicio: startDate ? startDate.toISOString().split('T')[0] : undefined,
      dataFim: endDate ? endDate.toISOString().split('T')[0] : undefined,
    }));
  }, []);

  // Handlers para filtros de data nos documentos
  const handleDateRangeDocumentosChange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setFiltrosDocumentos(prev => ({
      ...prev,
      dataInicio: startDate ? startDate.toISOString().split('T')[0] : undefined,
      dataFim: endDate ? endDate.toISOString().split('T')[0] : undefined,
    }));
  }, []);

  // Função utilitária para converter data brasileira para Date
  const parseDataBrasileira = useCallback((dataBr: string): Date | null => {
    if (!dataBr || dataBr.length !== 10) {return null;}
    const [dia, mes, ano] = dataBr.split('/');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }, []);

  // Função utilitária para verificar se uma data está dentro do range
  const isDateInRange = useCallback((dataBr: string, dataInicio?: string, dataFim?: string): boolean => {
    if (!dataInicio && !dataFim) {return true;}
    
    const data = parseDataBrasileira(dataBr);
    if (!data) {return false;}

    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim) : null;

    if (inicio && data < inicio) {return false;}
    if (fim && data > fim) {return false;}
    
    return true;
  }, [parseDataBrasileira]);

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