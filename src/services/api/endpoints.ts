/**
 * ================================================================
 * ENDPOINTS API - PARA DESENVOLVEDOR BACKEND LEIA ISTO!
 * ================================================================
 *
 * Este arquivo contém TODAS as APIs consolidadas para integração com PHP.
 * Inclui CRUD completo, validações Zod e mapeamento de endpoints.
 *
 * COMO USAR:
 * - Todas as funções fazem conversão automática camelCase ↔ snake_case
 * - Validação automática com schemas Zod
 * - Cache inteligente para requisições GET
 * - Retry automático em falhas de rede
 * - Headers de autenticação automáticos
 *
 * BACKEND: Use a seção PHP_ENDPOINTS como referência para implementar:
 * - URLs corretas para cada endpoint
 * - Métodos HTTP esperados (GET, POST, PUT, DELETE)
 * - Estrutura de dados de entrada e saída
 * - Operações em lote (bulk operations)
 * - Upload de arquivos
 * - Relatórios e métricas
 *
 * ESTRUTURA:
 * 1. APIs básicas: demandas, documentos, cadastros
 * 2. APIs estendidas: upload, relatórios, sistema
 * 3. Mapeamento PHP_ENDPOINTS: referência para backend
 * 4. Schemas de validação: tipos esperados
 *
 * TESTE: Mude USE_REAL_API = true no mockAdapter.ts para usar estas APIs
 */

import { z } from 'zod';
import { api, httpClient, fileUploadClient } from './client';
import {
  type Assunto,
  AssuntoSchema,
  type Autoridade,
  AutoridadeSchema,
  type CreateAssunto,
  CreateAssuntoSchema,
  type CreateAutoridade,
  CreateAutoridadeSchema,
  type CreateDemanda,
  CreateDemandaSchema,
  type CreateDocumento,
  CreateDocumentoSchema,
  type CreateOrgao,
  CreateOrgaoSchema,
  type CreateProvedor,
  CreateProvedorSchema,
  type Demanda,
  type DemandaFilters,
  DemandaFiltersSchema,
  DemandaSchema,
  type Documento,
  type DocumentoFilters,
  DocumentoFiltersSchema,
  DocumentoSchema,
  type ListResponse,
  ListResponseSchema,
  type Orgao,
  OrgaoSchema,
  type Provedor,
  ProvedorSchema,
  type TipoDemanda,
  TipoDemandaSchema,
  type TipoDocumento,
  TipoDocumentoSchema,
  type TipoMidia,
  TipoMidiaSchema,
  type UpdateAssunto,
  UpdateAssuntoSchema,
  type UpdateAutoridade,
  UpdateAutoridadeSchema,
  type UpdateDemanda,
  UpdateDemandaSchema,
  type UpdateDocumento,
  UpdateDocumentoSchema,
  type UpdateOrgao,
  UpdateOrgaoSchema,
  type UpdateProvedor,
  UpdateProvedorSchema,
} from './schemas';

/**
 * ================================================================
 * APIs BÁSICAS - CRUD COMPLETO PARA TODAS ENTIDADES
 * ================================================================
 */

// API de Demandas - Gestão completa de demandas
export const demandasApi = {
  // List demandas with filters and pagination
  list: async (filters?: Partial<DemandaFilters>): Promise<ListResponse<Demanda>> => {
    const validated = DemandaFiltersSchema.partial().parse(filters || {});
    const response = await api.get('demandas', ListResponseSchema(DemandaSchema), {
      searchParams: validated as Record<string, string>,
    });
    return response.data;
  },

  // Get single demanda by ID
  getById: async (id: number): Promise<Demanda> => {
    const response = await api.get<Demanda>(`demandas/${id}`, DemandaSchema);
    return response.data;
  },

  // Create new demanda
  create: async (data: CreateDemanda): Promise<Demanda> => {
    const validated = CreateDemandaSchema.parse(data);
    const response = await api.post<Demanda>('demandas', validated, DemandaSchema);
    return response.data;
  },

  // Update existing demanda
  update: async (id: number, data: UpdateDemanda): Promise<Demanda> => {
    const validated = UpdateDemandaSchema.parse(data);
    const response = await api.put<Demanda>(`demandas/${id}`, validated, DemandaSchema);
    return response.data;
  },

  // Delete demanda
  delete: async (id: number): Promise<void> => {
    await api.delete(`demandas/${id}`);
  },

  // Get demanda statistics
  stats: async () => {
    const StatsSchema = z.object({
      total: z.number(),
      abertas: z.number(),
      em_andamento: z.number(),
      concluidas: z.number(),
      atrasadas: z.number(),
      por_prioridade: z.record(z.string(), z.number()),
      por_orgao: z.array(
        z.object({
          orgao: z.string(),
          count: z.number(),
        })
      ),
    });

    const response = await api.get('demandas/stats', StatsSchema);
    return response.data;
  },
};

// API de Documentos - Gestão completa de documentos
export const documentosApi = {
  // List documentos with filters and pagination
  list: async (filters?: Partial<DocumentoFilters>): Promise<ListResponse<Documento>> => {
    const validated = DocumentoFiltersSchema.partial().parse(filters || {});
    const response = await api.get('documentos', ListResponseSchema(DocumentoSchema), {
      searchParams: validated as Record<string, string>,
    });
    return response.data;
  },

  // Get single documento by ID
  getById: async (id: number): Promise<Documento> => {
    const response = await api.get(`documentos/${id}`, DocumentoSchema);
    return response.data;
  },

  // Create new documento
  create: async (data: CreateDocumento): Promise<Documento> => {
    const validated = CreateDocumentoSchema.parse(data);
    const response = await api.post('documentos', validated, DocumentoSchema);
    return response.data;
  },

  // Update existing documento
  update: async (id: number, data: UpdateDocumento): Promise<Documento> => {
    const validated = UpdateDocumentoSchema.parse(data);
    const response = await api.put(`documentos/${id}`, validated, DocumentoSchema);
    return response.data;
  },

  // Delete documento
  delete: async (id: number): Promise<void> => {
    await api.delete(`documentos/${id}`);
  },

  // Upload anexo
  uploadAnexo: async (documentoId: number, file: File): Promise<{ url: string; id: number }> => {
    const AnexoSchema = z.object({
      id: z.number(),
      url: z.string().url(),
      nome: z.string(),
      tipo: z.string(),
      tamanho: z.number(),
    });

    const response = await api.uploadFile(`documentos/${documentoId}/anexos`, file, AnexoSchema);
    return response.data;
  },

  // Generate PDF
  generatePdf: async (id: number): Promise<Blob> => {
    const response = await httpClient.get(`documentos/${id}/pdf`, {
      headers: { Accept: 'application/pdf' },
    });
    return await response.blob();
  },
};

/**
 * ================================================================
 * APIs DE CADASTROS - ENTIDADES DE REFERÊNCIA
 * ================================================================
 */

// API de Órgãos - Gestão de órgãos públicos
export const orgaosApi = {
  list: async (): Promise<Orgao[]> => {
    const response = await api.get('orgaos', z.array(OrgaoSchema));
    return response.data;
  },

  getById: async (id: number): Promise<Orgao> => {
    const response = await api.get(`orgaos/${id}`, OrgaoSchema);
    return response.data;
  },

  create: async (data: CreateOrgao): Promise<Orgao> => {
    const validated = CreateOrgaoSchema.parse(data);
    const response = await api.post('orgaos', validated, OrgaoSchema);
    return response.data;
  },

  update: async (id: number, data: UpdateOrgao): Promise<Orgao> => {
    const validated = UpdateOrgaoSchema.parse(data);
    const response = await api.put(`orgaos/${id}`, validated, OrgaoSchema);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`orgaos/${id}`);
  },
};

// API de Assuntos - Classificação de demandas
export const assuntosApi = {
  list: async (): Promise<Assunto[]> => {
    const response = await api.get('assuntos', z.array(AssuntoSchema));
    return response.data;
  },

  getById: async (id: number): Promise<Assunto> => {
    const response = await api.get(`assuntos/${id}`, AssuntoSchema);
    return response.data;
  },

  create: async (data: CreateAssunto): Promise<Assunto> => {
    const validated = CreateAssuntoSchema.parse(data);
    const response = await api.post('assuntos', validated, AssuntoSchema);
    return response.data;
  },

  update: async (id: number, data: UpdateAssunto): Promise<Assunto> => {
    const validated = UpdateAssuntoSchema.parse(data);
    const response = await api.put(`assuntos/${id}`, validated, AssuntoSchema);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`assuntos/${id}`);
  },
};

// API de Provedores - Fornecedores de serviços
export const provedoresApi = {
  list: async (): Promise<Provedor[]> => {
    const response = await api.get('provedores', z.array(ProvedorSchema));
    return response.data;
  },

  getById: async (id: number): Promise<Provedor> => {
    const response = await api.get(`provedores/${id}`, ProvedorSchema);
    return response.data;
  },

  create: async (data: CreateProvedor): Promise<Provedor> => {
    const validated = CreateProvedorSchema.parse(data);
    const response = await api.post('provedores', validated, ProvedorSchema);
    return response.data;
  },

  update: async (id: number, data: UpdateProvedor): Promise<Provedor> => {
    const validated = UpdateProvedorSchema.parse(data);
    const response = await api.put(`provedores/${id}`, validated, ProvedorSchema);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`provedores/${id}`);
  },
};

// API de Autoridades - Pessoas responsáveis
export const autoridadesApi = {
  list: async (orgaoId?: number): Promise<Autoridade[]> => {
    const url = orgaoId ? `autoridades?orgao_id=${orgaoId}` : 'autoridades';
    const response = await api.get(url, z.array(AutoridadeSchema));
    return response.data;
  },

  getById: async (id: number): Promise<Autoridade> => {
    const response = await api.get(`autoridades/${id}`, AutoridadeSchema);
    return response.data;
  },

  create: async (data: CreateAutoridade): Promise<Autoridade> => {
    const validated = CreateAutoridadeSchema.parse(data);
    const response = await api.post('autoridades', validated, AutoridadeSchema);
    return response.data;
  },

  update: async (id: number, data: UpdateAutoridade): Promise<Autoridade> => {
    const validated = UpdateAutoridadeSchema.parse(data);
    const response = await api.put(`autoridades/${id}`, validated, AutoridadeSchema);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`autoridades/${id}`);
  },
};

// Tipos API
export const tiposApi = {
  // Tipos de Demanda
  demandas: {
    list: async (): Promise<TipoDemanda[]> => {
      const response = await api.get('tipos-demandas', z.array(TipoDemandaSchema));
      return response.data;
    },
  },

  // Tipos de Documento
  documentos: {
    list: async (): Promise<TipoDocumento[]> => {
      const response = await api.get('tipos-documentos', z.array(TipoDocumentoSchema));
      return response.data;
    },
  },

  // Tipos de Mídia
  midias: {
    list: async (): Promise<TipoMidia[]> => {
      const response = await api.get('tipos-midias', z.array(TipoMidiaSchema));
      return response.data;
    },
  },
};

/**
 * ================================================================
 * API DE AUTENTICAÇÃO - GESTÃO DE SESSÕES E TOKENS
 * ================================================================
 */

// API de Autenticação - Login, logout e gestão de sessões
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: unknown }> => {
    const LoginSchema = z.object({
      token: z.string(),
      user: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
        role: z.string(),
      }),
    });

    const response = await api.post('auth/login', { email, password }, LoginSchema);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('auth/logout', {}, z.object({ message: z.string() }));
  },

  me: async (): Promise<unknown> => {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
    });

    const response = await api.get('auth/me', UserSchema);
    return response.data;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const TokenSchema = z.object({ token: z.string() });
    const response = await api.post('auth/refresh', {}, TokenSchema);
    return response.data;
  },

  // Verificar sessão ativa
  checkSession: async (): Promise<{ valid: boolean }> => {
    const SessionSchema = z.object({ valid: z.boolean() });
    const response = await api.get('auth/check-session', SessionSchema);
    return response.data;
  },
};

/**
 * ================================================================
 * MAPEAMENTO DE ENDPOINTS PHP - BACKEND REFERENCE
 * ================================================================
 *
 * Estrutura de URLs esperadas no backend PHP.
 * Use esta referência para implementar as rotas corretas.
 */
export const PHP_ENDPOINTS = {
  // Autenticação
  auth: {
    login: '/auth/login', // POST - { email, password }
    logout: '/auth/logout', // POST - {}
    me: '/auth/me', // GET - retorna usuário atual
    refresh: '/auth/refresh', // POST - refresh JWT token
    check: '/auth/check-session', // GET - verifica sessão válida
  },

  // Demandas
  demandas: {
    list: '/demandas', // GET - listar com filtros
    show: '/demandas/{id}', // GET - buscar por ID
    create: '/demandas', // POST - criar nova
    update: '/demandas/{id}', // PUT - atualizar
    delete: '/demandas/{id}', // DELETE - excluir
    search: '/demandas/search', // GET - busca textual

    // Operações em lote
    bulk: {
      create: '/demandas/bulk', // POST - criar múltiplas
      update: '/demandas/bulk-update', // PUT - atualizar múltiplas
      delete: '/demandas/bulk-delete', // DELETE - excluir múltiplas
    },

    // Endpoints específicos
    status: '/demandas/{id}/status', // PUT - alterar status
    timeline: '/demandas/{id}/timeline', // GET - histórico
    documents: '/demandas/{id}/documentos', // GET - documentos relacionados
  },

  // Documentos
  documentos: {
    list: '/documentos', // GET - listar com filtros
    show: '/documentos/{id}', // GET - buscar por ID
    create: '/documentos', // POST - criar novo
    update: '/documentos/{id}', // PUT - atualizar
    delete: '/documentos/{id}', // DELETE - excluir
    search: '/documentos/search', // GET - busca textual

    // Operações em lote
    bulk: {
      create: '/documentos/bulk', // POST - criar múltiplos
      update: '/documentos/bulk-update', // PUT - atualizar múltiplos
      delete: '/documentos/bulk-delete', // DELETE - excluir múltiplos
    },

    // Endpoints específicos
    upload: '/documentos/{id}/upload', // POST - fazer upload de arquivo
    download: '/documentos/{id}/download', // GET - baixar arquivo
  },

  // Cadastros básicos
  assuntos: {
    list: '/assuntos',
    show: '/assuntos/{id}',
    create: '/assuntos',
    update: '/assuntos/{id}',
    delete: '/assuntos/{id}',
  },

  orgaos: {
    list: '/orgaos',
    show: '/orgaos/{id}',
    create: '/orgaos',
    update: '/orgaos/{id}',
    delete: '/orgaos/{id}',
  },

  provedores: {
    list: '/provedores',
    show: '/provedores/{id}',
    create: '/provedores',
    update: '/provedores/{id}',
    delete: '/provedores/{id}',
  },

  autoridades: {
    list: '/autoridades',
    show: '/autoridades/{id}',
    create: '/autoridades',
    update: '/autoridades/{id}',
    delete: '/autoridades/{id}',
  },

  // Tipos/Metadados
  tipos: {
    demandas: '/tipos/demandas', // GET - tipos de demanda
    documentos: '/tipos/documentos', // GET - tipos de documento
    midias: '/tipos/midias', // GET - tipos de mídia
  },

  // Upload de arquivos
  upload: {
    single: '/upload/single', // POST - upload único
    multiple: '/upload/multiple', // POST - upload múltiplo
  },

  // Relatórios
  relatorios: {
    demandas: '/relatorios/demandas', // GET - relatório de demandas
    documentos: '/relatorios/documentos', // GET - relatório de documentos
    performance: '/relatorios/performance', // GET - métricas de performance
  },

  // Sistema
  sistema: {
    health: '/sistema/health', // GET - verificar saúde do sistema
    config: '/sistema/config', // GET - configurações
    logs: '/sistema/logs', // GET - logs do sistema
  },
};

/**
 * ================================================================
 * APIs ESTENDIDAS - FUNCIONALIDADES AVANÇADAS
 * ================================================================
 */

// API de Upload - Gestão de arquivos e documentos
export const uploadApi = {
  // Upload de arquivo único
  single: async (
    file: File,
    metadata?: Record<string, unknown>
  ): Promise<{ url: string; id: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const UploadSchema = z.object({
      url: z.string().url(),
      id: z.string(),
    });

    const response = await api.uploadFile('upload/single', file, UploadSchema);
    return response.data;
  },

  // Upload de múltiplos arquivos
  multiple: async (
    files: File[],
    metadata?: Record<string, unknown>
  ): Promise<{ uploads: { url: string; id: string }[] }> => {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files[]', file);
    });

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const MultipleUploadSchema = z.object({
      uploads: z.array(
        z.object({
          url: z.string().url(),
          id: z.string(),
        })
      ),
    });

    const response = await fileUploadClient.post('upload/multiple', { body: formData });
    const data = await response.json();
    return MultipleUploadSchema.parse(data);
  },
};

// Schemas para relatórios
const ReportSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  summary: z.record(z.string(), z.unknown()),
});

const MetricsSchema = z.object({
  responseTime: z.number(),
  requestCount: z.number(),
  errorRate: z.number(),
  uptime: z.number(),
});

// API de Relatórios - Geração de relatórios e métricas
export const relatoriosApi = {
  // Relatório de demandas
  demandas: async (filters?: Record<string, unknown>) => {
    const response = await api.get('relatorios/demandas', ReportSchema, { searchParams: filters });
    return response.data;
  },

  // Relatório de documentos
  documentos: async (filters?: Record<string, unknown>) => {
    const response = await api.get('relatorios/documentos', ReportSchema, {
      searchParams: filters,
    });
    return response.data;
  },

  // Métricas de performance
  performance: async (period: string) => {
    const response = await api.get('relatorios/performance', MetricsSchema, {
      searchParams: { period },
    });
    return response.data;
  },
};

// Schemas para sistema
const HealthSchema = z.object({ status: z.string() });
const ConfigSchema = z.record(z.string(), z.unknown());
const LogsSchema = z.object({
  logs: z.array(
    z.object({
      timestamp: z.string(),
      level: z.string(),
      message: z.string(),
      context: z.record(z.string(), z.unknown()).optional(),
    })
  ),
});

// API de Sistema - Monitoramento e configurações
export const sistemaApi = {
  // Health check
  health: async (): Promise<boolean> => {
    try {
      const response = await api.get('sistema/health', HealthSchema);
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  },

  // Configurações do sistema
  config: async () => {
    const response = await api.get('sistema/config', ConfigSchema);
    return response.data;
  },

  // Logs do sistema
  logs: async (filters?: Record<string, unknown>) => {
    const response = await api.get('sistema/logs', LogsSchema, { searchParams: filters });
    return response.data;
  },
};

// Export all APIs consolidadas
export const apiEndpoints = {
  demandas: demandasApi,
  documentos: documentosApi,
  orgaos: orgaosApi,
  assuntos: assuntosApi,
  provedores: provedoresApi,
  autoridades: autoridadesApi,
  tipos: tiposApi,
  auth: authApi,
  upload: uploadApi,
  relatorios: relatoriosApi,
  sistema: sistemaApi,
};

export default apiEndpoints;
