// src/data/mockTiposMidias.ts
export type TipoMidia = {
  id: number;
  nome: string;
};

export const mockTiposMidias: TipoMidia[] = [
  { id: 1, nome: 'CD/DVD' },
  { id: 2, nome: 'HD Externo' },
  { id: 3, nome: 'Pendrive' },
  { id: 4, nome: 'Cartão de Memória' },
];
