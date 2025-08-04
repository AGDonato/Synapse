// src/data/mockTiposDemandas.ts
export type TipoDemanda = {
  id: number;
  nome: string;
};

export const mockTiposDemandas: TipoDemanda[] = [
  { id: 1, nome: 'Administrativo' },
  { id: 2, nome: 'Análise Técnica' },
  { id: 3, nome: 'Fraude em rede social' },
  { id: 4, nome: 'Investigação cibernética' },
  { id: 5, nome: 'Preservação de dados' },
  { id: 6, nome: 'Quebra e interceptação' },
];
