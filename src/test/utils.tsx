// src/test/utils.tsx

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DemandasProvider } from '../contexts/DemandasContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Custom render function that includes common providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <DemandasProvider>
          {children}
        </DemandasProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Helper function to create mock service responses
export const createMockServiceResponse = <T,>(data: T, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Mock error',
});

export const createMockListResponse = <T,>(data: T[], success = true) => ({
  success,
  data: success ? data : undefined,
  total: success ? data.length : undefined,
  error: success ? undefined : 'Mock error',
});

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));