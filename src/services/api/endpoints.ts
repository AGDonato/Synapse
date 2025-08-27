import { z } from 'zod';
import { api, httpClient } from './client';
import {
  type Assunto,
  AssuntoSchema,
  type Autoridade,
  AutoridadeSchema,
  type CreateAssunto,
  CreateAssuntoSchema,
  type CreateAutoridade,
  CreateAutoridade,
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

// Demandas API
export const demandasApi = {
  // List demandas with filters and pagination
  list: async (filters?: Partial<DemandaFilters>): Promise<ListResponse<Demanda>> => {
    const validated = DemandaFiltersSchema.partial().parse(filters || {});
    const response = await api.get(
      'demandas',
      ListResponseSchema(DemandaSchema),
      { searchParams: validated as Record<string, string> }
    );
    return response;
  },

  // Get single demanda by ID
  getById: async (id: number): Promise<Demanda> => {
    const response = await api.get(`demandas/${id}`, DemandaSchema);
    return response.data;
  },

  // Create new demanda
  create: async (data: CreateDemanda): Promise<Demanda> => {
    const validated = CreateDemandaSchema.parse(data);
    const response = await api.post('demandas', validated, DemandaSchema);
    return response.data;
  },

  // Update existing demanda
  update: async (id: number, data: UpdateDemanda): Promise<Demanda> => {
    const validated = UpdateDemandaSchema.parse(data);
    const response = await api.put(`demandas/${id}`, validated, DemandaSchema);
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
      por_prioridade: z.record(z.number()),
      por_orgao: z.array(z.object({
        orgao: z.string(),
        count: z.number(),
      })),
    });

    const response = await api.get('demandas/stats', StatsSchema);
    return response.data;
  },
};

// Documentos API
export const documentosApi = {
  // List documentos with filters and pagination
  list: async (filters?: Partial<DocumentoFilters>): Promise<ListResponse<Documento>> => {
    const validated = DocumentoFiltersSchema.partial().parse(filters || {});
    const response = await api.get(
      'documentos',
      ListResponseSchema(DocumentoSchema),
      { searchParams: validated as Record<string, string> }
    );
    return response;
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

    const response = await api.uploadFile(
      `documentos/${documentoId}/anexos`,
      file,
      AnexoSchema
    );
    return response.data;
  },

  // Generate PDF
  generatePdf: async (id: number): Promise<Blob> => {
    const response = await httpClient.get(`documentos/${id}/pdf`, {
      headers: { Accept: 'application/pdf' }
    });
    return await response.blob();
  },
};

// Órgãos API
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

// Assuntos API
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

// Provedores API
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

// Autoridades API
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
    const validated = CreateAutoridade.parse(data);
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

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: any }> => {
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

  me: async (): Promise<any> => {
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
};

// Export all APIs
export const apiEndpoints = {
  demandas: demandasApi,
  documentos: documentosApi,
  orgaos: orgaosApi,
  assuntos: assuntosApi,
  provedores: provedoresApi,
  autoridades: autoridadesApi,
  tipos: tiposApi,
  auth: authApi,
};

export default apiEndpoints;