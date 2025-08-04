// src/data/mockDemandas.ts

import type { Demanda } from '../types/entities';

// Re-export the type for backward compatibility
export type { Demanda };

export const mockDemandas: Demanda[] = [
  {
    id: 1,
    sged: '2025.001',
    tipoDemanda: 'Judicial',
    autosAdministrativos: 'ADM-112233',
    assunto: 'Requisição de Dados de Acesso',
    orgao: 'Polícia Civil - GO',
    status: 'Finalizada',
    analista: '100',
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
    status: 'Em Andamento',
    analista: '127',
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
    status: 'Aguardando',
    analista: '142',
    dataInicial: '2025-08-01',
    dataFinal: null,
  },
  {
    id: 4,
    sged: '2025.004',
    tipoDemanda: 'Administrativo',
    autosAdministrativos: 'ADM-999000',
    assunto: 'Dados de Geolocalização',
    orgao: 'Tribunal de Justiça - RJ',
    status: 'Fila de Espera',
    analista: '180',
    dataInicial: '2025-08-03',
    dataFinal: null,
  },
];
