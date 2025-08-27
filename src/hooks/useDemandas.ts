// src/hooks/useDemandas.ts
import { useDemandasStore } from '../stores/demandasStore';
import type { Demanda } from '../types/entities';

// Hook customizado para facilitar o acesso ao store Zustand
export function useDemandas() {
  const {
    demandas,
    addDemanda,
    updateDemanda,
    deleteDemanda,
    isLoading,
    error
  } = useDemandasStore();

  return {
    demandas,
    addDemanda,
    updateDemanda,
    deleteDemanda,
    isLoading,
    error
  };
}
