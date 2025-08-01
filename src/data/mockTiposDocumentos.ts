// src/data/mockTiposDocumentos.ts
export type TipoDocumento = {
  id: number;
  nome: string;
};

export const mockTiposDocumentos: TipoDocumento[] = [
  { id: 1, nome: 'Ofício' },
  { id: 2, nome: 'Ofício Circular' },
  { id: 3, nome: 'Relatório Técnico' },
  { id: 4, nome: 'Mídia' },
];