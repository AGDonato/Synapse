// src/router/lazyRoutes.tsx

import {
  ChartSkeleton,
  PageSkeleton,
  TableSkeleton,
  createLazyComponent,
} from '../components/ui/LazyLoader';

// Fallbacks específicos por tipo de página
const homeFallback = <ChartSkeleton />;
const tableFallback = <TableSkeleton />;
const formFallback = <PageSkeleton />;

// ===========================================
// LAZY LOADED PAGES - PRINCIPAIS
// ===========================================

// Home Dashboard - com charts pesados
export const HomePage = createLazyComponent(() => import('../pages/HomePage'), {
  fallback: homeFallback,
});

// Demandas - módulo principal
export const DemandasPage = createLazyComponent(() => import('../pages/DemandasPage'), {
  fallback: tableFallback,
});

export const NovaDemandaPage = createLazyComponent(() => import('../pages/NovaDemandaPage'), {
  fallback: formFallback,
});

export const DetalheDemandaPage = createLazyComponent(() => import('../pages/DetalheDemandaPage'), {
  fallback: formFallback,
});

// Documentos - módulo secundário
export const DocumentosPage = createLazyComponent(() => import('../pages/DocumentosPage'), {
  fallback: tableFallback,
});

export const NovoDocumentoPage = createLazyComponent(() => import('../pages/NovoDocumentoPage'), {
  fallback: formFallback,
});

export const DetalheDocumentoPage = createLazyComponent(
  () => import('../pages/DetalheDocumentoPage'),
  { fallback: formFallback }
);

// Relatórios - raramente usado
export const RelatoriosPage = createLazyComponent(() => import('../pages/RelatoriosPage'), {
  fallback: homeFallback,
});

// ===========================================
// CADASTROS - LAZY LOADING AGRESSIVO
// ===========================================

export const CadastrosPage = createLazyComponent(() => import('../pages/CadastrosPage'), {
  fallback: formFallback,
});

// Cadastros específicos - carregamento sob demanda
export const AssuntosCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/AssuntosCadastroPage'),
  { fallback: tableFallback }
);

export const AutoridadesCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/AutoridadesCadastroPage'),
  { fallback: tableFallback }
);

export const OrgaosCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/OrgaosCadastroPage'),
  { fallback: tableFallback }
);

export const ProvedoresCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/ProvedoresCadastroPage'),
  { fallback: tableFallback }
);

export const TiposDemandasCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/TiposDemandasCadastroPage'),
  { fallback: tableFallback }
);

export const TiposDocumentosCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/TiposDocumentosCadastroPage'),
  { fallback: tableFallback }
);

export const TiposMidiasCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/TiposMidiasCadastroPage'),
  { fallback: tableFallback }
);

export const TiposIdentificadoresCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/TiposIdentificadoresCadastroPage'),
  { fallback: tableFallback }
);

export const DistribuidoresCadastroPage = createLazyComponent(
  () => import('../pages/cadastros/DistribuidoresCadastroPage'),
  { fallback: tableFallback }
);

// ===========================================
// CONFIGURAÇÕES - ADMIN APENAS
// ===========================================

export const RegrasPage = createLazyComponent(() => import('../pages/configuracoes/RegrasPage'), {
  fallback: tableFallback,
});

export const SistemaPage = createLazyComponent(() => import('../pages/configuracoes/SistemaPage'), {
  fallback: formFallback,
});

// ECharts Pro Examples - usado raramente
export const EChartsProExamples = createLazyComponent(
  () => import('../components/charts/EChartsProExamples'),
  { fallback: homeFallback }
);

// Analytics & Monitoring Page
export const AnalyticsPage = createLazyComponent(() => import('../pages/AnalyticsPage'), {
  fallback: formFallback,
});

// ===========================================
// COMPONENTES PESADOS - LAZY LOADING
// ===========================================

// Charts pesados do dashboard
export const LazyChartComponents = {
  AverageResponseTimeChart: createLazyComponent(
    () => import('../components/charts/AverageResponseTimeChart'),
    { fallback: <ChartSkeleton /> }
  ),

  ProviderRanking: createLazyComponent(() => import('../components/charts/ProviderRanking'), {
    fallback: <ChartSkeleton />,
  }),

  ProviderStatsSummary: createLazyComponent(
    () => import('../components/charts/ProviderStatsSummary'),
    { fallback: <ChartSkeleton /> }
  ),

  ResponseRateChart: createLazyComponent(() => import('../components/charts/ResponseRateChart'), {
    fallback: <ChartSkeleton />,
  }),

  ResponseTimeBoxplot: createLazyComponent(
    () => import('../components/charts/ResponseTimeBoxplot'),
    { fallback: <ChartSkeleton /> }
  ),

  OpenDemandsChart: createLazyComponent(() => import('../components/charts/OpenDemandsChart'), {
    fallback: <ChartSkeleton />,
  }),

  DemandsYearlyChart: createLazyComponent(() => import('../components/charts/DemandsYearlyChart'), {
    fallback: <ChartSkeleton />,
  }),

  DemandTypesChart: createLazyComponent(() => import('../components/charts/DemandTypesChart'), {
    fallback: <ChartSkeleton />,
  }),

  StatusByYearChart: createLazyComponent(() => import('../components/charts/StatusByYearChart'), {
    fallback: <ChartSkeleton />,
  }),

  MediaTypesChart: createLazyComponent(() => import('../components/charts/MediaTypesChart'), {
    fallback: <ChartSkeleton />,
  }),

  JudicialOrgansTreemap: createLazyComponent(
    () => import('../components/charts/JudicialOrgansTreemap'),
    { fallback: <ChartSkeleton /> }
  ),

  SolicitantesOrgansChart: createLazyComponent(
    () => import('../components/charts/SolicitantesOrgansChart'),
    { fallback: <ChartSkeleton /> }
  ),
};

// Modais pesados
export const LazyModalComponents = {
  DemandUpdateModal: createLazyComponent(
    () => import('../components/demands/modals/DemandUpdateModal'),
    { fallback: <div>Carregando modal...</div> }
  ),

  DocumentUpdateModal: createLazyComponent(
    () => import('../components/documents/modals/DocumentUpdateModal'),
    { fallback: <div>Carregando modal...</div> }
  ),
};

// Utilitário para preload de rotas críticas
export const preloadCriticalRoutes = () => {
  // Preload apenas rotas mais usadas
  const criticalRoutes = [
    () => import('../pages/DemandasPage'),
    () => import('../pages/DocumentosPage'),
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
