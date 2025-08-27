import { useCallback, useEffect, useState } from 'react';

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
  lastUsed?: string;
  isDefault?: boolean;
}

interface UseSavedFiltersOptions {
  storageKey: string;
  maxSavedFilters?: number;
}

export function useSavedFilters({ storageKey, maxSavedFilters = 10 }: UseSavedFiltersOptions) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const filters = JSON.parse(stored) as SavedFilter[];
        setSavedFilters(filters.sort((a, b) => 
          new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime()
        ));
      }
    } catch (error) {
      logger.error('Error loading saved filters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Save filters to localStorage
  const saveFiltersToStorage = useCallback((filters: SavedFilter[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (error) {
      logger.error('Error saving filters:', error);
    }
  }, [storageKey]);

  // Save a new filter
  const saveFilter = useCallback((name: string, filters: Record<string, unknown>) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    setSavedFilters(prev => {
      const updated = [newFilter, ...prev].slice(0, maxSavedFilters);
      saveFiltersToStorage(updated);
      return updated;
    });

    return newFilter;
  }, [maxSavedFilters, saveFiltersToStorage]);

  // Update an existing filter
  const updateFilter = useCallback((id: string, name: string, filters: Record<string, unknown>) => {
    setSavedFilters(prev => {
      const updated = prev.map(filter => 
        filter.id === id 
          ? { ...filter, name, filters, lastUsed: new Date().toISOString() }
          : filter
      );
      saveFiltersToStorage(updated);
      return updated;
    });
  }, [saveFiltersToStorage]);

  // Delete a filter
  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const updated = prev.filter(filter => filter.id !== id);
      saveFiltersToStorage(updated);
      return updated;
    });
  }, [saveFiltersToStorage]);

  // Apply a saved filter (updates lastUsed)
  const applyFilter = useCallback((id: string) => {
    const filter = savedFilters.find(f => f.id === id);
    if (!filter) {return null;}

    setSavedFilters(prev => {
      const updated = prev.map(f => 
        f.id === id 
          ? { ...f, lastUsed: new Date().toISOString() }
          : f
      );
      saveFiltersToStorage(updated);
      return updated;
    });

    return filter;
  }, [savedFilters, saveFiltersToStorage]);

  // Set default filter
  const setDefaultFilter = useCallback((id: string | null) => {
    setSavedFilters(prev => {
      const updated = prev.map(filter => ({
        ...filter,
        isDefault: filter.id === id,
      }));
      saveFiltersToStorage(updated);
      return updated;
    });
  }, [saveFiltersToStorage]);

  // Get default filter
  const getDefaultFilter = useCallback(() => {
    return savedFilters.find(filter => filter.isDefault) || null;
  }, [savedFilters]);

  // Check if filters match an existing saved filter
  const findMatchingFilter = useCallback((filters: Record<string, unknown>) => {
    return savedFilters.find(saved => 
      JSON.stringify(saved.filters) === JSON.stringify(filters)
    );
  }, [savedFilters]);

  // Get recently used filters
  const getRecentFilters = useCallback((limit = 5) => {
    return savedFilters
      .filter(filter => filter.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, limit);
  }, [savedFilters]);

  // Clear all saved filters
  const clearAllFilters = useCallback(() => {
    setSavedFilters([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.error('Error clearing filters:', error);
    }
  }, [storageKey]);

  return {
    savedFilters,
    isLoading,
    saveFilter,
    updateFilter,
    deleteFilter,
    applyFilter,
    setDefaultFilter,
    getDefaultFilter,
    findMatchingFilter,
    getRecentFilters,
    clearAllFilters,
  };
}