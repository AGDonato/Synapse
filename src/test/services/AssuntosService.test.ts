// src/test/services/AssuntosService.test.ts

import { describe, it, expect } from 'vitest';
import { mockAssuntos } from '../../data/mockAssuntos';

describe('AssuntosService', () => {
  describe('mockAssuntos data', () => {
    it('should have valid assuntos data', () => {
      expect(mockAssuntos).toBeDefined();
      expect(Array.isArray(mockAssuntos)).toBe(true);
      expect(mockAssuntos.length).toBeGreaterThan(0);
    });

    it('should have assuntos with required fields', () => {
      const assunto = mockAssuntos[0];
      expect(assunto).toHaveProperty('id');
      expect(assunto).toHaveProperty('nome');
      expect(typeof assunto.id).toBe('number');
      expect(typeof assunto.nome).toBe('string');
      expect(assunto.nome.length).toBeGreaterThan(0);
    });

    it('should have unique ids', () => {
      const ids = mockAssuntos.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have assuntos with reasonable nome lengths', () => {
      mockAssuntos.forEach(assunto => {
        expect(assunto.nome.length).toBeGreaterThan(1);
        expect(assunto.nome.length).toBeLessThan(101);
      });
    });

    it('should be able to find assunto by id', () => {
      const targetId = mockAssuntos[0].id;
      const found = mockAssuntos.find(a => a.id === targetId);
      expect(found).toBeDefined();
      expect(found!.id).toBe(targetId);
    });

    it('should be able to filter assuntos by nome', () => {
      const searchTerm = mockAssuntos[0].nome.split(' ')[0].toLowerCase();
      const filtered = mockAssuntos.filter(a => 
        a.nome.toLowerCase().includes(searchTerm)
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].nome.toLowerCase()).toContain(searchTerm);
    });
  });
});