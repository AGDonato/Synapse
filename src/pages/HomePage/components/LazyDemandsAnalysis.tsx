import React, { Suspense, lazy } from 'react';
import Skeleton from '../../../components/ui/Skeleton';
import { ChartContainer } from './ChartContainer';
import styles from '../styles/HomePage.module.css';

// Lazy load chart components
const DemandsYearlyChart = lazy(() => import('../../../components/charts/DemandsYearlyChart'));
const OpenDemandsChart = lazy(() => import('../../../components/charts/OpenDemandsChart').then(module => ({ default: module.OpenDemandsChart })));
const DemandTypesChart = lazy(() => import('../../../components/charts/DemandTypesChart'));
const StatusByYearChart = lazy(() => import('../../../components/charts/StatusByYearChart').then(module => ({ default: module.StatusByYearChart })));
const SolicitantesOrgansChart = lazy(() => import('../../../components/charts/SolicitantesOrgansChart'));

interface LazyDemandsAnalysisProps {
  selectedYears: string[];
}

const ChartSkeleton: React.FC<{ title: string }> = ({ title }) => (
  <ChartContainer title={title} titleIndicatorColor="blue">
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton height="200px" />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Skeleton height="20px" width="60px" />
        <Skeleton height="20px" width="80px" />
        <Skeleton height="20px" width="40px" />
      </div>
    </div>
  </ChartContainer>
);

export const LazyDemandsAnalysis: React.FC<LazyDemandsAnalysisProps> = ({
  selectedYears,
}) => {
  return (
    <section className={styles.analysisSection}>
      <div className={styles.sectionHeaderContainer}>
        <div className="sectionHeader">
          <h2>📈 Análise de Demandas</h2>
          <p className={styles.sectionDescription}>
            Visão geral do status e evolução das demandas ao longo do tempo
          </p>
        </div>
      </div>

      {/* Grid de Gráficos de Demandas */}
      <div className={styles.chartsGrid}>
        <Suspense fallback={<ChartSkeleton title="Demandas por Ano" />}>
          <ChartContainer
            title="Demandas por Ano"
            titleIndicatorColor="blue"
            variant="large"
          >
            <DemandsYearlyChart selectedYears={selectedYears} />
          </ChartContainer>
        </Suspense>

        <Suspense fallback={<ChartSkeleton title="Passivos anteriores" />}>
          <ChartContainer
            title="Passivos anteriores"
            titleIndicatorColor="green"
            variant="small"
          >
            <OpenDemandsChart />
          </ChartContainer>
        </Suspense>
      </div>

      {/* Segunda linha */}
      <div className={`${styles.gridTwoCols} ${styles.marginTop1}`}>
        <Suspense fallback={<ChartSkeleton title="Tipos de Demandas" />}>
          <ChartContainer
            title="Tipos de Demandas"
            titleIndicatorColor="purple"
          >
            <DemandTypesChart selectedYears={selectedYears} />
          </ChartContainer>
        </Suspense>

        <Suspense fallback={<ChartSkeleton title="Status por Ano" />}>
          <ChartContainer
            title="Status por Ano"
            titleIndicatorColor="blue2"
          >
            <StatusByYearChart />
          </ChartContainer>
        </Suspense>
      </div>

      {/* Terceira linha - Órgãos Solicitantes */}
      <div className={styles.marginTop1}>
        <Suspense fallback={<ChartSkeleton title="Órgãos Solicitantes" />}>
          <ChartContainer
            title="Órgãos Solicitantes"
            titleIndicatorColor="blue"
            variant="fullHeight"
          >
            <SolicitantesOrgansChart selectedYears={selectedYears} />
          </ChartContainer>
        </Suspense>
      </div>
    </section>
  );
};