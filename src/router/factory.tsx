import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import type { RouteGroup, RouteConfig, AppRoute } from './types';
import Loading from '../components/ui/Loading';

// Converte RouteConfig para RouteObject do React Router
function convertRouteConfig(config: RouteConfig, basePath = ''): AppRoute {
  // Corrigir concatenação de paths
  let fullPath;
  if (basePath === '') {
    fullPath = config.path;
  } else if (config.path === '') {
    fullPath = basePath;
  } else {
    fullPath = basePath + '/' + config.path;
  }

  const Component = config.component;

  return {
    path: fullPath === '' || fullPath === '/' ? undefined : fullPath,
    index: fullPath === '' || fullPath === '/',
    element: (
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    ),
    handle: {
      title: config.title,
      meta: config.meta,
      breadcrumb: config.meta?.breadcrumb || config.title,
    },
    children: config.children?.map((child) =>
      convertRouteConfig(child, fullPath)
    ),
  };
}

// Converte RouteGroup para RouteObject
function convertRouteGroup(group: RouteGroup): AppRoute[] {
  return group.routes.map((route) => convertRouteConfig(route, group.prefix));
}

// Factory para criar o router a partir da configuração
export function createAppRouter(
  routeGroups: RouteGroup[],
  RootLayout: React.ComponentType
): ReturnType<typeof createBrowserRouter> {
  // Converte todos os grupos de rotas
  const allRoutes = routeGroups.flatMap(convertRouteGroup);

  // Estrutura principal do router
  const routerConfig = [
    {
      path: '/',
      element: <RootLayout />,
      children: allRoutes,
    },
  ];

  return createBrowserRouter(
    routerConfig as Parameters<typeof createBrowserRouter>[0]
  );
}

// Utility para extrair todas as rotas em formato flat (útil para sidebar, breadcrumbs, etc.)
export function extractFlatRoutes(routeGroups: RouteGroup[]): Array<{
  path: string;
  title: string;
  meta?: RouteConfig['meta'];
  fullPath: string;
}> {
  const flatRoutes: Array<{
    path: string;
    title: string;
    meta?: RouteConfig['meta'];
    fullPath: string;
  }> = [];

  function extractFromGroup(group: RouteGroup) {
    function extractFromRoute(route: RouteConfig, basePath = '') {
      const fullPath = basePath + group.prefix + route.path;

      flatRoutes.push({
        path: route.path,
        title: route.title,
        meta: route.meta,
        fullPath: fullPath === '' ? '/' : fullPath,
      });

      route.children?.forEach((child) => extractFromRoute(child, fullPath));
    }

    group.routes.forEach((route) => extractFromRoute(route));
  }

  routeGroups.forEach(extractFromGroup);
  return flatRoutes;
}

// Utility para encontrar uma rota específica
export function findRoute(
  routeGroups: RouteGroup[],
  path: string
): { route: RouteConfig; group: RouteGroup } | null {
  for (const group of routeGroups) {
    for (const route of group.routes) {
      const fullPath = group.prefix + route.path;
      if (fullPath === path || (fullPath === '' && path === '/')) {
        return { route, group };
      }

      // Buscar em rotas filhas
      function searchChildren(
        config: RouteConfig,
        basePath: string
      ): RouteConfig | null {
        if (config.children) {
          for (const child of config.children) {
            const childPath = basePath + child.path;
            if (childPath === path) return child;

            const found = searchChildren(child, childPath);
            if (found) return found;
          }
        }
        return null;
      }

      const found = searchChildren(route, fullPath);
      if (found) return { route: found, group };
    }
  }
  return null;
}
