// src/hooks/useService.ts

import { useCallback, useEffect, useState } from 'react';
import type { BaseService, SearchOptions, ServiceListResponse, ServiceResponse } from '../services/BaseService';
import type { BaseEntity, CreateDTO, UpdateDTO } from '../types/api';
import { useErrorHandler } from './useErrorHandler';

export interface UseServiceConfig {
  // Auto-load data on mount
  autoLoad?: boolean;
  // Show error notifications
  showErrorNotifications?: boolean;
  // Entity name for error messages
  entityName?: string;
}

export interface UseServiceReturn<T extends BaseEntity> {
  // Data state
  items: T[];
  currentItem: T | null;
  total: number;

  // Loading states
  loading: boolean;
  saving: boolean;
  deleting: boolean;

  // Error state
  error: string | null;

  // Actions
  loadAll: () => Promise<void>;
  loadById: (id: number) => Promise<T | null>;
  search: (options?: SearchOptions) => Promise<T[]>;
  create: (data: CreateDTO<T>) => Promise<T | null>;
  update: (id: number, data: UpdateDTO<T>) => Promise<T | null>;
  deleteItem: (id: number) => Promise<boolean>;
  bulkCreate: (dataArray: CreateDTO<T>[]) => Promise<T[]>;
  bulkDelete: (ids: number[]) => Promise<boolean>;
  
  // Utility actions
  refresh: () => Promise<void>;
  clearError: () => void;
  clearCurrentItem: () => void;
  count: () => Promise<number>;
  exists: (id: number) => Promise<boolean>;
}


// Hook auxiliar para handlers de resposta
const useServiceResponseHandlers = (
  setError: (error: string | null) => void,
  showErrorNotifications: boolean,
  logError: (error: Error, context?: string) => void
) => {
  const handleSingleResponse = useCallback(<U>(
    response: ServiceResponse<U>,
    context?: string
  ): U | null => {
    if (response.success) {
      setError(null);
      return response.data ?? null;
    } else {
      const errorMessage = response.error ?? 'Erro desconhecido';
      setError(errorMessage);
      
      if (showErrorNotifications) {
        logError(new Error(errorMessage), context);
      }
      
      return null;
    }
  }, [setError, showErrorNotifications, logError]);

  const handleListResponse = useCallback(<U>(
    response: ServiceListResponse<U>,
    context?: string
  ): U[] | null => {
    if (response.success) {
      setError(null);
      return response.data ?? null;
    } else {
      const errorMessage = response.error ?? 'Erro desconhecido';
      setError(errorMessage);
      
      if (showErrorNotifications) {
        logError(new Error(errorMessage), context);
      }
      
      return null;
    }
  }, [setError, showErrorNotifications, logError]);

  return { handleSingleResponse, handleListResponse };
};

// Hook auxiliar para operações CRUD
const useServiceCrudOperations = <T extends BaseEntity>(
  service: BaseService<T>,
  entityName: string,
  stateSetters: {
    setSaving: (saving: boolean) => void;
    setDeleting: (deleting: boolean) => void;
    setError: (error: string | null) => void;
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
    setCurrentItem: React.Dispatch<React.SetStateAction<T | null>>;
    setTotal: React.Dispatch<React.SetStateAction<number>>;
  },
  config: {
    currentItem: T | null;
    showErrorNotifications: boolean;
    logError: (error: Error, context?: string) => void;
  },
  handlers: {
    handleSingleResponse: <U>(response: ServiceResponse<U>, context?: string) => U | null;
    handleListResponse: <U>(response: ServiceListResponse<U>, context?: string) => U[] | null;
  }
) => {
  const create = useCallback(async (data: CreateDTO<T>): Promise<T | null> => {
    stateSetters.setSaving(true);
    stateSetters.setError(null);
    
    try {
      const response = await service.create(data);
      const newItem = handlers.handleSingleResponse(response, `Creating ${entityName}`);
      
      if (newItem) {
        stateSetters.setItems(prev => [...prev, newItem]);
        stateSetters.setTotal(prev => prev + 1);
        return newItem;
      }
      
      return null;
    } finally {
      stateSetters.setSaving(false);
    }
  }, [service, entityName, stateSetters, handlers]);

  const update = useCallback(async (id: number, data: UpdateDTO<T>): Promise<T | null> => {
    stateSetters.setSaving(true);
    stateSetters.setError(null);
    
    try {
      const response = await service.update(id, data);
      const updatedItem = handlers.handleSingleResponse(response, `Updating ${entityName} with ID ${id}`);
      
      if (updatedItem) {
        stateSetters.setItems(prev => prev.map(item => 
          item.id === id ? updatedItem : item
        ));
        
        if (config.currentItem && config.currentItem.id === id) {
          stateSetters.setCurrentItem(updatedItem);
        }
        
        return updatedItem;
      }
      
      return null;
    } finally {
      stateSetters.setSaving(false);
    }
  }, [service, entityName, config.currentItem, stateSetters, handlers]);

  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    stateSetters.setDeleting(true);
    stateSetters.setError(null);
    
    try {
      const response = await service.delete(id);
      const success = response.success;
      
      if (!success) {
        const errorMessage = response.error ?? 'Erro desconhecido';
        stateSetters.setError(errorMessage);
        
        if (config.showErrorNotifications) {
          config.logError(new Error(errorMessage), `Deleting ${entityName} with ID ${id}`);
        }
        
        return false;
      }
      
      stateSetters.setItems(prev => prev.filter(item => item.id !== id));
      stateSetters.setTotal(prev => prev - 1);
      
      if (config.currentItem && config.currentItem.id === id) {
        stateSetters.setCurrentItem(null);
      }
      
      return true;
    } finally {
      stateSetters.setDeleting(false);
    }
  }, [service, entityName, config, stateSetters]);

  const bulkCreate = useCallback(async (dataArray: CreateDTO<T>[]): Promise<T[]> => {
    stateSetters.setSaving(true);
    stateSetters.setError(null);
    
    try {
      const response = await service.bulkCreate(dataArray);
      const newItems = handlers.handleListResponse(response, `Bulk creating ${entityName}s`);
      
      if (newItems) {
        stateSetters.setItems(prev => [...prev, ...newItems]);
        stateSetters.setTotal(prev => prev + newItems.length);
        return newItems;
      }
      
      return [];
    } finally {
      stateSetters.setSaving(false);
    }
  }, [service, entityName, stateSetters, handlers]);

  const bulkDelete = useCallback(async (ids: number[]): Promise<boolean> => {
    stateSetters.setDeleting(true);
    stateSetters.setError(null);
    
    try {
      const response = await service.bulkDelete(ids);
      const success = response.success;
      
      if (!success) {
        const errorMessage = response.error ?? 'Erro desconhecido';
        stateSetters.setError(errorMessage);
        
        if (config.showErrorNotifications) {
          config.logError(new Error(errorMessage), `Bulk deleting ${entityName}s`);
        }
        
        return false;
      }
      
      stateSetters.setItems(prev => prev.filter(item => !ids.includes(item.id)));
      stateSetters.setTotal(prev => prev - ids.length);
      
      if (config.currentItem && ids.includes(config.currentItem.id)) {
        stateSetters.setCurrentItem(null);
      }
      
      return true;
    } finally {
      stateSetters.setDeleting(false);
    }
  }, [service, entityName, config, stateSetters]);

  return { create, update, deleteItem, bulkCreate, bulkDelete };
};

export function useService<T extends BaseEntity>(
  service: BaseService<T>,
  config: UseServiceConfig = {}
): UseServiceReturn<T> {
  const {
    autoLoad = false,
    showErrorNotifications = true,
    entityName = 'item'
  } = config;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [currentItem, setCurrentItem] = useState<T | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handler
  const { handleError: logError } = useErrorHandler();

  // Response handlers
  const { handleSingleResponse, handleListResponse } = useServiceResponseHandlers(
    setError, showErrorNotifications, logError
  );

  // Load operations
  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service.getAll();
      const data = handleListResponse(response, `Loading all ${entityName}s`);
      
      if (data) {
        setItems(data);
        setTotal(response.total ?? data.length);
      }
    } finally {
      setLoading(false);
    }
  }, [service, entityName, handleListResponse]);

  const loadById = useCallback(async (id: number): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service.getById(id);
      const data = handleSingleResponse(response, `Loading ${entityName} with ID ${id}`);
      
      if (data) {
        setCurrentItem(data);
        return data;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [service, entityName, handleSingleResponse]);

  const search = useCallback(async (options?: SearchOptions): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service.search(options);
      const data = handleListResponse(response, `Searching ${entityName}s`);
      
      if (data) {
        setItems(data);
        setTotal(response.total ?? data.length);
        return data;
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [service, entityName, handleListResponse]);

  // CRUD operations
  const { create, update, deleteItem, bulkCreate, bulkDelete } = useServiceCrudOperations(
    service,
    entityName,
    { setSaving, setDeleting, setError, setItems, setCurrentItem, setTotal },
    { currentItem, showErrorNotifications, logError },
    { handleSingleResponse, handleListResponse }
  );

  // Utility operations
  const refresh = useCallback(async (): Promise<void> => {
    await loadAll();
  }, [loadAll]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const clearCurrentItem = useCallback((): void => {
    setCurrentItem(null);
  }, []);

  const count = useCallback(async (): Promise<number> => {
    const response = await service.count();
    const total = handleSingleResponse(response, `Counting ${entityName}s`);
    return total ?? 0;
  }, [service, entityName, handleSingleResponse]);

  const exists = useCallback(async (id: number): Promise<boolean> => {
    const response = await service.exists(id);
    const exists = handleSingleResponse(response, `Checking if ${entityName} exists`);
    return exists ?? false;
  }, [service, entityName, handleSingleResponse]);

  // Auto-load on mount if configured
  useEffect(() => {
    if (autoLoad) {
      loadAll();
    }
  }, [autoLoad, loadAll]);

  return {
    // Data state
    items,
    currentItem,
    total,

    // Loading states
    loading,
    saving,
    deleting,

    // Error state
    error,

    // Actions
    loadAll,
    loadById,
    search,
    create,
    update,
    deleteItem,
    bulkCreate,
    bulkDelete,

    // Utility actions
    refresh,
    clearError,
    clearCurrentItem,
    count,
    exists,
  };
}