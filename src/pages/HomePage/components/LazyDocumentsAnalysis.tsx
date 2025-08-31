import React, { Suspense, lazy, useMemo } from 'react';
import Skeleton from '../../../components/ui/Skeleton';
import { ChartContainer } from './ChartContainer';
import { useDemandasData } from '../../../hooks/queries/useDemandas';
import { useDocumentosData } from '../../../hooks/queries/useDocumentos';
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import styles from '../styles/HomePage.module.css';

// Lazy load chart components
const MediaTypesChart = lazy(() => import('../../../components/charts/MediaTypesChart'));
const JudicialOrgansTreemap = lazy(
  () => import('../../../components/charts/JudicialOrgansTreemap')
);

interface LazyDocumentsAnalysisProps {
  selectedYears: string[];
}

// Função auxiliar para cálculos de estatísticas de documentos
const calculateDocumentStats = (documentos: DocumentoDemanda[]) => ({
  totalDocuments: documentos.length,
  oficio: documentos.filter(doc => doc.tipoDocumento === 'Ofício').length,
  oficioCircular: documentos.filter(doc => doc.tipoDocumento === 'Ofício Circular').length,
  relatorioTecnico: documentos.filter(doc => doc.tipoDocumento === 'Relatório Técnico').length,
  relatorioInteligencia: documentos.filter(doc => doc.tipoDocumento === 'Relatório de Inteligência')
    .length,
  autosCircunstanciados: documentos.filter(doc => doc.tipoDocumento === 'Autos Circunstanciados')
    .length,
  midia: documentos.filter(doc => doc.tipoDocumento === 'Mídia').length,
});

// Função auxiliar para cálculos de identificadores
const calculateIdentifierStats = (demandas: Demanda[], documentos: DocumentoDemanda[]) => {
  const totalTargets = demandas.reduce(
    (sum, demanda) =>
      sum +
      (typeof demanda.alvos === 'number' ? demanda.alvos : parseInt(demanda.alvos ?? '0', 10)),
    0
  );

  const uniqueIdentifiers = new Set();
  documentos.forEach(doc => {
    doc.pesquisas.forEach(pesquisa => {
      if (pesquisa.identificador) uniqueIdentifiers.add(pesquisa.identificador);
    });
  });

  return { totalTargets, uniqueIdentifiers: uniqueIdentifiers.size };
};

// Função auxiliar para cálculos de mídias
const calculateMediaStats = (documentos: DocumentoDemanda[]) => {
  let totalMB = 0;
  let defectiveCount = 0;

  documentos.forEach(doc => {
    if (doc.tipoDocumento === 'Mídia') {
      if (doc.apresentouDefeito) defectiveCount++;

      if (doc.tamanhoMidia) {
        const size = doc.tamanhoMidia;
        if (size.includes('GB')) totalMB += parseFloat(size) * 1024;
        else if (size.includes('TB')) totalMB += parseFloat(size) * 1024 * 1024;
        else if (size.includes('MB')) totalMB += parseFloat(size);
      }
    }
  });

  let volumeDisplay = '';
  if (totalMB >= 1024 * 1024) volumeDisplay = `${(totalMB / (1024 * 1024)).toFixed(1)} TB`;
  else if (totalMB >= 1024) volumeDisplay = `${(totalMB / 1024).toFixed(1)} GB`;
  else volumeDisplay = `${totalMB.toFixed(0)} MB`;

  return { volumeDisplay, defectiveCount };
};

// Função auxiliar para cálculos de decisões judiciais
const calculateJudicialStats = (
  documentos: DocumentoDemanda[],
  demandas: Demanda[],
  selectedYears: string[]
) => {
  const relevantDocs = documentos.filter(doc => {
    const demanda = demandas.find(d => d.id === doc.demandaId);
    if (!demanda?.dataInicial) return false;

    const docYear = demanda.dataInicial.split('/')[2];
    if (selectedYears.length > 0 && !selectedYears.includes(docYear)) return false;

    const isValidType = doc.tipoDocumento === 'Ofício' || doc.tipoDocumento === 'Ofício Circular';
    const isDecisaoJudicial = doc.assunto === 'Encaminhamento de decisão judicial';

    return (
      isValidType && isDecisaoJudicial && doc.autoridade && doc.orgaoJudicial && doc.dataAssinatura
    );
  });

  const uniqueDecisions = new Set();
  const uniqueDecisionsData = new Map();
  let rectifiedCount = 0;

  relevantDocs.forEach(doc => {
    const demanda = demandas.find(d => d.id === doc.demandaId);
    const key = `${demanda?.sged}-${doc.autoridade}-${doc.orgaoJudicial}-${doc.dataAssinatura}`;

    if (!uniqueDecisions.has(key)) {
      uniqueDecisions.add(key);
      uniqueDecisionsData.set(key, doc);
      if (doc.retificada) rectifiedCount++;
    }
  });

  return { totalDecisions: uniqueDecisions.size, rectifiedCount };
};

export const LazyDocumentsAnalysis: React.FC<LazyDocumentsAnalysisProps> = ({ selectedYears }) => {
  const { data: demandas = [] } = useDemandasData();
  const { data: documentos = [] } = useDocumentosData();

  // Cálculos de estatísticas de documentos
  const documentStats = useMemo(() => calculateDocumentStats(documentos), [documentos]);

  // Cálculos para identificadores únicos e alvos
  const identifierStats = useMemo(
    () => calculateIdentifierStats(demandas, documentos),
    [demandas, documentos]
  );

  // Cálculos para mídias
  const mediaStats = useMemo(() => calculateMediaStats(documentos), [documentos]);

  // Cálculos para decisões judiciais - mesma lógica do treemap
  const judicialStats = useMemo(
    () => calculateJudicialStats(documentos, demandas, selectedYears),
    [documentos, demandas, selectedYears]
  );

  return (
    <section className={styles.analysisSection}>
      <div className={styles.sectionHeaderContainer}>
        <div className='sectionHeader'>
          <h2>📄 Análise de Documentos</h2>
          <p className={styles.sectionDescription}>
            Estatísticas e métricas sobre produção e tipos de documentos
          </p>
        </div>
      </div>

      {/* Primeira linha - Proporção 65/35 */}
      <div className={styles.chartsGridFixedLarge}>
        {/* Tipos de Documentos - Card com estatísticas */}
        <div className={styles.documentTypesCard}>
          <ChartContainer title='Tipos de Documentos' titleIndicatorColor='blue'>
            <div className={styles.documentTypesGrid}>
              <div className={styles.docTypeCard}>
                <div className={styles.docTypeValue}>{documentStats.oficio}</div>
                <div className={styles.docTypeLabel}>Ofícios</div>
              </div>
              <div className={styles.docTypeCard}>
                <div className={styles.docTypeValue}>{documentStats.oficioCircular}</div>
                <div className={styles.docTypeLabel}>Ofícios Circulares</div>
              </div>
              <div className={styles.docTypeCard}>
                <div className={styles.docTypeValue}>{documentStats.relatorioTecnico}</div>
                <div className={styles.docTypeLabel}>Relatórios Técnicos</div>
              </div>
              <div className={styles.docTypeCard}>
                <div className={styles.docTypeValue}>{documentStats.relatorioInteligencia}</div>
                <div className={styles.docTypeLabel}>Relatórios de Inteligência</div>
              </div>
              <div className={styles.docTypeCard}>
                <div className={styles.docTypeValue}>{documentStats.autosCircunstanciados}</div>
                <div className={styles.docTypeLabel}>Autos Circunstanciados</div>
              </div>
              <div className={styles.docTypeCard}>
                <div className={styles.docTypeValue}>{documentStats.midia}</div>
                <div className={styles.docTypeLabel}>Mídias</div>
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Identificadores e Alvos */}
        <ChartContainer
          title='Identificadores e Alvos'
          titleIndicatorColor='orange'
          variant='small'
        >
          <div className={styles.identifiersGrid}>
            <div className={styles.identifierCard}>
              <div className={styles.identifierValue}>{identifierStats.totalTargets}</div>
              <div className={styles.identifierLabel}>Total de Alvos</div>
            </div>
            <div className={styles.identifierCard}>
              <div className={styles.identifierValue}>{identifierStats.uniqueIdentifiers}</div>
              <div className={styles.identifierLabel}>Identificadores Únicos</div>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Segunda linha - Proporção 50/50 */}
      <div className={styles.chartsGridFixedHalf}>
        {/* Decisões Judiciais */}
        <ChartContainer title='Decisões Judiciais' titleIndicatorColor='indigo' variant='half'>
          <div className={styles.mediaContent}>
            <div className={styles.mediaStats}>
              <div className={styles.mediaStatCard}>
                <div className={styles.mediaStatValue}>{judicialStats.totalDecisions}</div>
                <div className={styles.mediaStatLabel}>Decisões</div>
              </div>
              <div className={styles.mediaStatCard}>
                <div className={styles.mediaStatValue}>{judicialStats.rectifiedCount}</div>
                <div className={styles.mediaStatLabel}>Retificadas</div>
              </div>
            </div>
            <div className={styles.mediaChart}>
              <Suspense fallback={<Skeleton height='300px' />}>
                <JudicialOrgansTreemap selectedYears={selectedYears} />
              </Suspense>
            </div>
          </div>
        </ChartContainer>

        {/* Mídias */}
        <ChartContainer title='Mídias' titleIndicatorColor='red' variant='half'>
          <div className={styles.mediaContent}>
            <div className={styles.mediaStats}>
              <div className={styles.mediaStatCard}>
                <div className={styles.mediaStatValue}>{mediaStats.volumeDisplay}</div>
                <div className={styles.mediaStatLabel}>Volume Total</div>
              </div>
              <div className={styles.mediaStatCard}>
                <div className={styles.mediaStatValue}>{mediaStats.defectiveCount}</div>
                <div className={styles.mediaStatLabel}>Mídias c/ Defeitos</div>
              </div>
            </div>
            <div className={styles.mediaChart}>
              <Suspense fallback={<Skeleton height='300px' />}>
                <MediaTypesChart selectedYears={selectedYears} />
              </Suspense>
            </div>
          </div>
        </ChartContainer>
      </div>
    </section>
  );
};
