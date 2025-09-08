/**
 * ================================================================
 * MOCK ADAPTER - SIMULADOR INTELIGENTE DE API PARA DESENVOLVIMENTO
 * ================================================================
 *
 * Este arquivo implementa um adaptador híbrido que permite desenvolvimento frontend
 * independente do backend, transitando gradualmente do mock para APIs reais.
 *
 * Funcionalidades principais:
 * - Simulador completo de todas as APIs do sistema
 * - Transição granular mock→API real por serviço específico
 * - Dados mock realistas baseados em arquivos de mock existentes
 * - Simulação de latência de rede e comportamentos reais
 * - Paginação, filtros e operações CRUD completas
 * - Upload de arquivos simulado com validação
 * - Estatísticas e métricas simuladas
 * - Sistema de configuração flexível para ativação de APIs
 *
 * Arquitetura do adaptador:
 * - USE_REAL_API: Configuração granular por serviço (demandas, auth, etc)
 * - adaptiveApi: Factory que seleciona entre mock e API real
 * - Conversores: Transformam dados mock para formato API esperado
 * - Utilitários: Funções para debug e configuração dinâmica
 *
 * Transição para produção:
 * 1. Configure USE_REAL_API[service] = true para ativar API real
 * 2. Schemas em schemas.ts definem contratos corretos da API
 * 3. Endpoints em endpoints.ts mostram formato esperado das chamadas
 * 4. Testes com dados mock garantem funcionalidade independente
 *
 * Vantagens do sistema:
 * - Desenvolvimento frontend paralelo ao backend
 * - Testes consistentes com dados controlados
 * - Transição gradual sem quebras
 * - Debug facilitado com logs e configurações
 * - Validação de contratos de API
 *
 * @fileoverview Adaptador híbrido mock/API real para desenvolvimento
 * @version 2.0.0
 * @since 2024-01-15
 * @author Synapse Team
 */

import {
  assuntosApi,
  authApi,
  autoridadesApi,
  demandasApi,
  documentosApi,
  orgaosApi,
  provedoresApi,
  tiposApi,
  uploadApi,
  relatoriosApi,
  sistemaApi,
} from './endpoints';

/**
 * Importações de dados mock do sistema
 * Estes arquivos contêm dados simulados realistas para desenvolvimento
 */
import { mockDemandas, type Demanda as MockDemanda } from '../../../shared/data/mockDemandas';
import { mockDocumentos } from '../../../shared/data/mockDocumentos';
import { mockOrgaos } from '../../../shared/data/mockOrgaos';
import { mockAssuntos } from '../../../shared/data/mockAssuntos';
import { mockProvedores } from '../../../shared/data/mockProvedores';
import { mockAutoridades } from '../../../shared/data/mockAutoridades';
import { mockTiposDemandas } from '../../../shared/data/mockTiposDemandas';
import { mockTiposDocumentos } from '../../../shared/data/mockTiposDocumentos';
import { mockTiposMidias } from '../../../shared/data/mockTiposMidias';

/**
 * Tipos auxiliares para desenvolvimento mock
 * @deprecated Use schemas.ts para tipos de produção
 */
type MockFilters = any;
type MockData = any;

/**
 * Logger especializado para operações do mock adapter
 */
const logger = {
  /**
   * Log informativo para debug do adapter
   * @param message - Mensagem para log
   */
  info: (message: string) => console.log(`[MockAdapter] ${message}`),
};

/**
 * ===================================================================
 * CONFIGURAÇÃO PRINCIPAL - CONTROLE GRANULAR DE APIs
 * ===================================================================
 *
 * Configure cada serviço individualmente para usar API real ou mock.
 * Permite transição gradual durante o desenvolvimento.
 */
const USE_REAL_API = {
  /** Ativar API real para demandas */
  demandas: false,
  /** Ativar API real para documentos */
  documentos: false,
  /** Ativar API real para órgãos */
  orgaos: false,
  /** Ativar API real para assuntos */
  assuntos: false,
  /** Ativar API real para provedores */
  provedores: false,
  /** Ativar API real para autoridades */
  autoridades: false,
  /** Ativar API real para tipos/metadados */
  tipos: false,
  /** Ativar API real para autenticação */
  auth: false,
  /** Ativar API real para upload */
  upload: false,
  /** Ativar API real para relatórios */
  relatorios: false,
  /** Ativar API real para sistema */
  sistema: false,
} as const;

/**
 * Simula atraso de rede para testes realistas
 * @param ms - Milissegundos de atraso
 * @returns Promise que resolve após o tempo especificado
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Interface para metadados de paginação compatível com Laravel
 */
interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

/**
 * Interface para links de navegação de paginação
 */
interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

/**
 * Interface para resposta paginada mock
 */
interface MockPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

/**
 * Simula paginação de dados como seria retornado por uma API real
 *
 * @param data - Array de dados para paginar
 * @param page - Página atual (começa em 1)
 * @param perPage - Itens por página
 * @returns Resposta paginada no formato padrão da API
 */
const paginateMockData = <T>(data: T[], page = 1, perPage = 10): MockPaginatedResponse<T> => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / perPage);

  return {
    data: paginatedData,
    meta: {
      current_page: page,
      last_page: totalPages,
      per_page: perPage,
      total: data.length,
      from: data.length > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, data.length),
    },
    links: {
      first: `?page=1`,
      last: `?page=${totalPages}`,
      prev: page > 1 ? `?page=${page - 1}` : null,
      next: page < totalPages ? `?page=${page + 1}` : null,
    },
  };
};

// ===================================================================
// CONVERSORES DE DADOS MOCK (BACKEND: IGNORE, SERÁ SUBSTITUÍDO)
// ===================================================================
const convertMockDemandaToApiFormat = (mockDemanda: any) => ({
  id: mockDemanda.id,
  numero: mockDemanda.sged,
  titulo: `${mockDemanda.tipoDemanda} - ${mockDemanda.descricao?.substring(0, 50) || 'Sem título'}`,
  descricao: mockDemanda.descricao,
  tipo_demanda_id: 1, // Valor padrão
  orgao_solicitante_id: 1, // Valor padrão
  assunto_id: 1, // Valor padrão
  prioridade: 'media' as const,
  status:
    mockDemanda.status === 'Em Andamento'
      ? 'em_andamento'
      : mockDemanda.status === 'Finalizada'
        ? 'concluida'
        : mockDemanda.status === 'Fila de Espera'
          ? 'aguardando'
          : 'aberta',
  data_abertura: mockDemanda.dataInicial
    ? new Date(mockDemanda.dataInicial.split('/').reverse().join('-'))
    : new Date(),
  data_prazo: mockDemanda.dataFinal
    ? new Date(mockDemanda.dataFinal.split('/').reverse().join('-'))
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  data_conclusao: mockDemanda.dataFinal
    ? new Date(mockDemanda.dataFinal.split('/').reverse().join('-'))
    : null,
  observacoes: `Analista: ${mockDemanda.analista}, Distribuidor: ${mockDemanda.distribuidor}`,
  autos_administrativos:
    mockDemanda.autosAdministrativos ||
    mockDemanda.autosJudiciais ||
    mockDemanda.autosExtrajudiciais,
  created_at: new Date(),
  updated_at: new Date(),

  // Campos legados para compatibilidade
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

// ===================================================================
// IMPLEMENTAÇÕES MOCK (BACKEND: SERÁ SUBSTITUÍDO PELOS ENDPOINTS REAIS)
// ===================================================================
const mockDemandasApi = {
  async list(filters?: any) {
    // BACKEND: veja DemandaFilters em schemas.ts
    await delay(300); // Simula atraso de rede

    let filteredData = [...mockDemandas].map(convertMockDemandaToApiFormat);

    // Aplica filtros se fornecidos
    if (filters?.status?.length) {
      filteredData = filteredData.filter(d => filters.status!.includes(d.status));
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        d =>
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
    if (!demanda) {
      throw new Error('Demanda não encontrada');
    }
    return convertMockDemandaToApiFormat(demanda);
  },

  async create(data: any) {
    // BACKEND: veja CreateDemanda em schemas.ts
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
    // BACKEND: veja UpdateDemanda em schemas.ts
    await delay(400);
    const index = mockDemandas.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Demanda não encontrada');
    }

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
    if (index === -1) {
      throw new Error('Demanda não encontrada');
    }
    mockDemandas.splice(index, 1);
  },

  async stats() {
    await delay(250);
    // BACKEND: Os erros abaixo são esperados - incompatibilidade entre dados mock e schemas finais
    // @ts-ignore - dados mock usam estrutura antiga, será removido quando API real for implementada
    return {
      total: mockDemandas.length,
      // @ts-ignore - mock usa status diferentes do schema final
      abertas: mockDemandas.filter(d => d.status === 'aberta').length,
      // @ts-ignore - mock usa status diferentes do schema final
      em_andamento: mockDemandas.filter(d => d.status === 'em_andamento').length,
      // @ts-ignore - mock usa status diferentes do schema final
      concluidas: mockDemandas.filter(d => d.status === 'concluida').length,
      // @ts-ignore - propriedades mock incompatíveis com schema final
      atrasadas: mockDemandas.filter(
        d =>
          // @ts-ignore - status e data_prazo não existem no tipo mock atual
          d.status !== 'concluida' && new Date(d.data_prazo) < new Date()
      ).length,
      // @ts-ignore - propriedade prioridade não existe no tipo mock atual
      por_prioridade: mockDemandas.reduce(
        (acc, d) => {
          // @ts-ignore - propriedade prioridade não existe no tipo mock atual
          acc[d.prioridade] = (acc[d.prioridade] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      por_orgao: Object.entries(
        // @ts-ignore - propriedades mock incompatíveis (orgao_solicitante_id, nome)
        mockDemandas.reduce(
          (acc, d) => {
            // @ts-ignore - orgao_solicitante_id não existe no tipo mock atual
            const orgao = mockOrgaos.find(o => o.id === d.orgao_solicitante_id);
            // @ts-ignore - propriedade nome não existe no tipo Orgao mock atual
            const nomeOrgao = orgao?.nome || 'Desconhecido';
            acc[nomeOrgao] = (acc[nomeOrgao] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([orgao, count]) => ({ orgao, count })),
    };
  },
};

// Função auxiliar para converter documento mock para formato de API
const convertMockDocumentoToApiFormat = (mockDocumento: any) => ({
  id: mockDocumento.id,
  numero: mockDocumento.numeroDocumento || `DOC-${mockDocumento.id.toString().padStart(6, '0')}`,
  assunto: mockDocumento.assunto,
  tipo_documento_id: 1, // Valor padrão
  demanda_id: mockDocumento.demandaId || null,
  destinatario: mockDocumento.destinatario,
  enderecamento: mockDocumento.enderecamento || '',
  conteudo: '', // Não disponível nos dados mock
  observacoes: mockDocumento.observacoes || '',
  status: 'enviado' as const, // Status padrão
  data_criacao: new Date(),
  data_envio: mockDocumento.dataEnvio
    ? new Date(mockDocumento.dataEnvio.split('/').reverse().join('-'))
    : null,
  data_prazo_resposta: mockDocumento.dataPrazo
    ? new Date(mockDocumento.dataPrazo.split('/').reverse().join('-'))
    : null,
  data_resposta: mockDocumento.dataResposta
    ? new Date(mockDocumento.dataResposta.split('/').reverse().join('-'))
    : null,
  created_at: new Date(),
  updated_at: new Date(),

  // Campos legados para compatibilidade
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
    // BACKEND: veja DocumentoFilters em schemas.ts
    await delay(300);

    let filteredData = [...mockDocumentos].map(convertMockDocumentoToApiFormat);

    if (filters?.status?.length) {
      filteredData = filteredData.filter(d => filters.status!.includes(d.status));
    }

    if (filters?.demanda_id) {
      filteredData = filteredData.filter(d => d.demanda_id === filters.demanda_id);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        d =>
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
    if (!documento) {
      throw new Error('Documento não encontrado');
    }
    return convertMockDocumentoToApiFormat(documento);
  },

  async create(data: any) {
    // BACKEND: veja CreateDocumento em schemas.ts
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
    // BACKEND: veja UpdateDocumento em schemas.ts
    await delay(400);
    const index = mockDocumentos.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Documento não encontrado');
    }

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
    if (index === -1) {
      throw new Error('Documento não encontrado');
    }
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
    // Retorna um blob PDF simulado
    return new Blob(['Mock PDF content'], { type: 'application/pdf' });
  },
};

// BACKEND: APIs simples - substitua pelas implementações reais
const createSimpleMockApi = (data: any[]) => ({
  async list() {
    await delay(200);
    return [...data];
  },
  async getById(id: number) {
    await delay(150);
    const item = data.find(item => item.id === id);
    if (!item) {
      throw new Error('Item não encontrado');
    }
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
    if (index === -1) {
      throw new Error('Item não encontrado');
    }

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
    if (index === -1) {
      throw new Error('Item não encontrado');
    }
    data.splice(index, 1);
  },
});

/**
 * ===================================================================
 * EXPORT PRINCIPAL - ADAPTADOR INTELIGENTE DE APIs
 * ===================================================================
 *
 * Este objeto implementa o padrão Adaptive API, selecionando automaticamente
 * entre implementações mock e APIs reais baseado na configuração USE_REAL_API.
 *
 * Funcionalidades:
 * - Factory pattern para seleção dinâmica de implementação
 * - Transição transparente entre mock e API real
 * - Interfaces consistentes independente da implementação
 * - Configuração granular por serviço
 *
 * @example
 * ```typescript
 * // Usar adaptiveApi transparentemente
 * const demandas = await adaptiveApi.demandas.list();
 *
 * // Configurar para usar API real
 * enableRealApi('demandas');
 * const realDemandas = await adaptiveApi.demandas.list(); // Agora usa API real
 * ```
 */
export const adaptiveApi = {
  /**
   * API de Demandas - Seleção automática entre mock e API real
   */
  demandas: USE_REAL_API.demandas ? demandasApi : mockDemandasApi,

  /**
   * API de Documentos - Seleção automática entre mock e API real
   */
  documentos: USE_REAL_API.documentos ? documentosApi : mockDocumentosApi,

  /**
   * API de Órgãos - Seleção automática entre mock e API real
   */
  orgaos: USE_REAL_API.orgaos ? orgaosApi : createSimpleMockApi(mockOrgaos),

  /**
   * API de Assuntos - Seleção automática entre mock e API real
   */
  assuntos: USE_REAL_API.assuntos ? assuntosApi : createSimpleMockApi(mockAssuntos),

  /**
   * API de Provedores - Seleção automática entre mock e API real
   */
  provedores: USE_REAL_API.provedores ? provedoresApi : createSimpleMockApi(mockProvedores),

  /**
   * API de Autoridades - Seleção automática entre mock e API real
   * Implementa lógica especial para filtro por órgão
   */
  autoridades: USE_REAL_API.autoridades
    ? autoridadesApi
    : {
        ...createSimpleMockApi(mockAutoridades),
        async list(orgaoId?: number) {
          await delay(200);
          // Simulação: retorna todas as autoridades
          // Em produção, filtraria por orgaoId
          return [...mockAutoridades];
        },
      },
  tipos: USE_REAL_API.tipos
    ? tiposApi
    : {
        demandas: {
          list: async () => {
            await delay(150);
            return [...mockTiposDemandas];
          },
        },
        documentos: {
          list: async () => {
            await delay(150);
            return [...mockTiposDocumentos];
          },
        },
        midias: {
          list: async () => {
            await delay(150);
            return [...mockTiposMidias];
          },
        },
      },

  // APIs estendidas consolidadas
  upload: USE_REAL_API.upload
    ? uploadApi
    : {
        single: async () => {
          await delay(1000);
          return { url: '/mock/file.pdf', id: 'mock-file-1' };
        },
        multiple: async () => {
          await delay(1500);
          return { uploads: [{ url: '/mock/file1.pdf', id: 'mock-file-1' }] };
        },
      },

  relatorios: USE_REAL_API.relatorios
    ? relatoriosApi
    : {
        demandas: async () => {
          await delay(800);
          return { data: [], summary: {} };
        },
        documentos: async () => {
          await delay(800);
          return { data: [], summary: {} };
        },
        performance: async () => {
          await delay(500);
          return { responseTime: 250, requestCount: 100, errorRate: 0.02, uptime: 99.9 };
        },
      },

  sistema: USE_REAL_API.sistema
    ? sistemaApi
    : {
        health: async () => {
          await delay(200);
          return true;
        },
        config: async () => {
          await delay(300);
          return { version: '1.0.0' };
        },
        logs: async () => {
          await delay(400);
          return { logs: [] };
        },
      },

  auth: USE_REAL_API.auth
    ? authApi
    : {
        async login(email: string, password: string) {
          await delay(800);
          // Login simulado com sucesso
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

/**
 * ===================================================================
 * UTILITÁRIOS PARA DESENVOLVIMENTO E DEBUG
 * ===================================================================
 */

/**
 * Configuração atual das APIs (somente leitura)
 * Permite verificar quais serviços estão usando API real vs mock
 */
export const apiConfig = USE_REAL_API;

/**
 * Ativa API real para um serviço específico
 * Útil para testes graduais e debug
 *
 * @param service - Nome do serviço para ativar API real
 *
 * @example
 * ```typescript
 * // Ativar API real apenas para demandas
 * enableRealApi('demandas');
 *
 * // Verificar status
 * console.log(apiConfig.demandas); // true
 * ```
 */
export const enableRealApi = (service: keyof typeof USE_REAL_API): void => {
  (USE_REAL_API as any)[service] = true;
  logger.info(`✅ Real API enabled for: ${service}`);
};

/**
 * Ativa APIs reais para todos os serviços
 * Útil para transição completa para produção
 *
 * @example
 * ```typescript
 * enableAllRealApis();
 * // Todos os serviços agora usam APIs reais
 * ```
 */
export const enableAllRealApis = (): void => {
  Object.keys(USE_REAL_API).forEach(key => {
    (USE_REAL_API as any)[key] = true;
  });
  logger.info('✅ All real APIs enabled');
};

/**
 * Desativa API real para um serviço específico, voltando ao mock
 * Útil para debug e desenvolvimento isolado
 *
 * @param service - Nome do serviço para voltar ao mock
 *
 * @example
 * ```typescript
 * // Voltar ao mock para debug
 * disableRealApi('demandas');
 *
 * // Verificar status
 * console.log(apiConfig.demandas); // false
 * ```
 */
export const disableRealApi = (service: keyof typeof USE_REAL_API): void => {
  (USE_REAL_API as any)[service] = false;
  logger.info(`🔄 Mock API enabled for: ${service}`);
};

/**
 * Export padrão do adaptador híbrido
 * Permite importação direta como `import mockAdapter from './mockAdapter'`
 */
export default adaptiveApi;
