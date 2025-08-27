// src/hooks/useEntityCache.ts

import { useCallback, useEffect, useState } from 'react';
import { CacheConfig, type StorageOptions, storage } from '../utils/storage';
import type { BaseEntity } from '../types/entities';

export interface UseEntityCacheOptions extends StorageOptions {
  autoSave?: boolean;
  syncTabs?: boolean;
}

export interface UseEntityCacheReturn<T extends BaseEntity> {
  // Cache state
  cachedItems: T[];
  isCacheValid: boolean;
  lastUpdated: Date | null;
  cacheSize: number;

  // Cache operations
  setCache: (items: T[]) => void;
  updateCacheItem: (item: T) => void;
  removeCacheItem: (id: number) => void;
  addCacheItem: (item: T) => void;
  clearCache: () => void;
  refreshCache: () => void;

  // Cache queries
  getCachedItem: (id: number) => T | undefined;
  searchCache: (predicate: (item: T) => boolean) => T[];
}

export function useEntityCache<T extends BaseEntity>(
  cacheKey: string,
  options: UseEntityCacheOptions = {}
): UseEntityCacheReturn<T> {
  const {
    ttl = CacheConfig.MEDIUM_TTL,
    version = '1.0',
    autoSave = true,
    syncTabs = true,
  } = options;

  const [cachedItems, setCachedItems] = useState<T[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load from cache on mount
  useEffect(() => {
    const loadCache = () => {
      const cached = storage.get<T[]>(cacheKey, version);
      if (cached) {
        setCachedItems(cached);
        setLastUpdated(new Date());
      }
    };

    loadCache();
  }, [cacheKey, version]);

  // Check if cache is valid (not expired)
  const isCacheValid = useCallback(() => {
    if (!lastUpdated) {return false;}
    if (!ttl) {return true;}
    return Date.now() - lastUpdated.getTime() < ttl;
  }, [lastUpdated, ttl]);

  // Save to cache
  const saveToCache = useCallback((items: T[]) => {
    if (autoSave) {
      storage.set(cacheKey, items, { ttl, version });
      setLastUpdated(new Date());
    }
  }, [cacheKey, ttl, version, autoSave]);

  // Set entire cache
  const setCache = useCallback((items: T[]) => {
    setCachedItems(items);
    saveToCache(items);
  }, [saveToCache]);

  // Update single item in cache
  const updateCacheItem = useCallback((item: T) => {
    setCachedItems(prev => {
      const updated = prev.map(cached => 
        cached.id === item.id ? item : cached
      );
      saveToCache(updated);
      return updated;
    });
  }, [saveToCache]);

  // Remove item from cache
  const removeCacheItem = useCallback((id: number) => {
    setCachedItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      saveToCache(filtered);
      return filtered;
    });
  }, [saveToCache]);

  // Add item to cache
  const addCacheItem = useCallback((item: T) => {
    setCachedItems(prev => {
      // Check if item already exists
      const exists = prev.some(cached => cached.id === item.id);
      if (exists) {
        return prev.map(cached => cached.id === item.id ? item : cached);
      }
      
      const updated = [...prev, item];
      saveToCache(updated);
      return updated;
    });
  }, [saveToCache]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCachedItems([]);
    storage.remove(cacheKey);
    setLastUpdated(null);
  }, [cacheKey]);

  // Refresh cache (force reload from storage)
  const refreshCache = useCallback(() => {
    const cached = storage.get<T[]>(cacheKey, version);
    if (cached) {
      setCachedItems(cached);
      setLastUpdated(new Date());
    } else {
      setCachedItems([]);
      setLastUpdated(null);
    }
  }, [cacheKey, version]);

  // Get single cached item
  const getCachedItem = useCallback((id: number): T | undefined => {
    return cachedItems.find(item => item.id === id);
  }, [cachedItems]);

  // Search cache
  const searchCache = useCallback((predicate: (item: T) => boolean): T[] => {
    return cachedItems.filter(predicate);
  }, [cachedItems]);

  // Get cache size in bytes
  const cacheSize = storage.getSize();

  // Listen for storage changes in other tabs
  useEffect(() => {
    if (!syncTabs) {return;}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `synapse_${cacheKey}`) {
        refreshCache();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [cacheKey, refreshCache, syncTabs]);

  return {
    // Cache state
    cachedItems,
    isCacheValid: isCacheValid(),
    lastUpdated,
    cacheSize,

    // Cache operations
    setCache,
    updateCacheItem,
    removeCacheItem,
    addCacheItem,
    clearCache,
    refreshCache,

    // Cache queries
    getCachedItem,
    searchCache,
  };
}