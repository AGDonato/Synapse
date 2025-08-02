// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DemandasProvider } from './contexts/DemandasContext';

// Importação do Layout Principal e CSS Global
import App from './App.tsx';
import './index.css';

// Importação das Páginas Principais
import HomePage from './pages/HomePage.tsx';
import DemandasPage from './pages/DemandasPage.tsx';
import NovaDemandaPage from './pages/NovaDemandaPage.tsx';
import DetalheDemandaPage from './pages/DetalheDemandaPage.tsx';
import DocumentosPage from './pages/DocumentosPage.tsx';
import NovoDocumentoPage from './pages/NovoDocumentoPage.tsx';
import CadastrosPage from './pages/CadastrosPage.tsx';
import RelatoriosPage from './pages/RelatoriosPage.tsx';

// Importação das Páginas de Cadastro Específicas
import AssuntosCadastroPage from './pages/cadastros/AssuntosCadastroPage.tsx';
import OrgaosCadastroPage from './pages/cadastros/OrgaosCadastroPage.tsx';
import AutoridadesCadastroPage from './pages/cadastros/AutoridadesCadastroPage.tsx';
import TiposDocumentosCadastroPage from './pages/cadastros/TiposDocumentosCadastroPage.tsx';
import DistribuidoresCadastroPage from './pages/cadastros/DistribuidoresCadastroPage.tsx';
import ProvedoresCadastroPage from './pages/cadastros/ProvedoresCadastroPage.tsx';
import TiposDemandasCadastroPage from './pages/cadastros/TiposDemandasCadastroPage.tsx';
import TiposIdentificadoresCadastroPage from './pages/cadastros/TiposIdentificadoresCadastroPage.tsx';
import TiposMidiasCadastroPage from './pages/cadastros/TiposMidiasCadastroPage.tsx';

// Importação das Páginas de Configurações
import RegrasPage from './pages/configuracoes/RegrasPage.tsx';
import SistemaPage from './pages/configuracoes/SistemaPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      
      { path: 'demandas', element: <DemandasPage /> },
      { path: 'demandas/nova', element: <NovaDemandaPage /> },
      { path: 'demandas/:demandaId', element: <DetalheDemandaPage /> },
      
      { path: 'documentos', element: <DocumentosPage /> },
      { path: 'documentos/novo', element: <NovoDocumentoPage /> },
      
      { path: 'cadastros', element: <CadastrosPage /> },
      { path: 'cadastros/assuntos', element: <AssuntosCadastroPage /> },
      { path: 'cadastros/orgaos', element: <OrgaosCadastroPage /> },
      { path: 'cadastros/autoridades', element: <AutoridadesCadastroPage /> },
      { path: 'cadastros/tipos-documentos', element: <TiposDocumentosCadastroPage /> },
      { path: 'cadastros/distribuidores', element: <DistribuidoresCadastroPage /> },
      { path: 'cadastros/provedores', element: <ProvedoresCadastroPage /> },
      { path: 'cadastros/tipos-demandas', element: <TiposDemandasCadastroPage /> },
      { path: 'cadastros/tipos-identificadores', element: <TiposIdentificadoresCadastroPage /> },
      { path: 'cadastros/tipos-midias', element: <TiposMidiasCadastroPage /> },

      { path: 'configuracoes/regras', element: <RegrasPage /> },
      { path: 'configuracoes/sistema', element: <SistemaPage /> },
      
      { path: 'relatorios', element: <RelatoriosPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemandasProvider>
      <RouterProvider router={router} />
    </DemandasProvider>
  </React.StrictMode>
);