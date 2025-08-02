// src/constants/routes.ts

export const ROUTES = {
  HOME: '/',

  // Demandas
  DEMANDAS: '/demandas',
  DEMANDAS_NEW: '/demandas/nova',
  DEMANDAS_DETAIL: (id: string | number) => `/demandas/${id}`,

  // Documentos
  DOCUMENTOS: '/documentos',
  DOCUMENTOS_NEW: '/documentos/novo',

  // Cadastros
  CADASTROS: '/cadastros',
  CADASTROS_ASSUNTOS: '/cadastros/assuntos',
  CADASTROS_ORGAOS: '/cadastros/orgaos',
  CADASTROS_AUTORIDADES: '/cadastros/autoridades',
  CADASTROS_TIPOS_DOCUMENTOS: '/cadastros/tipos-documentos',
  CADASTROS_DISTRIBUIDORES: '/cadastros/distribuidores',
  CADASTROS_PROVEDORES: '/cadastros/provedores',
  CADASTROS_TIPOS_DEMANDAS: '/cadastros/tipos-demandas',
  CADASTROS_TIPOS_IDENTIFICADORES: '/cadastros/tipos-identificadores',
  CADASTROS_TIPOS_MIDIAS: '/cadastros/tipos-midias',

  // Configurações
  CONFIGURACOES_REGRAS: '/configuracoes/regras',
  CONFIGURACOES_SISTEMA: '/configuracoes/sistema',

  // Relatórios
  RELATORIOS: '/relatorios',
} as const;

export const ROUTE_TITLES = {
  [ROUTES.HOME]: 'Início',
  [ROUTES.DEMANDAS]: 'Demandas',
  [ROUTES.DEMANDAS_NEW]: 'Nova Demanda',
  [ROUTES.DOCUMENTOS]: 'Documentos',
  [ROUTES.DOCUMENTOS_NEW]: 'Novo Documento',
  [ROUTES.CADASTROS]: 'Cadastros',
  [ROUTES.CADASTROS_ASSUNTOS]: 'Gerenciar Assuntos',
  [ROUTES.CADASTROS_ORGAOS]: 'Gerenciar Órgãos',
  [ROUTES.CADASTROS_AUTORIDADES]: 'Gerenciar Autoridades',
  [ROUTES.CADASTROS_TIPOS_DOCUMENTOS]: 'Gerenciar Tipos de Documentos',
  [ROUTES.CADASTROS_DISTRIBUIDORES]: 'Gerenciar Distribuidores',
  [ROUTES.CADASTROS_PROVEDORES]: 'Gerenciar Provedores',
  [ROUTES.CADASTROS_TIPOS_DEMANDAS]: 'Gerenciar Tipos de Demandas',
  [ROUTES.CADASTROS_TIPOS_IDENTIFICADORES]:
    'Gerenciar Tipos de Identificadores',
  [ROUTES.CADASTROS_TIPOS_MIDIAS]: 'Gerenciar Tipos de Mídias',
  [ROUTES.CONFIGURACOES_REGRAS]: 'Regras',
  [ROUTES.CONFIGURACOES_SISTEMA]: 'Sistema',
  [ROUTES.RELATORIOS]: 'Relatórios',
} as const;
