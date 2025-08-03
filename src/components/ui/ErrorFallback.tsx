// src/components/ui/ErrorFallback.tsx

import React from 'react';
import { theme } from '../../styles/theme';
import Button from './Button';

export interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'error';
  }>;
}

export default function ErrorFallback({
  error,
  resetError,
  title = 'Algo deu errado!',
  message = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  showDetails = import.meta.env.DEV,
  actions,
}: ErrorFallbackProps) {
  const defaultActions = [
    ...(resetError
      ? [
          {
            label: 'Tentar Novamente',
            onClick: resetError,
            variant: 'primary' as const,
          },
        ]
      : []),
    {
      label: 'Recarregar Página',
      onClick: () => window.location.reload(),
      variant: 'secondary' as const,
    },
  ];

  const finalActions = actions || defaultActions;

  return (
    <div style={containerStyles}>
      <div style={contentStyles}>
        <div style={iconStyles}>⚠️</div>

        <h2 style={titleStyles}>{title}</h2>

        <p style={messageStyles}>{message}</p>

        {showDetails && error && (
          <details style={detailsStyles}>
            <summary style={summaryStyles}>Detalhes técnicos</summary>
            <div style={errorInfoStyles}>
              <p>
                <strong>Erro:</strong> {error.name}
              </p>
              <p>
                <strong>Mensagem:</strong> {error.message}
              </p>
              {error.stack && (
                <div>
                  <strong>Stack trace:</strong>
                  <pre style={stackStyles}>{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {finalActions.length > 0 && (
          <div style={actionsStyles}>
            {finalActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'primary'}
                size='md'
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized error fallbacks
export function PageErrorFallback(props: Omit<ErrorFallbackProps, 'title'>) {
  return (
    <ErrorFallback
      {...props}
      title='Erro na Página'
      message='Não foi possível carregar esta página. Verifique sua conexão e tente novamente.'
    />
  );
}

export function FormErrorFallback(props: Omit<ErrorFallbackProps, 'title'>) {
  return (
    <ErrorFallback
      {...props}
      title='Erro no Formulário'
      message='Ocorreu um erro ao processar o formulário. Verifique os dados e tente novamente.'
    />
  );
}

export function DataErrorFallback(props: Omit<ErrorFallbackProps, 'title'>) {
  return (
    <ErrorFallback
      {...props}
      title='Erro ao Carregar Dados'
      message='Não foi possível carregar os dados. Verifique sua conexão e tente novamente.'
    />
  );
}

// Styles
const containerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '300px',
  padding: theme.spacing.xl,
};

const contentStyles: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '500px',
  padding: theme.spacing.xl,
  backgroundColor: theme.colors.background.primary,
  borderRadius: theme.borderRadius.lg,
  border: `1px solid ${theme.colors.border}`,
};

const iconStyles: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: theme.spacing.lg,
};

const titleStyles: React.CSSProperties = {
  fontSize: theme.fontSize.xl,
  fontWeight: theme.fontWeight.bold,
  color: theme.colors.text.primary,
  marginBottom: theme.spacing.md,
  margin: 0,
};

const messageStyles: React.CSSProperties = {
  fontSize: theme.fontSize.base,
  color: theme.colors.text.secondary,
  marginBottom: theme.spacing.xl,
  lineHeight: 1.6,
};

const detailsStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
  textAlign: 'left',
};

const summaryStyles: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: theme.fontWeight.medium,
  marginBottom: theme.spacing.sm,
  color: theme.colors.text.primary,
};

const errorInfoStyles: React.CSSProperties = {
  backgroundColor: theme.colors.background.muted,
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  fontSize: theme.fontSize.sm,
  border: `1px solid ${theme.colors.border}`,
};

const stackStyles: React.CSSProperties = {
  fontSize: theme.fontSize.xs,
  color: theme.colors.text.secondary,
  overflow: 'auto',
  maxHeight: '200px',
  marginTop: theme.spacing.sm,
  whiteSpace: 'pre-wrap',
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.md,
  justifyContent: 'center',
  flexWrap: 'wrap',
};
