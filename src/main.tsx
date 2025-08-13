import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { DemandasProvider } from './contexts/DemandasContext.tsx';
import { DocumentosProvider } from './contexts/DocumentosContext.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemandasProvider>
      <DocumentosProvider>
        <RouterProvider router={router} />
      </DocumentosProvider>
    </DemandasProvider>
  </React.StrictMode>
);
