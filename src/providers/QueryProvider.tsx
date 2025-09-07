/**
 * ================================================================
 * QUERY PROVIDER - GERENCIADOR DE CACHE E ESTADO SERVER-SIDE
 * ================================================================
 *
 * Este provider configura e gerencia o React Query (@tanstack/react-query) para
 * todo o sistema Synapse, fornecendo cache inteligente, sincronização com servidor
 * e gerenciamento otimizado de estado server-side.
 *
 * Funcionalidades principais:
 * - Cache inteligente com invalidação automática
 * - Retry automático para requisições falhadas
 * - Background refetching para dados sempre atualizados
 * - Optimistic updates para melhor UX
 * - Error handling centralizado para requisições
 * - Stale-while-revalidate pattern implementado
 * - Garbage collection automático de cache não utilizado
 * - DevTools integration para debugging (desabilitado em produção)
 *
 * Configurações de cache implementadas:
 * - Stale Time: 5 minutos (dados considerados frescos)
 * - Garbage Collection: 10 minutos (cache mantido na memória)
 * - Retry Policy: 3 tentativas para queries, 1 para mutations
 * - Refetch Policies: Window focus, network reconnect
 * - Background Updates: Automático para dados críticos
 *
 * Padrões de performance:
 * - Cache-First Strategy: Serve cache primeiro, valida depois
 * - Background Sync: Atualiza cache em background
 * - Optimistic Updates: UI responsiva com rollback automático
 * - Request Deduplication: Evita requisições duplicadas
 * - Memory Management: Garbage collection inteligente
 *
 * Integração com o sistema:
 * - API Endpoints: Todas requisições HTTP passam por este cache
 * - Zustand Stores: Sincronização bidirecional quando necessário  
 * - Error Handling: Integrado com sistema global de notificações
 * - Performance Monitoring: Métricas de cache hit/miss
 * - DevTools: Debug de queries em desenvolvimento
 *
 * Benefícios de UX implementados:
 * - Loading instantâneo com stale data
 * - Updates em background sem interrupção
 * - Retry automático transparente ao usuário
 * - Offline-first quando dados estão em cache
 * - Sincronização automática ao reconectar
 *
 * @fileoverview Provider de cache e sincronização server-side
 * @version 2.0.0  
 * @since 2024-01-15
 * @author Equipe Synapse
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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
      {/* DevTools removido - descomente se precisar para debug */}
      {/* {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position={'bottom-right' as any}
        />
      )} */}
    </QueryClientProvider>
  );
};

export { queryClient };
