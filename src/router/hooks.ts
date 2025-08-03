import { useLocation, useMatches } from 'react-router-dom';
import { useMemo } from 'react';
import { routeGroups } from './config';
import { findRoute, extractFlatRoutes } from './factory';
import type { AppRouteHandle } from './types';

// Hook para obter informações da rota atual
export function useCurrentRoute() {
  const location = useLocation();
  
  return useMemo(() => {
    const routeInfo = findRoute(routeGroups, location.pathname);
    
    return {
      pathname: location.pathname,
      route: routeInfo?.route || null,
      group: routeInfo?.group || null,
      title: routeInfo?.route?.title || 'Página não encontrada',
      meta: routeInfo?.route?.meta || {}
    };
  }, [location.pathname]);
}

// Hook para breadcrumbs
export function useBreadcrumbs() {
  const matches = useMatches();
  const location = useLocation();
  
  return useMemo(() => {
    const breadcrumbs = matches
      .filter(match => {
        const handle = match.handle as AppRouteHandle | undefined;
        return handle?.breadcrumb;
      })
      .map(match => {
        const handle = match.handle as AppRouteHandle;
        return {
          title: handle.breadcrumb || handle.title,
          path: match.pathname,
          meta: handle.meta
        };
      });
    
    return breadcrumbs;
  }, [matches, location.pathname]);
}

// Hook para navegação programática com type safety
export function useAppNavigation() {
  const flatRoutes = useMemo(() => extractFlatRoutes(routeGroups), []);
  
  const getRouteByTitle = (title: string) => {
    return flatRoutes.find(route => route.title === title);
  };
  
  const getRoutesByGroup = (groupPrefix: string) => {
    return flatRoutes.filter(route => route.fullPath.startsWith(groupPrefix));
  };
  
  return {
    routes: flatRoutes,
    getRouteByTitle,
    getRoutesByGroup
  };
}

// Hook para sidebar/menu items
export function useMenuItems() {
  return useMemo(() => {
    const items = extractFlatRoutes(routeGroups)
      .filter(route => !route.meta?.hideInSidebar)
      .map(route => ({
        title: route.title,
        path: route.fullPath,
        icon: route.meta?.icon,
        description: route.meta?.description
      }));
    
    // Agrupar por seção para sidebar hierárquica
    const grouped = items.reduce((acc, item) => {
      const pathParts = item.path.split('/').filter(Boolean);
      const section = pathParts[0] || 'main';
      
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      
      return acc;
    }, {} as Record<string, typeof items>);
    
    return { flat: items, grouped };
  }, []);
}