// src/components/charts/LazyChartWrapper.tsx
import React, { Suspense, lazy } from 'react';
import { Skeleton } from '../ui';
import { createModuleLogger } from '../../utils/logger';

// Lazy load ECharts components only when needed
const EChartsReact = lazy(() =>
  import('echarts-for-react').then(module => ({
    default: module.default,
  }))
);

// Chart loading skeleton
const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '400px' }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton height={height} />
  </div>
);

// Intersection Observer hook for conditional loading
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Props interface for the wrapper
interface LazyChartWrapperProps {
  option: unknown;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  loadImmediately?: boolean;
  theme?: string;
  opts?: unknown;
  onEvents?: unknown;
}

// Main lazy chart wrapper component
export const LazyChartWrapper: React.FC<LazyChartWrapperProps> = ({
  option,
  height = '400px',
  className,
  style,
  loadImmediately = false,
  theme,
  opts,
  onEvents,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(containerRef);

  // Load chart when it comes into view or immediately if specified
  const shouldLoadChart = loadImmediately || hasIntersected;

  return (
    <div ref={containerRef} className={className} style={{ height, ...style }}>
      {shouldLoadChart ? (
        <Suspense fallback={<ChartSkeleton height={height} />}>
          <EChartsReact
            option={option}
            style={{ height, width: '100%' }}
            theme={theme}
            opts={opts}
            onEvents={onEvents}
          />
        </Suspense>
      ) : (
        <ChartSkeleton height={height} />
      )}
    </div>
  );
};

// Higher-order component for chart optimization
export function withChartOptimization<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return React.memo<T>(props => {
    return <WrappedComponent {...props} />;
  });
}

// Optimized chart container with error boundary
interface OptimizedChartContainerProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const OptimizedChartContainer: React.FC<OptimizedChartContainerProps> = React.memo(
  ({ title, children, className, style }) => {
    return (
      <div className={`chart-container ${className || ''}`} style={style}>
        {title && <h3 className='chart-title'>{title}</h3>}
        <React.Suspense fallback={<ChartSkeleton />}>{children}</React.Suspense>
      </div>
    );
  }
);

OptimizedChartContainer.displayName = 'OptimizedChartContainer';

// Chart data processor hook with memoization
const logger = createModuleLogger('LazyChartWrapper');

export function useOptimizedChartData<T>(
  data: T[],
  processor: (data: T[]) => unknown,
  dependencies: React.DependencyList = []
) {
  return React.useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    try {
      return processor(data);
    } catch (error) {
      logger.error('Chart data processing error', { error });
      return null;
    }
  }, [data, processor, ...dependencies]);
}

// Chart theme hook with system preference detection
export function useChartTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial theme
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return theme;
}

// Responsive chart hook
export function useResponsiveChart(containerRef: React.RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return dimensions;
}

export default LazyChartWrapper;
