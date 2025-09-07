import React, { Suspense, lazy } from 'react';
import Skeleton from '../../../components/ui/Skeleton';
import {
  useProviderFilters,
  type UseProviderFiltersReturn,
} from '../../../hooks/useProviderFilters';
import styles from '../styles/HomePage.module.css';
import analysisStyles from './LazyAnalysis.module.css';

// Lazy load chart components
const ProviderStatsSummary = lazy(() => import('../../../components/charts/ProviderStatsSummary'));
const AverageResponseTimeChart = lazy(
  () => import('../../../components/charts/AverageResponseTimeChart')
);
const ResponseRateChart = lazy(() => import('../../../components/charts/ResponseRateChart'));
const ResponseTimeBoxplot = lazy(() => import('../../../components/charts/ResponseTimeBoxplot'));
const ProviderRanking = lazy(() => import('../../../components/charts/ProviderRanking'));

interface LazyProvidersAnalysisProps {
  providerFilters?: UseProviderFiltersReturn;
  selectedYears?: string[];
}

const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => (
  <div className={analysisStyles.skeletonContainer}>
    <Skeleton height={height} />
  </div>
);

export const LazyProvidersAnalysis: React.FC<LazyProvidersAnalysisProps> = ({
  providerFilters: externalFilters,
  selectedYears = [],
}) => {
  // Use external filters if provided, otherwise create local ones
  const localFilters = useProviderFilters();
  const filters = externalFilters ?? localFilters;

  return (
    <section className={styles.analysisSection}>
      <div className={styles.sectionHeaderContainer}>
        <div className='sectionHeader'>
          <h2>📊 Análise de Performance dos Provedores</h2>
          <p className={styles.sectionDescription}>
            Use os filtros abaixo para analisar diferentes tipos de solicitações
          </p>
        </div>
      </div>

      {/* Barra de Estatísticas Unificada */}
      <Suspense fallback={<ChartSkeleton height='80px' />}>
        <ProviderStatsSummary filters={filters} selectedYears={selectedYears} />
      </Suspense>

      {/* Primeira linha - Tempo Médio + Taxa de Resposta (50/50) */}
      <div className={styles.chartsGridFixedHalf}>
        <div className={styles.chartContainer}>
          <Suspense fallback={<ChartSkeleton height='350px' />}>
            <AverageResponseTimeChart filters={filters} />
          </Suspense>
        </div>

        <div className={styles.chartContainer}>
          <Suspense fallback={<ChartSkeleton height='350px' />}>
            <ResponseRateChart filters={filters} selectedYears={selectedYears} />
          </Suspense>
        </div>
      </div>

      {/* Segunda linha - Distribuição + Ranking (65/35) */}
      <div className={`${styles.chartsGridFixedLarge} ${styles.marginTop1}`}>
        <div className={styles.chartContainer}>
          <Suspense fallback={<ChartSkeleton height='350px' />}>
            <ResponseTimeBoxplot filters={filters} selectedYears={selectedYears} />
          </Suspense>
        </div>

        <div className={styles.chartContainer}>
          <Suspense fallback={<ChartSkeleton height='400px' />}>
            <ProviderRanking filters={filters} selectedYears={selectedYears} />
          </Suspense>
        </div>
      </div>
    </section>
  );
};
