// src/types/entities.ts

// Base entity interface
export interface BaseEntity {
  id: number;
}

// Simple entity interface for entities with just name
export interface SimpleEntity extends BaseEntity {
  nome: string;
}

// Domain entities
export interface Demanda extends BaseEntity {
  sged: string;
  tipoDemanda: string;
  autosAdministrativos?: string;
  pic?: string;
  autosJudiciais?: string;
  autosExtrajudiciais?: string;
  alvos: string | number;
  identificadores: string | number;
  distribuidor: string;
  assunto: string;
  orgao: string;
  status: 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';
  analista: string;
  dataInicial: string; // Format: YYYY-MM-DD
  dataFinal: string | null;
  dataReabertura?: string | null; // Format: YYYY-MM-DD
  novaDataFinal?: string | null; // Format: YYYY-MM-DD
}

export interface Assunto extends SimpleEntity {
  descricao?: string;
}

export interface TipoDemanda extends SimpleEntity {
  descricao?: string;
}

export interface TipoDocumento extends SimpleEntity {
  descricao?: string;
}

export interface TipoIdentificador extends SimpleEntity {
  formato?: string;
}

export interface Distribuidor extends SimpleEntity {
  email?: string;
}

export interface TipoMidia extends SimpleEntity {
  extensao?: string;
}

export interface Autoridade extends BaseEntity {
  nome: string;
  cargo: string;
}

export interface Orgao extends BaseEntity {
  abreviacao: string;
  nomeCompleto: string;
  enderecamento: string;
}

export interface Provedor extends BaseEntity {
  nomeFantasia: string;
  razaoSocial: string;
  enderecamento: string;
}

// Union types for different entity categories
export type CadastroEntity =
  | Assunto
  | TipoDemanda
  | TipoDocumento
  | TipoIdentificador
  | Distribuidor
  | TipoMidia
  | Autoridade
  | Orgao
  | Provedor;

export type SimpleEntityType =
  | Assunto
  | TipoDemanda
  | TipoDocumento
  | TipoIdentificador
  | Distribuidor
  | TipoMidia;
