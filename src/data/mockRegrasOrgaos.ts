// src/data/mockRegrasOrgaos.ts
export type RegraOrgao = {
  orgaoId: number;
  isSolicitante: boolean;
  isOrgaoJudicial: boolean;
};

export const mockRegrasOrgaos: RegraOrgao[] = [
  { orgaoId: 1, isSolicitante: true, isOrgaoJudicial: false },
  { orgaoId: 2, isSolicitante: true, isOrgaoJudicial: true },
  { orgaoId: 3, isSolicitante: true, isOrgaoJudicial: false },
];