// src/components/ui/Form.tsx
import React from 'react';
import { theme } from '../../styles/theme';
import Button from './Button';

export type FormProps = {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children: React.ReactNode;
  isEditing?: boolean;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
};

const formContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.lg,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  marginBottom: theme.spacing.lg,
  color: theme.colors.text.primary,
  fontSize: theme.fontSize.lg,
  fontWeight: theme.fontWeight.semibold,
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing.md,
  marginTop: theme.spacing.lg,
  paddingTop: theme.spacing.lg,
  borderTop: `1px solid ${theme.colors.border}`,
};

export default function Form({
  title,
  onSubmit,
  onCancel,
  children,
  isEditing = false,
  loading = false,
  submitText,
  cancelText = 'Cancelar',
}: FormProps) {
  const defaultSubmitText = isEditing ? 'Atualizar' : 'Salvar';

  return (
    <form onSubmit={onSubmit} style={formContainerStyles}>
      <h2 style={titleStyles}>{title}</h2>

      {children}

      <div style={actionsStyles}>
        <Button
          type='button'
          variant='secondary'
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button type='submit' disabled={loading}>
          {loading ? 'Salvando...' : submitText || defaultSubmitText}
        </Button>
      </div>
    </form>
  );
}
