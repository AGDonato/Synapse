// src/hooks/useDocumentos.ts
import { useContext } from 'react';
import { DocumentosContext } from '../contexts/DocumentosContext';
import type { DocumentosContextType } from '../contexts/DocumentosContext';

// Hook customizado para facilitar o acesso ao contexto de documentos
export function useDocumentos(): DocumentosContextType {
  const context = useContext(DocumentosContext);
  if (context === undefined) {
    throw new Error(
      'useDocumentos precisa ser usado dentro de um DocumentosProvider'
    );
  }
  return context;
}
