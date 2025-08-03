import { lazy } from 'react';
import type { RouteGroup } from './types';

// Lazy loading otimizado por feature

// Demandas Feature
const DemandasPage = lazy(() => import('../pages/DemandasPage'));
const NovaDemandaPage = lazy(() => import('../pages/NovaDemandaPage'));
const DetalheDemandaPage = lazy(() => import('../pages/DetalheDemandaPage'));

// Documentos Feature  
const DocumentosPage = lazy(() => import('../pages/DocumentosPage'));
const NovoDocumentoPage = lazy(() => import('../pages/NovoDocumentoPage'));

// Cadastros Feature
const CadastrosPage = lazy(() => import('../pages/CadastrosPage'));
const AssuntosCadastroPage = lazy(() => import('../pages/cadastros/AssuntosCadastroPage'));
const OrgaosCadastroPage = lazy(() => import('../pages/cadastros/OrgaosCadastroPage'));
const AutoridadesCadastroPage = lazy(() => import('../pages/cadastros/AutoridadesCadastroPage'));
const TiposDocumentosCadastroPage = lazy(() => import('../pages/cadastros/TiposDocumentosCadastroPage'));
const DistribuidoresCadastroPage = lazy(() => import('../pages/cadastros/DistribuidoresCadastroPage'));
const ProvedoresCadastroPage = lazy(() => import('../pages/cadastros/ProvedoresCadastroPage'));
const TiposDemandasCadastroPage = lazy(() => import('../pages/cadastros/TiposDemandasCadastroPage'));
const TiposIdentificadoresCadastroPage = lazy(() => import('../pages/cadastros/TiposIdentificadoresCadastroPage'));
const TiposMidiasCadastroPage = lazy(() => import('../pages/cadastros/TiposMidiasCadastroPage'));

// Configurações Feature
const RegrasPage = lazy(() => import('../pages/configuracoes/RegrasPage'));
const SistemaPage = lazy(() => import('../pages/configuracoes/SistemaPage'));

// Relatórios Feature
const RelatoriosPage = lazy(() => import('../pages/RelatoriosPage'));

export const routeGroups: RouteGroup[] = [
  {
    prefix: '',
    routes: [
      {
        path: '/',
        component: DemandasPage,
        title: 'Demandas',
        meta: {
          description: 'Gerenciamento de demandas',
          breadcrumb: 'Demandas'
        }
      }
    ]
  },
  {
    prefix: '/demandas',
    routes: [
      {
        path: '',
        component: DemandasPage,
        title: 'Demandas',
        meta: {
          description: 'Gerenciamento de demandas',
          breadcrumb: 'Demandas'
        }
      },
      {
        path: 'nova',
        component: NovaDemandaPage,
        title: 'Nova Demanda',
        meta: {
          description: 'Criar nova demanda',
          breadcrumb: 'Nova Demanda'
        }
      },
      {
        path: ':demandaId',
        component: DetalheDemandaPage,
        title: 'Detalhes da Demanda',
        meta: {
          description: 'Visualizar detalhes da demanda',
          breadcrumb: 'Detalhes'
        }
      }
    ]
  },
  {
    prefix: '/documentos',
    routes: [
      {
        path: '',
        component: DocumentosPage,
        title: 'Documentos',
        meta: {
          description: 'Gerenciamento de documentos',
          breadcrumb: 'Documentos'
        }
      },
      {
        path: 'novo',
        component: NovoDocumentoPage,
        title: 'Novo Documento',
        meta: {
          description: 'Criar novo documento',
          breadcrumb: 'Novo Documento'
        }
      }
    ]
  },
  {
    prefix: '/cadastros',
    routes: [
      {
        path: '',
        component: CadastrosPage,
        title: 'Cadastros',
        meta: {
          description: 'Área de cadastros do sistema',
          breadcrumb: 'Cadastros'
        }
      },
      {
        path: 'assuntos',
        component: AssuntosCadastroPage,
        title: 'Gerenciar Assuntos',
        meta: {
          description: 'Cadastro de assuntos',
          breadcrumb: 'Assuntos'
        }
      },
      {
        path: 'orgaos',
        component: OrgaosCadastroPage,
        title: 'Gerenciar Órgãos',
        meta: {
          description: 'Cadastro de órgãos',
          breadcrumb: 'Órgãos'
        }
      },
      {
        path: 'autoridades',
        component: AutoridadesCadastroPage,
        title: 'Gerenciar Autoridades',
        meta: {
          description: 'Cadastro de autoridades',
          breadcrumb: 'Autoridades'
        }
      },
      {
        path: 'tipos-documentos',
        component: TiposDocumentosCadastroPage,
        title: 'Gerenciar Tipos de Documentos',
        meta: {
          description: 'Cadastro de tipos de documentos',
          breadcrumb: 'Tipos de Documentos'
        }
      },
      {
        path: 'distribuidores',
        component: DistribuidoresCadastroPage,
        title: 'Gerenciar Distribuidores',
        meta: {
          description: 'Cadastro de distribuidores',
          breadcrumb: 'Distribuidores'
        }
      },
      {
        path: 'provedores',
        component: ProvedoresCadastroPage,
        title: 'Gerenciar Provedores',
        meta: {
          description: 'Cadastro de provedores',
          breadcrumb: 'Provedores'
        }
      },
      {
        path: 'tipos-demandas',
        component: TiposDemandasCadastroPage,
        title: 'Gerenciar Tipos de Demandas',
        meta: {
          description: 'Cadastro de tipos de demandas',
          breadcrumb: 'Tipos de Demandas'
        }
      },
      {
        path: 'tipos-identificadores',
        component: TiposIdentificadoresCadastroPage,
        title: 'Gerenciar Tipos de Identificadores',
        meta: {
          description: 'Cadastro de tipos de identificadores',
          breadcrumb: 'Tipos de Identificadores'
        }
      },
      {
        path: 'tipos-midias',
        component: TiposMidiasCadastroPage,
        title: 'Gerenciar Tipos de Mídias',
        meta: {
          description: 'Cadastro de tipos de mídias',
          breadcrumb: 'Tipos de Mídias'
        }
      }
    ]
  },
  {
    prefix: '/configuracoes',
    routes: [
      {
        path: 'regras',
        component: RegrasPage,
        title: 'Regras',
        meta: {
          description: 'Configuração de regras do sistema',
          breadcrumb: 'Regras'
        }
      },
      {
        path: 'sistema',
        component: SistemaPage,
        title: 'Sistema',
        meta: {
          description: 'Configurações do sistema',
          breadcrumb: 'Sistema'
        }
      }
    ]
  },
  {
    prefix: '/relatorios',
    routes: [
      {
        path: '',
        component: RelatoriosPage,
        title: 'Relatórios',
        meta: {
          description: 'Área de relatórios',
          breadcrumb: 'Relatórios'
        }
      }
    ]
  }
];