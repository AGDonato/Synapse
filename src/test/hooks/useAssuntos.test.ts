// src/test/hooks/useAssuntos.test.ts

import { renderHook, act } from '@testing-library/react';
import { useAssuntos } from '../../hooks/useAssuntos';

// Helper function to create mock service responses
const createMockServiceResponse = <T,>(data: T, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Mock error',
});

// Mock the service
vi.mock('../../services/AssuntosService', () => ({
  assuntosService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByNome: vi.fn(),
    checkNomeExists: vi.fn(),
    count: vi.fn(),
    exists: vi.fn(),
  },
  AssuntosService: vi.fn()
}));

import { assuntosService } from '../../services/AssuntosService';

describe('useAssuntos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAssuntos());

    expect(result.current.items).toEqual([]);
    expect(result.current.currentItem).toBeNull();
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.deleting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should auto-load data when autoLoad is true', async () => {
    const mockData = [
      { id: 1, nome: 'Assunto 1' },
      { id: 2, nome: 'Assunto 2' }
    ];

    (assuntosService.getAll as any).mockResolvedValue(
      createMockServiceResponse(mockData)
    );

    const { result } = renderHook(() => useAssuntos({ autoLoad: true }));

    // Should start loading
    expect(result.current.loading).toBe(true);

    // Wait for async operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual(mockData);
    expect(result.current.total).toBe(2);
    expect(assuntosService.getAll).toHaveBeenCalledTimes(1);
  });

  it('should handle loadAll manually', async () => {
    const mockData = [{ id: 1, nome: 'Assunto 1' }];
    
    (assuntosService.getAll as any).mockResolvedValue(
      createMockServiceResponse(mockData)
    );

    const { result } = renderHook(() => useAssuntos());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.items).toEqual(mockData);
    expect(assuntosService.getAll).toHaveBeenCalledTimes(1);
  });

  it('should handle create operation', async () => {
    const newAssunto = { nome: 'Novo Assunto' };
    const createdAssunto = { id: 1, nome: 'Novo Assunto' };

    (assuntosService.create as any).mockResolvedValue(
      createMockServiceResponse(createdAssunto)
    );

    const { result } = renderHook(() => useAssuntos());

    let createdItem: any;
    await act(async () => {
      createdItem = await result.current.create(newAssunto);
    });

    expect(createdItem).toEqual(createdAssunto);
    expect(result.current.items).toEqual([createdAssunto]);
    expect(result.current.total).toBe(1);
    expect(assuntosService.create).toHaveBeenCalledWith(newAssunto);
  });

  it('should handle update operation', async () => {
    const existingAssunto = { id: 1, nome: 'Assunto Original' };
    const updateData = { nome: 'Assunto Atualizado' };
    const updatedAssunto = { id: 1, nome: 'Assunto Atualizado' };

    // Setup initial state
    (assuntosService.getAll as any).mockResolvedValue(
      createMockServiceResponse([existingAssunto])
    );

    const { result } = renderHook(() => useAssuntos());

    await act(async () => {
      await result.current.loadAll();
    });

    // Mock update
    (assuntosService.update as any).mockResolvedValue(
      createMockServiceResponse(updatedAssunto)
    );

    let updatedItem: any;
    await act(async () => {
      updatedItem = await result.current.update(1, updateData);
    });

    expect(updatedItem).toEqual(updatedAssunto);
    expect(result.current.items[0]).toEqual(updatedAssunto);
    expect(assuntosService.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle delete operation', async () => {
    const existingAssunto = { id: 1, nome: 'Assunto a Deletar' };

    // Setup initial state
    (assuntosService.getAll as any).mockResolvedValue(
      createMockServiceResponse([existingAssunto])
    );

    const { result } = renderHook(() => useAssuntos());

    await act(async () => {
      await result.current.loadAll();
    });

    // Mock delete
    (assuntosService.delete as any).mockResolvedValue(
      createMockServiceResponse(undefined)
    );

    let deleteResult: boolean;
    await act(async () => {
      deleteResult = await result.current.deleteItem(1);
    });

    expect(deleteResult).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(assuntosService.delete).toHaveBeenCalledWith(1);
  });

  it('should handle service errors', async () => {
    (assuntosService.getAll as any).mockResolvedValue({
      success: false,
      error: 'Service error'
    });

    const { result } = renderHook(() => useAssuntos({ autoLoad: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Service error');
    expect(result.current.items).toEqual([]);
  });

  it('should provide specific assuntos methods', async () => {
    const mockAssunto = { id: 1, nome: 'Teste' };

    (assuntosService.findByNome as any).mockResolvedValue(
      createMockServiceResponse(mockAssunto)
    );

    (assuntosService.checkNomeExists as any).mockResolvedValue(
      createMockServiceResponse(true)
    );

    const { result } = renderHook(() => useAssuntos());

    const foundAssunto = await result.current.findByNome('Teste');
    expect(foundAssunto).toEqual(mockAssunto);

    const exists = await result.current.checkNomeExists('Teste');
    expect(exists).toBe(true);
  });

  it('should clear error state', async () => {
    // First create an error state by triggering a failed service call
    (assuntosService.getAll as any).mockResolvedValue({
      success: false,
      error: 'Test error'
    });

    const { result } = renderHook(() => useAssuntos({ autoLoad: true }));

    // Wait for error to be set
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Test error');

    // Now clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});