// src/hooks/useLocalStorage.ts

import { useState, useEffect, useCallback } from 'react';
import { storage, type StorageOptions } from '../utils/storage';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from storage or use provided default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.get<T>(key, options.version);
      return item !== null ? item : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.set(key, valueToStore, options);
    } catch {
      // Error handling for localStorage set
    }
  }, [key, storedValue, options]);

  // Remove item from storage
  const removeValue = useCallback(() => {
    try {
      storage.remove(key);
      setStoredValue(initialValue);
    } catch {
      // Error handling for localStorage remove
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `synapse_${key}`) {
        try {
          const item = storage.get<T>(key, options.version);
          if (item !== null) {
            setStoredValue(item);
          }
        } catch {
          // Error handling for localStorage sync
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, options.version]);

  return [storedValue, setValue, removeValue];
}