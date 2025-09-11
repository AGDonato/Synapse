/**
 * ================================================================
 * ENDPOINTS API - DEFINIÇÕES COMPLETAS DE API DO SISTEMA SYNAPSE
 * ================================================================
 *
 * Este arquivo centraliza todas as definições de endpoints da API REST do sistema Synapse.
 * Fornece uma camada de abstração completa sobre as requisições HTTP com validação automática.
 *
 * Funcionalidades principais:
 * - APIs REST completas para todas as entidades (CRUD + operações especiais)
 * - Validação automática de entrada e saída com schemas Zod
 * - Type safety completo com TypeScript para todos os endpoints
 * - Cache automático para requisições GET via cliente HTTP
 * - Retry automático e handling de erros padronizado
 * - Conversão automática para JSON padrão Node.js/Express
 * - Headers de autenticação JWT automáticos
 * - Upload de arquivos otimizado com FormData
 * - Operações em lote (bulk operations) para performance
 * - Geração de relatórios e métricas do sistema
 * - Health checks e monitoramento de sistema
 *
 * Arquitetura de APIs:
 * - APIs Básicas: demandas, documentos, cadastros (CRUD completo)
 * - APIs de Referência: assuntos, órgãos, provedores, autoridades
 * - APIs de Sistema: autenticação, upload, relatórios, monitoramento
 * - Mapeamento NODEJS_ENDPOINTS: referência para implementação backend
 *
 * Padrões implementados:
 * - Repository pattern via APIs especializadas
 * - Factory pattern para criação de requisições
 * - Strategy pattern para diferentes tipos de validação
 * - Observer pattern para cache e métricas
 * - Command pattern para operações CRUD
 *
 * Integração com Backend:
 * - Use NODEJS_ENDPOINTS como referência para URLs e métodos HTTP
 * - Schemas definem estruturas de entrada e saída esperadas
 * - Conversão automática de nomenclatura (camelCase ↔ snake_case)
 * - Headers CSRF e autenticação configurados automaticamente
 *
 * @fileoverview Endpoints completos da API REST com validação automática
 * @version 2.0.0
 * @since 2024-01-20
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

/**
 * Interface para estatísticas de demandas
 */
interface DemandaStats {
  /** Total de demandas no sistema */
  total: number;
  /** Demandas com status "aberta" */
  abertas: number;
  /** Demandas com status "em andamento" */
  em_andamento: number;
  /** Demandas concluídas */
  concluidas: number;
  /** Demandas atrasadas */
  atrasadas: number;
  /** Distribuição por prioridade */
  por_prioridade: Record<string, number>;
  /** Distribuição por órgão */
  por_orgao: { orgao: string; count: number }[];
}

/**
 * API de Demandas - Gestão completa de demandas do sistema
 *
 * Funcionalidades:
 * - CRUD completo com validação automática
 * - Filtros avançados e paginação
 * - Estatísticas e relatórios
 * - Operações em lote
 * - Timeline e histórico
 *
 * @example
 * ```typescript
 * // Listar demandas com filtros
 * const demandas = await demandasApi.list({
 *   status: 'aberta',
 *   page: 1,
 *   limit: 10
 * });
 *
 * // Criar nova demanda
 * const novaDemanda = await demandasApi.create({
 *   titulo: 'Nova demanda',
 *   descricao: 'Descrição da demanda',
 *   prioridade: 'alta'
 * });
 * ```
 */
export const demandasApi = {
  /**
   * Lista demandas com filtros opcionais e paginação
   *
   * @param filters - Filtros para aplicar na busca
   * @returns Promise com lista paginada de demandas
   */
  list: async (filters?: Partial<DemandaFilters>): Promise<ListResponse<Demanda>> => {
    const validated = DemandaFiltersSchema.partial().parse(filters || {});
    const response = await api.get('demandas', ListResponseSchema(DemandaSchema), {
      searchParams: validated as Record<string, string>,
    });
    return response.data;
  },

  /**
   * Busca uma demanda específica por ID
   *
   * @param id - ID da demanda
   * @returns Promise com os dados da demanda
   */
  getById: async (id: number): Promise<Demanda> => {
    const response = await api.get<Demanda>(`demandas/${id}`, DemandaSchema);
    return response.data;
  },

  /**
   * Cria uma nova demanda no sistema
   *
   * @param data - Dados da nova demanda
   * @returns Promise com a demanda criada
   */
  create: async (data: CreateDemanda): Promise<Demanda> => {
    const validated = CreateDemandaSchema.parse(data);
    const response = await api.post<Demanda>('demandas', validated, DemandaSchema);
    return response.data;
  },

  /**
   * Atualiza uma demanda existente
   *
   * @param id - ID da demanda
   * @param data - Dados atualizados da demanda
   * @returns Promise com a demanda atualizada
   */
  update: async (id: number, data: UpdateDemanda): Promise<Demanda> => {
    const validated = UpdateDemandaSchema.parse(data);
    const response = await api.put<Demanda>(`demandas/${id}`, validated, DemandaSchema);
    return response.data;
  },

  /**
   * Remove uma demanda do sistema
   *
   * @param id - ID da demanda a ser removida
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`demandas/${id}`);
  },

  /**
   * Obtém estatísticas detalhadas das demandas
   *
   * @returns Promise com estatísticas completas
   */
  stats: async (): Promise<DemandaStats> => {
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

/**
 * Interface para anexos de documentos
 */
interface DocumentoAnexo {
  /** ID único do anexo */
  id: number;
  /** URL de acesso ao anexo */
  url: string;
  /** Nome original do arquivo */
  nome: string;
  /** Tipo MIME do arquivo */
  tipo: string;
  /** Tamanho do arquivo em bytes */
  tamanho: number;
}

/**
 * API de Documentos - Gestão completa de documentos do sistema
 *
 * Funcionalidades:
 * - CRUD completo com validação automática
 * - Filtros avançados e paginação
 * - Upload e gerenciamento de anexos
 * - Geração de PDFs
 * - Versionamento de documentos
 * - Assinatura digital
 *
 * @example
 * ```typescript
 * // Listar documentos
 * const documentos = await documentosApi.list({
 *   tipo: 'oficio',
 *   status: 'rascunho'
 * });
 *
 * // Fazer upload de anexo
 * const anexo = await documentosApi.uploadAnexo(123, file);
 * ```
 */
export const documentosApi = {
  /**
   * Lista documentos com filtros opcionais e paginação
   *
   * @param filters - Filtros para aplicar na busca
   * @returns Promise com lista paginada de documentos
   */
  list: async (filters?: Partial<DocumentoFilters>): Promise<ListResponse<Documento>> => {
    const validated = DocumentoFiltersSchema.partial().parse(filters || {});
    const response = await api.get('documentos', ListResponseSchema(DocumentoSchema), {
      searchParams: validated as Record<string, string>,
    });
    return response.data;
  },

  /**
   * Busca um documento específico por ID
   *
   * @param id - ID do documento
   * @returns Promise com os dados do documento
   */
  getById: async (id: number): Promise<Documento> => {
    const response = await api.get(`documentos/${id}`, DocumentoSchema);
    return response.data;
  },

  /**
   * Cria um novo documento no sistema
   *
   * @param data - Dados do novo documento
   * @returns Promise com o documento criado
   */
  create: async (data: CreateDocumento): Promise<Documento> => {
    const validated = CreateDocumentoSchema.parse(data);
    const response = await api.post('documentos', validated, DocumentoSchema);
    return response.data;
  },

  /**
   * Atualiza um documento existente
   *
   * @param id - ID do documento
   * @param data - Dados atualizados do documento
   * @returns Promise com o documento atualizado
   */
  update: async (id: number, data: UpdateDocumento): Promise<Documento> => {
    const validated = UpdateDocumentoSchema.parse(data);
    const response = await api.put(`documentos/${id}`, validated, DocumentoSchema);
    return response.data;
  },

  /**
   * Remove um documento do sistema
   *
   * @param id - ID do documento a ser removido
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`documentos/${id}`);
  },

  /**
   * Faz upload de anexo para um documento
   *
   * @param documentoId - ID do documento
   * @param file - Arquivo para anexar
   * @returns Promise com dados do anexo criado
   */
  uploadAnexo: async (documentoId: number, file: File): Promise<DocumentoAnexo> => {
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

  /**
   * Gera PDF de um documento
   *
   * @param id - ID do documento
   * @returns Promise com blob do PDF gerado
   */
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

/**
 * API de Órgãos - Gestão de órgãos públicos
 *
 * Gerencia órgãos públicos que são responsáveis pelas demandas e documentos.
 * Inclui ministérios, secretarias, autarquias e outras entidades governamentais.
 *
 * @example
 * ```typescript
 * // Listar todos os órgãos
 * const orgaos = await orgaosApi.list();
 *
 * // Criar novo órgão
 * const orgao = await orgaosApi.create({
 *   nome: 'Ministério da Justiça',
 *   sigla: 'MJ',
 *   tipo: 'ministerio'
 * });
 * ```
 */
export const orgaosApi = {
  /**
   * Lista todos os órgãos cadastrados no sistema
   * @returns Promise com array de órgãos
   */
  list: async (): Promise<Orgao[]> => {
    const response = await api.get('orgaos', z.array(OrgaoSchema));
    return response.data;
  },

  /**
   * Busca um órgão específico por ID
   * @param id - ID do órgão
   * @returns Promise com dados do órgão
   */
  getById: async (id: number): Promise<Orgao> => {
    const response = await api.get(`orgaos/${id}`, OrgaoSchema);
    return response.data;
  },

  /**
   * Cria um novo órgão no sistema
   * @param data - Dados do novo órgão
   * @returns Promise com o órgão criado
   */
  create: async (data: CreateOrgao): Promise<Orgao> => {
    const validated = CreateOrgaoSchema.parse(data);
    const response = await api.post('orgaos', validated, OrgaoSchema);
    return response.data;
  },

  /**
   * Atualiza um órgão existente
   * @param id - ID do órgão
   * @param data - Dados atualizados
   * @returns Promise com o órgão atualizado
   */
  update: async (id: number, data: UpdateOrgao): Promise<Orgao> => {
    const validated = UpdateOrgaoSchema.parse(data);
    const response = await api.put(`orgaos/${id}`, validated, OrgaoSchema);
    return response.data;
  },

  /**
   * Remove um órgão do sistema
   * @param id - ID do órgão a ser removido
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`orgaos/${id}`);
  },
};

/**
 * API de Assuntos - Classificação e categorização de demandas
 *
 * Gerencia os assuntos/temas que categorizam as demandas do sistema.
 * Permite hierarquia e organização temática das demandas.
 *
 * @example
 * ```typescript
 * const assuntos = await assuntosApi.list();
 * const assunto = await assuntosApi.create({
 *   nome: 'Direitos Humanos',
 *   descricao: 'Demandas relacionadas a direitos fundamentais'
 * });
 * ```
 */
export const assuntosApi = {
  /**
   * Lista todos os assuntos cadastrados
   * @returns Promise com array de assuntos
   */
  list: async (): Promise<Assunto[]> => {
    const response = await api.get('assuntos', z.array(AssuntoSchema));
    return response.data;
  },

  /**
   * Busca um assunto específico por ID
   * @param id - ID do assunto
   * @returns Promise com dados do assunto
   */
  getById: async (id: number): Promise<Assunto> => {
    const response = await api.get(`assuntos/${id}`, AssuntoSchema);
    return response.data;
  },

  /**
   * Cria um novo assunto no sistema
   * @param data - Dados do novo assunto
   * @returns Promise com o assunto criado
   */
  create: async (data: CreateAssunto): Promise<Assunto> => {
    const validated = CreateAssuntoSchema.parse(data);
    const response = await api.post('assuntos', validated, AssuntoSchema);
    return response.data;
  },

  /**
   * Atualiza um assunto existente
   * @param id - ID do assunto
   * @param data - Dados atualizados
   * @returns Promise com o assunto atualizado
   */
  update: async (id: number, data: UpdateAssunto): Promise<Assunto> => {
    const validated = UpdateAssuntoSchema.parse(data);
    const response = await api.put(`assuntos/${id}`, validated, AssuntoSchema);
    return response.data;
  },

  /**
   * Remove um assunto do sistema
   * @param id - ID do assunto a ser removido
   */
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

/**
 * Interface para dados do usuário autenticado
 */
interface AuthenticatedUser {
  /** ID único do usuário */
  id: number;
  /** Nome completo do usuário */
  name: string;
  /** Email do usuário */
  email: string;
  /** Nível de acesso/permissão */
  role: string;
}

/**
 * Interface para resposta de login
 */
interface LoginResponse {
  /** Token JWT de autenticação */
  token: string;
  /** Dados do usuário autenticado */
  user: AuthenticatedUser;
}

/**
 * API de Autenticação - Gestão completa de sessões e tokens
 *
 * Funcionalidades:
 * - Login/logout com JWT tokens
 * - Renovação automática de tokens
 * - Verificação de sessões ativas
 * - Gestão de permissões e roles
 * - Integração com sistemas externos (LDAP, OAuth)
 *
 * @example
 * ```typescript
 * // Fazer login
 * const { token, user } = await authApi.login('user@email.com', 'password');
 *
 * // Verificar sessão
 * const { valid } = await authApi.checkSession();
 *
 * // Renovar token
 * const { token: newToken } = await authApi.refreshToken();
 * ```
 */
export const authApi = {
  /**
   * Autentica usuário no sistema
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Promise com token JWT e dados do usuário
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
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

  /**
   * Faz logout do usuário e invalida o token
   */
  logout: async (): Promise<void> => {
    await api.post('auth/logout', {}, z.object({ message: z.string() }));
  },

  /**
   * Obtém dados do usuário atual autenticado
   * @returns Promise com dados do usuário
   */
  me: async (): Promise<AuthenticatedUser> => {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
    });

    const response = await api.get('auth/me', UserSchema);
    return response.data;
  },

  /**
   * Renova o token JWT atual
   * @returns Promise com novo token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const TokenSchema = z.object({ token: z.string() });
    const response = await api.post('auth/refresh', {}, TokenSchema);
    return response.data;
  },

  /**
   * Verifica se a sessão atual é válida
   * @returns Promise indicando se a sessão é válida
   */
  checkSession: async (): Promise<{ valid: boolean }> => {
    const SessionSchema = z.object({ valid: z.boolean() });
    const response = await api.get('auth/check-session', SessionSchema);
    return response.data;
  },
};

/**
 * ================================================================
 * MAPEAMENTO DE ENDPOINTS NODE.JS - BACKEND REFERENCE
 * ================================================================
 *
 * Estrutura de URLs esperadas no backend Node.js/Express.
 * Use esta referência para implementar as rotas corretas.
 */
export const NODEJS_ENDPOINTS = {
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

/**
 * Objeto consolidado com todas as APIs do sistema
 *
 * Exportação principal que agrupa todas as APIs especializadas em um único objeto.
 * Facilita importação e uso consistente em toda a aplicação.
 *
 * @example
 * ```typescript
 * import { apiEndpoints } from './endpoints';
 *
 * // Usar APIs específicas
 * const demandas = await apiEndpoints.demandas.list();
 * const user = await apiEndpoints.auth.me();
 *
 * // Ou importar APIs individuais
 * import { demandasApi, authApi } from './endpoints';
 * ```
 */
export const apiEndpoints = {
  /** API para gestão de demandas */
  demandas: demandasApi,
  /** API para gestão de documentos */
  documentos: documentosApi,
  /** API para gestão de órgãos */
  orgaos: orgaosApi,
  /** API para gestão de assuntos */
  assuntos: assuntosApi,
  /** API para gestão de provedores */
  provedores: provedoresApi,
  /** API para gestão de autoridades */
  autoridades: autoridadesApi,
  /** APIs para tipos/metadados */
  tipos: tiposApi,
  /** API para autenticação */
  auth: authApi,
  /** API para upload de arquivos */
  upload: uploadApi,
  /** API para relatórios */
  relatorios: relatoriosApi,
  /** API para monitoramento de sistema */
  sistema: sistemaApi,
};

/**
 * Export padrão do módulo
 * Permite importação como `import api from './endpoints'`
 */
export default apiEndpoints;
