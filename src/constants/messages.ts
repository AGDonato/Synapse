// src/constants/messages.ts

export const MESSAGES = {
  // Success messages
  SUCCESS: {
    ITEM_CREATED: (entity: string) => `${entity} criado com sucesso!`,
    ITEM_UPDATED: (entity: string) => `${entity} atualizado com sucesso!`,
    ITEM_DELETED: (entity: string) => `${entity} excluído com sucesso!`,
    OPERATION_COMPLETED: 'Operação realizada com sucesso!',
  },

  // Error messages
  ERROR: {
    ITEM_NOT_FOUND: (entity: string) => `${entity} não encontrado.`,
    CREATION_FAILED: (entity: string) => `Erro ao criar ${entity}.`,
    UPDATE_FAILED: (entity: string) => `Erro ao atualizar ${entity}.`,
    DELETE_FAILED: (entity: string) => `Erro ao excluir ${entity}.`,
    NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
    UNKNOWN_ERROR: 'Ocorreu um erro inesperado.',
    REQUIRED_FIELD: (field: string) => `${field} é obrigatório.`,
    INVALID_FORMAT: (field: string) => `${field} possui formato inválido.`,
  },

  // Confirmation messages
  CONFIRM: {
    DELETE_ITEM: (entity: string) =>
      `Tem certeza que deseja excluir este ${entity}?`,
    UNSAVED_CHANGES: 'Há alterações não salvas. Deseja sair mesmo assim?',
    RESET_FORM: 'Deseja limpar o formulário?',
  },

  // Loading messages
  LOADING: {
    DEFAULT: 'Carregando...',
    SAVING: 'Salvando...',
    DELETING: 'Excluindo...',
    SEARCHING: 'Pesquisando...',
  },

  // Empty state messages
  EMPTY: {
    NO_ITEMS: (entity: string) => `Nenhum ${entity} encontrado.`,
    NO_RESULTS: 'Nenhum resultado encontrado para sua busca.',
    NO_DATA: 'Não há dados para exibir.',
  },

  // Validation messages
  VALIDATION: {
    MIN_LENGTH: (field: string, min: number) =>
      `${field} deve ter pelo menos ${min} caracteres.`,
    MAX_LENGTH: (field: string, max: number) =>
      `${field} deve ter no máximo ${max} caracteres.`,
    EMAIL_INVALID: 'Email deve ter um formato válido.',
    PASSWORD_WEAK:
      'Senha deve ter pelo menos 8 caracteres, incluindo letras e números.',
  },
} as const;

export const ENTITY_NAMES = {
  DEMANDA: 'demanda',
  ASSUNTO: 'assunto',
  ORGAO: 'órgão',
  AUTORIDADE: 'autoridade',
  TIPO_DOCUMENTO: 'tipo de documento',
  DISTRIBUIDOR: 'distribuidor',
  PROVEDOR: 'provedor',
  TIPO_DEMANDA: 'tipo de demanda',
  TIPO_IDENTIFICADOR: 'tipo de identificador',
  TIPO_MIDIA: 'tipo de mídia',
} as const;
