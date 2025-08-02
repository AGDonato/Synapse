// src/data/mockRegrasAutoridades.ts
export type RegraAutoridade = {
  autoridadeId: number;
  isAutoridadeJudicial: boolean;
};

export const mockRegrasAutoridades: RegraAutoridade[] = [
  { autoridadeId: 1, isAutoridadeJudicial: false }, // João da Silva - Delegado
  { autoridadeId: 2, isAutoridadeJudicial: false }, // Maria Oliveira - Promotora
  { autoridadeId: 3, isAutoridadeJudicial: true },  // Carlos Pereira - Juiz
];