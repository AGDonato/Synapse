// src/pages/DetalheDemandaPage.tsx
import { useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  mockDocumentosDemanda,
  type DocumentoDemanda,
} from '../data/mockDocumentos';
import { useDemandas } from '../hooks/useDemandas';
import { calculateDemandaStatus } from '../utils/statusUtils';
import {
  formatDateToDDMMYYYYOrPlaceholder,
  calculateDaysBetweenDates,
} from '../utils/dateUtils';
import Modal from '../components/ui/Modal';
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

export default function DetalheDemandaPage() {
  const { demandaId } = useParams();
  const navigate = useNavigate();
  const { demandas, deleteDemanda, updateDemanda } = useDemandas();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [finalDateFormatted, setFinalDateFormatted] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const demanda = demandas.find((d) => d.id === parseInt(demandaId || ''));
  const allDocumentosDemanda = mockDocumentosDemanda.filter(
    (doc) => doc.demandaId === parseInt(demandaId || '')
  );

  const filteredDocumentos = allDocumentosDemanda.filter((doc) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      doc.numeroDocumento.toLowerCase().includes(searchLower) ||
      doc.destinatario.toLowerCase().includes(searchLower)
    );
  });

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

  // Dados ordenados
  const documentosDemanda = useMemo(() => {
    if (!sortConfig) {
      return filteredDocumentos;
    }

    return [...filteredDocumentos].sort((a, b) => {
      let aValue: string | number | boolean | null | undefined;
      let bValue: string | number | boolean | null | undefined;

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

      // Comparação para booleans (respondido)
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
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
    const currentFinalDate = demanda?.dataFinal || '';
    // Convert YYYY-MM-DD to DD/MM/YYYY for display
    if (currentFinalDate && currentFinalDate.includes('-')) {
      const parts = currentFinalDate.split('-');
      if (parts.length === 3) {
        const formatted = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        setFinalDateFormatted(formatted);
      }
    } else {
      setFinalDateFormatted(currentFinalDate);
    }
  };

  const handleSaveDataFinal = () => {
    if (demandaId) {
      // Validate if there's a date and it's valid
      if (finalDateFormatted && !validateDate(finalDateFormatted)) {
        return;
      }

      // Convert DD/MM/YYYY to YYYY-MM-DD for storage (only if there's a date)
      let isoDate = null;
      if (finalDateFormatted) {
        const parts = finalDateFormatted.split('/');
        isoDate =
          parts.length === 3
            ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
            : finalDateFormatted;
      }

      updateDemanda(parseInt(demandaId), {
        dataFinal: isoDate,
        status: isoDate
          ? ('Finalizada' as const)
          : demanda?.status || 'Em Andamento', // Only change status if date is provided
      });
      setIsUpdateModalOpen(false);
    }
  };

  const handleCancelUpdate = () => {
    setIsUpdateModalOpen(false);
    setFinalDateFormatted('');
  };

  // Date handling functions (same as Nova Demanda)
  const formatDateMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const convertToHTMLDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length < 10) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  const convertFromHTMLDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return '';
  };

  const validateDate = (finalDate: string) => {
    if (!finalDate || !demanda?.dataInicial) {
      return true;
    }

    try {
      // Convert both dates to Date objects for comparison
      const parseDate = (dateStr: string) => {
        if (dateStr.includes('/')) {
          // DD/MM/YYYY format
          const [day, month, year] = dateStr.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (dateStr.includes('-')) {
          // YYYY-MM-DD or DD-MM-YYYY format
          const parts = dateStr.split('-');
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            return new Date(dateStr);
          } else {
            // DD-MM-YYYY format
            const [day, month, year] = parts;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }
        return null;
      };

      const finalDateObj = parseDate(finalDate);
      const initialDateObj = parseDate(demanda.dataInicial);

      if (!finalDateObj || !initialDateObj) {
        return true; // If we can't parse dates, allow it
      }

      // Validate against initial date
      if (finalDateObj < initialDateObj) {
        setToastMessage('A data final não pode ser menor que a data inicial.');
        setShowToast(true);
        return false;
      }

      // Validate against current date - final date cannot be in the future
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const finalDateNormalized = new Date(finalDateObj);
      finalDateNormalized.setHours(0, 0, 0, 0);

      if (finalDateNormalized > currentDate) {
        setToastMessage('A data final não pode ser posterior ao dia atual.');
        setShowToast(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating date:', error);
      return true; // If there's an error, allow the operation
    }
  };

  const handleFinalDateChange = (value: string) => {
    const formatted = formatDateMask(value);
    setFinalDateFormatted(formatted);
  };

  const handleFinalCalendarChange = (value: string) => {
    const formatted = convertFromHTMLDate(value);
    setFinalDateFormatted(formatted);
  };

  const handleNovoDocumento = () => {
    navigate(`/documentos/novo?demandaId=${demandaId}`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const getStatusIndicator = (respondido: boolean) => {
    return (
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: respondido ? '#28a745' : '#dc3545',
          borderRadius: '50%',
          margin: '0 auto',
        }}
        title={respondido ? 'Respondido' : 'Pendente'}
      />
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Em Andamento': '#f59e0b', // Amarelo mais claro
      Finalizada: '#10b981', // Verde mais claro
      'Fila de Espera': '#6b7280', // Cinza mais claro
      Aguardando: '#ef4444', // Vermelho mais claro
    };

    return colors[status as keyof typeof colors] || '#374151';
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
          <Link to='/demandas' className={styles.btnHeaderBack}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path
                fillRule='evenodd'
                d='M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z'
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
            <span>Detalhe da Demanda - SGED {demanda.sged}</span>
            <div className={styles.actionButtons}>
              <button
                onClick={handleUpdateDemanda}
                className={`${styles.iconButton} ${styles.updateButton}`}
                title='Atualizar Demanda'
              >
                <RefreshCw size={20} />
              </button>
              <Link
                to={`/demandas/${demanda.id}/editar?returnTo=detail`}
                className={styles.iconButton}
                title='Editar Demanda'
              >
                <LiaEdit size={20} />
              </Link>
              <button
                onClick={handleDeleteDemanda}
                className={styles.iconButton}
                title='Excluir Demanda'
              >
                <IoTrashOutline size={20} />
              </button>
            </div>
          </h1>
        </div>
        <Link to='/demandas' className={styles.btnHeaderBack}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            fill='currentColor'
            viewBox='0 0 16 16'
          >
            <path
              fillRule='evenodd'
              d='M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z'
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
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                  clipRule='evenodd'
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
              <dd className={styles.infoValue}>{demanda.assunto}</dd>
            </div>
          </dl>
        </div>

        <div
          className={`${styles.infoCard} ${styles.green} ${styles.cardReferencias}`}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                <path
                  fillRule='evenodd'
                  d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
                  clipRule='evenodd'
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
                {demanda.autosAdministrativos}
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
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z'
                  clipRule='evenodd'
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
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Datas</h3>
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data Inicial</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(demanda.dataInicial, '--')}
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
      </div>

      {/* Estatísticas - linha horizontal */}
      <div className={styles.statisticsSection}>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{allDocumentosDemanda.length}</p>
          <p className={styles.statLabel}>Documentos</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{demanda.alvos || '--'}</p>
          <p className={styles.statLabel}>Alvos</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{demanda.identificadores || '--'}</p>
          <p className={styles.statLabel}>Identificadores</p>
        </div>
        <div className={styles.statCard}>
          <p
            className={styles.statNumber}
            style={{
              color: getStatusColor(
                calculateDemandaStatus(demanda, mockDocumentosDemanda)
              ),
            }}
          >
            {calculateDaysBetweenDates(demanda.dataInicial, demanda.dataFinal)}
          </p>
          <p className={styles.statLabel}>Tempo</p>
        </div>
      </div>

      <div className={styles.documentsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='20'
              height='20'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path d='M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z' />
            </svg>
            Lista de Documentos
          </h2>
          <button className={styles.btnPrimary} onClick={handleNovoDocumento}>
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
          </button>
        </div>

        <div className={styles.documentControls}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type='text'
              className={styles.documentSearchInput}
              placeholder='Buscar por número ou destinatário...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('destinatario')}
                    className={styles.sortableHeader}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Destinatário
                      {getSortIcon('destinatario')}
                    </div>
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('dataEnvio')}
                    className={styles.sortableHeader}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Envio
                      {getSortIcon('dataEnvio')}
                    </div>
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('dataResposta')}
                    className={styles.sortableHeader}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Resposta
                      {getSortIcon('dataResposta')}
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
                {documentosDemanda.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ textAlign: 'center' }}>
                      {doc.numeroDocumento}
                    </td>
                    <td>{doc.tipoDocumento}</td>
                    <td style={{ textAlign: 'left' }}>{doc.destinatario}</td>
                    <td style={{ textAlign: 'center' }}>
                      {formatDateToDDMMYYYYOrPlaceholder(doc.dataEnvio)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {formatDateToDDMMYYYYOrPlaceholder(doc.dataResposta)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {getStatusIndicator(doc.respondido)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.paginationControls}>
              <div className={styles.itemsPerPageSelector}>
                <label>Itens por página:</label>
                <select defaultValue='5'>
                  <option value='5'>5</option>
                  <option value='10'>10</option>
                  <option value='25'>25</option>
                </select>
              </div>
              <div className={styles.pageNavigation}>
                <button disabled>&laquo; Anterior</button>
                <span className={styles.pageInfo}>Página 1 de 1</span>
                <button disabled>Próxima &raquo;</button>
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

      {/* Modal para atualizar data final */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={handleCancelUpdate}
        title={`Atualizar SGED ${demanda.sged}`}
      >
        <div className={styles.modalContent}>
          <div className={styles.formSection}>
            <div className={styles.sectionContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data Final</label>
                <div className={styles.dateInputWrapper}>
                  <input
                    type='text'
                    value={finalDateFormatted}
                    onChange={(e) => handleFinalDateChange(e.target.value)}
                    className={styles.formInput}
                    placeholder='dd/mm/aaaa'
                    maxLength={10}
                  />
                  <input
                    type='date'
                    value={convertToHTMLDate(finalDateFormatted)}
                    onChange={(e) => handleFinalCalendarChange(e.target.value)}
                    className={styles.hiddenDateInput}
                    tabIndex={-1}
                  />
                  <button
                    type='button'
                    className={styles.calendarButton}
                    onClick={(e) => {
                      const wrapper = e.currentTarget.parentElement;
                      const dateInput = wrapper?.querySelector(
                        'input[type="date"]'
                      ) as HTMLInputElement;
                      if (dateInput && dateInput.showPicker) {
                        dateInput.showPicker();
                      }
                    }}
                    title='Abrir calendário'
                  >
                    📅
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button
              onClick={handleSaveDataFinal}
              className={styles.submitButton}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast para notificações */}
      <Toast
        message={toastMessage}
        type='error'
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
