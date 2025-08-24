// src/pages/NovoDocumentoPage/hooks/useDocumentForm.ts

import { useReducer, useCallback } from 'react';
import type { MultiSelectOption } from '../../../components/forms/MultiSelectDropdown';

// Types
export interface SearchableField {
  id: number;
  nome: string;
}

export interface DestinatarioField extends SearchableField {
  razaoSocial?: string;
}

export type EnderecamentoField = SearchableField;
export type AnalistaField = SearchableField;
export type AutoridadeField = SearchableField;
export type OrgaoField = SearchableField;

export interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

export interface RetificacaoItem {
  id: string;
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
}

export interface DocumentFormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: DestinatarioField | null;
  destinatarios: MultiSelectOption[];
  enderecamento: EnderecamentoField | null;
  numeroDocumento: string;
  anoDocumento: string;
  analista: AnalistaField | null;
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  pesquisas: PesquisaItem[];
}

export interface DocumentFormState {
  formData: DocumentFormData;
  retificacoes: RetificacaoItem[];
  isDirty: boolean;
  isSubmitting: boolean;
}

// Action Types
export type DocumentFormAction =
  | { type: 'SET_FIELD'; field: keyof DocumentFormData; value: unknown }
  | { type: 'SET_SEARCH_FIELD'; field: string; value: string }
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Partial<DocumentFormData> }
  | { type: 'RESET_FORM'; initialData?: DocumentFormData }
  | { type: 'SET_RETIFICACOES'; retificacoes: RetificacaoItem[] }
  | { type: 'ADD_RETIFICACAO'; retificacao: RetificacaoItem }
  | {
      type: 'UPDATE_RETIFICACAO';
      id: string;
      updates: Partial<RetificacaoItem>;
    }
  | { type: 'REMOVE_RETIFICACAO'; id: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'MARK_CLEAN' }
  | { type: 'CLEAR_FIELDS'; clearedFields: Partial<DocumentFormData> };

// Initial form data
export const createInitialFormData = (): DocumentFormData => ({
  tipoDocumento: '',
  assunto: '',
  assuntoOutros: '',
  destinatario: null,
  destinatarios: [],
  enderecamento: null,
  numeroDocumento: '',
  anoDocumento: '',
  analista: null,
  autoridade: null,
  orgaoJudicial: null,
  dataAssinatura: '',
  retificada: false,
  tipoMidia: '',
  tamanhoMidia: '',
  hashMidia: '',
  senhaMidia: '',
  pesquisas: [{ tipo: '', identificador: '' }],
});

// Reducer function
const documentFormReducer = (
  state: DocumentFormState,
  action: DocumentFormAction
): DocumentFormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
          // Para Ofício Circular, definir endereçamento fixo quando destinatários mudarem
          ...(action.field === 'destinatarios' &&
          state.formData.tipoDocumento === 'Ofício Circular'
            ? {
                enderecamento: {
                  id: 0,
                  nome: 'Respectivos departamentos jurídicos',
                },
              }
            : {}),
        },
        isDirty: true,
      };

    case 'SET_SEARCH_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value.trim()
            ? { id: 0, nome: action.value }
            : null,
        },
        isDirty: true,
      };

    case 'SET_MULTIPLE_FIELDS':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.fields,
        },
        isDirty: true,
      };

    case 'CLEAR_FIELDS':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.clearedFields,
        },
        // Limpar retificações se seção 2 foi ocultada
        ...(action.clearedFields.autoridade === null
          ? { retificacoes: [] }
          : {}),
        isDirty: true,
      };

    case 'RESET_FORM':
      return {
        ...state,
        formData: action.initialData || createInitialFormData(),
        retificacoes: [],
        isDirty: false,
        isSubmitting: false,
      };

    case 'SET_RETIFICACOES':
      return {
        ...state,
        retificacoes: action.retificacoes,
        isDirty: true,
      };

    case 'ADD_RETIFICACAO':
      return {
        ...state,
        retificacoes: [...state.retificacoes, action.retificacao],
        isDirty: true,
      };

    case 'UPDATE_RETIFICACAO':
      return {
        ...state,
        retificacoes: state.retificacoes.map(ret =>
          ret.id === action.id ? { ...ret, ...action.updates } : ret
        ),
        isDirty: true,
      };

    case 'REMOVE_RETIFICACAO':
      return {
        ...state,
        retificacoes: state.retificacoes.filter(ret => ret.id !== action.id),
        isDirty: true,
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };

    case 'MARK_CLEAN':
      return {
        ...state,
        isDirty: false,
      };

    default:
      return state;
  }
};

// Hook
export const useDocumentForm = (initialData?: DocumentFormData) => {
  const [state, dispatch] = useReducer(documentFormReducer, {
    formData: initialData || createInitialFormData(),
    retificacoes: [],
    isDirty: false,
    isSubmitting: false,
  });

  // Action creators
  const setField = useCallback(
    (field: keyof DocumentFormData, value: unknown) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    []
  );

  const setSearchField = useCallback((field: string, value: string) => {
    dispatch({ type: 'SET_SEARCH_FIELD', field, value });
  }, []);

  const setMultipleFields = useCallback((fields: Partial<DocumentFormData>) => {
    dispatch({ type: 'SET_MULTIPLE_FIELDS', fields });
  }, []);

  const clearFields = useCallback(
    (clearedFields: Partial<DocumentFormData>) => {
      dispatch({ type: 'CLEAR_FIELDS', clearedFields });
    },
    []
  );

  const resetForm = useCallback((initialData?: DocumentFormData) => {
    dispatch({ type: 'RESET_FORM', initialData });
  }, []);

  const setRetificacoes = useCallback((retificacoes: RetificacaoItem[]) => {
    dispatch({ type: 'SET_RETIFICACOES', retificacoes });
  }, []);

  const addRetificacao = useCallback((retificacao: RetificacaoItem) => {
    dispatch({ type: 'ADD_RETIFICACAO', retificacao });
  }, []);

  const updateRetificacao = useCallback(
    (id: string, updates: Partial<RetificacaoItem>) => {
      dispatch({ type: 'UPDATE_RETIFICACAO', id, updates });
    },
    []
  );

  const removeRetificacao = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_RETIFICACAO', id });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting });
  }, []);

  const markClean = useCallback(() => {
    dispatch({ type: 'MARK_CLEAN' });
  }, []);

  return {
    // State
    formData: state.formData,
    retificacoes: state.retificacoes,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,

    // Actions
    setField,
    setSearchField,
    setMultipleFields,
    clearFields,
    resetForm,
    setRetificacoes,
    addRetificacao,
    updateRetificacao,
    removeRetificacao,
    setSubmitting,
    markClean,
  };
};
