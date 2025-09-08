/**
 * Wrapper para echarts-for-react que resolve problemas de import
 */

import React, { Suspense, lazy } from 'react';
import { Skeleton } from '../ui';
import type { EChartsOption } from 'echarts';
import { logger } from '../../utils/logger';

// Fallback component for development
const FallbackChart = ({ option }: { option: EChartsOption }) => (
  <div
    style={{
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed #ccc',
      borderRadius: '8px',
    }}
  >
    <div>
      <p>Gráfico indisponível</p>
      <small>{JSON.stringify(option.title, null, 2)}</small>
    </div>
  </div>
);

// Type for the lazy-loaded component
type ReactEChartsComponent = React.ComponentType<{
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
  onChartReady?: (chartInstance: unknown) => void;
  showLoading?: boolean;
  loadingOption?: Record<string, unknown>;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  opts?: Record<string, unknown>;
}>;

// Lazy load do ReactECharts para evitar problemas de import inicial
const ReactECharts = lazy(async (): Promise<{ default: ReactEChartsComponent }> => {
  try {
    const module = await import('echarts-for-react');
    return { default: (module.default || module) as ReactEChartsComponent };
  } catch (error) {
    logger.warn('Failed to load echarts-for-react:', error);
    // Fallback para desenvolvimento
    return { default: FallbackChart as ReactEChartsComponent };
  }
});

export interface EChartsReactWrapperProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
  onChartReady?: (chartInstance: unknown) => void;
  showLoading?: boolean;
  loadingOption?: Record<string, unknown>;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  opts?: Record<string, unknown>;
}

/**
 * Wrapper seguro para ReactECharts que trata erros de import
 */
export const EChartsReactWrapper: React.FC<EChartsReactWrapperProps> = props => {
  return (
    <Suspense
      fallback={<Skeleton height={props.style?.height || '400px'} className={props.className} />}
    >
      <ReactECharts
        option={props.option}
        style={props.style}
        className={props.className}
        theme={props.theme}
        onChartReady={props.onChartReady}
        showLoading={props.showLoading}
        loadingOption={props.loadingOption}
        notMerge={props.notMerge}
        lazyUpdate={props.lazyUpdate}
        opts={props.opts}
      />
    </Suspense>
  );
};

export default EChartsReactWrapper;
