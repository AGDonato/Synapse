import type { ComponentType, LazyExoticComponent } from 'react';

export interface RouteConfig {
  path: string;
  component: ComponentType | LazyExoticComponent<ComponentType>;
  title: string;
  icon?: string;
  children?: RouteConfig[];
  layout?: ComponentType;
  guards?: RouteGuard[];
  meta?: RouteMeta;
}

export interface RouteMeta extends Record<string, unknown> {
  requiresAuth?: boolean;
  permissions?: string[];
  description?: string;
  breadcrumb?: string;
  hideInSidebar?: boolean;
  icon?: string;
}

export interface RouteGuard {
  canActivate: () => boolean | Promise<boolean>;
  redirectTo?: string;
}

export interface RouteGroup {
  prefix: string;
  routes: RouteConfig[];
  layout?: ComponentType;
  guards?: RouteGuard[];
  meta?: RouteMeta;
}

export interface AppRouteHandle {
  title: string;
  meta?: RouteMeta;
  breadcrumb?: string;
}

export interface AppRoute {
  path?: string;
  index?: boolean;
  element?: React.ReactElement;
  handle?: AppRouteHandle;
  children?: AppRoute[];
  [key: string]: unknown;
}