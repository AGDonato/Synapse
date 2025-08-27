// src/test/schemas/entities.test.ts
import { describe, it, expect } from 'vitest';
import { 
  DemandaSchema, 
  CreateDemandaSchema, 
  UpdateDemandaSchema,
  DocumentoSchema,
  CreateDocumentoSchema 
} from '../../schemas/entities';

describe('Entity Schemas', () => {
  describe('DemandaSchema', () => {
    it('should validate a complete valid demanda', () => {
      const validDemanda = {
        id: 1,
        sged: '12345',
        tipoDemanda: 'Investigação cibernética',
        assunto: 'Fraude bancária',
        orgaoRequisitante: 'Polícia Civil',
        autoridade: 'Dr. João Silva',
        autosAdministrativos: 'AUTO-123/2024',
        dataInicial: '15/01/2024',
        dataFinal: '30/01/2024',
        status: 'ativo',
        prioridade: 'alta',
        observacoes: 'Caso urgente'
      };

      const result = DemandaSchema.safeParse(validDemanda);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidDemanda = {
        id: 1,
        sged: '12345',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '2024-01-15', // Wrong format
        status: 'ativo',
        prioridade: 'alta'
      };

      const result = DemandaSchema.safeParse(invalidDemanda);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('DD/MM/AAAA');
    });

    it('should reject invalid status', () => {
      const invalidDemanda = {
        id: 1,
        sged: '12345',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '15/01/2024',
        status: 'invalid_status',
        prioridade: 'alta'
      };

      const result = DemandaSchema.safeParse(invalidDemanda);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric SGED', () => {
      const invalidDemanda = {
        id: 1,
        sged: 'ABC123',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '15/01/2024',
        status: 'ativo',
        prioridade: 'alta'
      };

      const result = DemandaSchema.safeParse(invalidDemanda);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('apenas números');
    });
  });

  describe('CreateDemandaSchema', () => {
    it('should validate demanda creation without id and audit fields', () => {
      const createData = {
        sged: '12345',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '15/01/2024',
        status: 'ativo',
        prioridade: 'alta'
      };

      const result = CreateDemandaSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });

    it('should reject creation data with id', () => {
      const createData = {
        id: 1, // Should not be present
        sged: '12345',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '15/01/2024',
        status: 'ativo',
        prioridade: 'alta'
      };

      const result = CreateDemandaSchema.safeParse(createData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateDemandaSchema', () => {
    it('should allow partial updates with required id', () => {
      const updateData = {
        id: 1,
        status: 'inativo',
        observacoes: 'Atualização parcial'
      };

      const result = UpdateDemandaSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should require id for updates', () => {
      const updateData = {
        status: 'inativo'
      };

      const result = UpdateDemandaSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });

  describe('DocumentoSchema', () => {
    it('should validate a complete valid documento', () => {
      const validDocumento = {
        id: 1,
        demandaId: 1,
        sgedDemanda: '12345',
        tipoDocumento: 'Ofício',
        destinatario: 'Banco do Brasil',
        enderecamento: 'Agência Centro',
        assunto: 'Requisição de dados',
        tipoMidia: 'Email',
        dataEnvio: '15/01/2024',
        dataResposta: '20/01/2024',
        status: 'ativo'
      };

      const result = DocumentoSchema.safeParse(validDocumento);
      expect(result.success).toBe(true);
    });

    it('should allow optional enderecamento', () => {
      const documento = {
        id: 1,
        demandaId: 1,
        sgedDemanda: '12345',
        tipoDocumento: 'Ofício',
        destinatario: 'Banco do Brasil',
        assunto: 'Requisição de dados',
        tipoMidia: 'Email',
        dataEnvio: '15/01/2024',
        status: 'ativo'
      };

      const result = DocumentoSchema.safeParse(documento);
      expect(result.success).toBe(true);
    });
  });

  describe('Date validation edge cases', () => {
    it('should reject invalid dates like 31/02/2024', () => {
      const invalidData = {
        id: 1,
        sged: '12345',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '31/02/2024', // Invalid date
        status: 'ativo',
        prioridade: 'alta'
      };

      const result = DemandaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Data inválida');
    });

    it('should accept leap year dates', () => {
      const validData = {
        id: 1,
        sged: '12345',
        tipoDemanda: 'Test',
        assunto: 'Test',
        orgaoRequisitante: 'Test',
        autoridade: 'Test',
        dataInicial: '29/02/2024', // Valid leap year date
        status: 'ativo',
        prioridade: 'alta'
      };

      const result = DemandaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});