/**
 * ================================================================
 * CONTEXTO DE AUTENTICAÇÃO - SISTEMA DE AUTENTICAÇÃO JWT DO SYNAPSE
 * ================================================================
 *
 * Este contexto gerencia toda a autenticação baseada em JWT do sistema Synapse.
 * Fornece funcionalidades completas de login, logout, refresh de tokens e
 * verificação de permissões e papéis de usuário.
 *
 * Funcionalidades principais:
 * - Autenticação JWT com validação automática de tokens
 * - Refresh automático de tokens próximos ao vencimento
 * - Verificação granular de permissões e papéis
 * - Gerenciamento de estado de autenticação com useReducer
 * - Persistência de sessão via localStorage
 * - Proteção de rotas com HOCs
 * - Tratamento de erros de autenticação
 * - Decodificação e validação segura de tokens JWT
 *
 * Padrões implementados:
 * - Context API com useReducer para gerenciamento de estado
 * - JWT com auto-refresh baseado em tempo de expiração
 * - Verificação de permissões baseada em arrays de strings
 * - HOCs para proteção de componentes/rotas
 * - Hooks customizados para facilitar o uso
 *
 * @fileoverview Contexto central de autenticação JWT
 * @version 2.0.0
 * @since 2024-01-15
 * @author Equipe Synapse
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { authUtils } from '../../shared/services/api/client';
import { logger } from '../../shared/utils/logger';

/**
 * Interface que define a estrutura do payload JWT decodificado
 * Contém informações essenciais do usuário e metadados do token
 */
interface PayloadJwt {
  /** ID único do usuário (subject) */
  sub: string;
  /** Nome completo do usuário */
  name: string;
  /** Email do usuário (opcional) */
  email?: string;
  /** Papel principal do usuário (opcional, deprecated - use roles) */
  role?: string;
  /** Lista de papéis/roles do usuário */
  roles?: string[];
  /** Lista de permissões específicas do usuário */
  permissions?: string[];
  /** Timestamp de expiração do token (Unix timestamp) */
  exp: number;
  /** Timestamp de emissão do token (Unix timestamp) */
  iat: number;
}

/**
 * Interface que define o estado completo de autenticação
 * Centraliza todas as informações relacionadas à sessão do usuário
 */
export interface EstadoAutenticacao {
  /** Dados do usuário autenticado (null se não autenticado) */
  user: PayloadJwt | null;
  /** Token JWT atual (null se não autenticado) */
  token: string | null;
  /** Indica se o usuário está autenticado */
  isAuthenticated: boolean;
  /** Indica se uma operação de autenticação está em andamento */
  isLoading: boolean;
  /** Mensagem de erro atual (null se não há erros) */
  error: string | null;
  /** Lista de permissões do usuário autenticado */
  permissions: string[];
  /** Lista de papéis/roles do usuário autenticado */
  roles: string[];
}

/**
 * Tipos de ações que podem ser disparadas para o reducer de autenticação
 * Cada ação representa uma transição de estado específica
 */
export type AcaoAutenticacao =
  | { type: 'INICIAR_AUTENTICACAO' }
  | { type: 'SUCESSO_AUTENTICACAO'; payload: { user: PayloadJwt; token: string } }
  | { type: 'FALHA_AUTENTICACAO'; payload: string }
  | { type: 'LOGOUT_AUTENTICACAO' }
  | { type: 'REFRESH_AUTENTICACAO'; payload: { user: PayloadJwt; token: string } }
  | { type: 'LIMPAR_ERRO_AUTENTICACAO' };

/**
 * Estado inicial da autenticação aplicado na criação do contexto
 * Define valores padrão seguros para todos os campos
 */
const estadoInicialAutenticacao: EstadoAutenticacao = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: [],
  roles: [],
};

/**
 * Reducer que gerencia as transições de estado da autenticação
 * Implementa a lógica de mudança de estado baseada nas ações recebidas
 *
 * @param state - Estado atual da autenticação
 * @param action - Ação a ser processada
 * @returns Novo estado após aplicar a ação
 */
function reducerAutenticacao(
  state: EstadoAutenticacao,
  action: AcaoAutenticacao
): EstadoAutenticacao {
  switch (action.type) {
    case 'INICIAR_AUTENTICACAO':
      // Inicia processo de autenticação (login/refresh)
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'SUCESSO_AUTENTICACAO':
    case 'REFRESH_AUTENTICACAO':
      // Autenticação bem-sucedida ou token atualizado
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

    case 'FALHA_AUTENTICACAO':
      // Falha na autenticação - limpa dados do usuário
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

    case 'LOGOUT_AUTENTICACAO':
      // Logout - reseta para estado inicial mas mantém loading como false
      return {
        ...estadoInicialAutenticacao,
        isLoading: false,
      };

    case 'LIMPAR_ERRO_AUTENTICACAO':
      // Remove mensagem de erro atual
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

/**
 * Interface que define todos os métodos e propriedades disponíveis no contexto
 * Estende o estado base com funções de autenticação e verificação de permissões
 */
interface TipoContextoAutenticacao extends EstadoAutenticacao {
  /** Função para realizar login com email e senha */
  login: (email: string, password: string) => Promise<void>;
  /** Função para realizar logout e limpar sessão */
  logout: () => void;
  /** Função para atualizar token JWT próximo ao vencimento */
  refreshToken: () => Promise<void>;
  /** Função para limpar mensagens de erro */
  clearError: () => void;
  /** Verifica se o usuário possui uma permissão específica */
  hasPermission: (permission: string) => boolean;
  /** Verifica se o usuário possui um papel específico */
  hasRole: (role: string) => boolean;
  /** Verifica se o usuário possui pelo menos um dos papéis fornecidos */
  hasAnyRole: (roles: string[]) => boolean;
  /** Verifica se o usuário possui pelo menos uma das permissões fornecidas */
  hasAnyPermission: (permissions: string[]) => boolean;
}

/**
 * Contexto de autenticação criado com valor inicial undefined
 * Será populado pelo AuthProvider com o estado e funções reais
 */
const ContextoAutenticacao = createContext<TipoContextoAutenticacao | undefined>(undefined);

/**
 * Componente Provider que envolve a aplicação e fornece o contexto de autenticação
 * Gerencia todo o ciclo de vida da sessão do usuário
 *
 * @param children - Componentes filhos que terão acesso ao contexto
 */
export const ProvedorAutenticacao: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducerAutenticacao, estadoInicialAutenticacao);

  /**
   * Decodifica e valida um token JWT
   * Verifica estrutura, formato e expiração do token
   *
   * @param token - Token JWT a ser decodificado
   * @returns Payload do token se válido, null caso contrário
   */
  const decodificarToken = useCallback((token: string): PayloadJwt | null => {
    try {
      // Divide o token JWT nas três partes (header.payload.signature)
      const partes = token.split('.');
      if (partes.length !== 3) {
        logger.error('Token JWT inválido: formato incorreto');
        return null;
      }

      // Decodifica o payload (parte central do JWT)
      const payload = JSON.parse(atob(partes[1]));
      const payloadValidado = payload as PayloadJwt;

      // Verifica se o token ainda não expirou
      const agora = Math.floor(Date.now() / 1000);
      if (payloadValidado.exp <= agora) {
        logger.warn('Token JWT expirado');
        return null;
      }

      return payloadValidado;
    } catch (error) {
      logger.error('Erro ao decodificar token JWT:', error);
      return null;
    }
  }, []);

  /**
   * Realiza o processo de login do usuário
   * Autentica credenciais no servidor e armazena token recebido
   *
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @throws Error se as credenciais forem inválidas ou houver erro de rede
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      dispatch({ type: 'INICIAR_AUTENTICACAO' });

      try {
        // Envia credenciais para o endpoint de login
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
          throw new Error('Token não recebido do servidor');
        }

        // Valida o token recebido
        const user = decodificarToken(token);
        if (!user) {
          throw new Error('Token inválido recebido do servidor');
        }

        // Configura token nas utilitários de API
        authUtils.setToken(token);

        dispatch({
          type: 'SUCESSO_AUTENTICACAO',
          payload: { user, token },
        });

        logger.info('Login realizado com sucesso', { userId: user.sub });
      } catch (error) {
        const mensagemErro = error instanceof Error ? error.message : 'Erro de autenticação';
        dispatch({ type: 'FALHA_AUTENTICACAO', payload: mensagemErro });
        logger.error('Falha no login:', error);
        throw error;
      }
    },
    [decodificarToken]
  );

  /**
   * Realiza o logout do usuário
   * Remove token do storage e limpa estado da aplicação
   */
  const logout = useCallback(() => {
    authUtils.removeToken();
    dispatch({ type: 'LOGOUT_AUTENTICACAO' });
    logger.info('Logout realizado');
  }, []);

  /**
   * Atualiza o token JWT próximo ao vencimento
   * Utiliza refresh token para obter nova sessão sem re-autenticação
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    const tokenAtual = localStorage.getItem('auth_token');

    if (!tokenAtual) {
      logger.warn('Tentativa de refresh sem token presente');
      logout();
      return;
    }

    try {
      // Solicita novo token usando o atual
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAtual}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha na atualização do token');
      }

      const data = await response.json();
      const { token } = data.data;

      const user = decodificarToken(token);
      if (!user) {
        throw new Error('Token atualizado inválido');
      }

      authUtils.setToken(token);

      dispatch({
        type: 'REFRESH_AUTENTICACAO',
        payload: { user, token },
      });

      logger.info('Token atualizado com sucesso');
    } catch (error) {
      logger.error('Falha na atualização do token:', error);
      logout();
    }
  }, [decodificarToken, logout]);

  /**
   * Remove mensagem de erro atual do estado
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'LIMPAR_ERRO_AUTENTICACAO' });
  }, []);

  /**
   * Verifica se o usuário possui uma permissão específica
   *
   * @param permission - Nome da permissão a ser verificada
   * @returns true se o usuário possui a permissão, false caso contrário
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return state.permissions.includes(permission);
    },
    [state.permissions]
  );

  /**
   * Verifica se o usuário possui um papel específico
   *
   * @param role - Nome do papel a ser verificado
   * @returns true se o usuário possui o papel, false caso contrário
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return state.roles.includes(role);
    },
    [state.roles]
  );

  /**
   * Verifica se o usuário possui pelo menos um dos papéis fornecidos
   *
   * @param roles - Array de papéis a serem verificados
   * @returns true se o usuário possui pelo menos um papel, false caso contrário
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some(role => state.roles.includes(role));
    },
    [state.roles]
  );

  /**
   * Verifica se o usuário possui pelo menos uma das permissões fornecidas
   *
   * @param permissions - Array de permissões a serem verificadas
   * @returns true se o usuário possui pelo menos uma permissão, false caso contrário
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some(permission => state.permissions.includes(permission));
    },
    [state.permissions]
  );

  /**
   * Effect que inicializa o estado de autenticação ao montar o componente
   * Verifica se existe token armazenado e se ainda é válido
   */
  useEffect(() => {
    const inicializarAutenticacao = () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        dispatch({ type: 'LOGOUT_AUTENTICACAO' });
        return;
      }

      const user = decodificarToken(token);
      if (!user) {
        authUtils.removeToken();
        dispatch({ type: 'LOGOUT_AUTENTICACAO' });
        return;
      }

      // Verifica se o token está próximo do vencimento (menos de 5 minutos)
      const agora = Math.floor(Date.now() / 1000);
      const tempoParaVencer = user.exp - agora;

      if (tempoParaVencer < 300) {
        // Menos de 5 minutos
        logger.info('Token próximo do vencimento, atualizando...');
        refreshToken();
      } else {
        authUtils.setToken(token);
        dispatch({
          type: 'SUCESSO_AUTENTICACAO',
          payload: { user, token },
        });
        logger.info('Sessão restaurada com sucesso');
      }
    };

    inicializarAutenticacao();
  }, [decodificarToken, refreshToken]);

  /**
   * Effect que configura auto-refresh do token antes da expiração
   * Agenda atualização automática 5 minutos antes do vencimento
   */
  useEffect(() => {
    if (!state.user || !state.token) {
      return;
    }

    // Calcula tempo até a expiração em milissegundos
    const tempoParaVencer = state.user.exp * 1000 - Date.now();
    // Agenda refresh 5 minutos antes da expiração, mas pelo menos em 1 minuto
    const tempoParaRefresh = Math.max(tempoParaVencer - 5 * 60 * 1000, 60000);

    logger.info(`Token auto-refresh agendado em ${Math.floor(tempoParaRefresh / 1000)} segundos`);

    const timer = setTimeout(() => {
      logger.info('Executando auto-refresh do token');
      refreshToken();
    }, tempoParaRefresh);

    return () => clearTimeout(timer);
  }, [state.user, state.token, refreshToken]);

  /**
   * Valor do contexto com todas as propriedades e métodos disponíveis
   * Combina o estado atual com as funções de autenticação
   */
  const valorContexto: TipoContextoAutenticacao = {
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

  return (
    <ContextoAutenticacao.Provider value={valorContexto}>{children}</ContextoAutenticacao.Provider>
  );
};

/**
 * Hook customizado para acessar o contexto de autenticação
 * Deve ser usado apenas dentro de componentes envolvidos pelo AuthProvider
 *
 * @returns Objeto com estado e métodos de autenticação
 * @throws Error se usado fora do AuthProvider
 */
export const useAuth = (): TipoContextoAutenticacao => {
  const context = useContext(ContextoAutenticacao);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um ProvedorAutenticacao');
  }
  return context;
};

/**
 * Higher-Order Component para proteger rotas/componentes
 * Verifica autenticação e opcionalmente papéis/permissões antes de renderizar
 *
 * @param Component - Componente a ser protegido
 * @param requiredRoles - Papéis necessários para acessar (opcional)
 * @param requiredPermissions - Permissões necessárias para acessar (opcional)
 * @returns Componente envolvido com verificação de autenticação
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[],
  requiredPermissions?: string[]
) => {
  return React.memo((props: P) => {
    const { isAuthenticated, isLoading, hasAnyRole, hasAnyPermission } = useAuth();

    // Exibe loading enquanto verifica autenticação
    if (isLoading) {
      return <div>Carregando...</div>;
    }

    // Redireciona se não autenticado
    if (!isAuthenticated) {
      return <div>Não autorizado - Faça login para continuar</div>;
    }

    // Verifica papéis necessários
    if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return <div>Permissões insuficientes - Papel necessário não encontrado</div>;
    }

    // Verifica permissões necessárias
    if (
      requiredPermissions &&
      requiredPermissions.length > 0 &&
      !hasAnyPermission(requiredPermissions)
    ) {
      return <div>Permissões insuficientes - Permissão necessária não encontrada</div>;
    }

    return <Component {...props} />;
  });
};

// Alias em inglês para compatibilidade com imports existentes
export const AuthProvider = ProvedorAutenticacao;
