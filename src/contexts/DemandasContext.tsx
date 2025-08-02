// src/contexts/DemandasContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockDemandas, type Demanda } from '../data/mockDemandas';

// =================================================================
// 1. O "Contrato" do Contexto
// Define a "forma" dos dados e funções que nosso contexto vai fornecer.
// =================================================================
type DemandasContextType = {
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
const DemandasContext = createContext<DemandasContextType | undefined>(undefined);


// =================================================================
// 3. O "Provedor" do Contexto (O Cérebro)
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
    setDemandas(prevDemandas => [...prevDemandas, novaDemanda]);
  };

  // O valor (value) que será compartilhado com todos os componentes
  const value = { demandas, addDemanda };

  return (
    <DemandasContext.Provider value={value}>
      {children}
    </DemandasContext.Provider>
  );
}

// =================================================================
// 4. O "Hook" Customizado (O Atalho)
// Criamos uma função simples para facilitar o acesso ao contexto
// em nossas páginas, em vez de usar 'useContext(DemandasContext)' sempre.
// =================================================================
export function useDemandas() {
  const context = useContext(DemandasContext);
  if (context === undefined) {
    throw new Error('useDemandas precisa ser usado dentro de um DemandasProvider');
  }
  return context;
}