// src/hooks/useOrgaos.ts

import { useCallback } from 'react';
import { type UseServiceConfig, useService } from './useService';
import { orgaosService } from '../services/OrgaosService';
import type { Orgao } from '../types/entities';

export interface UseOrgaosReturn extends ReturnType<typeof useService<Orgao>> {
  // Specific methods for Orgaos
  findByNomeCompleto: (nomeCompleto: string) => Promise<Orgao | null>;
  checkNomeCompletoExists: (nomeCompleto: string, excludeId?: number) => Promise<boolean>;
  getActive: () => Promise<Orgao[]>;
}

export function useOrgaos(config?: UseServiceConfig): UseOrgaosReturn {
  const serviceHook = useService(orgaosService, {
    entityName: 'Órgão',
    ...config,
  });

  // Specific method: find by nome completo
  const findByNomeCompleto = useCallback(async (nomeCompleto: string): Promise<Orgao | null> => {
    const response = await orgaosService.findByNomeCompleto(nomeCompleto);
    return response.success ? response.data ?? null : null;
  }, []);

  // Specific method: check if nome completo exists
  const checkNomeCompletoExists = useCallback(async (nomeCompleto: string, excludeId?: number): Promise<boolean> => {
    const response = await orgaosService.checkNomeCompletoExists(nomeCompleto, excludeId);
    return response.success ? response.data ?? false : false;
  }, []);

  // Specific method: get active orgaos
  const getActive = useCallback(async (): Promise<Orgao[]> => {
    const response = await orgaosService.getActive();
    return response.success ? response.data ?? [] : [];
  }, []);

  return {
    ...serviceHook,
    findByNomeCompleto,
    checkNomeCompletoExists,
    getActive,
  };
}