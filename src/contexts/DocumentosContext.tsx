// src/contexts/DocumentosContext.tsx

import { createContext, useState, useContext, type ReactNode } from 'react';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import { mockDocumentosDemanda } from '../data/mockDocumentos';

// Tipos para o contexto
export interface DocumentosContextType {
  documentos: DocumentoDemanda[];
  addDocumento: (documento: Omit<DocumentoDemanda, 'id'>) => DocumentoDemanda;
  updateDocumento: (id: number, documento: Partial<DocumentoDemanda>) => void;
  deleteDocumento: (id: number) => void;
  getDocumento: (id: number) => DocumentoDemanda | undefined;
  getDocumentosByDemandaId: (demandaId: number) => DocumentoDemanda[];
}

// Criar o contexto
// eslint-disable-next-line react-refresh/only-export-components
export const DocumentosContext = createContext<DocumentosContextType | undefined>(undefined);

// Provider do contexto
interface DocumentosProviderProps {
  children: ReactNode;
}

export function DocumentosProvider({ children }: DocumentosProviderProps) {
  const [documentos, setDocumentos] = useState<DocumentoDemanda[]>(mockDocumentosDemanda);

  // Função para adicionar novo documento
  const addDocumento = (documento: Omit<DocumentoDemanda, 'id'>): DocumentoDemanda => {
    const newId = Math.max(...documentos.map(d => d.id), 0) + 1;
    const newDocumento: DocumentoDemanda = {
      ...documento,
      id: newId,
    };
    
    setDocumentos(prev => [...prev, newDocumento]);
    return newDocumento;
  };

  // Função para atualizar documento existente
  const updateDocumento = (id: number, updatedData: Partial<DocumentoDemanda>) => {
    setDocumentos(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, ...updatedData } : doc
      )
    );
  };

  // Função para deletar documento
  const deleteDocumento = (id: number) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
  };

  // Função para buscar documento por ID
  const getDocumento = (id: number): DocumentoDemanda | undefined => {
    return documentos.find(doc => doc.id === id);
  };

  // Função para buscar documentos de uma demanda específica
  const getDocumentosByDemandaId = (demandaId: number): DocumentoDemanda[] => {
    return documentos.filter(doc => doc.demandaId === demandaId);
  };

  const value: DocumentosContextType = {
    documentos,
    addDocumento,
    updateDocumento,
    deleteDocumento,
    getDocumento,
    getDocumentosByDemandaId,
  };

  return (
    <DocumentosContext.Provider value={value}>
      {children}
    </DocumentosContext.Provider>
  );
}

// Hook customizado para usar o contexto
// eslint-disable-next-line react-refresh/only-export-components
export function useDocumentos(): DocumentosContextType {
  const context = useContext(DocumentosContext);
  if (context === undefined) {
    throw new Error('useDocumentos deve ser usado dentro de um DocumentosProvider');
  }
  return context;
}