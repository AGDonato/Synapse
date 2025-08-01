// src/data/mockAutoridades.ts
export type Autoridade = {
  id: number;
  nome: string;
  cargo: string;
};

export const mockAutoridades: Autoridade[] = [
  { id: 1, nome: 'João da Silva', cargo: 'Delegado de Polícia' },
  { id: 2, nome: 'Maria Oliveira', cargo: 'Promotora de Justiça' },
  { id: 3, nome: 'Carlos Pereira', cargo: 'Juiz de Direito' },
];