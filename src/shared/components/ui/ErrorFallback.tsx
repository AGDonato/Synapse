// src/components/ui/ErrorFallback.tsx

import React from 'react';
import Button from './Button';

export interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'error';
  }[];
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
  padding: '1.25rem',
};

const contentStyles: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '500px',
  padding: '1.25rem',
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  border: `1px solid ${'var(--border-primary)'}`,
};

const iconStyles: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '1rem',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
  marginBottom: '0.75rem',
  margin: 0,
};

const messageStyles: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--text-secondary)',
  marginBottom: '1.25rem',
  lineHeight: 1.6,
};

const detailsStyles: React.CSSProperties = {
  marginBottom: '1.25rem',
  textAlign: 'left',
};

const summaryStyles: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: '500',
  marginBottom: '0.5rem',
  color: 'var(--text-primary)',
};

const errorInfoStyles: React.CSSProperties = {
  backgroundColor: 'var(--bg-tertiary)',
  padding: '0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  border: `1px solid ${'var(--border-primary)'}`,
};

const stackStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  overflow: 'auto',
  maxHeight: '200px',
  marginTop: '0.5rem',
  whiteSpace: 'pre-wrap',
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};
