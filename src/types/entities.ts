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
  autosAdministrativos: string;
  assunto: string;
  orgao: string;
  status: 'Pendente' | 'Em andamento' | 'Concluída';
  analista: string;
  dataInicial: string; // Format: YYYY-MM-DD
  dataFinal: string | null;
}

export interface Assunto extends SimpleEntity {
  // Assunto-specific properties can be added here if needed
}

export interface TipoDemanda extends SimpleEntity {
  // TipoDemanda-specific properties can be added here if needed
}

export interface TipoDocumento extends SimpleEntity {
  // TipoDocumento-specific properties can be added here if needed
}

export interface TipoIdentificador extends SimpleEntity {
  // TipoIdentificador-specific properties can be added here if needed
}

export interface Distribuidor extends SimpleEntity {
  // Distribuidor-specific properties can be added here if needed
}

export interface TipoMidia extends SimpleEntity {
  // TipoMidia-specific properties can be added here if needed
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
