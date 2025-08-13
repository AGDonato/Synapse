// src/test/utils.tsx

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DemandasProvider } from '../contexts/DemandasContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Custom render function that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
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

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };