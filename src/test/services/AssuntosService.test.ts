/**
 * TESTES DO SERVIÇO AssuntosService
 *
 * Este arquivo contém todos os testes unitários para o serviço AssuntosService.
 * Testa funcionalidades como:
 * - Operações CRUD básicas (create, read, update, delete)
 * - Validações de dados (nome obrigatório, comprimento, unicidade)
 * - Métodos específicos (findByNome, checkNomeExists, searchByPattern)
 * - Tratamento de erros e casos extremos
 * - Integração com o repository e validações
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssuntosService } from '../../services/AssuntosService';
import { assuntosRepository } from '../../repositories/AssuntosRepository';
import { ValidationError } from '../../hooks/useErrorHandler';
import type { Assunto, CreateDTO, UpdateDTO } from '../../types';

// Mock do repository
vi.mock('../../repositories/AssuntosRepository', () => ({
  assuntosRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    findByNome: vi.fn(),
    nomeExists: vi.fn(),
    findByNomePattern: vi.fn(),
  },
}));

const mockRepository = vi.mocked(assuntosRepository);

// Dados de teste
const mockAssuntos: Assunto[] = [
  { id: 1, nome: 'Fraude Bancária', descricao: 'Investigações de fraudes financeiras' },
  { id: 2, nome: 'Lavagem de Dinheiro', descricao: 'Crimes de lavagem de capitais' },
  { id: 3, nome: 'Corrupção Pública', descricao: 'Casos de corrupção no setor público' },
];

const validCreateData: CreateDTO<Assunto> = {
  nome: 'Novo Assunto Teste',
  descricao: 'Descrição do teste',
};

const validUpdateData: UpdateDTO<Assunto> = {
  nome: 'Assunto Atualizado',
  descricao: 'Descrição atualizada',
};

describe('AssuntosService', () => {
  let service: AssuntosService;

  beforeEach(() => {
    service = new AssuntosService();
    vi.clearAllMocks();
  });

  describe('Operações CRUD Básicas', () => {
    describe('create', () => {
      it('cria assunto com dados válidos', async () => {
        const novoAssunto = { ...mockAssuntos[0], id: 4 };
        mockRepository.findByNome.mockResolvedValue(null);
        mockRepository.create.mockResolvedValue(novoAssunto);

        const result = await service.create(validCreateData);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(novoAssunto);
        expect(mockRepository.findByNome).toHaveBeenCalledWith(validCreateData.nome.trim());
        expect(mockRepository.create).toHaveBeenCalledWith(validCreateData);
      });

      it('rejeita criação com nome vazio', async () => {
        const dadosInvalidos = { ...validCreateData, nome: '' };

        const result = await service.create(dadosInvalidos);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Nome é obrigatório');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('rejeita criação com nome muito curto', async () => {
        const dadosInvalidos = { ...validCreateData, nome: 'A' };

        const result = await service.create(dadosInvalidos);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Nome deve ter pelo menos 2 caracteres');
      });

      it('rejeita criação com nome muito longo', async () => {
        const nomeLongo = 'A'.repeat(101);
        const dadosInvalidos = { ...validCreateData, nome: nomeLongo };

        const result = await service.create(dadosInvalidos);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Nome deve ter no máximo 100 caracteres');
      });

      it('rejeita criação com nome duplicado', async () => {
        mockRepository.findByNome.mockResolvedValue(mockAssuntos[0]);

        const result = await service.create(validCreateData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Já existe um assunto com este nome');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      it('atualiza assunto com dados válidos', async () => {
        const assuntoAtualizado = { ...mockAssuntos[0], ...validUpdateData };
        mockRepository.exists.mockResolvedValue(true);
        mockRepository.findByNome.mockResolvedValue(null);
        mockRepository.update.mockResolvedValue(assuntoAtualizado);

        const result = await service.update(1, validUpdateData);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(assuntoAtualizado);
        expect(mockRepository.update).toHaveBeenCalledWith(1, validUpdateData);
      });

      it('rejeita atualização com nome duplicado em outro registro', async () => {
        const assuntoExistente = { ...mockAssuntos[1] }; // ID diferente
        mockRepository.exists.mockResolvedValue(true);
        mockRepository.findByNome.mockResolvedValue(assuntoExistente);

        const result = await service.update(1, validUpdateData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Já existe um assunto com este nome');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('permite atualização com o mesmo nome do próprio registro', async () => {
        const assuntoMesmoId = { ...mockAssuntos[0], id: 1 };
        const assuntoAtualizado = { ...assuntoMesmoId, descricao: 'Nova descrição' };

        mockRepository.exists.mockResolvedValue(true);
        mockRepository.findByNome.mockResolvedValue(assuntoMesmoId);
        mockRepository.update.mockResolvedValue(assuntoAtualizado);

        const result = await service.update(1, {
          nome: mockAssuntos[0].nome,
          descricao: 'Nova descrição',
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(assuntoAtualizado);
      });
    });
  });

  describe('Métodos Específicos', () => {
    describe('findByNome', () => {
      it('encontra assunto por nome existente', async () => {
        const assuntoProcurado = mockAssuntos[0];
        mockRepository.findByNome.mockResolvedValue(assuntoProcurado);

        const result = await service.findByNome('Fraude Bancária');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(assuntoProcurado);
        expect(mockRepository.findByNome).toHaveBeenCalledWith('Fraude Bancária');
      });

      it('retorna undefined para nome não encontrado', async () => {
        mockRepository.findByNome.mockResolvedValue(null);

        const result = await service.findByNome('Assunto Inexistente');

        expect(result.success).toBe(true);
        expect(result.data).toBeUndefined();
      });

      it('rejeita busca com nome vazio', async () => {
        const result = await service.findByNome('');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Nome é obrigatório para busca');
        expect(mockRepository.findByNome).not.toHaveBeenCalled();
      });

      it('remove espaços em branco do nome', async () => {
        mockRepository.findByNome.mockResolvedValue(mockAssuntos[0]);

        await service.findByNome('  Fraude Bancária  ');

        expect(mockRepository.findByNome).toHaveBeenCalledWith('Fraude Bancária');
      });
    });

    describe('checkNomeExists', () => {
      it('retorna true para nome existente', async () => {
        mockRepository.nomeExists.mockResolvedValue(true);

        const result = await service.checkNomeExists('Fraude Bancária');

        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
        expect(mockRepository.nomeExists).toHaveBeenCalledWith('Fraude Bancária', undefined);
      });

      it('retorna false para nome não existente', async () => {
        mockRepository.nomeExists.mockResolvedValue(false);

        const result = await service.checkNomeExists('Assunto Novo');

        expect(result.success).toBe(true);
        expect(result.data).toBe(false);
      });

      it('exclui ID específico da verificação', async () => {
        mockRepository.nomeExists.mockResolvedValue(false);

        const result = await service.checkNomeExists('Fraude Bancária', 1);

        expect(result.success).toBe(true);
        expect(mockRepository.nomeExists).toHaveBeenCalledWith('Fraude Bancária', 1);
      });

      it('retorna false para nome vazio', async () => {
        const result = await service.checkNomeExists('');

        expect(result.success).toBe(true);
        expect(result.data).toBe(false);
        expect(mockRepository.nomeExists).not.toHaveBeenCalled();
      });
    });

    describe('searchByPattern', () => {
      it('busca assuntos por padrão', async () => {
        const resultadosEsperados = [mockAssuntos[0], mockAssuntos[1]];
        mockRepository.findByNomePattern.mockResolvedValue(resultadosEsperados);

        const result = await service.searchByPattern('fraud');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(resultadosEsperados);
        expect(mockRepository.findByNomePattern).toHaveBeenCalledWith('fraud');
      });

      it('retorna array vazio quando não encontra resultados', async () => {
        mockRepository.findByNomePattern.mockResolvedValue([]);

        const result = await service.searchByPattern('inexistente');

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      it('rejeita busca com padrão vazio', async () => {
        const result = await service.searchByPattern('');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Padrão de busca é obrigatório');
        expect(mockRepository.findByNomePattern).not.toHaveBeenCalled();
      });

      it('remove espaços em branco do padrão', async () => {
        mockRepository.findByNomePattern.mockResolvedValue([]);

        await service.searchByPattern('  fraud  ');

        expect(mockRepository.findByNomePattern).toHaveBeenCalledWith('fraud');
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('trata erros do repository na criação', async () => {
      const erro = new Error('Erro de conexão');
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.create.mockRejectedValue(erro);

      const result = await service.create(validCreateData);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('trata erros do repository na busca por nome', async () => {
      const erro = new Error('Erro de conexão');
      mockRepository.findByNome.mockRejectedValue(erro);

      const result = await service.findByNome('Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
