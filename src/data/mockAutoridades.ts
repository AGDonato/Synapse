// src/data/mockAutoridades.ts

import type { Autoridade } from '../types/entities';

// Re-export the type for backward compatibility
export type { Autoridade };

export const mockAutoridades: Autoridade[] = [
  { id: 1, nome: 'João da Silva', cargo: 'Delegado de Polícia' },
  { id: 2, nome: 'Maria Oliveira', cargo: 'Promotora de Justiça' },
  { id: 3, nome: 'Carlos Pereira', cargo: 'Juiz de Direito' },
];
