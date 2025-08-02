// src/main.tsx

import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DemandasProvider } from './contexts/DemandasContext.tsx';
import ErrorBoundary from './components/ui/ErrorBoundary.tsx';
import Loading from './components/ui/Loading.tsx';

// Importação do Layout Principal e CSS Global
import App from './App.tsx';
import './index.css';

// Lazy loading das páginas principais
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const DemandasPage = lazy(() => import('./pages/DemandasPage.tsx'));
const NovaDemandaPage = lazy(() => import('./pages/NovaDemandaPage.tsx'));
const DetalheDemandaPage = lazy(() => import('./pages/DetalheDemandaPage.tsx'));
const DocumentosPage = lazy(() => import('./pages/DocumentosPage.tsx'));
const NovoDocumentoPage = lazy(() => import('./pages/NovoDocumentoPage.tsx'));
const CadastrosPage = lazy(() => import('./pages/CadastrosPage.tsx'));
const RelatoriosPage = lazy(() => import('./pages/RelatoriosPage.tsx'));

// Lazy loading das páginas de cadastro específicas
const AssuntosCadastroPage = lazy(() => import('./pages/cadastros/AssuntosCadastroPage.tsx'));
const OrgaosCadastroPage = lazy(() => import('./pages/cadastros/OrgaosCadastroPage.tsx'));
const AutoridadesCadastroPage = lazy(() => import('./pages/cadastros/AutoridadesCadastroPage.tsx'));
const TiposDocumentosCadastroPage = lazy(() => import('./pages/cadastros/TiposDocumentosCadastroPage.tsx'));
const DistribuidoresCadastroPage = lazy(() => import('./pages/cadastros/DistribuidoresCadastroPage.tsx'));
const ProvedoresCadastroPage = lazy(() => import('./pages/cadastros/ProvedoresCadastroPage.tsx'));
const TiposDemandasCadastroPage = lazy(() => import('./pages/cadastros/TiposDemandasCadastroPage.tsx'));
const TiposIdentificadoresCadastroPage = lazy(() => import('./pages/cadastros/TiposIdentificadoresCadastroPage.tsx'));
const TiposMidiasCadastroPage = lazy(() => import('./pages/cadastros/TiposMidiasCadastroPage.tsx'));

// Lazy loading das páginas de configurações
const RegrasPage = lazy(() => import('./pages/configuracoes/RegrasPage.tsx'));
const SistemaPage = lazy(() => import('./pages/configuracoes/SistemaPage.tsx'));

// Componente wrapper para páginas com Suspense
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <PageWrapper><HomePage /></PageWrapper> },

      { path: 'demandas', element: <PageWrapper><DemandasPage /></PageWrapper> },
      { path: 'demandas/nova', element: <PageWrapper><NovaDemandaPage /></PageWrapper> },
      { path: 'demandas/:demandaId', element: <PageWrapper><DetalheDemandaPage /></PageWrapper> },

      { path: 'documentos', element: <PageWrapper><DocumentosPage /></PageWrapper> },
      { path: 'documentos/novo', element: <PageWrapper><NovoDocumentoPage /></PageWrapper> },

      { path: 'cadastros', element: <PageWrapper><CadastrosPage /></PageWrapper> },
      { path: 'cadastros/assuntos', element: <PageWrapper><AssuntosCadastroPage /></PageWrapper> },
      { path: 'cadastros/orgaos', element: <PageWrapper><OrgaosCadastroPage /></PageWrapper> },
      { path: 'cadastros/autoridades', element: <PageWrapper><AutoridadesCadastroPage /></PageWrapper> },
      {
        path: 'cadastros/tipos-documentos',
        element: <PageWrapper><TiposDocumentosCadastroPage /></PageWrapper>,
      },
      {
        path: 'cadastros/distribuidores',
        element: <PageWrapper><DistribuidoresCadastroPage /></PageWrapper>,
      },
      { path: 'cadastros/provedores', element: <PageWrapper><ProvedoresCadastroPage /></PageWrapper> },
      {
        path: 'cadastros/tipos-demandas',
        element: <PageWrapper><TiposDemandasCadastroPage /></PageWrapper>,
      },
      {
        path: 'cadastros/tipos-identificadores',
        element: <PageWrapper><TiposIdentificadoresCadastroPage /></PageWrapper>,
      },
      { path: 'cadastros/tipos-midias', element: <PageWrapper><TiposMidiasCadastroPage /></PageWrapper> },

      { path: 'configuracoes/regras', element: <PageWrapper><RegrasPage /></PageWrapper> },
      { path: 'configuracoes/sistema', element: <PageWrapper><SistemaPage /></PageWrapper> },

      { path: 'relatorios', element: <PageWrapper><RelatoriosPage /></PageWrapper> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DemandasProvider>
        <RouterProvider router={router} />
      </DemandasProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
