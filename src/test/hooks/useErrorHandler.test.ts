// src/test/hooks/useErrorHandler.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useErrorHandler } from '../../hooks/useErrorHandler';

describe('useErrorHandler', () => {
  beforeEach(() => {
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBe(null);
    expect(result.current.hasError).toBe(false);
    expect(typeof result.current.handleError).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should handle Error objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error message');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toBe('Test error message');
    expect(result.current.hasError).toBe(true);
    expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
  });

  it('should handle string errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const errorMessage = 'String error message';

    act(() => {
      result.current.handleError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.hasError).toBe(true);
  });

  it('should handle API error objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    const apiError = {
      success: false,
      message: 'API error',
      errors: ['Validation failed', 'Required field missing']
    };

    act(() => {
      result.current.handleError(apiError);
    });

    expect(result.current.error).toBe('API error: Validation failed, Required field missing');
    expect(result.current.hasError).toBe(true);
  });

  it('should handle unknown error types', () => {
    const { result } = renderHook(() => useErrorHandler());
    const unknownError = { someProperty: 'some value' };

    act(() => {
      result.current.handleError(unknownError);
    });

    expect(result.current.error).toBe('Erro desconhecido');
    expect(result.current.hasError).toBe(true);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    // Set an error first
    act(() => {
      result.current.handleError('Test error');
    });

    expect(result.current.hasError).toBe(true);

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
    expect(result.current.hasError).toBe(false);
  });

  it('should use custom error message when provided', () => {
    const { result } = renderHook(() => useErrorHandler('Custom fallback'));
    const unknownError = { someProperty: 'value' };

    act(() => {
      result.current.handleError(unknownError);
    });

    expect(result.current.error).toBe('Custom fallback');
  });

  it('should handle null/undefined errors gracefully', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(null);
    });

    expect(result.current.error).toBe('Erro desconhecido');

    act(() => {
      result.current.clearError();
    });

    act(() => {
      result.current.handleError(undefined);
    });

    expect(result.current.error).toBe('Erro desconhecido');
  });
});