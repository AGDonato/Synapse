import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
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
  getDocumentStatus,
  getStatusColor,
} from '../utils/documentStatusUtils';
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
  analista: string[];
  referencia: string;
  documentos: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { demandas, updateDemanda } = useDemandas();
  const { documentos, updateDocumento, getDocumentosByDemandaId } =
    useDocumentos();
  const [filtros, setFiltros] = useState<FiltroTabelas>({
    analista: [],
    referencia: '',
    documentos: '',
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  const [analistaEstatisticas, setAnalistaEstatisticas] =
    useState<Option | null>(null);

  // Estados para os modais
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentoDemanda | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demanda | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);

  // Opções para os filtros de estatísticas
  const opcoesAnalistas: Option[] = useMemo(
    () =>
      mockAnalistas.map(analista => ({
        id: analista.nome,
        nome: analista.nome,
      })),
    []
  );

  // Dados filtrados para as tabelas - demandas não finalizadas e todos os documentos
  const demandasFiltradas = useMemo(() => {
    let resultado = [...demandas];

    // Filtrar apenas demandas que NÃO têm data de finalização (pendentes)
    resultado = resultado.filter((d: Demanda) => !d.dataFinal);

    if (filtros.analista.length > 0) {
      resultado = resultado.filter((d: Demanda) =>
        filtros.analista.includes(d.analista)
      );
    }

    // Filtro para Número de Referência
    if (filtros.referencia) {
      const termoBuscaReferencia = filtros.referencia.toLowerCase();
      resultado = resultado.filter((d: Demanda) => {
        return (
          d.sged.toLowerCase().includes(termoBuscaReferencia) ||
          (d.autosAdministrativos || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (d.autosJudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (d.autosExtrajudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (d.pic || '').toLowerCase().includes(termoBuscaReferencia)
        );
      });
    }

    // Filtro para Documentos
    if (filtros.documentos) {
      const termoBuscaDocumentos = filtros.documentos.toLowerCase();
      resultado = resultado.filter((d: Demanda) => {
        const documentosDaDemanda = getDocumentosByDemandaId(d.id);

        for (const documento of documentosDaDemanda) {
          // Buscar no código de rastreio geral
          if (
            documento.codigoRastreio
              ?.toLowerCase()
              .includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar nos códigos de rastreio individuais dos destinatários (Ofícios Circulares)
          if (
            documento.tipoDocumento === 'Ofício Circular' &&
            documento.destinatariosData
          ) {
            const hasMatchingDestinatarioRastreio =
              documento.destinatariosData.some(destinatario => {
                return (
                  destinatario.codigoRastreio &&
                  destinatario.codigoRastreio
                    .toLowerCase()
                    .includes(termoBuscaDocumentos)
                );
              });
            if (hasMatchingDestinatarioRastreio) {
              return true;
            }
          }

          // Buscar no hash da mídia
          if (
            documento.hashMidia?.toLowerCase().includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar no número ATENA
          if (
            documento.numeroAtena?.toLowerCase().includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar no número do documento
          if (
            documento.numeroDocumento
              ?.toLowerCase()
              .includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar nos identificadores das pesquisas
          for (const pesquisa of documento.pesquisas || []) {
            if (
              pesquisa.identificador
                ?.toLowerCase()
                .includes(termoBuscaDocumentos)
            ) {
              return true;
            }
          }
        }

        return false;
      });
    }

    return resultado;
  }, [demandas, filtros, getDocumentosByDemandaId]);

  const documentosFiltrados = useMemo(() => {
    const todosDocumentos = documentos;
    let resultado = [...todosDocumentos];

    // Primeiro filtrar por demandas ativas e analista
    if (filtros.analista.length > 0) {
      // Filtrar documentos por demandas do analista (só demandas não finalizadas)
      const demandasDoAnalista = demandas
        .filter(
          (d: Demanda) => filtros.analista.includes(d.analista) && !d.dataFinal
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

    // Filtro para Número de Referência (filtra por demanda associada)
    if (filtros.referencia) {
      const termoBuscaReferencia = filtros.referencia.toLowerCase();
      resultado = resultado.filter((doc: DocumentoDemanda) => {
        const demanda = demandas.find((d: Demanda) => d.id === doc.demandaId);
        if (!demanda) return false;

        return (
          demanda.sged.toLowerCase().includes(termoBuscaReferencia) ||
          (demanda.autosAdministrativos || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (demanda.autosJudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (demanda.autosExtrajudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (demanda.pic || '').toLowerCase().includes(termoBuscaReferencia)
        );
      });
    }

    // Filtro para Documentos
    if (filtros.documentos) {
      const termoBuscaDocumentos = filtros.documentos.toLowerCase();
      resultado = resultado.filter((doc: DocumentoDemanda) => {
        // Buscar no código de rastreio geral
        if (doc.codigoRastreio?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar nos códigos de rastreio individuais dos destinatários (Ofícios Circulares)
        if (doc.tipoDocumento === 'Ofício Circular' && doc.destinatariosData) {
          const hasMatchingDestinatarioRastreio = doc.destinatariosData.some(
            destinatario => {
              return (
                destinatario.codigoRastreio &&
                destinatario.codigoRastreio
                  .toLowerCase()
                  .includes(termoBuscaDocumentos)
              );
            }
          );
          if (hasMatchingDestinatarioRastreio) {
            return true;
          }
        }

        // Buscar no hash da mídia
        if (doc.hashMidia?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar no número ATENA
        if (doc.numeroAtena?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar no número do documento
        if (doc.numeroDocumento?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar nos identificadores das pesquisas
        for (const pesquisa of doc.pesquisas || []) {
          if (
            pesquisa.identificador?.toLowerCase().includes(termoBuscaDocumentos)
          ) {
            return true;
          }
        }

        return false;
      });
    }

    return resultado;
  }, [documentos, demandas, filtros]);

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
      width: '28.6%',
      render: (value, demanda) => (
        <span
          className={`${styles.tableNumber} ${styles.tableClickable}`}
          onClick={e => handleSgedClick(e, demanda)}
          style={{ color: '#007bff' }}
          title="Clique para ver detalhes da demanda"
        >
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '28.6%',
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
  ];

  // Função para obter abreviação do tipo de documento
  const getTipoDocumentoAbrev = useCallback((tipo: string): string => {
    const abreviacoes: { [key: string]: string } = {
      Ofício: 'OF',
      'Ofício Circular': 'OFC',
      'Autos Circunstanciados': 'AC',
      'Relatório Técnico': 'RT',
      'Relatório de Inteligência': 'RELINT',
      Mídia: 'MD',
    };
    return abreviacoes[tipo] || tipo.substring(0, 3).toUpperCase();
  }, []);

  // Função para renderizar o status do documento usando as cores corretas
  const renderDocumentStatus = useCallback((documento: DocumentoDemanda) => {
    const status = getDocumentStatus(documento);

    // Se não tem status, retorna vazio (sem indicador)
    if (status === 'Sem Status') {
      return null;
    }

    const backgroundColor = getStatusColor(status);

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
  }, []);

  // Configuração das colunas da tabela de documentos
  const colunasDocumentos: TableColumn<DocumentoDemanda>[] = [
    {
      key: 'numeroDocumento',
      label: 'Número',
      width: '31.25%',
      render: (value, documento) => (
        <span
          className={`${styles.tableNumber} ${styles.tableClickable}`}
          onClick={e => handleDocumentNumberClick(e, documento)}
          style={{ color: '#007bff' }}
          title="Clique para ver detalhes do documento"
        >
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'tipoDocumento',
      label: 'Tipo',
      width: '12.5%',
      align: 'center',
      render: value => (
        <span
          className={`${styles.tableText} ${styles.tipoAbrev}`}
          title={String(value || '')}
        >
          {getTipoDocumentoAbrev(String(value || ''))}
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
          title={String(value || '')}
        >
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'respondido' as keyof DocumentoDemanda,
      label: 'Status',
      width: '12.5%',
      align: 'center',
      render: (_, documento) => renderDocumentStatus(documento),
      customSort: (a, b, direction) => {
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
        const aValue = statusOrder[aStatus as keyof typeof statusOrder] || 999;
        const bValue = statusOrder[bStatus as keyof typeof statusOrder] || 999;

        const comparison = aValue - bValue;
        return direction === 'desc' ? -comparison : comparison;
      },
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

  const handleCreateDocument = useCallback(
    (demanda: Demanda) => {
      // Navegar para a página de criar documento com o SGED pré-preenchido
      navigate(`/documentos/novo?sged=${demanda.sged}`);
    },
    [navigate]
  );

  // Handler para clique no SGED da demanda
  const handleSgedClick = useCallback(
    (e: React.MouseEvent, demanda: Demanda) => {
      e.stopPropagation(); // Evita que o evento de linha seja acionado
      navigate(`/demandas/${demanda.id}`);
    },
    [navigate]
  );

  // Handler para clique no número do documento
  const handleDocumentNumberClick = useCallback(
    (e: React.MouseEvent, documento: DocumentoDemanda) => {
      e.stopPropagation(); // Evita que o evento de linha seja acionado
      navigate(`/documentos/${documento.id}`);
    },
    [navigate]
  );

  // Effect para fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
            <div className={`${styles.filterGroup} ${styles.filterGroupLarge}`}>
              <label>Número de Referência:</label>
              <input
                type="text"
                value={filtros.referencia}
                onChange={e =>
                  setFiltros(prev => ({ ...prev, referencia: e.target.value }))
                }
                placeholder="SGED, Autos, PIC..."
                className={styles.filterInput}
              />
            </div>
            <div className={`${styles.filterGroup} ${styles.filterGroupLarge}`}>
              <label>Documentos:</label>
              <input
                type="text"
                value={filtros.documentos}
                onChange={e =>
                  setFiltros(prev => ({ ...prev, documentos: e.target.value }))
                }
                placeholder="Código rastreio, ATENA..."
                className={styles.filterInput}
              />
            </div>
            <div className={`${styles.filterGroup} ${styles.filterGroupSmall}`}>
              <label>Analista:</label>
              <div className={styles.multiSelectContainer} ref={dropdownRef}>
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  tabIndex={0}
                >
                  <span>{getAnalistaDisplayText()}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownOpen ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownOpen && (
                  <div className={styles.multiSelectDropdown}>
                    {mockAnalistas.map(analista => (
                      <label key={analista.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filtros.analista.includes(analista.nome)}
                          onChange={() => handleAnalistaChange(analista.nome)}
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
        </div>

        {/* Tabelas */}
        <div className={styles.tablesGrid}>
          {/* Tabela de Documentos */}
          <div
            className={`${styles.tableContainer} ${styles.tableContainerLarge}`}
          >
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
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <div className={styles.customTableContainer}>
                <Table
                  data={documentosFiltrados}
                  columns={colunasDocumentos}
                  onEdit={handleOpenDocumentModal}
                  emptyMessage="Nenhum documento encontrado com os filtros aplicados"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Demandas */}
          <div
            className={`${styles.tableContainer} ${styles.tableContainerSmall}`}
          >
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
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <div className={styles.customTableContainer}>
                <Table
                  data={demandasFiltradas}
                  columns={colunasDemandas}
                  onEdit={handleOpenDemandModal}
                  onCreateDocument={handleCreateDocument}
                  emptyMessage="Nenhuma demanda encontrada com os filtros aplicados"
                />
              </div>
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
