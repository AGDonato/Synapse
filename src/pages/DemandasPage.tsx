// src/pages/DemandasPage.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemandas } from '../hooks/useDemandas';
import StatusBadge from '../components/ui/StatusBadge';
import { FilterX } from 'lucide-react';
import { mockTiposDemandas } from '../data/mockTiposDemandas';
// import { mockDistribuidores } from '../data/mockDistribuidores';
import { mockAnalistas } from '../data/mockAnalistas';
import { type Demanda } from '../data/mockDemandas';
import { mockDocumentosDemanda } from '../data/mockDocumentos';
import { calculateDemandaStatus } from '../utils/statusUtils';
import {
  formatDateToDDMMYYYY,
  formatDateToDDMMYYYYOrPlaceholder,
} from '../utils/dateUtils';

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
  const { demandas } = useDemandas();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{
    status: boolean;
    analista: boolean;
    tipoDemanda: boolean;
    solicitante: boolean;
  }>({
    status: false,
    analista: false,
    tipoDemanda: false,
    solicitante: false,
  });

  const [solicitanteSearch, setSolicitanteSearch] = useState('');

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
      status: false,
      analista: false,
      tipoDemanda: false,
      solicitante: false,
    });
    setSolicitanteSearch('');
  };

  // Função para manipular filtros de multiseleção
  const handleMultiSelectChange = (
    filterType: 'status' | 'analista',
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
  const getFilterDisplayText = (filterType: 'status' | 'analista') => {
    const selectedItems = filters[filterType];
    const allOptions =
      filterType === 'status'
        ? ['Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando']
        : mockAnalistas.map((d) => d.nome);

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
    filterType: 'status' | 'analista' | 'tipoDemanda' | 'solicitante'
  ) => {
    setDropdownOpen((prev) => ({
      status: false,
      analista: false,
      tipoDemanda: false,
      solicitante: false,
      [filterType]: !prev[filterType],
    }));
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

    return demandas.filter((demanda) => {
      const termoBuscaReferencia = filters.referencia.toLowerCase();
      const calculatedStatus = calculateDemandaStatus(
        demanda,
        mockDocumentosDemanda
      );

      if (
        filters.status.length > 0 &&
        !filters.status.includes(calculatedStatus)
      )
        return false;
      if (filters.tipoDemanda && demanda.tipoDemanda !== filters.tipoDemanda)
        return false;
      if (
        filters.analista.length > 0 &&
        !filters.analista.includes(demanda.analista)
      )
        return false;
      if (filters.solicitante && demanda.orgao !== filters.solicitante)
        return false;
      if (
        filters.referencia &&
        !demanda.sged.toLowerCase().includes(termoBuscaReferencia) &&
        !(demanda.autosAdministrativos || '')
          .toLowerCase()
          .includes(termoBuscaReferencia)
      ) {
        return false;
      }
      if (
        filters.descricao &&
        !demanda.assunto.toLowerCase().includes(filters.descricao.toLowerCase())
      ) {
        return false;
      }

      // Filtro para Data Inicial
      if (dtIniDe || dtIniAte) {
        // As datas estão no formato DD/MM/YYYY
        const [diaIni, mesIni, anoIni] = demanda.dataInicial
          .split('/')
          .map(Number);
        const dataInicialDemanda = new Date(anoIni, mesIni - 1, diaIni);
        dataInicialDemanda.setHours(12, 0, 0, 0); // Normaliza para meio-dia para evitar problemas de timezone
        
        if (dtIniDe) {
          const inicioPeriodo = new Date(dtIniDe);
          inicioPeriodo.setHours(0, 0, 0, 0);
          if (dataInicialDemanda < inicioPeriodo) return false;
        }
        if (dtIniAte) {
          const fimPeriodo = new Date(dtIniAte);
          fimPeriodo.setHours(23, 59, 59, 999);
          if (dataInicialDemanda > fimPeriodo) return false;
        }
      }

      // Filtro para Data Final
      if (dtFimDe || dtFimAte) {
        if (!demanda.dataFinal) {
          // Se filtro de data final está ativo mas a demanda não tem data final, não mostrar
          return false;
        }
        
        // As datas estão no formato DD/MM/YYYY
        const [diaFim, mesFim, anoFim] = demanda.dataFinal
          .split('/')
          .map(Number);
        const dataFinalDemanda = new Date(anoFim, mesFim - 1, diaFim);
        dataFinalDemanda.setHours(12, 0, 0, 0); // Normaliza para meio-dia para evitar problemas de timezone
        
        if (dtFimDe) {
          const inicioPeriodoFim = new Date(dtFimDe);
          inicioPeriodoFim.setHours(0, 0, 0, 0);
          if (dataFinalDemanda < inicioPeriodoFim) return false;
        }
        if (dtFimAte) {
          const fimPeriodoFim = new Date(dtFimAte);
          fimPeriodoFim.setHours(23, 59, 59, 999);
          if (dataFinalDemanda > fimPeriodoFim) return false;
        }
      }
      return true;
    });
  }, [demandas, filters]);

  const solicitantesUnicos = useMemo(() => {
    const todosOsSolicitantes = demandas.map((d) => d.orgao);
    return [...new Set(todosOsSolicitantes)].map((s) => ({ id: s, nome: s }));
  }, [demandas]);

  // Filtrar solicitantes baseado na busca
  const solicitantesFiltrados = useMemo(() => {
    if (!solicitanteSearch.trim()) return solicitantesUnicos;
    return solicitantesUnicos.filter((s) =>
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

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

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
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleRowClick = (demandaId: number) => {
    navigate(`/demandas/${demandaId}`);
  };

  // Event listener para fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`[class*='multiSelectContainer']`)) {
        setDropdownOpen({
          status: false,
          analista: false,
          tipoDemanda: false,
          solicitante: false,
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
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo de Demanda</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('tipoDemanda')}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDropdown('tipoDemanda');
                    }
                  }}
                >
                  <span>{filters.tipoDemanda || ''}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.tipoDemanda ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.tipoDemanda && (
                  <div className={styles.multiSelectDropdown}>
                    <label
                      className={styles.checkboxLabel}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, tipoDemanda: '' }));
                        setDropdownOpen((prev) => ({
                          ...prev,
                          tipoDemanda: false,
                        }));
                      }}
                    >
                      <span className={styles.checkboxText}></span>
                    </label>
                    {mockTiposDemandas.map((tipo) => (
                      <label
                        key={tipo.id}
                        className={styles.checkboxLabel}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            tipoDemanda: tipo.nome,
                          }));
                          setDropdownOpen((prev) => ({
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
                  onClick={() => toggleDropdown('solicitante')}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDropdown('solicitante');
                    }
                  }}
                >
                  <span>{filters.solicitante || ''}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.solicitante ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.solicitante && (
                  <div className={styles.multiSelectDropdown}>
                    <div className={styles.searchContainer}>
                      <input
                        type='text'
                        placeholder='Buscar solicitante...'
                        value={solicitanteSearch}
                        onChange={(e) => setSolicitanteSearch(e.target.value)}
                        className={styles.searchInput}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className={styles.optionsContainer}>
                      <label
                        className={styles.checkboxLabel}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, solicitante: '' }));
                          setDropdownOpen((prev) => ({
                            ...prev,
                            solicitante: false,
                          }));
                          setSolicitanteSearch('');
                        }}
                      >
                        <span className={styles.checkboxText}></span>
                      </label>
                      {solicitantesFiltrados.map((solicitante) => (
                        <label
                          key={solicitante.id}
                          className={styles.checkboxLabel}
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              solicitante: solicitante.nome,
                            }));
                            setDropdownOpen((prev) => ({
                              ...prev,
                              solicitante: false,
                            }));
                            setSolicitanteSearch('');
                          }}
                        >
                          <span className={styles.checkboxText}>
                            {solicitante.nome}
                          </span>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDropdown('status');
                    }
                  }}
                >
                  <span>
                    {filters.status.length > 0
                      ? getFilterDisplayText('status')
                      : ''}
                  </span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen.status ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen.status && (
                  <div className={styles.multiSelectDropdown}>
                    {[
                      'Em Andamento',
                      'Finalizada',
                      'Fila de Espera',
                      'Aguardando',
                    ].map((status) => (
                      <label key={status} className={styles.checkboxLabel}>
                        <input
                          type='checkbox'
                          checked={filters.status.includes(status)}
                          onChange={() =>
                            handleMultiSelectChange('status', status)
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
              <label>Analista</label>
              <div className={styles.multiSelectContainer}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => toggleDropdown('analista')}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDropdown('analista');
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
              <label>Descrição</label>
              <input
                type='text'
                name='descricao'
                value={filters.descricao}
                onChange={handleFilterChange}
                className={styles.formInput}
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
              />
            </div>
            <div className={styles.formGroup}>
              <label>Data Inicial</label>
              <div
                className={`${styles.datePickerWrapper} ${filters.periodoInicial[0] ? styles.hasValue : ''}`}
              >
                <DatePicker
                  selectsRange={true}
                  startDate={filters.periodoInicial[0]}
                  endDate={filters.periodoInicial[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilters((prev) => ({ ...prev, periodoInicial: update }));
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
              <label>Data Final</label>
              <div
                className={`${styles.datePickerWrapper} ${filters.periodoFinal[0] ? styles.hasValue : ''}`}
              >
                <DatePicker
                  selectsRange={true}
                  startDate={filters.periodoFinal[0]}
                  endDate={filters.periodoFinal[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilters((prev) => ({ ...prev, periodoFinal: update }));
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
          </tr>
        </thead>
        <tbody>
          {currentItems.map((demanda: Demanda) => (
            <tr
              key={demanda.id}
              onClick={() => handleRowClick(demanda.id)}
              className={styles.tableRow}
            >
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {demanda.sged}
              </td>
              <td className={styles.tableCell}>{demanda.tipoDemanda}</td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {demanda.autosAdministrativos}
              </td>
              <td className={styles.tableCell}>{demanda.orgao}</td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {demanda.analista}
              </td>
              <td className={styles.tableCell}>
                <StatusBadge
                  status={calculateDemandaStatus(
                    demanda,
                    mockDocumentosDemanda
                  )}
                />
              </td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {formatDateToDDMMYYYY(demanda.dataInicial)}
              </td>
              <td className={`${styles.tableCell} ${styles.textCenter}`}>
                {formatDateToDDMMYYYYOrPlaceholder(demanda.dataFinal, '-')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
