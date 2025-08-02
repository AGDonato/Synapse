// src/test/utils/storage.test.ts

import { storage, CacheConfig } from '../../utils/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('basic operations', () => {
    it('should set and get data', () => {
      const testData = { id: 1, name: 'Test' };
      
      const result = storage.set('test', testData);
      expect(result).toBe(true);
      
      const retrieved = storage.get('test');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should remove data', () => {
      storage.set('test', 'data');
      expect(storage.get('test')).toBe('data');
      
      const result = storage.remove('test');
      expect(result).toBe(true);
      expect(storage.get('test')).toBeNull();
    });

    it('should check if key exists', () => {
      expect(storage.exists('test')).toBe(false);
      
      storage.set('test', 'data');
      expect(storage.exists('test')).toBe(true);
    });

    it('should clear all synapse data', () => {
      storage.set('test1', 'data1');
      storage.set('test2', 'data2');
      // Set non-synapse data
      localStorage.setItem('other_key', 'other_data');
      
      storage.clear();
      
      expect(storage.get('test1')).toBeNull();
      expect(storage.get('test2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('other_data');
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should respect TTL and expire data', () => {
      const testData = 'test data';
      storage.set('test', testData, { ttl: 1000 }); // 1 second TTL
      
      // Should exist immediately
      expect(storage.get('test')).toBe(testData);
      
      // Fast forward 500ms - should still exist
      vi.advanceTimersByTime(500);
      expect(storage.get('test')).toBe(testData);
      
      // Fast forward another 600ms (total 1100ms) - should be expired
      vi.advanceTimersByTime(600);
      expect(storage.get('test')).toBeNull();
    });

    it('should not expire data without TTL', () => {
      const testData = 'persistent data';
      storage.set('test', testData); // No TTL
      
      // Fast forward a lot
      vi.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
      
      expect(storage.get('test')).toBe(testData);
    });
  });

  describe('versioning', () => {
    it('should respect version compatibility', () => {
      const testData = 'version test';
      storage.set('test', testData, { version: '1.0' });
      
      // Get with same version
      expect(storage.get('test', '1.0')).toBe(testData);
      
      // Get with different version should return null
      expect(storage.get('test', '2.0')).toBeNull();
      
      // Re-add the data since it was removed by the previous check
      storage.set('test', testData, { version: '1.0' });
      
      // Get without version when item has version should return the data
      expect(storage.get('test')).toBe(testData);
    });

    it('should handle version upgrade scenarios', () => {
      // Set data with v1.0
      storage.set('test', { old: 'data' }, { version: '1.0' });
      expect(storage.get('test', '1.0')).toEqual({ old: 'data' });
      
      // Try to get with v2.0 - should invalidate cache
      expect(storage.get('test', '2.0')).toBeNull();
      
      // Original data should be removed
      expect(storage.get('test', '1.0')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Manually corrupt the stored data
      localStorage.setItem('synapse_test', 'invalid json');
      
      const result = storage.get('test');
      expect(result).toBeNull();
      
      // Should clean up corrupted data
      expect(localStorage.getItem('synapse_test')).toBeNull();
    });

    it('should handle localStorage quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      const result = storage.set('test', 'data');
      expect(result).toBe(false);
      
      localStorage.setItem = originalSetItem;
    });
  });

  describe('utility methods', () => {
    it('should get storage size', () => {
      storage.set('test1', 'short');
      storage.set('test2', 'a longer string for testing');
      
      const size = storage.getSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should get all keys', () => {
      storage.set('test1', 'data1');
      storage.set('test2', 'data2');
      localStorage.setItem('other_key', 'other');
      
      const keys = storage.getKeys();
      expect(keys).toContain('test1');
      expect(keys).toContain('test2');
      expect(keys).not.toContain('other_key');
    });
  });

  describe('cache configuration', () => {
    it('should have proper cache configurations', () => {
      expect(CacheConfig.SHORT_TTL).toBe(5 * 60 * 1000);
      expect(CacheConfig.MEDIUM_TTL).toBe(30 * 60 * 1000);
      expect(CacheConfig.LONG_TTL).toBe(2 * 60 * 60 * 1000);
      expect(CacheConfig.VERY_LONG_TTL).toBe(24 * 60 * 60 * 1000);
    });
  });
});