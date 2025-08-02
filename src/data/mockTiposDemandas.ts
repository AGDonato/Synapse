// src/data/mockTiposDemandas.ts
export type TipoDemanda = {
  id: number;
  nome: string;
};

export const mockTiposDemandas: TipoDemanda[] = [
  { id: 1, nome: 'Judicial' },
  { id: 2, nome: 'Análise Técnica' },
  { id: 3, nome: 'Administrativo' },
];
