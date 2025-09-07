/**
 * ================================================================
 * CONTEXTO DE AUTENTICAÇÃO AVANÇADA - INTEGRAÇÃO COM PROVEDORES EXTERNOS
 * ================================================================
 *
 * Este contexto estende a funcionalidade do AuthContext base para suportar
 * provedores de autenticação externos (LDAP, OAuth, SAML) mantendo total
 * compatibilidade com o sistema interno.
 *
 * Funcionalidades principais:
 * - Autenticação externa via adaptadores configuráveis
 * - Sistema anti-força bruta com bloqueio temporário de contas
 * - Mapeamento granular de permissões por recursos do sistema
 * - Verificação de acesso a entidades específicas (demandas/documentos)
 * - Composição transparente com autenticação interna
 * - Cache inteligente de sessões externas
 * - Refresh automático de tokens externos
 * - Analytics integrado para auditoria de acessos
 * - Notificações de eventos de autenticação
 *
 * Padrões implementados:
 * - Adapter Pattern para provedores externos
 * - Composite Pattern para fusão de sistemas de auth
 * - Strategy Pattern para mapeamento de permissões
 * - Observer Pattern para notificações
 * - Anti-Pattern de força bruta com rate limiting
 *
 * Provedores suportados:
 * - Active Directory / LDAP
 * - OAuth 2.0 / OpenID Connect
 * - SAML 2.0
 * - Custom API endpoints
 *
 * @fileoverview Contexto avançado de autenticação externa
 * @version 2.0.0
 * @since 2024-01-15
 * @author Equipe Synapse
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import AdaptadorAutenticacaoExterna, {
  type AuthProviderConfig,
  type AuthResponse,
  type ExternalUser,
  type PermissionMapping,
} from '../services/auth/externalAuthAdapter';
import { analytics } from '../services/analytics/core';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth as useBaseAuth } from './AuthContext';
import type { Demanda, Documento } from '../services/api/schemas';
import { logger } from '../utils/logger';

/**
 * Interface que define o estado completo da autenticação externa
 * Gerencia informações de sessão, tentativas de login e bloqueios
 */
interface EstadoAutenticacaoExterna {
  /** Indica se autenticação externa está habilitada */
  isEnabled: boolean;
  /** Indica se operação de autenticação externa está em andamento */
  isLoading: boolean;
  /** Dados do usuário externo autenticado */
  externalUser: ExternalUser | null;
  /** Nome do provedor de autenticação utilizado */
  provider: string | null;
  /** Contador de tentativas de login falhadas */
  loginAttempts: number;
  /** Timestamp até quando a conta está bloqueada */
  lockoutUntil: number | null;
  /** Mensagem de erro atual da autenticação externa */
  error: string | null;
}

/**
 * Tipos de ações que modificam o estado da autenticação externa
 * Cada ação representa uma operação específica do sistema
 */
type AcaoAutenticacaoExterna =
  | { type: 'INICIAR_AUTH_EXTERNA' }
  | { type: 'SUCESSO_AUTH_EXTERNA'; payload: { user: ExternalUser; provider: string } }
  | { type: 'FALHA_AUTH_EXTERNA'; payload: { error: string } }
  | { type: 'LOGOUT_AUTH_EXTERNA' }
  | { type: 'INCREMENTAR_TENTATIVAS' }
  | { type: 'BLOQUEAR_CONTA'; payload: { lockoutUntil: number } }
  | { type: 'RESETAR_TENTATIVAS' }
  | { type: 'LIMPAR_ERRO' };

/**
 * Interface principal do contexto de autenticação avançada
 * Combina funcionalidades externas com integração ao sistema base
 */
interface TipoContextoAutenticacaoAvancada extends EstadoAutenticacaoExterna {
  /** Realiza login usando provedor externo */
  loginExterno: (usuario: string, senha: string) => Promise<boolean>;
  /** Realiza logout da sessão externa */
  logoutExterno: () => Promise<void>;
  /** Atualiza token de autenticação externa */
  atualizarTokenExterno: () => Promise<boolean>;

  /** Verifica se usuário possui permissão externa específica */
  temPermissaoExterna: (recurso: keyof PermissionMapping, acao: string) => boolean;
  /** Verifica se usuário pode acessar entidade específica */
  podeAcessarEntidade: (tipoEntidade: 'demanda' | 'documento', entidade: Demanda) => boolean;

  /** Remove mensagem de erro da autenticação externa */
  limparErroExterno: () => void;
  /** Retorna usuário efetivo (externo ou interno) */
  obterUsuarioEfetivo: () => ExternalUser | null;
  /** Indica se conta está temporariamente bloqueada */
  isLockedOut: boolean;

  /** Referência ao contexto de autenticação base (delegação) */
  baseAuth: ReturnType<typeof useBaseAuth>;
}

/**
 * Mapeamento padrão de permissões por recursos do sistema
 * Define quais papéis podem realizar quais ações em cada módulo
 */
const mapeamentoPermissaoDefault: PermissionMapping = {
  demandas: {
    read: ['usuario', 'gestor', 'admin', 'demandas:ler'],
    create: ['usuario', 'gestor', 'admin', 'demandas:criar'],
    update: ['usuario', 'gestor', 'admin', 'demandas:editar'],
    delete: ['gestor', 'admin', 'demandas:excluir'],
    approve: ['gestor', 'admin', 'demandas:aprovar'],
  },
  documentos: {
    read: ['usuario', 'gestor', 'admin', 'documentos:ler'],
    create: ['usuario', 'gestor', 'admin', 'documentos:criar'],
    update: ['usuario', 'gestor', 'admin', 'documentos:editar'],
    delete: ['gestor', 'admin', 'documentos:excluir'],
    sign: ['gestor', 'admin', 'documentos:assinar'],
  },
  cadastros: {
    read: ['usuario', 'gestor', 'admin', 'cadastros:ler'],
    create: ['gestor', 'admin', 'cadastros:criar'],
    update: ['gestor', 'admin', 'cadastros:editar'],
    delete: ['admin', 'cadastros:excluir'],
  },
  relatorios: {
    read: ['usuario', 'gestor', 'admin', 'relatorios:ler'],
    export: ['usuario', 'gestor', 'admin', 'relatorios:exportar'],
    advanced: ['gestor', 'admin', 'relatorios:avancado'],
  },
  admin: {
    system: ['admin', 'admin:sistema'],
    users: ['admin', 'admin:usuarios'],
    audit: ['admin', 'admin:auditoria'],
  },
};

/**
 * Estado inicial da autenticação externa
 * Define valores padrão seguros para todos os campos
 */
const estadoInicialAuthExterna: EstadoAutenticacaoExterna = {
  isEnabled: false,
  isLoading: false,
  externalUser: null,
  provider: null,
  loginAttempts: 0,
  lockoutUntil: null,
  error: null,
};

/**
 * Reducer que gerencia transições de estado da autenticação externa
 * Processa ações relacionadas a login, logout, bloqueios e erros
 * 
 * @param state - Estado atual da autenticação externa
 * @param action - Ação a ser processada
 * @returns Novo estado após aplicar a ação
 */
function reducerAutenticacaoExterna(
  state: EstadoAutenticacaoExterna,
  action: AcaoAutenticacaoExterna
): EstadoAutenticacaoExterna {
  switch (action.type) {
    case 'INICIAR_AUTH_EXTERNA':
      // Inicia processo de autenticação externa
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'SUCESSO_AUTH_EXTERNA':
      // Autenticação externa bem-sucedida - limpa tentativas e bloqueios
      return {
        ...state,
        isLoading: false,
        externalUser: action.payload.user,
        provider: action.payload.provider,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null,
      };

    case 'FALHA_AUTH_EXTERNA':
      // Falha na autenticação externa
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'LOGOUT_AUTH_EXTERNA':
      // Logout externo - preserva configuração mas limpa sessão
      return {
        ...estadoInicialAuthExterna,
        isEnabled: state.isEnabled,
      };

    case 'INCREMENTAR_TENTATIVAS':
      // Incrementa contador de tentativas falhadas
      return {
        ...state,
        loginAttempts: state.loginAttempts + 1,
      };

    case 'BLOQUEAR_CONTA':
      // Bloqueia conta temporariamente após muitas tentativas
      return {
        ...state,
        lockoutUntil: action.payload.lockoutUntil,
        error: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login.',
      };

    case 'RESETAR_TENTATIVAS':
      // Remove bloqueio e reseta contador após período de espera
      return {
        ...state,
        loginAttempts: 0,
        lockoutUntil: null,
        error: null,
      };

    case 'LIMPAR_ERRO':
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
 * Contexto criado para autenticação avançada
 * Será populado pelo provider com estado e funcionalidades reais
 */
const ContextoAutenticacaoAvancada = createContext<TipoContextoAutenticacaoAvancada | null>(null);

/**
 * Props do componente provider de autenticação avançada
 */
interface PropsProvedorAuthAvancada {
  children: React.ReactNode;
  authConfig?: AuthProviderConfig;
  permissionMapping?: PermissionMapping;
}

/**
 * Componente Provider que gerencia autenticação externa integrada
 * Combina funcionalidades externas com sistema interno de forma transparente
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 * @param authConfig - Configuração do provedor externo (opcional)
 * @param permissionMapping - Mapeamento customizado de permissões (opcional)
 */
export const ProvedorAutenticacaoAvancada: React.FC<PropsProvedorAuthAvancada> = ({
  children,
  authConfig,
  permissionMapping = mapeamentoPermissaoDefault,
}) => {
  const baseAuth = useBaseAuth();
  const [state, dispatch] = useReducer(reducerAutenticacaoExterna, {
    ...estadoInicialAuthExterna,
    isEnabled: !!authConfig,
  });
  const { addNotification } = useNotifications();

  /**
   * Instância do adaptador de autenticação externa
   * Memoizada para evitar recriações desnecessárias
   */
  const adaptadorAuth = React.useMemo(
    () => (authConfig ? new AdaptadorAutenticacaoExterna(authConfig, permissionMapping) : null),
    [authConfig, permissionMapping]
  );

  /**
   * Calcula se o usuário está atualmente bloqueado
   * Compara timestamp atual com tempo de fim do bloqueio
   */
  const isLockedOut = state.lockoutUntil ? Date.now() < state.lockoutUntil : false;

  /**
   * Realiza login usando provedor externo de autenticação
   * Implementa proteção anti-força bruta com bloqueio progressivo
   * 
   * @param usuario - Nome de usuário ou email
   * @param senha - Senha do usuário
   * @returns true se login bem-sucedido, false caso contrário
   */
  const loginExterno = useCallback(
    async (usuario: string, senha: string): Promise<boolean> => {
      if (!adaptadorAuth) {
        throw new Error('Autenticação externa não está configurada');
      }

      // Verifica se conta está bloqueada
      if (isLockedOut) {
        const tempoRestante = Math.ceil((state.lockoutUntil! - Date.now()) / 60000);
        dispatch({
          type: 'FALHA_AUTH_EXTERNA',
          payload: { error: `Conta bloqueada. Tente novamente em ${tempoRestante} minuto(s).` },
        });
        return false;
      }

      dispatch({ type: 'INICIAR_AUTH_EXTERNA' });

      try {
        const resposta: AuthResponse = await adaptadorAuth.authenticate(usuario, senha);

        if (resposta.success && resposta.user) {
          dispatch({
            type: 'SUCESSO_AUTH_EXTERNA',
            payload: {
              user: resposta.user,
              provider: authConfig!.provider,
            },
          });

          // Armazena dados da sessão externa no localStorage
          localStorage.setItem('synapse_usuario_externo', JSON.stringify(resposta.user));
          localStorage.setItem('synapse_provedor_externo', authConfig!.provider);
          if (resposta.token) {
            localStorage.setItem('synapse_token_externo', resposta.token);
          }
          if (resposta.refreshToken) {
            localStorage.setItem('synapse_refresh_token_externo', resposta.refreshToken);
          }

          // Exibe notificação de sucesso
          addNotification({
            type: 'success',
            title: 'Login realizado com sucesso',
            message: `Bem-vindo(a), ${resposta.user.displayName}!`,
            duration: 3000,
          });

          // Registra evento de sucesso para analytics
          analytics.track('login_externo_sucesso', {
            userId: resposta.user.id,
            provider: authConfig!.provider,
            hasPermissions: resposta.user.permissions.length > 0,
          });

          return true;
        } else {
          dispatch({ type: 'INCREMENTAR_TENTATIVAS' });

          // Aplica bloqueio após 5 tentativas falhadas
          if (state.loginAttempts >= 4) {
            const lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutos
            dispatch({ type: 'BLOQUEAR_CONTA', payload: { lockoutUntil } });
          } else {
            dispatch({
              type: 'FALHA_AUTH_EXTERNA',
              payload: { error: resposta.error || 'Credenciais inválidas' },
            });
          }

          // Registra tentativa de login falhada
          analytics.track('login_externo_falha', {
            provider: authConfig!.provider,
            error: resposta.error,
            attempts: state.loginAttempts + 1,
          });

          return false;
        }
      } catch (error) {
        dispatch({
          type: 'FALHA_AUTH_EXTERNA',
          payload: { error: 'Erro de conexão. Tente novamente.' },
        });

        // Registra erro de sistema
        analytics.track('erro_auth_externo', {
          provider: authConfig!.provider,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        return false;
      }
    },
    [adaptadorAuth, authConfig, isLockedOut, state.lockoutUntil, state.loginAttempts, addNotification]
  );

  /**
   * Realiza logout da sessão externa
   * Notifica o provedor externo e limpa dados locais
   */
  const logoutExterno = useCallback(async (): Promise<void> => {
    try {
      // Notifica logout no provedor externo se possível
      if (state.externalUser && adaptadorAuth) {
        await adaptadorAuth.logout(state.externalUser.username);

        analytics.track('logout_externo', {
          userId: state.externalUser.id,
          provider: state.provider,
        });
      }
    } catch (error) {
      logger.warn('Falha na notificação de logout externo:', error);
    } finally {
      // Limpa dados da sessão externa
      localStorage.removeItem('synapse_usuario_externo');
      localStorage.removeItem('synapse_provedor_externo');
      localStorage.removeItem('synapse_token_externo');
      localStorage.removeItem('synapse_refresh_token_externo');

      dispatch({ type: 'LOGOUT_AUTH_EXTERNA' });

      addNotification({
        type: 'info',
        title: 'Logout externo realizado',
        message: 'Sessão externa encerrada com sucesso.',
        duration: 3000,
      });
    }
  }, [adaptadorAuth, state.externalUser, state.provider, addNotification]);

  /**
   * Atualiza token de autenticação externa próximo ao vencimento
   * Utiliza refresh token para manter sessão ativa
   * 
   * @returns true se atualização bem-sucedida, false caso contrário
   */
  const atualizarTokenExterno = useCallback(async (): Promise<boolean> => {
    if (!adaptadorAuth) {
      return false;
    }

    const refreshToken = localStorage.getItem('synapse_refresh_token_externo');
    if (!refreshToken) {
      return false;
    }

    try {
      const resposta = await adaptadorAuth.refreshToken(refreshToken);

      if (resposta.success && resposta.token) {
        localStorage.setItem('synapse_token_externo', resposta.token);
        if (resposta.refreshToken) {
          localStorage.setItem('synapse_refresh_token_externo', resposta.refreshToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Falha na atualização do token externo:', error);
      return false;
    }
  }, [adaptadorAuth]);

  /**
   * Verifica se usuário externo possui permissão específica
   * Utiliza o sistema de mapeamento configurável de permissões
   * 
   * @param recurso - Nome do recurso (demandas, documentos, etc.)
   * @param acao - Ação a ser verificada (read, create, update, delete, etc.)
   * @returns true se possui permissão, false caso contrário
   */
  const temPermissaoExterna = useCallback(
    (recurso: keyof PermissionMapping, acao: string): boolean => {
      if (!state.externalUser || !adaptadorAuth) {
        return false;
      }
      return adaptadorAuth.hasPermission(state.externalUser, recurso, acao);
    },
    [adaptadorAuth, state.externalUser]
  );

  /**
   * Verifica se usuário pode acessar entidade específica
   * Implementa regras de negócio para controle de acesso granular
   * 
   * @param tipoEntidade - Tipo da entidade (demanda ou documento)
   * @param entidade - Entidade específica a ser verificada
   * @returns true se pode acessar, false caso contrário
   */
  const podeAcessarEntidade = useCallback(
    (tipoEntidade: 'demanda' | 'documento', entidade: Demanda): boolean => {
      if (!state.externalUser || !adaptadorAuth) {
        return true; // Fallback: permite acesso se sistema externo não disponível
      }
      return adaptadorAuth.canAccessEntity(state.externalUser, tipoEntidade, entidade);
    },
    [adaptadorAuth, state.externalUser]
  );

  /**
   * Retorna usuário efetivo para o sistema
   * Prioriza usuário externo se disponível, senão retorna null
   * 
   * @returns Dados do usuário externo ou null
   */
  const obterUsuarioEfetivo = useCallback((): ExternalUser | null => {
    return state.externalUser;
  }, [state.externalUser]);

  /**
   * Remove mensagem de erro da autenticação externa
   */
  const limparErroExterno = useCallback(() => {
    dispatch({ type: 'LIMPAR_ERRO' });
  }, []);

  /**
   * Effect que inicializa sessão externa a partir do localStorage
   * Restaura sessão se dados válidos estiverem armazenados
   */
  useEffect(() => {
    if (!adaptadorAuth) {
      return;
    }

    const usuarioArmazenado = localStorage.getItem('synapse_usuario_externo');
    const provedorArmazenado = localStorage.getItem('synapse_provedor_externo');
    const tokenArmazenado = localStorage.getItem('synapse_token_externo');

    if (usuarioArmazenado && provedorArmazenado && tokenArmazenado) {
      try {
        const usuario = JSON.parse(usuarioArmazenado);

        // Valida se token ainda é válido
        if (adaptadorAuth.isTokenValid(usuario.username)) {
          dispatch({
            type: 'SUCESSO_AUTH_EXTERNA',
            payload: { user: usuario, provider: provedorArmazenado },
          });
        } else {
          // Tenta atualizar token se expirado
          atualizarTokenExterno();
        }
      } catch (error) {
        logger.error('Falha ao restaurar sessão externa:', error);
        // Limpa dados inválidos
        localStorage.removeItem('synapse_usuario_externo');
        localStorage.removeItem('synapse_provedor_externo');
        localStorage.removeItem('synapse_token_externo');
        localStorage.removeItem('synapse_refresh_token_externo');
      }
    }
  }, [adaptadorAuth, atualizarTokenExterno]);

  /**
   * Effect que configura atualização automática de token externo
   * Executa refresh a cada 30 minutos para manter sessão ativa
   */
  useEffect(() => {
    if (!adaptadorAuth || !state.externalUser) {
      return;
    }

    const intervaloRefresh = setInterval(
      () => {
        atualizarTokenExterno();
      },
      30 * 60 * 1000 // A cada 30 minutos
    );

    return () => clearInterval(intervaloRefresh);
  }, [adaptadorAuth, state.externalUser, atualizarTokenExterno]);

  /**
   * Effect que gerencia timer de desbloqueio de conta
   * Remove bloqueio automaticamente após período definido
   */
  useEffect(() => {
    if (isLockedOut) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'RESETAR_TENTATIVAS' });
      }, state.lockoutUntil! - Date.now());

      return () => clearTimeout(timeout);
    }
  }, [isLockedOut, state.lockoutUntil]);

  /**
   * Valor do contexto com todas as funcionalidades disponíveis
   * Combina estado atual com métodos de autenticação externa
   */
  const valorContexto: TipoContextoAutenticacaoAvancada = {
    ...state,
    loginExterno,
    logoutExterno,
    atualizarTokenExterno,
    temPermissaoExterna,
    podeAcessarEntidade,
    limparErroExterno,
    obterUsuarioEfetivo,
    isLockedOut,
    baseAuth,
  };

  return (
    <ContextoAutenticacaoAvancada.Provider value={valorContexto}>
      {children}
    </ContextoAutenticacaoAvancada.Provider>
  );
};

/**
 * Hook para acessar contexto de autenticação avançada
 * Deve ser usado dentro de componentes envolvidos pelo provider
 * 
 * @returns Objeto com estado e métodos de autenticação avançada
 * @throws Error se usado fora do provider apropriado
 */
export const useAutenticacaoAvancada = (): TipoContextoAutenticacaoAvancada => {
  const contexto = useContext(ContextoAutenticacaoAvancada);
  if (!contexto) {
    throw new Error('useAutenticacaoAvancada deve ser usado dentro de ProvedorAutenticacaoAvancada');
  }
  return contexto;
};

/**
 * Hook composto que combina sistemas de autenticação interno e externo
 * Fornece interface unificada priorizando autenticação externa quando disponível
 * 
 * @returns Objeto com funcionalidades combinadas de ambos os sistemas
 */
export const useAutenticacaoComposta = () => {
  const baseAuth = useBaseAuth();
  const authAvancada = useAutenticacaoAvancada();

  return {
    // Prioriza autenticação externa quando disponível
    isAuthenticated: authAvancada.externalUser ? true : baseAuth.isAuthenticated,
    isLoading: authAvancada.isLoading || baseAuth.isLoading,
    user: authAvancada.externalUser || baseAuth.user,
    error: authAvancada.error || baseAuth.error,

    // Métodos de login/logout
    login: authAvancada.isEnabled ? authAvancada.loginExterno : baseAuth.login,
    logout: async () => {
      if (authAvancada.externalUser) {
        await authAvancada.logoutExterno();
      }
      baseAuth.logout();
    },

    // Verificação de permissões - usa sistema externo se disponível
    hasPermission: (recurso: keyof PermissionMapping, acao: string) => {
      if (authAvancada.externalUser) {
        return authAvancada.temPermissaoExterna(recurso, acao);
      }
      return baseAuth.hasPermission(acao); // Sistema base usa interface diferente
    },

    // Controle de acesso a entidades
    canAccessEntity: authAvancada.podeAcessarEntidade,

    // Tratamento de erros
    clearError: () => {
      authAvancada.limparErroExterno();
      baseAuth.clearError();
    },

    // Funcionalidades avançadas exclusivas
    isLockedOut: authAvancada.isLockedOut,
    useExternalAuth: authAvancada.isEnabled,
    provider: authAvancada.provider,
  };
};

/**
 * Higher-Order Component para proteção de rotas com suporte a autenticação externa
 * Verifica autenticação e permissões antes de renderizar componente
 * 
 * @param ComponenteEnvolvido - Componente a ser protegido
 * @param recursoNecessario - Recurso que deve ser verificado (opcional)
 * @param acaoNecessaria - Ação que deve ser permitida (opcional)
 * @returns Componente com verificação de autenticação avançada
 */
export const comAutenticacaoAvancada = <P extends object>(
  ComponenteEnvolvido: React.ComponentType<P>,
  recursoNecessario?: keyof PermissionMapping,
  acaoNecessaria?: string
): React.ComponentType<P> => {
  const ComponenteComAuthAvancada = (props: P) => {
    const { isAuthenticated, isLoading, hasPermission } = useAutenticacaoComposta();

    // Exibe loading durante verificação
    if (isLoading) {
      return (
        <div className='carregando-container'>
          <div>Carregando...</div>
        </div>
      );
    }

    // Bloqueia acesso se não autenticado
    if (!isAuthenticated) {
      return (
        <div className='nao-autorizado-container'>
          <div>Acesso negado. Faça login para continuar.</div>
        </div>
      );
    }

    // Verifica permissões específicas se necessário
    if (recursoNecessario && acaoNecessaria && !hasPermission(recursoNecessario, acaoNecessaria)) {
      return (
        <div className='permissoes-insuficientes-container'>
          <div>Permissões insuficientes para acessar esta página.</div>
        </div>
      );
    }

    return <ComponenteEnvolvido {...props} />;
  };

  ComponenteComAuthAvancada.displayName = `comAutenticacaoAvancada(${ComponenteEnvolvido.displayName || ComponenteEnvolvido.name})`;

  return ComponenteComAuthAvancada;
};

export default ContextoAutenticacaoAvancada;

// Alias em inglês para compatibilidade com imports existentes
export const EnhancedAuthProvider = ProvedorAutenticacaoAvancada;