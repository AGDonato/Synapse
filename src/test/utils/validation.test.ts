/**
 * Tests for validation utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  safeValidate,
  validate,
  validateForm,
  commonSchemas,
  entitySchemas,
  ValidationError,
  MultiValidationError,
} from '../../utils/validation';

describe('Validation Utilities', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('safeValidate', () => {
    it('retorna sucesso para dados válidos', () => {
      const schema = z.string().min(3);
      const result = safeValidate(schema, 'hello', 'test-field');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('retorna erro para dados inválidos', () => {
      const schema = z.string().min(5);
      const result = safeValidate(schema, 'hi', 'test-field');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe('test-field');
      }
    });

    it('retorna múltiplos erros quando aplicável', () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18),
      });

      const result = safeValidate(schema, {
        name: 'A',
        email: 'invalid-email',
        age: 15,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(MultiValidationError);
        const multiError = result.error as MultiValidationError;
        expect(multiError.errors.length).toBeGreaterThan(1);
      }
    });

    it('lida com exceções na validação', () => {
      const badSchema = {
        safeParse: () => {
          throw new Error('Schema error');
        }
      } as any;

      const result = safeValidate(badSchema, 'test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Validation failed');
      }
    });
  });

  describe('validate', () => {
    it('retorna dados válidos diretamente', () => {
      const schema = z.string().min(3);
      const result = validate(schema, 'hello');

      expect(result).toBe('hello');
    });

    it('lança erro para dados inválidos', () => {
      const schema = z.string().min(5);

      expect(() => {
        validate(schema, 'hi');
      }).toThrow(ValidationError);
    });
  });

  describe('validateForm', () => {
    it('valida formulário com sucesso', () => {
      const formData = {
        name: 'João Silva',
        email: 'joao@example.com',
        age: 25,
      };

      const validators = {
        name: { schema: z.string().min(2), required: true },
        email: { schema: z.string().email(), required: true },
        age: { schema: z.number().min(18), required: true },
      };

      const result = validateForm(formData, validators);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('retorna erros para campos obrigatórios ausentes', () => {
      const formData = {
        name: '',
        email: 'joao@example.com',
        age: 25,
      };

      const validators = {
        name: { schema: z.string().min(2), required: true },
        email: { schema: z.string().email(), required: true },
      };

      const result = validateForm(formData, validators);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Este campo é obrigatório');
    });

    it('executa validação customizada', () => {
      const formData = {
        password: 'weak',
        confirmPassword: 'different',
      };

      const validators = {
        password: {
          schema: z.string().min(8),
          required: true,
          custom: (value: string) => {
            if (!/[A-Z]/.test(value)) {
              return 'Senha deve conter ao menos uma letra maiúscula';
            }
            return null;
          },
        },
      };

      const result = validateForm(formData, validators);

      expect(result.isValid).toBe(false);
      expect(result.errors.password).toContain('maiúscula');
    });

    it('pula validação para campos opcionais vazios', () => {
      const formData = {
        name: 'João',
        description: '',
      };

      const validators = {
        name: { schema: z.string().min(2), required: true },
        description: { schema: z.string().min(10), required: false },
      };

      const result = validateForm(formData, validators);

      expect(result.isValid).toBe(true);
    });
  });

  describe('commonSchemas', () => {
    it('valida ID corretamente', () => {
      expect(() => validate(commonSchemas.id, 1)).not.toThrow();
      expect(() => validate(commonSchemas.id, 0)).toThrow();
      expect(() => validate(commonSchemas.id, -1)).toThrow();
      expect(() => validate(commonSchemas.id, 'string')).toThrow();
    });

    it('valida email corretamente', () => {
      expect(() => validate(commonSchemas.email, 'user@example.com')).not.toThrow();
      expect(() => validate(commonSchemas.email, 'invalid-email')).toThrow();
      expect(() => validate(commonSchemas.email, '@example.com')).toThrow();
      expect(() => validate(commonSchemas.email, 'user@')).toThrow();
    });

    it('valida telefone corretamente', () => {
      expect(() => validate(commonSchemas.phone, '(11) 99999-9999')).not.toThrow();
      expect(() => validate(commonSchemas.phone, '(11) 9999-9999')).not.toThrow();
      expect(() => validate(commonSchemas.phone, '11 99999-9999')).toThrow();
      expect(() => validate(commonSchemas.phone, '999999999')).toThrow();
    });

    it('valida CNPJ corretamente', () => {
      expect(() => validate(commonSchemas.cnpj, '12.345.678/0001-90')).not.toThrow();
      expect(() => validate(commonSchemas.cnpj, '12345678000190')).toThrow();
      expect(() => validate(commonSchemas.cnpj, '12.345.678/0001')).toThrow();
    });

    it('valida texto não vazio', () => {
      expect(() => validate(commonSchemas.nonEmptyString, 'hello')).not.toThrow();
      expect(() => validate(commonSchemas.nonEmptyString, '   hello   ')).not.toThrow();
      expect(() => validate(commonSchemas.nonEmptyString, '')).toThrow();
      expect(() => validate(commonSchemas.nonEmptyString, '   ')).toThrow();
    });

    it('valida prioridade corretamente', () => {
      expect(() => validate(commonSchemas.priority, 'baixa')).not.toThrow();
      expect(() => validate(commonSchemas.priority, 'media')).not.toThrow();
      expect(() => validate(commonSchemas.priority, 'alta')).not.toThrow();
      expect(() => validate(commonSchemas.priority, 'urgente')).not.toThrow();
      expect(() => validate(commonSchemas.priority, 'invalid')).toThrow();
    });

    it('valida data futura', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // +1 day
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // -1 day

      expect(() => validate(commonSchemas.futureDate, futureDate)).not.toThrow();
      expect(() => validate(commonSchemas.futureDate, pastDate)).toThrow();
    });

    it('valida arquivo corretamente', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const notFile = { name: 'fake.txt' };

      expect(() => validate(commonSchemas.file, file)).not.toThrow();
      expect(() => validate(commonSchemas.file, notFile)).toThrow();
    });
  });

  describe('entitySchemas', () => {
    it('valida dados de demanda', () => {
      const validDemanda = {
        numero: 'DEM-2023-001',
        titulo: 'Demanda de teste',
        descricao: 'Descrição detalhada da demanda',
        prioridade: 'media' as const,
        data_prazo: new Date(Date.now() + 86400000).toISOString(),
      };

      expect(() => {
        Object.entries(entitySchemas.demanda).forEach(([key, schema]) => {
          validate(schema, validDemanda[key as keyof typeof validDemanda]);
        });
      }).not.toThrow();
    });

    it('valida dados de documento', () => {
      const validDocumento = {
        numero: 'DOC-2023-001',
        assunto: 'Documento de teste',
        destinatario: 'Órgão Teste',
        enderecamento: 'Endereço opcional',
        data_prazo_resposta: new Date(Date.now() + 86400000).toISOString(),
      };

      expect(() => {
        Object.entries(entitySchemas.documento).forEach(([key, schema]) => {
          const value = validDocumento[key as keyof typeof validDocumento];
          if (value !== undefined) {
            validate(schema, value);
          }
        });
      }).not.toThrow();
    });

    it('valida dados de órgão', () => {
      const validOrgao = {
        nome: 'Órgão Teste',
        nomeCompleto: 'Órgão de Teste Completo',
        sigla: 'OTC',
        tipo: 'federal' as const,
      };

      expect(() => {
        Object.entries(entitySchemas.orgao).forEach(([key, schema]) => {
          validate(schema, validOrgao[key as keyof typeof validOrgao]);
        });
      }).not.toThrow();
    });

    it('valida dados de provedor', () => {
      const validProvedor = {
        nomeFantasia: 'Empresa Teste',
        razaoSocial: 'Empresa de Teste LTDA',
        cnpj: '12.345.678/0001-90',
        email: 'contato@empresa.com',
        telefone: '(11) 99999-9999',
      };

      expect(() => {
        Object.entries(entitySchemas.provedor).forEach(([key, schema]) => {
          const value = validProvedor[key as keyof typeof validProvedor];
          if (value !== undefined) {
            validate(schema, value);
          }
        });
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('cria ValidationError corretamente', () => {
      const error = new ValidationError('Test error', 'testField', 'testValue');

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
      expect(error.value).toBe('testValue');
      expect(error).toBeInstanceOf(Error);
    });

    it('cria MultiValidationError corretamente', () => {
      const errors = [
        new ValidationError('Error 1', 'field1', 'value1'),
        new ValidationError('Error 2', 'field2', 'value2'),
      ];
      const multiError = new MultiValidationError('Multiple errors', errors);

      expect(multiError.name).toBe('MultiValidationError');
      expect(multiError.message).toBe('Multiple errors');
      expect(multiError.errors).toEqual(errors);
      expect(multiError).toBeInstanceOf(Error);
    });
  });

  describe('batch validation', () => {
    it('valida múltiplos itens corretamente', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: '' }, // Invalid
      ];

      const validator = (item: { id: number; name: string }) => {
        return safeValidate(z.object({
          id: z.number().positive(),
          name: z.string().min(1),
        }), item);
      };

      // This would need to be implemented in the validation utils
      const results = items.map(validator);
      
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(true);
      expect(results[2]!.success).toBe(false);
    });
  });
});