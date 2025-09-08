import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout';
import { SuspenseWrapper } from './components';
import { preloadCriticalRoutes } from './lazyRoutes';

// Importar todas as rotas lazy-loaded otimizadas
import {
  AnalyticsPage,
  AssuntosCadastroPage,
  AutoridadesCadastroPage,
  CadastrosPage,
  DemandasPage,
  DetalheDemandaPage,
  DetalheDocumentoPage,
  DistribuidoresCadastroPage,
  DocumentosPage,
  EChartsProExamples,
  HomePage,
  NovaDemandaPage,
  NovoDocumentoPage,
  OrgaosCadastroPage,
  ProvedoresCadastroPage,
  RegrasPage,
  RelatoriosPage,
  SistemaPage,
  TiposDemandasCadastroPage,
  TiposDocumentosCadastroPage,
  TiposIdentificadoresCadastroPage,
  TiposMidiasCadastroPage,
} from './lazyRoutes';

// Preload rotas críticas após inicialização
preloadCriticalRoutes();

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
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
          {
            path: ':documentoId',
            element: (
              <SuspenseWrapper>
                <DetalheDocumentoPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Detalhes do Documento',
              breadcrumb: 'Detalhes',
            },
          },
          {
            path: ':documentoId/editar',
            element: (
              <SuspenseWrapper>
                <NovoDocumentoPage />
              </SuspenseWrapper>
            ),
            handle: {
              title: 'Editar Documento',
              breadcrumb: 'Editar Documento',
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
      {
        path: 'graficos-profissional',
        element: (
          <SuspenseWrapper>
            <EChartsProExamples />
          </SuspenseWrapper>
        ),
        handle: {
          title: 'Dashboard Profissional ECharts',
          breadcrumb: 'ECharts Pro',
        },
      },
      {
        path: 'analytics',
        element: (
          <SuspenseWrapper>
            <AnalyticsPage />
          </SuspenseWrapper>
        ),
        handle: {
          title: 'Analytics & Monitoring',
          breadcrumb: 'Analytics',
        },
      },
    ],
  },
]);
