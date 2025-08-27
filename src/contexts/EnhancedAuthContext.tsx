/**
 * Enhanced Authentication Context with External Provider Integration
 * 
 * This extends the existing AuthContext to support external authentication
 * providers while maintaining backward compatibility.
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import ExternalAuthAdapter, { 
  type AuthProviderConfig, 
  type AuthResponse, 
  type ExternalUser,
  type PermissionMapping 
} from '../services/auth/externalAuthAdapter';
import { analytics } from '../services/analytics/core';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth as useBaseAuth } from './AuthContext';
import type { Demanda, Documento } from '../services/api/schemas';

// External authentication state interface
interface ExternalAuthState {
  isEnabled: boolean;
  isLoading: boolean;
  externalUser: ExternalUser | null;
  provider: string | null;
  loginAttempts: number;
  lockoutUntil: number | null;
  error: string | null;
}

// External authentication actions
type ExternalAuthAction =
  | { type: 'EXTERNAL_AUTH_START' }
  | { type: 'EXTERNAL_AUTH_SUCCESS'; payload: { user: ExternalUser; provider: string } }
  | { type: 'EXTERNAL_AUTH_FAILURE'; payload: { error: string } }
  | { type: 'EXTERNAL_AUTH_LOGOUT' }
  | { type: 'INCREMENT_ATTEMPTS' }
  | { type: 'LOCKOUT'; payload: { lockoutUntil: number } }
  | { type: 'RESET_ATTEMPTS' }
  | { type: 'CLEAR_ERROR' };

// Context interface
interface EnhancedAuthContextType extends ExternalAuthState {
  // External auth methods
  externalLogin: (username: string, password: string) => Promise<boolean>;
  externalLogout: () => Promise<void>;
  refreshExternalToken: () => Promise<boolean>;
  
  // Permission checking
  hasExternalPermission: (resource: keyof PermissionMapping, action: string) => boolean;
  canAccessEntity: (entityType: 'demanda' | 'documento', entity: Demanda | Documento) => boolean;
  
  // Utility methods
  clearExternalError: () => void;
  getEffectiveUser: () => ExternalUser | null;
  isLockedOut: boolean;
  
  // Base auth context (delegated)
  baseAuth: ReturnType<typeof useBaseAuth>;
}

// Default permission mapping
const defaultPermissionMapping: PermissionMapping = {
  demandas: {
    read: ['user', 'manager', 'admin', 'demandas:read'],
    create: ['user', 'manager', 'admin', 'demandas:create'],
    update: ['user', 'manager', 'admin', 'demandas:update'],
    delete: ['manager', 'admin', 'demandas:delete'],
    approve: ['manager', 'admin', 'demandas:approve'],
  },
  documentos: {
    read: ['user', 'manager', 'admin', 'documentos:read'],
    create: ['user', 'manager', 'admin', 'documentos:create'],
    update: ['user', 'manager', 'admin', 'documentos:update'],
    delete: ['manager', 'admin', 'documentos:delete'],
    sign: ['manager', 'admin', 'documentos:sign'],
  },
  cadastros: {
    read: ['user', 'manager', 'admin', 'cadastros:read'],
    create: ['manager', 'admin', 'cadastros:create'],
    update: ['manager', 'admin', 'cadastros:update'],
    delete: ['admin', 'cadastros:delete'],
  },
  relatorios: {
    read: ['user', 'manager', 'admin', 'relatorios:read'],
    export: ['user', 'manager', 'admin', 'relatorios:export'],
    advanced: ['manager', 'admin', 'relatorios:advanced'],
  },
  admin: {
    system: ['admin', 'admin:system'],
    users: ['admin', 'admin:users'],
    audit: ['admin', 'admin:audit'],
  },
};

// Initial state
const initialExternalAuthState: ExternalAuthState = {
  isEnabled: false,
  isLoading: false,
  externalUser: null,
  provider: null,
  loginAttempts: 0,
  lockoutUntil: null,
  error: null,
};

// Reducer
function externalAuthReducer(state: ExternalAuthState, action: ExternalAuthAction): ExternalAuthState {
  switch (action.type) {
    case 'EXTERNAL_AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'EXTERNAL_AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        externalUser: action.payload.user,
        provider: action.payload.provider,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null,
      };

    case 'EXTERNAL_AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'EXTERNAL_AUTH_LOGOUT':
      return {
        ...initialExternalAuthState,
        isEnabled: state.isEnabled,
      };

    case 'INCREMENT_ATTEMPTS':
      return {
        ...state,
        loginAttempts: state.loginAttempts + 1,
      };

    case 'LOCKOUT':
      return {
        ...state,
        lockoutUntil: action.payload.lockoutUntil,
        error: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login.',
      };

    case 'RESET_ATTEMPTS':
      return {
        ...state,
        loginAttempts: 0,
        lockoutUntil: null,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Context creation
const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null);

// Provider props
interface EnhancedAuthProviderProps {
  children: React.ReactNode;
  authConfig?: AuthProviderConfig;
  permissionMapping?: PermissionMapping;
}

// Provider component
export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({
  children,
  authConfig,
  permissionMapping = defaultPermissionMapping,
}) => {
  const baseAuth = useBaseAuth();
  const [state, dispatch] = useReducer(externalAuthReducer, {
    ...initialExternalAuthState,
    isEnabled: !!authConfig,
  });
  const { addNotification } = useNotifications();

  // Initialize auth adapter
  const authAdapter = React.useMemo(
    () => authConfig ? new ExternalAuthAdapter(authConfig, permissionMapping) : null,
    [authConfig, permissionMapping]
  );

  // Check if user is locked out
  const isLockedOut = state.lockoutUntil ? Date.now() < state.lockoutUntil : false;

  // External login function
  const externalLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!authAdapter) {
      throw new Error('External authentication not configured');
    }

    if (isLockedOut) {
      const remainingTime = Math.ceil((state.lockoutUntil! - Date.now()) / 60000);
      dispatch({
        type: 'EXTERNAL_AUTH_FAILURE',
        payload: { error: `Conta bloqueada. Tente novamente em ${remainingTime} minuto(s).` },
      });
      return false;
    }

    dispatch({ type: 'EXTERNAL_AUTH_START' });

    try {
      const response: AuthResponse = await authAdapter.authenticate(username, password);

      if (response.success && response.user) {
        dispatch({
          type: 'EXTERNAL_AUTH_SUCCESS',
          payload: {
            user: response.user,
            provider: authConfig!.provider,
          },
        });

        // Store external auth data
        localStorage.setItem('synapse_external_user', JSON.stringify(response.user));
        localStorage.setItem('synapse_external_provider', authConfig!.provider);
        if (response.token) {
          localStorage.setItem('synapse_external_token', response.token);
        }
        if (response.refreshToken) {
          localStorage.setItem('synapse_external_refresh_token', response.refreshToken);
        }

        addNotification({
          type: 'success',
          title: 'Login realizado com sucesso',
          message: `Bem-vindo(a), ${response.user.displayName}!`,
          duration: 3000,
        });

        analytics.track('external_auth_login_success', {
          userId: response.user.id,
          provider: authConfig!.provider,
          hasPermissions: response.user.permissions.length > 0,
        });

        return true;
      } else {
        dispatch({ type: 'INCREMENT_ATTEMPTS' });
        
        // Lockout after 5 failed attempts
        if (state.loginAttempts >= 4) {
          const lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
          dispatch({ type: 'LOCKOUT', payload: { lockoutUntil } });
        } else {
          dispatch({
            type: 'EXTERNAL_AUTH_FAILURE',
            payload: { error: response.error || 'Credenciais inválidas' },
          });
        }

        analytics.track('external_auth_login_failure', {
          provider: authConfig!.provider,
          error: response.error,
          attempts: state.loginAttempts + 1,
        });

        return false;
      }
    } catch (error) {
      dispatch({
        type: 'EXTERNAL_AUTH_FAILURE',
        payload: { error: 'Erro de conexão. Tente novamente.' },
      });

      analytics.track('external_auth_error', {
        provider: authConfig!.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }, [authAdapter, authConfig, isLockedOut, state.lockoutUntil, state.loginAttempts, addNotification]);

  // External logout function
  const externalLogout = useCallback(async (): Promise<void> => {
    try {
      if (state.externalUser && authAdapter) {
        await authAdapter.logout(state.externalUser.username);
        
        analytics.track('external_auth_logout', {
          userId: state.externalUser.id,
          provider: state.provider,
        });
      }
    } catch (error) {
      logger.warn('External logout notification failed:', error);
    } finally {
      // Clear external auth data
      localStorage.removeItem('synapse_external_user');
      localStorage.removeItem('synapse_external_provider');
      localStorage.removeItem('synapse_external_token');
      localStorage.removeItem('synapse_external_refresh_token');

      dispatch({ type: 'EXTERNAL_AUTH_LOGOUT' });

      addNotification({
        type: 'info',
        title: 'Logout externo realizado',
        message: 'Sessão externa encerrada com sucesso.',
        duration: 3000,
      });
    }
  }, [authAdapter, state.externalUser, state.provider, addNotification]);

  // Refresh external token
  const refreshExternalToken = useCallback(async (): Promise<boolean> => {
    if (!authAdapter) {return false;}
    
    const refreshToken = localStorage.getItem('synapse_external_refresh_token');
    if (!refreshToken) {return false;}

    try {
      const response = await authAdapter.refreshToken(refreshToken);

      if (response.success && response.token) {
        localStorage.setItem('synapse_external_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('synapse_external_refresh_token', response.refreshToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      logger.error('External token refresh failed:', error);
      return false;
    }
  }, [authAdapter]);

  // Permission checking for external auth
  const hasExternalPermission = useCallback((resource: keyof PermissionMapping, action: string): boolean => {
    if (!state.externalUser || !authAdapter) {return false;}
    return authAdapter.hasPermission(state.externalUser, resource, action);
  }, [authAdapter, state.externalUser]);

  // Entity access checking
  const canAccessEntity = useCallback((entityType: 'demanda' | 'documento', entity: Demanda | Documento): boolean => {
    if (!state.externalUser || !authAdapter) {return true;} // Fallback to allow access
    return authAdapter.canAccessEntity(state.externalUser, entityType, entity);
  }, [authAdapter, state.externalUser]);

  // Get effective user (external user if available, otherwise base auth user)
  const getEffectiveUser = useCallback((): ExternalUser | null => {
    return state.externalUser;
  }, [state.externalUser]);

  // Clear external error
  const clearExternalError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Initialize external auth from localStorage
  useEffect(() => {
    if (!authAdapter) {return;}

    const storedUser = localStorage.getItem('synapse_external_user');
    const storedProvider = localStorage.getItem('synapse_external_provider');
    const storedToken = localStorage.getItem('synapse_external_token');

    if (storedUser && storedProvider && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        
        // Validate token
        if (authAdapter.isTokenValid(user.username)) {
          dispatch({
            type: 'EXTERNAL_AUTH_SUCCESS',
            payload: { user, provider: storedProvider },
          });
        } else {
          // Try to refresh token
          refreshExternalToken();
        }
      } catch (error) {
        logger.error('Failed to restore external auth session:', error);
        // Clear invalid data
        localStorage.removeItem('synapse_external_user');
        localStorage.removeItem('synapse_external_provider');
        localStorage.removeItem('synapse_external_token');
        localStorage.removeItem('synapse_external_refresh_token');
      }
    }
  }, [authAdapter, refreshExternalToken]);

  // Auto refresh external token
  useEffect(() => {
    if (!authAdapter || !state.externalUser) {return;}

    const refreshInterval = setInterval(() => {
      refreshExternalToken();
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [authAdapter, state.externalUser, refreshExternalToken]);

  // Reset lockout timer
  useEffect(() => {
    if (isLockedOut) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'RESET_ATTEMPTS' });
      }, state.lockoutUntil! - Date.now());

      return () => clearTimeout(timeout);
    }
  }, [isLockedOut, state.lockoutUntil]);

  const contextValue: EnhancedAuthContextType = {
    ...state,
    externalLogin,
    externalLogout,
    refreshExternalToken,
    hasExternalPermission,
    canAccessEntity,
    clearExternalError,
    getEffectiveUser,
    isLockedOut,
    baseAuth,
  };

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

// Hook to use enhanced auth context
export const useEnhancedAuth = (): EnhancedAuthContextType => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

// Composite hook for both auth systems
export const useCompositeAuth = () => {
  const baseAuth = useBaseAuth();
  const enhancedAuth = useEnhancedAuth();

  return {
    // Prioritize external auth when available
    isAuthenticated: enhancedAuth.externalUser ? true : baseAuth.isAuthenticated,
    isLoading: enhancedAuth.isLoading || baseAuth.isLoading,
    user: enhancedAuth.externalUser || baseAuth.user,
    error: enhancedAuth.error || baseAuth.error,
    
    // Login methods
    login: enhancedAuth.isEnabled ? enhancedAuth.externalLogin : baseAuth.login,
    logout: async () => {
      if (enhancedAuth.externalUser) {
        await enhancedAuth.externalLogout();
      }
      baseAuth.logout();
    },
    
    // Permission checking - use external auth if available
    hasPermission: (resource: keyof PermissionMapping, action: string) => {
      if (enhancedAuth.externalUser) {
        return enhancedAuth.hasExternalPermission(resource, action);
      }
      return baseAuth.hasPermission(action); // Base auth uses different interface
    },
    
    // Entity access
    canAccessEntity: enhancedAuth.canAccessEntity,
    
    // Error handling
    clearError: () => {
      enhancedAuth.clearExternalError();
      baseAuth.clearError();
    },
    
    // Enhanced features
    isLockedOut: enhancedAuth.isLockedOut,
    useExternalAuth: enhancedAuth.isEnabled,
    provider: enhancedAuth.provider,
  };
};

// Higher-order component for protected routes with external auth support
export const withEnhancedAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredResource?: keyof PermissionMapping,
  requiredAction?: string
): React.ComponentType<P> => {
  const WithEnhancedAuthComponent = (props: P) => {
    const { isAuthenticated, isLoading, hasPermission } = useCompositeAuth();

    if (isLoading) {
      return (
        <div className="loading-container">
          <div>Carregando...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="unauthorized-container">
          <div>Acesso negado. Faça login para continuar.</div>
        </div>
      );
    }

    if (requiredResource && requiredAction && !hasPermission(requiredResource, requiredAction)) {
      return (
        <div className="insufficient-permissions-container">
          <div>Permissões insuficientes para acessar esta página.</div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithEnhancedAuthComponent.displayName = `withEnhancedAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithEnhancedAuthComponent;
};

export default EnhancedAuthContext;