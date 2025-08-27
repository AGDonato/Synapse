// src/data/mockTiposMidias.ts
export interface TipoMidia {
  id: number;
  nome: string;
}

export const mockTiposMidias: TipoMidia[] = [
  { id: 1, nome: 'Flash Drive' },
  { id: 2, nome: 'Hard Disk Drive' },
  { id: 3, nome: 'Solid State Drive' },
];
