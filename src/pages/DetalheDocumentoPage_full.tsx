// src/pages/DetalheDocumentoPage.tsx
import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentos } from '../contexts/DocumentosContext';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import { useDemandas } from '../hooks/useDemandas';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import { IoTrashOutline } from 'react-icons/io5';
import { LiaEdit } from 'react-icons/lia';
import { RefreshCw } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import styles from './DetalheDocumentoPage.module.css';

// Tipo expandido para documento com todos os detalhes
interface DocumentoCompleto {
  id: number;
  demandaId: number;
  numeroDocumento: string;
  tipoDocumento: string;
  destinatario: string;
  dataEnvio: string | null;
  dataResposta: string | null;
  respondido: boolean;
  // Informações do Documento
  assunto?: string;
  assuntoOutros?: string;
  enderecamento?: string;
  anoDocumento?: string;
  analista?: string;
  // Dados da Decisão Judicial
  autoridade?: string;
  orgaoJudicial?: string;
  dataAssinatura?: string;
  retificada?: boolean;
  // Dados da Mídia
  tipoMidia?: string;
  tamanhoMidia?: string;
  hashMidia?: string;
  senhaMidia?: string;
  // Dados da Pesquisa
  pesquisas?: Array<{
    tipo: string;
    identificador: string;
    complementar?: string;
  }>;
}

export default function DetalheDocumentoPage() {
  const { documentoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { demandas } = useDemandas();
  const { getDocumento, updateDocumento, deleteDocumento } = useDocumentos();
  
  // Detectar de onde o usuário veio
  const returnTo = searchParams.get('returnTo');
  const demandaId = searchParams.get('demandaId');
  
  // Função para determinar para onde voltar
  const getBackUrl = () => {
    if (returnTo === 'demanda' && demandaId) {
      return `/demandas/${demandaId}`;
    }
    return '/documentos';
  };
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Estados para os campos do modal
  const [referenciaAtena, setReferenciaAtena] = useState('');
  const [dataEnvio, setDataEnvio] = useState('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [dataResposta, setDataResposta] = useState('');
  const [dataFinalizacao, setDataFinalizacao] = useState('');
  const [apresentouDefeito, setApresentouDefeito] = useState(false);
  const [selectedRelatorios, setSelectedRelatorios] = useState<string[]>([]);
  const [selectedMidias, setSelectedMidias] = useState<string[]>([]);
  const [selectedDecisoes, setSelectedDecisoes] = useState<string[]>([]);

  // Buscar o documento usando o contexto
  const documentoBase = documentoId ? getDocumento(parseInt(documentoId)) : undefined;

  if (!documentoBase) {
    return (
      <div className={styles.detalheContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1>
              <span>Detalhe do Documento - Não Encontrado</span>
            </h1>
          </div>
          <Link to={getBackUrl()} className={styles.btnHeaderBack}>
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
        <p>Não foi possível encontrar um documento com o ID fornecido.</p>
      </div>
    );
  }

  // Usar os dados reais do documento gerado
  const documento: DocumentoCompleto = {
    ...documentoBase,
    // Todos os dados já estão no documentoBase, apenas garantir que existem
    assunto: documentoBase.assunto || undefined,
    assuntoOutros: documentoBase.assuntoOutros || undefined,
    enderecamento: documentoBase.enderecamento || undefined,
    anoDocumento: documentoBase.anoDocumento || undefined,
    analista: documentoBase.analista || undefined,
    // Dados da Decisão Judicial (se existirem)
    autoridade: documentoBase.autoridade || undefined,
    orgaoJudicial: documentoBase.orgaoJudicial || undefined,
    dataAssinatura: documentoBase.dataAssinatura || undefined,
    retificada: documentoBase.retificada || undefined,
    // Dados da Mídia (se existirem)
    tipoMidia: documentoBase.tipoMidia || undefined,
    tamanhoMidia: documentoBase.tamanhoMidia || undefined,
    hashMidia: documentoBase.hashMidia || undefined,
    senhaMidia: documentoBase.senhaMidia || undefined,
    // Dados da Pesquisa (se existirem)
    pesquisas: documentoBase.pesquisas && documentoBase.pesquisas.length > 0 ? documentoBase.pesquisas : undefined,
  };

  const demanda = demandas.find((demandaItem) => demandaItem.id === documento.demandaId);

  // Função para verificar se o card deve aparecer
  const hasInformacoes =
    documento.assunto ||
    documento.assuntoOutros ||
    documento.enderecamento ||
    documento.anoDocumento ||
    documento.analista;

  const hasDecisaoJudicial =
    documento.autoridade || documento.orgaoJudicial || documento.dataAssinatura;

  const hasMidia =
    documento.tipoMidia ||
    documento.tamanhoMidia ||
    documento.hashMidia ||
    documento.senhaMidia;

  const hasPesquisa = documento.pesquisas && documento.pesquisas.length > 0;

  // Handlers para os botões
  const handleUpdateDocumento = () => {
    setIsUpdateModalOpen(true);
    // Resetar campos
    setReferenciaAtena('');
    setDataEnvio('');
    setCodigoRastreio('');
    setDataResposta('');
    setDataFinalizacao('');
    setApresentouDefeito(false);
    setSelectedRelatorios([]);
    setSelectedMidias([]);
    setSelectedDecisoes([]);
  };

  const handleEditDocumento = () => {
    if (documentoId) {
      // Preservar os parâmetros de origem para manter o contexto de navegação
      let queryString = '';
      if (returnTo && demandaId) {
        queryString = `?returnTo=${returnTo}&demandaId=${demandaId}`;
      }
      navigate(`/documentos/${documentoId}/editar${queryString}`);
    }
  };

  const handleDeleteDocumento = () => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      if (documentoId) {
        deleteDocumento(parseInt(documentoId));
        setToastMessage('Documento excluído com sucesso!');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => {
          // Usar a navegação inteligente para voltar
          navigate(getBackUrl());
        }, 2000);
      }
    }
  };

  const handleSaveUpdate = () => {
    if (documentoId) {
      // Preparar dados de atualização baseados no modal
      const updateData: Partial<DocumentoDemanda> = {};
      
      if (dataEnvio) updateData.dataEnvio = dataEnvio;
      if (dataResposta) updateData.dataResposta = dataResposta;
      // if (dataFinalizacao) updateData.dataFinalizacao = dataFinalizacao;
      // Adicionar outros campos conforme necessário
      
      updateDocumento(parseInt(documentoId), updateData);
      setToastMessage('Documento atualizado com sucesso!');
      setToastType('success');
      setShowToast(true);
      setIsUpdateModalOpen(false);
    }
  };

  const handleCancelUpdate = () => {
    setIsUpdateModalOpen(false);
  };

  // Função para formatar máscara de data
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

  // Obter documentos relacionados usando o contexto
  const { documentos } = useDocumentos();
  const documentosDemanda = documentos.filter(
    (doc: any) => doc.demandaId === documento.demandaId
  );

  const relatoriosInteligencia = documentosDemanda.filter(
    (doc: any) => doc.tipoDocumento === 'Relatório de Inteligência'
  );

  const relatoriosTecnicos = documentosDemanda.filter(
    (doc: any) => doc.tipoDocumento === 'Relatório Técnico'
  );

  const midias = documentosDemanda.filter(
    (doc: any) => doc.tipoDocumento === 'Mídia'
  );

  const decisoesPendentes = documentosDemanda.filter(
    (doc) => 
      doc.tipoDocumento === 'Ofício' && 
      doc.assunto === 'Encaminhamento de decisão judicial' &&
      !doc.respondido
  );

  // Determinar qual conteúdo mostrar no modal baseado no tipo e assunto
  const getModalContent = () => {
    const isOficio = documento.tipoDocumento === 'Ofício';
    const isOficioCircular = documento.tipoDocumento === 'Ofício Circular';
    const isAutosCircunstanciados = documento.tipoDocumento === 'Autos Circunstanciados';
    const isRelatorioTecnico = documento.tipoDocumento === 'Relatório Técnico';
    const isRelatorioInteligencia = documento.tipoDocumento === 'Relatório de Inteligência';
    const isMidia = documento.tipoDocumento === 'Mídia';
    
    // Para Autos Circunstanciados, Relatório Técnico e Relatório de Inteligência - mostrar apenas Data de Finalização
    if (isAutosCircunstanciados || isRelatorioTecnico || isRelatorioInteligencia) {
      return (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Data de Finalização</label>
          <input
            type="text"
            value={dataFinalizacao}
            onChange={(e) => setDataFinalizacao(formatDateMask(e.target.value))}
            className={styles.formInput}
            placeholder="dd/mm/aaaa"
            maxLength={10}
          />
        </div>
      );
    }
    
    // Para Mídia - mostrar checkbox de defeito
    if (isMidia) {
      return (
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel} style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={apresentouDefeito}
              onChange={(e) => setApresentouDefeito(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Apresentou Defeito</span>
          </label>
        </div>
      );
    }
    
    if ((isOficio || isOficioCircular) && documento.assunto === 'Requisição de dados cadastrais') {
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Referência do Atena</label>
            <input
              type="text"
              value={referenciaAtena}
              onChange={(e) => setReferenciaAtena(e.target.value)}
              className={styles.formInput}
              placeholder="Digite a referência..."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Envio</label>
            <input
              type="text"
              value={dataEnvio}
              onChange={(e) => setDataEnvio(formatDateMask(e.target.value))}
              className={styles.formInput}
              placeholder="dd/mm/aaaa"
              maxLength={10}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Código de Rastreio</label>
            <input
              type="text"
              value={codigoRastreio}
              onChange={(e) => setCodigoRastreio(e.target.value)}
              className={styles.formInput}
              placeholder="Digite o código..."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Resposta</label>
            <input
              type="text"
              value={dataResposta}
              onChange={(e) => setDataResposta(formatDateMask(e.target.value))}
              className={styles.formInput}
              placeholder="dd/mm/aaaa"
              maxLength={10}
            />
          </div>
        </>
      );
    }

    if ((isOficio || isOficioCircular) && documento.assunto === 'Encaminhamento de decisão judicial') {
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Referência do Atena</label>
            <input
              type="text"
              value={referenciaAtena}
              onChange={(e) => setReferenciaAtena(e.target.value)}
              className={styles.formInput}
              placeholder="Digite a referência..."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Envio</label>
            <input
              type="text"
              value={dataEnvio}
              onChange={(e) => setDataEnvio(formatDateMask(e.target.value))}
              className={styles.formInput}
              placeholder="dd/mm/aaaa"
              maxLength={10}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Código de Rastreio</label>
            <input
              type="text"
              value={codigoRastreio}
              onChange={(e) => setCodigoRastreio(e.target.value)}
              className={styles.formInput}
              placeholder="Digite o código..."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Resposta</label>
            <input
              type="text"
              value={dataResposta}
              onChange={(e) => setDataResposta(formatDateMask(e.target.value))}
              className={styles.formInput}
              placeholder="dd/mm/aaaa"
              maxLength={10}
            />
          </div>
        </>
      );
    }

    if ((isOficio || isOficioCircular) && documento.assunto === 'Encaminhamento de relatório de inteligência') {
      return (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Relatórios de Inteligência</label>
          <div className={styles.checkboxList}>
            {relatoriosInteligencia.length > 0 ? (
              relatoriosInteligencia.map((rel) => (
                <label key={rel.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRelatorios.includes(rel.numeroDocumento)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRelatorios([...selectedRelatorios, rel.numeroDocumento]);
                      } else {
                        setSelectedRelatorios(selectedRelatorios.filter(r => r !== rel.numeroDocumento));
                      }
                    }}
                    className={styles.checkbox}
                  />
                  <span>{rel.numeroDocumento} - {rel.assunto || 'Sem assunto'}</span>
                </label>
              ))
            ) : (
              <p className={styles.noData}>Nenhum relatório de inteligência encontrado nesta demanda</p>
            )}
          </div>
        </div>
      );
    }

    if ((isOficio || isOficioCircular) && documento.assunto === 'Encaminhamento de relatório técnico') {
      return (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Relatórios Técnicos</label>
          <div className={styles.checkboxList}>
            {relatoriosTecnicos.length > 0 ? (
              relatoriosTecnicos.map((rel) => (
                <label key={rel.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRelatorios.includes(rel.numeroDocumento)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRelatorios([...selectedRelatorios, rel.numeroDocumento]);
                      } else {
                        setSelectedRelatorios(selectedRelatorios.filter(r => r !== rel.numeroDocumento));
                      }
                    }}
                    className={styles.checkbox}
                  />
                  <span>{rel.numeroDocumento} - {rel.assunto || 'Sem assunto'}</span>
                </label>
              ))
            ) : (
              <p className={styles.noData}>Nenhum relatório técnico encontrado nesta demanda</p>
            )}
          </div>
        </div>
      );
    }

    if ((isOficio || isOficioCircular) && documento.assunto === 'Encaminhamento de mídia') {
      return (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Mídias</label>
          <div className={styles.checkboxList}>
            {midias.length > 0 ? (
              midias.map((midia) => (
                <label key={midia.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedMidias.includes(midia.numeroDocumento)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMidias([...selectedMidias, midia.numeroDocumento]);
                      } else {
                        setSelectedMidias(selectedMidias.filter(m => m !== midia.numeroDocumento));
                      }
                    }}
                    className={styles.checkbox}
                  />
                  <span>{midia.numeroDocumento} - {midia.tipoMidia || 'Tipo não especificado'}</span>
                </label>
              ))
            ) : (
              <p className={styles.noData}>Nenhuma mídia encontrada nesta demanda</p>
            )}
          </div>
        </div>
      );
    }

    if ((isOficio || isOficioCircular) && documento.assunto === 'Encaminhamento de relatório técnico e mídia') {
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Relatórios Técnicos</label>
            <div className={styles.checkboxList}>
              {relatoriosTecnicos.length > 0 ? (
                relatoriosTecnicos.map((rel) => (
                  <label key={rel.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedRelatorios.includes(rel.numeroDocumento)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRelatorios([...selectedRelatorios, rel.numeroDocumento]);
                        } else {
                          setSelectedRelatorios(selectedRelatorios.filter(r => r !== rel.numeroDocumento));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span>{rel.numeroDocumento} - {rel.assunto || 'Sem assunto'}</span>
                  </label>
                ))
              ) : (
                <p className={styles.noData}>Nenhum relatório técnico encontrado</p>
              )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mídias</label>
            <div className={styles.checkboxList}>
              {midias.length > 0 ? (
                midias.map((midia) => (
                  <label key={midia.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedMidias.includes(midia.numeroDocumento)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMidias([...selectedMidias, midia.numeroDocumento]);
                        } else {
                          setSelectedMidias(selectedMidias.filter(m => m !== midia.numeroDocumento));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span>{midia.numeroDocumento} - {midia.tipoMidia || 'Tipo não especificado'}</span>
                  </label>
                ))
              ) : (
                <p className={styles.noData}>Nenhuma mídia encontrada</p>
              )}
            </div>
          </div>
        </>
      );
    }

    if (isOficio && documento.assunto === 'Comunicação de não cumprimento de decisão judicial') {
      return (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Decisões Judiciais Pendentes</label>
          <div className={styles.checkboxList}>
            {decisoesPendentes.length > 0 ? (
              decisoesPendentes.map((decisao) => (
                <label key={decisao.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedDecisoes.includes(decisao.numeroDocumento)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDecisoes([...selectedDecisoes, decisao.numeroDocumento]);
                      } else {
                        setSelectedDecisoes(selectedDecisoes.filter(d => d !== decisao.numeroDocumento));
                      }
                    }}
                    className={styles.checkbox}
                  />
                  <span>
                    {decisao.numeroDocumento} - {decisao.destinatario} 
                    {decisao.dataEnvio && ` (Enviado: ${formatDateToDDMMYYYYOrPlaceholder(decisao.dataEnvio, '--')})`}
                  </span>
                </label>
              ))
            ) : (
              <p className={styles.noData}>Nenhuma decisão judicial pendente encontrada</p>
            )}
          </div>
        </div>
      );
    }

    // Default: outros assuntos para Ofício/Ofício Circular não têm atualização
    if (isOficio || isOficioCircular) {
      return (
        <div className={styles.formGroup}>
          <p className={styles.noData}>
            Não há campos de atualização disponíveis para este assunto.
          </p>
        </div>
      );
    }

    // Outros tipos de documento
    return (
      <div className={styles.formGroup}>
        <p className={styles.noData}>
          Configuração de atualização não disponível para este tipo de documento.
        </p>
      </div>
    );
  };

  return (
    <div className={styles.detalheContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>
            <span>Detalhe do Documento - {documento.numeroDocumento}</span>
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
        {/* Card 1 - Informações do Documento (sempre aparece se houver dados) */}
        {hasInformacoes && (
          <div
            className={`${styles.infoCard} ${styles.blue} ${styles.cardInformacoes}`}
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
                  <path d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' />
                  <path d='M8 6a1 1 0 011-1h1a1 1 0 110 2H9a1 1 0 01-1-1zM8 8a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1zM8 10a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1z' />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Informações do Documento</h3>
            </div>
            <dl className={styles.infoList}>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Tipo de Documento</dt>
                <dd className={styles.infoValue}>{documento.tipoDocumento}</dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Número do Documento</dt>
                <dd className={styles.infoValue}>
                  {documento.numeroDocumento}
                </dd>
              </div>
              {documento.assunto && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Assunto</dt>
                  <dd className={styles.infoValue}>{documento.assunto}</dd>
                </div>
              )}
              {documento.assuntoOutros && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Assunto (Outros)</dt>
                  <dd className={styles.infoValue}>
                    {documento.assuntoOutros}
                  </dd>
                </div>
              )}
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Destinatário</dt>
                <dd className={styles.infoValue}>{documento.destinatario}</dd>
              </div>
              {documento.enderecamento && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Endereçamento</dt>
                  <dd className={styles.infoValue}>
                    {documento.enderecamento}
                  </dd>
                </div>
              )}
              {documento.anoDocumento && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Ano do Documento</dt>
                  <dd className={styles.infoValue}>{documento.anoDocumento}</dd>
                </div>
              )}
              {documento.analista && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Analista</dt>
                  <dd className={styles.infoValue}>{documento.analista}</dd>
                </div>
              )}
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Data de Envio</dt>
                <dd className={styles.infoValue}>
                  {formatDateToDDMMYYYYOrPlaceholder(
                    documento.dataEnvio,
                    'Não enviado'
                  )}
                </dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Data de Resposta</dt>
                <dd className={styles.infoValue}>
                  {formatDateToDDMMYYYYOrPlaceholder(
                    documento.dataResposta,
                    'Não respondido'
                  )}
                </dd>
              </div>
              {demanda && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Demanda</dt>
                  <dd className={styles.infoValue}>
                    <Link
                      to={`/demandas/${demanda.id}`}
                      className={styles.linkDemanda}
                    >
                      SGED {demanda.sged}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Card 2 - Dados da Decisão Judicial (condicional) */}
        {hasDecisaoJudicial && (
          <div
            className={`${styles.infoCard} ${styles.green} ${styles.cardDecisao}`}
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
                    d='M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V10C9 10.2652 9.10536 10.5196 9.29289 10.7071L12.1213 13.5355C12.5118 13.9261 13.145 13.9261 13.5355 13.5355C13.9261 13.145 13.9261 12.5118 13.5355 12.1213L11 9.58579V6Z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Decisão Judicial</h3>
            </div>
            <dl className={styles.infoList}>
              {documento.autoridade && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Autoridade</dt>
                  <dd className={styles.infoValue}>{documento.autoridade}</dd>
                </div>
              )}
              {documento.orgaoJudicial && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Órgão Judicial</dt>
                  <dd className={styles.infoValue}>
                    {documento.orgaoJudicial}
                  </dd>
                </div>
              )}
              {documento.dataAssinatura && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Data de Assinatura</dt>
                  <dd className={styles.infoValue}>
                    {formatDateToDDMMYYYYOrPlaceholder(
                      documento.dataAssinatura,
                      '--'
                    )}
                  </dd>
                </div>
              )}
              {documento.retificada !== undefined && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Retificada</dt>
                  <dd className={styles.infoValue}>
                    {documento.retificada ? 'Sim' : 'Não'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Card 3 - Dados da Mídia (condicional) */}
        {hasMidia && (
          <div
            className={`${styles.infoCard} ${styles.purple} ${styles.cardMidia}`}
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
                  <path d='M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z' />
                  <path
                    fillRule='evenodd'
                    d='M2 8.5v6a2 2 0 002 2h12a2 2 0 002-2v-6H2zm8 2a.5.5 0 01.5.5v1.5a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5V11a.5.5 0 01.5-.5h2z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Mídia</h3>
            </div>
            <dl className={styles.infoList}>
              {documento.tipoMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Tipo de Mídia</dt>
                  <dd className={styles.infoValue}>{documento.tipoMidia}</dd>
                </div>
              )}
              {documento.tamanhoMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Tamanho</dt>
                  <dd className={styles.infoValue}>{documento.tamanhoMidia}</dd>
                </div>
              )}
              {documento.hashMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Hash</dt>
                  <dd
                    className={styles.infoValue}
                    style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}
                  >
                    {documento.hashMidia}
                  </dd>
                </div>
              )}
              {documento.senhaMidia && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Senha</dt>
                  <dd className={styles.infoValue}>{documento.senhaMidia}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Card 4 - Dados da Pesquisa (condicional) */}
        {hasPesquisa && (
          <div
            className={`${styles.infoCard} ${styles.orange} ${styles.cardPesquisa}`}
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
                    d='M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Pesquisa</h3>
            </div>
            <dl className={styles.infoList}>
              {documento.pesquisas?.map((pesquisa, index) => (
                <div key={index} className={styles.pesquisaItem}>
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Tipo {index + 1}</dt>
                    <dd className={styles.infoValue}>{pesquisa.tipo}</dd>
                  </div>
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Identificador</dt>
                    <dd className={styles.infoValue}>
                      {pesquisa.identificador}
                    </dd>
                  </div>
                  {pesquisa.complementar && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Complementar</dt>
                      <dd className={styles.infoValue}>
                        {pesquisa.complementar}
                      </dd>
                    </div>
                  )}
                  {index < (documento.pesquisas?.length || 0) - 1 && (
                    <hr className={styles.pesquisaDivider} />
                  )}
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Modal para atualizar documento */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={handleCancelUpdate}
        title={`Atualizar ${documento.numeroDocumento}`}
      >
        <div className={styles.modalContent}>
          <div className={styles.formSection}>
            <div className={styles.sectionContent}>
              {getModalContent()}
            </div>
          </div>
          <div className={styles.modalActions}>
            <button
              onClick={handleSaveUpdate}
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
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}