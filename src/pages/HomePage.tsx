import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemandas } from '../hooks/useDemandas';
import { useDocumentos } from '../hooks/useDocumentos';
import Table, { type TableColumn } from '../components/ui/Table';
import SearchableSelect, {
  type Option,
} from '../components/forms/SearchableSelect';
import StatusBadge from '../components/ui/StatusBadge';
import DocumentUpdateModal from '../components/documents/modals/DocumentUpdateModal';
import DemandUpdateModal from '../components/demands/modals/DemandUpdateModal';
import { mockAnalistas } from '../data/mockAnalistas';
import {
  IoEye,
  IoStatsChart,
  IoDocument,
  IoFolder,
  IoTime,
  IoCheckmarkCircle,
  IoAlert,
  IoTrendingUp,
} from 'react-icons/io5';
import styles from './HomePage.module.css';
import type { Demanda } from '../types/entities';
import type { DocumentoDemanda } from '../data/mockDocumentos';

// Tipos para as estatísticas
interface Estatistica {
  id: string;
  titulo: string;
  valor: number | string;
  subtitulo?: string;
  icon: React.ReactElement;
  cor: 'azul' | 'verde' | 'amarelo' | 'vermelho' | 'roxo' | 'laranja';
  tendencia?: {
    valor: number;
    direcao: 'alta' | 'baixa' | 'estavel';
  };
}

interface FiltroTabelas {
  analista: Option | null;
  status: string;
  periodo: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { demandas, updateDemanda } = useDemandas();
  const { documentos, updateDocumento, getDocumentosByDemandaId } =
    useDocumentos();
  const [filtros, setFiltros] = useState<FiltroTabelas>({
    analista: null,
    status: 'todos',
    periodo: 'mes',
  });
  const [analistaEstatisticas, setAnalistaEstatisticas] =
    useState<Option | null>(null);

  // Estados para os modais
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentoDemanda | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demanda | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);

  // Opções para os filtros
  const opcoesAnalistas: Option[] = useMemo(
    () =>
      mockAnalistas.map(analista => ({
        id: analista.nome,
        nome: analista.nome,
      })),
    []
  );

  const opcoesStatus: Option[] = [
    { id: 'todos', nome: 'Todos os Status' },
    { id: 'Em Andamento', nome: 'Em Andamento' },
    { id: 'Finalizada', nome: 'Finalizada' },
    { id: 'Fila de Espera', nome: 'Fila de Espera' },
    { id: 'Aguardando', nome: 'Aguardando' },
  ];

  const opcoesPeriodo: Option[] = [
    { id: 'semana', nome: 'Última Semana' },
    { id: 'mes', nome: 'Último Mês' },
    { id: 'trimestre', nome: 'Último Trimestre' },
    { id: 'ano', nome: 'Último Ano' },
  ];

  // Dados filtrados para as tabelas - demandas não finalizadas e todos os documentos
  const demandasFiltradas = useMemo(() => {
    let resultado = [...demandas];

    // Filtrar apenas demandas que NÃO têm data de finalização (pendentes)
    resultado = resultado.filter((d: Demanda) => !d.dataFinal);

    if (filtros.analista) {
      resultado = resultado.filter(
        (d: Demanda) => d.analista === filtros.analista?.id
      );
    }

    if (filtros.status !== 'todos') {
      resultado = resultado.filter((d: Demanda) => d.status === filtros.status);
    }

    // Aqui você pode adicionar filtro por período quando tiver campo de data atualizada

    return resultado;
  }, [demandas, filtros]);

  const documentosFiltrados = useMemo(() => {
    const todosDocumentos = documentos;
    let resultado = [...todosDocumentos];

    if (filtros.analista) {
      // Filtrar documentos por demandas do analista (só demandas não finalizadas)
      const demandasDoAnalista = demandas
        .filter(
          (d: Demanda) => d.analista === filtros.analista?.id && !d.dataFinal
        )
        .map((d: Demanda) => d.id);

      resultado = resultado.filter((doc: DocumentoDemanda) =>
        demandasDoAnalista.includes(doc.demandaId)
      );
    } else {
      // Se não filtrou por analista, ainda precisa filtrar por demandas não finalizadas
      const demandasAtivas = demandas
        .filter((d: Demanda) => !d.dataFinal)
        .map((d: Demanda) => d.id);

      resultado = resultado.filter((doc: DocumentoDemanda) =>
        demandasAtivas.includes(doc.demandaId)
      );
    }

    return resultado;
  }, [documentos, demandas, filtros.analista]);

  // Cálculo das estatísticas
  const estatisticas = useMemo((): Estatistica[] => {
    const dadosAnalise = analistaEstatisticas
      ? demandas.filter((d: Demanda) => d.analista === analistaEstatisticas.id)
      : demandas;

    const documentosAnalise = analistaEstatisticas
      ? documentos.filter((doc: DocumentoDemanda) => {
          const demanda = demandas.find((d: Demanda) => d.id === doc.demandaId);
          return demanda?.analista === analistaEstatisticas.id;
        })
      : documentos;

    const totalDemandas = dadosAnalise.length;
    const demandasEmAndamento = dadosAnalise.filter(
      (d: Demanda) => d.status === 'Em Andamento'
    ).length;
    const demandasFinalizadas = dadosAnalise.filter(
      (d: Demanda) => d.status === 'Finalizada'
    ).length;
    const demandasAguardando = dadosAnalise.filter(
      (d: Demanda) => d.status === 'Aguardando'
    ).length;
    const totalDocumentos = documentosAnalise.length;
    const documentosEnviados = documentosAnalise.filter(
      (doc: DocumentoDemanda) => !!doc.dataEnvio
    ).length;

    return [
      {
        id: 'total-demandas',
        titulo: 'Total de Demandas',
        valor: totalDemandas,
        subtitulo: analistaEstatisticas
          ? `Analista: ${analistaEstatisticas.nome}`
          : 'Todas as demandas',
        icon: <IoFolder size={24} />,
        cor: 'azul',
        tendencia: { valor: 12, direcao: 'alta' },
      },
      {
        id: 'em-andamento',
        titulo: 'Em Andamento',
        valor: demandasEmAndamento,
        subtitulo: `${((demandasEmAndamento / totalDemandas) * 100 || 0).toFixed(1)}% do total`,
        icon: <IoTime size={24} />,
        cor: 'amarelo',
      },
      {
        id: 'finalizadas',
        titulo: 'Finalizadas',
        valor: demandasFinalizadas,
        subtitulo: `${((demandasFinalizadas / totalDemandas) * 100 || 0).toFixed(1)}% do total`,
        icon: <IoCheckmarkCircle size={24} />,
        cor: 'verde',
        tendencia: { valor: 8, direcao: 'alta' },
      },
      {
        id: 'aguardando',
        titulo: 'Aguardando',
        valor: demandasAguardando,
        subtitulo: `${((demandasAguardando / totalDemandas) * 100 || 0).toFixed(1)}% do total`,
        icon: <IoAlert size={24} />,
        cor: 'vermelho',
      },
      {
        id: 'total-documentos',
        titulo: 'Total de Documentos',
        valor: totalDocumentos,
        subtitulo: 'Todos os tipos',
        icon: <IoDocument size={24} />,
        cor: 'roxo',
      },
      {
        id: 'documentos-enviados',
        titulo: 'Documentos Enviados',
        valor: documentosEnviados,
        subtitulo: `${((documentosEnviados / totalDocumentos) * 100 || 0).toFixed(1)}% enviados`,
        icon: <IoTrendingUp size={24} />,
        cor: 'laranja',
        tendencia: { valor: 5, direcao: 'alta' },
      },
    ];
  }, [demandas, documentos, analistaEstatisticas]);

  // Configuração das colunas da tabela de demandas
  const colunasDemandas: TableColumn<Demanda>[] = [
    {
      key: 'sged',
      label: 'SGED',
      width: '100px',
      render: value => <span className={styles.sgedNumber}>{value}</span>,
    },
    {
      key: 'tipoDemanda',
      label: 'Tipo',
      width: '180px',
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      align: 'center',
      render: value => (
        <StatusBadge
          status={
            value as
              | 'Em Andamento'
              | 'Finalizada'
              | 'Fila de Espera'
              | 'Aguardando'
          }
        />
      ),
    },
    {
      key: 'analista',
      label: 'Analista',
      width: '120px',
      render: value => String(value || ''),
    },
    {
      key: 'orgao',
      label: 'Órgão',
      render: value => (
        <span className={styles.orgaoText} title={value as string}>
          {value}
        </span>
      ),
    },
  ];

  // Configuração das colunas da tabela de documentos
  const colunasDocumentos: TableColumn<DocumentoDemanda>[] = [
    {
      key: 'numeroDocumento',
      label: 'Número',
      width: '120px',
      render: value => (
        <span className={styles.docNumber}>{String(value || '')}</span>
      ),
    },
    {
      key: 'tipoDocumento',
      label: 'Tipo',
      width: '140px',
    },
    {
      key: 'assunto',
      label: 'Assunto',
      render: value => (
        <span className={styles.assuntoText} title={String(value || '')}>
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'destinatario',
      label: 'Destinatário',
      width: '180px',
      render: value => (
        <span className={styles.destinatarioText} title={String(value || '')}>
          {String(value || '')}
        </span>
      ),
    },
  ];

  // Handlers para modais
  const handleOpenDemandModal = useCallback((demanda: Demanda) => {
    setSelectedDemand(demanda);
    setIsDemandModalOpen(true);
  }, []);

  const handleOpenDocumentModal = useCallback((documento: DocumentoDemanda) => {
    setSelectedDocument(documento);
    setIsDocumentModalOpen(true);
  }, []);

  const handleCloseDemandModal = useCallback(() => {
    setIsDemandModalOpen(false);
    setSelectedDemand(null);
  }, []);

  const handleCloseDocumentModal = useCallback(() => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
  }, []);

  const handleSaveDemand = useCallback(
    (updatedData: Partial<Demanda>) => {
      if (selectedDemand) {
        updateDemanda(selectedDemand.id, updatedData);
        handleCloseDemandModal();
      }
    },
    [selectedDemand, updateDemanda, handleCloseDemandModal]
  );

  const handleSaveDocument = useCallback(
    (updatedData: Partial<DocumentoDemanda>) => {
      if (selectedDocument) {
        updateDocumento(selectedDocument.id, updatedData);
        handleCloseDocumentModal();
      }
    },
    [selectedDocument, updateDocumento, handleCloseDocumentModal]
  );

  const handleModalError = useCallback((error: string) => {
    console.error('Erro no modal:', error);
    // Aqui você pode adicionar notificação de erro se tiver um sistema de toast
  }, []);

  return (
    <div className={styles.homePage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <IoStatsChart size={32} className={styles.headerIcon} />
            <div>
              <h1>Dashboard Executivo</h1>
              <p>Visão geral das demandas e documentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Gestão Rápida */}
      <section className={styles.tablesSection}>
        {/* Filtros */}
        <div className={styles.filtersBar}>
          <h2>Gestão Rápida</h2>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Analista:</label>
              <SearchableSelect
                options={opcoesAnalistas}
                value={filtros.analista}
                onChange={analista =>
                  setFiltros(prev => ({ ...prev, analista }))
                }
                placeholder="Filtrar por analista..."
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Status:</label>
              <SearchableSelect
                options={opcoesStatus}
                value={
                  opcoesStatus.find(op => op.id === filtros.status) || null
                }
                onChange={status =>
                  setFiltros(prev => ({
                    ...prev,
                    status: status?.id.toString() || 'todos',
                  }))
                }
                placeholder="Filtrar por status..."
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Período:</label>
              <SearchableSelect
                options={opcoesPeriodo}
                value={
                  opcoesPeriodo.find(op => op.id === filtros.periodo) || null
                }
                onChange={periodo =>
                  setFiltros(prev => ({
                    ...prev,
                    periodo: periodo?.id.toString() || 'mes',
                  }))
                }
                placeholder="Selecionar período..."
              />
            </div>
          </div>
        </div>

        {/* Tabelas */}
        <div className={styles.tablesGrid}>
          {/* Tabela de Demandas */}
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                <IoFolder size={20} />
                <h3>Demandas ({demandasFiltradas.length})</h3>
              </div>
              <button
                className={styles.viewAllButton}
                onClick={() => navigate('/demandas')}
              >
                <IoEye size={16} />
                Ver Todas
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <Table
                data={demandasFiltradas}
                columns={colunasDemandas}
                onEdit={handleOpenDemandModal}
                emptyMessage="Nenhuma demanda encontrada com os filtros aplicados"
              />
            </div>
          </div>

          {/* Tabela de Documentos */}
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                <IoDocument size={20} />
                <h3>Documentos ({documentosFiltrados.length})</h3>
              </div>
              <button
                className={styles.viewAllButton}
                onClick={() => navigate('/documentos')}
              >
                <IoEye size={16} />
                Ver Todos
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <Table
                data={documentosFiltrados}
                columns={colunasDocumentos}
                onEdit={handleOpenDocumentModal}
                emptyMessage="Nenhum documento encontrado com os filtros aplicados"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Estatísticas */}
      <section className={styles.statsSection}>
        <div className={styles.statsHeader}>
          <h2>Estatísticas</h2>
          <div className={styles.analistaFilter}>
            <label>Filtrar por Analista:</label>
            <SearchableSelect
              options={opcoesAnalistas}
              value={analistaEstatisticas}
              onChange={setAnalistaEstatisticas}
              placeholder="Selecionar analista..."
            />
          </div>
        </div>

        <div className={styles.statsGrid}>
          {estatisticas.map(stat => (
            <div
              key={stat.id}
              className={`${styles.statCard} ${styles[stat.cor]}`}
            >
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stat.valor}</div>
                <div className={styles.statTitle}>{stat.titulo}</div>
                {stat.subtitulo && (
                  <div className={styles.statSubtitle}>{stat.subtitulo}</div>
                )}
                {stat.tendencia && (
                  <div
                    className={`${styles.statTrend} ${styles[stat.tendencia.direcao]}`}
                  >
                    <IoTrendingUp size={14} />
                    <span>+{stat.tendencia.valor}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modais */}
      {selectedDemand && (
        <DemandUpdateModal
          demanda={selectedDemand}
          isOpen={isDemandModalOpen}
          onClose={handleCloseDemandModal}
          onSave={handleSaveDemand}
          onError={handleModalError}
        />
      )}

      {selectedDocument && (
        <DocumentUpdateModal
          documento={selectedDocument}
          documentosDemanda={getDocumentosByDemandaId(
            selectedDocument.demandaId
          )}
          isOpen={isDocumentModalOpen}
          onClose={handleCloseDocumentModal}
          onSave={handleSaveDocument}
          onError={handleModalError}
          getDocumento={id => documentos.find(d => d.id === id)}
        />
      )}
    </div>
  );
}
