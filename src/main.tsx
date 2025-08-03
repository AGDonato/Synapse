// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { DemandasProvider } from './contexts/DemandasContext.tsx';
import ErrorBoundary from './components/ui/ErrorBoundary.tsx';
import { router } from './router/routes';

// CSS Global
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DemandasProvider>
        <RouterProvider router={router} />
      </DemandasProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
