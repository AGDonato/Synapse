// src/components/charts/index.ts

// Core chart components
export { default as AnalyticsChart } from './AnalyticsChart';
export { default as AverageResponseTimeChart } from './AverageResponseTimeChart';
export { default as OptimizedAverageResponseTimeChart } from './OptimizedAverageResponseTimeChart';
export { default as DemandTypesChart } from './DemandTypesChart';
export { default as DemandsYearlyChart } from './DemandsYearlyChart';
export { default as JudicialOrgansTreemap } from './JudicialOrgansTreemap';
export { default as MediaTypesChart } from './MediaTypesChart';
export { default as OpenDemandsChart } from './OpenDemandsChart';
export { default as ProviderRanking } from './ProviderRanking';
export { default as ProviderStatsSummary } from './ProviderStatsSummary';
export { default as ResponseRateChart } from './ResponseRateChart';
export { default as ResponseTimeBoxplot } from './ResponseTimeBoxplot';
export { default as SolicitantesOrgansChart } from './SolicitantesOrgansChart';
export { default as StatusByYearChart } from './StatusByYearChart';

// Chart utilities and wrappers
export {
  LazyChartWrapper,
  OptimizedChartContainer,
  withChartOptimization,
  useOptimizedChartData,
  useChartTheme,
  useResponsiveChart,
} from './LazyChartWrapper';

// Chart helpers
export { default as ProviderFilters } from './ProviderFilters';
export { default as ProviderLimitButtons } from './ProviderLimitButtons';
