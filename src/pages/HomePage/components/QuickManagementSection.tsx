import React, { memo, useCallback, useMemo } from 'react';
import { IoDocument, IoEye, IoFolder } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useDemandasData } from '../../../hooks/queries/useDemandas';
import { useDocumentosData } from '../../../hooks/queries/useDocumentos';
import { mockAnalistas } from '../../../data/mockAnalistas';
import Table, { type TableColumn } from '../../../components/ui/Table';
import StatusBadge from '../../../components/ui/StatusBadge';
import { SectionHeader } from './SectionHeader';
import { FilterDropdown } from './FilterDropdown';
import { DateRangePicker } from '../../../components/ui';
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import { getDocumentStatus, getStatusColor } from '../../../utils/documentStatusUtils';
import { useStatistics } from '../hooks/useStatistics';
import { useHomePageFilters } from '../hooks/useHomePageFilters';
import styles from '../styles/QuickManagement.module.css';

// Constante estática para opções de analistas - evita recalcular a cada render
const OPCOES_ANALISTAS = mockAnalistas.map(analista => ({
  id: analista.id.toString(),
  nome: analista.nome,
}));

// Função para obter abreviação do tipo de documento
const getTipoDocumentoAbrev = (tipo: string): string => {
  const abreviacoes: Record<string, string> = {
    Ofício: 'OF',
    'Ofício Circular': 'OFC',
    'Autos Circunstanciados': 'AC',
    'Relatório Técnico': 'RT',
    'Relatório de Inteligência': 'RELINT',
    Mídia: 'MD',
  };
  return abreviacoes[tipo] ?? tipo.substring(0, 3).toUpperCase();
};

// Função para renderizar status do documento
const renderDocumentStatus = (documento: DocumentoDemanda) => {
  const status = getDocumentStatus(documento);
  if (status === 'Sem Status') return null;

  const backgroundColor = getStatusColor(status);
  return <div className={styles.statusIndicator} style={{ backgroundColor }} title={status} />;
};

// Componente para os filtros

interface QuickManagementFiltersProps {
  filtros: {
    referencia: string;
    documentos: string;
    dataInicio?: string;
    dataFim?: string;
    analista: string[];
  };
  setFiltros: React.Dispatch<
    React.SetStateAction<{
      referencia: string;
      documentos: string;
      dataInicio?: string;
      dataFim?: string;
      analista: string[];
    }>
  >;
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleAnalistaChange: (analista: string) => void;
  getAnalistaDisplayText: () => string;
  handleDateRangeChange: (start: Date | null, end: Date | null) => void;
}

// Componente para as tabelas
interface QuickManagementTablesProps {
  documentosFiltrados: DocumentoDemanda[];
  demandasFiltradas: Demanda[];
  colunasDocumentos: TableColumn<DocumentoDemanda>[];
  colunasDemandas: TableColumn<Demanda>[];
  onOpenDocumentModal: (documento: DocumentoDemanda) => void;
  onOpenDemandModal: (demanda: Demanda) => void;
  onCreateDocument: (demanda: Demanda) => void;
  navigate: (path: string) => void;
}

// Hook para configurar colunas das demandas
const useDemandasColumns = (
  handleSgedClick: (e: React.MouseEvent, demanda: Demanda) => void
): TableColumn<Demanda>[] => [
  {
    key: 'sged',
    label: 'SGED',
    width: '50%',
    align: 'center',
    render: (value, demanda) => (
      <span
        className={`${styles.tableNumber} ${styles.tableClickable} ${styles.linkBlue}`}
        onClick={e => handleSgedClick(e, demanda)}
        title='Clique para ver detalhes da demanda'
      >
        {value}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '50%',
    align: 'center',
    render: value => (
      <StatusBadge
        status={value as 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando'}
      />
    ),
  },
];

// Hook para configurar colunas dos documentos
const useDocumentosColumns = (
  handleDocumentNumberClick: (e: React.MouseEvent, documento: DocumentoDemanda) => void
): TableColumn<DocumentoDemanda>[] => [
  {
    key: 'numeroDocumento',
    label: 'Número',
    width: '31.25%',
    align: 'center',
    render: (value, documento) => (
      <span
        className={`${styles.tableNumber} ${styles.tableClickable} ${styles.linkBlue}`}
        onClick={e => handleDocumentNumberClick(e, documento)}
        title='Clique para ver detalhes do documento'
      >
        {String(value ?? '')}
      </span>
    ),
  },
  {
    key: 'tipoDocumento',
    label: 'Tipo',
    width: '12.5%',
    align: 'center',
    render: value => (
      <span className={`${styles.tableText} ${styles.tipoAbrev}`} title={String(value ?? '')}>
        {getTipoDocumentoAbrev(String(value ?? ''))}
      </span>
    ),
  },
  {
    key: 'destinatario',
    label: 'Destinatário',
    width: '31.25%',
    render: value => (
      <span
        className={`${styles.tableText} ${styles.destinatarioTruncate}`}
        title={String(value ?? '')}
      >
        {String(value ?? '')}
      </span>
    ),
  },
  {
    key: 'respondido' as keyof DocumentoDemanda,
    label: 'Status',
    width: '12.5%',
    align: 'center',
    render: (_, documento) => renderDocumentStatus(documento),
  },
];

// Hook para filtrar demandas
const useFilteredDemandas = (
  demandas: Demanda[],
  filtros: { analista: string[]; dataInicio?: string; dataFim?: string },
  debouncedReferencia: string,
  debouncedDocumentos: string,
  getDocumentosByDemandaId: (id: number) => DocumentoDemanda[],
  isDateInRange: (date: string, start?: string, end?: string) => boolean
) => {
  return useMemo(() => {
    let resultado = [...demandas];

    // Filtrar apenas demandas não finalizadas
    resultado = resultado.filter((d: Demanda) => !d.dataFinal);

    if (filtros.analista.length > 0) {
      resultado = resultado.filter((d: Demanda) => filtros.analista.includes(d.analista));
    }

    // Filtro por período
    if (filtros.dataInicio || filtros.dataFim) {
      resultado = resultado.filter((d: Demanda) => {
        return d.dataInicial && isDateInRange(d.dataInicial, filtros.dataInicio, filtros.dataFim);
      });
    }

    // Filtro para Número de Referência
    if (debouncedReferencia) {
      const termoBuscaReferencia = debouncedReferencia.toLowerCase();
      resultado = resultado.filter((d: Demanda) => {
        return (
          d.sged.toLowerCase().includes(termoBuscaReferencia) ||
          (d.autosAdministrativos ?? '').toLowerCase().includes(termoBuscaReferencia) ||
          (d.autosJudiciais ?? '').toLowerCase().includes(termoBuscaReferencia) ||
          (d.autosExtrajudiciais ?? '').toLowerCase().includes(termoBuscaReferencia) ||
          (d.pic ?? '').toLowerCase().includes(termoBuscaReferencia)
        );
      });
    }

    // Filtro para Documentos
    if (debouncedDocumentos) {
      const termoBuscaDocumentos = debouncedDocumentos.toLowerCase();
      resultado = resultado.filter((d: Demanda) => {
        const documentosDaDemanda = getDocumentosByDemandaId(d.id);
        return documentosDaDemanda.some(documento => {
          return (
            documento.codigoRastreio?.toLowerCase().includes(termoBuscaDocumentos) ||
            documento.hashMidia?.toLowerCase().includes(termoBuscaDocumentos) ||
            documento.numeroAtena?.toLowerCase().includes(termoBuscaDocumentos) ||
            documento.numeroDocumento?.toLowerCase().includes(termoBuscaDocumentos) ||
            documento.pesquisas?.some(pesquisa =>
              pesquisa.identificador?.toLowerCase().includes(termoBuscaDocumentos)
            )
          );
        });
      });
    }

    return resultado;
  }, [
    demandas,
    filtros.analista,
    filtros.dataInicio,
    filtros.dataFim,
    debouncedReferencia,
    debouncedDocumentos,
    getDocumentosByDemandaId,
    isDateInRange,
  ]);
};

// Hook para filtrar documentos
const useFilteredDocumentos = (
  documentos: DocumentoDemanda[],
  demandas: Demanda[],
  filtros: { analista: string[] },
  isDocumentIncomplete: (doc: DocumentoDemanda) => boolean
) => {
  return useMemo(() => {
    let todosDocumentos = [...documentos];

    // Filtrar por demandas não finalizadas e analista
    if (filtros.analista.length > 0) {
      const demandasDoAnalista = demandas
        .filter((d: Demanda) => filtros.analista.includes(d.analista) && !d.dataFinal)
        .map((d: Demanda) => d.id);

      todosDocumentos = todosDocumentos.filter((doc: DocumentoDemanda) =>
        demandasDoAnalista.includes(doc.demandaId)
      );
    } else {
      const demandasAtivas = demandas
        .filter((d: Demanda) => !d.dataFinal)
        .map((d: Demanda) => d.id);

      todosDocumentos = todosDocumentos.filter((doc: DocumentoDemanda) =>
        demandasAtivas.includes(doc.demandaId)
      );
    }

    // Mostrar apenas documentos incompletos
    return todosDocumentos.filter(doc => isDocumentIncomplete(doc));
  }, [documentos, demandas, filtros.analista, isDocumentIncomplete]);
};

const QuickManagementTables: React.FC<QuickManagementTablesProps> = ({
  documentosFiltrados,
  demandasFiltradas,
  colunasDocumentos,
  colunasDemandas,
  onOpenDocumentModal,
  onOpenDemandModal,
  onCreateDocument,
  navigate,
}) => (
  <div className={styles.tablesGrid}>
    <div className={`${styles.tableContainer} ${styles.tableContainerLarge}`}>
      <div className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          <IoDocument size={20} />
          <h3>Documentos ({documentosFiltrados.length})</h3>
        </div>
        <button className={styles.viewAllButton} onClick={() => navigate('/documentos')}>
          <IoEye size={16} />
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <div className={styles.customTableContainer}>
          <Table
            data={documentosFiltrados}
            columns={colunasDocumentos}
            onEdit={onOpenDocumentModal}
            emptyMessage='Nenhum documento encontrado com os filtros aplicados'
          />
        </div>
      </div>
    </div>

    <div className={`${styles.tableContainer} ${styles.tableContainerSmall}`}>
      <div className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          <IoFolder size={20} />
          <h3>Demandas ({demandasFiltradas.length})</h3>
        </div>
        <button className={styles.viewAllButton} onClick={() => navigate('/demandas')}>
          <IoEye size={16} />
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <div className={styles.customTableContainer}>
          <Table
            data={demandasFiltradas}
            columns={colunasDemandas}
            onEdit={onOpenDemandModal}
            onCreateDocument={onCreateDocument}
            emptyMessage='Nenhuma demanda encontrada com os filtros aplicados'
          />
        </div>
      </div>
    </div>
  </div>
);

const QuickManagementFilters: React.FC<QuickManagementFiltersProps> = ({
  filtros,
  setFiltros,
  dropdownOpen,
  setDropdownOpen,
  handleAnalistaChange,
  getAnalistaDisplayText,
  handleDateRangeChange,
}) => (
  <div className={styles.filters}>
    <div className={styles.filterGroupLarge}>
      <label>Número de Referência</label>
      <input
        type='text'
        value={filtros.referencia}
        onChange={e => setFiltros(prev => ({ ...prev, referencia: e.target.value }))}
        placeholder='SGED, Autos, PIC...'
        className={styles.filterInput}
      />
    </div>

    <div className={styles.filterGroupLarge}>
      <label>Documentos</label>
      <input
        type='text'
        value={filtros.documentos}
        onChange={e => setFiltros(prev => ({ ...prev, documentos: e.target.value }))}
        placeholder='Código rastreio, Identificador, Número no Atena...'
        className={styles.filterInput}
      />
    </div>

    <div className={styles.filterGroupMedium}>
      <DateRangePicker
        label='Período'
        startDate={filtros.dataInicio ? new Date(filtros.dataInicio) : null}
        endDate={filtros.dataFim ? new Date(filtros.dataFim) : null}
        onDateChange={handleDateRangeChange}
        placeholder='Selecionar período'
      />
    </div>

    <FilterDropdown
      label='Analista'
      options={OPCOES_ANALISTAS}
      selectedValues={filtros.analista}
      onSelectionChange={handleAnalistaChange}
      isOpen={dropdownOpen}
      onToggle={() => setDropdownOpen(!dropdownOpen)}
      getDisplayText={getAnalistaDisplayText}
    />
  </div>
);

interface QuickManagementSectionProps {
  onOpenDemandModal: (demanda: Demanda) => void;
  onOpenDocumentModal: (documento: DocumentoDemanda) => void;
  onCreateDocument: (demanda: Demanda) => void;
}

export const QuickManagementSection: React.FC<QuickManagementSectionProps> = memo(
  ({ onOpenDemandModal, onOpenDocumentModal, onCreateDocument }) => {
    const navigate = useNavigate();
    const { data: demandas = [] } = useDemandasData();
    const { data: documentos = [], getDocumentosByDemandaId } = useDocumentosData();
    const { isDocumentIncomplete, getContadores } = useStatistics({ anos: [], analista: [] });

    const {
      filtros,
      setFiltros,
      dropdownOpen,
      setDropdownOpen,
      handleAnalistaChange,
      getAnalistaDisplayText,
      debouncedReferencia,
      debouncedDocumentos,
      handleDateRangeChange,
      isDateInRange,
    } = useHomePageFilters();

    const [isGestaoRapidaOpen, setIsGestaoRapidaOpen] = React.useState(true);

    // Usar hooks personalizados para filtragem
    const demandasFiltradas = useFilteredDemandas(
      demandas,
      filtros,
      debouncedReferencia,
      debouncedDocumentos,
      getDocumentosByDemandaId,
      isDateInRange
    );

    const documentosFiltrados = useFilteredDocumentos(
      documentos,
      demandas,
      filtros,
      isDocumentIncomplete
    );

    // Contadores - getContadores já é memoizado, não precisa de useMemo adicional
    const contadores = getContadores(filtros.analista);

    // Handlers para cliques
    const handleSgedClick = useCallback(
      (e: React.MouseEvent, demanda: Demanda) => {
        e.stopPropagation();
        navigate(`/demandas/${demanda.id}`);
      },
      [navigate]
    );

    const handleDocumentNumberClick = useCallback(
      (e: React.MouseEvent, documento: DocumentoDemanda) => {
        e.stopPropagation();
        navigate(`/documentos/${documento.id}`);
      },
      [navigate]
    );

    // Configuração das colunas das tabelas usando hooks
    const colunasDemandas = useDemandasColumns(handleSgedClick);
    const colunasDocumentos = useDocumentosColumns(handleDocumentNumberClick);

    return (
      <section className={styles.tablesSection}>
        <SectionHeader
          title='Gestão Rápida'
          isCollapsible={true}
          isCollapsed={!isGestaoRapidaOpen}
          onToggle={() => setIsGestaoRapidaOpen(!isGestaoRapidaOpen)}
          counters={
            !isGestaoRapidaOpen
              ? [
                  { label: 'documentos', value: contadores.documentos },
                  { label: 'demandas', value: contadores.demandas },
                ]
              : []
          }
        />

        {isGestaoRapidaOpen && (
          <>
            <QuickManagementFilters
              filtros={filtros}
              setFiltros={setFiltros}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              handleAnalistaChange={handleAnalistaChange}
              getAnalistaDisplayText={getAnalistaDisplayText}
              handleDateRangeChange={handleDateRangeChange}
            />

            <QuickManagementTables
              documentosFiltrados={documentosFiltrados}
              demandasFiltradas={demandasFiltradas}
              colunasDocumentos={colunasDocumentos}
              colunasDemandas={colunasDemandas}
              onOpenDocumentModal={onOpenDocumentModal}
              onOpenDemandModal={onOpenDemandModal}
              onCreateDocument={onCreateDocument}
              navigate={navigate}
            />
          </>
        )}
      </section>
    );
  }
);
