// src/pages/DetalheDemandaPage.tsx
import { useState, useMemo, useCallback } from 'react';
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  type DocumentoDemanda,
  type RetificacaoDocumento,
  type PesquisaDocumento,
  type DestinatarioDocumento,
} from '../data/mockDocumentos';
import { useDemandas } from '../hooks/useDemandas';
import { useDocumentos } from '../contexts/DocumentosContext';
import {
  calculateDemandaStatus,
  getDemandaStatusColor,
} from '../utils/statusUtils';
import {
  getDocumentStatus,
  getStatusColor,
} from '../utils/documentStatusUtils';
import { getEnderecamentoAbreviado } from '../utils/enderecamentoUtils';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import DemandUpdateModal from '../components/demands/modals/DemandUpdateModal';
import Toast from '../components/ui/Toast';
import { IoTrashOutline } from 'react-icons/io5';
import { LiaEdit } from 'react-icons/lia';
import { RefreshCw } from 'lucide-react';
import { MdSearchOff } from 'react-icons/md';
import styles from './DetalheDemandaPage.module.css';

type SortConfig = {
  key: keyof DocumentoDemanda | 'respondido';
  direction: 'asc' | 'desc';
} | null;

// Função para calcular alvos dinâmicos baseado em CPF/CNPJ únicos
const calculateDynamicAlvos = (
  documentos: DocumentoDemanda[],
  originalAlvos: string | number
): number => {
  const uniqueIdentifiers = new Set<string>();

  documentos.forEach(doc => {
    doc.pesquisas.forEach(pesquisa => {
      const tipo = pesquisa.tipo.toLowerCase();
      if (tipo === 'cpf' || tipo === 'cnpj') {
        // Normalizar o identificador removendo pontos, traços e barras
        const normalized = pesquisa.identificador.replace(/[.\-/]/g, '');
        uniqueIdentifiers.add(normalized);
      }
    });
  });

  const calculatedAlvos = uniqueIdentifiers.size;
  const originalAlvosNum =
    typeof originalAlvos === 'string'
      ? parseInt(originalAlvos, 10)
      : originalAlvos;

  // Retorna o maior valor entre o original e o calculado
  return calculatedAlvos > originalAlvosNum
    ? calculatedAlvos
    : originalAlvosNum;
};

// Função para calcular identificadores dinâmicos baseado em TODOS os identificadores únicos
const calculateDynamicIdentificadores = (
  documentos: DocumentoDemanda[],
  originalIdentificadores: string | number
): number => {
  const uniqueIdentifiers = new Set<string>();

  documentos.forEach(doc => {
    doc.pesquisas.forEach(pesquisa => {
      // Normalizar o identificador removendo espaços e caracteres especiais para comparação
      const normalized = pesquisa.identificador
        .trim()
        .toLowerCase()
        .replace(/[.\-/\s()]/g, '');
      if (normalized) {
        // Só adiciona se não for string vazia
        uniqueIdentifiers.add(normalized);
      }
    });
  });

  const calculatedIdentificadores = uniqueIdentifiers.size;
  const originalIdentificadoresNum =
    typeof originalIdentificadores === 'string'
      ? parseInt(originalIdentificadores, 10)
      : originalIdentificadores;

  // Retorna o maior valor entre o original e o calculado
  return calculatedIdentificadores > originalIdentificadoresNum
    ? calculatedIdentificadores
    : originalIdentificadoresNum;
};

// Função para calcular tempo total considerando reabertura
const calculateTotalTime = (demanda: {
  dataInicial: string;
  dataFinal?: string | null;
  dataReabertura?: string | null;
  novaDataFinal?: string | null;
}): string => {
  // Validação básica
  if (!demanda || !demanda.dataInicial) {
    return '--';
  }

  const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

  // Função auxiliar para calcular dias entre duas datas
  const daysBetween = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;

    // Converter formato DD/MM/YYYY para YYYY-MM-DD se necessário
    const convertDate = (dateStr: string): string => {
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateStr;
    };

    const startISO = convertDate(startDate);
    const endISO = convertDate(endDate);

    const start = new Date(startISO);
    const end = new Date(endISO);

    // Verificar se as datas são válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  let totalDays = 0;

  // Período inicial (sempre existe)
  const dataInicial = demanda.dataInicial;
  const dataFinal = demanda.dataFinal;

  if (demanda.dataReabertura) {
    // Demanda foi reaberta
    // Período 1: Data Final (original) - Data Inicial
    if (dataFinal) {
      totalDays += daysBetween(dataInicial, dataFinal);
    }

    // Período 2: (Nova Data Final ou Hoje) - Data de Reabertura
    const dataReabertura = demanda.dataReabertura;
    const novaDataFinal = demanda.novaDataFinal;

    if (novaDataFinal) {
      // Finalizada novamente
      totalDays += daysBetween(dataReabertura, novaDataFinal);
    } else {
      // Ainda em andamento após reabertura
      totalDays += daysBetween(dataReabertura, today);
    }
  } else {
    // Demanda normal (sem reabertura)
    if (dataFinal) {
      // Finalizada
      totalDays += daysBetween(dataInicial, dataFinal);
    } else {
      // Em andamento
      totalDays += daysBetween(dataInicial, today);
    }
  }

  // Verificar se o resultado é válido
  if (isNaN(totalDays) || totalDays < 0) {
    return '--';
  }

  return `${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`;
};

export default function DetalheDemandaPage() {
  const { demandaId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { demandas, deleteDemanda, updateDemanda } = useDemandas();
  const { getDocumentosByDemandaId, documentos } = useDocumentos();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Função para construir URL de volta baseada nos parâmetros preservados
  const getBackUrl = () => {
    const returnTo = searchParams.get('returnTo');

    if (returnTo === 'list') {
      // Reconstruir a URL da lista com todos os parâmetros preservados
      const listParams = new URLSearchParams();

      // Copiar todos os parâmetros exceto 'returnTo'
      for (const [key, value] of searchParams.entries()) {
        if (key !== 'returnTo') {
          listParams.set(key, value);
        }
      }

      const queryString = listParams.toString();
      return queryString ? `/demandas?${queryString}` : '/demandas';
    }

    return '/demandas';
  };

  // Estados de paginação para documentos
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const demanda = demandas.find(
    demandaItem => demandaItem.id === parseInt(demandaId || '')
  );
  const allDocumentosDemanda = getDocumentosByDemandaId(
    parseInt(demandaId || '')
  );

  const filteredDocumentos = allDocumentosDemanda.filter(doc => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      doc.numeroDocumento.toLowerCase().includes(searchLower) ||
      doc.enderecamento.toLowerCase().includes(searchLower)
    );
  });

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

  // Dados ordenados e paginados
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
        aValue = getDocumentStatus(a);
        bValue = getDocumentStatus(b);
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
      // Comparação para booleans (respondido)
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

  // Cálculos de paginação
  const totalItems = sortedDocumentos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const documentosDemanda = sortedDocumentos.slice(startIndex, endIndex);

  // Handlers de paginação
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  // Reset current page when search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleDeleteDemanda = () => {
    if (confirm('Tem certeza que deseja excluir esta demanda?')) {
      deleteDemanda(parseInt(demandaId || ''));
      navigate('/demandas');
    }
  };

  // These functions are prepared for future use when document editing is implemented
  // const handleDeleteDocumento = (documentoId: number) => {
  //   if (confirm('Tem certeza que deseja excluir este documento?')) {
  //     console.log(`Excluindo documento ${documentoId}`);
  //   }
  // };

  // const handleUpdateDocumento = (documentoId: number) => {
  //   console.log(`Atualizando documento ${documentoId}`);
  // };

  const handleUpdateDemanda = () => {
    setIsUpdateModalOpen(true);
  };

  const handleSaveDemandaUpdate = (
    updateData: Partial<{
      dataFinal: string | null;
      dataReabertura: string | null;
      novaDataFinal: string | null;
      status: 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';
      observacoes?: string;
    }>
  ) => {
    if (demandaId) {
      updateDemanda(parseInt(demandaId), updateData);
      setToastMessage('Demanda atualizada com sucesso!');
      setToastType('success');
      setShowToast(true);
    }
  };

  const handleDemandaUpdateError = (errorMessage: string) => {
    setToastMessage(errorMessage);
    setToastType('error');
    setShowToast(true);
  };

  const handleCancelUpdate = () => {
    setIsUpdateModalOpen(false);
  };

  const handleNovoDocumento = () => {
    // Verificar se a demanda está finalizada
    if (demanda?.status === 'Finalizada') {
      setToastMessage(
        'Não é possível criar documentos em demandas finalizadas.'
      );
      setToastType('error');
      setShowToast(true);
      return;
    }

    navigate(`/documentos/novo?demandaId=${demandaId}`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleDocumentRowClick = (documentoId: number) => {
    navigate(
      `/documentos/${documentoId}?returnTo=demanda&demandaId=${demandaId}`
    );
  };

  const getStatusIndicator = (documento: DocumentoDemanda) => {
    const status = getDocumentStatus(documento);

    // Se não tem status, não exibe indicador
    if (status === 'Sem Status') {
      return null;
    }

    return (
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: getStatusColor(status),
          borderRadius: '50%',
          margin: '0 auto',
        }}
        title={status}
      />
    );
  };

  if (!demanda) {
    return (
      <div className={styles.detalheContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1>
              <div className={styles.pageHeaderIcon}>📋</div>
              <span>Detalhe da Demanda - Não Encontrada</span>
            </h1>
          </div>
          <Link to={getBackUrl()} className={styles.btnHeaderBack}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            Voltar
          </Link>
        </div>
        <p>Não foi possível encontrar uma demanda com o ID fornecido.</p>
      </div>
    );
  }

  return (
    <div className={styles.detalheContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>
            <div className={styles.titleWithStatus}>
              <div
                className={styles.statusIndicator}
                style={{
                  backgroundColor: getDemandaStatusColor(
                    calculateDemandaStatus(demanda, documentos)
                  ),
                }}
                title={calculateDemandaStatus(demanda, documentos)}
              />
              <span>Detalhe da Demanda - SGED {demanda.sged}</span>
            </div>
            <div className={styles.actionButtons}>
              <button
                onClick={handleUpdateDemanda}
                className={`${styles.iconButton} ${styles.updateButton}`}
                title="Atualizar Demanda"
              >
                <RefreshCw size={20} />
              </button>
              <Link
                to={`/demandas/${demanda.id}/editar?returnTo=detail`}
                className={styles.iconButton}
                title="Editar Demanda"
              >
                <LiaEdit size={20} />
              </Link>
              <button
                onClick={handleDeleteDemanda}
                className={styles.iconButton}
                title="Excluir Demanda"
              >
                <IoTrashOutline size={20} />
              </button>
            </div>
          </h1>
        </div>
        <Link to={getBackUrl()} className={styles.btnHeaderBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
          Voltar
        </Link>
      </div>

      <div className={styles.cardsGrid}>
        <div
          className={`${styles.infoCard} ${styles.blue} ${styles.cardBasicas}`}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Informações Básicas</h3>
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tipo de Demanda</dt>
              <dd className={styles.infoValue}>{demanda.tipoDemanda}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Solicitante</dt>
              <dd className={styles.infoValue}>{demanda.orgao}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Descrição</dt>
              <dd className={styles.infoValue}>{demanda.descricao}</dd>
            </div>
          </dl>
        </div>

        <div
          className={`${styles.infoCard} ${styles.green} ${styles.cardReferencias}`}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Referências</h3>
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>SGED</dt>
              <dd className={styles.infoValue}>{demanda.sged}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Autos Administrativos</dt>
              <dd className={styles.infoValue}>
                {demanda.autosAdministrativos || '--'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>PIC</dt>
              <dd className={styles.infoValue}>{demanda.pic || '--'}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Autos Judiciais</dt>
              <dd className={styles.infoValue}>
                {demanda.autosJudiciais || '--'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Autos Extrajudiciais</dt>
              <dd className={styles.infoValue}>
                {demanda.autosExtrajudiciais || '--'}
              </dd>
            </div>
          </dl>
        </div>

        <div
          className={`${styles.infoCard} ${styles.purple} ${styles.cardResponsaveis}`}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Responsáveis</h3>
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Analista</dt>
              <dd className={styles.infoValue}>{demanda.analista}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Distribuidor</dt>
              <dd className={styles.infoValue}>
                {demanda.distribuidor || '--'}
              </dd>
            </div>
          </dl>
        </div>

        <div
          className={`${styles.infoCard} ${styles.orange} ${styles.cardDatas}`}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Datas</h3>
          </div>
          <div className={styles.datasContent}>
            <div className={styles.datasColumn}>
              <dl className={styles.infoList}>
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Data Inicial</dt>
                  <dd className={styles.infoValue}>
                    {formatDateToDDMMYYYYOrPlaceholder(
                      demanda.dataInicial,
                      '--'
                    )}
                  </dd>
                </div>
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Data Final</dt>
                  <dd className={styles.infoValue}>
                    {formatDateToDDMMYYYYOrPlaceholder(demanda.dataFinal, '--')}
                  </dd>
                </div>
              </dl>
            </div>
            {demanda.dataReabertura && (
              <div className={styles.datasColumn}>
                <dl className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Data de Reabertura</dt>
                    <dd className={styles.infoValue}>
                      {formatDateToDDMMYYYYOrPlaceholder(
                        demanda.dataReabertura,
                        '--'
                      )}
                    </dd>
                  </div>
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Nova Data Final</dt>
                    <dd className={styles.infoValue}>
                      {formatDateToDDMMYYYYOrPlaceholder(
                        demanda.novaDataFinal || null,
                        '--'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas - linha horizontal */}
      <div className={styles.statisticsSection}>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{allDocumentosDemanda.length}</p>
          <p className={styles.statLabel}>Documentos</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>
            {demanda.alvos !== null && demanda.alvos !== undefined
              ? calculateDynamicAlvos(allDocumentosDemanda, demanda.alvos)
              : '--'}
          </p>
          <p className={styles.statLabel}>Alvos</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>
            {demanda.identificadores !== null &&
            demanda.identificadores !== undefined
              ? calculateDynamicIdentificadores(
                  allDocumentosDemanda,
                  demanda.identificadores
                )
              : '--'}
          </p>
          <p className={styles.statLabel}>Identificadores</p>
        </div>
        <div className={styles.statCard}>
          <p
            className={styles.statNumber}
            style={{
              color: getDemandaStatusColor(
                calculateDemandaStatus(demanda, documentos)
              ),
            }}
          >
            {calculateTotalTime(demanda)}
          </p>
          <p className={styles.statLabel}>Tempo</p>
        </div>
      </div>

      <div className={styles.documentsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
            </svg>
            Lista de Documentos
          </h2>
          <button className={styles.btnPrimary} onClick={handleNovoDocumento}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            Novo Documento
          </button>
        </div>

        <div className={styles.documentControls}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              className={styles.documentSearchInput}
              placeholder="Buscar por número ou endereçamento..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
            />
            <button
              onClick={handleClearSearch}
              disabled={!searchTerm.trim()}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: searchTerm.trim() ? 'pointer' : 'not-allowed',
                color: searchTerm.trim() ? '#666' : '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MdSearchOff size={20} />
            </button>
          </div>
        </div>

        {documentosDemanda.length > 0 ? (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => handleSort('numeroDocumento')}
                      className={styles.sortableHeader}
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
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('tipoDocumento')}
                      className={styles.sortableHeader}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Tipo
                        {getSortIcon('tipoDocumento')}
                      </div>
                    </th>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('assunto')}
                      className={styles.sortableHeader}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Assunto
                        {getSortIcon('assunto')}
                      </div>
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => handleSort('enderecamento')}
                      className={styles.sortableHeader}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Endereçamento
                        {getSortIcon('enderecamento')}
                      </div>
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => handleSort('respondido')}
                      className={styles.sortableHeader}
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
                  {documentosDemanda.map(doc => (
                    <tr
                      key={doc.id}
                      onClick={() => handleDocumentRowClick(doc.id)}
                      style={{ cursor: 'pointer' }}
                      className={styles.tableRow}
                    >
                      <td style={{ textAlign: 'center' }}>
                        {doc.numeroDocumento}
                      </td>
                      <td>{doc.tipoDocumento}</td>
                      <td>
                        {doc.assunto === 'Outros'
                          ? doc.assuntoOutros || doc.assunto
                          : doc.assunto}
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        {getEnderecamentoAbreviado(doc.enderecamento)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getStatusIndicator(doc)}
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
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    tabIndex={0}
                    onKeyDown={e => {
                      const options = ['5', '10', '20'];

                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!dropdownOpen) {
                          setDropdownOpen(true);
                          setFocusedIndex(
                            options.indexOf(String(itemsPerPage))
                          );
                        } else if (focusedIndex >= 0) {
                          handleItemsPerPageChange(
                            Number(options[focusedIndex])
                          );
                          setDropdownOpen(false);
                          setFocusedIndex(-1);
                        }
                      } else if (e.key === 'Tab') {
                        // Fechar dropdown quando navegar com Tab
                        setDropdownOpen(false);
                        setFocusedIndex(-1);
                      } else if (e.key === 'Escape') {
                        setDropdownOpen(false);
                        setFocusedIndex(-1);
                      } else if (dropdownOpen) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedIndex(prev =>
                            prev === -1
                              ? 0
                              : prev < options.length - 1
                                ? prev + 1
                                : 0
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedIndex(prev =>
                            prev === -1
                              ? options.length - 1
                              : prev > 0
                                ? prev - 1
                                : options.length - 1
                          );
                        }
                      }
                    }}
                    onBlur={e => {
                      setTimeout(() => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        const currentDropdown = e.currentTarget.closest(
                          `.${styles.multiSelectContainer}`
                        );
                        if (
                          !relatedTarget ||
                          !currentDropdown?.contains(relatedTarget)
                        ) {
                          setDropdownOpen(false);
                          setFocusedIndex(-1);
                        }
                      }, 0);
                    }}
                  >
                    <span>{itemsPerPage}</span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen && (
                    <div className={styles.multiSelectDropdownUp} tabIndex={-1}>
                      {['5', '10', '20'].map((value, index) => (
                        <label
                          key={value}
                          className={`${styles.checkboxLabel} ${
                            focusedIndex === index
                              ? styles.checkboxLabelFocused
                              : ''
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            handleItemsPerPageChange(Number(value));
                            setDropdownOpen(false);
                            setFocusedIndex(-1);
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
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Próxima &raquo;
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.noResults}>
            {searchTerm.trim()
              ? `Nenhum documento encontrado para "${searchTerm}"`
              : 'Nenhum documento foi gerado para esta demanda ainda.'}
          </div>
        )}
      </div>

      {/* Modal modular para atualizar demanda */}
      <DemandUpdateModal
        demanda={demanda}
        isOpen={isUpdateModalOpen}
        onClose={handleCancelUpdate}
        onSave={handleSaveDemandaUpdate}
        onError={handleDemandaUpdateError}
      />

      {/* Toast para notificações */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
