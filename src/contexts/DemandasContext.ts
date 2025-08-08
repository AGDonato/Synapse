// src/contexts/DemandasContext.ts
import { createContext } from 'react';
import { Demanda } from '../types/entities';

export interface DemandasContextType {
  demandas: Demanda[];
  addDemanda: (novaDemanda: Omit<Demanda, 'id'>) => void;
  updateDemanda: (id: number, dadosAtualizados: Partial<Demanda>) => void;
  deleteDemanda: (id: number) => void;
}

export const DemandasContext = createContext<DemandasContextType | undefined>(undefined);