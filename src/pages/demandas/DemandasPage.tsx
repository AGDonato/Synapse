// src/pages/DemandasPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDemandasData } from '../../shared/hooks/queries/useDemandas';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import { FilterX } from 'lucide-react';
import { mockTiposDemandas } from '../../shared/data/mockTiposDemandas';
// import { mockDistribuidores } from '../../shared/data/mockDistribuidores';
import { mockAnalistas } from '../../shared/data/mockAnalistas';
import type { Demanda } from '../../shared/data/mockDemandas';
import { mockDocumentosDemanda } from '../../shared/data/mockDocumentos';
import { calculateDemandaStatus } from '../../shared/utils/statusUtils';
import {
  formatDateToDDMMYYYY,
  formatDateToDDMMYYYYOrPlaceholder,
} from '../../shared/utils/dateUtils';
import { getOrgaoAbreviacao } from '../../shared/utils/orgaoUtils';
import { logger } from '../../shared/utils/logger';

import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DemandasPage.module.css';

type SortConfig = {
  key: keyof Demanda | 'status';
  direction: 'asc' | 'desc';
} | null;

registerLocale('pt-BR', ptBR);

const initialFilterState = {
  referencia: '',
  tipoDemanda: '',
  solicitante: '',
  status: [] as string[],
  analista: [] as string[],
  descricao: '',
  documentos: '',
  periodoInicial: [null, null] as [Date | null, Date | null],
  periodoFinal: [null, null] as [Date | null, Date | null],
};

export default function DemandasPage() {
  const { data: demandas = [] } = useDemandasData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Função para restaurar estado dos filtros da URL
  const getInitialFilters = () => {
    const urlFilters = { ...initialFilterState };

    // Restaurar filtros simples
    if (searchParams.get('referencia')) {
      urlFilters.referencia = searchParams.get('referencia')!;
    }
    if (searchParams.get('tipoDemanda')) {
      urlFilters.tipoDemanda = searchParams.get('tipoDemanda')!;
    }
    if (searchParams.get('solicitante')) {
      urlFilters.solicitante = searchParams.get('solicitante')!;
    }
    if (searchParams.get('descricao')) {
      urlFilters.descricao = searchParams.get('descricao')!;
    }
    if (searchParams.get('documentos')) {
      urlFilters.documentos = searchParams.get('documentos')!;
    }

    // Restaurar arrays
    const statusParam = searchParams.get('status');
    if (statusParam) {
      urlFilters.status = statusParam.split(',');
    }
    const analistaParam = searchParams.get('analista');
    if (analistaParam) {
      urlFilters.analista = analistaParam.split(',');
    }

    // Restaurar datas
    const periodoInicialParam = searchParams.get('periodoInicial');
    if (periodoInicialParam) {
      const [start, end] = periodoInicialParam.split('|');
      urlFilters.periodoInicial = [start ? new Date(start) : null, end ? new Date(end) : null];
    }
    const periodoFinalParam = searchParams.get('periodoFinal');
    if (periodoFinalParam) {
      const [start, end] = periodoFinalParam.split('|');
      urlFilters.periodoFinal = [start ? new Date(start) : null, end ? new Date(end) : null];
    }

    return urlFilters;
  };

  // Função para restaurar ordenação da URL
  const getInitialSort = (): SortConfig => {
    const sortKey = searchParams.get('sortKey');
    const sortDirection = searchParams.get('sortDirection');
    if (sortKey && sortDirection) {
      return {
        key: sortKey as keyof Demanda | 'status',
        direction: sortDirection as 'asc' | 'desc',
      };
    }
    return null;
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('itemsPerPage') || '10')
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>(getInitialSort);
  const [dropdownOpen, setDropdownOpen] = useState<{
    status: boolean;
    analista: boolean;
    tipoDemanda: boolean;
    solicitante: boolean;
    itemsPerPage: boolean;
  }>({
    status: false,
    analista: false,
    tipoDemanda: false,
    solicitante: false,
    itemsPerPage: false,
  });

  // Estado para controlar item focado em cada dropdown
  const [focusedIndex, setFocusedIndex] = useState<{
    tipoDemanda: number;
    solicitante: number;
    status: number;
    analista: number;
    itemsPerPage: number;
  }>({
    tipoDemanda: -1,
    solicitante: -1,
    status: -1,
    analista: -1,
    itemsPerPage: -1,
  });

  // Ref para acessar o valor mais atual de focusedIndex
  const focusedIndexRef = useRef(focusedIndex);
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  const [solicitanteSearch, setSolicitanteSearch] = useState('');

  // Função para atualizar a URL com o estado atual
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    // Adicionar página e itens por página
    if (currentPage !== 1) {
      params.set('page', currentPage.toString());
    }
    if (itemsPerPage !== 10) {
      params.set('itemsPerPage', itemsPerPage.toString());
    }

    // Adicionar ordenação
    if (sortConfig) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDirection', sortConfig.direction);
    }

    // Adicionar filtros simples
    if (filters.referencia.trim()) {
      params.set('referencia', filters.referencia);
    }
    if (filters.tipoDemanda) {
      params.set('tipoDemanda', filters.tipoDemanda);
    }
    if (filters.solicitante) {
      params.set('solicitante', filters.solicitante);
    }
    if (filters.descricao.trim()) {
      params.set('descricao', filters.descricao);
    }
    if (filters.documentos.trim()) {
      params.set('documentos', filters.documentos);
    }

    // Adicionar arrays
    if (filters.status.length > 0) {
      params.set('status', filters.status.join(','));
    }
    if (filters.analista.length > 0) {
      params.set('analista', filters.analista.join(','));
    }

    // Adicionar datas
    if (filters.periodoInicial[0] || filters.periodoInicial[1]) {
      const start = filters.periodoInicial[0]?.toISOString() || '';
      const end = filters.periodoInicial[1]?.toISOString() || '';
      params.set('periodoInicial', `${start}|${end}`);
    }
    if (filters.periodoFinal[0] || filters.periodoFinal[1]) {
      const start = filters.periodoFinal[0]?.toISOString() || '';
      const end = filters.periodoFinal[1]?.toISOString() || '';
      params.set('periodoFinal', `${start}|${end}`);
    }

    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, sortConfig, filters, setSearchParams]);

  // Efeito para atualizar URL sempre que o estado mudar
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Listener para fechar dropdowns multi-select ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Verificar se clicou fora do dropdown de status
      if (dropdownOpen.status) {
        const statusContainer = document
          .querySelector('[data-dropdown="status"]')
          ?.closest(`.${styles.multiSelectContainer}`);
        if (statusContainer && !statusContainer.contains(target)) {
          setDropdownOpen(prev => ({ ...prev, status: false }));
        }
      }

      // Verificar se clicou fora do dropdown de analista
      if (dropdownOpen.analista) {
        const analistaContainer = document
          .querySelector('[data-dropdown="analista"]')
          ?.closest(`.${styles.multiSelectContainer}`);
        if (analistaContainer && !analistaContainer.contains(target)) {
          setDropdownOpen(prev => ({ ...prev, analista: false }));
        }
      }

      // Verificar se clicou fora do dropdown de solicitante
      if (dropdownOpen.solicitante) {
        const solicitanteContainer = document
          .querySelector('[data-dropdown="solicitante"]')
          ?.closest(`.${styles.multiSelectContainer}`);
        if (solicitanteContainer && !solicitanteContainer.contains(target)) {
          setDropdownOpen(prev => ({ ...prev, solicitante: false }));
          setSolicitanteSearch('');
        }
      }
    };

    if (dropdownOpen.status || dropdownOpen.analista || dropdownOpen.solicitante) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen.status, dropdownOpen.analista, dropdownOpen.solicitante]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
    setCurrentPage(1);
    setDropdownOpen({
      status: false,
      analista: false,
      tipoDemanda: false,
      solicitante: false,
      itemsPerPage: false,
    });
    setSolicitanteSearch('');
  };

  // Função para manipular filtros de multiseleção
  const handleMultiSelectChange = (filterType: 'status' | 'analista', value: string) => {
    logger.info('🔄 Multi-select change:', filterType, value);
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];

      logger.info('📝 Novos valores:', newValues);
      return { ...prev, [filterType]: newValues };
    });
    setCurrentPage(1);
  };

  // Função para obter o texto do filtro baseado na seleção
  const getFilterDisplayText = (filterType: 'status' | 'analista') => {
    const selectedItems = filters[filterType];
    const allOptions =
      filterType === 'status'
        ? ['Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando']
        : mockAnalistas.map(d => d.nome);

    if (selectedItems.length === 0) {
      return `Selecione ${filterType === 'status' ? 'status' : 'analistas'}...`;
    }

    if (selectedItems.length === allOptions.length) {
      return 'Todos';
    }

    if (selectedItems.length === 1) {
      return selectedItems[0];
    }

    return `${selectedItems.length} ${filterType === 'status' ? 'status' : 'analistas'}`;
  };

  // Função para alternar dropdown
  const toggleDropdown = (
    filterType: 'status' | 'analista' | 'tipoDemanda' | 'solicitante' | 'itemsPerPage'
  ) => {
    setDropdownOpen(prev => {
      const isOpening = !prev[filterType];

      // Reset do índice focado quando abre o dropdown
      if (isOpening) {
        setFocusedIndex(prevIndex => ({
          ...prevIndex,
          [filterType]: -1,
        }));
      }

      return {
        status: false,
        analista: false,
        tipoDemanda: false,
        solicitante: false,
        itemsPerPage: false,
        [filterType]: isOpening,
      };
    });
  };

  // Verifica se há filtros aplicados
  const hasActiveFilters = () => {
    return (
      filters.referencia.trim() !== '' ||
      filters.tipoDemanda !== '' ||
      filters.solicitante !== '' ||
      filters.status.length > 0 ||
      filters.analista.length > 0 ||
      filters.descricao.trim() !== '' ||
      filters.documentos.trim() !== '' ||
      filters.periodoInicial[0] !== null ||
      filters.periodoFinal[0] !== null
    );
  };

  // Função para lidar com clique no cabeçalho
  const handleSort = useCallback((key: keyof Demanda | 'status') => {
    setSortConfig(current => {
      if (current && current.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Remove ordenação
        }
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1); // Reset para primeira página quando ordenar
  }, []);

  // Função para renderizar ícone de ordenação
  const getSortIcon = useCallback(
    (key: keyof Demanda | 'status') => {
      if (!sortConfig || sortConfig.key !== key) {
        return (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='12'
            height='12'
            fill='currentColor'
            viewBox='0 0 16 16'
            style={{ opacity: 0.3, marginLeft: '4px' }}
          >
            <path d='M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z' />
            <path d='M8 15a.5.5 0 0 1-.5-.5V2.707L4.354 5.854a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L8.5 2.707V14.5A.5.5 0 0 1 8 15z' />
          </svg>
        );
      }

      return sortConfig.direction === 'asc' ? (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          fill='currentColor'
          viewBox='0 0 16 16'
          style={{ marginLeft: '4px' }}
        >
          <path d='m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z' />
        </svg>
      ) : (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          fill='currentColor'
          viewBox='0 0 16 16'
          style={{ marginLeft: '4px' }}
        >
          <path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z' />
        </svg>
      );
    },
    [sortConfig]
  );

  const filteredDemandas = useMemo(() => {
    const [dtIniDe, dtIniAte] = filters.periodoInicial;
    const [dtFimDe, dtFimAte] = filters.periodoFinal;

    return demandas.filter(demanda => {
      const termoBuscaReferencia = filters.referencia.toLowerCase();
      const calculatedStatus = calculateDemandaStatus(demanda, mockDocumentosDemanda);

      if (filters.status.length > 0 && !filters.status.includes(calculatedStatus)) {
        return false;
      }
      if (filters.tipoDemanda && demanda.tipoDemanda !== filters.tipoDemanda) {
        return false;
      }
      if (filters.analista.length > 0 && !filters.analista.includes(demanda.analista)) {
        return false;
      }
      if (filters.solicitante && getOrgaoAbreviacao(demanda.orgao) !== filters.solicitante) {
        return false;
      }
      if (
        filters.referencia &&
        !demanda.sged.toLowerCase().includes(termoBuscaReferencia) &&
        !(demanda.autosAdministrativos || '').toLowerCase().includes(termoBuscaReferencia) &&
        !(demanda.autosJudiciais || '').toLowerCase().includes(termoBuscaReferencia) &&
        !(demanda.autosExtrajudiciais || '').toLowerCase().includes(termoBuscaReferencia) &&
        !(demanda.pic || '').toLowerCase().includes(termoBuscaReferencia)
      ) {
        return false;
      }
      if (
        filters.descricao &&
        !demanda.descricao.toLowerCase().includes(filters.descricao.toLowerCase())
      ) {
        return false;
      }

      // Filtro para Documentos
      if (filters.documentos) {
        const termoBuscaDocumentos = filters.documentos.toLowerCase();
        const documentosDaDemanda = mockDocumentosDemanda.filter(
          doc => doc.demandaId === demanda.id
        );

        let encontrouNosDocumentos = false;

        for (const documento of documentosDaDemanda) {
          // Buscar no código de rastreio geral
          if (documento.codigoRastreio?.toLowerCase().includes(termoBuscaDocumentos)) {
            encontrouNosDocumentos = true;
            break;
          }

          // Buscar nos códigos de rastreio individuais dos destinatários (Ofícios Circulares)
          if (documento.tipoDocumento === 'Ofício Circular' && documento.destinatariosData) {
            const hasMatchingDestinatarioRastreio = documento.destinatariosData.some(
              destinatario => {
                return (
                  destinatario.codigoRastreio &&
                  destinatario.codigoRastreio.toLowerCase().includes(termoBuscaDocumentos)
                );
              }
            );
            if (hasMatchingDestinatarioRastreio) {
              encontrouNosDocumentos = true;
              break;
            }
          }

          // Buscar no hash da mídia
          if (documento.hashMidia?.toLowerCase().includes(termoBuscaDocumentos)) {
            encontrouNosDocumentos = true;
            break;
          }

          // Buscar no número ATENA
          if (documento.numeroAtena?.toLowerCase().includes(termoBuscaDocumentos)) {
            encontrouNosDocumentos = true;
            break;
          }

          // Buscar no número do documento
          if (documento.numeroDocumento?.toLowerCase().includes(termoBuscaDocumentos)) {
            encontrouNosDocumentos = true;
            break;
          }

          // Buscar nos identificadores das pesquisas
          for (const pesquisa of documento.pesquisas || []) {
            if (pesquisa.identificador?.toLowerCase().includes(termoBuscaDocumentos)) {
              encontrouNosDocumentos = true;
              break;
            }
          }

          if (encontrouNosDocumentos) {
            break;
          }
        }

        if (!encontrouNosDocumentos) {
          return false;
        }
      }

      // Filtro para Data Inicial
      if (dtIniDe || dtIniAte) {
        // As datas estão no formato DD/MM/YYYY
        const [diaIni, mesIni, anoIni] = demanda.dataInicial.split('/').map(Number);
        const dataInicialDemanda = new Date(anoIni, mesIni - 1, diaIni);
        dataInicialDemanda.setHours(12, 0, 0, 0); // Normaliza para meio-dia para evitar problemas de timezone

        if (dtIniDe) {
          const inicioPeriodo = new Date(dtIniDe);
          inicioPeriodo.setHours(0, 0, 0, 0);
          if (dataInicialDemanda < inicioPeriodo) {
            return false;
          }
        }
        if (dtIniAte) {
          const fimPeriodo = new Date(dtIniAte);
          fimPeriodo.setHours(23, 59, 59, 999);
          if (dataInicialDemanda > fimPeriodo) {
            return false;
          }
        }
      }

      // Filtro para Data Final
      if (dtFimDe || dtFimAte) {
        if (!demanda.dataFinal) {
          // Se filtro de data final está ativo mas a demanda não tem data final, não mostrar
          return false;
        }

        // As datas estão no formato DD/MM/YYYY
        const [diaFim, mesFim, anoFim] = demanda.dataFinal.split('/').map(Number);
        const dataFinalDemanda = new Date(anoFim, mesFim - 1, diaFim);
        dataFinalDemanda.setHours(12, 0, 0, 0); // Normaliza para meio-dia para evitar problemas de timezone

        if (dtFimDe) {
          const inicioPeriodoFim = new Date(dtFimDe);
          inicioPeriodoFim.setHours(0, 0, 0, 0);
          if (dataFinalDemanda < inicioPeriodoFim) {
            return false;
          }
        }
        if (dtFimAte) {
          const fimPeriodoFim = new Date(dtFimAte);
          fimPeriodoFim.setHours(23, 59, 59, 999);
          if (dataFinalDemanda > fimPeriodoFim) {
            return false;
          }
        }
      }
      return true;
    });
  }, [demandas, filters]);

  const solicitantesUnicos = useMemo(() => {
    const todosOsSolicitantes = demandas.map(d => d.orgao);
    return [...new Set(todosOsSolicitantes)].map(s => ({
      id: s,
      nome: getOrgaoAbreviacao(s),
    }));
  }, [demandas]);

  // Filtrar solicitantes baseado na busca
  const solicitantesFiltrados = useMemo(() => {
    if (!solicitanteSearch.trim()) {
      return solicitantesUnicos;
    }
    return solicitantesUnicos.filter(s =>
      s.nome.toLowerCase().includes(solicitanteSearch.toLowerCase())
    );
  }, [solicitantesUnicos, solicitanteSearch]);

  // Dados ordenados
  const sortedDemandas = useMemo(() => {
    if (!sortConfig) {
      return filteredDemandas;
    }

    return [...filteredDemandas].sort((a, b) => {
      let aValue: string | number | boolean | null | undefined;
      let bValue: string | number | boolean | null | undefined;

      if (sortConfig.key === 'status') {
        aValue = calculateDemandaStatus(a, mockDocumentosDemanda);
        bValue = calculateDemandaStatus(b, mockDocumentosDemanda);
      } else {
        aValue = a[sortConfig.key as keyof Demanda];
        bValue = b[sortConfig.key as keyof Demanda];
      }

      if (aValue === null || aValue === undefined) {
        return 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      let comparison = 0;

      // Comparação para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      // Comparação para strings (case insensitive)
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      }
      // Comparação genérica
      else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredDemandas, sortConfig]);

  const totalPages = Math.ceil(sortedDemandas.length / itemsPerPage);

  // Reset da página quando fica fora do range válido devido a filtros
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDemandas.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRowClick = (demandaId: number) => {
    // Preservar estado atual na URL de destino
    const currentParams = new URLSearchParams();

    // Adicionar todos os parâmetros atuais
    if (currentPage !== 1) {
      currentParams.set('page', currentPage.toString());
    }
    if (itemsPerPage !== 10) {
      currentParams.set('itemsPerPage', itemsPerPage.toString());
    }
    if (sortConfig) {
      currentParams.set('sortKey', sortConfig.key);
      currentParams.set('sortDirection', sortConfig.direction);
    }
    if (filters.referencia.trim()) {
      currentParams.set('referencia', filters.referencia);
    }
    if (filters.tipoDemanda) {
      currentParams.set('tipoDemanda', filters.tipoDemanda);
    }
    if (filters.solicitante) {
      currentParams.set('solicitante', filters.solicitante);
    }
    if (filters.descricao.trim()) {
      currentParams.set('descricao', filters.descricao);
    }
    if (filters.documentos.trim()) {
      currentParams.set('documentos', filters.documentos);
    }
    if (filters.status.length > 0) {
      currentParams.set('status', filters.status.join(','));
    }
    if (filters.analista.length > 0) {
      currentParams.set('analista', filters.analista.join(','));
    }
    if (filters.periodoInicial[0] || filters.periodoInicial[1]) {
      const start = filters.periodoInicial[0]?.toISOString() || '';
      const end = filters.periodoInicial[1]?.toISOString() || '';
      currentParams.set('periodoInicial', `${start}|${end}`);
    }
    if (filters.periodoFinal[0] || filters.periodoFinal[1]) {
      const start = filters.periodoFinal[0]?.toISOString() || '';
      const end = filters.periodoFinal[1]?.toISOString() || '';
      currentParams.set('periodoFinal', `${start}|${end}`);
    }

    const queryString = currentParams.toString();
    const url = queryString
      ? `/demandas/${demandaId}?returnTo=list&${queryString}`
      : `/demandas/${demandaId}?returnTo=list`;
    navigate(url);
  };

  // Função para navegar na lista de opções (usado quando já está navegando)
  const handleListNavigation = (e: React.KeyboardEvent, dropdownKey: string) => {
    const getOptions = () => {
      switch (dropdownKey) {
        case 'tipoDemanda':
          return ['', ...mockTiposDemandas.map(t => t.nome)];
        case 'solicitante':
          return ['', ...solicitantesFiltrados.map(s => s.nome)];
        case 'status':
          return ['Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando'];
        case 'analista':
          return mockAnalistas.map(a => a.nome);
        case 'itemsPerPage':
          return ['10', '25', '50'];
        default:
          return [];
      }
    };

    const options = getOptions();
    if (options.length === 0) {
      return;
    }

    const currentIndex = focusedIndex[dropdownKey as keyof typeof focusedIndex];
    let newIndex = currentIndex;

    if (e.key === 'Tab') {
      e.preventDefault();
      // Fecha o dropdown específico
      setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
      setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
      if (dropdownKey === 'solicitante') {
        setSolicitanteSearch('');
      }

      // Simula o comportamento do Tab para o próximo elemento
      setTimeout(() => {
        const focusableElements = document.querySelectorAll(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const focusableArray = Array.from(focusableElements) as HTMLElement[];
        const trigger = document.querySelector(`[data-dropdown="${dropdownKey}"]`)!;

        if (trigger) {
          const currentIndex = focusableArray.indexOf(trigger);
          if (currentIndex !== -1) {
            const nextIndex = currentIndex < focusableArray.length - 1 ? currentIndex + 1 : 0;
            if (focusableArray[nextIndex]) {
              focusableArray[nextIndex].focus();
            }
          }
        }
      }, 0);
      return;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex === -1) {
        newIndex = 0; // Primeira navegação começa do início
      } else {
        newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : currentIndex; // Para no último
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex === -1) {
        newIndex = options.length - 1; // Primeira navegação começa do final
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex; // Para no primeiro
      }
    } else if (e.key === ' ') {
      // Espaço faz toggle apenas em campos multi-seleção
      e.preventDefault();
      if (currentIndex >= 0 && currentIndex < options.length) {
        const selectedValue = options[currentIndex];
        if (dropdownKey === 'status') {
          // Para status, toggle no checkbox (adiciona/remove da lista)
          handleMultiSelectChange('status', selectedValue);
        } else if (dropdownKey === 'analista') {
          // Para analista, toggle no checkbox (adiciona/remove da lista)
          handleMultiSelectChange('analista', selectedValue);
        }
        return true;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownKey === 'status' || dropdownKey === 'analista') {
        // Para campos multi-seleção, Enter apenas fecha o dropdown
        setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
        setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
        // Retornar foco para o trigger
        setTimeout(() => {
          const trigger = document.querySelector(`[data-dropdown="${dropdownKey}"]`)!;
          if (trigger) {
            trigger.focus();
          }
        }, 0);
        return true;
      } else if (currentIndex >= 0 && currentIndex < options.length) {
        // Para campos de seleção única, Enter seleciona e fecha
        const selectedValue = options[currentIndex];
        if (dropdownKey === 'tipoDemanda') {
          setFilters(prev => ({ ...prev, tipoDemanda: selectedValue }));
          // Fechar dropdown
          setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
          // Reset index
          setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
        } else if (dropdownKey === 'solicitante') {
          setFilters(prev => ({ ...prev, solicitante: selectedValue }));
          // Fechar dropdown
          setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
          // Reset index
          setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
          // Limpar busca
          setSolicitanteSearch('');
          // Retornar foco para o trigger
          setTimeout(() => {
            const trigger = document.querySelector('[data-dropdown="solicitante"]')!;
            if (trigger) {
              trigger.focus();
            }
          }, 0);
        } else if (dropdownKey === 'itemsPerPage') {
          // Para itemsPerPage, seleciona valor e fecha
          setItemsPerPage(Number(selectedValue));
          setCurrentPage(1);
          // Fechar dropdown
          setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
          // Reset index
          setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
        }
        return true; // Indica que foi processado
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
      setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
      return true; // Indica que foi processado
    }

    if (newIndex !== currentIndex) {
      setFocusedIndex(prev => ({ ...prev, [dropdownKey]: newIndex }));

      // Scroll para o item
      setTimeout(() => {
        const dropdown = document.querySelector(`[data-dropdown-list="${dropdownKey}"]`);
        if (dropdown) {
          const items = dropdown.querySelectorAll('[data-option-index]');
          const focusedItem = items[newIndex] as HTMLElement;
          if (focusedItem) {
            focusedItem.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }
        }
      }, 0);
    }

    return false; // Não foi processado completamente
  };

  // Função simples para navegar por teclado (só para dropdowns simples)
  const handleDropdownKeyDown = (e: React.KeyboardEvent, dropdownKey: string) => {
    if (!dropdownOpen[dropdownKey as keyof typeof dropdownOpen]) {
      return;
    }

    // Para tipoDemanda, status, analista e itemsPerPage, usa a navegação simples
    if (
      dropdownKey === 'tipoDemanda' ||
      dropdownKey === 'status' ||
      dropdownKey === 'analista' ||
      dropdownKey === 'itemsPerPage'
    ) {
      handleListNavigation(e, dropdownKey);
    }
    // Para solicitante, não fazemos nada aqui - deixamos o campo de busca lidar
  };

  // Event listener apenas para DatePicker - removido o click outside conflitante
  useEffect(() => {
    // Previne foco indesejado com teclas especiais E bloqueia Enter nos DatePickers
    const handleKeyDown = (event: KeyboardEvent) => {
      // Bloqueia Enter e Space em qualquer lugar que seja um DatePicker
      const target = event.target as HTMLElement;
      const isDatePickerInput =
        target.closest('.react-datepicker-wrapper') ||
        target.closest('.react-datepicker') ||
        target.classList.contains('react-datepicker__input-container');

      if (isDatePickerInput && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }

      // Se nenhum elemento tem foco ou é o body
      if (!document.activeElement || document.activeElement === document.body) {
        // Previne comportamento padrão para Escape e setas quando não há foco
        if (
          event.key === 'Escape' ||
          event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight'
        ) {
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // true = capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div tabIndex={-1} style={{ outline: 'none' }}>
      <div className={styles.pageHeader}>
        <h2>Lista de Demandas</h2>
        <Link to='/demandas/nova' className={styles.btnPrimary}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            fill='currentColor'
            viewBox='0 0 16 16'
          >
            <path d='M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z' />
          </svg>
          Nova Demanda
        </Link>
      </div>
      <div className={styles.filterContainer}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 className={styles.filterTitle}>Filtros</h3>
          <button
            onClick={handleClearFilters}
            disabled={!hasActiveFilters()}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: hasActiveFilters() ? 'pointer' : 'not-allowed',
              color: hasActiveFilters() ? '#666' : '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FilterX size={20} />
          </button>
        </div>
        <div className={styles.filterGrid}>
          {/* Primeira linha */}
          <div className={styles.filterRow1}>
            <div className={styles.formGroup}>
              <label>Número de Referência</label>
              <input
                type='text'
                name='referencia'
                value={filters.referencia}
                onChange={handleFilterChange}
                className={styles.formInput}
                autoComplete='off'
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo de Demanda</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => {
                    toggleDropdown('tipoDemanda');
                    // Reset index quando abre
                    setFocusedIndex(prev => ({ ...prev, tipoDemanda: -1 }));
                  }}
                  tabIndex={0}
                  data-dropdown='tipoDemanda'
                  onKeyDown={e => {
                    if (!dropdownOpen.tipoDemanda) {
                      // Dropdown fechado - Enter/Space abre
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown('tipoDemanda');
                        setFocusedIndex(prev => ({
                          ...prev,
                          tipoDemanda: -1,
                        }));
                      }
                    } else {
                      // Dropdown aberto - delega para handleDropdownKeyDown
                      handleDropdownKeyDown(e, 'tipoDemanda');
                    }
                  }}
                  onBlur={e => {
                    // Verifica se o foco não está indo para dentro do próprio dropdown
                    setTimeout(() => {
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      const currentDropdown = e.currentTarget?.closest(
                        `.${styles.multiSelectContainer}`
                      );

                      if (!relatedTarget || !currentDropdown?.contains(relatedTarget)) {
                        setDropdownOpen(prev => ({
                          ...prev,
                          tipoDemanda: false,
                        }));
                        setFocusedIndex(prev => ({
                          ...prev,
                          tipoDemanda: -1,
                        }));
                      }
                    }, 150); // Aumentar delay para permitir cliques
                  }}
                >
                  <span>{filters.tipoDemanda || ''}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.tipoDemanda ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.tipoDemanda && (
                  <div
                    className={styles.multiSelectDropdown}
                    tabIndex={-1}
                    data-dropdown-list='tipoDemanda'
                  >
                    <label
                      className={`${styles.checkboxLabel} ${focusedIndex.tipoDemanda === 0 ? styles.checkboxLabelFocused : ''}`}
                      data-option-index='0'
                      onClick={() => {
                        setFilters(prev => ({ ...prev, tipoDemanda: '' }));
                        setDropdownOpen(prev => ({
                          ...prev,
                          tipoDemanda: false,
                        }));
                      }}
                    >
                      <span className={styles.checkboxText}>&nbsp;</span>
                    </label>
                    {mockTiposDemandas.map((tipo, index) => (
                      <label
                        key={tipo.id}
                        className={`${styles.checkboxLabel} ${focusedIndex.tipoDemanda === index + 1 ? styles.checkboxLabelFocused : ''}`}
                        data-option-index={index + 1}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          logger.info('🔄 Clicou no tipo:', tipo.nome);
                          setFilters(prev => ({
                            ...prev,
                            tipoDemanda: tipo.nome,
                          }));
                          setDropdownOpen(prev => ({
                            ...prev,
                            tipoDemanda: false,
                          }));
                        }}
                      >
                        <span className={styles.checkboxText}>{tipo.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Solicitante</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => {
                    toggleDropdown('solicitante');
                    // Foca no campo de busca após abrir
                    setTimeout(() => {
                      const searchInput = document.querySelector(
                        '[data-search-input="solicitante"]'
                      )!;
                      if (searchInput) {
                        searchInput.focus();
                      }
                    }, 0);
                  }}
                  tabIndex={0}
                  data-dropdown='solicitante'
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDropdown('solicitante');
                      // Foca no campo de busca após abrir
                      setTimeout(() => {
                        const searchInput = document.querySelector(
                          '[data-search-input="solicitante"]'
                        )!;
                        if (searchInput) {
                          searchInput.focus();
                        }
                      }, 0);
                    }
                  }}
                >
                  <span>{filters.solicitante || ''}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.solicitante ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.solicitante && (
                  <div
                    className={styles.multiSelectDropdown}
                    tabIndex={-1}
                    data-dropdown-list='solicitante'
                  >
                    <div className={styles.searchContainer}>
                      <input
                        type='text'
                        placeholder='Buscar solicitante...'
                        value={solicitanteSearch}
                        onChange={e => setSolicitanteSearch(e.target.value)}
                        className={styles.searchInput}
                        onClick={e => e.stopPropagation()}
                        data-search-input='solicitante'
                        autoComplete='off'
                        onKeyDown={e => {
                          if (e.key === 'Tab') {
                            setDropdownOpen(prev => ({
                              ...prev,
                              solicitante: false,
                            }));
                            setFocusedIndex(prev => ({
                              ...prev,
                              solicitante: -1,
                            }));
                            setSolicitanteSearch('');
                          } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            // Move foco para a lista de opções
                            setFocusedIndex(prev => ({
                              ...prev,
                              solicitante: 0,
                            }));
                            // Foca no container de opções sem remover foco do input
                            setTimeout(() => {
                              const optionsContainer = document.querySelector(
                                '[data-options-list="solicitante"]'
                              )!;
                              if (optionsContainer) {
                                optionsContainer.focus();
                              }
                            }, 0);
                          } else if (e.key === 'Escape') {
                            setDropdownOpen(prev => ({
                              ...prev,
                              solicitante: false,
                            }));
                          }
                        }}
                      />
                    </div>
                    <div
                      className={styles.optionsContainer}
                      tabIndex={0}
                      data-options-list='solicitante'
                      onKeyDown={e => handleListNavigation(e, 'solicitante')}
                    >
                      <label
                        className={`${styles.checkboxLabel} ${focusedIndex.solicitante === 0 ? styles.checkboxLabelFocused : ''}`}
                        data-option-index='0'
                        onClick={() => {
                          setFilters(prev => ({ ...prev, solicitante: '' }));
                          setDropdownOpen(prev => ({
                            ...prev,
                            solicitante: false,
                          }));
                          setSolicitanteSearch('');
                          // Retornar foco para o trigger
                          setTimeout(() => {
                            const trigger = document.querySelector(
                              '[data-dropdown="solicitante"]'
                            )!;
                            if (trigger) {
                              trigger.focus();
                            }
                          }, 0);
                        }}
                      >
                        <span className={styles.checkboxText}>&nbsp;</span>
                      </label>
                      {solicitantesFiltrados.map((solicitante, index) => (
                        <label
                          key={solicitante.id}
                          className={`${styles.checkboxLabel} ${focusedIndex.solicitante === index + 1 ? styles.checkboxLabelFocused : ''}`}
                          data-option-index={index + 1}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              solicitante: solicitante.nome,
                            }));
                            setDropdownOpen(prev => ({
                              ...prev,
                              solicitante: false,
                            }));
                            setSolicitanteSearch('');
                            // Retornar foco para o trigger
                            setTimeout(() => {
                              const trigger = document.querySelector(
                                '[data-dropdown="solicitante"]'
                              )!;
                              if (trigger) {
                                trigger.focus();
                              }
                            }, 0);
                          }}
                        >
                          <span className={styles.checkboxText}>{solicitante.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('status')}
                  tabIndex={0}
                  data-dropdown='status'
                  onKeyDown={e => {
                    if (!dropdownOpen.status) {
                      // Dropdown fechado - Enter/Space abre
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown('status');
                        setFocusedIndex(prev => ({ ...prev, status: -1 }));
                      }
                    } else {
                      // Dropdown aberto - delega para handleDropdownKeyDown
                      handleDropdownKeyDown(e, 'status');
                    }
                  }}
                >
                  <span>{filters.status.length > 0 ? getFilterDisplayText('status') : ''}</span>
                  <span className={styles.dropdownArrow}>{dropdownOpen.status ? '▲' : '▼'}</span>
                </div>
                {dropdownOpen.status && (
                  <div className={styles.multiSelectDropdown} tabIndex={-1}>
                    {['Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando'].map(
                      (status, index) => (
                        <label
                          key={status}
                          className={`${styles.checkboxLabel} ${focusedIndex.status === index ? styles.checkboxLabelFocused : ''}`}
                          data-option-index={index}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <input
                            type='checkbox'
                            checked={filters.status.includes(status)}
                            onChange={() => handleMultiSelectChange('status', status)}
                            onMouseDown={e => e.stopPropagation()}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxText}>{status}</span>
                        </label>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Analista</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('analista')}
                  tabIndex={0}
                  data-dropdown='analista'
                  onKeyDown={e => {
                    if (!dropdownOpen.analista) {
                      // Dropdown fechado - Enter/Space abre
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown('analista');
                        setFocusedIndex(prev => ({ ...prev, analista: -1 }));
                      }
                    } else {
                      // Dropdown aberto - delega para handleDropdownKeyDown
                      handleDropdownKeyDown(e, 'analista');
                    }
                  }}
                >
                  <span>{filters.analista.length > 0 ? getFilterDisplayText('analista') : ''}</span>
                  <span className={styles.dropdownArrow}>{dropdownOpen.analista ? '▲' : '▼'}</span>
                </div>
                {dropdownOpen.analista && (
                  <div className={styles.multiSelectDropdown} tabIndex={-1}>
                    {mockAnalistas.map((analista, index) => (
                      <label
                        key={analista.id}
                        className={`${styles.checkboxLabel} ${focusedIndex.analista === index ? styles.checkboxLabelFocused : ''}`}
                        data-option-index={index}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <input
                          type='checkbox'
                          checked={filters.analista.includes(analista.nome)}
                          onChange={() => handleMultiSelectChange('analista', analista.nome)}
                          onMouseDown={e => e.stopPropagation()}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{analista.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Segunda linha */}
          <div className={styles.filterRow2}>
            <div className={styles.formGroup}>
              <label>Descrição</label>
              <input
                type='text'
                name='descricao'
                value={filters.descricao}
                onChange={handleFilterChange}
                className={styles.formInput}
                autoComplete='off'
              />
            </div>
            <div className={styles.formGroup}>
              <label>Documentos</label>
              <input
                type='text'
                name='documentos'
                value={filters.documentos}
                onChange={handleFilterChange}
                className={styles.formInput}
                autoComplete='off'
              />
            </div>
            <div className={styles.formGroup}>
              <label>Data Inicial</label>
              <div
                className={`${styles.datePickerWrapper} ${filters.periodoInicial[0] ? styles.hasValue : ''}`}
                onKeyDown={e => {
                  // Bloqueia todas as teclas exceto Tab na área do calendário
                  if (e.key !== 'Tab') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
              >
                <DatePicker
                  selectsRange={true}
                  startDate={filters.periodoInicial[0]}
                  endDate={filters.periodoInicial[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilters(prev => ({ ...prev, periodoInicial: update }));
                  }}
                  isClearable={true}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='Selecione o período'
                  className='form-input'
                  locale='pt-BR'
                  onKeyDown={e => {
                    // Permite Tab para navegação, bloqueia Enter especificamente
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent?.stopImmediatePropagation();
                      return false;
                    }
                  }}
                  disabledKeyboardNavigation={true}
                  popperPlacement='bottom-start'
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Data Final</label>
              <div
                className={`${styles.datePickerWrapper} ${filters.periodoFinal[0] ? styles.hasValue : ''}`}
                onKeyDown={e => {
                  // Bloqueia todas as teclas exceto Tab na área do calendário
                  if (e.key !== 'Tab') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
              >
                <DatePicker
                  selectsRange={true}
                  startDate={filters.periodoFinal[0]}
                  endDate={filters.periodoFinal[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilters(prev => ({ ...prev, periodoFinal: update }));
                  }}
                  isClearable={true}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='Selecione o período'
                  className='form-input'
                  locale='pt-BR'
                  onKeyDown={e => {
                    // Permite Tab para navegação, bloqueia Enter especificamente
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent?.stopImmediatePropagation();
                      return false;
                    }
                  }}
                  disabledKeyboardNavigation={true}
                  popperPlacement='bottom-end'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className={styles.resultsCounter}>
        {hasActiveFilters() ? (
          <span>
            <strong>{filteredDemandas.length}</strong>{' '}
            {filteredDemandas.length === 1 ? 'registro encontrado' : 'registros encontrados'} |
            Total: <strong>{demandas.length}</strong>
          </span>
        ) : (
          <span>
            Total de registros: <strong>{demandas.length}</strong>
          </span>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
                onClick={() => handleSort('sged')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  SGED
                  {getSortIcon('sged')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.sortableHeader}`}
                onClick={() => handleSort('tipoDemanda')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Tipo de Demanda
                  {getSortIcon('tipoDemanda')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
                onClick={() => handleSort('autosAdministrativos')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Autos Administrativos
                  {getSortIcon('autosAdministrativos')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.sortableHeader}`}
                onClick={() => handleSort('orgao')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Solicitante
                  {getSortIcon('orgao')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
                onClick={() => handleSort('analista')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Analista
                  {getSortIcon('analista')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
                onClick={() => handleSort('dataInicial')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Data Inicial
                  {getSortIcon('dataInicial')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
                onClick={() => handleSort('dataFinal')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Data Final
                  {getSortIcon('dataFinal')}
                </div>
              </th>
              <th
                className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
                onClick={() => handleSort('status')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((demanda: Demanda) => (
              <tr
                key={demanda.id}
                onClick={() => handleRowClick(demanda.id)}
                className={styles.tableRow}
              >
                <td className={`${styles.tableCell} ${styles.textCenter}`}>{demanda.sged}</td>
                <td className={styles.tableCell}>{demanda.tipoDemanda}</td>
                <td className={`${styles.tableCell} ${styles.textCenter}`}>
                  {demanda.autosAdministrativos}
                </td>
                <td className={styles.tableCell}>{getOrgaoAbreviacao(demanda.orgao)}</td>
                <td className={`${styles.tableCell} ${styles.textCenter}`}>{demanda.analista}</td>
                <td className={`${styles.tableCell} ${styles.textCenter}`}>
                  {formatDateToDDMMYYYY(demanda.dataInicial)}
                </td>
                <td className={`${styles.tableCell} ${styles.textCenter}`}>
                  {formatDateToDDMMYYYYOrPlaceholder(demanda.dataFinal, '-')}
                </td>
                <td className={styles.tableCell}>
                  <StatusBadge status={calculateDemandaStatus(demanda, mockDocumentosDemanda)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.paginationControls}>
        <div className={styles.itemsPerPageSelector}>
          <label>Itens por página:</label>
          <div className={styles.multiSelectContainer}>
            <div
              className={styles.multiSelectTrigger}
              onClick={() => toggleDropdown('itemsPerPage')}
              tabIndex={0}
              data-dropdown='itemsPerPage'
              onKeyDown={e => {
                if (!dropdownOpen.itemsPerPage) {
                  // Dropdown fechado - Enter/Space abre
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDropdown('itemsPerPage');
                    setFocusedIndex(prev => ({ ...prev, itemsPerPage: -1 }));
                  }
                } else {
                  // Dropdown aberto - delega para handleDropdownKeyDown
                  handleDropdownKeyDown(e, 'itemsPerPage');
                }
              }}
              onBlur={e => {
                // Verifica se o foco não está indo para dentro do próprio dropdown
                setTimeout(() => {
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  const currentDropdown = e.currentTarget?.closest(
                    `.${styles.multiSelectContainer}`
                  );

                  if (!relatedTarget || !currentDropdown?.contains(relatedTarget)) {
                    setDropdownOpen(prev => ({
                      ...prev,
                      itemsPerPage: false,
                    }));
                  }
                }, 0);
              }}
            >
              <span>{itemsPerPage}</span>
              <span className={styles.dropdownArrow}>{dropdownOpen.itemsPerPage ? '▲' : '▼'}</span>
            </div>
            {dropdownOpen.itemsPerPage && (
              <div className={styles.multiSelectDropdownUp} tabIndex={-1}>
                {['10', '25', '50'].map((value, index) => (
                  <label
                    key={value}
                    className={`${styles.checkboxLabel} ${focusedIndex.itemsPerPage === index ? styles.checkboxLabelFocused : ''}`}
                    data-option-index={index}
                    onClick={() => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                      setDropdownOpen(prev => ({
                        ...prev,
                        itemsPerPage: false,
                      }));
                    }}
                  >
                    <span className={styles.checkboxText}>{value}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.pageNavigation}>
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            &laquo; Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {currentPage} de {totalPages || 1}
          </span>
          <button onClick={handleNextPage} disabled={currentPage >= totalPages}>
            Próxima &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}
