// src/components/ui/Form.tsx
import React from 'react';
import Button from './Button';
import styles from './Form.module.css';

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
    <form onSubmit={onSubmit} className={styles.form}>
      <h2 className={styles.title}>{title}</h2>

      {children}

      <div className={styles.actions}>
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
