/**
 * Módulo de Autenticação e Controle de Acesso - Exports Centralizados
 *
 * @description
 * Ponto central de importação para todos os componentes, hooks e tipos
 * relacionados ao sistema de autenticação do Synapse. Fornece interface
 * unificada para funcionalidades de login, proteção de rotas e verificação
 * de permissões em toda a aplicação.
 *
 * **Componentes Visuais**:
 * - LoginForm: Formulário completo de autenticação com validação
 * - ProtectedRoute: Wrapper para proteção automática de rotas
 * - ConditionalRender: Renderização condicional baseada em permissões
 *
 * **Hooks de Negócio**:
 * - useAuth: Hook principal do contexto de autenticação
 * - usePermissionCheck: Hook para verificações programáticas
 *
 * **Higher-Order Components**:
 * - AuthProvider: Provider do contexto de autenticação
 * - withAuth: HOC para proteção de componentes
 *
 * **Tipos TypeScript**:
 * - AuthState: Interface do estado de autenticação (alias para EstadoAutenticacao)
 *
 * **Padrão de Organização**:
 * - Componentes: exportados diretamente dos arquivos locais
 * - Contexto: re-exportado de AuthContext para conveniência
 * - Tipos: alias em inglês para compatibilidade
 *
 * @example
 * // Import único para múltiplas funcionalidades
 * import {
 *   LoginForm,
 *   ProtectedRoute,
 *   useAuth,
 *   AuthProvider,
 *   type AuthState
 * } from '@/components/auth';
 *
 * // Em vez de imports separados:
 * // import { LoginForm } from '@/components/auth/LoginForm';
 * // import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
 * // import { useAuth } from '@/contexts/AuthContext';
 *
 * @module components/auth/index
 */

// ========== COMPONENTES VISUAIS ==========
/** Formulário de login com validação e feedback visual */
export { LoginForm } from './LoginForm';

/** Componentes e hooks para proteção e controle de acesso */
export { ProtectedRoute, ConditionalRender, usePermissionCheck } from './ProtectedRoute';

// ========== CONTEXTO E HOOKS ==========
/**
 * Re-export do contexto de autenticação para conveniência
 *
 * Permite importar funcionalidades de auth diretamente do módulo
 * sem necessidade de conhecer a estrutura interna de pastas.
 */
export { useAuth, AuthProvider, withAuth } from '../../contexts/AuthContext';

// ========== TIPOS TYPESCRIPT ==========
/**
 * Alias em inglês para interface de estado de autenticação
 *
 * Fornece compatibilidade com código existente que pode estar
 * usando nomenclatura em inglês, enquanto mantém consistência
 * interna em português.
 */
export type { EstadoAutenticacao as AuthState } from '../../contexts/AuthContext';
