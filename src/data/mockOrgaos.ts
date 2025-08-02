// src/data/mockOrgaos.ts
export type Orgao = {
  id: number;
  nomeCompleto: string;
  abreviacao: string;
  enderecamento: string;
};

export const mockOrgaos: Orgao[] = [
  {
    id: 1,
    nomeCompleto: 'Polícia Civil do Estado de Goiás',
    abreviacao: 'PC-GO',
    enderecamento: 'Endereço completo da Polícia Civil',
  },
  {
    id: 2,
    nomeCompleto: 'Ministério Público do Estado de São Paulo',
    abreviacao: 'MP-SP',
    enderecamento: 'Endereço completo do Ministério Público',
  },
  {
    id: 3,
    nomeCompleto: 'Polícia Federal - Superintendência Regional no Distrito Federal',
    abreviacao: 'PF-DF',
    enderecamento: 'Endereço completo da Polícia Federal',
  },
  {
    id: 4,
    nomeCompleto: 'Tribunal de Justiça - Bahia',
    abreviacao: 'TJ-BA',
    enderecamento: 'Endereço do TJ-BA',
  },
  {
    id: 5,
    nomeCompleto: 'Polícia Militar - Rio de Janeiro',
    abreviacao: 'PM-RJ',
    enderecamento: 'Endereço da PM-RJ',
  },
  {
    id: 6,
    nomeCompleto: 'Receita Federal do Brasil',
    abreviacao: 'RFB',
    enderecamento: 'Endereço da Receita Federal',
  },
  {
    id: 7,
    nomeCompleto: 'Agência Brasileira de Inteligência',
    abreviacao: 'ABIN',
    enderecamento: 'Endereço da ABIN',
  },
];