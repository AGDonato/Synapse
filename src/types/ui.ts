// src/types/ui.ts

import type { ReactNode } from 'react';
import type { BaseEntity } from './entities';

// Table component types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

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

// Form component types
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

// Button component types
export type ButtonVariant = 'primary' | 'danger' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

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

// Input component types
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

// Status badge types
export type StatusType = 'Pendente' | 'Em andamento' | 'Concluída';

export interface StatusBadgeProps {
  status: StatusType;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
