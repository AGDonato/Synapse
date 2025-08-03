import { useLocation, useMatches } from 'react-router-dom';
import { useMemo } from 'react';

interface Breadcrumb {
  title: string;
  path: string;
  meta?: Record<string, unknown>;
}

interface CurrentRoute {
  pathname: string;
  title: string;
  meta: Record<string, unknown>;
}

// Hook para obter informações da rota atual
export function useCurrentRoute(): CurrentRoute {
  const matches = useMatches();
  const location = useLocation();
  
  return useMemo(() => {
    // Pega o último match que tem handle (informações da rota)
    const currentMatch = matches.reverse().find(match => match.handle);
    
    const handle = currentMatch?.handle as { title?: string; meta?: Record<string, unknown> } | undefined;
    
    return {
      pathname: location.pathname,
      title: handle?.title || 'Synapse',
      meta: handle?.meta || {}
    };
  }, [matches, location.pathname]);
}

// Hook para breadcrumbs
export function useBreadcrumbs(): Breadcrumb[] {
  const matches = useMatches();
  
  return useMemo(() => {
    const breadcrumbs: Breadcrumb[] = [];
    
    matches.forEach(match => {
      const handle = match.handle as { title?: string; breadcrumb?: string; meta?: Record<string, unknown> } | undefined;
      
      if (handle?.title) {
        breadcrumbs.push({
          title: handle.breadcrumb || handle.title,
          path: match.pathname,
          meta: handle.meta
        });
      }
    });
    
    return breadcrumbs;
  }, [matches]);
}