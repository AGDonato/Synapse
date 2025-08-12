import { useState, useRef } from 'react';
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useDocumentos } from '../contexts/DocumentosContext';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import { IoTrashOutline } from 'react-icons/io5';
import { LiaEdit } from 'react-icons/lia';
import { RefreshCw } from 'lucide-react';
import Toast from '../components/ui/Toast';
import DocumentUpdateModal from '../components/documents/modals/DocumentUpdateModal';
import styles from './DetalheDocumentoPage.module.css';

export default function DetalheDocumentoPage() {
  const { documentoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getDocumento, updateDocumento, deleteDocumento } = useDocumentos();

  // Detectar de onde o usuário veio
  const returnTo = searchParams.get('returnTo');
  const demandaId = searchParams.get('demandaId');

  // Estados para modal e toast
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Refs para sincronização de altura
  const cardInformacoesRef = useRef<HTMLDivElement>(null);

  // Estado para controlar a versão ativa da decisão judicial
  const [versaoDecisaoAtiva, setVersaoDecisaoAtiva] = useState<number>(0);

  // Estado para controlar o destinatário ativo dos Ofícios Circulares
  const [destinatarioStatusAtivo, setDestinatarioStatusAtivo] =
    useState<number>(0);

  // Função para renderizar conteúdo do card Informações Adicionais baseado no tipo de documento
  const renderInformacoesAdicionais = () => {
    if (!documentoBase) return null;
    const { tipoDocumento, assunto } = documentoBase;

    // Relatório Técnico, Relatório de Inteligência, Autos Circunstanciados
    if (
      [
        'Relatório Técnico',
        'Relatório de Inteligência',
        'Autos Circunstanciados',
      ].includes(tipoDocumento)
    ) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Finalização</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataFinalizacao)}
            </dd>
          </div>
        </dl>
      );
    }

    // Mídia
    if (tipoDocumento === 'Mídia') {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Apresentou Defeito</dt>
            <dd className={styles.infoValue}>
              {documentoBase.apresentouDefeito ? 'Sim' : 'Não'}
            </dd>
          </div>
        </dl>
      );
    }

    // Ofícios Circulares
    if (tipoDocumento === 'Ofício Circular') {
      if (assunto === 'Outros') {
        return renderOficioCircularOutros();
      } else {
        return renderOficioCircularStatusCompleto();
      }
    }

    // Outros tipos de Ofício
    if (tipoDocumento === 'Ofício') {
      return renderOficioContent();
    }

    return (
      <dl className={styles.infoList}>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Número no Atena</dt>
          <dd className={styles.infoValue}>
            {documentoBase.numeroAtena || 'Não informado'}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar Ofício Circular com status completo
  const renderOficioCircularStatusCompleto = () => {
    const destinatarios =
      documentoBase?.destinatario?.split(',').map((d) => d.trim()) || [];

    if (destinatarios.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Status</dt>
            <dd className={styles.infoValue}>Nenhum destinatário encontrado</dd>
          </div>
        </dl>
      );
    }

    return (
      <div className={styles.oficioCircularMultiplos}>
        <div className={styles.destinatariosTabs}>
          {destinatarios.map((dest, index) => (
            <button
              key={index}
              className={`${styles.tabButton} ${
                index === destinatarioStatusAtivo ? styles.active : ''
              }`}
              onClick={() => setDestinatarioStatusAtivo(index)}
            >
              {dest}
            </button>
          ))}
        </div>

        <div className={styles.destinatarioStatus}>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Envio</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(
                  documentoBase?.dataEnvio || null
                )}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Resposta</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(
                  documentoBase?.dataResposta || null
                )}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Código de Rastreio</dt>
              <dd className={styles.infoValue}>
                {documentoBase?.naopossuiRastreio
                  ? 'Não possui rastreio'
                  : documentoBase?.codigoRastreio || 'Não informado'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Status</dt>
              <dd className={styles.infoValue}>
                {documentoBase?.respondido ? (
                  <span
                    className={`${styles.statusBadge} ${styles.statusSuccess}`}
                  >
                    Respondido
                  </span>
                ) : (
                  <span
                    className={`${styles.statusBadge} ${styles.statusPending}`}
                  >
                    Pendente
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  // Função para renderizar Ofício Circular "Outros" (só data de envio)
  const renderOficioCircularOutros = () => {
    const destinatarios =
      documentoBase?.destinatario?.split(',').map((d) => d.trim()) || [];

    if (destinatarios.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Status</dt>
            <dd className={styles.infoValue}>Nenhum destinatário encontrado</dd>
          </div>
        </dl>
      );
    }

    return (
      <div className={styles.oficioCircularMultiplos}>
        <div className={styles.destinatariosTabs}>
          {destinatarios.map((dest, index) => (
            <button
              key={index}
              className={`${styles.tabButton} ${
                index === destinatarioStatusAtivo ? styles.active : ''
              }`}
              onClick={() => setDestinatarioStatusAtivo(index)}
            >
              {dest}
            </button>
          ))}
        </div>

        <div className={styles.destinatarioStatus}>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Envio</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(
                  documentoBase?.dataEnvio || null
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  // Função para renderizar conteúdo de Ofício baseado no assunto
  const renderOficioContent = () => {
    if (!documentoBase) return null;

    // Ofícios de encaminhamento específicos têm renderização diferenciada
    const baseContent = (
      <dl className={styles.infoList}>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Número no Atena</dt>
          <dd className={styles.infoValue}>
            {documentoBase.numeroAtena || 'Não informado'}
          </dd>
        </div>
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
          <dt className={styles.infoLabel}>Código de Rastreio</dt>
          <dd className={styles.infoValue}>
            {documentoBase.naopossuiRastreio
              ? 'Não possui rastreio'
              : documentoBase.codigoRastreio || 'Não informado'}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Status</dt>
          <dd className={styles.infoValue}>
            {documentoBase.respondido ? (
              <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                Respondido
              </span>
            ) : (
              <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                Pendente
              </span>
            )}
          </dd>
        </div>
      </dl>
    );

    return baseContent;
  };

  // Função para determinar para onde voltar
  const getBackUrl = () => {
    if (returnTo === 'demanda' && demandaId) {
      return `/demandas/${demandaId}`;
    }
    return '/documentos';
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

  const documentoBase = documentoId
    ? getDocumento(parseInt(documentoId))
    : undefined;

  // Obter todos os documentos da mesma demanda
  const { documentos } = useDocumentos();
  const documentosDemanda = documentoBase
    ? documentos.filter((doc) => doc.demandaId === documentoBase.demandaId)
    : [];

  // Função para obter todas as versões da decisão judicial
  const getDecisaoJudicialVersions = (baseDoc: DocumentoDemanda) => {
    return documentosDemanda.filter(
      (doc) =>
        doc.tipoDocumento === 'Decisão Judicial' &&
        doc.numeroDocumento.split('-')[0] ===
          baseDoc.numeroDocumento.split('-')[0]
    );
  };

  // Função para converter número em ordinal (1ª, 2ª, 3ª, etc.)
  const getOrdinal = (num: number) => {
    return `${num}ª`;
  };

  // Função para renderizar dados da versão selecionada
  const renderVersaoDecisaoJudicial = (versoes: DocumentoDemanda[]) => {
    if (versoes.length === 0) return null;

    const versaoAtual = versoes[versaoDecisaoAtiva] || versoes[0];

    return (
      <dl className={styles.infoList}>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Data de Assinatura</dt>
          <dd className={styles.infoValue}>
            {formatDateToDDMMYYYYOrPlaceholder(versaoAtual.dataAssinatura)}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Autoridade</dt>
          <dd className={styles.infoValue}>
            {versaoAtual.autoridade || 'Não informado'}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Órgão Judicial</dt>
          <dd className={styles.infoValue}>
            {versaoAtual.orgaoJudicial || 'Não informado'}
          </dd>
        </div>
        {versaoAtual.retificada && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Retificações</dt>
            <dd className={styles.infoValue}>
              {Array.isArray(versaoAtual.retificacoes)
                ? versaoAtual.retificacoes.join(', ')
                : versaoAtual.retificacoes}
            </dd>
          </div>
        )}
      </dl>
    );
  };

  // Função para obter todos os cards que devem ser exibidos
  const getCardsToShow = () => {
    const cards: Array<{
      id: string;
      title: string;
      titleExtra?: React.ReactNode;
      icon: string;
      color: string;
      ref?: React.RefObject<HTMLDivElement | null>;
      className?: string;
      content: React.ReactNode;
    }> = [];

    if (!documentoBase) return cards;

    const { tipoDocumento } = documentoBase;

    // Card de Informações do Documento (sempre presente)
    cards.push({
      id: 'informacoes',
      title: 'Informações do Documento',
      icon: 'file-text',
      color: 'blue',
      ref: cardInformacoesRef,
      content: (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Tipo de Documento</dt>
            <dd className={styles.infoValue}>{documentoBase.tipoDocumento}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Número do Documento</dt>
            <dd className={styles.infoValue}>
              {documentoBase.numeroDocumento}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Assunto</dt>
            <dd className={styles.infoValue}>
              {documentoBase.assunto}
              {documentoBase.assunto === 'Outros' &&
                documentoBase.assuntoOutros && (
                  <span className={styles.assuntoOutros}>
                    {' '}
                    - {documentoBase.assuntoOutros}
                  </span>
                )}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Destinatário</dt>
            <dd className={styles.infoValue}>
              {documentoBase.destinatario || 'Não informado'}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Endereçamento</dt>
            <dd className={styles.infoValue}>
              {documentoBase.enderecamento || 'Não informado'}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Analista</dt>
            <dd className={styles.infoValue}>
              {documentoBase.analista || 'Não informado'}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Ano do Documento</dt>
            <dd className={styles.infoValue}>
              {documentoBase.anoDocumento || 'Não informado'}
            </dd>
          </div>
        </dl>
      ),
    });

    // Card de Informações Adicionais (varia conforme tipo de documento)
    const informacoesAdicionaisContent = renderInformacoesAdicionais();
    if (informacoesAdicionaisContent) {
      cards.push({
        id: 'informacoes_adicionais',
        title: 'Informações Adicionais',
        icon: 'info',
        color: 'green',
        content: informacoesAdicionaisContent,
      });
    }

    // Card de Decisão Judicial com versões
    if (tipoDocumento === 'Decisão Judicial') {
      const versoes = getDecisaoJudicialVersions(documentoBase);
      if (versoes.length > 0) {
        const titleExtra =
          versoes.length > 1 ? (
            <div className={styles.versoesTabs}>
              {versoes.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.versaoTab} ${
                    index === versaoDecisaoAtiva ? styles.active : ''
                  }`}
                  onClick={() => setVersaoDecisaoAtiva(index)}
                >
                  {getOrdinal(index + 1)} versão
                </button>
              ))}
            </div>
          ) : null;

        cards.push({
          id: 'decisao_judicial',
          title: 'Detalhes da Decisão Judicial',
          titleExtra,
          icon: 'gavel',
          color: 'purple',
          content: renderVersaoDecisaoJudicial(versoes),
        });
      }
    }

    // Card específico para Mídia
    if (tipoDocumento === 'Mídia') {
      cards.push({
        id: 'detalhes_midia',
        title: 'Detalhes da Mídia',
        icon: 'hard-drive',
        color: 'orange',
        content: (
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tipo de Mídia</dt>
              <dd className={styles.infoValue}>
                {documentoBase.tipoMidia || 'Não informado'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tamanho</dt>
              <dd className={styles.infoValue}>
                {documentoBase.tamanhoMidia || 'Não informado'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Hash MD5</dt>
              <dd className={styles.infoValue}>
                {documentoBase.hashMidia || 'Não informado'}
              </dd>
            </div>
          </dl>
        ),
      });
    }

    return cards;
  };

  // Função para renderizar ícones
  const renderIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'file-text': (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          fill='currentColor'
          viewBox='0 0 16 16'
        >
          <path d='M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z' />
          <path d='M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z' />
        </svg>
      ),
      info: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          fill='currentColor'
          viewBox='0 0 16 16'
        >
          <path d='m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z' />
        </svg>
      ),
      gavel: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          fill='currentColor'
          viewBox='0 0 16 16'
        >
          <path d='M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5.009 5.009 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334z' />
        </svg>
      ),
      'hard-drive': (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          fill='currentColor'
          viewBox='0 0 16 16'
        >
          <path d='M4 10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2zM6 10.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0zm3 0a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0z' />
          <path d='M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H0V4zM0 7v5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V7H0z' />
        </svg>
      ),
    };

    return iconMap[iconName] || iconMap['file-text'];
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
                onClick={() => setIsUpdateModalOpen(true)}
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

      {/* Cards em Layout Vertical Natural */}
      <div className={styles.cardsVertical}>
        {getCardsToShow().map((card) => (
          <div
            key={card.id}
            data-card-id={card.id}
            ref={card.id === 'informacoes' ? cardInformacoesRef : card.ref}
            className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
              card.id === 'informacoes' ? styles.cardInformacoes : ''
            }`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>{renderIcon(card.icon)}</div>
              <h3 className={styles.cardTitle}>
                {card.title}
                {card.titleExtra}
              </h3>
            </div>
            {card.content}
          </div>
        ))}
      </div>

      {/* Novo Modal de Atualização com Estados Temporários */}
      <DocumentUpdateModal
        documento={documentoBase}
        documentosDemanda={documentosDemanda}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSave={(updateData) => {
          if (documentoId) {
            updateDocumento(parseInt(documentoId), updateData);
            setToastMessage('Documento atualizado com sucesso!');
            setToastType('success');
            setShowToast(true);
          }
        }}
        onError={(errorMessage) => {
          setToastMessage(errorMessage);
          setToastType('error');
          setShowToast(true);
        }}
        getDocumento={getDocumento}
      />

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
                .filter((doc) => doc.id !== documentoBase.id)
                .map((doc) => (
                  <tr
                    key={doc.id}
                    className={styles.tableRow}
                    onClick={() =>
                      navigate(
                        `/documentos/${doc.id}?returnTo=${returnTo}&demandaId=${demandaId}`
                      )
                    }
                  >
                    <td className={styles.tableCell}>{doc.tipoDocumento}</td>
                    <td className={styles.tableCell}>{doc.numeroDocumento}</td>
                    <td className={styles.tableCell}>
                      {doc.destinatario || 'N/A'}
                    </td>
                    <td className={styles.tableCell}>
                      {formatDateToDDMMYYYYOrPlaceholder(doc.dataEnvio)}
                    </td>
                    <td className={styles.tableCell}>
                      {formatDateToDDMMYYYYOrPlaceholder(doc.dataResposta)}
                    </td>
                    <td className={styles.tableCell}>
                      {doc.respondido ? (
                        <span
                          className={`${styles.statusBadge} ${styles.statusSuccess}`}
                        >
                          Respondido
                        </span>
                      ) : (
                        <span
                          className={`${styles.statusBadge} ${styles.statusPending}`}
                        >
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast para feedback */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
