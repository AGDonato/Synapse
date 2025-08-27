// src/hooks/useAssuntos.ts

import { useCallback } from 'react';
import { type UseServiceConfig, useService } from './useService';
import { assuntosService } from '../services/AssuntosService';
import type { Assunto } from '../types/entities';

export interface UseAssuntosReturn extends ReturnType<typeof useService<Assunto>> {
  // Specific methods for Assuntos
  findByNome: (nome: string) => Promise<Assunto | null>;
  checkNomeExists: (nome: string, excludeId?: number) => Promise<boolean>;
  searchByPattern: (pattern: string) => Promise<Assunto[]>;
}

export function useAssuntos(config?: UseServiceConfig): UseAssuntosReturn {
  const serviceHook = useService(assuntosService, {
    entityName: 'Assunto',
    ...config,
  });

  // Specific method: find by nome
  const findByNome = useCallback(async (nome: string): Promise<Assunto | null> => {
    const response = await assuntosService.findByNome(nome);
    return response.success ? response.data || null : null;
  }, []);

  // Specific method: check if nome exists
  const checkNomeExists = useCallback(async (nome: string, excludeId?: number): Promise<boolean> => {
    const response = await assuntosService.checkNomeExists(nome, excludeId);
    return response.success ? response.data || false : false;
  }, []);

  // Specific method: search by pattern
  const searchByPattern = useCallback(async (pattern: string): Promise<Assunto[]> => {
    const response = await assuntosService.searchByPattern(pattern);
    return response.success ? response.data || [] : [];
  }, []);

  return {
    ...serviceHook,
    findByNome,
    checkNomeExists,
    searchByPattern,
  };
}