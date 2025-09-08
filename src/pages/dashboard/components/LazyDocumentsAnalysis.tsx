import React, { Suspense, lazy, useMemo } from 'react';
import Skeleton from '../../../shared/components/ui/Skeleton';
import { ChartContainer } from './ChartContainer';
import { useDemandasData } from '../../../shared/hooks/queries/useDemandas';
import { useDocumentosData } from '../../../shared/hooks/queries/useDocumentos';
import type { Demanda } from '../../../shared/types/entities';
import type { DocumentoDemanda } from '../../../shared/data/mockDocumentos';
import styles from '../styles/HomePage.module.css';

// Lazy load chart components
const MediaTypesChart = lazy(() => import('../../../shared/components/charts/MediaTypesChart'));
const JudicialOrgansTreemap = lazy(
  () => import('../../../shared/components/charts/JudicialOrgansTreemap')
);

interface LazyDocumentsAnalysisProps {
  selectedYears: string[];
}

// Função auxiliar para cálculos de estatísticas de documentos
const calculateDocumentStats = (
  documentos: DocumentoDemanda[],
  demandas: Demanda[],
  selectedYears: string[]
) => {
  // Filtrar documentos pelos anos das demandas
  const filteredDocumentos = documentos.filter(doc => {
    const demanda = demandas.find(d => d.id === doc.demandaId);
    if (!demanda?.dataInicial) return false;

    const year = demanda.dataInicial.split('/')[2];
    return selectedYears.length > 0 ? selectedYears.includes(year) : true;
  });

  return {
    totalDocuments: filteredDocumentos.length,
    oficio: filteredDocumentos.filter(doc => doc.tipoDocumento === 'Ofício').length,
    oficioCircular: filteredDocumentos.filter(doc => doc.tipoDocumento === 'Ofício Circular')
      .length,
    relatorioTecnico: filteredDocumentos.filter(doc => doc.tipoDocumento === 'Relatório Técnico')
      .length,
    relatorioInteligencia: filteredDocumentos.filter(
      doc => doc.tipoDocumento === 'Relatório de Inteligência'
    ).length,
    autosCircunstanciados: filteredDocumentos.filter(
      doc => doc.tipoDocumento === 'Autos Circunstanciados'
    ).length,
    midia: filteredDocumentos.filter(doc => doc.tipoDocumento === 'Mídia').length,
  };
};

// Função auxiliar para cálculos de identificadores
const calculateIdentifierStats = (
  demandas: Demanda[],
  documentos: DocumentoDemanda[],
  selectedYears: string[]
) => {
  // Filtrar demandas pelos anos selecionados
  const filteredDemandas = demandas.filter(demanda => {
    if (!demanda.dataInicial) return false;
    const year = demanda.dataInicial.split('/')[2];
    return selectedYears.length > 0 ? selectedYears.includes(year) : true;
  });

  // Filtrar documentos pelas demandas filtradas
  const filteredDemandaIds = new Set(filteredDemandas.map(d => d.id));
  const filteredDocumentos = documentos.filter(doc => filteredDemandaIds.has(doc.demandaId));

  const totalTargets = filteredDemandas.reduce(
    (sum, demanda) =>
      sum +
      (typeof demanda.alvos === 'number' ? demanda.alvos : parseInt(demanda.alvos ?? '0', 10)),
    0
  );

  const uniqueIdentifiers = new Set();
  filteredDocumentos.forEach(doc => {
    doc.pesquisas.forEach(pesquisa => {
      if (pesquisa.identificador) uniqueIdentifiers.add(pesquisa.identificador);
    });
  });

  return { totalTargets, uniqueIdentifiers: uniqueIdentifiers.size };
};

// Função auxiliar para cálculos de mídias
const calculateMediaStats = (
  documentos: DocumentoDemanda[],
  demandas: Demanda[],
  selectedYears: string[]
) => {
  // Filtrar documentos pelos anos das demandas
  const filteredDocumentos = documentos.filter(doc => {
    const demanda = demandas.find(d => d.id === doc.demandaId);
    if (!demanda?.dataInicial) return false;

    const year = demanda.dataInicial.split('/')[2];
    return selectedYears.length > 0 ? selectedYears.includes(year) : true;
  });

  let totalMB = 0;
  let defectiveCount = 0;

  filteredDocumentos.forEach(doc => {
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
  const documentStats = useMemo(
    () => calculateDocumentStats(documentos, demandas, selectedYears),
    [documentos, demandas, selectedYears]
  );

  // Cálculos para identificadores únicos e alvos
  const identifierStats = useMemo(
    () => calculateIdentifierStats(demandas, documentos, selectedYears),
    [demandas, documentos, selectedYears]
  );

  // Cálculos para mídias
  const mediaStats = useMemo(
    () => calculateMediaStats(documentos, demandas, selectedYears),
    [documentos, demandas, selectedYears]
  );

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
        <ChartContainer title='Tipos de Documentos' titleIndicatorColor='blue' variant='small'>
          <div className={styles.documentTypesStats}>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{documentStats.oficio}</div>
              <div className={styles.mediaStatLabel}>Ofícios</div>
            </div>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{documentStats.oficioCircular}</div>
              <div className={styles.mediaStatLabel}>Ofícios Circulares</div>
            </div>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{documentStats.relatorioTecnico}</div>
              <div className={styles.mediaStatLabel}>Relatórios Técnicos</div>
            </div>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{documentStats.relatorioInteligencia}</div>
              <div className={styles.mediaStatLabel}>Relatórios de Inteligência</div>
            </div>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{documentStats.autosCircunstanciados}</div>
              <div className={styles.mediaStatLabel}>Autos Circunstanciados</div>
            </div>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{documentStats.midia}</div>
              <div className={styles.mediaStatLabel}>Mídias</div>
            </div>
          </div>
        </ChartContainer>

        {/* Identificadores e Alvos */}
        <ChartContainer
          title='Identificadores e Alvos'
          titleIndicatorColor='orange'
          variant='small'
        >
          <div className={styles.identifiersVertical}>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{identifierStats.totalTargets}</div>
              <div className={styles.mediaStatLabel}>Total de Alvos</div>
            </div>
            <div className={styles.mediaStatCard}>
              <div className={styles.mediaStatValue}>{identifierStats.uniqueIdentifiers}</div>
              <div className={styles.mediaStatLabel}>Identificadores Únicos</div>
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
