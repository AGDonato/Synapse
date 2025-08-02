// src/data/mockTiposIdentificadores.ts
export type TipoIdentificador = {
  id: number;
  nome: string;
};

export const mockTiposIdentificadores: TipoIdentificador[] = [
  { id: 1, nome: 'CPF' },
  { id: 2, nome: 'CNPJ' },
  { id: 3, nome: 'Telefone' },
  { id: 4, nome: 'E-mail' },
];
