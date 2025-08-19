import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { LiaEdit } from 'react-icons/lia';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import DocumentUpdateModal from '../components/documents/modals/DocumentUpdateModal';
import { getVisibleFields } from '../components/documents/modals/utils';
import Toast from '../components/ui/Toast';
import { useDocumentos } from '../contexts/DocumentosContext';
import { useDemandas } from '../hooks/useDemandas';
import type {
  DestinatarioDocumento,
  DocumentoDemanda,
} from '../data/mockDocumentos';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
import {
  getDocumentStatus,
  getIndividualRecipientStatus,
  getStatusColor,
  type DocumentStatus,
} from '../utils/documentStatusUtils';
import styles from './DetalheDocumentoPage.module.css';

type SortConfig = {
  key:
    | 'numeroDocumento'
    | 'tipoDocumento'
    | 'assunto'
    | 'destinatario'
    | 'status';
  direction: 'asc' | 'desc';
} | null;

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
  const [, setForceTableUpdate] = useState(0);

  // Refs para sincronização de altura
  const cardInformacoesRef = useRef<HTMLDivElement>(null);
  const cardDadosMidiaRef = useRef<HTMLDivElement>(null);
  const cardInfoComplementaresRef = useRef<HTMLDivElement>(null);
  const cardDadosPesquisaRef = useRef<HTMLDivElement>(null);
  const cardDecisaoJudicialRef = useRef<HTMLDivElement>(null);

  // Estado para alturas calculadas no layout de mídia
  const [calculatedHeights, setCalculatedHeights] = useState<{
    informacoes?: number;
    dadosMidia?: number;
    infoComplementares?: number;
  }>({});

  // Estado para alturas calculadas no layout de ofício
  const [calculatedOficioHeights, setCalculatedOficioHeights] = useState<{
    informacoes?: number;
    infoComplementares?: number;
    dadosPesquisa?: number;
    decisaoJudicial?: number;
    dadosMidia?: number;
    enableScrollPesquisa?: boolean;
  }>({});

  // Estado para controlar a versão ativa da decisão judicial
  const [versaoDecisaoAtiva, setVersaoDecisaoAtiva] = useState<number>(0);

  // Estado para controlar o destinatário ativo dos Ofícios Circulares
  const [destinatarioStatusAtivo, setDestinatarioStatusAtivo] =
    useState<number>(0);

  // Estado para ordenação da tabela "Outros Documentos da Demanda"
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Função para formatar destinatários com "e" entre o penúltimo e último
  const formatDestinatarios = (destinatarioString: string): string => {
    if (!destinatarioString) return 'Não informado';

    // Se contém " e ", já está formatado corretamente
    if (destinatarioString.includes(' e ')) {
      return destinatarioString;
    }

    // Divide por vírgulas e formata
    const nomes = destinatarioString
      .split(',')
      .map(nome => nome.trim())
      .filter(nome => nome.length > 0);
    if (nomes.length === 0) return 'Não informado';
    if (nomes.length === 1) return nomes[0];

    const ultimoNome = nomes.pop();
    return `${nomes.join(', ')} e ${ultimoNome}`;
  };

  // Função para verificar se há dados preenchidos na Seção 2 (Decisão Judicial)
  const hasDecisaoJudicialData = () => {
    if (!documentoBase) return false;
    return Boolean(
      documentoBase.autoridade ||
        documentoBase.orgaoJudicial ||
        documentoBase.dataAssinatura ||
        (documentoBase.retificacoes && documentoBase.retificacoes.length > 0)
    );
  };

  // Função para verificar se há dados preenchidos na Seção 3 (Mídia)
  const hasMidiaData = () => {
    if (!documentoBase) return false;
    return Boolean(
      documentoBase.tipoMidia ||
        documentoBase.tamanhoMidia ||
        documentoBase.hashMidia ||
        documentoBase.senhaMidia
    );
  };

  // Função para verificar se há dados preenchidos na Seção 4 (Pesquisa)
  const hasPesquisaData = () => {
    if (
      !documentoBase ||
      !documentoBase.pesquisas ||
      !Array.isArray(documentoBase.pesquisas)
    )
      return false;
    return documentoBase.pesquisas.some(
      pesquisa => pesquisa.tipo || pesquisa.identificador
    );
  };

  // Função utilitária para obter o assunto a ser exibido (prioriza assuntoOutros quando assunto é "Outros")
  const getDisplayAssunto = (documento: DocumentoDemanda): string => {
    if (documento.assunto === 'Outros' && documento.assuntoOutros) {
      return documento.assuntoOutros;
    }
    return documento.assunto || 'Não informado';
  };

  // Função para lidar com clique no cabeçalho da tabela de outros documentos
  const handleSort = useCallback((key: NonNullable<SortConfig>['key']) => {
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
  }, []);

  // Função para renderizar ícone de ordenação
  const getSortIcon = useCallback(
    (key: NonNullable<SortConfig>['key']) => {
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

  // Função para renderizar conteúdo do card Informações Adicionais baseado no modal de atualização
  const renderInformacoesAdicionais = () => {
    if (!documentoBase) return null;

    const visibleFields = getVisibleFields(documentoBase);
    const { tipoDocumento, assunto } = documentoBase;

    // Se não há campos visíveis, retornar null
    const hasVisibleFields = Object.values(visibleFields).some(
      v => v && v !== false
    );
    if (!hasVisibleFields) return null;

    // Data de Finalização (Relatórios e Autos Circunstanciados)
    if (visibleFields.dataFinalizacao) {
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

    // Apresentou Defeito (Mídia)
    if (visibleFields.apresentouDefeito) {
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

    // Ofício Circular com destinatários individuais
    if (visibleFields.destinatariosIndividuais) {
      return renderOficioCircularStatusCompleto();
    }

    // Ofício de Encaminhamento de Relatório Técnico e Mídia (DEVE VIR PRIMEIRO)
    if (
      visibleFields.selectedRelatoriosTecnicos &&
      visibleFields.selectedMidias &&
      (documentoBase.selectedRelatoriosTecnicos?.length > 0 ||
        documentoBase.selectedMidias?.length > 0)
    ) {
      return renderOficioRelatorioMidiaContent();
    }

    // Ofício de Encaminhamento de Mídia (apenas mídia)
    if (
      visibleFields.selectedMidias &&
      !visibleFields.selectedRelatoriosTecnicos &&
      documentoBase.selectedMidias?.length > 0
    ) {
      return renderOficioMidiaContent();
    }

    // Ofício de Encaminhamento de Relatório Técnico (apenas relatórios)
    if (
      visibleFields.selectedRelatoriosTecnicos &&
      !visibleFields.selectedMidias &&
      documentoBase.selectedRelatoriosTecnicos?.length > 0
    ) {
      return renderOficioRelatorioTecnicoContent();
    }

    // Ofício de Encaminhamento de Relatório de Inteligência
    if (
      visibleFields.selectedRelatoriosInteligencia &&
      documentoBase.selectedRelatoriosInteligencia?.length > 0
    ) {
      return renderOficioRelatorioInteligenciaContent();
    }

    // Ofício de Encaminhamento de Autos Circunstanciados
    if (
      visibleFields.selectedAutosCircunstanciados &&
      documentoBase.selectedAutosCircunstanciados?.length > 0
    ) {
      return renderOficioAutosContent();
    }

    // Ofício de Comunicação de Não Cumprimento
    if (
      visibleFields.selectedDecisoes &&
      documentoBase.selectedDecisoes?.length > 0
    ) {
      return renderOficioComunicacaoNaoCumprimentoContent();
    }

    // Ofício Circular Simplificado (Outros)
    if (tipoDocumento === 'Ofício Circular' && assunto === 'Outros') {
      return renderOficioCircularOutros();
    }

    // Ofício com campos básicos (data envio, resposta, rastreio)
    if (
      visibleFields.dataEnvio ||
      visibleFields.dataResposta ||
      visibleFields.codigoRastreio
    ) {
      return renderOficioBasicContent();
    }

    return null;
  };

  // Função para renderizar Ofício Circular com status completo
  const renderOficioCircularStatusCompleto = () => {
    const destinatariosData = documentoBase?.destinatariosData || [];

    if (destinatariosData.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Status</dt>
            <dd className={styles.infoValue}>Nenhum destinatário encontrado</dd>
          </div>
        </dl>
      );
    }

    const destinatarioAtual =
      destinatariosData[destinatarioStatusAtivo] || destinatariosData[0];

    return (
      <div className={styles.oficioCircularCarrossel}>
        {/* Cabeçalho com nome do destinatário ativo */}
        <div className={styles.destinatarioHeader}>
          <h4 className={styles.destinatarioNome}>{destinatarioAtual.nome}</h4>
        </div>

        {/* Conteúdo das informações do destinatário */}
        <div className={styles.destinatarioConteudo}>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Envio</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(destinatarioAtual.dataEnvio)}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Resposta</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(
                  destinatarioAtual.dataResposta
                )}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Código de Rastreio</dt>
              <dd className={styles.infoValue}>
                {destinatarioAtual.naopossuiRastreio
                  ? 'Não possui rastreio'
                  : destinatarioAtual.codigoRastreio || 'Não informado'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Status</dt>
              <dd className={styles.infoValue}>
                {(() => {
                  const status =
                    getIndividualRecipientStatus(destinatarioAtual);
                  const statusClass =
                    status === 'Respondido'
                      ? styles.statusSuccess
                      : status === 'Pendente'
                        ? styles.statusPending
                        : styles.statusGray; // Para "Não Enviado"

                  return (
                    <span className={`${styles.statusBadge} ${statusClass}`}>
                      {status}
                    </span>
                  );
                })()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Indicadores (bolinhas) na parte inferior */}
        <div className={styles.carrosselIndicadores}>
          {destinatariosData.map((dest, index) => (
            <button
              key={index}
              className={`${styles.indicadorBolinha} ${
                index === destinatarioStatusAtivo ? styles.ativo : ''
              }`}
              onClick={() => setDestinatarioStatusAtivo(index)}
              title={`Ver informações de ${dest.nome}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Função para renderizar Ofício Circular "Outros" (só data de envio)
  const renderOficioCircularOutros = () => {
    const destinatariosData = documentoBase?.destinatariosData || [];

    if (destinatariosData.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Status</dt>
            <dd className={styles.infoValue}>Nenhum destinatário encontrado</dd>
          </div>
        </dl>
      );
    }

    const destinatarioAtual =
      destinatariosData[destinatarioStatusAtivo] || destinatariosData[0];

    return (
      <div className={styles.oficioCircularCarrossel}>
        {/* Cabeçalho com nome do destinatário ativo */}
        <div className={styles.destinatarioHeader}>
          <h4 className={styles.destinatarioNome}>{destinatarioAtual.nome}</h4>
        </div>

        {/* Conteúdo das informações do destinatário (apenas data de envio) */}
        <div className={styles.destinatarioConteudo}>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Envio</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(destinatarioAtual.dataEnvio)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Indicadores (bolinhas) na parte inferior */}
        <div className={styles.carrosselIndicadores}>
          {destinatariosData.map((dest, index) => (
            <button
              key={index}
              className={`${styles.indicadorBolinha} ${
                index === destinatarioStatusAtivo ? styles.ativo : ''
              }`}
              onClick={() => setDestinatarioStatusAtivo(index)}
              title={`Ver informações de ${dest.nome}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Função para renderizar conteúdo básico de Ofício (data envio, resposta, rastreio)
  const renderOficioBasicContent = () => {
    if (!documentoBase) return null;
    const visibleFields = getVisibleFields(documentoBase);

    return (
      <dl className={styles.infoList}>
        {visibleFields.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        {visibleFields.dataResposta && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Resposta</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataResposta)}
            </dd>
          </div>
        )}
        {visibleFields.codigoRastreio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Código de Rastreio</dt>
            <dd className={styles.infoValue}>
              {documentoBase.naopossuiRastreio
                ? 'Não possui rastreio'
                : documentoBase.codigoRastreio || 'Não informado'}
            </dd>
          </div>
        )}
        {visibleFields.status && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Status</dt>
            <dd className={styles.infoValue}>
              {documentoBase.respondido ? (
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
        )}
      </dl>
    );
  };

  // Função para renderizar Ofício de Encaminhamento de Mídia
  const renderOficioMidiaContent = () => {
    if (!documentoBase) return null;

    // Buscar apenas mídias que foram SELECIONADAS e SALVAS
    const midiasIds = documentoBase.selectedMidias || [];
    const midiasSelecionadas = midiasIds
      .map(id =>
        documentosDemanda.find(
          doc => doc.id.toString() === id && doc.tipoDocumento === 'Mídia'
        )
      )
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

    if (midiasSelecionadas.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Mídias</dt>
            <dd className={styles.infoValue}>Nenhuma mídia selecionada</dd>
          </div>
        </dl>
      );
    }

    return (
      <dl className={styles.infoList}>
        {documentoBase.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Mídias selecionadas</dt>
          <dd className={styles.infoValue}>
            {midiasSelecionadas.map(midia => (
              <div key={midia.id} className={styles.midiaItem}>
                Mídia {midia.numeroDocumento}
                <div className={styles.midiaDetalhes}>
                  Hash:{' '}
                  <span className={styles.hashText}>
                    {midia.hashMidia || 'Não informado'}
                  </span>
                  <br />
                  Senha: {midia.senhaMidia || 'Não informado'}
                  <br />
                  Status:{' '}
                  {midia.apresentouDefeito
                    ? 'Apresentou defeito'
                    : 'Sem defeito'}
                </div>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar Ofício de Encaminhamento de Relatório Técnico
  const renderOficioRelatorioTecnicoContent = () => {
    if (!documentoBase) return null;

    // Buscar apenas relatórios técnicos que foram SELECIONADOS e SALVOS
    const relatoriosIds = documentoBase.selectedRelatoriosTecnicos || [];
    const relatoriosSelecionados = relatoriosIds
      .map(id =>
        documentosDemanda.find(
          doc =>
            doc.id.toString() === id &&
            doc.tipoDocumento === 'Relatório Técnico'
        )
      )
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

    if (relatoriosSelecionados.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Relatórios Técnicos</dt>
            <dd className={styles.infoValue}>
              Nenhum relatório técnico selecionado
            </dd>
          </div>
        </dl>
      );
    }

    return (
      <dl className={styles.infoList}>
        {documentoBase.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Relatórios técnicos selecionados</dt>
          <dd className={styles.infoValue}>
            {relatoriosSelecionados.map(relatorio => (
              <div key={relatorio.id} className={styles.relatorioItem}>
                Relatório Técnico {relatorio.numeroDocumento}
                <div className={styles.relatorioDetalhes}>
                  Assunto: {getDisplayAssunto(relatorio)}
                  <br />
                  Data de Finalização:{' '}
                  {formatDateToDDMMYYYYOrPlaceholder(relatorio.dataFinalizacao)}
                </div>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar Ofício de Encaminhamento de Relatório de Inteligência
  const renderOficioRelatorioInteligenciaContent = () => {
    if (!documentoBase) return null;

    // Buscar apenas relatórios de inteligência que foram SELECIONADOS e SALVOS
    const relatoriosIds = documentoBase.selectedRelatoriosInteligencia || [];
    const relatoriosSelecionados = relatoriosIds
      .map(id =>
        documentosDemanda.find(
          doc =>
            doc.id.toString() === id &&
            doc.tipoDocumento === 'Relatório de Inteligência'
        )
      )
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

    if (relatoriosSelecionados.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Relatórios de Inteligência</dt>
            <dd className={styles.infoValue}>
              Nenhum relatório de inteligência selecionado
            </dd>
          </div>
        </dl>
      );
    }

    return (
      <dl className={styles.infoList}>
        {documentoBase.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>
            Relatórios de inteligência selecionados
          </dt>
          <dd className={styles.infoValue}>
            {relatoriosSelecionados.map(relatorio => (
              <div key={relatorio.id} className={styles.relatorioItem}>
                Relatório de Inteligência {relatorio.numeroDocumento}
                <div className={styles.relatorioDetalhes}>
                  Assunto: {getDisplayAssunto(relatorio)}
                  <br />
                  Data de Finalização:{' '}
                  {formatDateToDDMMYYYYOrPlaceholder(relatorio.dataFinalizacao)}
                </div>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar Ofício de Encaminhamento de Relatório Técnico e Mídia
  const renderOficioRelatorioMidiaContent = () => {
    if (!documentoBase) return null;

    // Buscar apenas relatórios técnicos e mídias que foram SELECIONADOS e SALVOS
    const relatoriosIds = documentoBase.selectedRelatoriosTecnicos || [];
    const midiasIds = documentoBase.selectedMidias || [];

    const relatoriosSelecionados = relatoriosIds
      .map(id =>
        documentosDemanda.find(
          doc =>
            doc.id.toString() === id &&
            doc.tipoDocumento === 'Relatório Técnico'
        )
      )
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

    const midiasSelecionadas = midiasIds
      .map(id =>
        documentosDemanda.find(
          doc => doc.id.toString() === id && doc.tipoDocumento === 'Mídia'
        )
      )
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

    return (
      <dl className={styles.infoList}>
        {documentoBase.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        {/* Relatórios Técnicos */}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>
            Relatórios Técnicos selecionados:
          </dt>
          <dd className={styles.infoValue}>
            {relatoriosSelecionados.length === 0
              ? 'Nenhum relatório técnico selecionado'
              : relatoriosSelecionados.map(relatorio => (
                  <div key={relatorio.id} className={styles.relatorioItem}>
                    Relatório Técnico {relatorio.numeroDocumento}
                    <div className={styles.relatorioDetalhes}>
                      Assunto: {getDisplayAssunto(relatorio)}
                      <br />
                      Data de Finalização:{' '}
                      {formatDateToDDMMYYYYOrPlaceholder(
                        relatorio.dataFinalizacao
                      )}
                    </div>
                  </div>
                ))}
          </dd>
        </div>

        {/* Mídias */}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>Mídias selecionadas:</dt>
          <dd className={styles.infoValue}>
            {midiasSelecionadas.length === 0
              ? 'Nenhuma mídia selecionada'
              : midiasSelecionadas.map(midia => (
                  <div key={midia.id} className={styles.midiaItem}>
                    Mídia {midia.numeroDocumento}
                    <div className={styles.midiaDetalhes}>
                      Hash:{' '}
                      <span className={styles.hashText}>
                        {midia.hashMidia || 'Não informado'}
                      </span>
                      <br />
                      Senha: {midia.senhaMidia || 'Não informado'}
                      <br />
                      Status:{' '}
                      {midia.apresentouDefeito
                        ? 'Apresentou defeito'
                        : 'Sem defeito'}
                    </div>
                  </div>
                ))}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar Ofício de Encaminhamento de Autos Circunstanciados
  const renderOficioAutosContent = () => {
    if (!documentoBase) return null;

    // Buscar apenas autos circunstanciados que foram SELECIONADOS e SALVOS
    const autosIds = documentoBase.selectedAutosCircunstanciados || [];
    const autosSelecionados = autosIds
      .map(id =>
        documentosDemanda.find(
          doc =>
            doc.id.toString() === id &&
            doc.tipoDocumento === 'Autos Circunstanciados'
        )
      )
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);

    if (autosSelecionados.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Autos Circunstanciados</dt>
            <dd className={styles.infoValue}>
              Nenhum auto circunstanciado selecionado
            </dd>
          </div>
        </dl>
      );
    }

    return (
      <dl className={styles.infoList}>
        {documentoBase.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>
            Autos circunstanciados selecionados
          </dt>
          <dd className={styles.infoValue}>
            {autosSelecionados.map(auto => (
              <div key={auto.id} className={styles.autoItem}>
                Auto Circunstanciado {auto.numeroDocumento}
                <div className={styles.autoDetalhes}>
                  Assunto: {getDisplayAssunto(auto)}
                  <br />
                  Data de Finalização:{' '}
                  {formatDateToDDMMYYYYOrPlaceholder(auto.dataFinalizacao)}
                </div>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar ofícios de comunicação de não cumprimento
  const renderOficioComunicacaoNaoCumprimentoContent = () => {
    const decisoesSelecionadas = documentoBase?.selectedDecisoes || [];

    if (decisoesSelecionadas.length === 0) {
      return (
        <dl className={styles.infoList}>
          {documentoBase?.dataEnvio && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data de Envio</dt>
              <dd className={styles.infoValue}>
                {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
              </dd>
            </div>
          )}
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              Destinatários que não cumpriram a decisão judicial
            </dt>
            <dd className={styles.infoValue}>Nenhum ofício selecionado</dd>
          </div>
        </dl>
      );
    }

    // Filtrar apenas documentos enviados
    const oficiosValidos = decisoesSelecionadas
      .map(docId => documentosDemanda.find(d => d.id.toString() === docId))
      .filter(
        (doc): doc is DocumentoDemanda =>
          doc !== undefined && doc.dataEnvio !== null && doc.dataEnvio !== ''
      );

    if (oficiosValidos.length === 0) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              Destinatários que não cumpriram a decisão judicial
            </dt>
            <dd className={styles.infoValue}>
              Nenhum ofício enviado selecionado
            </dd>
          </div>
        </dl>
      );
    }

    return (
      <dl className={styles.infoList}>
        {documentoBase?.dataEnvio && (
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Envio</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(documentoBase.dataEnvio)}
            </dd>
          </div>
        )}
        <div className={styles.infoItem}>
          <dt className={styles.infoLabel}>
            Destinatários que não cumpriram a decisão judicial
          </dt>
          <dd className={styles.infoValue}>
            {oficiosValidos.map(doc => {
              if (doc.tipoDocumento === 'Ofício') {
                return renderOficioSimples(doc);
              } else if (doc.tipoDocumento === 'Ofício Circular') {
                return renderOficioCircularComplexo(doc);
              }
              return null;
            })}
          </dd>
        </div>
      </dl>
    );
  };

  // Função para renderizar ofício simples
  const renderOficioSimples = (doc: DocumentoDemanda) => {
    const formatCodigoRastreio = () => {
      if (doc.naopossuiRastreio) return 'Não possui rastreio';
      if (!doc.codigoRastreio || doc.codigoRastreio === '')
        return 'Não informado';
      return doc.codigoRastreio;
    };

    return (
      <div key={doc.id} className={styles.oficioItem}>
        Ofício {doc.numeroDocumento}
        <div className={styles.oficioDetalhes}>
          {doc.destinatario}
          <br />
          Data de Envio: {formatDateToDDMMYYYYOrPlaceholder(doc.dataEnvio)}
          <br />
          Código de Rastreio: {formatCodigoRastreio()}
        </div>
      </div>
    );
  };

  // Função para renderizar ofício circular complexo
  const renderOficioCircularComplexo = (doc: DocumentoDemanda) => {
    // Filtrar apenas destinatários pendentes E enviados
    const destinatariosPendentesEnviados =
      doc.destinatariosData?.filter(
        dest =>
          (!dest.respondido || !dest.dataResposta) &&
          dest.dataEnvio &&
          dest.dataEnvio !== ''
      ) || [];

    if (destinatariosPendentesEnviados.length === 0) {
      return null; // Não exibir se não há destinatários válidos
    }

    const formatCodigoRastreioCircular = (dest: DestinatarioDocumento) => {
      if (dest.naopossuiRastreio) return 'Não possui rastreio';
      if (!dest.codigoRastreio || dest.codigoRastreio === '')
        return 'Não informado';
      return dest.codigoRastreio;
    };

    return (
      <div key={doc.id} className={styles.oficioCircularItem}>
        Ofício Circular {doc.numeroDocumento}
        <br />
        {destinatariosPendentesEnviados.map(dest => (
          <div key={dest.nome} className={styles.destinatarioItem}>
            {dest.nome}
            <br />
            Data de Envio: {formatDateToDDMMYYYYOrPlaceholder(dest.dataEnvio)}
            <br />
            Código de Rastreio: {formatCodigoRastreioCircular(dest)}
          </div>
        ))}
      </div>
    );
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

  // Reset dos índices dos carrosseis quando os dados mudarem
  useEffect(() => {
    const destinatariosData = documentoBase?.destinatariosData || [];
    if (destinatarioStatusAtivo >= destinatariosData.length) {
      setDestinatarioStatusAtivo(0);
    }

    // Reset do carrossel de retificações
    const retificacoes = documentoBase?.retificacoes || [];
    const totalVersoes = retificacoes.length + 1; // +1 para a versão original
    if (versaoDecisaoAtiva >= totalVersoes) {
      setVersaoDecisaoAtiva(0);
    }
  }, [
    documentoBase?.destinatariosData,
    documentoBase?.retificacoes,
    destinatarioStatusAtivo,
    versaoDecisaoAtiva,
  ]);

  // Obter todos os documentos da mesma demanda
  const { documentos } = useDocumentos();
  const { demandas } = useDemandas();

  // Obter a demanda correspondente ao documento
  const demanda = useMemo(() => {
    if (!documentoBase?.demandaId) return null;
    return demandas.find(d => d.id === documentoBase.demandaId);
  }, [demandas, documentoBase?.demandaId]);
  const documentosDemanda = useMemo(() => {
    if (!documentoBase) return [];

    const filtered = documentos.filter(
      doc => doc.demandaId === documentoBase.demandaId
    );

    // Aplicar ordenação se configurada
    if (!sortConfig) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'numeroDocumento':
          aValue = a.numeroDocumento || '';
          bValue = b.numeroDocumento || '';
          break;
        case 'tipoDocumento':
          aValue = a.tipoDocumento || '';
          bValue = b.tipoDocumento || '';
          break;
        case 'assunto':
          aValue = getDisplayAssunto(a);
          bValue = getDisplayAssunto(b);
          break;
        case 'destinatario':
          aValue = a.destinatario || '';
          bValue = b.destinatario || '';
          break;
        case 'status':
          aValue = getDocumentStatus(a);
          bValue = getDocumentStatus(b);
          break;
        default:
          return 0;
      }

      // Converter para string para comparação consistente
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [documentos, documentoBase, sortConfig]);

  // Função para renderizar carrossel de retificações
  const renderRetificacoesCarrossel = () => {
    if (
      !documentoBase?.retificacoes ||
      !Array.isArray(documentoBase.retificacoes) ||
      documentoBase.retificacoes.length === 0
    ) {
      return (
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Data de Assinatura</dt>
            <dd className={styles.infoValue}>
              {formatDateToDDMMYYYYOrPlaceholder(
                documentoBase?.dataAssinatura || null
              )}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Autoridade</dt>
            <dd className={styles.infoValue}>
              {documentoBase?.autoridade || 'Não informado'}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Órgão Judicial</dt>
            <dd className={styles.infoValue}>
              {documentoBase?.orgaoJudicial || 'Não informado'}
            </dd>
          </div>
        </dl>
      );
    }

    // Com retificações - criar carrossel
    const versoes = [
      {
        autoridade: documentoBase.autoridade,
        orgaoJudicial: documentoBase.orgaoJudicial,
        dataAssinatura: documentoBase.dataAssinatura,
        retificada: documentoBase.retificada,
      },
      ...documentoBase.retificacoes,
    ];

    const versaoAtual = versoes[versaoDecisaoAtiva] || versoes[0];

    return (
      <div className={styles.oficioCircularCarrossel}>
        {/* Cabeçalho com versão ativa */}
        <div className={styles.destinatarioHeader}>
          <h4 className={styles.destinatarioNome}>
            {versaoDecisaoAtiva === 0
              ? 'Decisão Judicial'
              : versoes.length === 2
                ? 'Decisão Retificadora'
                : `${versaoDecisaoAtiva}ª Decisão Retificadora`}
          </h4>
        </div>

        {/* Conteúdo da versão */}
        <div className={styles.destinatarioConteudo}>
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
          </dl>
        </div>

        {/* Indicadores (bolinhas) na parte inferior */}
        <div className={styles.carrosselIndicadores}>
          {versoes.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicadorBolinha} ${
                index === versaoDecisaoAtiva ? styles.ativo : ''
              }`}
              onClick={() => setVersaoDecisaoAtiva(index)}
              title={
                index === 0
                  ? 'Ver Decisão Judicial'
                  : versoes.length === 2
                    ? 'Ver Decisão Retificadora'
                    : `Ver ${index}ª Decisão Retificadora`
              }
            />
          ))}
        </div>
      </div>
    );
  };

  // Função para renderizar dados da pesquisa
  const renderDadosPesquisa = () => {
    if (!documentoBase?.pesquisas || !Array.isArray(documentoBase.pesquisas))
      return null;

    const pesquisasValidas = documentoBase.pesquisas.filter(
      pesquisa => pesquisa.tipo || pesquisa.identificador
    );

    if (pesquisasValidas.length === 0) return null;

    return (
      <div className={styles.pesquisaContainer}>
        {pesquisasValidas.map((pesquisa, index) => (
          <div key={index} className={styles.pesquisaItem}>
            <div className={styles.pesquisaTipoDestaque}>
              {(pesquisa.tipo || 'NÃO INFORMADO').toUpperCase()}
            </div>
            <dl className={styles.infoList}>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Identificador</dt>
                <dd className={styles.infoValue}>
                  {pesquisa.identificador || 'Não informado'}
                </dd>
              </div>
              {pesquisa.complementar && (
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Complementar</dt>
                  <dd className={styles.infoValue}>{pesquisa.complementar}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>
    );
  };

  // Função para verificar se é documento do tipo Mídia
  const isMidiaDocument = useCallback(() => {
    return documentoBase?.tipoDocumento === 'Mídia';
  }, [documentoBase?.tipoDocumento]);

  // Função para verificar se é documento do tipo Relatório ou Autos Circunstanciados
  const isRelatorioOrAutosDocument = useCallback(() => {
    return (
      documentoBase?.tipoDocumento === 'Relatório Técnico' ||
      documentoBase?.tipoDocumento === 'Relatório de Inteligência' ||
      documentoBase?.tipoDocumento === 'Autos Circunstanciados'
    );
  }, [documentoBase?.tipoDocumento]);

  // Função para verificar se é documento do tipo Ofício
  const isOficioDocument = useCallback(() => {
    return documentoBase?.tipoDocumento === 'Ofício';
  }, [documentoBase?.tipoDocumento]);

  // Função para verificar se é documento do tipo Ofício Circular
  const isOficioCircularDocument = useCallback(() => {
    return documentoBase?.tipoDocumento === 'Ofício Circular';
  }, [documentoBase?.tipoDocumento]);

  // Função para calcular alturas balanceadas para layout de mídia
  const calculateMidiaHeights = useCallback(() => {
    if (!isMidiaDocument() || !cardInformacoesRef.current) return;

    const alturaEsquerda = cardInformacoesRef.current.offsetHeight;
    const gap = 24; // 1.5rem = 24px

    let alturaDadosMidia = 0;
    let alturaInfoComplementares = 0;

    if (cardDadosMidiaRef.current) {
      alturaDadosMidia = cardDadosMidiaRef.current.offsetHeight;
    }

    if (cardInfoComplementaresRef.current) {
      alturaInfoComplementares = cardInfoComplementaresRef.current.offsetHeight;
    }

    const alturaDireita = alturaDadosMidia + gap + alturaInfoComplementares;

    let newHeights = {};

    if (alturaDireita < alturaEsquerda) {
      // Caso 1: Direita menor que esquerda - expandir cards da direita proporcionalmente
      const alturaDisponivel = alturaEsquerda - gap;
      const totalAlturaOriginal = alturaDadosMidia + alturaInfoComplementares;

      if (totalAlturaOriginal > 0) {
        const proporcaoMidia = alturaDadosMidia / totalAlturaOriginal;
        const proporcaoComplementares =
          alturaInfoComplementares / totalAlturaOriginal;

        newHeights = {
          informacoes: alturaEsquerda,
          dadosMidia: alturaDisponivel * proporcaoMidia,
          infoComplementares: alturaDisponivel * proporcaoComplementares,
        };
      }
    } else if (alturaDireita > alturaEsquerda) {
      // Caso 2: Direita maior que esquerda - expandir card da esquerda
      newHeights = {
        informacoes: alturaDireita,
        dadosMidia: alturaDadosMidia,
        infoComplementares: alturaInfoComplementares,
      };
    } else {
      // Caso 3: Alturas iguais - manter altura natural
      newHeights = {
        informacoes: alturaEsquerda,
        dadosMidia: alturaDadosMidia,
        infoComplementares: alturaInfoComplementares,
      };
    }

    setCalculatedHeights(newHeights);
  }, [isMidiaDocument]);

  // Função para calcular alturas balanceadas para layout de ofício e ofício circular
  const calculateOficioHeights = useCallback(() => {
    if (!isOficioDocument() && !isOficioCircularDocument()) return;

    const cards = getCardsToShow();
    const numCards = cards.length;
    const gap = 24; // 1.5rem = 24px

    let newHeights: typeof calculatedOficioHeights = {};

    // Para 2 cards, usar layout 2 colunas (50%/50%) - não precisa calcular altura
    if (numCards === 2) {
      setCalculatedOficioHeights({});
      return;
    }

    // Obter alturas naturais dos cards
    const getCardHeight = (cardId: string) => {
      switch (cardId) {
        case 'informacoes':
          return cardInformacoesRef.current?.offsetHeight || 0;
        case 'informacoes_adicionais':
          return cardInfoComplementaresRef.current?.offsetHeight || 0;
        case 'dados_pesquisa':
          return cardDadosPesquisaRef.current?.offsetHeight || 0;
        case 'dados_decisao_judicial':
          return cardDecisaoJudicialRef.current?.offsetHeight || 0;
        case 'dados_midia':
          return cardDadosMidiaRef.current?.offsetHeight || 0;
        default:
          return 0;
      }
    };

    if (numCards === 2) {
      // 2 cards: layout de 1 coluna centralizada - sem cálculos especiais
      newHeights = {};
    } else if (numCards === 3) {
      // 3 cards: 2 colunas 50/50 com balanceamento
      const alturaInformacoes = getCardHeight('informacoes');
      const alturaInfoComplementares = getCardHeight('informacoes_adicionais');
      const alturaPesquisa = getCardHeight('dados_pesquisa');

      const alturaEsquerda = alturaInformacoes + gap + alturaInfoComplementares;

      if (alturaPesquisa > alturaEsquerda) {
        // Caso 2: Pesquisa maior - limitar altura e adicionar scroll
        // Balancear cards da esquerda proporcionalmente para chegar na altura total original
        const alturaDisponivel = alturaEsquerda - gap;
        const totalAlturaOriginal =
          alturaInformacoes + alturaInfoComplementares;

        if (totalAlturaOriginal > 0) {
          const proporcaoInformacoes = alturaInformacoes / totalAlturaOriginal;
          const proporcaoComplementares =
            alturaInfoComplementares / totalAlturaOriginal;

          newHeights = {
            informacoes: alturaDisponivel * proporcaoInformacoes,
            infoComplementares: alturaDisponivel * proporcaoComplementares,
            dadosPesquisa: alturaEsquerda,
            enableScrollPesquisa: true,
          };
        } else {
          newHeights = {
            dadosPesquisa: alturaEsquerda,
            enableScrollPesquisa: true,
          };
        }
      } else if (alturaPesquisa < alturaEsquerda) {
        // Caso 1: Pesquisa menor - expandir até altura da esquerda
        // Balancear cards da esquerda proporcionalmente para chegar na altura total original
        const alturaDisponivel = alturaEsquerda - gap;
        const totalAlturaOriginal =
          alturaInformacoes + alturaInfoComplementares;

        if (totalAlturaOriginal > 0) {
          const proporcaoInformacoes = alturaInformacoes / totalAlturaOriginal;
          const proporcaoComplementares =
            alturaInfoComplementares / totalAlturaOriginal;

          newHeights = {
            informacoes: alturaDisponivel * proporcaoInformacoes,
            infoComplementares: alturaDisponivel * proporcaoComplementares,
            dadosPesquisa: alturaEsquerda,
          };
        } else {
          newHeights = {
            dadosPesquisa: alturaEsquerda,
          };
        }
      }
      // Caso 3: Alturas iguais - não fazer nada (mantém alturas naturais)
    } else if (numCards === 4) {
      // 4 cards: 2 colunas 50/50 com regras específicas
      const alturaInformacoes = getCardHeight('informacoes');
      const alturaInfoComplementares = getCardHeight('informacoes_adicionais');
      const alturaPesquisa = getCardHeight('dados_pesquisa');
      const alturaDecisaoJudicial = getCardHeight('dados_decisao_judicial');

      // Regra 1 e 2: Pesquisa vs Informações
      if (alturaPesquisa > alturaInformacoes) {
        newHeights.dadosPesquisa = alturaInformacoes;
        newHeights.enableScrollPesquisa = true;
      } else if (alturaPesquisa < alturaInformacoes) {
        newHeights.dadosPesquisa = alturaInformacoes;
      }

      // Regra 3: InfoComplementares e DecisaoJudicial mesma altura
      const maiorAlturaInferior = Math.max(
        alturaInfoComplementares,
        alturaDecisaoJudicial
      );
      newHeights.infoComplementares = maiorAlturaInferior;
      newHeights.decisaoJudicial = maiorAlturaInferior;
    } else if (numCards === 5) {
      // 5 cards: layout híbrido
      const alturaInformacoes = getCardHeight('informacoes');
      const alturaPesquisa = getCardHeight('dados_pesquisa');
      const alturaInfoComplementares = getCardHeight('informacoes_adicionais');
      const alturaDecisaoJudicial = getCardHeight('dados_decisao_judicial');
      const alturaMidia = getCardHeight('dados_midia');

      // Regra 1 e 2: Pesquisa vs Informações (linha superior)
      if (alturaPesquisa > alturaInformacoes) {
        newHeights.dadosPesquisa = alturaInformacoes;
        newHeights.enableScrollPesquisa = true;
      } else if (alturaPesquisa < alturaInformacoes) {
        newHeights.dadosPesquisa = alturaInformacoes;
      }

      // Regra 3: Os 3 cards inferiores com mesma altura (maior entre os três)
      const maiorAlturaInferior = Math.max(
        alturaInfoComplementares,
        alturaDecisaoJudicial,
        alturaMidia
      );
      newHeights.infoComplementares = maiorAlturaInferior;
      newHeights.decisaoJudicial = maiorAlturaInferior;
      newHeights.dadosMidia = maiorAlturaInferior;
    }

    setCalculatedOficioHeights(newHeights);
  }, [isOficioDocument, isOficioCircularDocument]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect para calcular alturas após renderização
  useEffect(() => {
    if (isMidiaDocument()) {
      // Aguardar um pouco para garantir que os elementos foram renderizados
      const timer = setTimeout(() => {
        calculateMidiaHeights();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCalculatedHeights({});
    }
  }, [documentoBase?.tipoDocumento, calculateMidiaHeights, isMidiaDocument]);

  // Effect para calcular alturas de ofícios e ofícios circulares após renderização
  useEffect(() => {
    if (isOficioDocument() || isOficioCircularDocument()) {
      // Aguardar um pouco para garantir que os elementos foram renderizados
      const timer = setTimeout(() => {
        calculateOficioHeights();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCalculatedOficioHeights({});
    }
  }, [
    documentoBase?.tipoDocumento,
    calculateOficioHeights,
    isOficioDocument,
    isOficioCircularDocument,
  ]);

  // Função para obter todos os cards que devem ser exibidos
  const getCardsToShow = () => {
    const allCards: Record<
      string,
      {
        id: string;
        title: string;
        titleExtra?: React.ReactNode;
        icon: string;
        color: string;
        ref?: React.RefObject<HTMLDivElement | null>;
        className?: string;
        content: React.ReactNode;
      }
    > = {};

    if (!documentoBase) return [];

    // 1. Card de Informações do Documento (sempre presente)
    allCards.informacoes = {
      id: 'informacoes',
      title: 'Informações do Documento',
      icon: 'file-text',
      color: 'blue',
      ref: cardInformacoesRef,
      content: (
        <dl className={styles.infoList}>
          {demanda && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>SGED</dt>
              <dd className={styles.infoValue}>
                <Link
                  to={`/demandas/${demanda.id}`}
                  className={styles.linkDemanda}
                >
                  {demanda.sged}
                </Link>
              </dd>
            </div>
          )}
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
          {documentoBase.numeroAtena && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Número no Atena</dt>
              <dd className={styles.infoValue}>{documentoBase.numeroAtena}</dd>
            </div>
          )}
          {documentoBase.tipoDocumento !== 'Mídia' && (
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
          )}
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>Destinatário</dt>
            <dd className={styles.infoValue}>
              {formatDestinatarios(documentoBase.destinatario)}
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
    };

    // 2. Card de Dados da Pesquisa (se há dados da Seção 4)
    if (hasPesquisaData()) {
      const pesquisaContent = renderDadosPesquisa();
      if (pesquisaContent) {
        allCards.dados_pesquisa = {
          id: 'dados_pesquisa',
          title: 'Dados da Pesquisa',
          icon: 'search',
          color: 'yellow',
          ref: cardDadosPesquisaRef,
          content: pesquisaContent,
        };
      }
    }

    // 3. Card de Informações Adicionais (baseado no modal de atualização)
    const informacoesAdicionaisContent = renderInformacoesAdicionais();
    if (informacoesAdicionaisContent) {
      allCards.informacoes_adicionais = {
        id: 'informacoes_adicionais',
        title: isMidiaDocument()
          ? 'Informações Complementares'
          : 'Informações Adicionais',
        icon: 'info',
        color: 'green',
        ref: cardInfoComplementaresRef,
        content: informacoesAdicionaisContent,
      };
    }

    // 4. Card de Dados da Decisão Judicial (se há dados da Seção 2)
    if (hasDecisaoJudicialData()) {
      allCards.dados_decisao_judicial = {
        id: 'dados_decisao_judicial',
        title: 'Dados da Decisão Judicial',
        icon: 'gavel',
        color: 'purple',
        ref: cardDecisaoJudicialRef,
        content: renderRetificacoesCarrossel(),
      };
    }

    // 5. Card de Dados da Mídia (se há dados da Seção 3)
    if (hasMidiaData()) {
      allCards.dados_midia = {
        id: 'dados_midia',
        title: 'Dados da Mídia',
        icon: 'hard-drive',
        color: 'red',
        ref: cardDadosMidiaRef,
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
              <dt className={styles.infoLabel}>Hash</dt>
              <dd className={`${styles.infoValue} ${styles.hashText}`}>
                {documentoBase.hashMidia || 'Não informado'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Senha</dt>
              <dd className={styles.infoValue}>
                {documentoBase.senhaMidia || 'Não informado'}
              </dd>
            </div>
          </dl>
        ),
      };
    }

    // Retornar cards que existem
    return Object.values(allCards);
  };

  // Função para renderizar ícones
  const renderIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'file-text': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z" />
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
        </svg>
      ),
      info: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
        </svg>
      ),
      gavel: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5.009 5.009 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334z" />
        </svg>
      ),
      'hard-drive': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M4 10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2zM6 10.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0zm3 0a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0z" />
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H0V4zM0 7v5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V7H0z" />
        </svg>
      ),
      search: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
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
                  backgroundColor: getStatusColor(
                    getDocumentStatus(documentoBase)
                  ),
                }}
                title={getDocumentStatus(documentoBase)}
              />
              <span>Documento - {documentoBase.numeroDocumento}</span>
            </div>
            <div className={styles.actionButtons}>
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className={`${styles.iconButton} ${styles.updateButton}`}
                title="Atualizar Documento"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={handleEditDocumento}
                className={styles.iconButton}
                title="Editar Documento"
              >
                <LiaEdit size={20} />
              </button>
              <button
                onClick={handleDeleteDocumento}
                className={styles.iconButton}
                title="Excluir Documento"
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

      {/* Cards - Layout dinâmico baseado no tipo de documento */}
      {isMidiaDocument() ? (
        // Layout de mídia - 2 colunas
        <div className={styles.midiaLayout}>
          {/* Coluna Esquerda - Informações do Documento */}
          <div className={styles.midiaColumnLeft}>
            {(() => {
              const cards = getCardsToShow();
              const infoCard = cards.find(card => card.id === 'informacoes');
              if (!infoCard) return null;

              return (
                <div
                  key={infoCard.id}
                  data-card-id={infoCard.id}
                  ref={cardInformacoesRef}
                  className={`${styles.infoCard} ${styles[infoCard.color]} ${infoCard.className || ''} ${
                    styles.cardInformacoes
                  }`}
                  style={{
                    height: calculatedHeights.informacoes
                      ? `${calculatedHeights.informacoes}px`
                      : 'auto',
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      {renderIcon(infoCard.icon)}
                    </div>
                    <h3 className={styles.cardTitle}>
                      {infoCard.title}
                      {infoCard.titleExtra}
                    </h3>
                  </div>
                  {infoCard.content}
                </div>
              );
            })()}
          </div>

          {/* Coluna Direita - Dados da Mídia e Informações Complementares */}
          <div className={styles.midiaColumnRight}>
            {(() => {
              const cards = getCardsToShow();
              const rightCards = cards.filter(
                card =>
                  card.id === 'dados_midia' ||
                  card.id === 'informacoes_adicionais'
              );

              return rightCards.map(card => (
                <div
                  key={card.id}
                  data-card-id={card.id}
                  ref={
                    card.id === 'dados_midia'
                      ? cardDadosMidiaRef
                      : card.id === 'informacoes_adicionais'
                        ? cardInfoComplementaresRef
                        : card.ref
                  }
                  className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''}`}
                  style={{
                    height:
                      card.id === 'dados_midia' && calculatedHeights.dadosMidia
                        ? `${calculatedHeights.dadosMidia}px`
                        : card.id === 'informacoes_adicionais' &&
                            calculatedHeights.infoComplementares
                          ? `${calculatedHeights.infoComplementares}px`
                          : 'auto',
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      {renderIcon(card.icon)}
                    </div>
                    <h3 className={styles.cardTitle}>
                      {card.title}
                      {card.titleExtra}
                    </h3>
                  </div>
                  {card.content}
                </div>
              ));
            })()}
          </div>
        </div>
      ) : isOficioDocument() || isOficioCircularDocument() ? (
        // Layouts específicos para Ofícios e Ofícios Circulares baseados no número de cards
        (() => {
          const cards = getCardsToShow();
          const numCards = cards.length;

          if (numCards === 2) {
            // 2 cards: 2 colunas 50%/50%
            return (
              <div className={styles.layout2Cards}>
                {cards.map(card => (
                  <div
                    key={card.id}
                    data-card-id={card.id}
                    ref={
                      card.id === 'informacoes' ? cardInformacoesRef : card.ref
                    }
                    className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                      card.id === 'informacoes' ? styles.cardInformacoes : ''
                    }`}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>
                        {renderIcon(card.icon)}
                      </div>
                      <h3 className={styles.cardTitle}>
                        {card.title}
                        {card.titleExtra}
                      </h3>
                    </div>
                    {card.content}
                  </div>
                ))}
              </div>
            );
          } else if (numCards === 3) {
            // 3 cards: 2 colunas 50/50
            const leftCards = cards.filter(
              card =>
                card.id === 'informacoes' ||
                card.id === 'informacoes_adicionais'
            );
            const rightCards = cards.filter(
              card => card.id === 'dados_pesquisa'
            );

            return (
              <div className={styles.oficioLayout3Cards}>
                {/* Coluna Esquerda */}
                <div className={styles.oficioColumnLeft3Cards}>
                  {leftCards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={
                        card.id === 'informacoes'
                          ? cardInformacoesRef
                          : card.ref
                      }
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                        card.id === 'informacoes' ? styles.cardInformacoes : ''
                      }`}
                      style={{
                        height:
                          card.id === 'informacoes' &&
                          calculatedOficioHeights.informacoes
                            ? `${calculatedOficioHeights.informacoes}px`
                            : card.id === 'informacoes_adicionais' &&
                                calculatedOficioHeights.infoComplementares
                              ? `${calculatedOficioHeights.infoComplementares}px`
                              : 'auto',
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      {card.content}
                    </div>
                  ))}
                </div>
                {/* Coluna Direita */}
                <div className={styles.oficioColumnRight3Cards}>
                  {rightCards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={card.ref}
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                        calculatedOficioHeights.enableScrollPesquisa
                          ? styles.cardWithFixedHeader
                          : ''
                      }`}
                      style={{
                        height: calculatedOficioHeights.dadosPesquisa
                          ? `${calculatedOficioHeights.dadosPesquisa}px`
                          : 'auto',
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      <div
                        className={
                          calculatedOficioHeights.enableScrollPesquisa
                            ? styles.cardContentWithScroll
                            : ''
                        }
                      >
                        {card.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } else if (numCards === 4) {
            // 4 cards: 2 colunas 50/50
            const leftCards = cards.filter(
              card =>
                card.id === 'informacoes' ||
                card.id === 'informacoes_adicionais'
            );
            const rightCards = cards.filter(
              card =>
                card.id === 'dados_pesquisa' ||
                card.id === 'dados_decisao_judicial'
            );

            return (
              <div className={styles.oficioLayout4Cards}>
                {/* Coluna Esquerda */}
                <div className={styles.oficioColumnLeft4Cards}>
                  {leftCards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={
                        card.id === 'informacoes'
                          ? cardInformacoesRef
                          : card.ref
                      }
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                        card.id === 'informacoes' ? styles.cardInformacoes : ''
                      }`}
                      style={{
                        height:
                          card.id === 'informacoes_adicionais' &&
                          calculatedOficioHeights.infoComplementares
                            ? `${calculatedOficioHeights.infoComplementares}px`
                            : 'auto',
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      {card.content}
                    </div>
                  ))}
                </div>
                {/* Coluna Direita */}
                <div className={styles.oficioColumnRight4Cards}>
                  {rightCards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={card.ref}
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                        card.id === 'dados_pesquisa' &&
                        calculatedOficioHeights.enableScrollPesquisa
                          ? styles.cardWithFixedHeader
                          : ''
                      }`}
                      style={{
                        height:
                          card.id === 'dados_pesquisa' &&
                          calculatedOficioHeights.dadosPesquisa
                            ? `${calculatedOficioHeights.dadosPesquisa}px`
                            : card.id === 'dados_decisao_judicial' &&
                                calculatedOficioHeights.decisaoJudicial
                              ? `${calculatedOficioHeights.decisaoJudicial}px`
                              : 'auto',
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      <div
                        className={
                          card.id === 'dados_pesquisa' &&
                          calculatedOficioHeights.enableScrollPesquisa
                            ? styles.cardContentWithScroll
                            : ''
                        }
                      >
                        {card.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } else if (numCards === 5) {
            // 5 cards: layout híbrido (2 colunas superior + 3 colunas inferior)
            const upperCards = cards.filter(
              card => card.id === 'informacoes' || card.id === 'dados_pesquisa'
            );
            const lowerCards = cards.filter(
              card =>
                card.id === 'informacoes_adicionais' ||
                card.id === 'dados_decisao_judicial' ||
                card.id === 'dados_midia'
            );

            return (
              <div className={styles.oficioLayout5Cards}>
                {/* Linha Superior - 2 colunas */}
                <div className={styles.oficioRowSuperior}>
                  {upperCards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={
                        card.id === 'informacoes'
                          ? cardInformacoesRef
                          : card.ref
                      }
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                        card.id === 'informacoes' ? styles.cardInformacoes : ''
                      } ${
                        card.id === 'dados_pesquisa' &&
                        calculatedOficioHeights.enableScrollPesquisa
                          ? styles.cardWithFixedHeader
                          : ''
                      }`}
                      style={{
                        height:
                          card.id === 'dados_pesquisa' &&
                          calculatedOficioHeights.dadosPesquisa
                            ? `${calculatedOficioHeights.dadosPesquisa}px`
                            : 'auto',
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      <div
                        className={
                          card.id === 'dados_pesquisa' &&
                          calculatedOficioHeights.enableScrollPesquisa
                            ? styles.cardContentWithScroll
                            : ''
                        }
                      >
                        {card.content}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Linha Inferior - 3 colunas */}
                <div className={styles.oficioRowInferior}>
                  {lowerCards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={card.ref}
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''}`}
                      style={{
                        height:
                          card.id === 'informacoes_adicionais' &&
                          calculatedOficioHeights.infoComplementares
                            ? `${calculatedOficioHeights.infoComplementares}px`
                            : card.id === 'dados_decisao_judicial' &&
                                calculatedOficioHeights.decisaoJudicial
                              ? `${calculatedOficioHeights.decisaoJudicial}px`
                              : card.id === 'dados_midia' &&
                                  calculatedOficioHeights.dadosMidia
                                ? `${calculatedOficioHeights.dadosMidia}px`
                                : 'auto',
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      {card.content}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Fallback para números de cards não previstos
          return (
            <div className={styles.cardsVertical}>
              {cards.map(card => (
                <div
                  key={card.id}
                  data-card-id={card.id}
                  ref={
                    card.id === 'informacoes' ? cardInformacoesRef : card.ref
                  }
                  className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                    card.id === 'informacoes' ? styles.cardInformacoes : ''
                  }`}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      {renderIcon(card.icon)}
                    </div>
                    <h3 className={styles.cardTitle}>
                      {card.title}
                      {card.titleExtra}
                    </h3>
                  </div>
                  {card.content}
                </div>
              ))}
            </div>
          );
        })()
      ) : isRelatorioOrAutosDocument() ? (
        // Layout para relatórios e autos baseado no número de cards
        (() => {
          const cards = getCardsToShow();
          const numCards = cards.length;

          if (numCards === 2) {
            // 2 cards: 2 colunas 50%/50%
            return (
              <div className={styles.layout2Cards}>
                {cards.map(card => (
                  <div
                    key={card.id}
                    data-card-id={card.id}
                    ref={
                      card.id === 'informacoes' ? cardInformacoesRef : card.ref
                    }
                    className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                      card.id === 'informacoes' ? styles.cardInformacoes : ''
                    }`}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>
                        {renderIcon(card.icon)}
                      </div>
                      <h3 className={styles.cardTitle}>
                        {card.title}
                        {card.titleExtra}
                      </h3>
                    </div>
                    {card.content}
                  </div>
                ))}
              </div>
            );
          } else {
            // 1 card ou mais: layout centralizado tradicional
            return (
              <div className={styles.relatorioLayout}>
                <div className={styles.relatorioColumn}>
                  {cards.map(card => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      ref={
                        card.id === 'informacoes'
                          ? cardInformacoesRef
                          : card.ref
                      }
                      className={`${styles.infoCard} ${styles[card.color]} ${card.className || ''} ${
                        card.id === 'informacoes' ? styles.cardInformacoes : ''
                      }`}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                          {renderIcon(card.icon)}
                        </div>
                        <h3 className={styles.cardTitle}>
                          {card.title}
                          {card.titleExtra}
                        </h3>
                      </div>
                      {card.content}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        })()
      ) : (
        // Layout vertical tradicional para outros tipos de documento
        <div className={styles.cardsVertical}>
          {getCardsToShow().map(card => (
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
      )}

      {/* Novo Modal de Atualização com Estados Temporários */}
      <DocumentUpdateModal
        documento={documentoBase}
        documentosDemanda={documentosDemanda}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSave={updateData => {
          if (documentoId) {
            updateDocumento(parseInt(documentoId), updateData);
            setToastMessage('Documento atualizado com sucesso!');
            setToastType('success');
            setShowToast(true);
            // Forçar re-renderização da tabela de documentos relacionados
            setForceTableUpdate(prev => prev + 1);
          }
        }}
        onError={errorMessage => {
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
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
            </svg>
            Outros Documentos da Demanda ({documentosDemanda.length - 1})
          </h2>

          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th
                    className={`${styles.tableHeader} ${styles.sortableHeader}`}
                    onClick={() => handleSort('numeroDocumento')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Número
                      {getSortIcon('numeroDocumento')}
                    </div>
                  </th>
                  <th
                    className={`${styles.tableHeader} ${styles.sortableHeader}`}
                    onClick={() => handleSort('tipoDocumento')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Tipo
                      {getSortIcon('tipoDocumento')}
                    </div>
                  </th>
                  <th
                    className={`${styles.tableHeader} ${styles.sortableHeader}`}
                    onClick={() => handleSort('assunto')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Assunto
                      {getSortIcon('assunto')}
                    </div>
                  </th>
                  <th
                    className={`${styles.tableHeader} ${styles.sortableHeader}`}
                    onClick={() => handleSort('destinatario')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Destinatário
                      {getSortIcon('destinatario')}
                    </div>
                  </th>
                  <th
                    className={`${styles.tableHeader} ${styles.tableHeaderCenter} ${styles.sortableHeader}`}
                    onClick={() => handleSort('status')}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentosDemanda
                  .filter(doc => doc.id !== documentoBase.id)
                  .map(doc => (
                    <tr
                      key={doc.id}
                      className={styles.tableRow}
                      onClick={() =>
                        navigate(
                          `/documentos/${doc.id}?returnTo=${returnTo}&demandaId=${demandaId}`
                        )
                      }
                    >
                      <td className={styles.tableCell}>
                        {doc.numeroDocumento}
                      </td>
                      <td className={styles.tableCell}>{doc.tipoDocumento}</td>
                      <td className={styles.tableCell}>
                        {doc.assunto === 'Outros'
                          ? doc.assuntoOutros || doc.assunto
                          : doc.assunto}
                      </td>
                      <td className={styles.tableCell}>
                        {doc.destinatario || 'N/A'}
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellCenter}`}
                      >
                        {(() => {
                          const status = getDocumentStatus(doc);

                          // Se não tem status, não exibe indicador
                          if (status === 'Sem Status') {
                            return null;
                          }

                          return (
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: getStatusColor(
                                  status as DocumentStatus
                                ),
                                borderRadius: '50%',
                                margin: '0 auto',
                              }}
                              title={status}
                            />
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
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
