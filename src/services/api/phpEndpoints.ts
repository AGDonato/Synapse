/**
 * PHP Endpoints Configuration
 * Mapeamento de endpoints para integração com backend PHP
 */

import { type PHPRequestConfig, phpApiClient } from './phpApiClient';
import type { BaseEntity, CreateDTO, PaginationParams, UpdateDTO } from '../../types/api';

export interface PHPEndpointConfig {
  list: string;
  show: string;
  create: string;
  update: string;
  delete: string;
  search?: string;
  bulk?: {
    create: string;
    update: string;
    delete: string;
  };
}

/**
 * Configuração de endpoints por entidade
 */
export const PHP_ENDPOINTS = {
  // Autenticação
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    check: '/auth/check-session'
  },

  // Demandas
  demandas: {
    list: '/demandas',
    show: '/demandas/{id}',
    create: '/demandas',
    update: '/demandas/{id}',
    delete: '/demandas/{id}',
    search: '/demandas/search',
    bulk: {
      create: '/demandas/bulk',
      update: '/demandas/bulk-update',
      delete: '/demandas/bulk-delete'
    },
    // Endpoints específicos
    status: '/demandas/{id}/status',
    timeline: '/demandas/{id}/timeline',
    documents: '/demandas/{id}/documentos'
  },

  // Documentos
  documentos: {
    list: '/documentos',
    show: '/documentos/{id}',
    create: '/documentos',
    update: '/documentos/{id}',
    delete: '/documentos/{id}',
    search: '/documentos/search',
    bulk: {
      create: '/documentos/bulk',
      update: '/documentos/bulk-update',
      delete: '/documentos/bulk-delete'
    },
    // Endpoints específicos
    upload: '/documentos/{id}/upload',
    download: '/documentos/{id}/download'
  },

  // Cadastros
  assuntos: {
    list: '/assuntos',
    show: '/assuntos/{id}',
    create: '/assuntos',
    update: '/assuntos/{id}',
    delete: '/assuntos/{id}',
    search: '/assuntos/search'
  },

  orgaos: {
    list: '/orgaos',
    show: '/orgaos/{id}',
    create: '/orgaos',
    update: '/orgaos/{id}',
    delete: '/orgaos/{id}',
    search: '/orgaos/search',
    hierarchy: '/orgaos/hierarchy'
  },

  autoridades: {
    list: '/autoridades',
    show: '/autoridades/{id}',
    create: '/autoridades',
    update: '/autoridades/{id}',
    delete: '/autoridades/{id}',
    search: '/autoridades/search'
  },

  provedores: {
    list: '/provedores',
    show: '/provedores/{id}',
    create: '/provedores',
    update: '/provedores/{id}',
    delete: '/provedores/{id}',
    search: '/provedores/search'
  },

  distribuidores: {
    list: '/distribuidores',
    show: '/distribuidores/{id}',
    create: '/distribuidores',
    update: '/distribuidores/{id}',
    delete: '/distribuidores/{id}',
    search: '/distribuidores/search'
  },

  // Tipos
  tiposdemandas: {
    list: '/tipos-demandas',
    show: '/tipos-demandas/{id}',
    create: '/tipos-demandas',
    update: '/tipos-demandas/{id}',
    delete: '/tipos-demandas/{id}',
    search: '/tipos-demandas/search'
  },

  tiposdocumentos: {
    list: '/tipos-documentos',
    show: '/tipos-documentos/{id}',
    create: '/tipos-documentos',
    update: '/tipos-documentos/{id}',
    delete: '/tipos-documentos/{id}',
    search: '/tipos-documentos/search'
  },

  tiposidentificadores: {
    list: '/tipos-identificadores',
    show: '/tipos-identificadores/{id}',
    create: '/tipos-identificadores',
    update: '/tipos-identificadores/{id}',
    delete: '/tipos-identificadores/{id}',
    search: '/tipos-identificadores/search'
  },

  tiposmidias: {
    list: '/tipos-midias',
    show: '/tipos-midias/{id}',
    create: '/tipos-midias',
    update: '/tipos-midias/{id}',
    delete: '/tipos-midias/{id}',
    search: '/tipos-midias/search'
  },

  // Relatórios e Analytics
  relatorios: {
    demandas: '/relatorios/demandas',
    documentos: '/relatorios/documentos',
    performance: '/relatorios/performance',
    usuarios: '/relatorios/usuarios'
  },

  // Sistema
  sistema: {
    health: '/sistema/health',
    config: '/sistema/config',
    logs: '/sistema/logs',
    backup: '/sistema/backup'
  },

  // Upload de arquivos
  upload: {
    single: '/upload/single',
    multiple: '/upload/multiple',
    chunk: '/upload/chunk'
  },

  // WebSocket
  websocket: {
    connect: '/ws/connect',
    rooms: '/ws/rooms',
    users: '/ws/users'
  }
} as const;

/**
 * Classe para operações CRUD genéricas em PHP
 */
export class PHPCrudService<T extends BaseEntity> {
  private endpoints: PHPEndpointConfig;
  private entityName: string;

  constructor(endpoints: PHPEndpointConfig, entityName: string) {
    this.endpoints = endpoints;
    this.entityName = entityName;
  }

  /**
   * Interpolar parâmetros na URL
   */
  private interpolateUrl(template: string, params: Record<string, unknown>): string {
    let url = template;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, String(value));
    }
    return url;
  }

  /**
   * Listar entidades com paginação
   */
  async list(pagination?: PaginationParams, filters?: Record<string, unknown>) {
    const params: Record<string, unknown> = {};
    
    if (pagination) {
      params.page = pagination.page;
      params.limit = pagination.limit;
      if (pagination.sortBy) {
        params.sort_by = pagination.sortBy;
        params.sort_order = pagination.sortOrder || 'asc';
      }
    }

    if (filters) {
      Object.assign(params, filters);
    }

    return phpApiClient.get<T[]>(this.endpoints.list, { params });
  }

  /**
   * Buscar entidade por ID
   */
  async show(id: number) {
    const url = this.interpolateUrl(this.endpoints.show, { id });
    return phpApiClient.get<T>(url);
  }

  /**
   * Criar nova entidade
   */
  async create(data: CreateDTO<T>) {
    return phpApiClient.post<T>(this.endpoints.create, data);
  }

  /**
   * Atualizar entidade
   */
  async update(id: number, data: UpdateDTO<T>) {
    const url = this.interpolateUrl(this.endpoints.update, { id });
    return phpApiClient.put<T>(url, data);
  }

  /**
   * Deletar entidade
   */
  async delete(id: number) {
    const url = this.interpolateUrl(this.endpoints.delete, { id });
    return phpApiClient.delete(url);
  }

  /**
   * Buscar entidades
   */
  async search(query: string, filters?: Record<string, unknown>) {
    const searchEndpoint = this.endpoints.search;
    if (!searchEndpoint) {
      throw new Error(`Search endpoint not configured for ${this.entityName}`);
    }

    const params = { q: query, ...filters };
    return phpApiClient.get<T[]>(searchEndpoint, { params });
  }

  /**
   * Operações em lote - Criar múltiplas entidades
   */
  async bulkCreate(data: CreateDTO<T>[]) {
    if (!this.endpoints.bulk?.create) {
      throw new Error(`Bulk create not supported for ${this.entityName}`);
    }
    
    return phpApiClient.post<T[]>(this.endpoints.bulk.create, { items: data });
  }

  /**
   * Operações em lote - Atualizar múltiplas entidades
   */
  async bulkUpdate(updates: { id: number; data: UpdateDTO<T> }[]) {
    if (!this.endpoints.bulk?.update) {
      throw new Error(`Bulk update not supported for ${this.entityName}`);
    }
    
    return phpApiClient.put<T[]>(this.endpoints.bulk.update, { items: updates });
  }

  /**
   * Operações em lote - Deletar múltiplas entidades
   */
  async bulkDelete(ids: number[]) {
    if (!this.endpoints.bulk?.delete) {
      throw new Error(`Bulk delete not supported for ${this.entityName}`);
    }
    
    return phpApiClient.delete(this.endpoints.bulk.delete, { data: { ids } });
  }
}

/**
 * Factory para criar services CRUD
 */
export function createPHPCrudService<T extends BaseEntity>(
  entityKey: keyof typeof PHP_ENDPOINTS
): PHPCrudService<T> {
  const endpoints = PHP_ENDPOINTS[entityKey] as PHPEndpointConfig;
  return new PHPCrudService<T>(endpoints, String(entityKey));
}

/**
 * Services específicos pré-configurados
 */
export const phpServices = {
  // CRUD Services
  demandas: createPHPCrudService(PHP_ENDPOINTS.demandas as any),
  documentos: createPHPCrudService(PHP_ENDPOINTS.documentos as any),
  assuntos: createPHPCrudService(PHP_ENDPOINTS.assuntos as any),
  orgaos: createPHPCrudService(PHP_ENDPOINTS.orgaos as any),
  autoridades: createPHPCrudService(PHP_ENDPOINTS.autoridades as any),
  provedores: createPHPCrudService(PHP_ENDPOINTS.provedores as any),
  distribuidores: createPHPCrudService(PHP_ENDPOINTS.distribuidores as any),

  // Autenticação
  auth: {
    async login(credentials: { username: string; password: string }) {
      return phpApiClient.post('/auth/login', credentials);
    },

    async logout() {
      return phpApiClient.post('/auth/logout');
    },

    async me() {
      return phpApiClient.get('/auth/me');
    },

    async refresh() {
      return phpApiClient.post('/auth/refresh');
    },

    async checkSession() {
      return phpApiClient.get('/auth/check-session');
    }
  },

  // Upload de arquivos
  upload: {
    async single(file: File, metadata?: Record<string, unknown>) {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      return fetch(`${phpApiClient.baseURL}/upload/single`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
    },

    async multiple(files: File[], metadata?: Record<string, unknown>) {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      return fetch(`${phpApiClient.baseURL}/upload/multiple`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
    }
  },

  // Relatórios
  relatorios: {
    async demandas(filters?: Record<string, unknown>) {
      return phpApiClient.get('/relatorios/demandas', { params: filters });
    },

    async documentos(filters?: Record<string, unknown>) {
      return phpApiClient.get('/relatorios/documentos', { params: filters });
    },

    async performance(period?: string) {
      return phpApiClient.get('/relatorios/performance', { params: { period } });
    }
  },

  // Sistema
  sistema: {
    async health() {
      return phpApiClient.get('/sistema/health');
    },

    async config() {
      return phpApiClient.get('/sistema/config');
    },

    async logs(filters?: Record<string, unknown>) {
      return phpApiClient.get('/sistema/logs', { params: filters });
    }
  }
};

// Export default
export default phpServices;