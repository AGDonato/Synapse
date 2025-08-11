import { useState, useRef } from 'react';
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

  // Estados para datas formatadas (calendário avançado)
  const [dataEnvioFormatted, setDataEnvioFormatted] = useState('');
  const [dataRespostaFormatted, setDataRespostaFormatted] = useState('');
  const [dataFinalizacaoFormatted, setDataFinalizacaoFormatted] = useState('');

  // Refs para sincronização de altura
  const cardInformacoesRef = useRef<HTMLDivElement>(null);
  const cardPesquisaRef = useRef<HTMLDivElement>(null);

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
  // Estados para seleção de documentos relacionados
  const [selectedMidias, setSelectedMidias] = useState<string[]>([]);
  const [selectedRelatoriosTecnicos, setSelectedRelatoriosTecnicos] = useState<
    string[]
  >([]);
  const [selectedRelatoriosInteligencia, setSelectedRelatoriosInteligencia] =
    useState<string[]>([]);
  const [selectedAutosCircunstanciados, setSelectedAutosCircunstanciados] =
    useState<string[]>([]);
  const [selectedDecisoes, setSelectedDecisoes] = useState<string[]>([]);

  // Estados para Ofício Circular - dados por destinatário
  interface DestinatarioData {
    nome: string;
    dataEnvio: string;
    dataResposta: string;
    codigoRastreio: string;
    naopossuiRastreio: boolean;
    // Campos formatados para calendário avançado
    dataEnvioFormatted?: string;
    dataRespostaFormatted?: string;
  }
  const [destinatariosData, setDestinatariosData] = useState<
    DestinatarioData[]
  >([]);

  // Estados iniciais para comparação
  const [initialSelectedMidias, setInitialSelectedMidias] = useState<string[]>(
    []
  );
  const [
    initialSelectedRelatoriosTecnicos,
    setInitialSelectedRelatoriosTecnicos,
  ] = useState<string[]>([]);
  const [
    initialSelectedRelatoriosInteligencia,
    setInitialSelectedRelatoriosInteligencia,
  ] = useState<string[]>([]);
  const [
    initialSelectedAutosCircunstanciados,
    setInitialSelectedAutosCircunstanciados,
  ] = useState<string[]>([]);
  const [initialDestinatariosData, setInitialDestinatariosData] = useState<
    DestinatarioData[]
  >([]);

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
              {formatDateToDDMMYYYYOrPlaceholder(
                documentoBase?.dataFinalizacao
              )}
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
            <dt className={styles.infoLabel}>Status de Defeito</dt>
            <dd className={styles.infoValue}>
              {documentoBase?.apresentouDefeito ? 'Defeituosa' : 'Sem defeito'}
            </dd>
          </div>
        </dl>
      );
    }

    // Ofício Circular (exceto "Outros")
    if (tipoDocumento === 'Ofício Circular' && assunto !== 'Outros') {
      return renderOficioCircularStatusCompleto();
    }

    // Ofício Circular ("Outros")
    if (tipoDocumento === 'Ofício Circular' && assunto === 'Outros') {
      return renderOficioCircularOutros();
    }

    // Ofício - tipos com dados próprios
    if (tipoDocumento === 'Ofício') {
      return renderOficioContent();
    }

    // Padrão (não deve chegar aqui, mas retorna vazio)
    return (
      <dl className={styles.infoList}>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Nenhuma informação adicional</dt>
          <dd className={styles.infoValue}>-</dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar Ofício Circular com status completo
  const renderOficioCircularStatusCompleto = () => {
    if (!documentoBase) return null;

    if (getDestinatariosStatusData().length > 1) {
      return (
        <>
          <div className={styles.versaoContent}>
            {renderDestinatarioStatus(destinatarioStatusAtivo)}
          </div>
          <div className={styles.dotsContainer}>
            {getDestinatariosStatusData().map((destinatario, index) => (
              <button
                key={index}
                className={`${styles.dotButton} ${destinatarioStatusAtivo === index ? styles.active : ''}`}
                onClick={() => setDestinatarioStatusAtivo(index)}
                title={destinatario.nome}
              />
            ))}
          </div>
        </>
      );
    } else {
      return (
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
      );
    }
  };

  // Função para renderizar Ofício Circular "Outros" (só data de envio)
  const renderOficioCircularOutros = () => {
    if (!documentoBase) return null;

    if (getDestinatariosStatusData().length > 1) {
      return (
        <>
          <div className={styles.versaoContent}>
            <dl className={styles.infoList}>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Data de Envio</dt>
                <dd className={styles.infoValue}>
                  {formatDateToDDMMYYYYOrPlaceholder(
                    getDestinatariosStatusData()[destinatarioStatusAtivo]
                      ?.dataEnvio
                  )}
                </dd>
              </div>
            </dl>
          </div>
          <div className={styles.dotsContainer}>
            {getDestinatariosStatusData().map((destinatario, index) => (
              <button
                key={index}
                className={`${styles.dotButton} ${destinatarioStatusAtivo === index ? styles.active : ''}`}
                onClick={() => setDestinatarioStatusAtivo(index)}
                title={destinatario.nome}
              />
            ))}
          </div>
        </>
      );
    } else {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        </dl>
      );
    }
  };

  // Função para renderizar conteúdo de Ofício baseado no assunto
  const renderOficioContent = () => {
    if (!documentoBase) return null;
    const { assunto } = documentoBase;

    // Tipos de encaminhamento (mostram informações do item encaminhado)
    if (assunto === 'Encaminhamento de mídia') {
      return renderEncaminhamentoMidia();
    }
    if (assunto === 'Encaminhamento de relatório técnico') {
      return renderEncaminhamentoRelatorioTecnico();
    }
    if (assunto === 'Encaminhamento de relatório de inteligência') {
      return renderEncaminhamentoRelatorioInteligencia();
    }
    if (assunto === 'Encaminhamento de relatório técnico e mídia') {
      return renderEncaminhamentoRelatorioTecnicoMidia();
    }
    if (assunto === 'Encaminhamento de autos circunstanciados') {
      return renderEncaminhamentoAutosCircunstanciados();
    }
    if (assunto === 'Encaminhamento de decisão judicial') {
      return renderEncaminhamentoDecisaoJudicial();
    }

    // Comunicação de não cumprimento
    if (assunto === 'Comunicação de não cumprimento de decisão judicial') {
      return renderComunicacaoNaoCumprimento();
    }

    // Outros (só data de envio)
    if (assunto === 'Outros') {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        </dl>
      );
    }

    // Tipos com dados próprios (status completo)
    return (
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
    );
  };

  // Funções para renderizar encaminhamentos específicos
  const renderEncaminhamentoMidia = () => {
    if (selectedMidias.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Mídia Encaminhada</dt>
            <dd className={styles.infoValue}>Nenhuma selecionada</dd>
          </div>
        </dl>
      );
    }

    // Buscar informações completas das mídias selecionadas
    const midiasInfo = selectedMidias
      .map((id) => {
        const doc = getDocumento(parseInt(id));
        if (doc) {
          return {
            numero: doc.numeroDocumento,
            tipo: doc.tipoMidia || 'Tipo não informado',
            tamanho: doc.tamanhoMidia || 'Tamanho não informado',
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <dl className={styles.infoList}>
        {midiasInfo.map((midia, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < midiasInfo.length - 1 ? '1.5rem' : '0',
            }}
          >
            <div
              className={styles.infoItem}
              style={{ marginBottom: '0.75rem' }}
            >
              <dt
                className={styles.infoLabel}
                style={{
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Mídia {midiasInfo.length > 1 ? `${index + 1}` : ''}
              </dt>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>{midia?.numero}</dd>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Tipo de Mídia</dt>
              <dd className={styles.infoValue}>{midia?.tipo}</dd>
            </div>
            <div className={styles.infoItem} style={{ paddingLeft: '0.75rem' }}>
              <dt className={styles.infoLabel}>Tamanho</dt>
              <dd className={styles.infoValue}>{midia?.tamanho}</dd>
            </div>
            {index < midiasInfo.length - 1 && (
              <hr
                style={{
                  margin: '1.25rem 0',
                  border: 'none',
                  borderTop: '1px solid #dee2e6',
                }}
              />
            )}
          </div>
        ))}
      </dl>
    );
  };

  const renderEncaminhamentoRelatorioTecnico = () => {
    if (selectedRelatoriosTecnicos.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Relatório Técnico Encaminhado</dt>
            <dd className={styles.infoValue}>Nenhum selecionado</dd>
          </div>
        </dl>
      );
    }

    // Buscar informações completas dos relatórios selecionados
    const relatoriosInfo = selectedRelatoriosTecnicos
      .map((id) => {
        const doc = getDocumento(parseInt(id));
        if (doc) {
          return {
            numero: doc.numeroDocumento,
            assunto: doc.assunto || 'Sem assunto',
            enderecamento: doc.enderecamento || 'Sem endereçamento',
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <dl className={styles.infoList}>
        {relatoriosInfo.map((relatorio, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < relatoriosInfo.length - 1 ? '1.5rem' : '0',
            }}
          >
            <div
              className={styles.infoItem}
              style={{ marginBottom: '0.75rem' }}
            >
              <dt
                className={styles.infoLabel}
                style={{
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Relatório Técnico{' '}
                {relatoriosInfo.length > 1 ? `${index + 1}` : ''}
              </dt>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>{relatorio?.numero}</dd>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Assunto</dt>
              <dd className={styles.infoValue}>{relatorio?.assunto}</dd>
            </div>
            <div className={styles.infoItem} style={{ paddingLeft: '0.75rem' }}>
              <dt className={styles.infoLabel}>Endereçamento</dt>
              <dd className={styles.infoValue}>{relatorio?.enderecamento}</dd>
            </div>
            {index < relatoriosInfo.length - 1 && (
              <hr
                style={{
                  margin: '1.25rem 0',
                  border: 'none',
                  borderTop: '1px solid #dee2e6',
                }}
              />
            )}
          </div>
        ))}
      </dl>
    );
  };

  const renderEncaminhamentoRelatorioInteligencia = () => {
    if (selectedRelatoriosInteligencia.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              Relatório de Inteligência Encaminhado
            </dt>
            <dd className={styles.infoValue}>Nenhum selecionado</dd>
          </div>
        </dl>
      );
    }

    // Buscar informações completas dos relatórios selecionados
    const relatoriosInfo = selectedRelatoriosInteligencia
      .map((id) => {
        const doc = getDocumento(parseInt(id));
        if (doc) {
          return {
            numero: doc.numeroDocumento,
            assunto: doc.assunto || 'Sem assunto',
            enderecamento: doc.enderecamento || 'Sem endereçamento',
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <dl className={styles.infoList}>
        {relatoriosInfo.map((relatorio, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < relatoriosInfo.length - 1 ? '1.5rem' : '0',
            }}
          >
            <div
              className={styles.infoItem}
              style={{ marginBottom: '0.75rem' }}
            >
              <dt
                className={styles.infoLabel}
                style={{
                  fontWeight: 'bold',
                  color: '#6f42c1',
                  fontSize: '0.9rem',
                }}
              >
                🔍 RELATÓRIO DE INTELIGÊNCIA{' '}
                {relatoriosInfo.length > 1 ? `#${index + 1}` : ''}
              </dt>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>{relatorio?.numero}</dd>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Assunto</dt>
              <dd className={styles.infoValue}>{relatorio?.assunto}</dd>
            </div>
            <div className={styles.infoItem} style={{ paddingLeft: '0.75rem' }}>
              <dt className={styles.infoLabel}>Endereçamento</dt>
              <dd className={styles.infoValue}>{relatorio?.enderecamento}</dd>
            </div>
            {index < relatoriosInfo.length - 1 && (
              <hr
                style={{
                  margin: '1.25rem 0',
                  border: 'none',
                  borderTop: '1px solid #dee2e6',
                }}
              />
            )}
          </div>
        ))}
      </dl>
    );
  };

  const renderEncaminhamentoRelatorioTecnicoMidia = () => {
    const hasRelatorios = selectedRelatoriosTecnicos.length > 0;
    const hasMidias = selectedMidias.length > 0;

    // Buscar informações dos relatórios
    const relatoriosInfo = hasRelatorios
      ? selectedRelatoriosTecnicos
          .map((id) => {
            const doc = getDocumento(parseInt(id));
            if (doc) {
              return {
                numero: doc.numeroDocumento,
                assunto: doc.assunto || 'Sem assunto',
                enderecamento: doc.enderecamento || 'Sem endereçamento',
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    // Buscar informações das mídias
    const midiasInfo = hasMidias
      ? selectedMidias
          .map((id) => {
            const doc = getDocumento(parseInt(id));
            if (doc) {
              return {
                numero: doc.numeroDocumento,
                tipo: doc.tipoMidia || 'Tipo não informado',
                tamanho: doc.tamanhoMidia || 'Tamanho não informado',
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    return (
      <dl className={styles.infoList}>
        {/* Seção de Relatórios Técnicos */}
        {hasRelatorios && (
          <>
            {relatoriosInfo.map((relatorio, index) => (
              <div
                key={`rel-${index}`}
                style={{
                  marginBottom:
                    index < relatoriosInfo.length - 1 ? '1.5rem' : '0',
                }}
              >
                <div
                  className={styles.infoItem}
                  style={{ marginBottom: '0.75rem' }}
                >
                  <dt
                    className={styles.infoLabel}
                    style={{
                      fontWeight: '600',
                      color: '#495057',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Relatório Técnico{' '}
                    {relatoriosInfo.length > 1 ? `${index + 1}` : ''}
                  </dt>
                </div>
                <div
                  className={styles.infoItem}
                  style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
                >
                  <dt className={styles.infoLabel}>Número do Documento</dt>
                  <dd className={styles.infoValue}>{relatorio?.numero}</dd>
                </div>
                <div
                  className={styles.infoItem}
                  style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
                >
                  <dt className={styles.infoLabel}>Assunto</dt>
                  <dd className={styles.infoValue}>{relatorio?.assunto}</dd>
                </div>
                <div
                  className={styles.infoItem}
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <dt className={styles.infoLabel}>Endereçamento</dt>
                  <dd className={styles.infoValue}>
                    {relatorio?.enderecamento}
                  </dd>
                </div>
                {index < relatoriosInfo.length - 1 && (
                  <hr
                    style={{
                      margin: '1.25rem 0',
                      border: 'none',
                      borderTop: '1px solid #dee2e6',
                    }}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {/* Seção de Mídias */}
        {hasMidias && (
          <>
            {midiasInfo.map((midia, index) => (
              <div
                key={`mid-${index}`}
                style={{
                  marginBottom: index < midiasInfo.length - 1 ? '1.5rem' : '0',
                  marginTop: hasRelatorios && index === 0 ? '1.5rem' : '0',
                }}
              >
                <div
                  className={styles.infoItem}
                  style={{ marginBottom: '0.75rem' }}
                >
                  <dt
                    className={styles.infoLabel}
                    style={{
                      fontWeight: '600',
                      color: '#495057',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Mídia {midiasInfo.length > 1 ? `${index + 1}` : ''}
                  </dt>
                </div>
                <div
                  className={styles.infoItem}
                  style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
                >
                  <dt className={styles.infoLabel}>Número do Documento</dt>
                  <dd className={styles.infoValue}>{midia?.numero}</dd>
                </div>
                <div
                  className={styles.infoItem}
                  style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
                >
                  <dt className={styles.infoLabel}>Tipo de Mídia</dt>
                  <dd className={styles.infoValue}>{midia?.tipo}</dd>
                </div>
                <div
                  className={styles.infoItem}
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <dt className={styles.infoLabel}>Tamanho</dt>
                  <dd className={styles.infoValue}>{midia?.tamanho}</dd>
                </div>
                {index < midiasInfo.length - 1 && (
                  <hr
                    style={{
                      margin: '1.25rem 0',
                      border: 'none',
                      borderTop: '1px solid #dee2e6',
                    }}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {/* Caso nenhum item tenha sido selecionado */}
        {!hasRelatorios && !hasMidias && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Documentos Encaminhados</dt>
            <dd className={styles.infoValue}>Nenhum documento selecionado</dd>
          </div>
        )}
      </dl>
    );
  };

  const renderEncaminhamentoAutosCircunstanciados = () => {
    if (selectedAutosCircunstanciados.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              Autos Circunstanciados Encaminhados
            </dt>
            <dd className={styles.infoValue}>Nenhum selecionado</dd>
          </div>
        </dl>
      );
    }

    // Buscar informações completas dos autos selecionados
    const autosInfo = selectedAutosCircunstanciados
      .map((id) => {
        const doc = getDocumento(parseInt(id));
        if (doc) {
          return {
            numero: doc.numeroDocumento,
            assunto: doc.assunto || 'Sem assunto',
            enderecamento: doc.enderecamento || 'Sem endereçamento',
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <dl className={styles.infoList}>
        {autosInfo.map((auto, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < autosInfo.length - 1 ? '1.5rem' : '0',
            }}
          >
            <div
              className={styles.infoItem}
              style={{ marginBottom: '0.75rem' }}
            >
              <dt
                className={styles.infoLabel}
                style={{
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Autos Circunstanciados{' '}
                {autosInfo.length > 1 ? `${index + 1}` : ''}
              </dt>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>{auto?.numero}</dd>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Assunto</dt>
              <dd className={styles.infoValue}>{auto?.assunto}</dd>
            </div>
            <div className={styles.infoItem} style={{ paddingLeft: '0.75rem' }}>
              <dt className={styles.infoLabel}>Endereçamento</dt>
              <dd className={styles.infoValue}>{auto?.enderecamento}</dd>
            </div>
            {index < autosInfo.length - 1 && (
              <hr
                style={{
                  margin: '1.25rem 0',
                  border: 'none',
                  borderTop: '1px solid #dee2e6',
                }}
              />
            )}
          </div>
        ))}
      </dl>
    );
  };

  const renderEncaminhamentoDecisaoJudicial = () => {
    if (selectedDecisoes.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Decisão Judicial Encaminhada</dt>
            <dd className={styles.infoValue}>Nenhuma selecionada</dd>
          </div>
        </dl>
      );
    }

    // Buscar informações completas das decisões selecionadas
    const decisoesInfo = selectedDecisoes
      .map((id) => {
        const doc = getDocumento(parseInt(id));
        if (doc) {
          return {
            numero: doc.numeroDocumento,
            autoridade: doc.autoridade || 'Autoridade não informada',
            orgaoJudicial: doc.orgaoJudicial || 'Órgão judicial não informado',
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <dl className={styles.infoList}>
        {decisoesInfo.map((decisao, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < decisoesInfo.length - 1 ? '1.5rem' : '0',
            }}
          >
            <div
              className={styles.infoItem}
              style={{ marginBottom: '0.75rem' }}
            >
              <dt
                className={styles.infoLabel}
                style={{
                  fontWeight: '600',
                  color: '#fd7e14',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Decisão Judicial {decisoesInfo.length > 1 ? `${index + 1}` : ''}
              </dt>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>{decisao?.numero}</dd>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Autoridade</dt>
              <dd className={styles.infoValue}>{decisao?.autoridade}</dd>
            </div>
            <div className={styles.infoItem} style={{ paddingLeft: '0.75rem' }}>
              <dt className={styles.infoLabel}>Órgão Judicial</dt>
              <dd className={styles.infoValue}>{decisao?.orgaoJudicial}</dd>
            </div>
            {index < decisoesInfo.length - 1 && (
              <hr
                style={{
                  margin: '1.25rem 0',
                  border: 'none',
                  borderTop: '1px solid #dee2e6',
                }}
              />
            )}
          </div>
        ))}
      </dl>
    );
  };

  const renderComunicacaoNaoCumprimento = () => {
    if (selectedDecisoes.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Ofícios Relacionados</dt>
            <dd className={styles.infoValue}>Nenhum selecionado</dd>
          </div>
        </dl>
      );
    }

    // Buscar informações completas dos ofícios selecionados
    const oficiosInfo = selectedDecisoes
      .map((id) => {
        const doc = getDocumento(parseInt(id));
        if (doc) {
          return {
            numero: doc.numeroDocumento,
            destinatario: doc.destinatario || 'Sem destinatário',
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <dl className={styles.infoList}>
        {oficiosInfo.map((oficio, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < oficiosInfo.length - 1 ? '1.5rem' : '0',
            }}
          >
            <div
              className={styles.infoItem}
              style={{ marginBottom: '0.75rem' }}
            >
              <dt
                className={styles.infoLabel}
                style={{
                  fontWeight: 'bold',
                  color: '#dc3545',
                  fontSize: '0.9rem',
                }}
              >
                📨 OFÍCIO {oficiosInfo.length > 1 ? `#${index + 1}` : ''}
              </dt>
            </div>
            <div
              className={styles.infoItem}
              style={{ paddingLeft: '0.75rem', marginBottom: '0.5rem' }}
            >
              <dt className={styles.infoLabel}>Número do Ofício</dt>
              <dd className={styles.infoValue}>{oficio?.numero}</dd>
            </div>
            <div className={styles.infoItem} style={{ paddingLeft: '0.75rem' }}>
              <dt className={styles.infoLabel}>Destinatário</dt>
              <dd className={styles.infoValue}>{oficio?.destinatario}</dd>
            </div>
            {index < oficiosInfo.length - 1 && (
              <hr
                style={{
                  margin: '1.25rem 0',
                  border: 'none',
                  borderTop: '1px solid #dee2e6',
                }}
              />
            )}
          </div>
        ))}
      </dl>
    );
  };

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

  // Funções de formatação de data para calendário avançado (igual DetalheDemandaPage)
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

  // Funções de manipulação de datas formatadas
  const handleDataEnvioChange = (value: string) => {
    const formatted = formatDateMask(value);
    setDataEnvioFormatted(formatted);
    setDataEnvio(convertToInputDate(formatted));
  };

  const handleDataEnvioCalendarChange = (value: string) => {
    const formatted = convertFromHTMLDate(value);
    setDataEnvioFormatted(formatted);
    setDataEnvio(convertToInputDate(formatted));
  };

  const handleDataRespostaChange = (value: string) => {
    const formatted = formatDateMask(value);
    setDataRespostaFormatted(formatted);
    setDataResposta(convertToInputDate(formatted));
  };

  const handleDataRespostaCalendarChange = (value: string) => {
    const formatted = convertFromHTMLDate(value);
    setDataRespostaFormatted(formatted);
    setDataResposta(convertToInputDate(formatted));
  };

  const handleDataFinalizacaoChange = (value: string) => {
    const formatted = formatDateMask(value);
    setDataFinalizacaoFormatted(formatted);
    setDataFinalizacao(convertToInputDate(formatted));
  };

  const handleDataFinalizacaoCalendarChange = (value: string) => {
    const formatted = convertFromHTMLDate(value);
    setDataFinalizacaoFormatted(formatted);
    setDataFinalizacao(convertToInputDate(formatted));
  };

  // Funções para manipular datas dos destinatários (Ofício Circular)
  const handleDestinatarioDataEnvioChange = (index: number, value: string) => {
    const formatted = formatDateMask(value);
    const newData = [...destinatariosData];
    newData[index].dataEnvioFormatted = formatted;
    newData[index].dataEnvio = convertToInputDate(formatted);
    setDestinatariosData(newData);
  };

  const handleDestinatarioDataEnvioCalendarChange = (
    index: number,
    value: string
  ) => {
    const formatted = convertFromHTMLDate(value);
    const newData = [...destinatariosData];
    newData[index].dataEnvioFormatted = formatted;
    newData[index].dataEnvio = convertToInputDate(formatted);
    setDestinatariosData(newData);
  };

  const handleDestinatarioDataRespostaChange = (
    index: number,
    value: string
  ) => {
    const formatted = formatDateMask(value);
    const newData = [...destinatariosData];
    newData[index].dataRespostaFormatted = formatted;
    newData[index].dataResposta = convertToInputDate(formatted);
    setDestinatariosData(newData);
  };

  const handleDestinatarioDataRespostaCalendarChange = (
    index: number,
    value: string
  ) => {
    const formatted = convertFromHTMLDate(value);
    const newData = [...destinatariosData];
    newData[index].dataRespostaFormatted = formatted;
    newData[index].dataResposta = convertToInputDate(formatted);
    setDestinatariosData(newData);
  };

  // Função para verificar se houve alterações nos campos do modal
  const hasChanges = () => {
    // Função auxiliar para comparar arrays
    const arraysEqual = (arr1: string[], arr2: string[]): boolean => {
      return (
        arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i])
      );
    };

    // Função auxiliar para comparar arrays de destinatários
    const destinatariosEqual = (
      arr1: DestinatarioData[],
      arr2: DestinatarioData[]
    ): boolean => {
      return (
        arr1.length === arr2.length &&
        arr1.every(
          (val, i) =>
            val.nome === arr2[i]?.nome &&
            val.dataEnvio === arr2[i]?.dataEnvio &&
            val.dataResposta === arr2[i]?.dataResposta &&
            val.codigoRastreio === arr2[i]?.codigoRastreio &&
            val.naopossuiRastreio === arr2[i]?.naopossuiRastreio &&
            val.dataEnvioFormatted === arr2[i]?.dataEnvioFormatted &&
            val.dataRespostaFormatted === arr2[i]?.dataRespostaFormatted
        )
      );
    };

    return (
      numeroAtena !== initialNumeroAtena ||
      dataEnvio !== initialDataEnvio ||
      codigoRastreio !== initialCodigoRastreio ||
      naopossuiRastreio !== initialNaopossuiRastreio ||
      dataResposta !== initialDataResposta ||
      dataFinalizacao !== initialDataFinalizacao ||
      apresentouDefeito !== initialApresentouDefeito ||
      !arraysEqual(selectedMidias, initialSelectedMidias) ||
      !arraysEqual(
        selectedRelatoriosTecnicos,
        initialSelectedRelatoriosTecnicos
      ) ||
      !arraysEqual(
        selectedRelatoriosInteligencia,
        initialSelectedRelatoriosInteligencia
      ) ||
      !arraysEqual(
        selectedAutosCircunstanciados,
        initialSelectedAutosCircunstanciados
      ) ||
      !destinatariosEqual(destinatariosData, initialDestinatariosData)
    );
  };

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
      const dataFinalizacaoValue = convertToInputDate(
        documentoBase.dataFinalizacao
      );
      const apresentouDefeitoValue = documentoBase.apresentouDefeito ?? false;

      // Definir valores atuais
      setNumeroAtena(numeroAtenaValue);
      setDataEnvio(dataEnvioValue);
      setCodigoRastreio(codigoRastreioValue);
      setNaopossuiRastreio(naopossuiRastreioValue);
      setDataResposta(dataRespostaValue);
      setDataFinalizacao(dataFinalizacaoValue);
      setApresentouDefeito(apresentouDefeitoValue);

      // Definir valores formatados para calendário
      setDataEnvioFormatted(convertToBrazilianDate(dataEnvioValue) || '');
      setDataRespostaFormatted(convertToBrazilianDate(dataRespostaValue) || '');
      setDataFinalizacaoFormatted(
        convertToBrazilianDate(dataFinalizacaoValue) || ''
      );

      // Definir valores iniciais para comparação
      setInitialNumeroAtena(numeroAtenaValue);
      setInitialDataEnvio(dataEnvioValue);
      setInitialCodigoRastreio(codigoRastreioValue);
      setInitialNaopossuiRastreio(naopossuiRastreioValue);
      setInitialDataResposta(dataRespostaValue);
      setInitialDataFinalizacao(dataFinalizacaoValue);
      setInitialApresentouDefeito(apresentouDefeitoValue);

      // Inicializar estados de seleção vazios
      setSelectedMidias([]);
      setSelectedRelatoriosTecnicos([]);
      setSelectedRelatoriosInteligencia([]);
      setSelectedAutosCircunstanciados([]);
      setSelectedDecisoes([]);

      // Inicializar dados específicos para Ofício Circular
      if (documentoBase.tipoDocumento === 'Ofício Circular') {
        // Parse do destinatário para obter múltiplos destinatários
        const parseDestinatarios = (): string[] => {
          if (!documentoBase?.destinatario) return [];
          return documentoBase.destinatario
            .split(/,\s*|\s+e\s+/)
            .map((d) => d.trim())
            .filter((d) => d.length > 0);
        };

        const destinatarios = parseDestinatarios();

        // Criar dados iniciais para cada destinatário usando dados do documento
        const initialDestData = destinatarios.map((nome) => ({
          nome,
          dataEnvio: dataEnvioValue,
          dataResposta: dataRespostaValue,
          codigoRastreio: codigoRastreioValue,
          naopossuiRastreio: naopossuiRastreioValue,
          // Campos formatados para calendário
          dataEnvioFormatted: convertToBrazilianDate(dataEnvioValue) || '',
          dataRespostaFormatted:
            convertToBrazilianDate(dataRespostaValue) || '',
        }));

        setDestinatariosData(initialDestData);
        setInitialDestinatariosData([...initialDestData]); // Deep copy para comparação
      } else {
        setDestinatariosData([]);
        setInitialDestinatariosData([]);
      }

      // Inicializar valores iniciais para comparação dos outros arrays
      setInitialSelectedMidias([]);
      setInitialSelectedRelatoriosTecnicos([]);
      setInitialSelectedRelatoriosInteligencia([]);
      setInitialSelectedAutosCircunstanciados([]);
    }
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = () => {
    if (documentoId) {
      const modalType = getModalType();

      // Preparar dados de atualização baseados no tipo de modal
      const updateData: Partial<DocumentoDemanda> = {
        numeroAtena: numeroAtena,
      };

      // Tratar diferentes tipos de modal
      switch (modalType) {
        case 'finalizacao':
          updateData.dataFinalizacao = convertToBrazilianDate(dataFinalizacao);
          break;

        case 'midia':
          updateData.apresentouDefeito = apresentouDefeito;
          break;

        case 'oficio':
          updateData.dataEnvio = convertToBrazilianDate(dataEnvio);
          updateData.dataResposta = convertToBrazilianDate(dataResposta);
          updateData.codigoRastreio = naopossuiRastreio ? '' : codigoRastreio;
          updateData.naopossuiRastreio = naopossuiRastreio;
          updateData.respondido = !!dataResposta && dataResposta !== '';
          break;

        case 'oficio_circular':
        case 'oficio_circular_outros': {
          // Para Ofícios Circulares, manter os dados dos destinatários salvos no estado
          // Os dados específicos de cada destinatário são mantidos no estado destinatariosData
          // e serão usados pela função getDestinatariosStatusData() para exibição

          // Calcular status geral baseado em todos os destinatários
          const todosRespondidos =
            destinatariosData.length > 0 &&
            destinatariosData.every(
              (d) => !!d.dataResposta && d.dataResposta !== ''
            );

          updateData.respondido = todosRespondidos;

          // Usar dados do primeiro destinatário como referência para campos gerais (compatibilidade)
          if (destinatariosData.length > 0) {
            const primeiroDestinatar = destinatariosData[0];
            updateData.dataEnvio = convertToBrazilianDate(
              primeiroDestinatar.dataEnvio
            );
            updateData.dataResposta = convertToBrazilianDate(
              primeiroDestinatar.dataResposta
            );
            updateData.codigoRastreio = primeiroDestinatar.naopossuiRastreio
              ? ''
              : primeiroDestinatar.codigoRastreio;
            updateData.naopossuiRastreio = primeiroDestinatar.naopossuiRastreio;
          }
          break;
        }

        case 'comunicacao_nao_cumprimento':
          // Para comunicação de não cumprimento, apenas salvar as seleções
          // Os dados específicos são mantidos no selectedDecisoes
          break;

        case 'encaminhamento_decisao_judicial':
          // Para encaminhamento de decisão judicial, apenas salvar as seleções
          // Os dados específicos são mantidos no selectedDecisoes
          break;

        case 'oficio_midia':
        case 'oficio_relatorio_tecnico':
        case 'oficio_relatorio_inteligencia':
        case 'oficio_relatorio_midia':
        case 'oficio_autos_circunstanciados': {
          // Validar se todos os autos selecionados foram finalizados
          const autosNaoFinalizados = selectedAutosCircunstanciados.filter(
            (autoId) => {
              const auto = getDocumento(parseInt(autoId));
              return !auto?.dataFinalizacao || auto.dataFinalizacao === '';
            }
          );

          if (autosNaoFinalizados.length > 0) {
            const autosNaoFinalizadosInfo = autosNaoFinalizados
              .map((autoId) => {
                const auto = getDocumento(parseInt(autoId));
                return auto?.numeroDocumento;
              })
              .join(', ');

            setToastMessage(
              `Autos Circunstanciados ${autosNaoFinalizadosInfo} não foi finalizado.`
            );
            setToastType('error');
            setShowToast(true);
            return; // Impede o salvamento
          }

          // Para ofícios de encaminhamento, apenas salvar as seleções
          // Os dados específicos são mantidos nos respectivos estados selectedXXX
          break;
        }

        default:
          // Comportamento padrão para outros tipos
          updateData.dataEnvio = convertToBrazilianDate(dataEnvio);
          updateData.dataResposta = convertToBrazilianDate(dataResposta);
          updateData.codigoRastreio = naopossuiRastreio ? '' : codigoRastreio;
          updateData.naopossuiRastreio = naopossuiRastreio;
          updateData.respondido = !!dataResposta && dataResposta !== '';
          break;
      }

      updateDocumento(parseInt(documentoId), updateData);
      setIsUpdateModalOpen(false);
      setToastMessage('Documento atualizado com sucesso!');
      setToastType('success');
      setShowToast(true);

      // Limpar apenas estados que não precisam persistir
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
              Data de Finalização
            </label>
            <div className={styles.dateInputWrapper}>
              <input
                type='text'
                id='dataFinalizacao'
                value={dataFinalizacaoFormatted}
                onChange={(e) => handleDataFinalizacaoChange(e.target.value)}
                className={styles.formInput}
                placeholder='dd/mm/aaaa'
                maxLength={10}
              />
              <input
                type='date'
                value={convertToHTMLDate(dataFinalizacaoFormatted)}
                onChange={(e) =>
                  handleDataFinalizacaoCalendarChange(e.target.value)
                }
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
        );

      case 'midia':
        return (
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabelNoBorder}>
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
                Número no Atena
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
                <div className={styles.dateInputWrapper}>
                  <input
                    type='text'
                    id='dataEnvio'
                    value={dataEnvioFormatted}
                    onChange={(e) => handleDataEnvioChange(e.target.value)}
                    className={styles.formInput}
                    placeholder='dd/mm/aaaa'
                    maxLength={10}
                  />
                  <input
                    type='date'
                    value={convertToHTMLDate(dataEnvioFormatted)}
                    onChange={(e) =>
                      handleDataEnvioCalendarChange(e.target.value)
                    }
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
              <div className={styles.formGroup}>
                <label htmlFor='dataResposta' className={styles.formLabel}>
                  Data de Resposta
                </label>
                <div className={styles.dateInputWrapper}>
                  <input
                    type='text'
                    id='dataResposta'
                    value={dataRespostaFormatted}
                    onChange={(e) => handleDataRespostaChange(e.target.value)}
                    className={styles.formInput}
                    placeholder='dd/mm/aaaa'
                    maxLength={10}
                  />
                  <input
                    type='date'
                    value={convertToHTMLDate(dataRespostaFormatted)}
                    onChange={(e) =>
                      handleDataRespostaCalendarChange(e.target.value)
                    }
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
              Selecione os ofícios de encaminhamento de decisão judicial
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
                  Não há ofício de encaminhamento de decisão judicial pendente.
                </p>
              )}
            </div>
          </div>
        );

      case 'encaminhamento_decisao_judicial':
        return renderEncaminhamentoDecisaoJudicialContent();

      case 'oficio_circular':
        return renderOficioCircularContent();

      case 'oficio_circular_outros':
        return renderOficioCircularOutrosContent();

      case 'oficio_midia':
        return renderOficioMidiaContent();

      case 'oficio_relatorio_tecnico':
        return renderOficioRelatorioTecnicoContent();

      case 'oficio_relatorio_inteligencia':
        return renderOficioRelatorioInteligenciaContent();

      case 'oficio_relatorio_midia':
        return renderOficioRelatorioMidiaContent();

      case 'oficio_autos_circunstanciados':
        return renderOficioAutosCircunstanciadosContent();

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

  // Funções para gerenciar destinatários dos Ofícios Circulares
  const parseDestinatariosFromDocument = (): string[] => {
    if (!documentoBase?.destinatario) return [];
    // Separar por vírgula e "e", depois limpar espaços
    return documentoBase.destinatario
      .split(/,\s*|\s+e\s+/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
  };

  const getDestinatariosStatusData = () => {
    if (!documentoBase || documentoBase.tipoDocumento !== 'Ofício Circular')
      return [];

    const destinatarios = parseDestinatariosFromDocument();

    // Para cada destinatário, buscar dados salvos do modal ou usar dados padrão do documento
    return destinatarios.map((nome) => {
      // Verificar se há dados salvos do modal para este destinatário
      const dadosSalvos = destinatariosData.find((d) => d.nome === nome);

      if (dadosSalvos) {
        // Usar dados do modal
        return {
          nome,
          dataEnvio: dadosSalvos.dataEnvio,
          dataResposta: dadosSalvos.dataResposta,
          codigoRastreio: dadosSalvos.codigoRastreio,
          naopossuiRastreio: dadosSalvos.naopossuiRastreio,
          respondido:
            !!dadosSalvos.dataResposta && dadosSalvos.dataResposta !== '',
        };
      } else {
        // Usar dados padrão do documento (todos os destinatários têm os mesmos dados inicialmente)
        return {
          nome,
          dataEnvio: documentoBase.dataEnvio || '',
          dataResposta: documentoBase.dataResposta || '',
          codigoRastreio: documentoBase.codigoRastreio || '',
          naopossuiRastreio: documentoBase.naopossuiRastreio || false,
          respondido: documentoBase.respondido || false,
        };
      }
    });
  };

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

    if (documentoBase?.retificacoes && documentoBase.retificacoes.length > 0) {
      // Primeira versão: Decisão Judicial (dados atuais do documento - ORIGINAL)
      versoes.push({
        nome: 'Decisão Judicial',
        dados: {
          autoridade: documentoBase?.autoridade,
          orgaoJudicial: documentoBase?.orgaoJudicial,
          dataAssinatura: documentoBase?.dataAssinatura,
        },
      });

      // Adicionar todas as decisões retificadoras
      for (let i = 0; i < documentoBase.retificacoes.length; i++) {
        versoes.push({
          nome: `${getOrdinal(i + 1)} Decisão Retificadora`,
          dados: {
            autoridade: documentoBase.retificacoes[i]?.autoridade,
            orgaoJudicial: documentoBase.retificacoes[i]?.orgaoJudicial,
            dataAssinatura: documentoBase.retificacoes[i]?.dataAssinatura,
          },
        });
      }
    } else {
      // Se não há retificação, só mostra a decisão original
      versoes.push({
        nome: 'Decisão Judicial',
        dados: {
          autoridade: documentoBase?.autoridade,
          orgaoJudicial: documentoBase?.orgaoJudicial,
          dataAssinatura: documentoBase?.dataAssinatura,
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

  // Função para obter todos os cards que devem ser exibidos
  const getCardsToShow = () => {
    const cards: Array<{
      id: string;
      title: string;
      titleExtra?: React.ReactNode;
      icon: string;
      color: string;
      content: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      ref?: React.RefObject<HTMLDivElement | null>;
    }> = [];

    // Verificação de segurança - se documentoBase não existir, retornar array vazio
    if (!documentoBase) {
      return cards;
    }

    // Card 1 - Informações do Documento (sempre aparece se houver dados)
    if (hasInformacoes) {
      cards.push({
        id: 'informacoes',
        title: 'Informações do Documento',
        color: 'blue',
        icon: 'document',
        content: (
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tipo de Documento</dt>
              <dd className={styles.infoValue}>
                {documentoBase?.tipoDocumento}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Número do Documento</dt>
              <dd className={styles.infoValue}>
                {documentoBase?.numeroDocumento}
              </dd>
            </div>
            {documentoBase?.numeroAtena && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Número no Atena</dt>
                <dd className={styles.infoValue}>
                  {documentoBase?.numeroAtena}
                </dd>
              </div>
            )}
            {documentoBase?.assunto && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Assunto</dt>
                <dd className={styles.infoValue}>{documentoBase?.assunto}</dd>
              </div>
            )}
            {documentoBase?.assuntoOutros && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Assunto (Outros)</dt>
                <dd className={styles.infoValue}>
                  {documentoBase?.assuntoOutros}
                </dd>
              </div>
            )}
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Destinatário</dt>
              <dd className={styles.infoValue}>
                {documentoBase?.destinatario}
              </dd>
            </div>
            {documentoBase?.enderecamento && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Endereçamento</dt>
                <dd className={styles.infoValue}>
                  {documentoBase?.enderecamento}
                </dd>
              </div>
            )}
            {documentoBase?.anoDocumento && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Ano do Documento</dt>
                <dd className={styles.infoValue}>
                  {documentoBase?.anoDocumento}
                </dd>
              </div>
            )}
            {documentoBase?.analista && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Analista</dt>
                <dd className={styles.infoValue}>{documentoBase?.analista}</dd>
              </div>
            )}
          </dl>
        ),
      });
    }

    // Card 2 - Dados de Pesquisa (se existir)
    if (hasPesquisa) {
      cards.push({
        id: 'pesquisa',
        title: 'Dados da Pesquisa',
        color: 'yellow',
        icon: 'search',
        ref: cardPesquisaRef,
        className: styles.cardPesquisa,
        content: (
          <div className={styles.pesquisasScrollContainer}>
            <div className={styles.pesquisasList}>
              {documentoBase.pesquisas?.map((pesquisa, index) => (
                <div key={index} className={styles.pesquisaItem}>
                  <div className={styles.pesquisaHeader}>
                    <span className={styles.pesquisaTipo}>{pesquisa.tipo}</span>
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
        ),
      });
    }

    // Card 3 - Informações Adicionais
    cards.push({
      id: 'adicionais',
      title: 'Informações Adicionais',
      color: 'green',
      icon: 'calendar',
      titleExtra:
        documentoBase?.tipoDocumento === 'Ofício Circular' &&
        getDestinatariosStatusData().length > 1 ? (
          <span className={styles.retificacaoIndicator}>
            <svg
              className={styles.retificacaoIcon}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
            {getDestinatariosStatusData().length} destinatários
          </span>
        ) : null,
      content: renderInformacoesAdicionais(),
    });

    // Card 4 - Decisão Judicial (se existir)
    if (hasDecisaoJudicial) {
      cards.push({
        id: 'decisao',
        title: 'Dados da Decisão Judicial',
        color: 'orange',
        icon: 'document',
        titleExtra: documentoBase?.retificada ? (
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
        ) : null,
        content: documentoBase?.retificada ? (
          <>
            <div className={styles.versaoContent}>
              {renderVersaoDecisao(versaoDecisaoAtiva)}
            </div>
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
          renderVersaoDecisao(0)
        ),
      });
    }

    // Card 5 - Dados da Mídia (se existir)
    if (hasMidia) {
      cards.push({
        id: 'midia',
        title: 'Dados da Mídia',
        color: 'purple',
        icon: 'media',
        content: (
          <dl className={styles.infoList}>
            {documentoBase?.tipoMidia && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Tipo de Mídia</dt>
                <dd className={styles.infoValue}>{documentoBase?.tipoMidia}</dd>
              </div>
            )}
            {documentoBase?.tamanhoMidia && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Tamanho</dt>
                <dd className={styles.infoValue}>
                  {documentoBase?.tamanhoMidia}
                </dd>
              </div>
            )}
            {documentoBase?.hashMidia && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Hash SHA256</dt>
                <dd
                  className={styles.infoValue}
                  style={{
                    wordBreak: 'break-all',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {documentoBase?.hashMidia}
                </dd>
              </div>
            )}
            {documentoBase?.senhaMidia && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Senha de Acesso</dt>
                <dd className={styles.infoValue}>
                  {documentoBase?.senhaMidia}
                </dd>
              </div>
            )}
          </dl>
        ),
      });
    }

    return cards;
  };

  // Função para renderizar ícones
  const renderIcon = (iconType: string) => {
    const iconProps = {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
    };

    switch (iconType) {
      case 'document':
        return (
          <svg {...iconProps}>
            <path d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' />
            <path d='M8 6a1 1 0 011-1h1a1 1 0 110 2H9a1 1 0 01-1-1zM8 8a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1zM8 10a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1z' />
          </svg>
        );
      case 'search':
        return (
          <svg {...iconProps}>
            <path
              fillRule='evenodd'
              d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'calendar':
        return (
          <svg {...iconProps}>
            <path
              fillRule='evenodd'
              d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'media':
        return (
          <svg {...iconProps}>
            <path
              fillRule='evenodd'
              d='M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1v2a1 1 0 01-1.447.894L12 14.382l-2.553 1.512A1 1 0 018 15V6H4a1 1 0 01-1-1V4z'
              clipRule='evenodd'
            />
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <path d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' />
          </svg>
        );
    }
  };

  // Obter documentos relacionados usando o contexto
  const { documentos } = useDocumentos();
  const documentosDemanda = documentoBase
    ? documentos.filter((doc) => doc.demandaId === documentoBase?.demandaId)
    : [];

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

  // Funções para gerenciar destinatários dos Ofícios Circulares serão movidas para antes de getCardsToShow

  const renderDestinatarioStatus = (destinatarioIndex: number) => {
    const destinatariosData = getDestinatariosStatusData();
    const destinatario = destinatariosData[destinatarioIndex];

    if (!destinatario)
      return <p className={styles.noData}>Dados não disponíveis</p>;

    return (
      <dl className={styles.infoList}>
        <div className={styles.infoItem} style={{ marginBottom: '1rem' }}>
          <dd
            className={styles.infoValue}
            style={{ fontSize: '1rem', fontWeight: '600', color: '#2c3e50' }}
          >
            {destinatario.nome}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Data de Envio</dt>
          <dd className={styles.infoValue}>
            {formatDateToDDMMYYYYOrPlaceholder(destinatario.dataEnvio)}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Data de Resposta</dt>
          <dd className={styles.infoValue}>
            {formatDateToDDMMYYYYOrPlaceholder(destinatario.dataResposta)}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Código de Rastreio</dt>
          <dd className={styles.infoValue}>
            {destinatario.naopossuiRastreio
              ? 'Não possui'
              : destinatario.codigoRastreio || 'Não informado'}
          </dd>
        </div>
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Status</dt>
          <dd className={styles.infoValue}>
            {destinatario.respondido ? 'Respondido' : 'Pendente'}
          </dd>
        </div>
      </dl>
    );
  };

  // Funções auxiliares para renderizar conteúdo de modais específicos
  const renderOficioCircularContent = () => {
    return (
      <>
        <div className={styles.formGroup}>
          <label htmlFor='numeroAtena' className={styles.formLabel}>
            Número no Atena
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

        {destinatariosData.map((dest, index) => (
          <div key={index} className={styles.destinatarioGroup}>
            <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#374151' }}>
              {dest.nome}
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data de Envio</label>
                <div className={styles.dateInputWrapper}>
                  <input
                    type='text'
                    value={dest.dataEnvioFormatted || ''}
                    onChange={(e) =>
                      handleDestinatarioDataEnvioChange(index, e.target.value)
                    }
                    className={styles.formInput}
                    placeholder='dd/mm/aaaa'
                    maxLength={10}
                  />
                  <input
                    type='date'
                    value={convertToHTMLDate(dest.dataEnvioFormatted || '')}
                    onChange={(e) =>
                      handleDestinatarioDataEnvioCalendarChange(
                        index,
                        e.target.value
                      )
                    }
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data de Resposta</label>
                <div className={styles.dateInputWrapper}>
                  <input
                    type='text'
                    value={dest.dataRespostaFormatted || ''}
                    onChange={(e) =>
                      handleDestinatarioDataRespostaChange(
                        index,
                        e.target.value
                      )
                    }
                    className={styles.formInput}
                    placeholder='dd/mm/aaaa'
                    maxLength={10}
                  />
                  <input
                    type='date'
                    value={convertToHTMLDate(dest.dataRespostaFormatted || '')}
                    onChange={(e) =>
                      handleDestinatarioDataRespostaCalendarChange(
                        index,
                        e.target.value
                      )
                    }
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

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Código de Rastreio</label>
              <div
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <input
                  type='text'
                  value={dest.codigoRastreio}
                  onChange={(e) => {
                    const newData = [...destinatariosData];
                    newData[index].codigoRastreio = e.target.value;
                    setDestinatariosData(newData);
                  }}
                  className={styles.formInput}
                  placeholder='Ex: AA123456789BR'
                  disabled={dest.naopossuiRastreio}
                  style={{ flex: 1 }}
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={dest.naopossuiRastreio}
                    onChange={(e) => {
                      const newData = [...destinatariosData];
                      newData[index].naopossuiRastreio = e.target.checked;
                      if (e.target.checked) {
                        newData[index].codigoRastreio = '';
                      }
                      setDestinatariosData(newData);
                    }}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>Não possui</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  const renderOficioCircularOutrosContent = () => {
    return (
      <>
        <div className={styles.formGroup}>
          <label htmlFor='numeroAtena' className={styles.formLabel}>
            Número no Atena
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

        {destinatariosData.map((dest, index) => (
          <div key={index} className={styles.destinatarioGroup}>
            <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#374151' }}>
              {dest.nome}
            </h4>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Data de Envio</label>
              <div className={styles.dateInputWrapper}>
                <input
                  type='text'
                  value={dest.dataEnvioFormatted || ''}
                  onChange={(e) =>
                    handleDestinatarioDataEnvioChange(index, e.target.value)
                  }
                  className={styles.formInput}
                  placeholder='dd/mm/aaaa'
                  maxLength={10}
                />
                <input
                  type='date'
                  value={convertToHTMLDate(dest.dataEnvioFormatted || '')}
                  onChange={(e) =>
                    handleDestinatarioDataEnvioCalendarChange(
                      index,
                      e.target.value
                    )
                  }
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
        ))}
      </>
    );
  };

  const renderOficioMidiaContent = () => {
    const midiasDemanda = documentosDemanda.filter(
      (doc) => doc.tipoDocumento === 'Mídia'
    );

    return (
      <>
        <div className={styles.formGroup}>
          <label htmlFor='numeroAtena' className={styles.formLabel}>
            Número no Atena
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

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Selecione as Mídias</label>
          <div className={styles.selectList}>
            {midiasDemanda.length > 0 ? (
              midiasDemanda.map((doc) => (
                <label key={doc.id} className={styles.checkboxLabel}>
                  <input
                    type='checkbox'
                    checked={selectedMidias.includes(doc.id.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMidias([
                          ...selectedMidias,
                          doc.id.toString(),
                        ]);
                      } else {
                        setSelectedMidias(
                          selectedMidias.filter(
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
                Não há mídias criadas para esta demanda.
              </p>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderOficioRelatorioTecnicoContent = () => {
    const relatoriosDemanda = documentosDemanda.filter(
      (doc) => doc.tipoDocumento === 'Relatório Técnico'
    );

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Selecione os Relatórios Técnicos
        </label>
        <div className={styles.selectList}>
          {relatoriosDemanda.length > 0 ? (
            relatoriosDemanda.map((doc) => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={selectedRelatoriosTecnicos.includes(
                    doc.id.toString()
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRelatoriosTecnicos([
                        ...selectedRelatoriosTecnicos,
                        doc.id.toString(),
                      ]);
                    } else {
                      setSelectedRelatoriosTecnicos(
                        selectedRelatoriosTecnicos.filter(
                          (id) => id !== doc.id.toString()
                        )
                      );
                    }
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  {doc.numeroDocumento} - {doc.assunto}
                </span>
              </label>
            ))
          ) : (
            <p className={styles.noData}>
              Não há relatórios técnicos criados para esta demanda.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderOficioRelatorioInteligenciaContent = () => {
    const relatoriosDemanda = documentosDemanda.filter(
      (doc) => doc.tipoDocumento === 'Relatório de Inteligência'
    );

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Selecione os Relatórios de Inteligência
        </label>
        <div className={styles.selectList}>
          {relatoriosDemanda.length > 0 ? (
            relatoriosDemanda.map((doc) => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={selectedRelatoriosInteligencia.includes(
                    doc.id.toString()
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRelatoriosInteligencia([
                        ...selectedRelatoriosInteligencia,
                        doc.id.toString(),
                      ]);
                    } else {
                      setSelectedRelatoriosInteligencia(
                        selectedRelatoriosInteligencia.filter(
                          (id) => id !== doc.id.toString()
                        )
                      );
                    }
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  {doc.numeroDocumento} - {doc.assunto}
                </span>
              </label>
            ))
          ) : (
            <p className={styles.noData}>
              Não há relatórios de inteligência criados para esta demanda.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderOficioRelatorioMidiaContent = () => {
    const relatoriosTecnicos = documentosDemanda.filter(
      (doc) => doc.tipoDocumento === 'Relatório Técnico'
    );
    const midias = documentosDemanda.filter(
      (doc) => doc.tipoDocumento === 'Mídia'
    );

    return (
      <>
        <div className={styles.formGroup}>
          <label htmlFor='numeroAtena' className={styles.formLabel}>
            Número no Atena
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

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Selecione os Relatórios Técnicos
          </label>
          <div className={styles.selectList}>
            {relatoriosTecnicos.length > 0 ? (
              relatoriosTecnicos.map((doc) => (
                <label key={doc.id} className={styles.checkboxLabel}>
                  <input
                    type='checkbox'
                    checked={selectedRelatoriosTecnicos.includes(
                      doc.id.toString()
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRelatoriosTecnicos([
                          ...selectedRelatoriosTecnicos,
                          doc.id.toString(),
                        ]);
                      } else {
                        setSelectedRelatoriosTecnicos(
                          selectedRelatoriosTecnicos.filter(
                            (id) => id !== doc.id.toString()
                          )
                        );
                      }
                    }}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    {doc.numeroDocumento} - {doc.assunto}
                  </span>
                </label>
              ))
            ) : (
              <p className={styles.noData}>
                Não há relatórios técnicos criados para esta demanda.
              </p>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Selecione as Mídias</label>
          <div className={styles.selectList}>
            {midias.length > 0 ? (
              midias.map((doc) => (
                <label key={doc.id} className={styles.checkboxLabel}>
                  <input
                    type='checkbox'
                    checked={selectedMidias.includes(doc.id.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMidias([
                          ...selectedMidias,
                          doc.id.toString(),
                        ]);
                      } else {
                        setSelectedMidias(
                          selectedMidias.filter(
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
                Não há mídias criadas para esta demanda.
              </p>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderOficioAutosCircunstanciadosContent = () => {
    const autosDemanda = documentosDemanda.filter(
      (doc) => doc.tipoDocumento === 'Autos Circunstanciados'
    );

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Selecione os Autos Circunstanciados
        </label>
        <div className={styles.selectList}>
          {autosDemanda.length > 0 ? (
            autosDemanda.map((doc) => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={selectedAutosCircunstanciados.includes(
                    doc.id.toString()
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAutosCircunstanciados([
                        ...selectedAutosCircunstanciados,
                        doc.id.toString(),
                      ]);
                    } else {
                      setSelectedAutosCircunstanciados(
                        selectedAutosCircunstanciados.filter(
                          (id) => id !== doc.id.toString()
                        )
                      );
                    }
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  {doc.numeroDocumento} - {doc.assunto}
                </span>
              </label>
            ))
          ) : (
            <p className={styles.noData}>
              Não há autos circunstanciados criados para esta demanda.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderEncaminhamentoDecisaoJudicialContent = () => {
    // Filtrar apenas documentos de Decisão Judicial da demanda atual
    const decisoesDemanda = documentosDemanda.filter(
      (doc) =>
        doc.tipoDocumento === 'Decisão Judicial' ||
        (doc.tipoDocumento === 'Ofício' && doc.assunto === 'Decisão judicial')
    );

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Selecione as Decisões Judiciais para Encaminhamento
        </label>
        <div className={styles.selectList}>
          {decisoesDemanda.length > 0 ? (
            decisoesDemanda.map((doc) => (
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
                  {doc.numeroDocumento} - {doc.autoridade || 'Sem autoridade'} -{' '}
                  {doc.orgaoJudicial || 'Sem órgão'}
                </span>
              </label>
            ))
          ) : (
            <p className={styles.noData}>
              Não há decisões judiciais criadas para esta demanda.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Função para determinar o tipo de modal baseado no documento
  const getModalType = () => {
    if (!documentoBase) return 'default';

    const { tipoDocumento, assunto } = documentoBase;

    // 1, 2, 3. Autos Circunstanciados e Relatórios - sempre apenas data de finalização
    if (
      tipoDocumento === 'Autos Circunstanciados' ||
      tipoDocumento === 'Relatório Técnico' ||
      tipoDocumento === 'Relatório de Inteligência'
    ) {
      return 'finalizacao';
    }

    // 4. Mídia - checkbox de defeito
    if (tipoDocumento === 'Mídia') {
      return 'midia';
    }

    // 5-13. Ofícios e Ofícios Circulares - baseado no assunto
    if (tipoDocumento === 'Ofício') {
      switch (assunto) {
        case 'Comunicação de não cumprimento de decisão judicial':
          return 'comunicacao_nao_cumprimento'; // 7
        case 'Encaminhamento de mídia':
          return 'oficio_midia'; // 9
        case 'Encaminhamento de relatório técnico':
          return 'oficio_relatorio_tecnico'; // 10
        case 'Encaminhamento de relatório de inteligência':
          return 'oficio_relatorio_inteligencia'; // 11
        case 'Encaminhamento de relatório técnico e mídia':
          return 'oficio_relatorio_midia'; // 12
        case 'Encaminhamento de autos circunstanciados':
          return 'oficio_autos_circunstanciados'; // 13
        case 'Requisição de dados cadastrais':
        case 'Requisição de dados cadastrais e preservação de dados':
        case 'Solicitação de dados cadastrais':
        case 'Encaminhamento de decisão judicial':
          return 'encaminhamento_decisao_judicial'; // 14
        default:
          return 'oficio';
      }
    }

    if (tipoDocumento === 'Ofício Circular') {
      if (assunto === 'Outros') {
        return 'oficio_circular_outros'; // 8
      } else {
        return 'oficio_circular'; // 6
      }
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
