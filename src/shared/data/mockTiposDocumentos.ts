// src/data/mockTiposDocumentos.ts
export interface TipoDocumento {
  id: number;
  nome: string;
}

export const mockTiposDocumentos: TipoDocumento[] = [
  { id: 1, nome: 'Autos Circunstanciados' },
  { id: 2, nome: 'Mídia' },
  { id: 3, nome: 'Ofício' },
  { id: 4, nome: 'Ofício Circular' },
  { id: 5, nome: 'Relatório de Inteligência' },
  { id: 6, nome: 'Relatório Técnico' },
];
