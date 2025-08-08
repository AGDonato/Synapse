// src/pages/DocumentosPage.tsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockDocumentosDemanda, type DocumentoDemanda, type RetificacaoDocumento, type PesquisaDocumento } from '../data/mockDocumentos';
import { mockTiposDocumentos } from '../data/mockTiposDocumentos';
import { mockAnalistas } from '../data/mockAnalistas';
import { useDemandas } from '../hooks/useDemandas';
import { FilterX } from 'lucide-react';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DocumentosPage.module.css';

type SortConfig = {
  key: keyof DocumentoDemanda | 'respondido';
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
  const navigate = useNavigate();

  const [filters, setFilters] = useState(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{
    tipoDocumento: boolean;
    enderecamento: boolean;
    analista: boolean;
    respondido: boolean;
  }>({
    tipoDocumento: false,
    enderecamento: false,
    analista: false,
    respondido: false,
  });

  const [enderecamentoSearch, setEnderecamentoSearch] = useState('');

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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
    });
    setEnderecamentoSearch('');
  };

  // Função para manipular filtros de multiseleção
  const handleMultiSelectChange = (
    filterType: 'analista' | 'respondido',
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...prev, [filterType]: newValues };
    });
    setCurrentPage(1);
  };

  // Função para obter o texto do filtro baseado na seleção
  const getFilterDisplayText = (filterType: 'analista' | 'respondido') => {
    const selectedItems = filters[filterType];
    const allOptions =
      filterType === 'respondido'
        ? ['Respondido', 'Pendente']
        : mockAnalistas.map((a) => a.nome);

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

  // Função para alternar dropdown
  const toggleDropdown = (
    filterType: 'tipoDocumento' | 'enderecamento' | 'analista' | 'respondido'
  ) => {
    setDropdownOpen((prev) => ({
      tipoDocumento: false,
      enderecamento: false,
      analista: false,
      respondido: false,
      [filterType]: !prev[filterType],
    }));
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
      setSortConfig((current) => {
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

  // Obter listas únicas para filtros
  const enderecamentosUnicos = useMemo(() => {
    const todosEnderecamentos = mockDocumentosDemanda.map((d) => d.enderecamento);
    return [...new Set(todosEnderecamentos)].map((d) => ({ id: d, nome: d }));
  }, []);

  // Filtrar destinatários baseado na busca
  const enderecamentosFiltrados = useMemo(() => {
    if (!enderecamentoSearch.trim()) return enderecamentosUnicos;
    return enderecamentosUnicos.filter((d) =>
      d.nome.toLowerCase().includes(enderecamentoSearch.toLowerCase())
    );
  }, [enderecamentosUnicos, enderecamentoSearch]);

  // Função para obter demanda por documento
  const getDemandaByDocument = useCallback(
    (documento: DocumentoDemanda) => {
      return demandas.find((d) => d.id === documento.demandaId);
    },
    [demandas]
  );

  // Função para calcular status baseado nas datas
  const getDocumentStatus = useCallback(
    (documento: DocumentoDemanda): string => {
      if (!documento.dataEnvio) {
        return 'Sem Informação';
      }

      if (documento.dataEnvio && documento.dataResposta) {
        return 'Respondido';
      }

      if (documento.dataEnvio && !documento.dataResposta) {
        return 'Pendente';
      }

      return 'Sem Informação';
    },
    []
  );

  // Dados filtrados
  const filteredDocumentos = useMemo(() => {
    const [dtEnvioDe, dtEnvioAte] = filters.periodoEnvio;
    const [dtRespostaDe, dtRespostaAte] = filters.periodoResposta;

    return mockDocumentosDemanda.filter((documento) => {
      const demanda = getDemandaByDocument(documento);

      // Filtro por SGED (baseado na demanda)
      if (
        filters.sged &&
        (!demanda ||
          !demanda.sged.toLowerCase().includes(filters.sged.toLowerCase()))
      ) {
        return false;
      }

      // Filtro por número do documento
      if (
        filters.numeroDocumento &&
        !documento.numeroDocumento
          .toLowerCase()
          .includes(filters.numeroDocumento.toLowerCase())
      ) {
        return false;
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

      // Filtro por identificador (baseado na demanda)
      if (
        filters.identificador &&
        (!demanda ||
          !String(demanda.identificadores || '')
            .toLowerCase()
            .includes(filters.identificador.toLowerCase()))
      ) {
        return false;
      }

      // Filtro por status baseado nas datas (apenas documentos com data de envio)
      if (filters.respondido.length > 0) {
        // Só considera documentos que têm data de envio (que podem ter status)
        if (!documento.dataEnvio) {
          return false; // Exclui documentos sem data de envio quando há filtro de status
        }

        const statusTexto = getDocumentStatus(documento);
        if (!filters.respondido.includes(statusTexto)) {
          return false;
        }
      }

      // Filtro por período de envio
      if (documento.dataEnvio) {
        const [anoEnvio, mesEnvio, diaEnvio] = documento.dataEnvio
          .split('-')
          .map(Number);
        const dataEnvioDoc = new Date(anoEnvio, mesEnvio - 1, diaEnvio);

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

      // Filtro por período de resposta
      if (documento.dataResposta) {
        const [anoResposta, mesResposta, diaResposta] = documento.dataResposta
          .split('-')
          .map(Number);
        const dataRespostaDoc = new Date(
          anoResposta,
          mesResposta - 1,
          diaResposta
        );

        if (dtRespostaDe) {
          const inicioPeriodo = new Date(dtRespostaDe);
          inicioPeriodo.setHours(0, 0, 0, 0);
          if (dataRespostaDoc < inicioPeriodo) return false;
        }
        if (dtRespostaAte) {
          const fimPeriodo = new Date(dtRespostaAte);
          fimPeriodo.setHours(23, 59, 59, 999);
          if (dataRespostaDoc > fimPeriodo) return false;
        }
      } else {
        // Se não tem data de resposta e está filtrando por período de resposta, excluir
        if (dtRespostaDe || dtRespostaAte) return false;
      }

      return true;
    });
  }, [filters, getDemandaByDocument, getDocumentStatus]);

  // Dados ordenados
  const sortedDocumentos = useMemo(() => {
    if (!sortConfig) {
      return filteredDocumentos;
    }

    return [...filteredDocumentos].sort((a, b) => {
      let aValue: string | number | boolean | RetificacaoDocumento[] | PesquisaDocumento[] | null | undefined;
      let bValue: string | number | boolean | RetificacaoDocumento[] | PesquisaDocumento[] | null | undefined;

      if (sortConfig.key === 'respondido') {
        aValue = a.respondido;
        bValue = b.respondido;
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
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleRowClick = (documentoId: number) => {
    navigate(`/documentos/${documentoId}`);
  };

  const getStatusIndicator = (documento: DocumentoDemanda) => {
    const status = getDocumentStatus(documento);

    // Se não tem informação, retorna vazio (sem indicador)
    if (status === 'Sem Informação') {
      return null;
    }

    let backgroundColor = '#dc3545'; // Vermelho para "Pendente" por padrão

    if (status === 'Respondido') {
      backgroundColor = '#28a745'; // Verde
    }

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
      if (!target.closest(`[class*='multiSelectContainer']`)) {
        setDropdownOpen({
          tipoDocumento: false,
          enderecamento: false,
          analista: false,
          respondido: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Lista de Documentos</h2>
        <Link to='/documentos/novo' className={styles.btnPrimary}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            fill='currentColor'
            viewBox='0 0 16 16'
          >
            <path d='M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z' />
          </svg>
          Novo Documento
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
            {/* SGED */}
            <div className={styles.formGroup}>
              <label>SGED</label>
              <input
                type='text'
                name='sged'
                value={filters.sged}
                onChange={handleFilterChange}
                className={styles.formInput}
              />
            </div>

            {/* Número do Documento */}
            <div className={styles.formGroup}>
              <label>Número do Documento</label>
              <input
                type='text'
                name='numeroDocumento'
                value={filters.numeroDocumento}
                onChange={handleFilterChange}
                className={styles.formInput}
              />
            </div>

            {/* Tipo de Documento */}
            <div className={styles.formGroup}>
              <label>Tipo de Documento</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('tipoDocumento')}
                  tabIndex={0}
                >
                  <span>{filters.tipoDocumento || ''}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.tipoDocumento ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.tipoDocumento && (
                  <div className={styles.multiSelectDropdown}>
                    <label
                      className={styles.checkboxLabel}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, tipoDocumento: '' }));
                        setDropdownOpen((prev) => ({
                          ...prev,
                          tipoDocumento: false,
                        }));
                      }}
                    >
                      <span className={styles.checkboxText}></span>
                    </label>
                    {mockTiposDocumentos.map((tipo) => (
                      <label
                        key={tipo.id}
                        className={styles.checkboxLabel}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            tipoDocumento: tipo.nome,
                          }));
                          setDropdownOpen((prev) => ({
                            ...prev,
                            tipoDocumento: false,
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

            {/* Endereçamento com busca */}
            <div className={styles.formGroup}>
              <label>Endereçamento</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('enderecamento')}
                  tabIndex={0}
                >
                  <span>{filters.enderecamento || ''}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.enderecamento ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.enderecamento && (
                  <div className={styles.multiSelectDropdown}>
                    <div className={styles.searchContainer}>
                      <input
                        type='text'
                        placeholder='Buscar endereçamento...'
                        value={enderecamentoSearch}
                        onChange={(e) => setEnderecamentoSearch(e.target.value)}
                        className={styles.searchInput}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className={styles.optionsContainer}>
                      <label
                        className={styles.checkboxLabel}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, enderecamento: '' }));
                          setDropdownOpen((prev) => ({
                            ...prev,
                            enderecamento: false,
                          }));
                          setEnderecamentoSearch('');
                        }}
                      >
                        <span className={styles.checkboxText}></span>
                      </label>
                      {enderecamentosFiltrados.map((enderecamento) => (
                        <label
                          key={enderecamento.id}
                          className={styles.checkboxLabel}
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              enderecamento: enderecamento.nome,
                            }));
                            setDropdownOpen((prev) => ({
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
                  <div className={styles.multiSelectDropdown}>
                    {mockAnalistas.map((analista) => (
                      <label key={analista.id} className={styles.checkboxLabel}>
                        <input
                          type='checkbox'
                          checked={filters.analista.includes(analista.nome)}
                          onChange={() =>
                            handleMultiSelectChange('analista', analista.nome)
                          }
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          {analista.nome}
                        </span>
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
              <label>Identificador</label>
              <input
                type='text'
                name='identificador'
                value={filters.identificador}
                onChange={handleFilterChange}
                className={styles.formInput}
              />
            </div>

            {/* Status */}
            <div className={styles.formGroup}>
              <label>Status</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('respondido')}
                  tabIndex={0}
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
                  <div className={styles.multiSelectDropdown}>
                    {['Respondido', 'Pendente'].map((status) => (
                      <label key={status} className={styles.checkboxLabel}>
                        <input
                          type='checkbox'
                          checked={filters.respondido.includes(status)}
                          onChange={() =>
                            handleMultiSelectChange('respondido', status)
                          }
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{status}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Data de Envio</label>
              <div
                className={`${styles.datePickerWrapper} ${filters.periodoEnvio[0] ? styles.hasValue : ''}`}
              >
                <DatePicker
                  selectsRange={true}
                  startDate={filters.periodoEnvio[0]}
                  endDate={filters.periodoEnvio[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilters((prev) => ({ ...prev, periodoEnvio: update }));
                  }}
                  isClearable={true}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='Selecione o período'
                  className='form-input'
                  locale='pt-BR'
                  onKeyDown={(e) => e.preventDefault()}
                  popperPlacement='bottom-start'
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Data de Resposta</label>
              <div
                className={`${styles.datePickerWrapper} ${filters.periodoResposta[0] ? styles.hasValue : ''}`}
              >
                <DatePicker
                  selectsRange={true}
                  startDate={filters.periodoResposta[0]}
                  endDate={filters.periodoResposta[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilters((prev) => ({
                      ...prev,
                      periodoResposta: update,
                    }));
                  }}
                  isClearable={true}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='Selecione o período'
                  className='form-input'
                  locale='pt-BR'
                  onKeyDown={(e) => e.preventDefault()}
                  popperPlacement='bottom-end'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th
              className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
              onClick={() => handleSort('numeroDocumento')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Número
                {getSortIcon('numeroDocumento')}
              </div>
            </th>
            <th
              className={`${styles.tableHeader} ${styles.sortableHeader}`}
              onClick={() => handleSort('tipoDocumento')}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Tipo
                {getSortIcon('tipoDocumento')}
              </div>
            </th>
            <th
              className={`${styles.tableHeader} ${styles.sortableHeader}`}
              onClick={() => handleSort('enderecamento')}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Endereçamento
                {getSortIcon('enderecamento')}
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
              onClick={() => handleSort('dataEnvio')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Data Envio
                {getSortIcon('dataEnvio')}
              </div>
            </th>
            <th
              className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
              onClick={() => handleSort('dataResposta')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Data Resposta
                {getSortIcon('dataResposta')}
              </div>
            </th>
            <th
              className={`${styles.tableHeader} ${styles.textCenter} ${styles.sortableHeader}`}
              onClick={() => handleSort('respondido')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Status
                {getSortIcon('respondido')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((documento) => (
            <tr
              key={documento.id}
              onClick={() => handleRowClick(documento.id)}
              className={styles.tableRow}
            >
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {documento.numeroDocumento}
              </td>
              <td className={styles.tableCell}>{documento.tipoDocumento}</td>
              <td className={styles.tableCell}>{documento.enderecamento}</td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {documento.analista}
              </td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {formatDateToDDMMYYYYOrPlaceholder(documento.dataEnvio, '-')}
              </td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {formatDateToDDMMYYYYOrPlaceholder(documento.dataResposta, '-')}
              </td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {getStatusIndicator(documento)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
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
