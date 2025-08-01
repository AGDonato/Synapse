// src/data/mockOrgaos.ts
export type Orgao = {
  id: number;
  nome: string;
  sigla: string;
};

export const mockOrgaos: Orgao[] = [
  { id: 1, nome: 'Polícia Civil', sigla: 'PC-GO' },
  { id: 2, nome: 'Ministério Público', sigla: 'MP-SP' },
  { id: 3, nome: 'Polícia Federal', sigla: 'PF-DF' },
  { id: 4, nome: 'Grupo de Atuação Especial de Combate ao Crime Organizado', sigla: 'GAECO-RJ' },
];