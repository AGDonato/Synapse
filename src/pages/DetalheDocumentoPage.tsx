// src/pages/DetalheDocumentoPage.tsx
import { useParams, Link } from 'react-router-dom';
import { mockDocumentosDemanda } from '../data/mockDocumentos';
import { useDemandas } from '../hooks/useDemandas';
import { formatDateToDDMMYYYYOrPlaceholder } from '../utils/dateUtils';
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
  const { demandas } = useDemandas();

  // Por enquanto, vamos usar os dados básicos do mockDocumentosDemanda
  // Em uma implementação real, isso viria de uma API ou estado global
  const documentoBase = mockDocumentosDemanda.find(
    (d) => d.id === parseInt(documentoId || '')
  );

  if (!documentoBase) {
    return (
      <div className={styles.detalheContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1>
              <span>Detalhe do Documento - Não Encontrado</span>
            </h1>
          </div>
          <Link to='/documentos' className={styles.btnHeaderBack}>
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

  // Mock de dados completos para demonstração
  const documento: DocumentoCompleto = {
    ...documentoBase,
    // Informações do Documento (sempre presente)
    assunto:
      documentoBase.id === 1 ? 'Requisição de dados cadastrais' : undefined,
    assuntoOutros:
      documentoBase.id === 2
        ? 'Solicitação especial de informações'
        : undefined,
    enderecamento:
      documentoBase.id === 1
        ? 'Operadora TIM S.A. - Departamento Jurídico'
        : undefined,
    anoDocumento: '2025',
    analista: '100',
    // Dados da Decisão Judicial (condicional)
    autoridade: documentoBase.id === 1 ? 'Dr. João Silva' : undefined,
    orgaoJudicial: documentoBase.id === 1 ? 'TRF 1ª Região' : undefined,
    dataAssinatura: documentoBase.id === 1 ? '2025-07-20' : undefined,
    retificada: documentoBase.id === 1 ? false : undefined,
    // Dados da Mídia (condicional)
    tipoMidia: documentoBase.id === 3 ? 'DVD' : undefined,
    tamanhoMidia: documentoBase.id === 3 ? '4.7 GB' : undefined,
    hashMidia: documentoBase.id === 3 ? 'SHA256:abc123def456...' : undefined,
    senhaMidia: documentoBase.id === 3 ? '****' : undefined,
    // Dados da Pesquisa (condicional)
    pesquisas:
      documentoBase.id === 2
        ? [
            {
              tipo: 'CPF',
              identificador: '123.456.789-00',
              complementar: 'Pessoa Física',
            },
            {
              tipo: 'CNPJ',
              identificador: '12.345.678/0001-90',
              complementar: 'Empresa Principal',
            },
          ]
        : undefined,
  };

  const demanda = demandas.find((d) => d.id === documento.demandaId);

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

  return (
    <div className={styles.detalheContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>
            <span>Detalhe do Documento - {documento.numeroDocumento}</span>
          </h1>
        </div>
        <Link to='/documentos' className={styles.btnHeaderBack}>
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
    </div>
  );
}
