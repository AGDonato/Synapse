/**
 * UTILITÁRIOS PARA TESTES DE COMPONENTES REACT
 *
 * Este módulo fornece ferramentas para testar componentes React de forma isolada.
 * Inclui funcionalidades para:
 * - TestWrapper com todos os providers necessários (Router, Query)
 * - QueryClient configurado especificamente para testes
 * - Função customRender que aplica o wrapper automaticamente
 * - Re-exportação de todas as utilities do React Testing Library
 * - Configuração otimizada para execução rápida de testes
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Cria um QueryClient configurado para testes
 * Desabilita retry para acelerar execução e evitar side effects
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Wrapper que fornece todos os providers necessários para testes
 * Envolve componentes com QueryClient e Router para simular o ambiente real
 * @param children - Componentes React a serem testados
 */
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Função de renderização customizada que aplica o TestWrapper automaticamente
 * Usa o TestWrapper por padrão, mas permite override de opções
 * @param ui - Elemento React para renderizar
 * @param options - Opções adicionais para o render
 */
export const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: TestWrapper, ...options });

// Re-exporta todas as utilities do React Testing Library
export * from '@testing-library/react';

// Substitui a função render padrão pela versão customizada
export { customRender as render };
