// src/test/hooks/useCrud.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCrud } from '../../hooks/useCrud';

describe('useCrud', () => {
  const mockData = [
    { id: 1, name: 'Item 1', status: 'ativo' },
    { id: 2, name: 'Item 2', status: 'inativo' },
  ];

  const mockConfig = {
    initialData: mockData,
    createFn: vi.fn(),
    updateFn: vi.fn(),
    deleteFn: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useCrud(mockConfig));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle create operation', async () => {
    const newItem = { name: 'New Item', status: 'ativo' };
    const createdItem = { id: 3, ...newItem };
    
    mockConfig.createFn.mockResolvedValueOnce(createdItem);

    const { result } = renderHook(() => useCrud(mockConfig));

    await act(async () => {
      await result.current.create(newItem);
    });

    expect(mockConfig.createFn).toHaveBeenCalledWith(newItem);
    expect(result.current.data).toContainEqual(createdItem);
  });

  it('should handle update operation', async () => {
    const updatedData = { name: 'Updated Item' };
    const updatedItem = { id: 1, ...updatedData, status: 'ativo' };
    
    mockConfig.updateFn.mockResolvedValueOnce(updatedItem);

    const { result } = renderHook(() => useCrud(mockConfig));

    await act(async () => {
      await result.current.update(1, updatedData);
    });

    expect(mockConfig.updateFn).toHaveBeenCalledWith(1, updatedData);
    expect(result.current.data.find(item => item.id === 1)).toEqual(updatedItem);
  });

  it('should handle delete operation', async () => {
    mockConfig.deleteFn.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCrud(mockConfig));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mockConfig.deleteFn).toHaveBeenCalledWith(1);
    expect(result.current.data.find(item => item.id === 1)).toBeUndefined();
  });

  it('should handle loading states', async () => {
    const slowCreateFn = vi.fn(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 3, name: 'New' }), 100))
    );
    
    const slowConfig = { ...mockConfig, createFn: slowCreateFn };
    const { result } = renderHook(() => useCrud(slowConfig));

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.create({ name: 'New Item' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error states', async () => {
    const error = new Error('Create failed');
    mockConfig.createFn.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCrud(mockConfig));

    await act(async () => {
      try {
        await result.current.create({ name: 'Failing Item' });
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
  });
});