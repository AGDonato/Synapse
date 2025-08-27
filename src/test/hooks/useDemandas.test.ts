// src/test/hooks/useDemandas.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDemandas } from '../../hooks/useDemandas';
import { useDemandasStore } from '../../stores/demandasStore';

// Mock do store
vi.mock('../../stores/demandasStore');

describe('useDemandas', () => {
  const mockStore = {
    demandas: [],
    isLoading: false,
    error: null,
    addDemanda: vi.fn(),
    updateDemanda: vi.fn(),
    deleteDemanda: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDemandasStore as any).mockReturnValue(mockStore);
  });

  it('should return store values', () => {
    const { result } = renderHook(() => useDemandas());

    expect(result.current.demandas).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.addDemanda).toBe('function');
    expect(typeof result.current.updateDemanda).toBe('function');
    expect(typeof result.current.deleteDemanda).toBe('function');
  });

  it('should call addDemanda from store', () => {
    const { result } = renderHook(() => useDemandas());
    const newDemanda = { sged: '12345', tipoDemanda: 'Test' };

    act(() => {
      result.current.addDemanda(newDemanda);
    });

    expect(mockStore.addDemanda).toHaveBeenCalledWith(newDemanda);
  });

  it('should call updateDemanda from store', () => {
    const { result } = renderHook(() => useDemandas());

    act(() => {
      result.current.updateDemanda(1, { status: 'concluido' });
    });

    expect(mockStore.updateDemanda).toHaveBeenCalledWith(1, { status: 'concluido' });
  });

  it('should call deleteDemanda from store', () => {
    const { result } = renderHook(() => useDemandas());

    act(() => {
      result.current.deleteDemanda(1);
    });

    expect(mockStore.deleteDemanda).toHaveBeenCalledWith(1);
  });
});