// src/hooks/useDemandas.ts
import { useDemandasStore } from '../stores/demandasStore';

// Hook customizado para facilitar o acesso ao store Zustand
export function useDemandas() {
  const {
    demandas,
    createDemanda,
    updateDemanda,
    deleteDemanda,
    isLoading,
    error
  } = useDemandasStore();

  return {
    demandas,
    createDemanda,
    updateDemanda,
    deleteDemanda,
    isLoading,
    error
  };
}
