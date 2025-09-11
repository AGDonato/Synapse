/**
 * Sistema de Proteção de Rotas e Controle de Acesso
 *
 * @description
 * Componentes e hooks para implementar controle granular de acesso baseado em
 * autenticação, roles (papéis) e permissions (permissões) no sistema Synapse.
 * Fornece proteção automática de rotas, renderização condicional e verificação
 * de permissões para criar uma arquitetura de segurança robusta.
 *
 * **Componentes Principais**:
 * - ProtectedRoute: Wrapper para proteção automática de rotas
 * - ConditionalRender: Renderização condicional baseada em permissões
 * - usePermissionCheck: Hook para verificações programáticas
 *
 * **Funcionalidades de Segurança**:
 * - Verificação automática de autenticação
 * - Controle granular por roles e permissions
 * - Redirecionamento inteligente para login
 * - Fallbacks customizáveis para acesso negado
 * - Preservação de rota original para redirecionamento pós-login
 *
 * **Fluxo de Proteção**:
 * 1. Verifica se usuário está autenticado
 * 2. Se não autenticado: redireciona para /login
 * 3. Se autenticado: verifica roles necessárias
 * 4. Se roles insuficientes: mostra fallback ou erro padrão
 * 5. Verifica permissions necessárias
 * 6. Se permissions insuficientes: mostra fallback ou erro padrão
 * 7. Se tudo válido: renderiza conteúdo protegido
 *
 * **Integração com Sistema**:
 * - AuthContext: fonte de verdade para estado de autenticação
 * - React Router: navegação e redirecionamento
 * - Loading UI: feedback visual durante verificações
 *
 * @example
 * // Proteção básica de rota
 * <ProtectedRoute>
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * // Proteção com roles específicas
 * <ProtectedRoute requiredRoles={['admin', 'manager']}>
 *   <ConfigPage />
 * </ProtectedRoute>
 *
 * // Proteção com permissions
 * <ProtectedRoute requiredPermissions={['read_reports', 'export_data']}>
 *   <ReportsPage />
 * </ProtectedRoute>
 *
 * // Renderização condicional
 * <ConditionalRender roles={['admin']}>
 *   <DeleteButton />
 * </ConditionalRender>
 *
 * @module components/auth/ProtectedRoute
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/contexts/AuthContext';
import { Loading } from '../ui';

// ========== INTERFACES E TIPOS ==========

/**
 * Props do componente ProtectedRoute
 *
 * Define as opções de configuração para proteção de rotas,
 * incluindo critérios de acesso e fallbacks customizados.
 */
interface ProtectedRouteProps {
  /** Conteúdo a ser protegido (renderizado se acesso permitido) */
  children: React.ReactNode;
  /** Lista de roles necessárias (usuário precisa ter pelo menos uma) */
  requiredRoles?: string[];
  /** Lista de permissions necessárias (usuário precisa ter pelo menos uma) */
  requiredPermissions?: string[];
  /** Componente alternativo renderizado se acesso negado */
  fallback?: React.ReactNode;
}

// ========== COMPONENTE PRINCIPAL ==========

/**
 * Componente de proteção de rotas
 *
 * Wrapper que implementa controle de acesso automático baseado em
 * autenticação, roles e permissions. Gerencia todo o fluxo de
 * verificação e redirecionamento de forma transparente.
 *
 * @param props - Configurações de proteção e conteúdo
 * @returns JSX do conteúdo protegido ou redirecionamento/erro
 *
 * **Fluxo de Verificação**:
 * 1. Loading: Exibe spinner durante verificação de auth
 * 2. Não autenticado: Redireciona para /login preservando rota
 * 3. Roles insuficientes: Mostra fallback ou mensagem padrão
 * 4. Permissions insuficientes: Mostra fallback ou mensagem padrão
 * 5. Acesso permitido: Renderiza children
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback,
}) => {
  // ===== HOOKS E ESTADO =====
  /**
   * Extrai funcionalidades do contexto de autenticação
   *
   * - isAuthenticated: usuário possui sessão válida
   * - isLoading: verificação de auth em andamento
   * - hasAnyRole: verifica se possui pelo menos uma role
   * - hasAnyPermission: verifica se possui pelo menos uma permission
   */
  const { isAuthenticated, isLoading, hasAnyRole, hasAnyPermission } = useAuth();

  /**
   * Localização atual para preservar rota durante redirecionamento
   *
   * Permite retornar à rota original após login bem-sucedido
   */
  const location = useLocation();

  // ===== VERIFICAÇÕES DE ACESSO =====

  /**
   * Exibe loading durante verificação de autenticação
   *
   * Evita flashes de conteúdo não autorizado enquanto
   * o sistema verifica o estado de autenticação.
   */
  if (isLoading) {
    return <Loading />;
  }

  /**
   * Redireciona para login se não autenticado
   *
   * Preserva a rota atual no state para redirecionamento
   * pós-login via Navigate state.
   */
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location.pathname }} replace />;
  }

  /**
   * Verifica requisitos de roles/papéis
   *
   * Se roles são especificadas, usuário deve possuir pelo
   * menos uma delas para acessar o conteúdo protegido.
   */
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      fallback ?? (
        <div className='unauthorized-container'>
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para acessar esta página.</p>
          <p>Papéis necessários: {requiredRoles.join(', ')}</p>
        </div>
      )
    );
  }

  /**
   * Verifica requisitos de permissions/permissões
   *
   * Se permissions são especificadas, usuário deve possuir
   * pelo menos uma delas para acessar o conteúdo protegido.
   */
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return (
      fallback ?? (
        <div className='unauthorized-container'>
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para acessar esta página.</p>
          <p>Permissões necessárias: {requiredPermissions.join(', ')}</p>
        </div>
      )
    );
  }

  /**
   * Renderiza conteúdo protegido
   *
   * Se todas as verificações passaram, renderiza o conteúdo
   * protegido (children) normalmente.
   */
  return <>{children}</>;
};

// ========== HOOK DE VERIFICAÇÃO DE PERMISSÕES ==========

/**
 * Hook para verificações programáticas de permissões
 *
 * Fornece funcionalidades para verificar permissões e roles
 * em componentes funcionais, permitindo lógica condicional
 * baseada em controle de acesso.
 *
 * @returns Objeto com funções de verificação de permissões
 *
 * **Funcionalidades**:
 * - hasPermission: verifica uma permission específica
 * - hasRole: verifica um role específico
 * - hasAnyRole: verifica se possui pelo menos um dos roles
 * - hasAnyPermission: verifica se possui pelo menos uma das permissions
 * - canAccess: verifica combinação de roles E permissions
 *
 * @example
 * const { canAccess, hasRole } = usePermissionCheck();
 *
 * // Verificação simples
 * if (hasRole('admin')) {
 *   // Lógica para admin
 * }
 *
 * // Verificação combinada
 * if (canAccess(['admin', 'manager'], ['read_reports'])) {
 *   // Usuário tem role admin/manager E permission read_reports
 * }
 */
export const usePermissionCheck = () => {
  /**
   * Extrai funções de verificação do contexto de autenticação
   *
   * Todas as funções já são memoizadas pelo useAuth hook
   */
  const { hasPermission, hasRole, hasAnyRole, hasAnyPermission } = useAuth();

  /**
   * Verifica se usuário pode acessar recurso com critérios combinados
   *
   * @param roles - Lista de roles aceitas (vazia = não verifica roles)
   * @param permissions - Lista de permissions aceitas (vazia = não verifica permissions)
   * @returns true se usuário atende TODOS os critérios especificados
   *
   * **Lógica**:
   * - Se roles especificadas: usuário deve ter pelo menos uma
   * - Se permissions especificadas: usuário deve ter pelo menos uma
   * - Ambos os critérios devem ser atendidos (operação E, não OU)
   */
  const canAccess = React.useCallback(
    (roles: string[] = [], permissions: string[] = []): boolean => {
      const hasRequiredRole = roles.length === 0 || hasAnyRole(roles);
      const hasRequiredPermission = permissions.length === 0 || hasAnyPermission(permissions);

      return hasRequiredRole && hasRequiredPermission;
    },
    [hasAnyRole, hasAnyPermission]
  );

  return {
    /** Verifica se usuário tem uma permission específica */
    hasPermission,
    /** Verifica se usuário tem um role específico */
    hasRole,
    /** Verifica se usuário tem pelo menos um dos roles especificados */
    hasAnyRole,
    /** Verifica se usuário tem pelo menos uma das permissions especificadas */
    hasAnyPermission,
    /** Verifica acesso combinando roles E permissions */
    canAccess,
  };
};

// ========== COMPONENTE DE RENDERIZAÇÃO CONDICIONAL ==========

/**
 * Props do componente ConditionalRender
 *
 * Define critérios de acesso e conteúdo a ser renderizado
 * condicionalmente baseado em permissões do usuário.
 */
interface ConditionalRenderProps {
  /** Lista de roles aceitas (usuário precisa ter pelo menos uma) */
  roles?: string[];
  /** Lista de permissions aceitas (usuário precisa ter pelo menos uma) */
  permissions?: string[];
  /** Conteúdo renderizado se usuário tem acesso */
  children: React.ReactNode;
  /** Conteúdo alternativo renderizado se usuário não tem acesso */
  fallback?: React.ReactNode;
}

/**
 * Componente para renderização condicional baseada em permissões
 *
 * Alternativa leve ao ProtectedRoute para uso em elementos internos
 * de componentes que precisam ser mostrados/escondidos baseado em
 * controle de acesso, mas não são rotas completas.
 *
 * @param props - Critérios de acesso e conteúdo
 * @returns JSX do children se acesso permitido, fallback caso contrário
 *
 * **Diferenças do ProtectedRoute**:
 * - Não faz redirecionamento (apenas mostra/esconde)
 * - Não tem loading state (assume já autenticado)
 * - Mais leve para uso em UI elementos
 * - Não preserva contexto de navegação
 *
 * @example
 * // Botão só visível para admins
 * <ConditionalRender roles={['admin']}>
 *   <DeleteButton />
 * </ConditionalRender>
 *
 * // Seção com fallback
 * <ConditionalRender
 *   permissions={['read_reports']}
 *   fallback={<p>Acesso restrito</p>}
 * >
 *   <ReportsSection />
 * </ConditionalRender>
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  roles = [],
  permissions = [],
  children,
  fallback = null,
}) => {
  /**
   * Utiliza hook de verificação para avaliar acesso
   *
   * canAccess combina verificação de roles E permissions
   */
  const { canAccess } = usePermissionCheck();

  /**
   * Renderiza children se usuário tem acesso necessário
   *
   * Critérios avaliados:
   * - Se roles especificadas: usuário deve ter pelo menos uma
   * - Se permissions especificadas: usuário deve ter pelo menos uma
   * - Ambos devem ser atendidos se especificados
   */
  if (canAccess(roles, permissions)) {
    return <>{children}</>;
  }

  /**
   * Renderiza fallback se acesso negado
   *
   * Se fallback não fornecido, não renderiza nada (comportamento padrão)
   */
  return <>{fallback}</>;
};
