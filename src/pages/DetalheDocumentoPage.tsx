import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentos } from '../contexts/DocumentosContext';
import type { DocumentoDemanda } from '../data/mockDocumentos';
// import { useDemandas } from '../hooks/useDemandas';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import { IoTrashOutline } from 'react-icons/io5';
import { LiaEdit } from 'react-icons/lia';
import { RefreshCw } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import styles from './DetalheDocumentoPage.module.css';

export default function DetalheDocumentoPage() {
  const { documentoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // const { demandas } = useDemandas();
  const { getDocumento, updateDocumento, deleteDocumento } = useDocumentos();
  
  // Detectar de onde o usuário veio
  const returnTo = searchParams.get('returnTo');
  const demandaId = searchParams.get('demandaId');
  
  // Estados para modais e toast
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Estados para os campos do modal
  const [dataEnvio, setDataEnvio] = useState('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [dataResposta, setDataResposta] = useState('');
  const [dataFinalizacao, setDataFinalizacao] = useState('');
  const [apresentouDefeito, setApresentouDefeito] = useState(false);
  // const [selectedRelatorios, setSelectedRelatorios] = useState<string[]>([]);
  // const [selectedMidias, setSelectedMidias] = useState<string[]>([]);
  const [selectedDecisoes, setSelectedDecisoes] = useState<string[]>([]);
  
  // Função para determinar para onde voltar
  const getBackUrl = () => {
    if (returnTo === 'demanda' && demandaId) {
      return `/demandas/${demandaId}`;
    }
    return '/documentos';
  };

  // Funções de ação
  const handleUpdateDocumento = () => {
    setIsUpdateModalOpen(true);
  };
  
  const handleSaveUpdate = () => {
    if (documentoId) {
      // Preparar dados de atualização baseados no modal
      const updateData: Partial<DocumentoDemanda> = {};
      
      if (dataEnvio) updateData.dataEnvio = dataEnvio;
      if (dataResposta) updateData.dataResposta = dataResposta;
      // Outras propriedades podem ser adicionadas conforme necessário
      
      updateDocumento(parseInt(documentoId), updateData);
      setIsUpdateModalOpen(false);
      setToastMessage('Documento atualizado com sucesso!');
      setToastType('success');
      setShowToast(true);
      
      // Limpar campos
      setDataEnvio('');
      setCodigoRastreio('');
      setDataResposta('');
      setDataFinalizacao('');
      setApresentouDefeito(false);
      // setSelectedRelatorios([]);
      // setSelectedMidias([]);
      setSelectedDecisoes([]);
    }
  };

  // Função para renderizar o conteúdo específico do modal
  const renderModalContent = () => {
    const modalType = getModalType();
    
    switch (modalType) {
      case 'finalizacao':
        return (
          <div className={styles.formGroup}>
            <label htmlFor="dataFinalizacao" className={styles.formLabel}>
              Data de Finalização *
            </label>
            <input
              type="date"
              id="dataFinalizacao"
              value={dataFinalizacao}
              onChange={(e) => setDataFinalizacao(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>
        );
        
      case 'midia':
        return (
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={apresentouDefeito}
                onChange={(e) => setApresentouDefeito(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Apresentou Defeito</span>
            </label>
          </div>
        );
        
      case 'oficio':
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="dataEnvio" className={styles.formLabel}>
                Data de Envio
              </label>
              <input
                type="date"
                id="dataEnvio"
                value={dataEnvio}
                onChange={(e) => setDataEnvio(e.target.value)}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="codigoRastreio" className={styles.formLabel}>
                Código de Rastreio
              </label>
              <input
                type="text"
                id="codigoRastreio"
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value)}
                className={styles.formInput}
                placeholder="Ex: AA123456789BR"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dataResposta" className={styles.formLabel}>
                Data de Resposta
              </label>
              <input
                type="date"
                id="dataResposta"
                value={dataResposta}
                onChange={(e) => setDataResposta(e.target.value)}
                className={styles.formInput}
              />
            </div>
          </>
        );
        
      case 'comunicacao_nao_cumprimento':
        return (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Selecione os Ofícios de Encaminhamento Pendentes
            </label>
            <div className={styles.selectList}>
              {decisoesPendentes.length > 0 ? (
                decisoesPendentes.map((doc) => (
                  <label key={doc.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedDecisoes.includes(doc.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDecisoes([...selectedDecisoes, doc.id.toString()]);
                        } else {
                          setSelectedDecisoes(selectedDecisoes.filter(id => id !== doc.id.toString()));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>
                      {doc.numeroDocumento} - {doc.destinatario}
                    </span>
                  </label>
                ))
              ) : (
                <p className={styles.noData}>
                  Não há ofícios de encaminhamento pendentes para esta demanda.
                </p>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className={styles.formGroup}>
            <p className={styles.noData}>
              Configuração de atualização não disponível para este tipo de documento.
            </p>
          </div>
        );
    }
  };

  const handleEditDocumento = () => {
    const queryString = returnTo && demandaId ? `?returnTo=${returnTo}&demandaId=${demandaId}` : '';
    if (documentoId) {
      navigate(`/documentos/${documentoId}/editar${queryString}`);
    }
  };

  const handleDeleteDocumento = () => {
    if (documentoId && window.confirm('Tem certeza que deseja excluir este documento?')) {
      deleteDocumento(parseInt(documentoId));
      navigate(getBackUrl());
    }
  };

  // Buscar o documento usando o contexto
  const documentoBase = documentoId ? getDocumento(parseInt(documentoId)) : undefined;

  // Funções para verificar se os cards devem aparecer
  const hasInformacoes = documentoBase && (
    documentoBase.assunto ||
    documentoBase.assuntoOutros ||
    documentoBase.enderecamento ||
    documentoBase.anoDocumento ||
    documentoBase.analista
  );

  const hasDecisaoJudicial = documentoBase && (
    documentoBase.autoridade ||
    documentoBase.orgaoJudicial ||
    documentoBase.dataAssinatura
  );

  const hasMidia = documentoBase && (
    documentoBase.tipoMidia ||
    documentoBase.tamanhoMidia ||
    documentoBase.hashMidia ||
    documentoBase.senhaMidia
  );

  const hasPesquisa = documentoBase && documentoBase.pesquisas && documentoBase.pesquisas.length > 0;

  // Obter documentos relacionados usando o contexto
  const { documentos } = useDocumentos();
  const documentosDemanda = documentoBase ? documentos.filter(
    (doc) => doc.demandaId === documentoBase.demandaId
  ) : [];

  // const relatoriosInteligencia = documentosDemanda.filter(
  //   (doc) => doc.tipoDocumento === 'Relatório de Inteligência'
  // );

  // const relatoriosTecnicos = documentosDemanda.filter(
  //   (doc) => doc.tipoDocumento === 'Relatório Técnico'
  // );

  // const midias = documentosDemanda.filter(
  //   (doc) => doc.tipoDocumento === 'Mídia'
  // );

  const decisoesPendentes = documentosDemanda.filter(
    (doc) => doc.tipoDocumento === 'Ofício' && 
    doc.assunto === 'Encaminhamento de decisão judicial' && 
    !doc.respondido
  );

  // Função para determinar o tipo de modal baseado no documento
  const getModalType = () => {
    if (!documentoBase) return 'default';
    
    const { tipoDocumento, assunto } = documentoBase;
    
    // Autos Circunstanciados - sempre apenas data de finalização
    if (tipoDocumento === 'Autos Circunstanciados') {
      return 'finalizacao';
    }
    
    // Relatórios - sempre apenas data de finalização
    if (tipoDocumento === 'Relatório Técnico' || tipoDocumento === 'Relatório de Inteligência') {
      return 'finalizacao';
    }
    
    // Mídia - checkbox de defeito
    if (tipoDocumento === 'Mídia') {
      return 'midia';
    }
    
    // Ofícios e Ofícios Circulares
    if (tipoDocumento === 'Ofício' || tipoDocumento === 'Ofício Circular') {
      // Comunicação de não cumprimento - lista de decisões pendentes
      if (assunto === 'Comunicação de não cumprimento de decisão judicial') {
        return 'comunicacao_nao_cumprimento';
      }
      // Outros assuntos - modal padrão de ofício
      return 'oficio';
    }
    
    return 'default';
  };

  if (!documentoBase) {
    return (
      <div className={styles.detalheContainer}>
        <h1>Detalhe do Documento - Não Encontrado</h1>
        <p>Não foi possível encontrar um documento com o ID fornecido.</p>
        <Link to={getBackUrl()}>Voltar</Link>
      </div>
    );
  }

  return (
    <div className={styles.detalheContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>
            <span>Detalhe do Documento - {documentoBase.numeroDocumento}</span>
            <div className={styles.actionButtons}>
              <button
                onClick={handleUpdateDocumento}
                className={`${styles.iconButton} ${styles.updateButton}`}
                title='Atualizar Documento'
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={handleEditDocumento}
                className={styles.iconButton}
                title='Editar Documento'
              >
                <LiaEdit size={20} />
              </button>
              <button
                onClick={handleDeleteDocumento}
                className={styles.iconButton}
                title='Excluir Documento'
              >
                <IoTrashOutline size={20} />
              </button>
            </div>
          </h1>
        </div>
        <Link to={getBackUrl()} className={styles.btnHeaderBack}>
          Voltar
        </Link>
      </div>

      <div className={styles.cardsGrid}>
        {/* Card 1 - Informações do Documento (sempre aparece se houver dados) */}
        {hasInformacoes && (
          <div className={`${styles.infoCard} ${styles.blue} ${styles.cardInformacoes}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' />
                  <path d='M8 6a1 1 0 011-1h1a1 1 0 110 2H9a1 1 0 01-1-1zM8 8a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1zM8 10a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1z' />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Informações do Documento</h3>
            </div>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tipo de Documento</dt>
              <dd className={styles.infoValue}>{documentoBase.tipoDocumento}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>{documentoBase.numeroDocumento}</dd>
            </div>
            {documentoBase.assunto && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Assunto</dt>
                <dd className={styles.infoValue}>{documentoBase.assunto}</dd>
              </div>
            )}
            {documentoBase.assuntoOutros && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Assunto (Outros)</dt>
                <dd className={styles.infoValue}>{documentoBase.assuntoOutros}</dd>
              </div>
            )}
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Destinatário</dt>
              <dd className={styles.infoValue}>{documentoBase.destinatario}</dd>
            </div>
            {documentoBase.enderecamento && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Endereçamento</dt>
                <dd className={styles.infoValue}>{documentoBase.enderecamento}</dd>
              </div>
            )}
            {documentoBase.anoDocumento && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Ano do Documento</dt>
                <dd className={styles.infoValue}>{documentoBase.anoDocumento}</dd>
              </div>
            )}
            {documentoBase.analista && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Analista</dt>
                <dd className={styles.infoValue}>{documentoBase.analista}</dd>
              </div>
            )}
          </dl>
          </div>
        )}

        {/* Card 2 - Status e Datas (sempre aparece) */}
        <div className={`${styles.infoCard} ${styles.green}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path fillRule='evenodd' d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' clipRule='evenodd' />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Status e Datas</h3>
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Envio</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Resposta</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataResposta)}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Status</dt>
              <dd className={styles.infoValue}>
                {documentoBase.respondido ? 'Respondido' : 'Pendente'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 3 - Dados da Decisão Judicial (condicional) */}
        {hasDecisaoJudicial && (
          <div className={`${styles.infoCard} ${styles.orange} ${styles.cardDecisaoJudicial}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Decisão Judicial</h3>
            </div>
            <dl className={styles.infoList}>
              {documentoBase.autoridade && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Autoridade</dt>
                  <dd className={styles.infoValue}>{documentoBase.autoridade}</dd>
                </div>
              )}
              {documentoBase.orgaoJudicial && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Órgão Judicial</dt>
                  <dd className={styles.infoValue}>{documentoBase.orgaoJudicial}</dd>
                </div>
              )}
              {documentoBase.dataAssinatura && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Data de Assinatura</dt>
                  <dd className={styles.infoValue}>
                    {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataAssinatura)}
                  </dd>
                </div>
              )}
              {documentoBase.retificada !== undefined && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Retificada</dt>
                  <dd className={styles.infoValue}>
                    {documentoBase.retificada ? 'Sim' : 'Não'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Card 4 - Dados da Mídia (condicional) */}
        {hasMidia && (
          <div className={`${styles.infoCard} ${styles.purple} ${styles.cardMidia}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path d='M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z' />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Mídia</h3>
            </div>
            <dl className={styles.infoList}>
              {documentoBase.tipoMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Tipo de Mídia</dt>
                  <dd className={styles.infoValue}>{documentoBase.tipoMidia}</dd>
                </div>
              )}
              {documentoBase.tamanhoMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Tamanho</dt>
                  <dd className={styles.infoValue}>{documentoBase.tamanhoMidia}</dd>
                </div>
              )}
              {documentoBase.hashMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Hash</dt>
                  <dd className={styles.infoValue}>{documentoBase.hashMidia}</dd>
                </div>
              )}
              {documentoBase.senhaMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Senha</dt>
                  <dd className={styles.infoValue}>{documentoBase.senhaMidia}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Card 5 - Dados da Pesquisa (condicional) */}
        {hasPesquisa && (
          <div className={`${styles.infoCard} ${styles.yellow} ${styles.cardPesquisa}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd' />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Pesquisa</h3>
            </div>
            <div className={styles.pesquisasList}>
              {documentoBase.pesquisas?.map((pesquisa, index) => (
                <div key={index} className={styles.pesquisaItem}>
                  <div className={styles.pesquisaHeader}>
                    <span className={styles.pesquisaTipo}>{pesquisa.tipo}</span>
                  </div>
                  <div className={styles.pesquisaContent}>
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Identificador</dt>
                      <dd className={styles.infoValue}>{pesquisa.identificador}</dd>
                    </div>
                    {pesquisa.complementar && (
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>Complementar</dt>
                        <dd className={styles.infoValue}>{pesquisa.complementar}</dd>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Atualização Dinâmico */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Atualizar ${documentoBase?.tipoDocumento || 'Documento'}`}
      >
        <div className={styles.modalContent}>
          {renderModalContent()}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveUpdate}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

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