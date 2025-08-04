// src/data/mockDocumentos.ts

export type DocumentoDemanda = {
  id: number;
  demandaId: number;
  numeroDocumento: string;
  tipoDocumento: string;
  destinatario: string;
  dataEnvio: string | null;
  dataResposta: string | null;
  respondido: boolean;
};

export const mockDocumentosDemanda: DocumentoDemanda[] = [
  {
    id: 1,
    demandaId: 1,
    numeroDocumento: 'DOC-2025-001',
    tipoDocumento: 'Ofício',
    destinatario: 'Operadora TIM S.A.',
    dataEnvio: '2025-07-25',
    dataResposta: '2025-08-02',
    respondido: true,
  },
  {
    id: 2,
    demandaId: 1,
    numeroDocumento: 'DOC-2025-002',
    tipoDocumento: 'Requisição',
    destinatario: 'Claro S.A.',
    dataEnvio: '2025-07-26',
    dataResposta: null,
    respondido: false,
  },
  {
    id: 3,
    demandaId: 1,
    numeroDocumento: 'DOC-2025-003',
    tipoDocumento: 'Notificação',
    destinatario: 'Vivo S.A.',
    dataEnvio: '2025-07-30',
    dataResposta: '2025-08-01',
    respondido: true,
  },
  {
    id: 4,
    demandaId: 2,
    numeroDocumento: 'DOC-2025-004',
    tipoDocumento: 'Ofício',
    destinatario: 'Banco do Brasil S.A.',
    dataEnvio: '2025-07-22',
    dataResposta: null,
    respondido: false,
  },
  {
    id: 5,
    demandaId: 2,
    numeroDocumento: 'DOC-2025-005',
    tipoDocumento: 'Requisição',
    destinatario: 'Caixa Econômica Federal',
    dataEnvio: '2025-08-01',
    dataResposta: null,
    respondido: false,
  },
  {
    id: 6,
    demandaId: 3,
    numeroDocumento: 'DOC-2025-006',
    tipoDocumento: 'Intimação',
    destinatario: 'Itaú Unibanco S.A.',
    dataEnvio: null,
    dataResposta: null,
    respondido: false,
  },
];
