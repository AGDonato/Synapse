// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { authUtils } from '../services/api/client';
// import { type JwtPayload, JwtPayloadSchema } from '../schemas/entities/api.schema'; // Moved to _trash
import { logger } from '../utils/logger';

// Simple JWT payload interface (replaced moved schema)
interface JwtPayload {
  sub: string;
  name: string;
  email?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  exp: number;
  iat: number;
}

// Auth state interface
export interface AuthState {
  user: JwtPayload | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  roles: string[];
}

// Auth actions
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: JwtPayload; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_REFRESH'; payload: { user: JwtPayload; token: string } }
  | { type: 'AUTH_CLEAR_ERROR' };

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: [],
  roles: [],
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
    case 'AUTH_REFRESH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: action.payload.user.permissions || [],
        roles: action.payload.user.roles || [],
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        permissions: [],
        roles: [],
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialAuthState,
        isLoading: false,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Decode and validate JWT token
  const decodeToken = useCallback((token: string): JwtPayload | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      const validatedPayload = payload as JwtPayload; // Simplified validation (schema moved to _trash)

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (validatedPayload.exp <= now) {
        return null;
      }

      return validatedPayload;
    } catch (error) {
      logger.error('Token decode error:', error);
      return null;
    }
  }, []);

  // Login function
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      dispatch({ type: 'AUTH_START' });

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Credenciais inválidas');
        }

        const data = await response.json();
        const { token } = data.data;

        if (!token) {
          throw new Error('Token não recebido');
        }

        const user = decodeToken(token);
        if (!user) {
          throw new Error('Token inválido');
        }

        // Set token in auth utils
        authUtils.setToken(token);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro de autenticação';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        throw error;
      }
    },
    [decodeToken]
  );

  // Logout function
  const logout = useCallback(() => {
    authUtils.removeToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    const currentToken = localStorage.getItem('auth_token');

    if (!currentToken) {
      logout();
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { token } = data.data;

      const user = decodeToken(token);
      if (!user) {
        throw new Error('Invalid refreshed token');
      }

      authUtils.setToken(token);

      dispatch({
        type: 'AUTH_REFRESH',
        payload: { user, token },
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      logout();
    }
  }, [decodeToken, logout]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  // Permission checking functions
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return state.permissions.includes(permission);
    },
    [state.permissions]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      return state.roles.includes(role);
    },
    [state.roles]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some(role => state.roles.includes(role));
    },
    [state.roles]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some(permission => state.permissions.includes(permission));
    },
    [state.permissions]
  );

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      const user = decodeToken(token);
      if (!user) {
        authUtils.removeToken();
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Check if token is close to expiration (refresh if < 5 minutes remaining)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = user.exp - now;

      if (timeUntilExpiry < 300) {
        // Less than 5 minutes
        refreshToken();
      } else {
        authUtils.setToken(token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
      }
    };

    initializeAuth();
  }, [decodeToken, refreshToken]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.user || !state.token) {
      return;
    }

    const timeUntilExpiry = state.user.exp * 1000 - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // Refresh 5 min before expiry, but at least 1 min

    const timer = setTimeout(() => {
      refreshToken();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [state.user, state.token, refreshToken]);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[],
  requiredPermissions?: string[]
) => {
  return React.memo((props: P) => {
    const { isAuthenticated, isLoading, hasAnyRole, hasAnyPermission } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>; // Or your loading component
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized
      return <div>Unauthorized</div>;
    }

    if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return <div>Insufficient permissions</div>;
    }

    if (
      requiredPermissions &&
      requiredPermissions.length > 0 &&
      !hasAnyPermission(requiredPermissions)
    ) {
      return <div>Insufficient permissions</div>;
    }

    return <Component {...props} />;
  });
};
