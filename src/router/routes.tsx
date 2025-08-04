import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { SuspenseWrapper } from './components';

// Lazy loading das páginas
const DemandasPage = lazy(() => import('../pages/DemandasPage'));
const NovaDemandaPage = lazy(() => import('../pages/NovaDemandaPage'));
const DetalheDemandaPage = lazy(() => import('../pages/DetalheDemandaPage'));
const DocumentosPage = lazy(() => import('../pages/DocumentosPage'));
const NovoDocumentoPage = lazy(() => import('../pages/NovoDocumentoPage'));
const CadastrosPage = lazy(() => import('../pages/CadastrosPage'));
const AssuntosCadastroPage = lazy(
  () => import('../pages/cadastros/AssuntosCadastroPage')
);
const OrgaosCadastroPage = lazy(
  () => import('../pages/cadastros/OrgaosCadastroPage')
);
const AutoridadesCadastroPage = lazy(
  () => import('../pages/cadastros/AutoridadesCadastroPage')
);
const TiposDocumentosCadastroPage = lazy(
  () => import('../pages/cadastros/TiposDocumentosCadastroPage')
);
const DistribuidoresCadastroPage = lazy(
  () => import('../pages/cadastros/DistribuidoresCadastroPage')
);
const ProvedoresCadastroPage = lazy(
  () => import('../pages/cadastros/ProvedoresCadastroPage')
);
const TiposDemandasCadastroPage = lazy(
  () => import('../pages/cadastros/TiposDemandasCadastroPage')
);
const TiposIdentificadoresCadastroPage = lazy(
  () => import('../pages/cadastros/TiposIdentificadoresCadastroPage')
);
const TiposMidiasCadastroPage = lazy(
  () => import('../pages/cadastros/TiposMidiasCadastroPage')
);
const RegrasPage = lazy(() => import('../pages/configuracoes/RegrasPage'));
const SistemaPage = lazy(() => import('../pages/configuracoes/SistemaPage'));
const RelatoriosPage = lazy(() => import('../pages/RelatoriosPage'));
const HomePage = lazy(() => import('../pages/HomePage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <DemandasPage />
          </SuspenseWrapper>
        ),
        handle: {
          title: 'Demandas',
          breadcrumb: 'Demandas',
        },
      },
      {
        path: 'home',
        element: (
          <SuspenseWrapper>
            <HomePage />
          </SuspenseWrapper>
        ),
        handle: {
          title: 'Início',
          breadcrumb: 'Início',
        },
      },
      {
        path: 'demandas',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <DemandasPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Demandas',
              breadcrumb: 'Demandas',
            },
          },
          {
            path: 'nova',
            element: (
              <SuspenseWrapper>
                <NovaDemandaPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Nova Demanda',
              breadcrumb: 'Nova Demanda',
            },
          },
          {
            path: ':demandaId',
            element: (
              <SuspenseWrapper>
                <DetalheDemandaPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Detalhes da Demanda',
              breadcrumb: 'Detalhes',
            },
          },
          {
            path: ':demandaId/editar',
            element: (
              <SuspenseWrapper>
                <NovaDemandaPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Editar Demanda',
              breadcrumb: 'Editar Demanda',
            },
          },
        ],
      },
      {
        path: 'documentos',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <DocumentosPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Documentos',
              breadcrumb: 'Documentos',
            },
          },
          {
            path: 'novo',
            element: (
              <SuspenseWrapper>
                <NovoDocumentoPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Novo Documento',
              breadcrumb: 'Novo Documento',
            },
          },
        ],
      },
      {
        path: 'cadastros',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <CadastrosPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Cadastros',
              breadcrumb: 'Cadastros',
            },
          },
          {
            path: 'assuntos',
            element: (
              <SuspenseWrapper>
                <AssuntosCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Assuntos',
              breadcrumb: 'Assuntos',
            },
          },
          {
            path: 'orgaos',
            element: (
              <SuspenseWrapper>
                <OrgaosCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Órgãos',
              breadcrumb: 'Órgãos',
            },
          },
          {
            path: 'autoridades',
            element: (
              <SuspenseWrapper>
                <AutoridadesCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Autoridades',
              breadcrumb: 'Autoridades',
            },
          },
          {
            path: 'tipos-documentos',
            element: (
              <SuspenseWrapper>
                <TiposDocumentosCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Tipos de Documentos',
              breadcrumb: 'Tipos de Documentos',
            },
          },
          {
            path: 'distribuidores',
            element: (
              <SuspenseWrapper>
                <DistribuidoresCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Distribuidores',
              breadcrumb: 'Distribuidores',
            },
          },
          {
            path: 'provedores',
            element: (
              <SuspenseWrapper>
                <ProvedoresCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Provedores',
              breadcrumb: 'Provedores',
            },
          },
          {
            path: 'tipos-demandas',
            element: (
              <SuspenseWrapper>
                <TiposDemandasCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Tipos de Demandas',
              breadcrumb: 'Tipos de Demandas',
            },
          },
          {
            path: 'tipos-identificadores',
            element: (
              <SuspenseWrapper>
                <TiposIdentificadoresCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Tipos de Identificadores',
              breadcrumb: 'Tipos de Identificadores',
            },
          },
          {
            path: 'tipos-midias',
            element: (
              <SuspenseWrapper>
                <TiposMidiasCadastroPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Gerenciar Tipos de Mídias',
              breadcrumb: 'Tipos de Mídias',
            },
          },
        ],
      },
      {
        path: 'configuracoes',
        children: [
          {
            path: 'regras',
            element: (
              <SuspenseWrapper>
                <RegrasPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Regras',
              breadcrumb: 'Regras',
            },
          },
          {
            path: 'sistema',
            element: (
              <SuspenseWrapper>
                <SistemaPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Sistema',
              breadcrumb: 'Sistema',
            },
          },
        ],
      },
      {
        path: 'relatorios',
        element: (
          <SuspenseWrapper>
            <RelatoriosPage />
          </SuspenseWrapper>
        ),
        handle: {
          title: 'Relatórios',
          breadcrumb: 'Relatórios',
        },
      },
    ],
  },
]);
