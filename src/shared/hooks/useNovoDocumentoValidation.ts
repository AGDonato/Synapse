/**
 * Hook para validação especializada de novos documentos
 *
 * @description
 * Sistema de validação com regras de negócio para documentos:
 * - Validação de campos obrigatórios por tipo de documento
 * - Verificação de consistência entre campos relacionados
 * - Validação de formatos (datas, números, hashes)
 * - Regras condicionais baseadas no tipo de documento
 * - Validação de pesquisas e anexos
 * - Mensagens de erro personalizadas e descritivas
 *
 * @example
 * const validation = useNovoDocumentoValidation();
 *
 * // Validar formulário completo
 * const errors = validation.validateForm(formData);
 *
 * if (Object.keys(errors).length === 0) {
 *   // Formulário válido, pode prosseguir
 *   submitForm();
 * }
 *
 * // Validar campo individual
 * const fieldError = validation.validateField('numeroDocumento', value);
 *
 * @module hooks/useNovoDocumentoValidation
 */

/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
/* eslint-disable complexity */

import { useCallback } from 'react';
import type { MultiSelectOption } from '../../shared/components/forms/MultiSelectDropdown';

// ========== INTERFACES E TIPOS ==========
// Definições de tipos para formulário e validação de documentos
interface SearchableField {
  id: number;
  nome: string;
}

interface DestinatarioField extends SearchableField {
  razaoSocial?: string;
}

type EnderecamentoField = SearchableField;
type AnalistaField = SearchableField;
type AutoridadeField = SearchableField;
type OrgaoField = SearchableField;

interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

interface FormData {
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

interface RetificacaoItem {
  id: string;
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
}

interface SectionVisibility {
  section2: boolean;
  section3: boolean;
  section4: boolean;
}

type ToastType = 'error' | 'success' | 'warning';

interface UseNovoDocumentoValidationProps {
  formData: FormData;
  retificacoes: RetificacaoItem[];
  sectionVisibility: SectionVisibility;
  onShowToast: (message: string, type: ToastType) => void;
}

// ========== FUNÇÕES AUXILIARES ==========
// Converte string de data (DD/MM/AAAA) para objeto Date com validação
const parseDate = (dateString: string): Date | null => {
  if (!dateString.trim()) {
    return null;
  }

  const [day, month, year] = dateString.split('/').map(Number);
  if (!day || !month || !year) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Verifica se a data construída corresponde aos valores fornecidos (validação de data inválida como 31/02)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

// ========== FUNÇÕES DE VALIDAÇÃO ESPECÍFICAS ==========
// Validação de data de assinatura com regras de negócio
const validateDateSignature = (
  dataAssinatura: string,
  onShowToast: (message: string, type: ToastType) => void
): boolean => {
  if (!dataAssinatura.trim()) {
    return true;
  }

  const parsedDate = parseDate(dataAssinatura);
  // Define hoje como fim do dia para permitir datas até hoje
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  if (!parsedDate) {
    onShowToast('Data da assinatura inválida', 'error');
    return false;
  }

  if (parsedDate > hoje) {
    onShowToast('Data da assinatura não pode ser posterior à data atual', 'error');
    return false;
  }

  return true;
};

// Valida cadeia cronológica de retificações (cada retificação deve ser posterior à anterior)
const validateRetificationsChain = (
  formData: FormData,
  retificacoes: RetificacaoItem[],
  onShowToast: (message: string, type: ToastType) => void
): boolean => {
  if (!formData.retificada || retificacoes.length === 0) {
    return true;
  }

  // Data da decisão judicial é a referência inicial para validar ordem cronológica
  const dataDecisaoJudicial = parseDate(formData.dataAssinatura);
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  if (!dataDecisaoJudicial && formData.dataAssinatura.trim()) {
    onShowToast('Data da decisão judicial inválida para validar retificações', 'error');
    return false;
  }

  // Controla a ordem cronológica: cada retificação deve ser posterior à anterior
  let dataAnterior = dataDecisaoJudicial;
  let nomeAnterior = 'decisão judicial';

  for (let i = 0; i < retificacoes.length; i++) {
    const retificacao = retificacoes[i];
    const numeroRetificacao = i + 1;

    if (retificacao.dataAssinatura.trim()) {
      const dataRetificacao = parseDate(retificacao.dataAssinatura);

      if (!dataRetificacao) {
        onShowToast(`Data da ${numeroRetificacao}ª Decisão Retificadora inválida`, 'error');
        return false;
      }

      if (dataRetificacao > hoje) {
        onShowToast(
          `Data de assinatura da ${numeroRetificacao}ª Decisão Retificadora não pode ser posterior à data atual.`,
          'error'
        );
        return false;
      }

      if (dataAnterior && dataRetificacao <= dataAnterior) {
        onShowToast(
          `Data da assinatura da ${numeroRetificacao}ª Decisão Retificadora deve ser posterior à ${nomeAnterior}`,
          'error'
        );
        return false;
      }

      dataAnterior = dataRetificacao;
      nomeAnterior = `${numeroRetificacao}ª Decisão Retificadora`;
    }
  }

  return true;
};

const validateBasicFields = (
  formData: FormData,
  onShowToast: (message: string, type: ToastType) => void
): boolean => {
  if (!formData.tipoDocumento.trim()) {
    onShowToast('Por favor, selecione o Tipo de Documento', 'warning');
    const element = document.querySelector('[data-dropdown="tipoDocumento"]') as HTMLElement;
    element?.focus();
    return false;
  }

  if (formData.tipoDocumento !== 'Mídia' && !formData.assunto.trim()) {
    onShowToast('Por favor, selecione o Assunto', 'warning');
    const element = document.querySelector('[data-dropdown="assunto"]') as HTMLElement;
    element?.focus();
    return false;
  }

  if (formData.assunto === 'Outros' && !formData.assuntoOutros.trim()) {
    onShowToast('Por favor, especifique o assunto quando "Outros" é selecionado', 'warning');
    return false;
  }

  // Validação de destinatário baseada no tipo
  if (formData.tipoDocumento === 'Ofício Circular') {
    if (formData.destinatarios.length === 0) {
      onShowToast(
        'Por favor, selecione pelo menos um destinatário para Ofício Circular',
        'warning'
      );
      return false;
    }
  } else {
    if (!formData.destinatario?.nome?.trim()) {
      onShowToast('Por favor, selecione o Destinatário', 'warning');
      return false;
    }
  }

  if (!formData.enderecamento?.nome?.trim()) {
    onShowToast('Por favor, preencha o Endereçamento', 'warning');
    return false;
  }

  if (!formData.numeroDocumento.trim()) {
    onShowToast('Por favor, preencha o Número do Documento', 'warning');
    return false;
  }

  if (!formData.anoDocumento.trim()) {
    onShowToast('Por favor, preencha o Ano', 'warning');
    return false;
  }

  if (!formData.analista?.nome?.trim()) {
    onShowToast('Por favor, selecione o Analista', 'warning');
    const element = document.querySelector('[data-dropdown="analista"]') as HTMLElement;
    element?.focus();
    return false;
  }

  return true;
};

const validateJudicialDecisionSection = (
  formData: FormData,
  retificacoes: RetificacaoItem[],
  onShowToast: (message: string, type: ToastType) => void
): boolean => {
  if (!formData.autoridade?.nome?.trim()) {
    onShowToast('Por favor, preencha a Autoridade', 'warning');
    return false;
  }

  if (!formData.orgaoJudicial?.nome?.trim()) {
    onShowToast('Por favor, preencha o Órgão Judicial', 'warning');
    return false;
  }

  if (!formData.dataAssinatura.trim()) {
    onShowToast('Por favor, preencha a Data da Assinatura', 'warning');
    return false;
  }

  // Validar retificações, se existirem
  for (let i = 0; i < retificacoes.length; i++) {
    const retificacao = retificacoes[i];
    const numeroRetificacao = i + 1;

    if (!retificacao.autoridade?.nome?.trim()) {
      onShowToast(
        `Por favor, preencha a Autoridade da ${numeroRetificacao}ª Decisão Retificadora`,
        'warning'
      );
      return false;
    }

    if (!retificacao.orgaoJudicial?.nome?.trim()) {
      onShowToast(
        `Por favor, preencha o Órgão Judicial da ${numeroRetificacao}ª Decisão Retificadora`,
        'warning'
      );
      return false;
    }

    if (!retificacao.dataAssinatura.trim()) {
      onShowToast(
        `Por favor, preencha a Data da Assinatura da ${numeroRetificacao}ª Decisão Retificadora`,
        'warning'
      );
      return false;
    }
  }

  return true;
};

const validateMediaSection = (
  formData: FormData,
  onShowToast: (message: string, type: ToastType) => void
): boolean => {
  if (!formData.tipoMidia.trim()) {
    onShowToast('Por favor, selecione o Tipo da Mídia', 'warning');
    const element = document.querySelector('[data-dropdown="tipoMidia"]') as HTMLElement;
    element?.focus();
    return false;
  }

  if (!formData.senhaMidia.trim()) {
    onShowToast('Por favor, preencha a Senha de Acesso da Mídia', 'warning');
    return false;
  }

  return true;
};

const validateResearchSection = (
  formData: FormData,
  onShowToast: (message: string, type: ToastType) => void
): boolean => {
  if (formData.pesquisas.length === 0) {
    onShowToast('Por favor, adicione pelo menos uma pesquisa', 'warning');
    return false;
  }

  for (let i = 0; i < formData.pesquisas.length; i++) {
    const pesquisa = formData.pesquisas[i];

    if (!pesquisa.tipo.trim()) {
      onShowToast(`Por favor, selecione o tipo para a ${i + 1}ª pesquisa`, 'warning');
      return false;
    }

    if (!pesquisa.identificador.trim()) {
      onShowToast(`Por favor, preencha o identificador para a ${i + 1}ª pesquisa`, 'warning');
      return false;
    }
  }

  return true;
};

export const useNovoDocumentoValidation = ({
  formData,
  retificacoes,
  sectionVisibility,
  onShowToast,
}: UseNovoDocumentoValidationProps) => {
  const validateForm = useCallback((): boolean => {
    // PRIMEIRA FASE: Validações de ERRO (vermelho) - Regras de negócio críticas
    if (sectionVisibility.section2) {
      if (!validateDateSignature(formData.dataAssinatura, onShowToast)) {
        return false;
      }
    }

    if (!validateRetificationsChain(formData, retificacoes, onShowToast)) {
      return false;
    }

    // SEGUNDA FASE: Validações de PREENCHIMENTO (amarelo) - Na ordem do formulário
    if (!validateBasicFields(formData, onShowToast)) {
      return false;
    }

    if (sectionVisibility.section2) {
      if (!validateJudicialDecisionSection(formData, retificacoes, onShowToast)) {
        return false;
      }
    }

    if (sectionVisibility.section3) {
      if (!validateMediaSection(formData, onShowToast)) {
        return false;
      }
    }

    if (sectionVisibility.section4) {
      if (!validateResearchSection(formData, onShowToast)) {
        return false;
      }
    }

    return true;
  }, [formData, retificacoes, sectionVisibility, onShowToast]);

  const validateField = useCallback(
    (field: keyof FormData, value: unknown): string | null => {
      switch (field) {
        case 'tipoDocumento':
          return !value || (typeof value === 'string' && !value.trim())
            ? 'Por favor, selecione o Tipo de Documento'
            : null;

        case 'assunto':
          return formData.tipoDocumento !== 'Mídia' &&
            (!value || (typeof value === 'string' && !value.trim()))
            ? 'Por favor, selecione o Assunto'
            : null;

        case 'assuntoOutros':
          return formData.assunto === 'Outros' &&
            (!value || (typeof value === 'string' && !value.trim()))
            ? 'Por favor, especifique o assunto quando "Outros" é selecionado'
            : null;

        case 'numeroDocumento':
          return !value || (typeof value === 'string' && !value.trim())
            ? 'Por favor, preencha o Número do Documento'
            : null;

        case 'anoDocumento':
          return !value || (typeof value === 'string' && !value.trim())
            ? 'Por favor, preencha o Ano'
            : null;

        case 'analista':
          return !value ||
            (typeof value === 'object' && value && !('nome' in value)) ||
            (typeof value === 'object' &&
              value &&
              'nome' in value &&
              typeof value.nome === 'string' &&
              !value.nome.trim())
            ? 'Por favor, selecione o Analista'
            : null;

        case 'autoridade':
          return sectionVisibility.section2 &&
            (!value ||
              (typeof value === 'object' && value && !('nome' in value)) ||
              (typeof value === 'object' &&
                value &&
                'nome' in value &&
                typeof value.nome === 'string' &&
                !value.nome.trim()))
            ? 'Por favor, preencha a Autoridade'
            : null;

        case 'orgaoJudicial':
          return sectionVisibility.section2 &&
            (!value ||
              (typeof value === 'object' && value && !('nome' in value)) ||
              (typeof value === 'object' &&
                value &&
                'nome' in value &&
                typeof value.nome === 'string' &&
                !value.nome.trim()))
            ? 'Por favor, preencha o Órgão Judicial'
            : null;

        case 'dataAssinatura':
          if (sectionVisibility.section2 && value && typeof value === 'string' && value.trim()) {
            const dataAssinatura = parseDate(value);
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);

            if (!dataAssinatura) {
              return 'Data da assinatura inválida';
            }

            if (dataAssinatura > hoje) {
              return 'Data da assinatura não pode ser posterior à data atual';
            }
          }
          return sectionVisibility.section2 &&
            (!value || (typeof value === 'string' && !value.trim()))
            ? 'Por favor, preencha a Data da Assinatura'
            : null;

        case 'tipoMidia':
          return sectionVisibility.section3 &&
            (!value || (typeof value === 'string' && !value.trim()))
            ? 'Por favor, selecione o Tipo da Mídia'
            : null;

        case 'tamanhoMidia':
          // Tamanho da mídia não é mais obrigatório no formulário (será preenchido no modal)
          return null;

        case 'hashMidia':
          // Hash da mídia não é mais obrigatório no formulário (será preenchido no modal)
          return null;

        default:
          return null;
      }
    },
    [formData, sectionVisibility]
  );

  return {
    validateForm,
    validateField,
  };
};
