// src/test/services/AssuntosService.test.ts

import { AssuntosService } from '../../services/AssuntosService';
import { AssuntosRepository } from '../../repositories/AssuntosRepository';

// Mock the repository
vi.mock('../../repositories/AssuntosRepository', () => ({
  AssuntosRepository: vi.fn().mockImplementation(() => ({
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    count: vi.fn(),
    findByNome: vi.fn(),
    nomeExists: vi.fn(),
  })),
  assuntosRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    count: vi.fn(),
    findByNome: vi.fn(),
    nomeExists: vi.fn(),
  }
}));

describe('AssuntosService', () => {
  let service: AssuntosService;
  let mockRepository: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create service instance
    service = new AssuntosService();
    
    // Get the mocked repository instance
    mockRepository = (service as any).repository;
  });

  describe('getAll', () => {
    it('should return all assuntos successfully', async () => {
      const mockData = [
        { id: 1, nome: 'Assunto 1' },
        { id: 2, nome: 'Assunto 2' }
      ];
      
      mockRepository.findAll.mockResolvedValue(mockData);

      const result = await service.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(2);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await service.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getById', () => {
    it('should return assunto by id successfully', async () => {
      const mockAssunto = { id: 1, nome: 'Assunto 1' };
      mockRepository.findById.mockResolvedValue(mockAssunto);

      const result = await service.getById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAssunto);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return error for invalid id', async () => {
      const result = await service.getById(0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID inválido');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error for non-existent assunto', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Assunto with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create assunto successfully', async () => {
      const createData = { nome: 'Novo Assunto' };
      const mockCreated = { id: 1, nome: 'Novo Assunto' };
      
      mockRepository.findByNome.mockResolvedValue(null); // Nome não existe
      mockRepository.create.mockResolvedValue(mockCreated);

      const result = await service.create(createData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreated);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should validate required nome', async () => {
      const result = await service.create({ nome: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nome é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should validate nome length minimum', async () => {
      const result = await service.create({ nome: 'A' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nome deve ter pelo menos 2 caracteres');
    });

    it('should validate nome length maximum', async () => {
      const longName = 'A'.repeat(101);
      const result = await service.create({ nome: longName });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nome deve ter no máximo 100 caracteres');
    });

    it('should prevent duplicate names', async () => {
      const createData = { nome: 'Assunto Existente' };
      mockRepository.findByNome.mockResolvedValue({ id: 2, nome: 'Assunto Existente' });

      const result = await service.create(createData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Já existe um assunto com este nome');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update assunto successfully', async () => {
      const updateData = { nome: 'Nome Atualizado' };
      const mockUpdated = { id: 1, nome: 'Nome Atualizado' };
      
      mockRepository.exists.mockResolvedValue(true);
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdated);
    });

    it('should return error for non-existent assunto', async () => {
      mockRepository.exists.mockResolvedValue(false);

      const result = await service.update(999, { nome: 'Teste' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Assunto with ID 999 not found');
    });
  });

  describe('delete', () => {
    it('should delete assunto successfully', async () => {
      mockRepository.exists.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue(undefined);

      const result = await service.delete(1);

      expect(result.success).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return error for non-existent assunto', async () => {
      mockRepository.exists.mockResolvedValue(false);

      const result = await service.delete(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Assunto with ID 999 not found');
    });
  });

  describe('findByNome', () => {
    it('should find assunto by nome', async () => {
      const mockAssunto = { id: 1, nome: 'Teste' };
      mockRepository.findByNome.mockResolvedValue(mockAssunto);

      const result = await service.findByNome('Teste');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAssunto);
    });

    it('should validate empty nome', async () => {
      const result = await service.findByNome('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nome é obrigatório para busca');
    });
  });

  describe('checkNomeExists', () => {
    it('should check if nome exists', async () => {
      mockRepository.nomeExists.mockResolvedValue(true);

      const result = await service.checkNomeExists('Teste Existente');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should handle empty nome', async () => {
      const result = await service.checkNomeExists('');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });
});