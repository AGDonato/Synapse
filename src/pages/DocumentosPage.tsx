// src/pages/DocumentosPage.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  type DocumentoDemanda,
  type RetificacaoDocumento,
  type PesquisaDocumento,
  type DestinatarioDocumento,
} from '../data/mockDocumentos';
import { mockTiposDocumentos } from '../data/mockTiposDocumentos';
import { mockAnalistas } from '../data/mockAnalistas';
import { useDemandas } from '../hooks/useDemandas';
import { useDocumentos } from '../contexts/DocumentosContext';
import { FilterX } from 'lucide-react';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import { getEnderecamentoAbreviado } from '../utils/enderecamentoUtils';
import {
  getDocumentStatus,
  getStatusColor,
  getAvailableStatusesByDocumentType,
  shouldEnableStatusFilter,
  type DocumentStatus,
} from '../utils/documentStatusUtils';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DocumentosPage.module.css';

// Tipos para colunas dinâmicas
interface TableColumn {
  key: keyof DocumentoDemanda | 'status' | 'sged';
  label: string;
  sortable: boolean;
  align: 'left' | 'center';
  render?: (documento: DocumentoDemanda) => React.ReactNode;
}

// Função para definir colunas baseadas no tipo de documento selecionado
const getColumnsForDocumentType = (selectedTypes: string[]): TableColumn[] => {
  // Se nenhum tipo específico está selecionado ou múltiplos tipos, mostra colunas padrão
  if (selectedTypes.length === 0 || selectedTypes.length > 1) {
    return [
      { key: 'sged', label: 'SGED', sortable: true, align: 'center' },
      {
        key: 'numeroDocumento',
        label: 'Número',
        sortable: true,
        align: 'center',
      },
      { key: 'tipoDocumento', label: 'Tipo', sortable: true, align: 'left' },
      {
        key: 'assunto',
        label: 'Assunto',
        sortable: true,
        align: 'left',
        render: doc =>
          doc.assunto === 'Outros'
            ? doc.assuntoOutros || doc.assunto
            : doc.assunto,
      },
      {
        key: 'destinatario',
        label: 'Destinatário',
        sortable: true,
        align: 'left',
      },
      { key: 'analista', label: 'Analista', sortable: true, align: 'center' },
      { key: 'status', label: 'Status', sortable: true, align: 'center' },
    ];
  }

  const tipoSelecionado = selectedTypes[0];

  switch (tipoSelecionado) {
    case 'Autos Circunstanciados':
      return [
        { key: 'sged', label: 'SGED', sortable: true, align: 'center' },
        {
          key: 'numeroDocumento',
          label: 'Número',
          sortable: true,
          align: 'center',
        },
        {
          key: 'assunto',
          label: 'Assunto',
          sortable: true,
          align: 'left',
          render: doc =>
            doc.assunto === 'Outros'
              ? doc.assuntoOutros || doc.assunto
              : doc.assunto,
        },
        {
          key: 'enderecamento',
          label: 'Endereçamento',
          sortable: true,
          align: 'left',
        },
        { key: 'analista', label: 'Analista', sortable: true, align: 'center' },
        {
          key: 'dataFinalizacao',
          label: 'Data de Finalização',
          sortable: true,
          align: 'center',
          render: doc =>
            formatDateToDDMMYYYYOrPlaceholder(doc.dataFinalizacao, '-'),
        },
        { key: 'status', label: 'Status', sortable: true, align: 'center' },
      ];

    case 'Mídia':
      return [
        { key: 'sged', label: 'SGED', sortable: true, align: 'center' },
        {
          key: 'numeroDocumento',
          label: 'Número',
          sortable: true,
          align: 'center',
        },
        {
          key: 'enderecamento',
          label: 'Endereçamento',
          sortable: true,
          align: 'left',
        },
        { key: 'analista', label: 'Analista', sortable: true, align: 'center' },
        {
          key: 'tipoMidia',
          label: 'Tipo de Mídia',
          sortable: true,
          align: 'left',
        },
        {
          key: 'tamanhoMidia',
          label: 'Tamanho',
          sortable: true,
          align: 'center',
        },
      ];

    case 'Ofício':
    case 'Ofício Circular':
      return [
        { key: 'sged', label: 'SGED', sortable: true, align: 'center' },
        {
          key: 'numeroDocumento',
          label: 'Número',
          sortable: true,
          align: 'center',
        },
        {
          key: 'assunto',
          label: 'Assunto',
          sortable: true,
          align: 'left',
          render: doc =>
            doc.assunto === 'Outros'
              ? doc.assuntoOutros || doc.assunto
              : doc.assunto,
        },
        {
          key: 'destinatario',
          label: 'Destinatário',
          sortable: true,
          align: 'left',
        },
        { key: 'analista', label: 'Analista', sortable: true, align: 'center' },
        {
          key: 'dataEnvio',
          label: 'Data de Envio',
          sortable: true,
          align: 'center',
          render: doc => formatDateToDDMMYYYYOrPlaceholder(doc.dataEnvio, '-'),
        },
        {
          key: 'dataResposta',
          label: 'Data de Resposta',
          sortable: true,
          align: 'center',
          render: doc =>
            formatDateToDDMMYYYYOrPlaceholder(doc.dataResposta, '-'),
        },
        { key: 'status', label: 'Status', sortable: true, align: 'center' },
      ];

    case 'Relatório de Inteligência':
    case 'Relatório Técnico':
      return [
        { key: 'sged', label: 'SGED', sortable: true, align: 'center' },
        {
          key: 'numeroDocumento',
          label: 'Número',
          sortable: true,
          align: 'center',
        },
        {
          key: 'assunto',
          label: 'Assunto',
          sortable: true,
          align: 'left',
          render: doc =>
            doc.assunto === 'Outros'
              ? doc.assuntoOutros || doc.assunto
              : doc.assunto,
        },
        {
          key: 'enderecamento',
          label: 'Endereçamento',
          sortable: true,
          align: 'left',
        },
        { key: 'analista', label: 'Analista', sortable: true, align: 'center' },
        {
          key: 'dataFinalizacao',
          label: 'Data de Finalização',
          sortable: true,
          align: 'center',
          render: doc =>
            formatDateToDDMMYYYYOrPlaceholder(doc.dataFinalizacao, '-'),
        },
        { key: 'status', label: 'Status', sortable: true, align: 'center' },
      ];

    default:
      // Fallback para tipos não mapeados
      return [
        { key: 'sged', label: 'SGED', sortable: true, align: 'center' },
        {
          key: 'numeroDocumento',
          label: 'Número',
          sortable: true,
          align: 'center',
        },
        { key: 'tipoDocumento', label: 'Tipo', sortable: true, align: 'left' },
        {
          key: 'assunto',
          label: 'Assunto',
          sortable: true,
          align: 'left',
          render: doc =>
            doc.assunto === 'Outros'
              ? doc.assuntoOutros || doc.assunto
              : doc.assunto,
        },
        {
          key: 'destinatario',
          label: 'Destinatário',
          sortable: true,
          align: 'left',
        },
        { key: 'analista', label: 'Analista', sortable: true, align: 'center' },
        { key: 'status', label: 'Status', sortable: true, align: 'center' },
      ];
  }
};

type SortConfig = {
  key: keyof DocumentoDemanda | 'respondido' | 'sged';
  direction: 'asc' | 'desc';
} | null;

registerLocale('pt-BR', ptBR);

const initialFilterState = {
  sged: '',
  numeroDocumento: '',
  tipoDocumento: '',
  enderecamento: '',
  analista: [] as string[],
  respondido: [] as string[],
  identificador: '',
  periodoEnvio: [null, null] as [Date | null, Date | null],
  periodoResposta: [null, null] as [Date | null, Date | null],
};

export default function DocumentosPage() {
  const { demandas } = useDemandas();
  const { documentos } = useDocumentos();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Função para restaurar estado dos filtros da URL
  const getInitialFilters = () => {
    const urlFilters = { ...initialFilterState };

    // Restaurar filtros simples
    if (searchParams.get('sged')) urlFilters.sged = searchParams.get('sged')!;
    if (searchParams.get('numeroDocumento'))
      urlFilters.numeroDocumento = searchParams.get('numeroDocumento')!;
    if (searchParams.get('tipoDocumento'))
      urlFilters.tipoDocumento = searchParams.get('tipoDocumento')!;
    if (searchParams.get('enderecamento'))
      urlFilters.enderecamento = searchParams.get('enderecamento')!;
    if (searchParams.get('identificador'))
      urlFilters.identificador = searchParams.get('identificador')!;

    // Restaurar arrays
    const analistaParam = searchParams.get('analista');
    if (analistaParam) urlFilters.analista = analistaParam.split(',');
    const respondidoParam = searchParams.get('respondido');
    if (respondidoParam) urlFilters.respondido = respondidoParam.split(',');

    // Restaurar datas
    const periodoEnvioParam = searchParams.get('periodoEnvio');
    if (periodoEnvioParam) {
      const [start, end] = periodoEnvioParam.split('|');
      urlFilters.periodoEnvio = [
        start ? new Date(start) : null,
        end ? new Date(end) : null,
      ];
    }
    const periodoRespostaParam = searchParams.get('periodoResposta');
    if (periodoRespostaParam) {
      const [start, end] = periodoRespostaParam.split('|');
      urlFilters.periodoResposta = [
        start ? new Date(start) : null,
        end ? new Date(end) : null,
      ];
    }

    return urlFilters;
  };

  // Função para restaurar ordenação da URL
  const getInitialSort = (): SortConfig => {
    const sortKey = searchParams.get('sortKey');
    const sortDirection = searchParams.get('sortDirection');
    if (sortKey && sortDirection) {
      return {
        key: sortKey as keyof DocumentoDemanda | 'respondido',
        direction: sortDirection as 'asc' | 'desc',
      };
    }
    return null;
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('itemsPerPage') || '10')
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>(getInitialSort);
  const [dropdownOpen, setDropdownOpen] = useState<{
    tipoDocumento: boolean;
    enderecamento: boolean;
    analista: boolean;
    respondido: boolean;
    itemsPerPage: boolean;
  }>({
    tipoDocumento: false,
    enderecamento: false,
    analista: false,
    respondido: false,
    itemsPerPage: false,
  });

  // Estado para controlar item focado em cada dropdown
  const [focusedIndex, setFocusedIndex] = useState<{
    tipoDocumento: number;
    enderecamento: number;
    analista: number;
    respondido: number;
    itemsPerPage: number;
  }>({
    tipoDocumento: -1,
    enderecamento: -1,
    analista: -1,
    respondido: -1,
    itemsPerPage: -1,
  });

  // Ref para acessar o valor mais atual de focusedIndex
  const focusedIndexRef = useRef(focusedIndex);
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  // Cálculo das colunas dinâmicas baseadas no tipo de documento selecionado
  const selectedDocumentTypes = useMemo(() => {
    if (!filters.tipoDocumento) return [];
    return [filters.tipoDocumento];
  }, [filters.tipoDocumento]);

  const tableColumns = useMemo(() => {
    return getColumnsForDocumentType(selectedDocumentTypes);
  }, [selectedDocumentTypes]);

  // Função para buscar o SGED da demanda relacionada ao documento
  const getSgedForDocument = (documento: DocumentoDemanda) => {
    const demandaRelacionada = demandas.find(d => d.id === documento.demandaId);
    return demandaRelacionada ? demandaRelacionada.sged : '-';
  };

  // Função para renderizar o valor de uma célula
  const renderCellValue = (
    documento: DocumentoDemanda,
    column: TableColumn
  ) => {
    if (column.render) {
      return column.render(documento);
    }

    switch (column.key) {
      case 'sged':
        return getSgedForDocument(documento);
      case 'status':
        return getStatusIndicator(documento);
      case 'enderecamento':
        return getEnderecamentoAbreviado(documento.enderecamento);
      default:
        return documento[column.key as keyof DocumentoDemanda];
    }
  };

  const [enderecamentoSearch, setEnderecamentoSearch] = useState('');

  // Função para atualizar a URL com o estado atual
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    // Adicionar página e itens por página
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (itemsPerPage !== 10)
      params.set('itemsPerPage', itemsPerPage.toString());

    // Adicionar ordenação
    if (sortConfig) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDirection', sortConfig.direction);
    }

    // Adicionar filtros simples
    if (filters.sged.trim()) params.set('sged', filters.sged);
    if (filters.numeroDocumento.trim())
      params.set('numeroDocumento', filters.numeroDocumento);
    if (filters.tipoDocumento)
      params.set('tipoDocumento', filters.tipoDocumento);
    if (filters.enderecamento)
      params.set('enderecamento', filters.enderecamento);
    if (filters.identificador.trim())
      params.set('identificador', filters.identificador);

    // Adicionar arrays
    if (filters.analista.length > 0)
      params.set('analista', filters.analista.join(','));
    if (filters.respondido.length > 0)
      params.set('respondido', filters.respondido.join(','));

    // Adicionar datas
    if (filters.periodoEnvio[0] || filters.periodoEnvio[1]) {
      const start = filters.periodoEnvio[0]?.toISOString() || '';
      const end = filters.periodoEnvio[1]?.toISOString() || '';
      params.set('periodoEnvio', `${start}|${end}`);
    }
    if (filters.periodoResposta[0] || filters.periodoResposta[1]) {
      const start = filters.periodoResposta[0]?.toISOString() || '';
      const end = filters.periodoResposta[1]?.toISOString() || '';
      params.set('periodoResposta', `${start}|${end}`);
    }

    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, sortConfig, filters, setSearchParams]);

  // Efeito para atualizar URL sempre que o estado mudar
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Efeito para ajustar filtro de status quando tipo de documento muda
  useEffect(() => {
    const statusesDisponiveis = getAvailableStatusesByDocumentType(
      filters.tipoDocumento
    );

    // Filtrar status atualmente selecionados para manter apenas os compatíveis
    const statusesCompativeis = filters.respondido.filter(status =>
      statusesDisponiveis.includes(status as DocumentStatus)
    );

    // Se houve mudança, atualizar o filtro
    if (statusesCompativeis.length !== filters.respondido.length) {
      setFilters(prev => ({
        ...prev,
        respondido: statusesCompativeis,
      }));
      // Reset para primeira página quando filtros mudam
      setCurrentPage(1);
    }
  }, [filters.tipoDocumento, filters.respondido]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
    setCurrentPage(1);
    setDropdownOpen({
      tipoDocumento: false,
      enderecamento: false,
      analista: false,
      respondido: false,
      itemsPerPage: false,
    });
    setEnderecamentoSearch('');
  };

  // Função para manipular filtros de multiseleção
  const handleMultiSelectChange = (
    filterType: 'analista' | 'respondido',
    value: string
  ) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];

      return { ...prev, [filterType]: newValues };
    });
    setCurrentPage(1);
  };

  // Função para alternar dropdown
  const toggleDropdown = (
    filterType:
      | 'tipoDocumento'
      | 'enderecamento'
      | 'analista'
      | 'respondido'
      | 'itemsPerPage'
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
        tipoDocumento: false,
        enderecamento: false,
        analista: false,
        respondido: false,
        itemsPerPage: false,
        [filterType]: isOpening,
      };
    });
  };

  // Função para obter o texto do filtro baseado na seleção
  const getFilterDisplayText = (filterType: 'analista' | 'respondido') => {
    const selectedItems = filters[filterType];
    const allOptions =
      filterType === 'respondido'
        ? getAvailableStatusesByDocumentType(filters.tipoDocumento)
        : mockAnalistas.map(a => a.nome);

    if (selectedItems.length === 0) {
      return filterType === 'respondido'
        ? 'Selecione status...'
        : 'Selecione analistas...';
    }

    if (selectedItems.length === allOptions.length) {
      return 'Todos';
    }

    if (selectedItems.length === 1) {
      return selectedItems[0];
    }

    return `${selectedItems.length} ${filterType === 'respondido' ? 'status' : 'analistas'}`;
  };

  // Verifica se há filtros aplicados
  const hasActiveFilters = () => {
    return (
      filters.sged.trim() !== '' ||
      filters.numeroDocumento.trim() !== '' ||
      filters.tipoDocumento !== '' ||
      filters.enderecamento.trim() !== '' ||
      filters.analista.length > 0 ||
      filters.respondido.length > 0 ||
      filters.identificador.trim() !== '' ||
      filters.periodoEnvio[0] !== null ||
      filters.periodoResposta[0] !== null
    );
  };

  // Função para lidar com clique no cabeçalho
  const handleSort = useCallback(
    (key: keyof DocumentoDemanda | 'respondido') => {
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
    },
    []
  );

  // Função para renderizar ícone de ordenação
  const getSortIcon = useCallback(
    (key: keyof DocumentoDemanda | 'respondido') => {
      if (!sortConfig || sortConfig.key !== key) {
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{ opacity: 0.3, marginLeft: '4px' }}
          >
            <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
            <path d="M8 15a.5.5 0 0 1-.5-.5V2.707L4.354 5.854a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L8.5 2.707V14.5A.5.5 0 0 1 8 15z" />
          </svg>
        );
      }

      return sortConfig.direction === 'asc' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{ marginLeft: '4px' }}
        >
          <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{ marginLeft: '4px' }}
        >
          <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
        </svg>
      );
    },
    [sortConfig]
  );

  // Obter listas únicas para filtros
  const enderecamentosUnicos = useMemo(() => {
    const todosEnderecamentos = documentos.map(
      (doc: DocumentoDemanda) => doc.enderecamento
    );
    return [...new Set(todosEnderecamentos)].map((enderecamento: string) => ({
      id: enderecamento,
      nome: getEnderecamentoAbreviado(enderecamento),
    }));
  }, [documentos]);

  // Filtrar destinatários baseado na busca
  const enderecamentosFiltrados = useMemo(() => {
    if (!enderecamentoSearch.trim()) return enderecamentosUnicos;
    return enderecamentosUnicos.filter(d =>
      d.nome.toLowerCase().includes(enderecamentoSearch.toLowerCase())
    );
  }, [enderecamentosUnicos, enderecamentoSearch]);

  // Função para obter demanda por documento
  const getDemandaByDocument = useCallback(
    (documento: DocumentoDemanda) => {
      return demandas.find(d => d.id === documento.demandaId);
    },
    [demandas]
  );

  // Função para calcular status baseado no tipo e datas (usando utility)
  const getDocumentStatusText = useCallback(
    (documento: DocumentoDemanda): string => {
      return getDocumentStatus(documento);
    },
    []
  );

  // Dados filtrados
  const filteredDocumentos = useMemo(() => {
    const [dtEnvioDe, dtEnvioAte] = filters.periodoEnvio;
    const [dtRespostaDe, dtRespostaAte] = filters.periodoResposta;

    return documentos.filter(documento => {
      const demanda = getDemandaByDocument(documento);

      // Filtro por SGED (baseado na demanda)
      if (
        filters.sged &&
        (!demanda ||
          !demanda.sged.toLowerCase().includes(filters.sged.toLowerCase()))
      ) {
        return false;
      }

      // Filtro por número do documento (busca em numeroDocumento e numeroAtena)
      if (filters.numeroDocumento) {
        const searchTerm = filters.numeroDocumento.toLowerCase();
        const foundInNumero = documento.numeroDocumento
          .toLowerCase()
          .includes(searchTerm);
        const foundInAtena =
          documento.numeroAtena &&
          documento.numeroAtena.toLowerCase().includes(searchTerm);

        if (!foundInNumero && !foundInAtena) {
          return false;
        }
      }

      // Filtro por tipo de documento
      if (
        filters.tipoDocumento &&
        documento.tipoDocumento !== filters.tipoDocumento
      ) {
        return false;
      }

      // Filtro por endereçamento
      if (
        filters.enderecamento &&
        documento.enderecamento !== filters.enderecamento
      ) {
        return false;
      }

      // Filtro por analista (baseado no documento)
      if (
        filters.analista.length > 0 &&
        !filters.analista.includes(documento.analista)
      ) {
        return false;
      }

      // Filtro por identificador (busca dentro das pesquisas do documento e hash de mídia)
      if (filters.identificador) {
        const searchTerm = filters.identificador.toLowerCase();
        let found = false;

        // 1. Busca no hash da mídia se for documento tipo Mídia
        if (
          documento.tipoDocumento === 'Mídia' &&
          documento.hashMidia &&
          documento.hashMidia.toLowerCase().includes(searchTerm)
        ) {
          found = true;
        }

        // 2. Busca nas pesquisas do documento (identificador e complementar)
        if (!found && documento.pesquisas) {
          const hasMatchingPesquisa = documento.pesquisas.some(pesquisa => {
            // Busca no identificador (CPF, CNPJ, telefone, etc.)
            if (
              pesquisa.identificador &&
              pesquisa.identificador.toLowerCase().includes(searchTerm)
            ) {
              return true;
            }
            // Busca no complementar se existir
            if (
              pesquisa.complementar &&
              pesquisa.complementar.toLowerCase().includes(searchTerm)
            ) {
              return true;
            }
            return false;
          });
          if (hasMatchingPesquisa) found = true;
        }

        // 3. Busca indireta: Para Ofícios, verificar hash das mídias vinculadas
        if (
          !found &&
          (documento.tipoDocumento === 'Ofício' ||
            documento.tipoDocumento === 'Ofício Circular')
        ) {
          if (documento.selectedMidias && documento.selectedMidias.length > 0) {
            const hasMatchingMidiaHash = documento.selectedMidias.some(
              midiaId => {
                const midia = documentos.find(
                  d =>
                    d.id.toString() === midiaId && d.tipoDocumento === 'Mídia'
                );
                return (
                  midia &&
                  midia.hashMidia &&
                  midia.hashMidia.toLowerCase().includes(searchTerm)
                );
              }
            );
            if (hasMatchingMidiaHash) found = true;
          }
        }

        // Se não encontrou em nenhum lugar, filtrar documento
        if (!found) {
          return false;
        }
      }

      // Filtro por status baseado no tipo de documento
      if (filters.respondido.length > 0) {
        const statusTexto = getDocumentStatusText(documento);
        if (!filters.respondido.includes(statusTexto)) {
          return false;
        }
      }

      // Filtro por período de envio
      if (dtEnvioDe || dtEnvioAte) {
        if (!documento.dataEnvio) {
          // Se filtro de data envio está ativo mas o documento não tem data de envio, não mostrar
          return false;
        }

        // As datas estão no formato DD/MM/YYYY
        const [diaEnvio, mesEnvio, anoEnvio] = documento.dataEnvio
          .split('/')
          .map(Number);
        const dataEnvioDoc = new Date(anoEnvio, mesEnvio - 1, diaEnvio);
        dataEnvioDoc.setHours(12, 0, 0, 0); // Normaliza para meio-dia para evitar problemas de timezone

        if (dtEnvioDe) {
          const inicioPeriodo = new Date(dtEnvioDe);
          inicioPeriodo.setHours(0, 0, 0, 0);
          if (dataEnvioDoc < inicioPeriodo) return false;
        }
        if (dtEnvioAte) {
          const fimPeriodo = new Date(dtEnvioAte);
          fimPeriodo.setHours(23, 59, 59, 999);
          if (dataEnvioDoc > fimPeriodo) return false;
        }
      }

      // Filtro por período de resposta/finalização combinado
      if (dtRespostaDe || dtRespostaAte) {
        let dataParaComparar: string | null = null;

        // Se nenhum tipo de documento específico está selecionado
        if (!filters.tipoDocumento || filters.tipoDocumento === '') {
          // Busca tanto dataResposta quanto dataFinalizacao
          dataParaComparar =
            documento.dataResposta || documento.dataFinalizacao;
        } else {
          // Com tipo específico selecionado, usar lógica baseada no tipo do documento
          const tipoDocLowerCase = filters.tipoDocumento.toLowerCase();

          // Documentos de comunicação (Ofícios) - usar dataResposta
          if (tipoDocLowerCase.includes('ofício')) {
            dataParaComparar = documento.dataResposta;
          }
          // Documentos de produção (Relatórios, Autos) - usar dataFinalizacao
          else if (
            tipoDocLowerCase.includes('relatório') ||
            tipoDocLowerCase.includes('autos circunstanciados')
          ) {
            dataParaComparar = documento.dataFinalizacao;
          }
          // Mídia - não tem data para filtrar
          else if (tipoDocLowerCase.includes('mídia')) {
            dataParaComparar = null;
          }
          // Fallback para outros tipos
          else {
            dataParaComparar =
              documento.dataResposta || documento.dataFinalizacao;
          }
        }

        // Se não tem data válida para comparar, não mostrar o documento
        if (!dataParaComparar) {
          return false;
        }

        // As datas estão no formato DD/MM/YYYY
        const [dia, mes, ano] = dataParaComparar.split('/').map(Number);
        const dataDoc = new Date(ano, mes - 1, dia);
        dataDoc.setHours(12, 0, 0, 0); // Normaliza para meio-dia para evitar problemas de timezone

        if (dtRespostaDe) {
          const inicioPeriodo = new Date(dtRespostaDe);
          inicioPeriodo.setHours(0, 0, 0, 0);
          if (dataDoc < inicioPeriodo) return false;
        }
        if (dtRespostaAte) {
          const fimPeriodo = new Date(dtRespostaAte);
          fimPeriodo.setHours(23, 59, 59, 999);
          if (dataDoc > fimPeriodo) return false;
        }
      }

      return true;
    });
  }, [documentos, filters, getDemandaByDocument, getDocumentStatus]);

  // Dados ordenados
  const sortedDocumentos = useMemo(() => {
    if (!sortConfig) {
      return filteredDocumentos;
    }

    return [...filteredDocumentos].sort((a, b) => {
      let aValue:
        | string
        | number
        | boolean
        | string[]
        | RetificacaoDocumento[]
        | PesquisaDocumento[]
        | DestinatarioDocumento[]
        | null
        | undefined;
      let bValue:
        | string
        | number
        | boolean
        | string[]
        | RetificacaoDocumento[]
        | PesquisaDocumento[]
        | DestinatarioDocumento[]
        | null
        | undefined;

      if (sortConfig.key === 'respondido') {
        // Ordenação especial para status com prioridade lógica
        const statusOrder = {
          'Não Enviado': 1,
          'Em Produção': 2,
          Pendente: 3,
          Encaminhado: 4,
          Respondido: 5,
          Finalizado: 6,
          'Sem Status': 7,
        };

        const aStatus = getDocumentStatus(a);
        const bStatus = getDocumentStatus(b);
        aValue = statusOrder[aStatus as keyof typeof statusOrder] || 999;
        bValue = statusOrder[bStatus as keyof typeof statusOrder] || 999;
      } else if (sortConfig.key === 'sged') {
        // Ordenação especial para SGED (buscando da demanda relacionada)
        aValue = getSgedForDocument(a);
        bValue = getSgedForDocument(b);
      } else {
        aValue = a[sortConfig.key as keyof DocumentoDemanda];
        bValue = b[sortConfig.key as keyof DocumentoDemanda];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      // Comparação para arrays (não ordena, mantém ordem original)
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        comparison = aValue.length - bValue.length;
      }
      // Comparação para booleans
      else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
      }
      // Comparação para números
      else if (typeof aValue === 'number' && typeof bValue === 'number') {
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
  }, [filteredDocumentos, sortConfig]);

  const totalPages = Math.ceil(sortedDocumentos.length / itemsPerPage);

  // Reset da página quando fica fora do range válido devido a filtros
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDocumentos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

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

  const handleRowClick = (documentoId: number) => {
    // Preservar estado atual na URL de destino
    const currentParams = new URLSearchParams();

    // Adicionar todos os parâmetros atuais
    if (currentPage !== 1) currentParams.set('page', currentPage.toString());
    if (itemsPerPage !== 10)
      currentParams.set('itemsPerPage', itemsPerPage.toString());
    if (sortConfig) {
      currentParams.set('sortKey', sortConfig.key);
      currentParams.set('sortDirection', sortConfig.direction);
    }
    if (filters.sged.trim()) currentParams.set('sged', filters.sged);
    if (filters.numeroDocumento.trim())
      currentParams.set('numeroDocumento', filters.numeroDocumento);
    if (filters.tipoDocumento)
      currentParams.set('tipoDocumento', filters.tipoDocumento);
    if (filters.enderecamento)
      currentParams.set('enderecamento', filters.enderecamento);
    if (filters.identificador.trim())
      currentParams.set('identificador', filters.identificador);
    if (filters.analista.length > 0)
      currentParams.set('analista', filters.analista.join(','));
    if (filters.respondido.length > 0)
      currentParams.set('respondido', filters.respondido.join(','));
    if (filters.periodoEnvio[0] || filters.periodoEnvio[1]) {
      const start = filters.periodoEnvio[0]?.toISOString() || '';
      const end = filters.periodoEnvio[1]?.toISOString() || '';
      currentParams.set('periodoEnvio', `${start}|${end}`);
    }
    if (filters.periodoResposta[0] || filters.periodoResposta[1]) {
      const start = filters.periodoResposta[0]?.toISOString() || '';
      const end = filters.periodoResposta[1]?.toISOString() || '';
      currentParams.set('periodoResposta', `${start}|${end}`);
    }

    const queryString = currentParams.toString();
    const url = queryString
      ? `/documentos/${documentoId}?returnTo=list&${queryString}`
      : `/documentos/${documentoId}?returnTo=list`;
    navigate(url);
  };

  // Função para navegar na lista de opções (usado quando já está navegando)
  const handleListNavigation = (
    e: React.KeyboardEvent,
    dropdownKey: string
  ) => {
    const getOptions = () => {
      switch (dropdownKey) {
        case 'tipoDocumento':
          return ['', ...mockTiposDocumentos.map(t => t.nome)];
        case 'enderecamento':
          return ['', ...enderecamentosFiltrados.map(e => e.nome)];
        case 'analista':
          return mockAnalistas.map(a => a.nome);
        case 'respondido':
          return getAvailableStatusesByDocumentType(filters.tipoDocumento);
        case 'itemsPerPage':
          return ['10', '25', '50'];
        default:
          return [];
      }
    };

    const options = getOptions();
    if (options.length === 0) return;

    const currentIndex = focusedIndex[dropdownKey as keyof typeof focusedIndex];
    let newIndex = currentIndex;

    if (e.key === 'Tab') {
      e.preventDefault();
      // Fecha o dropdown específico
      setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
      setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
      if (dropdownKey === 'enderecamento') {
        setEnderecamentoSearch('');
      }

      // Simula o comportamento do Tab para o próximo elemento
      setTimeout(() => {
        const focusableElements = document.querySelectorAll(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const focusableArray = Array.from(focusableElements) as HTMLElement[];
        const trigger = document.querySelector(
          `[data-dropdown="${dropdownKey}"]`
        ) as HTMLElement;

        if (trigger) {
          const currentIndex = focusableArray.indexOf(trigger);
          if (currentIndex !== -1) {
            const nextIndex =
              currentIndex < focusableArray.length - 1 ? currentIndex + 1 : 0;
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
        newIndex =
          currentIndex < options.length - 1 ? currentIndex + 1 : currentIndex; // Para no último
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex === -1) {
        newIndex = options.length - 1; // Primeira navegação começa do final
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex; // Para no primeiro
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (currentIndex >= 0 && currentIndex < options.length) {
        // Selecionar opção
        const selectedValue = options[currentIndex];
        if (dropdownKey === 'tipoDocumento') {
          setFilters(prev => ({ ...prev, tipoDocumento: selectedValue }));
          // Fechar dropdown
          setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
          // Reset index
          setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
        } else if (dropdownKey === 'enderecamento') {
          // Para endereçamento, precisamos encontrar o ID baseado no nome
          const enderecamentoItem = enderecamentosFiltrados.find(
            e => e.nome === selectedValue
          );
          const enderecamentoId = enderecamentoItem
            ? enderecamentoItem.id
            : selectedValue;
          setFilters(prev => ({ ...prev, enderecamento: enderecamentoId }));
          // Fechar dropdown
          setDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }));
          // Reset index
          setFocusedIndex(prev => ({ ...prev, [dropdownKey]: -1 }));
          // Limpar busca
          setEnderecamentoSearch('');
        } else if (dropdownKey === 'analista') {
          // Para analista, toggle no checkbox (adiciona/remove da lista)
          handleMultiSelectChange('analista', selectedValue);
        } else if (dropdownKey === 'respondido') {
          // Para respondido, toggle no checkbox (adiciona/remove da lista)
          handleMultiSelectChange('respondido', selectedValue);
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
        const dropdown = document.querySelector(
          `[data-dropdown-list="${dropdownKey}"]`
        );
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
  const handleDropdownKeyDown = (
    e: React.KeyboardEvent,
    dropdownKey: string
  ) => {
    if (!dropdownOpen[dropdownKey as keyof typeof dropdownOpen]) {
      return;
    }

    // Para tipoDocumento, analista, respondido e itemsPerPage, usa a navegação simples
    if (
      dropdownKey === 'tipoDocumento' ||
      dropdownKey === 'analista' ||
      dropdownKey === 'respondido' ||
      dropdownKey === 'itemsPerPage'
    ) {
      handleListNavigation(e, dropdownKey);
    }
    // Para enderecamento, não fazemos nada aqui - deixamos o campo de busca lidar
  };

  const getStatusIndicator = (documento: DocumentoDemanda) => {
    const status = getDocumentStatusText(documento);

    // Se não tem status, retorna vazio (sem indicador)
    if (status === 'Sem Status') {
      return null;
    }

    const backgroundColor = getStatusColor(status as DocumentStatus);

    return (
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor,
          borderRadius: '50%',
          margin: '0 auto',
        }}
        title={status}
      />
    );
  };

  // Event listener para fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Verifica se o clique foi dentro de um dropdown multiselect ou seus elementos
      const isInsideMultiSelect = target.closest(
        `.${styles.multiSelectContainer}`
      );

      // Só fecha se não está dentro do container
      if (!isInsideMultiSelect) {
        setDropdownOpen({
          tipoDocumento: false,
          enderecamento: false,
          analista: false,
          respondido: false,
          itemsPerPage: false,
        });
        setEnderecamentoSearch('');
      }
    };

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

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown, true); // true = capture phase
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div tabIndex={-1} style={{ outline: 'none' }}>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h2>Lista de Documentos</h2>
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
              {/* SGED */}
              <div className={styles.formGroup}>
                <label>SGED</label>
                <input
                  type="text"
                  name="sged"
                  value={filters.sged}
                  onChange={handleFilterChange}
                  className={styles.formInput}
                  autoComplete="off"
                />
              </div>

              {/* Número do Documento */}
              <div className={styles.formGroup}>
                <label>Número do Documento</label>
                <input
                  type="text"
                  name="numeroDocumento"
                  value={filters.numeroDocumento}
                  onChange={handleFilterChange}
                  className={styles.formInput}
                  autoComplete="off"
                />
              </div>

              {/* Tipo de Documento */}
              <div className={styles.formGroup}>
                <label>Tipo de Documento</label>
                <div className={styles.multiSelectContainer}>
                  <div
                    className={styles.multiSelectTrigger}
                    onClick={() => {
                      toggleDropdown('tipoDocumento');
                      // Reset index quando abre
                      setFocusedIndex(prev => ({
                        ...prev,
                        tipoDocumento: -1,
                      }));
                    }}
                    tabIndex={0}
                    data-dropdown="tipoDocumento"
                    onKeyDown={e => {
                      if (!dropdownOpen.tipoDocumento) {
                        // Dropdown fechado - Enter/Space abre
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDropdown('tipoDocumento');
                          setFocusedIndex(prev => ({
                            ...prev,
                            tipoDocumento: -1,
                          }));
                        }
                      } else {
                        // Dropdown aberto - delega para handleDropdownKeyDown
                        handleDropdownKeyDown(e, 'tipoDocumento');
                      }
                    }}
                  >
                    <span>{filters.tipoDocumento || ''}</span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen.tipoDocumento ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen.tipoDocumento && (
                    <div
                      className={styles.multiSelectDropdown}
                      tabIndex={-1}
                      data-dropdown-list="tipoDocumento"
                    >
                      <label
                        className={`${styles.checkboxLabel} ${focusedIndex.tipoDocumento === 0 ? styles.checkboxLabelFocused : ''}`}
                        data-option-index="0"
                        onClick={e => {
                          e.stopPropagation();
                          setFilters(prev => ({
                            ...prev,
                            tipoDocumento: '',
                          }));
                          setDropdownOpen(prev => ({
                            ...prev,
                            tipoDocumento: false,
                          }));
                        }}
                      >
                        <span className={styles.checkboxText}>&nbsp;</span>
                      </label>
                      {mockTiposDocumentos.map((tipo, index) => (
                        <label
                          key={tipo.id}
                          className={`${styles.checkboxLabel} ${focusedIndex.tipoDocumento === index + 1 ? styles.checkboxLabelFocused : ''}`}
                          data-option-index={index + 1}
                          onClick={e => {
                            e.stopPropagation();
                            setFilters(prev => {
                              const newFilters = {
                                ...prev,
                                tipoDocumento: tipo.nome,
                              };

                              // Limpar Data de Envio se o tipo selecionado bloqueia esse campo
                              if (
                                tipo.nome === 'Autos Circunstanciados' ||
                                tipo.nome === 'Relatório de Inteligência' ||
                                tipo.nome === 'Relatório Técnico' ||
                                tipo.nome === 'Mídia'
                              ) {
                                newFilters.periodoEnvio = [null, null];
                              }

                              // Limpar Data de Resposta/Finalização se for Mídia
                              if (tipo.nome === 'Mídia') {
                                newFilters.periodoResposta = [null, null];
                              }

                              // Limpar Identificador se for um dos tipos que não suportam pesquisa
                              if (
                                tipo.nome === 'Autos Circunstanciados' ||
                                tipo.nome === 'Relatório de Inteligência' ||
                                tipo.nome === 'Relatório Técnico'
                              ) {
                                newFilters.identificador = '';
                              }

                              return newFilters;
                            });
                            setDropdownOpen(prev => ({
                              ...prev,
                              tipoDocumento: false,
                            }));
                          }}
                        >
                          <span className={styles.checkboxText}>
                            {tipo.nome}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Endereçamento com busca */}
              <div className={styles.formGroup}>
                <label>Endereçamento</label>
                <div className={styles.multiSelectContainer}>
                  <div
                    className={styles.multiSelectTrigger}
                    onClick={() => {
                      toggleDropdown('enderecamento');
                      // Foca no campo de busca após abrir
                      setTimeout(() => {
                        const searchInput = document.querySelector(
                          '[data-search-input="enderecamento"]'
                        ) as HTMLInputElement;
                        if (searchInput) {
                          searchInput.focus();
                        }
                      }, 0);
                    }}
                    tabIndex={0}
                    data-dropdown="enderecamento"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown('enderecamento');
                        // Foca no campo de busca após abrir
                        setTimeout(() => {
                          const searchInput = document.querySelector(
                            '[data-search-input="enderecamento"]'
                          ) as HTMLInputElement;
                          if (searchInput) {
                            searchInput.focus();
                          }
                        }, 0);
                      }
                    }}
                  >
                    <span>
                      {filters.enderecamento
                        ? getEnderecamentoAbreviado(filters.enderecamento)
                        : ''}
                    </span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen.enderecamento ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen.enderecamento && (
                    <div
                      className={styles.multiSelectDropdown}
                      tabIndex={-1}
                      data-dropdown-list="enderecamento"
                    >
                      <div className={styles.searchContainer}>
                        <input
                          type="text"
                          placeholder="Buscar endereçamento..."
                          value={enderecamentoSearch}
                          onChange={e => setEnderecamentoSearch(e.target.value)}
                          className={styles.searchInput}
                          onClick={e => e.stopPropagation()}
                          data-search-input="enderecamento"
                          autoComplete="off"
                          onKeyDown={e => {
                            if (e.key === 'Tab') {
                              setDropdownOpen(prev => ({
                                ...prev,
                                enderecamento: false,
                              }));
                              setFocusedIndex(prev => ({
                                ...prev,
                                enderecamento: -1,
                              }));
                              setEnderecamentoSearch('');
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              // Move foco para a lista de opções
                              setFocusedIndex(prev => ({
                                ...prev,
                                enderecamento: 0,
                              }));
                              // Remove foco do input e foca no container de opções
                              (e.target as HTMLInputElement).blur();
                              setTimeout(() => {
                                const optionsContainer = document.querySelector(
                                  '[data-options-list="enderecamento"]'
                                ) as HTMLElement;
                                if (optionsContainer) {
                                  optionsContainer.focus();
                                }
                              }, 0);
                            } else if (e.key === 'Escape') {
                              setDropdownOpen(prev => ({
                                ...prev,
                                enderecamento: false,
                              }));
                            }
                          }}
                        />
                      </div>
                      <div
                        className={styles.optionsContainer}
                        tabIndex={0}
                        data-options-list="enderecamento"
                        onKeyDown={e =>
                          handleListNavigation(e, 'enderecamento')
                        }
                        style={{ outline: 'none' }}
                      >
                        <label
                          className={`${styles.checkboxLabel} ${focusedIndex.enderecamento === 0 ? styles.checkboxLabelFocused : ''}`}
                          data-option-index="0"
                          onClick={e => {
                            e.stopPropagation();
                            setFilters(prev => ({
                              ...prev,
                              enderecamento: '',
                            }));
                            setDropdownOpen(prev => ({
                              ...prev,
                              enderecamento: false,
                            }));
                            setEnderecamentoSearch('');
                          }}
                        >
                          <span className={styles.checkboxText}>&nbsp;</span>
                        </label>
                        {enderecamentosFiltrados.map((enderecamento, index) => (
                          <label
                            key={enderecamento.id}
                            className={`${styles.checkboxLabel} ${focusedIndex.enderecamento === index + 1 ? styles.checkboxLabelFocused : ''}`}
                            data-option-index={index + 1}
                            onClick={e => {
                              e.stopPropagation();
                              setFilters(prev => ({
                                ...prev,
                                enderecamento: enderecamento.id,
                              }));
                              setDropdownOpen(prev => ({
                                ...prev,
                                enderecamento: false,
                              }));
                              setEnderecamentoSearch('');
                            }}
                          >
                            <span className={styles.checkboxText}>
                              {enderecamento.nome}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analista */}
              <div className={styles.formGroup}>
                <label>Analista</label>
                <div className={styles.multiSelectContainer}>
                  <div
                    className={styles.multiSelectTrigger}
                    onClick={() => toggleDropdown('analista')}
                    tabIndex={0}
                    data-dropdown="analista"
                    onKeyDown={e => {
                      if (!dropdownOpen.analista) {
                        // Dropdown fechado - Enter/Space abre
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDropdown('analista');
                          setFocusedIndex(prev => ({
                            ...prev,
                            analista: -1,
                          }));
                        }
                      } else {
                        // Dropdown aberto - delega para handleDropdownKeyDown
                        handleDropdownKeyDown(e, 'analista');
                      }
                    }}
                  >
                    <span>
                      {filters.analista.length > 0
                        ? getFilterDisplayText('analista')
                        : ''}
                    </span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen.analista ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen.analista && (
                    <div
                      className={styles.multiSelectDropdown}
                      tabIndex={-1}
                      data-dropdown-list="analista"
                    >
                      {mockAnalistas.map((analista, index) => {
                        const isSelected = filters.analista.includes(
                          analista.nome
                        );
                        return (
                          <div
                            key={analista.id}
                            className={`${styles.checkboxLabel} ${focusedIndex.analista === index ? styles.checkboxLabelFocused : ''}`}
                            data-option-index={index}
                            onMouseDown={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMultiSelectChange(
                                'analista',
                                analista.nome
                              );
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className={styles.checkbox}
                            />
                            <span className={styles.checkboxText}>
                              {analista.nome}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Segunda linha */}
            <div className={styles.filterRow2}>
              <div className={styles.formGroup}>
                <label>
                  {filters.tipoDocumento === 'Mídia'
                    ? 'Hash'
                    : 'Identificador/Hash'}
                </label>
                <input
                  type="text"
                  name="identificador"
                  value={filters.identificador}
                  onChange={handleFilterChange}
                  className={styles.formInput}
                  autoComplete="off"
                  disabled={
                    filters.tipoDocumento === 'Autos Circunstanciados' ||
                    filters.tipoDocumento === 'Relatório de Inteligência' ||
                    filters.tipoDocumento === 'Relatório Técnico'
                  }
                />
              </div>

              {/* Status */}
              <div className={styles.formGroup}>
                <label>Status</label>
                <div className={styles.multiSelectContainer}>
                  <div
                    className={`${styles.multiSelectTrigger} ${
                      !shouldEnableStatusFilter(filters.tipoDocumento)
                        ? styles.disabled
                        : ''
                    }`}
                    onClick={() => {
                      if (shouldEnableStatusFilter(filters.tipoDocumento)) {
                        toggleDropdown('respondido');
                      }
                    }}
                    tabIndex={
                      shouldEnableStatusFilter(filters.tipoDocumento) ? 0 : -1
                    }
                    data-dropdown="respondido"
                    onKeyDown={e => {
                      if (!shouldEnableStatusFilter(filters.tipoDocumento))
                        return;

                      if (!dropdownOpen.respondido) {
                        // Dropdown fechado - Enter/Space abre
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDropdown('respondido');
                          setFocusedIndex(prev => ({
                            ...prev,
                            respondido: -1,
                          }));
                        }
                      } else {
                        // Dropdown aberto - delega para handleDropdownKeyDown
                        handleDropdownKeyDown(e, 'respondido');
                      }
                    }}
                  >
                    <span>
                      {filters.respondido.length > 0
                        ? getFilterDisplayText('respondido')
                        : ''}
                    </span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen.respondido ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen.respondido && (
                    <div
                      className={styles.multiSelectDropdown}
                      tabIndex={-1}
                      data-dropdown-list="respondido"
                    >
                      {getAvailableStatusesByDocumentType(
                        filters.tipoDocumento
                      ).map((status, index) => {
                        const isSelected = filters.respondido.includes(status);
                        return (
                          <div
                            key={status}
                            className={`${styles.checkboxLabel} ${focusedIndex.respondido === index ? styles.checkboxLabelFocused : ''}`}
                            data-option-index={index}
                            onMouseDown={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMultiSelectChange('respondido', status);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className={styles.checkbox}
                            />
                            <span className={styles.checkboxText}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Data de Envio</label>
                <div
                  className={`${styles.datePickerWrapper} ${filters.periodoEnvio[0] ? styles.hasValue : ''} ${
                    filters.tipoDocumento === 'Autos Circunstanciados' ||
                    filters.tipoDocumento === 'Relatório de Inteligência' ||
                    filters.tipoDocumento === 'Relatório Técnico' ||
                    filters.tipoDocumento === 'Mídia'
                      ? styles.disabled
                      : ''
                  }`}
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
                    startDate={filters.periodoEnvio[0]}
                    endDate={filters.periodoEnvio[1]}
                    onChange={(update: [Date | null, Date | null]) => {
                      setFilters(prev => ({ ...prev, periodoEnvio: update }));
                    }}
                    isClearable={true}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecione o período"
                    className="form-input"
                    locale="pt-BR"
                    onKeyDown={e => {
                      // Permite Tab para navegação, bloqueia Enter especificamente
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent?.stopImmediatePropagation();
                        return false;
                      }
                    }}
                    disabled={
                      // Desabilita para Autos Circunstanciados, Relatórios e Mídia
                      filters.tipoDocumento === 'Autos Circunstanciados' ||
                      filters.tipoDocumento === 'Relatório de Inteligência' ||
                      filters.tipoDocumento === 'Relatório Técnico' ||
                      filters.tipoDocumento === 'Mídia'
                    }
                    disabledKeyboardNavigation={true}
                    popperPlacement="bottom-start"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  {/* Label dinâmico baseado no tipo de documento */}
                  {filters.tipoDocumento === 'Ofício' ||
                  filters.tipoDocumento === 'Ofício Circular'
                    ? 'Data de Resposta'
                    : filters.tipoDocumento === 'Autos Circunstanciados' ||
                        filters.tipoDocumento === 'Relatório de Inteligência' ||
                        filters.tipoDocumento === 'Relatório Técnico'
                      ? 'Data de Finalização'
                      : 'Data de Resposta/Finalização'}
                </label>
                <div
                  className={`${styles.datePickerWrapper} ${filters.periodoResposta[0] ? styles.hasValue : ''} ${
                    filters.tipoDocumento === 'Mídia' ? styles.disabled : ''
                  }`}
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
                    startDate={filters.periodoResposta[0]}
                    endDate={filters.periodoResposta[1]}
                    onChange={(update: [Date | null, Date | null]) => {
                      setFilters(prev => ({
                        ...prev,
                        periodoResposta: update,
                      }));
                    }}
                    isClearable={true}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecione o período"
                    className="form-input"
                    locale="pt-BR"
                    onKeyDown={e => {
                      // Permite Tab para navegação, bloqueia Enter especificamente
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent?.stopImmediatePropagation();
                        return false;
                      }
                    }}
                    disabled={
                      // Desabilita apenas para Mídia
                      filters.tipoDocumento === 'Mídia'
                    }
                    disabledKeyboardNavigation={true}
                    popperPlacement="bottom-end"
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
              <strong>{filteredDocumentos.length}</strong>{' '}
              {filteredDocumentos.length === 1
                ? 'registro encontrado'
                : 'registros encontrados'}{' '}
              | Total: <strong>{documentos.length}</strong>
            </span>
          ) : (
            <span>
              Total de registros: <strong>{documentos.length}</strong>
            </span>
          )}
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {tableColumns.map(column => (
                  <th
                    key={column.key}
                    className={`${
                      styles.tableHeader
                    } ${column.align === 'center' ? styles.textCenter : ''} ${
                      column.sortable ? styles.sortableHeader : ''
                    }`}
                    onClick={
                      column.sortable
                        ? () =>
                            handleSort(
                              column.key === 'status'
                                ? 'respondido'
                                : column.key === 'sged'
                                  ? 'sged'
                                  : column.key
                            )
                        : undefined
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          column.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      {column.label}
                      {column.sortable &&
                        getSortIcon(
                          column.key === 'status'
                            ? 'respondido'
                            : column.key === 'sged'
                              ? 'sged'
                              : column.key
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map(documento => (
                <tr
                  key={documento.id}
                  onClick={() => handleRowClick(documento.id)}
                  className={styles.tableRow}
                >
                  {tableColumns.map(column => (
                    <td
                      key={column.key}
                      className={`${
                        styles.tableCell
                      } ${column.align === 'center' ? styles.textCenter : ''}`}
                    >
                      {renderCellValue(documento, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentItems.length === 0 && (
          <div className={styles.noResults}>
            {hasActiveFilters()
              ? 'Nenhum documento encontrado com os filtros aplicados'
              : 'Nenhum documento encontrado'}
          </div>
        )}

        <div className={styles.paginationControls}>
          <div className={styles.itemsPerPageSelector}>
            <label>Itens por página:</label>
            <div className={styles.multiSelectContainer}>
              <div
                className={styles.multiSelectTrigger}
                onClick={() => toggleDropdown('itemsPerPage')}
                tabIndex={0}
                data-dropdown="itemsPerPage"
                onKeyDown={e => {
                  if (!dropdownOpen.itemsPerPage) {
                    // Dropdown fechado - Enter/Space abre
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDropdown('itemsPerPage');
                      setFocusedIndex(prev => ({
                        ...prev,
                        itemsPerPage: -1,
                      }));
                    }
                  } else {
                    // Dropdown aberto - delega para handleDropdownKeyDown
                    handleDropdownKeyDown(e, 'itemsPerPage');
                  }
                }}
              >
                <span>{itemsPerPage}</span>
                <span className={styles.dropdownArrow}>
                  {dropdownOpen.itemsPerPage ? '▲' : '▼'}
                </span>
              </div>
              {dropdownOpen.itemsPerPage && (
                <div className={styles.multiSelectDropdownUp} tabIndex={-1}>
                  {['10', '25', '50'].map((value, index) => (
                    <label
                      key={value}
                      className={`${styles.checkboxLabel} ${focusedIndex.itemsPerPage === index ? styles.checkboxLabelFocused : ''}`}
                      data-option-index={index}
                      onClick={e => {
                        e.stopPropagation();
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
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              Próxima &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
