// src/hooks/validation/useDocumentValidation.ts
import { useMemo } from 'react';
import { type ValidationSchema, useFormValidation, validationRules } from './useFormValidation';

// Specific types for document validation
export interface DocumentFormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: { nome: string } | null;
  destinatarios: { value: string; label: string }[];
  enderecamento: { nome: string } | null;
  numeroDocumento: string;
  anoDocumento: string;
  analista: { nome: string } | null;
  autoridade: { nome: string } | null;
  orgaoJudicial: { nome: string } | null;
  dataAssinatura: string;
  retificada: boolean;
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  pesquisas: { tipo: string; identificador: string; complementar?: string }[];
}

export interface DocumentValidationContext extends DocumentFormData {
  sectionVisibility: {
    section2: boolean;
    section3: boolean;
    section4: boolean;
  };
  [key: string]: unknown;
}

// Custom validation rules for document form
const documentValidationRules = {
  objectWithName: (_message: string) => validationRules.custom((value): boolean => {
    return Boolean(value && typeof value === 'object' && 
      (value as { nome?: string }).nome && 
      (value as { nome: string }).nome.trim() !== '');
  }),

  conditionalRequired: (condition: (context?: unknown) => boolean, message: string) =>
    validationRules.conditional(condition, validationRules.required(message)),

  arrayMinLength: (min: number, _message: string) => validationRules.custom((value): boolean => {
    return Array.isArray(value) && value.length >= min;
  }),

  destinatarioValidation: validationRules.custom((value, context?: unknown): boolean => {
    const ctx = context as DocumentValidationContext;
    if (ctx && ctx.tipoDocumento === 'Ofício Circular') {
      return Array.isArray(ctx.destinatarios) && ctx.destinatarios.length > 0;
    } else {
      return Boolean(value && typeof value === 'object' && 
        (value as { nome?: string }).nome && 
        (value as { nome: string }).nome.trim() !== '');
    }
  }),

  assuntoValidation: validationRules.custom((value, context?: unknown): boolean => {
    const ctx = context as DocumentValidationContext;
    if (ctx && ctx.tipoDocumento === 'Mídia') {
      return true; // Assunto is optional for Mídia
    }
    return Boolean(value && typeof value === 'string' && value.trim() !== '');
  }),

  assuntoOutrosValidation: validationRules.custom((value, context?: unknown): boolean => {
    const ctx = context as DocumentValidationContext;
    if (ctx && ctx.assunto === 'Outros') {
      return Boolean(value && typeof value === 'string' && value.trim() !== '');
    }
    return true;
  })
};

export function useDocumentValidation(
  onToast?: (message: string, type: 'error' | 'warning' | 'success') => void
) {
  // Create validation schema
  const validationSchema: ValidationSchema = useMemo(() => ({
    // Basic section
    tipoDocumento: validationRules.required('Por favor, selecione o Tipo de Documento'),
    
    assunto: documentValidationRules.assuntoValidation,
    
    assuntoOutros: documentValidationRules.assuntoOutrosValidation,
    
    destinatario: documentValidationRules.destinatarioValidation,
    
    enderecamento: documentValidationRules.objectWithName('Por favor, preencha o Endereçamento'),
    
    numeroDocumento: validationRules.required('Por favor, preencha o Número do Documento'),
    
    anoDocumento: [
      validationRules.required('Por favor, preencha o Ano'),
      validationRules.pattern(/^\d{4}$/, 'Ano deve ter 4 dígitos')
    ],
    
    analista: documentValidationRules.objectWithName('Por favor, selecione o Analista'),

    // Section 2 - Judicial Decision Data (conditional)
    autoridade: documentValidationRules.conditionalRequired(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section2 ?? false,
      'Por favor, preencha a Autoridade'
    ),
    
    orgaoJudicial: documentValidationRules.conditionalRequired(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section2 ?? false,
      'Por favor, preencha o Órgão Judicial'
    ),
    
    dataAssinatura: [
      documentValidationRules.conditionalRequired(
        (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section2 ?? false,
        'Por favor, preencha a Data da Assinatura'
      ),
      validationRules.dateFormat('DD/MM/YYYY'),
      validationRules.futureDate()
    ],

    // Section 3 - Media Data (conditional)
    tipoMidia: documentValidationRules.conditionalRequired(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section3 ?? false,
      'Por favor, selecione o Tipo da Mídia'
    ),
    
    tamanhoMidia: documentValidationRules.conditionalRequired(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section3 ?? false,
      'Por favor, preencha o Tamanho da Mídia'
    ),
    
    hashMidia: documentValidationRules.conditionalRequired(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section3 ?? false,
      'Por favor, preencha o Hash da Mídia'
    ),
    
    senhaMidia: documentValidationRules.conditionalRequired(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section3 ?? false,
      'Por favor, preencha a Senha de Acesso da Mídia'
    ),

    // Section 4 - Research Data (conditional)
    pesquisas: validationRules.conditional(
      (context?: unknown) => (context as DocumentValidationContext)?.sectionVisibility?.section4 ?? false,
      documentValidationRules.arrayMinLength(1, 'Por favor, adicione pelo menos uma pesquisa')
    )
  }), []);

  const validation = useFormValidation<DocumentValidationContext>(validationSchema, onToast);

  // Extended validation for complex scenarios
  const validateChronologicalDates = (
    formData: DocumentFormData,
    retificacoes: { dataAssinatura: string }[]
  ): { isValid: boolean; message?: string } => {
    if (!formData.retificada || retificacoes.length === 0) {
      return { isValid: true };
    }

    const parseDate = (dateString: string): Date | null => {
      if (!dateString.trim()) {return null;}
      const [day, month, year] = dateString.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
      }
      return date;
    };

    const mainDecisionDate = parseDate(formData.dataAssinatura);
    if (!mainDecisionDate && formData.dataAssinatura.trim()) {
      return {
        isValid: false,
        message: 'Data da decisão judicial inválida para validar retificações'
      };
    }

    let previousDate = mainDecisionDate;
    let previousName = 'decisão judicial';

    for (let i = 0; i < retificacoes.length; i++) {
      const retificacao = retificacoes[i];
      const retificationNumber = i + 1;

      if (retificacao.dataAssinatura.trim()) {
        const retificationDate = parseDate(retificacao.dataAssinatura);

        if (!retificationDate) {
          return {
            isValid: false,
            message: `Data da ${retificationNumber}ª Decisão Retificadora inválida`
          };
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (retificationDate > today) {
          return {
            isValid: false,
            message: `Data de assinatura da ${retificationNumber}ª Decisão Retificadora não pode ser posterior à data atual.`
          };
        }

        if (previousDate && retificationDate <= previousDate) {
          return {
            isValid: false,
            message: `Data da assinatura da ${retificationNumber}ª Decisão Retificadora deve ser posterior à ${previousName}`
          };
        }

        previousDate = retificationDate;
        previousName = `${retificationNumber}ª Decisão Retificadora`;
      }
    }

    return { isValid: true };
  };

  const validateResearchItems = (pesquisas: DocumentFormData['pesquisas']): { isValid: boolean; message?: string } => {
    for (let i = 0; i < pesquisas.length; i++) {
      const pesquisa = pesquisas[i];
      
      if (!pesquisa.tipo.trim()) {
        return {
          isValid: false,
          message: `Por favor, selecione o tipo para a ${i + 1}ª pesquisa`
        };
      }

      if (!pesquisa.identificador.trim()) {
        return {
          isValid: false,
          message: `Por favor, preencha o identificador para a ${i + 1}ª pesquisa`
        };
      }
    }

    return { isValid: true };
  };

  return {
    ...validation,
    validateChronologicalDates,
    validateResearchItems,
    documentValidationRules
  };
}