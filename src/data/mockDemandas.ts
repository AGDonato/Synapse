// src/data/mockDemandas.ts

// Usamos 'export type' para definir um "contrato" de como o objeto Demanda deve ser.
// Isso ajuda a evitar erros no futuro.
export type Demanda = {
  id: number;
  protocolo: string;
  assunto: string;
  orgao: string;
  status: 'Pendente' | 'Em andamento' | 'Concluída';
};

// 'export const' cria e exporta nossa lista de dados para que outros arquivos possam usá-la.
export const mockDemandas: Demanda[] = [
  {
    id: 1,
    protocolo: '20250731-001',
    assunto: 'Requisição de Dados de Acesso',
    orgao: 'Polícia Civil - GO',
    status: 'Concluída',
  },
  {
    id: 2,
    protocolo: '20250731-002',
    assunto: 'Quebra de Sigilo Telefônico',
    orgao: 'Ministério Público - SP',
    status: 'Em andamento',
  },
  {
    id: 3,
    protocolo: '20250731-003',
    assunto: 'Informações Cadastrais',
    orgao: 'Polícia Federal - DF',
    status: 'Pendente',
  },
];