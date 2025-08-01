// src/data/mockProvedores.ts
export type Provedor = {
  id: number;
  nomeFantasia: string;
  razaoSocial: string;
  enderecamento: string;
};

export const mockProvedores: Provedor[] = [
  { id: 1, nomeFantasia: 'Telefônica Brasil', razaoSocial: 'TELEFÔNICA BRASIL S.A.', enderecamento: 'Av. Engenheiro Luís Carlos Berrini, 1376 - Cidade Monções, São Paulo - SP' },
  { id: 2, nomeFantasia: 'Claro', razaoSocial: 'CLARO S.A.', enderecamento: 'Rua Flórida, 1970 - Cidade Monções, São Paulo - SP' },
  { id: 3, nomeFantasia: 'TIM', razaoSocial: 'TIM S.A.', enderecamento: 'Av. João Cabral de Mello Neto, 850 - Barra da Tijuca, Rio de Janeiro - RJ' },
];