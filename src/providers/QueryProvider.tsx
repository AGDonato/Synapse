import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

// Configuração avançada do Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 1000 * 60 * 5,
      // Manter em cache por 10 minutos
      gcTime: 1000 * 60 * 10, // Nova API do React Query v5
      // Retry automático 3 vezes
      retry: 3,
      // Refetch ao ganhar foco
      refetchOnWindowFocus: true,
      // Refetch ao reconectar
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutações 1 vez
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position={'bottom-right' as any} // Type assertion for compatibility
        />
      )}
    </QueryClientProvider>
  );
};

export { queryClient };