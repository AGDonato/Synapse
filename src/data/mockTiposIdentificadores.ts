// src/data/mockTiposIdentificadores.ts
export type TipoIdentificador = {
  id: number;
  nome: string;
};

export const mockTiposIdentificadores: TipoIdentificador[] = [
  { id: 1, nome: 'AGÊNCIA' },
  { id: 2, nome: 'CNPJ' },
  { id: 3, nome: 'CONTA' },
  { id: 4, nome: 'CPF' },
  { id: 5, nome: 'E-MAIL' },
  { id: 6, nome: 'HASH' },
  { id: 7, nome: 'ID' },
  { id: 8, nome: 'IMEI' },
  { id: 9, nome: 'IP' },
  { id: 10, nome: 'NOME' },
  { id: 11, nome: 'TELEFONE' },
  { id: 12, nome: 'TXID' },
  { id: 13, nome: 'URL' },
  { id: 14, nome: 'USERNAME' },
];
