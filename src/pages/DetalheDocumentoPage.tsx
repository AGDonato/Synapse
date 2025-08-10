import { useState, useEffect, useRef } from 'react';
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
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
  const [numeroAtena, setNumeroAtena] = useState('');
  const [dataEnvio, setDataEnvio] = useState('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [naopossuiRastreio, setNaopossuiRastreio] = useState(false);
  const [dataResposta, setDataResposta] = useState('');
  const [dataFinalizacao, setDataFinalizacao] = useState('');
  const [apresentouDefeito, setApresentouDefeito] = useState(false);

  // Estados iniciais para comparação
  const [initialNumeroAtena, setInitialNumeroAtena] = useState('');
  const [initialDataEnvio, setInitialDataEnvio] = useState('');
  const [initialCodigoRastreio, setInitialCodigoRastreio] = useState('');
  const [initialNaopossuiRastreio, setInitialNaopossuiRastreio] =
    useState(false);
  const [initialDataResposta, setInitialDataResposta] = useState('');
  const [initialDataFinalizacao, setInitialDataFinalizacao] = useState('');
  const [initialApresentouDefeito, setInitialApresentouDefeito] =
    useState(false);
  // const [selectedRelatorios, setSelectedRelatorios] = useState<string[]>([]);
  // const [selectedMidias, setSelectedMidias] = useState<string[]>([]);
  const [selectedDecisoes, setSelectedDecisoes] = useState<string[]>([]);

  // Estado para controlar a versão ativa da decisão judicial
  const [versaoDecisaoAtiva, setVersaoDecisaoAtiva] = useState<number>(0);

  // Função para converter data do formato brasileiro (DD/MM/YYYY) para ISO (YYYY-MM-DD)
  const convertToInputDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    // Se já está no formato ISO (YYYY-MM-DD), retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Se está no formato brasileiro (DD/MM/YYYY), converte
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Função para converter data do formato ISO (YYYY-MM-DD) para brasileiro (DD/MM/YYYY)
  const convertToBrazilianDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Se já está no formato brasileiro (DD/MM/YYYY), retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // Se está no formato ISO (YYYY-MM-DD), converte
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Função para verificar se houve alterações nos campos do modal
  const hasChanges = () => {
    return (
      numeroAtena !== initialNumeroAtena ||
      dataEnvio !== initialDataEnvio ||
      codigoRastreio !== initialCodigoRastreio ||
      naopossuiRastreio !== initialNaopossuiRastreio ||
      dataResposta !== initialDataResposta ||
      dataFinalizacao !== initialDataFinalizacao ||
      apresentouDefeito !== initialApresentouDefeito
    );
  };

  // Refs para sincronizar alturas dos cards
  const cardInformacoesRef = useRef<HTMLDivElement>(null);
  const cardPesquisaRef = useRef<HTMLDivElement>(null);

  // Função para determinar para onde voltar
  const getBackUrl = () => {
    if (returnTo === 'demanda' && demandaId) {
      return `/demandas/${demandaId}`;
    } else if (returnTo === 'list') {
      // Reconstruir a URL da lista de documentos com todos os parâmetros preservados
      const listParams = new URLSearchParams();

      // Copiar todos os parâmetros exceto 'returnTo' e 'demandaId'
      for (const [key, value] of searchParams.entries()) {
        if (key !== 'returnTo' && key !== 'demandaId') {
          listParams.set(key, value);
        }
      }

      const queryString = listParams.toString();
      return queryString ? `/documentos?${queryString}` : '/documentos';
    }
    return '/documentos';
  };

  // Funções de ação
  const handleUpdateDocumento = () => {
    // Inicializar campos do modal com dados existentes
    if (documentoBase) {
      const numeroAtenaValue = documentoBase.numeroAtena ?? '';
      const dataEnvioValue = convertToInputDate(documentoBase.dataEnvio);
      const codigoRastreioValue = documentoBase.codigoRastreio ?? '';
      const naopossuiRastreioValue = documentoBase.naopossuiRastreio ?? false;
      const dataRespostaValue = convertToInputDate(documentoBase.dataResposta);

      // Definir valores atuais
      setNumeroAtena(numeroAtenaValue);
      setDataEnvio(dataEnvioValue);
      setCodigoRastreio(codigoRastreioValue);
      setNaopossuiRastreio(naopossuiRastreioValue);
      setDataResposta(dataRespostaValue);

      // Definir valores iniciais para comparação
      setInitialNumeroAtena(numeroAtenaValue);
      setInitialDataEnvio(dataEnvioValue);
      setInitialCodigoRastreio(codigoRastreioValue);
      setInitialNaopossuiRastreio(naopossuiRastreioValue);
      setInitialDataResposta(dataRespostaValue);
      setInitialDataFinalizacao('');
      setInitialApresentouDefeito(false);
    }
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = () => {
    if (documentoId) {
      // Preparar dados de atualização baseados no modal
      const updateData: Partial<DocumentoDemanda> = {
        numeroAtena: numeroAtena,
        dataEnvio: convertToBrazilianDate(dataEnvio),
        dataResposta: convertToBrazilianDate(dataResposta),
        codigoRastreio: naopossuiRastreio ? '' : codigoRastreio,
        naopossuiRastreio: naopossuiRastreio,
        // Atualizar status respondido baseado na presença de dataResposta
        respondido: !!dataResposta && dataResposta !== '',
      };

      // Adicionar campos específicos baseados no tipo de modal
      if (dataFinalizacao) {
        updateData.dataEnvio = convertToBrazilianDate(dataFinalizacao);
      }

      updateDocumento(parseInt(documentoId), updateData);
      setIsUpdateModalOpen(false);
      setToastMessage('Documento atualizado com sucesso!');
      setToastType('success');
      setShowToast(true);

      // Não limpar os campos aqui, pois eles devem manter os valores salvos
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
            <label htmlFor='dataFinalizacao' className={styles.formLabel}>
              Data de Finalização *
            </label>
            <input
              type='date'
              id='dataFinalizacao'
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
                type='checkbox'
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
              <label htmlFor='numeroAtena' className={styles.formLabel}>
                Numeração no Atena
              </label>
              <input
                type='text'
                id='numeroAtena'
                value={numeroAtena}
                onChange={(e) => setNumeroAtena(e.target.value)}
                className={styles.formInput}
                placeholder='Ex: AT12345'
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div className={styles.formGroup}>
                <label htmlFor='dataEnvio' className={styles.formLabel}>
                  Data de Envio
                </label>
                <input
                  type='date'
                  id='dataEnvio'
                  value={dataEnvio}
                  onChange={(e) => setDataEnvio(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor='dataResposta' className={styles.formLabel}>
                  Data de Resposta
                </label>
                <input
                  type='date'
                  id='dataResposta'
                  value={dataResposta}
                  onChange={(e) => setDataResposta(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor='codigoRastreio' className={styles.formLabel}>
                Código de Rastreio
              </label>
              <div
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <input
                  type='text'
                  id='codigoRastreio'
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value)}
                  className={styles.formInput}
                  placeholder='Ex: AA123456789BR'
                  disabled={naopossuiRastreio}
                  style={{ flex: 1 }}
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    padding: '0.5rem',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={naopossuiRastreio}
                    onChange={(e) => {
                      setNaopossuiRastreio(e.target.checked);
                      if (e.target.checked) {
                        setCodigoRastreio('');
                      }
                    }}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>Não possui</span>
                </label>
              </div>
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
                      type='checkbox'
                      checked={selectedDecisoes.includes(doc.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDecisoes([
                            ...selectedDecisoes,
                            doc.id.toString(),
                          ]);
                        } else {
                          setSelectedDecisoes(
                            selectedDecisoes.filter(
                              (id) => id !== doc.id.toString()
                            )
                          );
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
              Configuração de atualização não disponível para este tipo de
              documento.
            </p>
          </div>
        );
    }
  };

  const handleEditDocumento = () => {
    const queryString =
      returnTo && demandaId
        ? `?returnTo=${returnTo}&demandaId=${demandaId}`
        : '';
    if (documentoId) {
      navigate(`/documentos/${documentoId}/editar${queryString}`);
    }
  };

  const handleDeleteDocumento = () => {
    if (
      documentoId &&
      window.confirm('Tem certeza que deseja excluir este documento?')
    ) {
      deleteDocumento(parseInt(documentoId));
      navigate(getBackUrl());
    }
  };

  // Buscar o documento usando o contexto
  const documentoBase = documentoId
    ? getDocumento(parseInt(documentoId))
    : undefined;

  // Funções para verificar se os cards devem aparecer
  const hasInformacoes =
    documentoBase &&
    (documentoBase.assunto ||
      documentoBase.assuntoOutros ||
      documentoBase.enderecamento ||
      documentoBase.anoDocumento ||
      documentoBase.analista);

  const hasDecisaoJudicial =
    documentoBase &&
    (documentoBase.autoridade ||
      documentoBase.orgaoJudicial ||
      documentoBase.dataAssinatura);

  const hasMidia =
    documentoBase &&
    (documentoBase.tipoMidia ||
      documentoBase.tamanhoMidia ||
      documentoBase.hashMidia ||
      documentoBase.senhaMidia);

  // Validar se o tipo de documento deve mostrar pesquisas
  // Mídia, Autos Circunstanciados, Relatórios não têm pesquisas
  const shouldShowPesquisa =
    documentoBase &&
    ![
      'Mídia',
      'Autos Circunstanciados',
      'Relatório de Inteligência',
      'Relatório Técnico',
    ].includes(documentoBase.tipoDocumento);

  const hasPesquisa =
    shouldShowPesquisa &&
    documentoBase &&
    documentoBase.pesquisas &&
    documentoBase.pesquisas.length > 0;

  // Obter documentos relacionados usando o contexto
  const { documentos } = useDocumentos();
  const documentosDemanda = documentoBase
    ? documentos.filter((doc) => doc.demandaId === documentoBase.demandaId)
    : [];

  // Sincronizar alturas dos cards
  useEffect(() => {
    const syncHeights = () => {
      if (
        cardInformacoesRef.current &&
        cardPesquisaRef.current &&
        hasPesquisa
      ) {
        // Reset height to get natural height
        cardPesquisaRef.current.style.height = 'auto';

        // Get the natural height of informações card
        const alturaInformacoes = cardInformacoesRef.current.offsetHeight;

        // Set the same height to pesquisa card
        cardPesquisaRef.current.style.height = `${alturaInformacoes}px`;
      }
    };

    // Execute immediately
    syncHeights();

    // Execute after a short delay to ensure content is loaded
    const timeout = setTimeout(syncHeights, 100);

    return () => clearTimeout(timeout);
  }, [hasPesquisa, documentoBase]);

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
    (doc) =>
      doc.tipoDocumento === 'Ofício' &&
      doc.assunto === 'Encaminhamento de decisão judicial' &&
      !doc.respondido
  );

  // Função para obter todas as versões da decisão judicial
  const getVersoesDecisao = () => {
    if (!documentoBase) return [];

    const versoes = [];

    // Função para converter número em ordinal (1ª, 2ª, 3ª, etc.)
    const getOrdinal = (num: number): string => {
      if (num === 1) return '1ª';
      if (num === 2) return '2ª';
      if (num === 3) return '3ª';
      return `${num}ª`;
    };

    if (documentoBase.retificacoes && documentoBase.retificacoes.length > 0) {
      // Primeira versão: Decisão Judicial (dados atuais do documento - ORIGINAL)
      versoes.push({
        nome: 'Decisão Judicial',
        dados: {
          autoridade: documentoBase.autoridade,
          orgaoJudicial: documentoBase.orgaoJudicial,
          dataAssinatura: documentoBase.dataAssinatura,
        },
      });

      // Adicionar todas as decisões retificadoras
      for (let i = 0; i < documentoBase.retificacoes.length; i++) {
        versoes.push({
          nome: `${getOrdinal(i + 1)} Decisão Retificadora`,
          dados: {
            autoridade: documentoBase.retificacoes[i].autoridade,
            orgaoJudicial: documentoBase.retificacoes[i].orgaoJudicial,
            dataAssinatura: documentoBase.retificacoes[i].dataAssinatura,
          },
        });
      }
    } else {
      // Se não há retificação, só mostra a decisão original
      versoes.push({
        nome: 'Decisão Judicial',
        dados: {
          autoridade: documentoBase.autoridade,
          orgaoJudicial: documentoBase.orgaoJudicial,
          dataAssinatura: documentoBase.dataAssinatura,
        },
      });
    }

    return versoes;
  };

  // Função para renderizar dados da versão selecionada
  const renderVersaoDecisao = (versaoIndex: number) => {
    const versoes = getVersoesDecisao();
    const versao = versoes[versaoIndex];

    if (!versao) return <p className={styles.noData}>Dados não disponíveis</p>;

    const { dados } = versao;

    return (
      <dl className={styles.infoList}>
        {dados.autoridade && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Autoridade</dt>
            <dd className={styles.infoValue}>{dados.autoridade}</dd>
          </div>
        )}
        {dados.orgaoJudicial && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Órgão Judicial</dt>
            <dd className={styles.infoValue}>{dados.orgaoJudicial}</dd>
          </div>
        )}
        {dados.dataAssinatura && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Assinatura</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(dados.dataAssinatura)}
            </dd>
          </div>
        )}
      </dl>
    );
  };

  // Função para determinar o tipo de modal baseado no documento
  const getModalType = () => {
    if (!documentoBase) return 'default';

    const { tipoDocumento, assunto } = documentoBase;

    // Autos Circunstanciados - sempre apenas data de finalização
    if (tipoDocumento === 'Autos Circunstanciados') {
      return 'finalizacao';
    }

    // Relatórios - sempre apenas data de finalização
    if (
      tipoDocumento === 'Relatório Técnico' ||
      tipoDocumento === 'Relatório de Inteligência'
    ) {
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

      {/* LINHA 1: Informações do Documento + Dados de Pesquisa (se existir) */}
      <div
        className={
          hasPesquisa ? styles.linha1ComPesquisa : styles.linha1SemPesquisa
        }
      >
        {/* Card 1 - Informações do Documento (sempre aparece se houver dados) */}
        {hasInformacoes && (
          <div
            ref={cardInformacoesRef}
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
                <dd className={styles.infoValue}>
                  {documentoBase.tipoDocumento}
                </dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Número do Documento</dt>
                <dd className={styles.infoValue}>
                  {documentoBase.numeroDocumento}
                </dd>
              </div>
              {documentoBase.numeroAtena && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Número no Atena</dt>
                  <dd className={styles.infoValue}>
                    {documentoBase.numeroAtena}
                  </dd>
                </div>
              )}
              {documentoBase.assunto && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Assunto</dt>
                  <dd className={styles.infoValue}>{documentoBase.assunto}</dd>
                </div>
              )}
              {documentoBase.assuntoOutros && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Assunto (Outros)</dt>
                  <dd className={styles.infoValue}>
                    {documentoBase.assuntoOutros}
                  </dd>
                </div>
              )}
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Destinatário</dt>
                <dd className={styles.infoValue}>
                  {documentoBase.destinatario}
                </dd>
              </div>
              {documentoBase.enderecamento && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Endereçamento</dt>
                  <dd className={styles.infoValue}>
                    {documentoBase.enderecamento}
                  </dd>
                </div>
              )}
              {documentoBase.anoDocumento && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Ano do Documento</dt>
                  <dd className={styles.infoValue}>
                    {documentoBase.anoDocumento}
                  </dd>
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

        {/* Card Pesquisa - Lado direito na linha 1 (se existir) */}
        {hasPesquisa && (
          <div
            ref={cardPesquisaRef}
            className={`${styles.infoCard} ${styles.yellow} ${styles.cardPesquisa}`}
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
                    d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dados da Pesquisa</h3>
            </div>
            <div className={styles.pesquisasScrollContainer}>
              <div className={styles.pesquisasList}>
                {documentoBase.pesquisas?.map((pesquisa, index) => (
                  <div key={index} className={styles.pesquisaItem}>
                    <div className={styles.pesquisaHeader}>
                      <span className={styles.pesquisaTipo}>
                        {pesquisa.tipo}
                      </span>
                    </div>
                    <div className={styles.pesquisaContent}>
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cards empilhados - Lado direito quando SEM pesquisa */}
        {!hasPesquisa && (
          <div className={styles.cardsEmpilhados}>
            {/* Card Status e Datas */}
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
                    <path
                      fillRule='evenodd'
                      d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
                      clipRule='evenodd'
                    />
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
                    {formatDateToDDMMYYYYOrPlaceholder(
                      documentoBase.dataResposta
                    )}
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

            {/* Card Decisão Judicial */}
            {hasDecisaoJudicial && (
              <div
                className={`${styles.infoCard} ${styles.orange} ${styles.cardDecisaoJudicial}`}
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
                        d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <h3 className={styles.cardTitle}>
                    Dados da Decisão Judicial
                    {documentoBase.retificada && (
                      <span className={styles.retificacaoIndicator}>
                        <svg
                          className={styles.retificacaoIcon}
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                        Retificada
                      </span>
                    )}
                  </h3>
                </div>

                {documentoBase.retificada ? (
                  <>
                    {/* Conteúdo da versão ativa */}
                    <div className={styles.versaoContent}>
                      {renderVersaoDecisao(versaoDecisaoAtiva)}
                    </div>

                    {/* Navegação com bolinhas */}
                    <div className={styles.dotsContainer}>
                      {getVersoesDecisao().map((versao, index) => (
                        <button
                          key={index}
                          className={`${styles.dotButton} ${versaoDecisaoAtiva === index ? styles.active : ''}`}
                          onClick={() => setVersaoDecisaoAtiva(index)}
                          title={versao.nome}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  /* Exibição normal quando não há retificação */
                  <dl className={styles.infoList}>
                    {documentoBase.autoridade && (
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>Autoridade</dt>
                        <dd className={styles.infoValue}>
                          {documentoBase.autoridade}
                        </dd>
                      </div>
                    )}
                    {documentoBase.orgaoJudicial && (
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>Órgão Judicial</dt>
                        <dd className={styles.infoValue}>
                          {documentoBase.orgaoJudicial}
                        </dd>
                      </div>
                    )}
                    {documentoBase.dataAssinatura && (
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>Data de Assinatura</dt>
                        <dd className={styles.infoValue}>
                          {formatDateToDDMMYYYYOrPlaceholder(
                            documentoBase.dataAssinatura
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            )}

            {/* Card Mídia */}
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
                      <path d='M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z' />
                    </svg>
                  </div>
                  <h3 className={styles.cardTitle}>Dados da Mídia</h3>
                </div>
                <dl className={styles.infoList}>
                  {documentoBase.tipoMidia && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Tipo de Mídia</dt>
                      <dd className={styles.infoValue}>
                        {documentoBase.tipoMidia}
                      </dd>
                    </div>
                  )}
                  {documentoBase.tamanhoMidia && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Tamanho</dt>
                      <dd className={styles.infoValue}>
                        {documentoBase.tamanhoMidia}
                      </dd>
                    </div>
                  )}
                  {documentoBase.hashMidia && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Hash</dt>
                      <dd className={styles.infoValue}>
                        {documentoBase.hashMidia}
                      </dd>
                    </div>
                  )}
                  {documentoBase.senhaMidia && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Senha</dt>
                      <dd className={styles.infoValue}>
                        {documentoBase.senhaMidia}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LINHA 2: Cards Status, Decisão e Mídia (quando COM pesquisa) */}
      {hasPesquisa && (
        <div className={styles.linha2}>
          {/* Card Status e Datas */}
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
                  <path
                    fillRule='evenodd'
                    d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
                    clipRule='evenodd'
                  />
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
                  {formatDateToDDMMYYYYOrPlaceholder(
                    documentoBase.dataResposta
                  )}
                </dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Código de Rastreio</dt>
                <dd className={styles.infoValue}>
                  {documentoBase.naopossuiRastreio
                    ? 'Não possui'
                    : documentoBase.codigoRastreio || 'Não informado'}
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

          {/* Card Decisão Judicial */}
          {hasDecisaoJudicial && (
            <div
              className={`${styles.infoCard} ${styles.orange} ${styles.cardDecisaoJudicial}`}
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
                      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <h3 className={styles.cardTitle}>
                  Dados da Decisão Judicial
                  {documentoBase.retificada && (
                    <span className={styles.retificacaoIndicator}>
                      <svg
                        className={styles.retificacaoIcon}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                      Retificada
                    </span>
                  )}
                </h3>
              </div>

              {documentoBase.retificada ? (
                <>
                  {/* Conteúdo da versão ativa */}
                  <div className={styles.versaoContent}>
                    {renderVersaoDecisao(versaoDecisaoAtiva)}
                  </div>

                  {/* Navegação com bolinhas */}
                  <div className={styles.dotsContainer}>
                    {getVersoesDecisao().map((versao, index) => (
                      <button
                        key={index}
                        className={`${styles.dotButton} ${versaoDecisaoAtiva === index ? styles.active : ''}`}
                        onClick={() => setVersaoDecisaoAtiva(index)}
                        title={versao.nome}
                      />
                    ))}
                  </div>
                </>
              ) : (
                /* Exibição normal quando não há retificação */
                <dl className={styles.infoList}>
                  {documentoBase.autoridade && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Autoridade</dt>
                      <dd className={styles.infoValue}>
                        {documentoBase.autoridade}
                      </dd>
                    </div>
                  )}
                  {documentoBase.orgaoJudicial && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Órgão Judicial</dt>
                      <dd className={styles.infoValue}>
                        {documentoBase.orgaoJudicial}
                      </dd>
                    </div>
                  )}
                  {documentoBase.dataAssinatura && (
                    <div className={styles.infoItem}>
                      <dt className={styles.infoLabel}>Data de Assinatura</dt>
                      <dd className={styles.infoValue}>
                        {formatDateToDDMMYYYYOrPlaceholder(
                          documentoBase.dataAssinatura
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          )}

          {/* Card Mídia */}
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
                    <path d='M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z' />
                  </svg>
                </div>
                <h3 className={styles.cardTitle}>Dados da Mídia</h3>
              </div>
              <dl className={styles.infoList}>
                {documentoBase.tipoMidia && (
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Tipo de Mídia</dt>
                    <dd className={styles.infoValue}>
                      {documentoBase.tipoMidia}
                    </dd>
                  </div>
                )}
                {documentoBase.tamanhoMidia && (
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Tamanho</dt>
                    <dd className={styles.infoValue}>
                      {documentoBase.tamanhoMidia}
                    </dd>
                  </div>
                )}
                {documentoBase.hashMidia && (
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Hash</dt>
                    <dd className={styles.infoValue}>
                      {documentoBase.hashMidia}
                    </dd>
                  </div>
                )}
                {documentoBase.senhaMidia && (
                  <div className={styles.infoItem}>
                    <dt className={styles.infoLabel}>Senha</dt>
                    <dd className={styles.infoValue}>
                      {documentoBase.senhaMidia}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}

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
              type='button'
              onClick={handleSaveUpdate}
              disabled={!hasChanges()}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Seção de Outros Documentos da Demanda */}
      {documentosDemanda.length > 1 && (
        <div className={styles.documentsSection}>
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
            Outros Documentos da Demanda ({documentosDemanda.length - 1})
          </h2>

          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Tipo</th>
                <th className={styles.tableHeader}>Número</th>
                <th className={styles.tableHeader}>Destinatário</th>
                <th className={styles.tableHeader}>Data Envio</th>
                <th className={styles.tableHeader}>Data Resposta</th>
                <th className={styles.tableHeader}>Status</th>
              </tr>
            </thead>
            <tbody>
              {documentosDemanda
                .filter((doc) => doc.id !== documentoBase?.id)
                .map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() =>
                      navigate(
                        `/documentos/${doc.id}?returnTo=list&demandaId=${documentoBase?.demandaId}`
                      )
                    }
                    className={styles.tableRow}
                  >
                    <td className={styles.tableCell}>{doc.tipoDocumento}</td>
                    <td className={styles.tableCell}>{doc.numeroDocumento}</td>
                    <td className={styles.tableCell}>{doc.destinatario}</td>
                    <td className={styles.tableCell}>
                      {formatDateToDDMMYYYYOrPlaceholder(doc.dataEnvio)}
                    </td>
                    <td className={styles.tableCell}>
                      {formatDateToDDMMYYYYOrPlaceholder(doc.dataResposta)}
                    </td>
                    <td className={styles.tableCell}>
                      <span
                        className={
                          doc.respondido
                            ? styles.statusRespondido
                            : styles.statusPendente
                        }
                      >
                        {doc.respondido ? 'Respondido' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

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
