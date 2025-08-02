// src/contexts/DemandasContext.ts
import { createContext } from 'react';
import { type Demanda } from '../data/mockDemandas';

// =================================================================
// 1. O "Contrato" do Contexto
// Define a "forma" dos dados e funções que nosso contexto vai fornecer.
// =================================================================
export type DemandasContextType = {
  demandas: Demanda[];
  addDemanda: (novaDemanda: Omit<Demanda, 'id'>) => void;
  // No futuro, adicionaremos mais funções aqui, como:
  // updateDemanda: (id: number, dadosAtualizados: Partial<Demanda>) => void;
  // deleteDemanda: (id: number) => void;
};

// =================================================================
// 2. A Criação do Contexto
// Cria o objeto de contexto em si.
// =================================================================
export const DemandasContext = createContext<DemandasContextType | undefined>(
  undefined
);
