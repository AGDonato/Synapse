import React, { forwardRef, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption } from 'echarts';

interface EChartsWrapperProps {
  option: EChartsOption;
  height?: number | string;
  width?: number | string;
  loading?: boolean;
  loadingText?: string;
  style?: React.CSSProperties;
  className?: string;
  opts?: {
    renderer?: 'canvas' | 'svg';
    width?: number;
    height?: number;
  };
  onChartReady?: (chartInstance: ECharts) => void;
  onEvents?: Record<string, (params: unknown) => void>;
}

export const EChartsWrapper = forwardRef<ReactECharts, EChartsWrapperProps>(
  (
    {
      option,
      height = 300,
      width = '100%',
      loading = false,
      loadingText = 'Carregando gráfico...',
      style,
      className,
      opts = { renderer: 'svg' },
      onChartReady,
      onEvents,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isReady, setIsReady] = useState(false);

    // Handle container resizing with proper cleanup
    useEffect(() => {
      const updateDimensions = () => {
        if (!containerRef.current) {
          return;
        }

        const { clientWidth, clientHeight } = containerRef.current;

        // Only update if we have valid dimensions
        if (clientWidth > 0) {
          const calculatedHeight =
            typeof height === 'number'
              ? height
              : typeof height === 'string' && height.endsWith('px')
                ? parseInt(height.replace('px', ''))
                : clientHeight > 0
                  ? clientHeight
                  : 300;

          setDimensions({
            width: clientWidth,
            height: calculatedHeight,
          });

          if (!isReady) {
            setIsReady(true);
          }
        }
      };

      // Initial measurement with a small delay to ensure DOM is ready
      const initialTimeout = setTimeout(() => {
        updateDimensions();
      }, 50);

      // Setup ResizeObserver for modern browsers
      let resizeObserver: ResizeObserver | null = null;
      if (containerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(entries => {
          // Use requestAnimationFrame to batch updates
          requestAnimationFrame(() => {
            updateDimensions();
          });
        });
        resizeObserver.observe(containerRef.current);
      }

      // Fallback for older browsers
      const handleResize = () => {
        requestAnimationFrame(() => {
          updateDimensions();
        });
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(initialTimeout);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        window.removeEventListener('resize', handleResize);
      };
    }, [height, isReady]);

    // Loading placeholder component
    const LoadingPlaceholder = () => (
      <div
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          color: '#64748b',
          fontSize: '14px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
                strokeDasharray='32'
                strokeDashoffset='32'
                style={{
                  animation: 'dash 1.5s ease-in-out infinite',
                  stroke: '#3b82f6',
                }}
              />
            </svg>
          </div>
          <div>{loadingText}</div>
        </div>
        <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dash {
          0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 90, 200; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90, 200; stroke-dashoffset: -124; }
        }
      `}</style>
      </div>
    );

    const containerStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      minHeight: typeof height === 'number' ? `${height}px` : height,
      position: 'relative',
      ...style,
    };

    return (
      <div ref={containerRef} className={className} style={containerStyle}>
        {loading ? (
          <LoadingPlaceholder />
        ) : isReady && dimensions.width > 0 ? (
          <ReactECharts
            ref={ref}
            option={option}
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }}
            opts={{
              ...opts,
              width: dimensions.width,
              height: dimensions.height,
            }}
            onChartReady={onChartReady}
            onEvents={onEvents}
          />
        ) : (
          <LoadingPlaceholder />
        )}
      </div>
    );
  }
);

EChartsWrapper.displayName = 'EChartsWrapper';

export default EChartsWrapper;
