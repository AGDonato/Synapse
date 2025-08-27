// src/test/integration/dataIntegration.test.ts

import { describe, it, expect } from 'vitest';
import { mockAssuntos } from '../../data/mockAssuntos';
import { mockProvedores } from '../../data/mockProvedores';
import { mockOrgaos } from '../../data/mockOrgaos';
import { mockAutoridades } from '../../data/mockAutoridades';
import { filterWithAdvancedSearch } from '../../utils/searchUtils';

describe('Data Integration', () => {
  describe('Mock Data Consistency', () => {
    it('should have consistent data structures across all mock files', () => {
      // Test assuntos structure
      expect(mockAssuntos.length).toBeGreaterThan(0);
      mockAssuntos.forEach(assunto => {
        expect(assunto).toHaveProperty('id');
        expect(assunto).toHaveProperty('nome');
        expect(typeof assunto.id).toBe('number');
        expect(typeof assunto.nome).toBe('string');
      });

      // Test provedores structure
      expect(mockProvedores.length).toBeGreaterThan(0);
      mockProvedores.forEach(provedor => {
        expect(provedor).toHaveProperty('id');
        expect(provedor).toHaveProperty('nomeFantasia');
        expect(typeof provedor.id).toBe('number');
        expect(typeof provedor.nomeFantasia).toBe('string');
      });

      // Test orgaos structure
      expect(mockOrgaos.length).toBeGreaterThan(0);
      mockOrgaos.forEach(orgao => {
        expect(orgao).toHaveProperty('id');
        expect(orgao).toHaveProperty('nomeCompleto');
        expect(typeof orgao.id).toBe('number');
        expect(typeof orgao.nomeCompleto).toBe('string');
      });

      // Test autoridades structure
      expect(mockAutoridades.length).toBeGreaterThan(0);
      mockAutoridades.forEach(autoridade => {
        expect(autoridade).toHaveProperty('id');
        expect(autoridade).toHaveProperty('nome');
        expect(typeof autoridade.id).toBe('number');
        expect(typeof autoridade.nome).toBe('string');
      });
    });

    it('should have unique IDs across all entities', () => {
      const assuntoIds = mockAssuntos.map(a => a.id);
      const provedorIds = mockProvedores.map(p => p.id);
      const orgaoIds = mockOrgaos.map(o => o.id);
      const autoridadeIds = mockAutoridades.map(a => a.id);

      // Check for unique IDs within each dataset
      expect(new Set(assuntoIds).size).toBe(assuntoIds.length);
      expect(new Set(provedorIds).size).toBe(provedorIds.length);
      expect(new Set(orgaoIds).size).toBe(orgaoIds.length);
      expect(new Set(autoridadeIds).size).toBe(autoridadeIds.length);
    });
  });

  describe('Search Integration', () => {
    it('should work with all data types using search utils', () => {
      // Search in assuntos
      const assuntoNames = mockAssuntos.map(a => a.nome);
      const searchResult1 = filterWithAdvancedSearch(assuntoNames, 'direito');
      expect(Array.isArray(searchResult1)).toBe(true);

      // Search in provedores
      const provedorNames = mockProvedores.map(p => p.nomeFantasia);
      const searchResult2 = filterWithAdvancedSearch(provedorNames, 'ltda');
      expect(Array.isArray(searchResult2)).toBe(true);

      // Search in orgaos
      const orgaoNames = mockOrgaos.map(o => o.nomeCompleto);
      const searchResult3 = filterWithAdvancedSearch(orgaoNames, 'promotoria');
      expect(Array.isArray(searchResult3)).toBe(true);

      // Search in autoridades
      const autoridadeNames = mockAutoridades.map(a => a.nome);
      const searchResult4 = filterWithAdvancedSearch(autoridadeNames, 'silva');
      expect(Array.isArray(searchResult4)).toBe(true);
    });

    it('should handle cross-references between data sets', () => {
      // Test that we can find related entities
      const sampleProvedor = mockProvedores[0];
      const sampleOrgao = mockOrgaos[0];
      
      expect(sampleProvedor).toBeDefined();
      expect(sampleOrgao).toBeDefined();
      
      // Should be able to filter and find relationships
      const filteredProvedores = mockProvedores.filter(p => 
        p.nomeFantasia.toLowerCase().includes('empresa')
      );
      expect(Array.isArray(filteredProvedores)).toBe(true);
    });
  });

  describe('Data Transformation', () => {
    it('should be able to transform data for dropdown components', () => {
      // Transform assuntos for dropdown
      const assuntoOptions = mockAssuntos.map(a => ({
        value: a.id.toString(),
        label: a.nome
      }));

      expect(assuntoOptions.length).toBe(mockAssuntos.length);
      assuntoOptions.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });

      // Transform provedores for autocomplete
      const provedorSuggestions = mockProvedores.map(p => p.nomeFantasia);
      expect(provedorSuggestions.length).toBe(mockProvedores.length);
      provedorSuggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should support sorting and filtering operations', () => {
      // Test sorting
      const sortedAssuntos = [...mockAssuntos].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      expect(sortedAssuntos.length).toBe(mockAssuntos.length);
      expect(sortedAssuntos[0].nome <= sortedAssuntos[1].nome).toBe(true);

      // Test filtering
      const filteredOrgaos = mockOrgaos.filter(o => 
        o.nomeCompleto.toLowerCase().includes('promotoria')
      );
      expect(Array.isArray(filteredOrgaos)).toBe(true);
      filteredOrgaos.forEach(orgao => {
        expect(orgao.nomeCompleto.toLowerCase()).toContain('promotoria');
      });
    });

    it('should handle pagination-like operations', () => {
      const pageSize = 10;
      const page1 = mockAssuntos.slice(0, pageSize);
      const page2 = mockAssuntos.slice(pageSize, pageSize * 2);

      expect(page1.length).toBeLessThanOrEqual(pageSize);
      expect(page2.length).toBeLessThanOrEqual(pageSize);
      
      if (mockAssuntos.length > pageSize) {
        expect(page1.length).toBe(pageSize);
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields are present', () => {
      // All entities should have required fields
      const validateEntity = (entity: any, requiredFields: string[]) => {
        requiredFields.forEach(field => {
          expect(entity).toHaveProperty(field);
          expect(entity[field]).toBeTruthy();
        });
      };

      mockAssuntos.forEach(a => validateEntity(a, ['id', 'nome']));
      mockProvedores.forEach(p => validateEntity(p, ['id', 'nomeFantasia']));
      mockOrgaos.forEach(o => validateEntity(o, ['id', 'nomeCompleto']));
      mockAutoridades.forEach(a => validateEntity(a, ['id', 'nome']));
    });

    it('should have reasonable data sizes for performance', () => {
      // Ensure datasets are reasonable for UI performance
      expect(mockAssuntos.length).toBeLessThan(1000);
      expect(mockProvedores.length).toBeLessThan(1000);
      expect(mockOrgaos.length).toBeLessThan(1000);
      expect(mockAutoridades.length).toBeLessThan(1000);

      // Ensure individual entries are reasonable
      mockAssuntos.forEach(a => {
        expect(a.nome.length).toBeLessThan(200);
      });
      
      mockOrgaos.forEach(o => {
        expect(o.nomeCompleto.length).toBeLessThan(300);
      });
    });
  });
});