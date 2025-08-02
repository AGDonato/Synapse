// src/test/hooks/useDebounce.test.ts

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed', delay: 500 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast forward time but not enough
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast forward to complete delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('changed');
  });

  it('should reset delay when value changes quickly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    // First change
    rerender({ value: 'change1', delay: 500 });
    
    // Wait partial time
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Second change should reset timer
    rerender({ value: 'change2', delay: 500 });
    
    // Wait the original remaining time - should not update yet
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('initial');
    
    // Wait full delay from second change
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('change2');
  });

  it('should handle different delays', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 1000 }
      }
    );

    rerender({ value: 'changed', delay: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('changed');
  });
});