// src/data/mockAssuntos.ts
export type Assunto = {
  id: number;
  nome: string;
};

export const mockAssuntos: Assunto[] = [
  { id: 1, nome: 'Requisição de Dados Cadastrais' },
  { id: 2, nome: 'Quebra de Sigilo Telefônico' },
  { id: 3, nome: 'Monitoramento de Alvo' },
  { id: 4, nome: 'Afastamento de Sigilo Bancário' },
];