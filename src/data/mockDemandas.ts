// src/data/mockDemandas.ts

export type Demanda = {
  id: number;
  sged: string;
  tipoDemanda: string;
  autosAdministrativos: string;
  assunto: string; // Mantemos o assunto para o formulário, mas não exibimos na tabela principal
  orgao: string;
  status: 'Pendente' | 'Em andamento' | 'Concluída';
  analista: string;
  dataInicial: string; // Formato AAAA-MM-DD
  dataFinal: string | null;
};

export const mockDemandas: Demanda[] = [
  {
    id: 1,
    sged: '2025.001',
    tipoDemanda: 'Judicial',
    autosAdministrativos: 'ADM-112233',
    assunto: 'Requisição de Dados de Acesso',
    orgao: 'Polícia Civil - GO',
    status: 'Concluída',
    analista: 'Alan Donato',
    dataInicial: '2025-07-15',
    dataFinal: '2025-07-30',
  },
  {
    id: 2,
    sged: '2025.002',
    tipoDemanda: 'Análise Técnica',
    autosAdministrativos: 'ADM-445566',
    assunto: 'Quebra de Sigilo Telefônico',
    orgao: 'Ministério Público - SP',
    status: 'Em andamento',
    analista: 'Carlos Eduardo',
    dataInicial: '2025-07-20',
    dataFinal: null,
  },
  {
    id: 3,
    sged: '2025.003',
    tipoDemanda: 'Administrativo',
    autosAdministrativos: 'ADM-778899',
    assunto: 'Informações Cadastrais',
    orgao: 'Polícia Federal - DF',
    status: 'Pendente',
    analista: 'Fernando Martins',
    dataInicial: '2025-08-01',
    dataFinal: null,
  },
];