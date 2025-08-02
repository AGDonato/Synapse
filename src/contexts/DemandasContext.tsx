// src/contexts/DemandasContext.tsx
import { useState, type ReactNode } from 'react';
import { mockDemandas, type Demanda } from '../data/mockDemandas';
import { DemandasContext } from './DemandasContext';

// =================================================================
// O "Provedor" do Contexto (O Cérebro)
// Este é o componente que vai conter o estado (a lista de demandas) e a lógica.
// Ele "proverá" esses dados para todos os componentes filhos.
// =================================================================
export function DemandasProvider({ children }: { children: ReactNode }) {
  // A lista "viva" de demandas começa com os dados do nosso arquivo mock.
  const [demandas, setDemandas] = useState<Demanda[]>(mockDemandas);

  // Função para adicionar uma nova demanda à lista
  const addDemanda = (novaDemandaData: Omit<Demanda, 'id'>) => {
    const novaDemanda: Demanda = {
      id: Date.now(), // Gera um ID simples baseado no tempo atual
      ...novaDemandaData,
    };
    // Atualiza o estado, adicionando a nova demanda à lista existente
    setDemandas((prevDemandas) => [...prevDemandas, novaDemanda]);
  };

  // O valor (value) que será compartilhado com todos os componentes
  const value = { demandas, addDemanda };

  return (
    <DemandasContext.Provider value={value}>
      {children}
    </DemandasContext.Provider>
  );
}
