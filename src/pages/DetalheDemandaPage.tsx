// src/pages/DetalheDemandaPage.tsx
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockDemandas } from '../data/mockDemandas';
import { mockDocumentosDemanda } from '../data/mockDocumentos';
import { useDemandas } from '../hooks/useDemandas';
import {
  formatDateToDDMMYYYY,
  formatDateToDDMMYYYYOrPlaceholder,
  calculateDaysBetweenDates,
} from '../utils/dateUtils';
import styles from './DetalheDemandaPage.module.css';

export default function DetalheDemandaPage() {
  const { demandaId } = useParams();
  const navigate = useNavigate();
  const { deleteDemanda } = useDemandas();
  const [searchTerm, setSearchTerm] = useState('');

  const demanda = mockDemandas.find((d) => d.id === parseInt(demandaId || ''));
  const allDocumentosDemanda = mockDocumentosDemanda.filter(
    (doc) => doc.demandaId === parseInt(demandaId || '')
  );

  const documentosDemanda = allDocumentosDemanda.filter((doc) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      doc.numeroDocumento.toLowerCase().includes(searchLower) ||
      doc.destinatario.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteDemanda = () => {
    if (confirm('Tem certeza que deseja excluir esta demanda?')) {
      deleteDemanda(parseInt(demandaId || ''));
      navigate('/demandas');
    }
  };

  const handleDeleteDocumento = (documentoId: number) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      console.log(`Excluindo documento ${documentoId}`);
    }
  };

  const handleUpdateDocumento = (documentoId: number) => {
    console.log(`Atualizando documento ${documentoId}`);
  };

  const handleNovoDocumento = () => {
    navigate(`/documentos/novo?demandaId=${demandaId}`);
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

  const getStatusBadgeStyle = (status: string) => {
    const colors = {
      'Em Andamento': {
        backgroundColor: '#fff3cd',
        color: '#856404',
        borderColor: '#fbbf24',
      },
      Finalizada: {
        backgroundColor: '#d4edda',
        color: '#155724',
        borderColor: '#10b981',
      },
      'Fila de Espera': {
        backgroundColor: '#f8f9fa',
        color: '#495057',
        borderColor: '#6b7280',
      },
      Aguardando: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderColor: '#ef4444',
      },
    };

    return {
      ...colors[status as keyof typeof colors],
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '600',
      border: `1px solid ${colors[status as keyof typeof colors]?.borderColor || '#6b7280'}`,
      marginLeft: '1rem',
      display: 'inline-block',
    };
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
            <span
              className={styles.statusBadge}
              style={getStatusBadgeStyle(demanda.status)}
            >
              {demanda.status}
            </span>
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

      {/* Botões de Ação */}
      <div className={styles.actionButtons}>
        <button onClick={handleDeleteDemanda} className={styles.deleteButton}>
          Excluir Demanda
        </button>
        <Link
          to={`/demandas/${demanda.id}/editar`}
          className={styles.editButton}
        >
          Editar Demanda
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
              <dt className={styles.infoLabel}>Órgão Solicitante</dt>
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
              <dd className={styles.infoValue}>--</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Autos Judiciais</dt>
              <dd className={styles.infoValue}>--</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Autos Extrajudiciais</dt>
              <dd className={styles.infoValue}>--</dd>
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
              <dd className={styles.infoValue}>--</dd>
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
                {formatDateToDDMMYYYY(demanda.dataInicial)}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data Final</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(
                  demanda.dataFinal,
                  'Em andamento'
                )}
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
          <p className={styles.statNumber}>--</p>
          <p className={styles.statLabel}>Alvos</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>--</p>
          <p className={styles.statLabel}>Identificadores</p>
        </div>
        <div className={styles.statCard}>
          <p
            className={styles.statNumber}
            style={{ color: getStatusColor(demanda.status) }}
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
          <div className={styles.documentSearch}>
            <span className={styles.icon}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                  clipRule='evenodd'
                />
              </svg>
            </span>
            <input
              type='text'
              className={styles.documentSearchInput}
              placeholder='Buscar por número ou destinatário...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {documentosDemanda.length > 0 ? (
          <>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Número</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'left' }}>Destinatário</th>
                  <th style={{ textAlign: 'center' }}>Envio</th>
                  <th style={{ textAlign: 'center' }}>Resposta</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
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
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteDocumento(doc.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          marginRight: '0.5rem',
                        }}
                      >
                        🗑️ Excluir
                      </button>
                      <button
                        onClick={() => handleUpdateDocumento(doc.id)}
                        style={{
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}
                        title='Atualizar documento'
                      >
                        ✏️ Atualizar
                      </button>
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
    </div>
  );
}
