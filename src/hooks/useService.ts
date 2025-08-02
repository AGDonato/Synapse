// src/hooks/useService.ts

import { useState, useCallback, useEffect } from 'react';
import type { BaseService, ServiceResponse, ServiceListResponse, SearchOptions } from '../services/BaseService';
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

  // Utility function to handle single item service responses
  const handleSingleResponse = useCallback(<U>(
    response: ServiceResponse<U>,
    context?: string
  ): U | null => {
    if (response.success) {
      setError(null);
      return response.data || null;
    } else {
      const errorMessage = response.error || 'Erro desconhecido';
      setError(errorMessage);
      
      if (showErrorNotifications) {
        logError(new Error(errorMessage), context);
      }
      
      return null;
    }
  }, [showErrorNotifications, logError]);

  // Utility function to handle list service responses
  const handleListResponse = useCallback(<U>(
    response: ServiceListResponse<U>,
    context?: string
  ): U[] | null => {
    if (response.success) {
      setError(null);
      return response.data || null;
    } else {
      const errorMessage = response.error || 'Erro desconhecido';
      setError(errorMessage);
      
      if (showErrorNotifications) {
        logError(new Error(errorMessage), context);
      }
      
      return null;
    }
  }, [showErrorNotifications, logError]);

  // Load all items
  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service.getAll();
      const data = handleListResponse(response, `Loading all ${entityName}s`);
      
      if (data) {
        setItems(data);
        setTotal(response.total || data.length);
      }
    } finally {
      setLoading(false);
    }
  }, [service, entityName, handleListResponse]);

  // Load item by ID
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

  // Search items
  const search = useCallback(async (options?: SearchOptions): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service.search(options);
      const data = handleListResponse(response, `Searching ${entityName}s`);
      
      if (data) {
        setItems(data);
        setTotal(response.total || data.length);
        return data;
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [service, entityName, handleListResponse]);

  // Create item
  const create = useCallback(async (data: CreateDTO<T>): Promise<T | null> => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await service.create(data);
      const newItem = handleSingleResponse(response, `Creating ${entityName}`);
      
      if (newItem) {
        setItems(prev => [...prev, newItem]);
        setTotal(prev => prev + 1);
        return newItem;
      }
      
      return null;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, handleSingleResponse]);

  // Update item
  const update = useCallback(async (id: number, data: UpdateDTO<T>): Promise<T | null> => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await service.update(id, data);
      const updatedItem = handleSingleResponse(response, `Updating ${entityName} with ID ${id}`);
      
      if (updatedItem) {
        setItems(prev => prev.map(item => 
          item.id === id ? updatedItem : item
        ));
        
        if (currentItem && currentItem.id === id) {
          setCurrentItem(updatedItem);
        }
        
        return updatedItem;
      }
      
      return null;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, currentItem, handleSingleResponse]);

  // Delete item
  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    setDeleting(true);
    setError(null);
    
    try {
      const response = await service.delete(id);
      const success = response.success;
      
      if (!success) {
        const errorMessage = response.error || 'Erro desconhecido';
        setError(errorMessage);
        
        if (showErrorNotifications) {
          logError(new Error(errorMessage), `Deleting ${entityName} with ID ${id}`);
        }
        
        return false;
      }
      
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      
      if (currentItem && currentItem.id === id) {
        setCurrentItem(null);
      }
      
      return true;
    } finally {
      setDeleting(false);
    }
  }, [service, entityName, currentItem, showErrorNotifications, logError]);

  // Bulk create
  const bulkCreate = useCallback(async (dataArray: CreateDTO<T>[]): Promise<T[]> => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await service.bulkCreate(dataArray);
      const newItems = handleListResponse(response, `Bulk creating ${entityName}s`);
      
      if (newItems) {
        setItems(prev => [...prev, ...newItems]);
        setTotal(prev => prev + newItems.length);
        return newItems;
      }
      
      return [];
    } finally {
      setSaving(false);
    }
  }, [service, entityName, handleListResponse]);

  // Bulk delete
  const bulkDelete = useCallback(async (ids: number[]): Promise<boolean> => {
    setDeleting(true);
    setError(null);
    
    try {
      const response = await service.bulkDelete(ids);
      const success = response.success;
      
      if (!success) {
        const errorMessage = response.error || 'Erro desconhecido';
        setError(errorMessage);
        
        if (showErrorNotifications) {
          logError(new Error(errorMessage), `Bulk deleting ${entityName}s`);
        }
        
        return false;
      }
      
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      setTotal(prev => prev - ids.length);
      
      if (currentItem && ids.includes(currentItem.id)) {
        setCurrentItem(null);
      }
      
      return true;
    } finally {
      setDeleting(false);
    }
  }, [service, entityName, currentItem, showErrorNotifications, logError]);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    await loadAll();
  }, [loadAll]);

  // Clear error
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Clear current item
  const clearCurrentItem = useCallback((): void => {
    setCurrentItem(null);
  }, []);

  // Count items
  const count = useCallback(async (): Promise<number> => {
    const response = await service.count();
    const total = handleSingleResponse(response, `Counting ${entityName}s`);
    return total || 0;
  }, [service, entityName, handleSingleResponse]);

  // Check if item exists
  const exists = useCallback(async (id: number): Promise<boolean> => {
    const response = await service.exists(id);
    const exists = handleSingleResponse(response, `Checking if ${entityName} exists`);
    return exists || false;
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