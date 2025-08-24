// src/hooks/useNovoDocumentoValidation.ts

import { useCallback } from 'react';
import type { MultiSelectOption } from '../components/forms/MultiSelectDropdown';

// Tipos
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

// Função auxiliar para parse de data
const parseDate = (dateString: string): Date | null => {
  if (!dateString.trim()) return null;

  const [day, month, year] = dateString.split('/').map(Number);
  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);

  // Verificar se a data é válida
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const useNovoDocumentoValidation = ({
  formData,
  retificacoes,
  sectionVisibility,
  onShowToast,
}: UseNovoDocumentoValidationProps) => {
  const validateForm = useCallback((): boolean => {
    // PRIMEIRA FASE: Validações de ERRO (vermelho) - Regras de negócio críticas

    // Validar data da decisão judicial principal
    if (sectionVisibility.section2 && formData.dataAssinatura.trim()) {
      const dataAssinatura = parseDate(formData.dataAssinatura);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);

      if (!dataAssinatura) {
        onShowToast('Data da assinatura inválida', 'error');
        return false;
      }

      if (dataAssinatura > hoje) {
        onShowToast(
          'Data da assinatura não pode ser posterior à data atual',
          'error'
        );
        return false;
      }
    }

    // Validar datas das retificações em cadeia cronológica
    if (formData.retificada && retificacoes.length > 0) {
      const dataDecisaoJudicial = parseDate(formData.dataAssinatura);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);

      // Para validação em cadeia, precisamos da data da decisão judicial
      if (!dataDecisaoJudicial && formData.dataAssinatura.trim()) {
        onShowToast(
          'Data da decisão judicial inválida para validar retificações',
          'error'
        );
        return false;
      }

      let dataAnterior = dataDecisaoJudicial;
      let nomeAnterior = 'decisão judicial';

      for (let i = 0; i < retificacoes.length; i++) {
        const retificacao = retificacoes[i];
        const numeroRetificacao = i + 1;

        // Só validar se a data da retificação estiver preenchida
        if (retificacao.dataAssinatura.trim()) {
          const dataRetificacao = parseDate(retificacao.dataAssinatura);

          if (!dataRetificacao) {
            onShowToast(
              `Data da ${numeroRetificacao}ª Decisão Retificadora inválida`,
              'error'
            );
            return false;
          }

          // Verificar se não é futura
          if (dataRetificacao > hoje) {
            onShowToast(
              `Data de assinatura da ${numeroRetificacao}ª Decisão Retificadora não pode ser posterior à data atual.`,
              'error'
            );
            return false;
          }

          // Verificar se não é anterior à data anterior (decisão judicial ou retificação anterior)
          if (dataAnterior && dataRetificacao <= dataAnterior) {
            onShowToast(
              `Data da assinatura da ${numeroRetificacao}ª Decisão Retificadora deve ser posterior à ${nomeAnterior}`,
              'error'
            );
            return false;
          }

          // Atualizar para próxima iteração
          dataAnterior = dataRetificacao;
          nomeAnterior = `${numeroRetificacao}ª Decisão Retificadora`;
        }
      }
    }

    // SEGUNDA FASE: Validações de PREENCHIMENTO (amarelo) - Na ordem do formulário

    // Seção 1 - Dados Básicos
    if (!formData.tipoDocumento.trim()) {
      onShowToast('Por favor, selecione o Tipo de Documento', 'warning');
      const trigger = document.querySelector(
        '[data-dropdown="tipoDocumento"]'
      ) as HTMLElement;
      trigger?.focus();
      return false;
    }

    if (formData.tipoDocumento !== 'Mídia' && !formData.assunto.trim()) {
      onShowToast('Por favor, selecione o Assunto', 'warning');
      const trigger = document.querySelector(
        '[data-dropdown="assunto"]'
      ) as HTMLElement;
      trigger?.focus();
      return false;
    }

    if (formData.assunto === 'Outros' && !formData.assuntoOutros.trim()) {
      onShowToast(
        'Por favor, especifique o assunto quando "Outros" é selecionado',
        'warning'
      );
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
      if (!formData.destinatario || !formData.destinatario.nome?.trim()) {
        onShowToast('Por favor, selecione o Destinatário', 'warning');
        return false;
      }
    }

    if (!formData.enderecamento || !formData.enderecamento.nome?.trim()) {
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

    if (!formData.analista || !formData.analista.nome?.trim()) {
      onShowToast('Por favor, selecione o Analista', 'warning');
      const trigger = document.querySelector(
        '[data-dropdown="analista"]'
      ) as HTMLElement;
      trigger?.focus();
      return false;
    }

    // Seção 2 - Dados da Decisão Judicial (se obrigatória)
    if (sectionVisibility.section2) {
      if (!formData.autoridade || !formData.autoridade.nome?.trim()) {
        onShowToast('Por favor, preencha a Autoridade', 'warning');
        return false;
      }

      if (!formData.orgaoJudicial || !formData.orgaoJudicial.nome?.trim()) {
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

        if (!retificacao.autoridade || !retificacao.autoridade.nome?.trim()) {
          onShowToast(
            `Por favor, preencha a Autoridade da ${numeroRetificacao}ª Decisão Retificadora`,
            'warning'
          );
          return false;
        }

        if (
          !retificacao.orgaoJudicial ||
          !retificacao.orgaoJudicial.nome?.trim()
        ) {
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
    }

    // Seção 3 - Dados da Mídia (se obrigatória)
    if (sectionVisibility.section3) {
      if (!formData.tipoMidia.trim()) {
        onShowToast('Por favor, selecione o Tipo da Mídia', 'warning');
        const trigger = document.querySelector(
          '[data-dropdown="tipoMidia"]'
        ) as HTMLElement;
        trigger?.focus();
        return false;
      }

      if (!formData.tamanhoMidia.trim()) {
        onShowToast('Por favor, preencha o Tamanho da Mídia', 'warning');
        return false;
      }

      if (!formData.hashMidia.trim()) {
        onShowToast('Por favor, preencha o Hash da Mídia', 'warning');
        return false;
      }

      if (!formData.senhaMidia.trim()) {
        onShowToast(
          'Por favor, preencha a Senha de Acesso da Mídia',
          'warning'
        );
        return false;
      }
    }

    // Seção 4 - Dados da Pesquisa (se obrigatória)
    if (sectionVisibility.section4) {
      if (formData.pesquisas.length === 0) {
        onShowToast('Por favor, adicione pelo menos uma pesquisa', 'warning');
        return false;
      }

      for (let i = 0; i < formData.pesquisas.length; i++) {
        const pesquisa = formData.pesquisas[i];

        if (!pesquisa.tipo.trim()) {
          onShowToast(
            `Por favor, selecione o tipo para a ${i + 1}ª pesquisa`,
            'warning'
          );
          return false;
        }

        if (!pesquisa.identificador.trim()) {
          onShowToast(
            `Por favor, preencha o identificador para a ${i + 1}ª pesquisa`,
            'warning'
          );
          return false;
        }
      }
    }

    return true;
  }, [formData, retificacoes, sectionVisibility, onShowToast]);

  const validateField = useCallback(
    (field: keyof FormData, value: unknown): string | null => {
      switch (field) {
        case 'tipoDocumento':
          return !value?.trim()
            ? 'Por favor, selecione o Tipo de Documento'
            : null;

        case 'assunto':
          return formData.tipoDocumento !== 'Mídia' && !value?.trim()
            ? 'Por favor, selecione o Assunto'
            : null;

        case 'assuntoOutros':
          return formData.assunto === 'Outros' && !value?.trim()
            ? 'Por favor, especifique o assunto quando "Outros" é selecionado'
            : null;

        case 'numeroDocumento':
          return !value?.trim()
            ? 'Por favor, preencha o Número do Documento'
            : null;

        case 'anoDocumento':
          return !value?.trim() ? 'Por favor, preencha o Ano' : null;

        case 'analista':
          return !value?.nome?.trim()
            ? 'Por favor, selecione o Analista'
            : null;

        case 'autoridade':
          return sectionVisibility.section2 && !value?.nome?.trim()
            ? 'Por favor, preencha a Autoridade'
            : null;

        case 'orgaoJudicial':
          return sectionVisibility.section2 && !value?.nome?.trim()
            ? 'Por favor, preencha o Órgão Judicial'
            : null;

        case 'dataAssinatura':
          if (sectionVisibility.section2 && value?.trim()) {
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
          return sectionVisibility.section2 && !value?.trim()
            ? 'Por favor, preencha a Data da Assinatura'
            : null;

        case 'tipoMidia':
          return sectionVisibility.section3 && !value?.trim()
            ? 'Por favor, selecione o Tipo da Mídia'
            : null;

        case 'tamanhoMidia':
          return sectionVisibility.section3 && !value?.trim()
            ? 'Por favor, preencha o Tamanho da Mídia'
            : null;

        case 'hashMidia':
          return sectionVisibility.section3 && !value?.trim()
            ? 'Por favor, preencha o Hash da Mídia'
            : null;

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
