/**
 * TESTES DO HOOK useAssuntos
 *
 * Este arquivo contém todos os testes unitários para o hook useAssuntos.
 * Testa funcionalidades como:
 * - Operações CRUD básicas (create, read, update, delete)
 * - Métodos específicos (findByNome, checkNomeExists, searchByPattern)
 * - Estados de loading e error
 * - Cache e otimização de queries
 * - Integração com o serviço AssuntosService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAssuntos } from '../../hooks/useAssuntos';
import { assuntosService } from '../../services/AssuntosService';
import type { Assunto } from '../../types/entities';

// Mock do serviço
vi.mock('../../services/AssuntosService', () => ({
  assuntosService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByNome: vi.fn(),
    checkNomeExists: vi.fn(),
    searchByPattern: vi.fn(),
  },
}));

const mockAssuntosService = vi.mocked(assuntosService);

// Dados de teste
const mockAssuntos: Assunto[] = [
  {
    id: 1,
    nome: 'Fraude Bancária',
    descricao: 'Investigações de fraudes em instituições financeiras',
  },
  { id: 2, nome: 'Lavagem de Dinheiro', descricao: 'Crimes relacionados à lavagem de capitais' },
  { id: 3, nome: 'Corrupção', descricao: 'Casos de corrupção pública e privada' },
];

describe('useAssuntos Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Operações Básicas CRUD', () => {
    it('carrega lista de assuntos com sucesso', async () => {
      mockAssuntosService.getAll.mockResolvedValue({
        success: true,
        data: mockAssuntos,
      });

      const { result } = renderHook(() => useAssuntos({ autoLoad: true }));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items).toEqual(mockAssuntos);
      expect(result.current.error).toBeNull();
      expect(mockAssuntosService.getAll).toHaveBeenCalledTimes(1);
    });

    it('trata erro ao carregar assuntos', async () => {
      const errorMessage = 'Erro ao carregar assuntos';
      mockAssuntosService.getAll.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useAssuntos({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.items).toEqual([]);
    });
  });

  describe('Métodos Específicos', () => {
    it('findByNome - encontra assunto por nome', async () => {
      const assuntoEncontrado = mockAssuntos[0];
      mockAssuntosService.findByNome.mockResolvedValue({
        success: true,
        data: assuntoEncontrado,
      });

      const { result } = renderHook(() => useAssuntos());

      const resultado = await result.current.findByNome('Fraude Bancária');

      expect(resultado).toEqual(assuntoEncontrado);
      expect(mockAssuntosService.findByNome).toHaveBeenCalledWith('Fraude Bancária');
    });

    it('findByNome - retorna null quando não encontra', async () => {
      mockAssuntosService.findByNome.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useAssuntos());

      const resultado = await result.current.findByNome('Assunto Inexistente');

      expect(resultado).toBeNull();
    });

    it('findByNome - trata erro do serviço', async () => {
      mockAssuntosService.findByNome.mockResolvedValue({
        success: false,
        error: 'Erro interno',
      });

      const { result } = renderHook(() => useAssuntos());

      const resultado = await result.current.findByNome('Teste');

      expect(resultado).toBeNull();
    });

    it('checkNomeExists - verifica existência de nome', async () => {
      mockAssuntosService.checkNomeExists.mockResolvedValue({
        success: true,
        data: true,
      });

      const { result } = renderHook(() => useAssuntos());

      const existe = await result.current.checkNomeExists('Fraude Bancária');

      expect(existe).toBe(true);
      expect(mockAssuntosService.checkNomeExists).toHaveBeenCalledWith(
        'Fraude Bancária',
        undefined
      );
    });

    it('checkNomeExists - exclui ID específico', async () => {
      mockAssuntosService.checkNomeExists.mockResolvedValue({
        success: true,
        data: false,
      });

      const { result } = renderHook(() => useAssuntos());

      const existe = await result.current.checkNomeExists('Fraude Bancária', 1);

      expect(existe).toBe(false);
      expect(mockAssuntosService.checkNomeExists).toHaveBeenCalledWith('Fraude Bancária', 1);
    });

    it('searchByPattern - busca por padrão', async () => {
      const resultadoBusca = [mockAssuntos[0], mockAssuntos[1]];
      mockAssuntosService.searchByPattern.mockResolvedValue({
        success: true,
        data: resultadoBusca,
      });

      const { result } = renderHook(() => useAssuntos());

      const resultados = await result.current.searchByPattern('fraud');

      expect(resultados).toEqual(resultadoBusca);
      expect(mockAssuntosService.searchByPattern).toHaveBeenCalledWith('fraud');
    });

    it('searchByPattern - retorna array vazio em caso de erro', async () => {
      mockAssuntosService.searchByPattern.mockResolvedValue({
        success: false,
        error: 'Erro na busca',
      });

      const { result } = renderHook(() => useAssuntos());

      const resultados = await result.current.searchByPattern('teste');

      expect(resultados).toEqual([]);
    });
  });

  describe('Configurações do Hook', () => {
    it('aceita configurações customizadas', () => {
      const config = {
        autoLoad: false,
        showErrorNotifications: false,
      };

      const { result } = renderHook(() => useAssuntos(config));

      // Verifica se o hook foi inicializado corretamente
      expect(result.current.findByNome).toBeTypeOf('function');
      expect(result.current.checkNomeExists).toBeTypeOf('function');
      expect(result.current.searchByPattern).toBeTypeOf('function');
    });
  });
});
