// src/router/lazyRoutes.tsx

import {
  ChartSkeleton,
  PageSkeleton,
  TableSkeleton,
  createLazyComponent,
} from '../../shared/components/ui/LazyLoader';

// Fallbacks específicos por tipo de página
const homeFallback = <ChartSkeleton />;
const tableFallback = <TableSkeleton />;
const formFallback = <PageSkeleton />;

// ===========================================
// LAZY LOADED PAGES - PRINCIPAIS
// ===========================================

// Home Dashboard - com charts pesados
export const HomePage = createLazyComponent(() => import('../../pages/dashboard/HomePage'), {
  fallback: homeFallback,
});

// Demandas - módulo principal
export const DemandasPage = createLazyComponent(() => import('../../pages/demandas/DemandasPage'), {
  fallback: tableFallback,
});

export const NovaDemandaPage = createLazyComponent(
  () => import('../../pages/demandas/NovaDemandaPage'),
  {
    fallback: formFallback,
  }
);

export const DetalheDemandaPage = createLazyComponent(
  () => import('../../pages/demandas/DetalheDemandaPage'),
  {
    fallback: formFallback,
  }
);

// Documentos - módulo secundário
export const DocumentosPage = createLazyComponent(
  () => import('../../pages/documentos/DocumentosPage'),
  {
    fallback: tableFallback,
  }
);

export const NovoDocumentoPage = createLazyComponent(
  () => import('../../pages/documentos/NovoDocumentoPage'),
  {
    fallback: formFallback,
  }
);

export const DetalheDocumentoPage = createLazyComponent(
  () => import('../../pages/documentos/DetalheDocumentoPage'),
  { fallback: formFallback }
);

// Relatórios - raramente usado
export const RelatoriosPage = createLazyComponent(
  () => import('../../pages/relatorios/RelatoriosPage'),
  {
    fallback: homeFallback,
  }
);

// ===========================================
// CADASTROS - LAZY LOADING AGRESSIVO
// ===========================================

export const CadastrosPage = createLazyComponent(
  () => import('../../pages/cadastros/CadastrosPage'),
  {
    fallback: formFallback,
  }
);

// Cadastros específicos - carregamento sob demanda
export const AssuntosCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/AssuntosCadastroPage'),
  { fallback: tableFallback }
);

export const AutoridadesCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/AutoridadesCadastroPage'),
  { fallback: tableFallback }
);

export const OrgaosCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/OrgaosCadastroPage'),
  { fallback: tableFallback }
);

export const ProvedoresCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/ProvedoresCadastroPage'),
  { fallback: tableFallback }
);

export const TiposDemandasCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/TiposDemandasCadastroPage'),
  { fallback: tableFallback }
);

export const TiposDocumentosCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/TiposDocumentosCadastroPage'),
  { fallback: tableFallback }
);

export const TiposMidiasCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/TiposMidiasCadastroPage'),
  { fallback: tableFallback }
);

export const TiposIdentificadoresCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/TiposIdentificadoresCadastroPage'),
  { fallback: tableFallback }
);

export const DistribuidoresCadastroPage = createLazyComponent(
  () => import('../../pages/cadastros/DistribuidoresCadastroPage'),
  { fallback: tableFallback }
);

// ===========================================
// CONFIGURAÇÕES - ADMIN APENAS
// ===========================================

export const RegrasPage = createLazyComponent(
  () => import('../../pages/configuracoes/RegrasPage'),
  {
    fallback: tableFallback,
  }
);

export const SistemaPage = createLazyComponent(
  () => import('../../pages/configuracoes/SistemaPage'),
  {
    fallback: formFallback,
  }
);

// ECharts Pro Examples - usado raramente
export const EChartsProExamples = createLazyComponent(
  () => import('../../shared/components/charts/EChartsProExamples'),
  { fallback: homeFallback }
);

// Analytics & Monitoring Page
export const AnalyticsPage = createLazyComponent(
  () => import('../../pages/relatorios/AnalyticsPage'),
  {
    fallback: formFallback,
  }
);

// ===========================================
// COMPONENTES PESADOS - LAZY LOADING
// ===========================================

// Charts pesados do dashboard
export const LazyChartComponents = {
  AverageResponseTimeChart: createLazyComponent(
    () => import('../../shared/components/charts/AverageResponseTimeChart'),
    { fallback: <ChartSkeleton /> }
  ),

  ProviderRanking: createLazyComponent(
    () => import('../../shared/components/charts/ProviderRanking'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  ProviderStatsSummary: createLazyComponent(
    () => import('../../shared/components/charts/ProviderStatsSummary'),
    { fallback: <ChartSkeleton /> }
  ),

  ResponseRateChart: createLazyComponent(
    () => import('../../shared/components/charts/ResponseRateChart'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  ResponseTimeBoxplot: createLazyComponent(
    () => import('../../shared/components/charts/ResponseTimeBoxplot'),
    { fallback: <ChartSkeleton /> }
  ),

  OpenDemandsChart: createLazyComponent(
    () => import('../../shared/components/charts/OpenDemandsChart'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  DemandsYearlyChart: createLazyComponent(
    () => import('../../shared/components/charts/DemandsYearlyChart'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  DemandTypesChart: createLazyComponent(
    () => import('../../shared/components/charts/DemandTypesChart'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  StatusByYearChart: createLazyComponent(
    () => import('../../shared/components/charts/StatusByYearChart'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  MediaTypesChart: createLazyComponent(
    () => import('../../shared/components/charts/MediaTypesChart'),
    {
      fallback: <ChartSkeleton />,
    }
  ),

  JudicialOrgansTreemap: createLazyComponent(
    () => import('../../shared/components/charts/JudicialOrgansTreemap'),
    { fallback: <ChartSkeleton /> }
  ),

  SolicitantesOrgansChart: createLazyComponent(
    () => import('../../shared/components/charts/SolicitantesOrgansChart'),
    { fallback: <ChartSkeleton /> }
  ),
};

// Modais pesados
export const LazyModalComponents = {
  DemandUpdateModal: createLazyComponent(
    () => import('../../shared/components/demands/modals/DemandUpdateModal'),
    { fallback: <div>Carregando modal...</div> }
  ),

  DocumentUpdateModal: createLazyComponent(
    () => import('../../shared/components/documents/modals/DocumentUpdateModal'),
    { fallback: <div>Carregando modal...</div> }
  ),
};

// Utilitário para preload de rotas críticas
export const preloadCriticalRoutes = () => {
  // Preload apenas rotas mais usadas
  const criticalRoutes = [
    () => import('../../pages/demandas/DemandasPage'),
    () => import('../../pages/documentos/DocumentosPage'),
  ];

  // Preload com delay para não interferir na carga inicial
  setTimeout(() => {
    criticalRoutes.forEach(route => route().catch(() => {}));
  }, 2000);
};

// Utilitário para preload baseado em user intent
export const preloadOnHover = (route: () => Promise<unknown>) => {
  let isPreloaded = false;

  return {
    onMouseEnter: () => {
      if (!isPreloaded) {
        isPreloaded = true;
        route().catch(() => {});
      }
    },
  };
};
