// src/components/ui/ErrorBoundary.tsx

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { theme } from '../../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You could also send this to an error reporting service
    // reportErrorToService(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={errorContainerStyles}>
          <div style={errorContentStyles}>
            <div style={errorIconStyles}>⚠️</div>
            <h2 style={errorTitleStyles}>Algo deu errado!</h2>
            <p style={errorMessageStyles}>
              Ocorreu um erro inesperado. Por favor, tente novamente.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details style={errorDetailsStyles}>
                <summary style={errorSummaryStyles}>Detalhes técnicos</summary>
                <pre style={errorPreStyles}>
                  {this.state.error.name}: {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={errorActionsStyles}>
              <button onClick={this.handleRetry} style={retryButtonStyles}>
                Tentar Novamente
              </button>
              <button onClick={this.handleReload} style={reloadButtonStyles}>
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles
const errorContainerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px',
  padding: theme.spacing.xl,
  backgroundColor: theme.colors.background.primary,
};

const errorContentStyles: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '500px',
  padding: theme.spacing.xl,
  backgroundColor: theme.colors.background.secondary,
  borderRadius: theme.borderRadius.lg,
  boxShadow: theme.shadows.lg,
  border: `1px solid ${theme.colors.border}`,
};

const errorIconStyles: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: theme.spacing.lg,
};

const errorTitleStyles: React.CSSProperties = {
  fontSize: theme.fontSize.xl,
  fontWeight: theme.fontWeight.bold,
  color: theme.colors.text.primary,
  marginBottom: theme.spacing.md,
  margin: 0,
};

const errorMessageStyles: React.CSSProperties = {
  fontSize: theme.fontSize.base,
  color: theme.colors.text.secondary,
  marginBottom: theme.spacing.xl,
  lineHeight: 1.6,
};

const errorDetailsStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
  textAlign: 'left',
};

const errorSummaryStyles: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: theme.fontWeight.medium,
  marginBottom: theme.spacing.sm,
  color: theme.colors.text.primary,
};

const errorPreStyles: React.CSSProperties = {
  backgroundColor: theme.colors.background.muted,
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  fontSize: theme.fontSize.xs,
  color: theme.colors.text.secondary,
  overflow: 'auto',
  maxHeight: '200px',
  border: `1px solid ${theme.colors.border}`,
};

const errorActionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.md,
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const retryButtonStyles: React.CSSProperties = {
  backgroundColor: theme.colors.primary,
  color: 'white',
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  border: 'none',
  borderRadius: theme.borderRadius.md,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  cursor: 'pointer',
  transition: theme.transitions.fast,
};

const reloadButtonStyles: React.CSSProperties = {
  backgroundColor: theme.colors.gray[100],
  color: theme.colors.text.primary,
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  cursor: 'pointer',
  transition: theme.transitions.fast,
};

export default ErrorBoundary;
