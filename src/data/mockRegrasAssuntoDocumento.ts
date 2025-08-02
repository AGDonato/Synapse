// src/data/mockRegrasAssuntoDocumento.ts
export type RegraAssuntoDocumento = {
  assuntoId: number;
  tipoDocumentoId: number;
};

// Exemplo de regras iniciais:
export const mockRegrasAssuntoDocumento: RegraAssuntoDocumento[] = [
  // O "Ofício" (ID 1) está relacionado à "Requisição de Dados" (ID 1)
  { assuntoId: 1, tipoDocumentoId: 1 },
  // O "Relatório Técnico" (ID 3) também está relacionado à "Requisição de Dados" (ID 1)
  { assuntoId: 1, tipoDocumentoId: 3 },
  // A "Mídia" (ID 4) está relacionada à "Quebra de Sigilo" (ID 2)
  { assuntoId: 2, tipoDocumentoId: 4 },
];
