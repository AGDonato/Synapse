// src/components/ui/LazyLoader.tsx

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

const DefaultFallback: React.FC = () => (
  <div className='flex items-center justify-center min-h-[200px]'>
    <div className='flex items-center space-x-3'>
      <div className='animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent'></div>
      <span className='text-gray-600'>Carregando...</span>
    </div>
  </div>
);

const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <div className='flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 rounded-lg'>
    <div className='text-red-600 mb-4'>
      <svg className='w-12 h-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
        />
      </svg>
    </div>
    <h3 className='text-lg font-semibold text-red-800 mb-2'>Erro ao carregar componente</h3>
    <p className='text-sm text-red-600 mb-4 text-center'>
      {error.message || 'Ocorreu um erro inesperado'}
    </p>
    <button
      onClick={resetErrorBoundary}
      className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
    >
      Tentar novamente
    </button>
  </div>
);

export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  fallback = <DefaultFallback />,
  errorFallback = DefaultErrorFallback,
}) => (
  <ErrorBoundary
    FallbackComponent={errorFallback}
    onError={(error, errorInfo) => {
      // Em produção, reportar erro para serviço de monitoramento
      logger.error('LazyLoader Error:', error, errorInfo);
    }}
  >
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

// Hook para criar componentes lazy com retry automático
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  options?: {
    fallback?: React.ReactNode;
    retries?: number;
    retryDelay?: number;
  }
) => {
  const { retries = 3, retryDelay = 1000 } = options || {};

  const LazyComponent = React.lazy(async () => {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  });

  const WrappedComponent: React.FC<unknown> = props => (
    <LazyLoader fallback={options?.fallback}>
      <LazyComponent {...props} />
    </LazyLoader>
  );

  WrappedComponent.displayName = `LazyComponent(Component)`;

  return WrappedComponent;
};

// Loading skeletons específicos
export const PageSkeleton: React.FC = () => (
  <div className='animate-pulse'>
    <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>
    <div className='space-y-3'>
      <div className='h-4 bg-gray-200 rounded'></div>
      <div className='h-4 bg-gray-200 rounded w-5/6'></div>
      <div className='h-4 bg-gray-200 rounded w-3/4'></div>
    </div>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6'>
      {[...Array(6)].map((_, i) => (
        <div key={i} className='h-32 bg-gray-200 rounded'></div>
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className='animate-pulse'>
    <div className='h-10 bg-gray-200 rounded mb-4'></div>
    <div className='space-y-2'>
      {[...Array(8)].map((_, i) => (
        <div key={i} className='h-12 bg-gray-200 rounded'></div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className='animate-pulse'>
    <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
    <div className='h-64 bg-gray-200 rounded'></div>
  </div>
);
