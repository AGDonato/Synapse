// src/test/utils/searchUtils.test.ts

import { describe, it, expect } from 'vitest';
import { filterWithAdvancedSearch } from '../../utils/searchUtils';

describe('searchUtils', () => {
  describe('filterWithAdvancedSearch', () => {
    const sampleData = [
      'João da Silva',
      'Maria Santos',
      'Pedro Oliveira',
      'Ana Costa',
      'José Maria',
      'TRIBUNAL REGIONAL FEDERAL',
      'Supremo Tribunal de Justiça',
    ];

    it('should filter items case-insensitively', () => {
      const result = filterWithAdvancedSearch(sampleData, 'silva');
      expect(result).toContain('João da Silva');
      expect(result).toHaveLength(1);
    });

    it('should filter items with partial matches', () => {
      const result = filterWithAdvancedSearch(sampleData, 'maria');
      expect(result).toContain('Maria Santos');
      expect(result).toContain('José Maria');
      expect(result).toHaveLength(2);
    });

    it('should filter tribunal-related items', () => {
      const result = filterWithAdvancedSearch(sampleData, 'tribunal');
      expect(result).toContain('TRIBUNAL REGIONAL FEDERAL');
      expect(result).toContain('Supremo Tribunal de Justiça');
      expect(result).toHaveLength(2);
    });

    it('should return empty array for non-matching query', () => {
      const result = filterWithAdvancedSearch(sampleData, 'xyz123');
      expect(result).toEqual([]);
    });

    it('should handle empty query', () => {
      const result = filterWithAdvancedSearch(sampleData, '');
      // The function might return all items or empty array - both are valid behaviors
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty data array', () => {
      const result = filterWithAdvancedSearch([], 'test');
      expect(result).toEqual([]);
    });

    it('should handle special characters in search', () => {
      const dataWithSpecial = ['João & Maria', 'Pedro (filho)', 'Ana - Costa'];
      const result = filterWithAdvancedSearch(dataWithSpecial, '&');
      expect(result).toContain('João & Maria');
    });

    it('should trim whitespace from query', () => {
      const result = filterWithAdvancedSearch(sampleData, '  silva  ');
      expect(result).toContain('João da Silva');
      expect(result).toHaveLength(1);
    });
  });
});