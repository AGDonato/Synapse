/**
 * Mock Adapter - Gradual migration from mock data to real API
 * 
 * This adapter allows the app to gradually transition from mock data
 * to real API endpoints. Each endpoint can be toggled independently.
 */

import { 
  assuntosApi,
  authApi,
  autoridadesApi,
  demandasApi,
  documentosApi,
  orgaosApi,
  provedoresApi,
  tiposApi
} from './endpoints';

// Mock data imports
import { mockDemandas } from '../../data/mockDemandas';
import { mockDocumentos } from '../../data/mockDocumentos';
import { mockOrgaos } from '../../data/mockOrgaos';
import { mockAssuntos } from '../../data/mockAssuntos';
import { mockProvedores } from '../../data/mockProvedores';
import { mockAutoridades } from '../../data/mockAutoridades';
import { mockTiposDemandas } from '../../data/mockTiposDemandas';
import { mockTiposDocumentos } from '../../data/mockTiposDocumentos';
import { mockTiposMidias } from '../../data/mockTiposMidias';

// Configuration - toggle between mock and real API
const USE_REAL_API = {
  demandas: false,
  documentos: false,
  orgaos: false,
  assuntos: false,
  provedores: false,
  autoridades: false,
  tipos: false,
  auth: false,
} as const;

// Helper to simulate API delays for mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to simulate API pagination for mock data
const paginateMockData = <T>(data: T[], page = 1, perPage = 10) => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    meta: {
      current_page: page,
      last_page: Math.ceil(data.length / perPage),
      per_page: perPage,
      total: data.length,
      from: startIndex + 1,
      to: Math.min(endIndex, data.length),
    },
    links: {
      first: `?page=1`,
      last: `?page=${Math.ceil(data.length / perPage)}`,
      prev: page > 1 ? `?page=${page - 1}` : null,
      next: page < Math.ceil(data.length / perPage) ? `?page=${page + 1}` : null,
    }
  };
};

// Helper to convert mock demanda to API format
const convertMockDemandaToApiFormat = (mockDemanda: any) => ({
  id: mockDemanda.id,
  numero: mockDemanda.sged,
  titulo: `${mockDemanda.tipoDemanda} - ${mockDemanda.descricao?.substring(0, 50) || 'Sem título'}`,
  descricao: mockDemanda.descricao,
  tipo_demanda_id: 1, // Default value
  orgao_solicitante_id: 1, // Default value
  assunto_id: 1, // Default value
  prioridade: 'media' as const,
  status: mockDemanda.status === 'Em Andamento' ? 'em_andamento' : 
          mockDemanda.status === 'Finalizada' ? 'concluida' :
          mockDemanda.status === 'Fila de Espera' ? 'aguardando' : 'aberta',
  data_abertura: mockDemanda.dataInicial ? new Date(mockDemanda.dataInicial.split('/').reverse().join('-')) : new Date(),
  data_prazo: mockDemanda.dataFinal ? new Date(mockDemanda.dataFinal.split('/').reverse().join('-')) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  data_conclusao: mockDemanda.dataFinal ? new Date(mockDemanda.dataFinal.split('/').reverse().join('-')) : null,
  observacoes: `Analista: ${mockDemanda.analista}, Distribuidor: ${mockDemanda.distribuidor}`,
  autos_administrativos: mockDemanda.autosAdministrativos || mockDemanda.autosJudiciais || mockDemanda.autosExtrajudiciais,
  created_at: new Date(),
  updated_at: new Date(),
  
  // Legacy fields for compatibility
  sged: mockDemanda.sged,
  tipoDemanda: mockDemanda.tipoDemanda,
  orgao: mockDemanda.orgao,
  alvos: mockDemanda.alvos,
  identificadores: mockDemanda.identificadores,
  distribuidor: mockDemanda.distribuidor,
  analista: mockDemanda.analista,
  dataInicial: mockDemanda.dataInicial,
  dataFinal: mockDemanda.dataFinal,
  pic: mockDemanda.pic,
  autosAdministrativos: mockDemanda.autosAdministrativos,
  autosJudiciais: mockDemanda.autosJudiciais,
  autosExtrajudiciais: mockDemanda.autosExtrajudiciais,
});

// Mock implementations with realistic behavior
const mockDemandasApi = {
  async list(filters?: any) {
    await delay(300); // Simulate network delay
    
    let filteredData = [...mockDemandas].map(convertMockDemandaToApiFormat);
    
    // Apply filters if provided
    if (filters?.status?.length) {
      filteredData = filteredData.filter(d => filters.status.includes(d.status));
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredData = filteredData.filter(d => 
        d.titulo.toLowerCase().includes(search) ||
        d.descricao.toLowerCase().includes(search) ||
        d.numero.toLowerCase().includes(search)
      );
    }

    return paginateMockData(filteredData, filters?.page, filters?.per_page);
  },

  async getById(id: number) {
    await delay(200);
    const demanda = mockDemandas.find(d => d.id === id);
    if (!demanda) {throw new Error('Demanda não encontrada');}
    return convertMockDemandaToApiFormat(demanda);
  },

  async create(data: any) {
    await delay(500);
    const newDemanda = {
      ...data,
      id: Math.max(...mockDemandas.map(d => d.id)) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    };
    mockDemandas.push(newDemanda);
    return newDemanda;
  },

  async update(id: number, data: any) {
    await delay(400);
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index === -1) {throw new Error('Demanda não encontrada');}
    
    mockDemandas[index] = {
      ...mockDemandas[index],
      ...data,
      updated_at: new Date(),
    };
    return mockDemandas[index];
  },

  async delete(id: number) {
    await delay(300);
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index === -1) {throw new Error('Demanda não encontrada');}
    mockDemandas.splice(index, 1);
  },

  async stats() {
    await delay(250);
    return {
      total: mockDemandas.length,
      abertas: mockDemandas.filter(d => d.status === 'aberta').length,
      em_andamento: mockDemandas.filter(d => d.status === 'em_andamento').length,
      concluidas: mockDemandas.filter(d => d.status === 'concluida').length,
      atrasadas: mockDemandas.filter(d => 
        d.status !== 'concluida' && new Date(d.data_prazo) < new Date()
      ).length,
      por_prioridade: mockDemandas.reduce((acc, d) => {
        acc[d.prioridade] = (acc[d.prioridade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      por_orgao: Object.entries(
        mockDemandas.reduce((acc, d) => {
          const orgao = mockOrgaos.find(o => o.id === d.orgao_solicitante_id);
          const nomeOrgao = orgao?.nome || 'Desconhecido';
          acc[nomeOrgao] = (acc[nomeOrgao] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([orgao, count]) => ({ orgao, count })),
    };
  },
};

// Helper to convert mock documento to API format
const convertMockDocumentoToApiFormat = (mockDocumento: any) => ({
  id: mockDocumento.id,
  numero: mockDocumento.numeroDocumento || `DOC-${mockDocumento.id.toString().padStart(6, '0')}`,
  assunto: mockDocumento.assunto,
  tipo_documento_id: 1, // Default value
  demanda_id: mockDocumento.demandaId || null,
  destinatario: mockDocumento.destinatario,
  enderecamento: mockDocumento.enderecamento || '',
  conteudo: '', // Not in mock data
  observacoes: mockDocumento.observacoes || '',
  status: 'enviado' as const, // Default status
  data_criacao: new Date(),
  data_envio: mockDocumento.dataEnvio ? new Date(mockDocumento.dataEnvio.split('/').reverse().join('-')) : null,
  data_prazo_resposta: mockDocumento.dataPrazo ? new Date(mockDocumento.dataPrazo.split('/').reverse().join('-')) : null,
  data_resposta: mockDocumento.dataResposta ? new Date(mockDocumento.dataResposta.split('/').reverse().join('-')) : null,
  created_at: new Date(),
  updated_at: new Date(),
  
  // Legacy fields for compatibility
  sged: mockDocumento.sged,
  tipoDocumento: mockDocumento.tipoDocumento,
  numeroDocumento: mockDocumento.numeroDocumento,
  numeroAtena: mockDocumento.numeroAtena,
  codigoRastreio: mockDocumento.codigoRastreio,
  naopossuiRastreio: mockDocumento.naopossuiRastreio,
  anoDocumento: mockDocumento.anoDocumento,
  analista: mockDocumento.analista,
  dataEnvio: mockDocumento.dataEnvio,
  dataResposta: mockDocumento.dataResposta,
});

const mockDocumentosApi = {
  async list(filters?: any) {
    await delay(300);
    
    let filteredData = [...mockDocumentos].map(convertMockDocumentoToApiFormat);
    
    if (filters?.status?.length) {
      filteredData = filteredData.filter(d => filters.status.includes(d.status));
    }
    
    if (filters?.demanda_id) {
      filteredData = filteredData.filter(d => d.demanda_id === filters.demanda_id);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredData = filteredData.filter(d => 
        d.assunto.toLowerCase().includes(search) ||
        d.destinatario.toLowerCase().includes(search) ||
        d.numero.toLowerCase().includes(search)
      );
    }

    return paginateMockData(filteredData, filters?.page, filters?.per_page);
  },

  async getById(id: number) {
    await delay(200);
    const documento = mockDocumentos.find(d => d.id === id);
    if (!documento) {throw new Error('Documento não encontrado');}
    return convertMockDocumentoToApiFormat(documento);
  },

  async create(data: any) {
    await delay(500);
    const newDocumento = {
      ...data,
      id: Math.max(...mockDocumentos.map(d => d.id)) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    };
    mockDocumentos.push(newDocumento);
    return newDocumento;
  },

  async update(id: number, data: any) {
    await delay(400);
    const index = mockDocumentos.findIndex(d => d.id === id);
    if (index === -1) {throw new Error('Documento não encontrado');}
    
    mockDocumentos[index] = {
      ...mockDocumentos[index],
      ...data,
      updated_at: new Date(),
    };
    return mockDocumentos[index];
  },

  async delete(id: number) {
    await delay(300);
    const index = mockDocumentos.findIndex(d => d.id === id);
    if (index === -1) {throw new Error('Documento não encontrado');}
    mockDocumentos.splice(index, 1);
  },

  async uploadAnexo(documentoId: number, file: File) {
    await delay(800);
    return {
      id: Math.floor(Math.random() * 10000),
      url: URL.createObjectURL(file),
      nome: file.name,
      tipo: file.type,
      tamanho: file.size,
    };
  },

  async generatePdf(id: number): Promise<Blob> {
    await delay(1000);
    // Return a mock PDF blob
    return new Blob(['Mock PDF content'], { type: 'application/pdf' });
  },
};

// Simple mock implementations for other APIs
const createSimpleMockApi = <T>(data: T[]) => ({
  async list() {
    await delay(200);
    return [...data];
  },
  async getById(id: number) {
    await delay(150);
    const item = data.find((item: any) => item.id === id);
    if (!item) {throw new Error('Item não encontrado');}
    return item;
  },
  async create(newData: any) {
    await delay(400);
    const newItem = {
      ...newData,
      id: Math.max(...data.map((item: any) => item.id)) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    };
    data.push(newItem);
    return newItem;
  },
  async update(id: number, updateData: any) {
    await delay(350);
    const index = data.findIndex((item: any) => item.id === id);
    if (index === -1) {throw new Error('Item não encontrado');}
    
    data[index] = {
      ...data[index],
      ...updateData,
      updated_at: new Date(),
    };
    return data[index];
  },
  async delete(id: number) {
    await delay(250);
    const index = data.findIndex((item: any) => item.id === id);
    if (index === -1) {throw new Error('Item não encontrado');}
    data.splice(index, 1);
  },
});

// Adaptive API exports - chooses between real API and mock based on configuration
export const adaptiveApi = {
  demandas: USE_REAL_API.demandas ? demandasApi : mockDemandasApi,
  documentos: USE_REAL_API.documentos ? documentosApi : mockDocumentosApi,
  orgaos: USE_REAL_API.orgaos ? orgaosApi : createSimpleMockApi(mockOrgaos),
  assuntos: USE_REAL_API.assuntos ? assuntosApi : createSimpleMockApi(mockAssuntos),
  provedores: USE_REAL_API.provedores ? provedoresApi : createSimpleMockApi(mockProvedores),
  autoridades: USE_REAL_API.autoridades ? autoridadesApi : {
    ...createSimpleMockApi(mockAutoridades),
    async list(orgaoId?: number) {
      await delay(200);
      return orgaoId 
        ? mockAutoridades.filter(a => a.orgao_id === orgaoId)
        : [...mockAutoridades];
    },
  },
  tipos: USE_REAL_API.tipos ? tiposApi : {
    demandas: { list: async () => { await delay(150); return [...mockTiposDemandas]; } },
    documentos: { list: async () => { await delay(150); return [...mockTiposDocumentos]; } },
    midias: { list: async () => { await delay(150); return [...mockTiposMidias]; } },
  },
  auth: USE_REAL_API.auth ? authApi : {
    async login(email: string, password: string) {
      await delay(800);
      // Mock successful login
      return {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          name: 'Usuario Mock',
          email,
          role: 'admin',
        },
      };
    },
    async logout() {
      await delay(200);
    },
    async me() {
      await delay(150);
      return {
        id: 1,
        name: 'Usuario Mock',
        email: 'admin@synapse.gov.br',
        role: 'admin',
      };
    },
    async refreshToken() {
      await delay(300);
      return { token: 'refreshed-mock-token' };
    },
  },
};

// Export configuration for debugging/monitoring
export const apiConfig = USE_REAL_API;

// Development utilities
export const enableRealApi = (service: keyof typeof USE_REAL_API) => {
  (USE_REAL_API as any)[service] = true;
  console.log(`✅ Real API enabled for: ${service}`);
};

export const enableAllRealApis = () => {
  Object.keys(USE_REAL_API).forEach(key => {
    (USE_REAL_API as any)[key] = true;
  });
  console.log('✅ All real APIs enabled');
};

export const disableRealApi = (service: keyof typeof USE_REAL_API) => {
  (USE_REAL_API as any)[service] = false;
  console.log(`🔄 Mock API enabled for: ${service}`);
};

export default adaptiveApi;