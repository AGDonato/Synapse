// src/constants/routes.ts
// DEPRECATED: Use the new router system in src/router/
// This file is kept for backward compatibility only

import { extractFlatRoutes } from '../router/factory';
import { routeGroups } from '../router/config';

// Extract routes from the new system for backward compatibility
const flatRoutes = extractFlatRoutes(routeGroups);

// Generate ROUTES object dynamically from the new router config
export const ROUTES = flatRoutes.reduce((acc, route) => {
  // Convert path to constant name (e.g., "/demandas/nova" -> "DEMANDAS_NEW")
  const constantName = route.fullPath
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .toUpperCase() || 'HOME';
  
  acc[constantName] = route.fullPath;
  return acc;
}, {} as Record<string, string>);

// Helper function for dynamic routes (like /demandas/:id)
export const DYNAMIC_ROUTES = {
  DEMANDAS_DETAIL: (id: string | number) => `/demandas/${id}`,
} as const;

// Generate ROUTE_TITLES object from the new router config
export const ROUTE_TITLES = flatRoutes.reduce((acc, route) => {
  acc[route.fullPath] = route.title;
  return acc;
}, {} as Record<string, string>);

// Modern way to get route info - use the new router hooks instead
export { useCurrentRoute, useBreadcrumbs, useAppNavigation } from '../router/hooks';
