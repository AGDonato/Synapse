import { Component, type ErrorInfo, type ReactNode } from 'react';
import { IoAlertCircle, IoHome, IoRefresh } from 'react-icons/io5';
import { createModuleLogger } from '../../../utils/logger';
import styles from './ErrorBoundary.module.css';

const logger = createModuleLogger('ErrorBoundary');

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error
    logger.error('ErrorBoundary caught an error:', { error: error.message, errorInfo });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onAction?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const {
        title = 'Algo deu errado',
        message = 'Ocorreu um erro inesperado. Tente novamente ou volte à página inicial.',
        actionText = 'Tentar Novamente',
        showDetails = false,
      } = this.props;

      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>
              <IoAlertCircle size={48} />
            </div>

            <h2 className={styles.errorTitle}>{title}</h2>
            <p className={styles.errorMessage}>{message}</p>

            <div className={styles.errorActions}>
              <button
                onClick={this.handleRetry}
                className={`${styles.button} ${styles.buttonPrimary}`}
                type='button'
              >
                <IoRefresh size={16} />
                {actionText}
              </button>

              <button
                onClick={this.handleGoHome}
                className={`${styles.button} ${styles.buttonSecondary}`}
                type='button'
              >
                <IoHome size={16} />
                Página Inicial
              </button>
            </div>

            {showDetails && this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorSummary}>Detalhes técnicos</summary>
                <div className={styles.errorCode}>
                  <strong>Erro:</strong> {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <pre className={styles.errorStack}>{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
