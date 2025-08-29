/**
 * DEFINIÇÕES DE TIPOS PARA COMPONENTES DE INTERFACE
 *
 * Este módulo define todas as interfaces TypeScript para componentes de UI.
 * Inclui definições para:
 * - Componentes de tabela com ordenação e customização
 * - Formulários padronizados com validação
 * - Botões com variantes e tamanhos
 * - Campos de entrada tipados
 * - Badges de status para demandas
 * - Sistema de notificações
 * - Modais reutilizáveis com tamanhos configuráveis
 */

import type { ReactNode } from 'react';
import type { BaseEntity } from './entities';

// Tipos para componentes de tabela
/**
 * Interface para definição de colunas de tabela
 * Permite customização de renderização e comportamento por coluna
 * @template T - Tipo da entidade exibida na tabela
 */
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

/**
 * Props para componente de tabela genérica
 * Suporta ordenação, edição e remoção de itens
 * @template T - Tipo da entidade que estende BaseEntity
 */
export interface TableProps<T extends BaseEntity> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
}

// Tipos para componentes de formulário
/**
 * Props para componente de formulário padronizado
 * Fornece estrutura consistente para formulários de CRUD
 */
export interface FormProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children: ReactNode;
  isEditing?: boolean;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
}

// Tipos para componentes de botão
/**
 * Variantes visuais disponíveis para botões
 */
export type ButtonVariant = 'primary' | 'danger' | 'secondary';

/**
 * Tamanhos disponíveis para botões
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props para componente de botão reutilizável
 * Suporta diferentes variantes, tamanhos e estados
 */
export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

// Tipos para componentes de entrada
/**
 * Props para componente de campo de entrada
 * Inclui validação e diferentes tipos de entrada
 */
export interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number';
}

// Tipos para badges de status
/**
 * Status possíveis para demandas do sistema
 * Determina a cor e aparência do badge de status
 */
export type StatusType = 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';

/**
 * Props para componente de badge de status
 * Exibe status de demandas com cores apropriadas
 */
export interface StatusBadgeProps {
  status: StatusType;
}

// Tipos para sistema de notificações
/**
 * Tipos de notificação com cores e ícones específicos
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interface para notificações do sistema
 * Permite exibição temporária de mensagens ao usuário
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// Tipos para componentes modais
/**
 * Props para componente modal reutilizável
 * Suporta diferentes tamanhos e controle de abertura/fechamento
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
