/**
 * Componente para renderizar cards de informações do documento
 *
 * Extrai a lógica de renderização condicional dos diferentes tipos
 * de cards de informação (Informações Adicionais, Decisão Judicial, Mídia)
 */

import React from 'react';
import type { DocumentoDemanda as Documento } from '../../data/mockDocumentos';
import { convertToBrazilianDate } from './modals/utils';
import styles from './DocumentInfoCard.module.css';

export interface DocumentInfoCardProps {
  document: Documento;
  type: 'informacoes' | 'decisao' | 'midia';
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement>;
}

export const DocumentInfoCard: React.FC<DocumentInfoCardProps> = React.memo(
  function DocumentInfoCard({ document, type, className, cardRef }) {

    const renderInformacoesContent = () => {
      const { tipoDocumento } = document;

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
                {document.dataFinalizacao
                  ? convertToBrazilianDate(document.dataFinalizacao)
                  : 'N/A'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Apresentou Defeito</dt>
              <dd className={styles.infoValue}>
                {document.apresentouDefeito ? 'Sim' : 'Não'}
              </dd>
            </div>
          </dl>
        );
      }

      // Outros tipos de documento - informações gerais
      return (
        <dl className={styles.infoList}>
          {document.numeroAtena && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Número ATENA</dt>
              <dd className={styles.infoValue}>{document.numeroAtena}</dd>
            </div>
          )}
          {document.assuntoOutros && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Outros Assuntos</dt>
              <dd className={styles.infoValue}>{document.assuntoOutros}</dd>
            </div>
          )}
          {document.anoDocumento && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Ano do Documento</dt>
              <dd className={styles.infoValue}>{document.anoDocumento}</dd>
            </div>
          )}
          {document.analista && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Analista</dt>
              <dd className={styles.infoValue}>{document.analista}</dd>
            </div>
          )}
        </dl>
      );
    };

    const renderDecisaoContent = () => {
      return (
        <dl className={styles.infoList}>
          {document.autoridade && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Autoridade</dt>
              <dd className={styles.infoValue}>{document.autoridade}</dd>
            </div>
          )}
          {document.orgaoJudicial && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Órgão Judicial</dt>
              <dd className={styles.infoValue}>{document.orgaoJudicial}</dd>
            </div>
          )}
          {document.dataAssinatura && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Data da Assinatura</dt>
              <dd className={styles.infoValue}>
                {convertToBrazilianDate(document.dataAssinatura)}
              </dd>
            </div>
          )}
        </dl>
      );
    };

    const renderMidiaContent = () => {
      return (
        <dl className={styles.infoList}>
          {document.tipoMidia && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tipo de Mídia</dt>
              <dd className={styles.infoValue}>{document.tipoMidia}</dd>
            </div>
          )}
          {document.tamanhoMidia && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Tamanho da Mídia</dt>
              <dd className={styles.infoValue}>{document.tamanhoMidia}</dd>
            </div>
          )}
          {document.hashMidia && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Hash da Mídia</dt>
              <dd className={`${styles.infoValue} ${styles.hashValue}`}>
                {document.hashMidia}
              </dd>
            </div>
          )}
          {document.senhaMidia && (
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>Senha da Mídia</dt>
              <dd className={styles.infoValue}>••••••••</dd>
            </div>
          )}
        </dl>
      );
    };

    const getTitle = () => {
      switch (type) {
        case 'informacoes':
          return 'Informações Adicionais';
        case 'decisao':
          return 'Decisão Judicial';
        case 'midia':
          return 'Informações da Mídia';
        default:
          return 'Informações';
      }
    };

    const getContent = () => {
      switch (type) {
        case 'informacoes':
          return renderInformacoesContent();
        case 'decisao':
          return renderDecisaoContent();
        case 'midia':
          return renderMidiaContent();
        default:
          return null;
      }
    };

    return (
      <div ref={cardRef} className={`${styles.card} ${className || ''}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{getTitle()}</h3>
        </div>
        <div className={styles.cardBody}>{getContent()}</div>
      </div>
    );
  }
);

export default DocumentInfoCard;
