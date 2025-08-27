// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback
}) => {
  const { isAuthenticated, isLoading, hasAnyRole, hasAnyPermission } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <Loading />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      fallback ?? (
        <div className="unauthorized-container">
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para acessar esta página.</p>
          <p>Roles necessárias: {requiredRoles.join(', ')}</p>
        </div>
      )
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return (
      fallback ?? (
        <div className="unauthorized-container">
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para acessar esta página.</p>
          <p>Permissões necessárias: {requiredPermissions.join(', ')}</p>
        </div>
      )
    );
  }

  // Render protected content
  return <>{children}</>;
};

// Hook for conditional rendering based on permissions
export const usePermissionCheck = () => {
  const { hasPermission, hasRole, hasAnyRole, hasAnyPermission } = useAuth();

  const canAccess = React.useCallback((
    roles: string[] = [],
    permissions: string[] = []
  ): boolean => {
    const hasRequiredRole = roles.length === 0 || hasAnyRole(roles);
    const hasRequiredPermission = permissions.length === 0 || hasAnyPermission(permissions);
    
    return hasRequiredRole && hasRequiredPermission;
  }, [hasAnyRole, hasAnyPermission]);

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    canAccess,
  };
};

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  roles?: string[];
  permissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  roles = [],
  permissions = [],
  children,
  fallback = null
}) => {
  const { canAccess } = usePermissionCheck();

  if (canAccess(roles, permissions)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};