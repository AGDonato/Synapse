// src/hooks/useErrorHandler.ts

import { useCallback } from 'react';
import { logger } from '../utils/logger';

export interface ErrorInfo {
  message: string;
  code?: string | number;
  details?: unknown;
  timestamp: Date;
}

export interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: string) => void;
  logError: (error: unknown) => void;
  getErrorMessage: (error: unknown) => string;
  getErrorCode: (error: unknown) => string | number | undefined;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const logError = useCallback((error: unknown) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      logger.error('Application Error:', error);
    }

    // In production, you might want to send this to an error tracking service
    const errorInfo: ErrorInfo = {
      message: getErrorMessage(error),
      code: getErrorCode(error),
      details: error,
      timestamp: new Date(),
    };
    
    // TODO: Implement error service integration
    void errorInfo; // Use the variable to avoid unused warning
  }, []);

  const handleError = useCallback(
    (error: unknown, _context?: string) => {
      logError(error);

      // You could also show a toast notification here
      // showErrorToast(getErrorMessage(error));

      // Or update some global error state
      // setGlobalError(error);
    },
    [logError]
  );

  return {
    handleError,
    logError,
    getErrorMessage, // Export utility function
    getErrorCode,    // Export utility function
  };
}

// Helper functions to extract error information
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown error occurred';
}

function getErrorCode(error: unknown): string | number | undefined {
  if (error && typeof error === 'object') {
    if ('code' in error) {
      return error.code as string | number;
    }
    if ('status' in error) {
      return error.status as string | number;
    }
    if ('statusCode' in error) {
      return error.statusCode as string | number;
    }
  }

  return undefined;
}

// Utility function to create typed error classes
export class AppError extends Error {
  public code?: string | number;
  public details?: unknown;

  constructor(message: string, code?: string | number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  public field?: string;

  constructor(message: string, field?: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends AppError {
  public status?: number;

  constructor(message: string, status?: number, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', { resource, id });
    this.name = 'NotFoundError';
  }
}
