// src/hooks/useDemandas.ts
import { useContext } from 'react';
import {
  DemandasContext,
  type DemandasContextType,
} from '../contexts/DemandasContext.tsx';

// Hook customizado para facilitar o acesso ao contexto
// em nossas páginas, em vez de usar 'useContext(DemandasContext)' sempre.
export function useDemandas(): DemandasContextType {
  const context = useContext(DemandasContext);
  if (context === undefined) {
    throw new Error(
      'useDemandas precisa ser usado dentro de um DemandasProvider'
    );
  }
  return context;
}
