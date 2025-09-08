/**
 * Hook para validação completa do formulário de Nova Demanda
 *
 * @description
 * Gerencia todas as validações necessárias antes de submeter o formulário:
 * - Validações de campos obrigatórios
 * - Validações de regras de negócio (datas, formatos)
 * - Exibição de mensagens de erro apropriadas
 * - Foco automático em campos com erro
 * - Integração com sistema de notificações toast
 *
 * **Tipos de Validação**:
 * - **Obrigatórios**: Campos que não podem estar vazios
 * - **Formato**: Campos que devem seguir padrões específicos
 * - **Regras de Negócio**: Validações específicas do domínio
 * - **Consistência**: Verificações entre campos relacionados
 *
 * **Campos Obrigatórios Validados**:
 * - **Tipo de Demanda**: Deve ser selecionado
 * - **Solicitante**: Deve ser informado
 * - **Data Inicial**: Deve estar preenchida e ser válida
 * - **Descrição**: Deve ter conteúdo
 * - **SGED**: Número de protocolo obrigatório
 * - **Alvos**: Quantidade de alvos da investigação
 * - **Identificadores**: Quantidade de identificadores
 * - **Analista**: Responsável pela análise
 * - **Distribuidor**: Responsável pela distribuição
 *
 * **Regras de Negócio**:
 * - Data inicial não pode ser futura
 * - Campos de seleção devem ter valor válido
 * - Campos de texto não podem estar apenas com espaços
 *
 * @example
 * const { validateForm, isDateValid } = useFormularioValidacao(
 *   setToastMessage,
 *   setToastType,
 *   setShowToast
 * );
 *
 * // Validar antes de salvar
 * if (!validateForm(formData)) {
 *   return; // Validação falhou
 * }
 *
 * // Verificar data específica
 * if (!isDateValid("25/12/2024")) {
 *   // Data inválida
 * }
 *
 * @module pages/NovaDemandaPage/hooks/useFormularioValidacao
 */

import { useCallback } from 'react';
import type { Option } from '../../../shared/components/forms/SearchableSelect';

// ========== INTERFACES ==========

/**
 * Interface dos dados do formulário para validação
 *
 * Versão simplificada da FormDataState contendo apenas os campos
 * necessários para validação, evitando dependência circular.
 */
interface FormDataState {
  /** Tipo/categoria da demanda selecionada */
  tipoDemanda: Option | null;
  /** Solicitante da demanda */
  solicitante: Option | null;
  /** Data de início da demanda (formato DD/MM/AAAA) */
  dataInicial: string;
  /** Descrição detalhada da demanda */
  descricao: string;
  /** Número do protocolo SGED */
  sged: string;
  /** Quantidade de alvos da investigação */
  alvos: string;
  /** Quantidade de identificadores */
  identificadores: string;
  /** Analista responsável */
  analista: Option | null;
  /** Distribuidor responsável */
  distribuidor: Option | null;
}

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que gerencia todas as validações do formulário de demanda
 *
 * @param setToastMessage - Função para definir mensagem do toast
 * @param setToastType - Função para definir tipo do toast (error, success, warning)
 * @param setShowToast - Função para controlar exibição do toast
 * @returns Objeto com funções de validação
 */
export const useFormularioValidacao = (
  setToastMessage: (message: string) => void,
  setToastType: (type: 'error' | 'success' | 'warning') => void,
  setShowToast: (show: boolean) => void
) => {
  // ===== VALIDAÇÕES ESPECÍFICAS =====
  /**
   * Valida se uma data está dentro das regras de negócio
   *
   * **Regras Aplicadas**:
   * - Data não pode ser futura (posterior ao momento atual)
   * - Formato deve ser DD/MM/AAAA válido
   * - Campos vazios ou incompletos são considerados válidos (validação opcional)
   *
   * **Tratamento de Edge Cases**:
   * - String vazia: considerada válida (campo opcional preenchimento)
   * - Data incompleta: considerada válida (usuário ainda digitando)
   * - Formato inválido: considerada inválida
   * - Erro de parsing: considerada inválida
   *
   * @param dateString - Data no formato DD/MM/AAAA
   * @returns true se data for válida ou vazia, false se inválida
   */
  const isDateValid = useCallback((dateString: string): boolean => {
    // Data vazia ou incompleta é considerada válida (não obriga preenchimento aqui)
    if (!dateString || dateString.length < 10) return true;

    try {
      // Parse da data brasileira DD/MM/AAAA
      const [day, month, year] = dateString.split('/');
      const inputDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Data de referência: hoje até o final do dia (23:59:59.999)
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Data não pode ser futura
      return inputDate <= today;
    } catch {
      // Erro de parsing = data inválida
      return false;
    }
  }, []);

  // ===== VALIDAÇÃO PRINCIPAL DO FORMULÁRIO =====
  /**
   * Executa validação completa do formulário antes da submissão
   *
   * **Ordem de Validação**:
   * 1. **Regras de Negócio**: Validações específicas do domínio
   * 2. **Campos Obrigatórios**: Verificação de preenchimento
   * 3. **Foco Automático**: Direciona usuário para campo com erro
   *
   * **Estratégia de Validação**:
   * - Para na primeira validação que falhar
   * - Exibe toast com mensagem específica do erro
   * - Aplica foco no campo quando possível
   * - Retorna boolean para controle de submissão
   *
   * **Tipos de Toast**:
   * - **error**: Para regras de negócio quebradas
   * - **warning**: Para campos obrigatórios não preenchidos
   *
   * @param formData - Dados do formulário para validação
   * @returns true se válido, false se encontrar erro
   */
  const validateForm = useCallback(
    (formData: FormDataState): boolean => {
      // ===== VALIDAÇÕES DE REGRAS DE NEGÓCIO =====
      // Prioridade alta: regras que podem causar inconsistência

      // Validação de data: não pode ser futura
      if (formData.dataInicial.trim() && !isDateValid(formData.dataInicial)) {
        setToastMessage('Data inicial não pode ser posterior à data atual.');
        setToastType('error');
        setShowToast(true);
        return false;
      }

      // ===== VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS =====
      // Lista organizada de todas as validações necessárias
      const validations = [
        // **CAMPOS DE SELEÇÃO**
        {
          condition: !formData.tipoDemanda,
          message: 'Por favor, selecione o Tipo de Demanda.',
          focus: '[data-dropdown="tipoDemanda"]',
        },
        {
          condition: !formData.analista,
          message: 'Por favor, selecione o Analista.',
          focus: '[data-dropdown="analista"]',
        },
        {
          condition: !formData.distribuidor,
          message: 'Por favor, selecione o Distribuidor.',
          focus: '[data-dropdown="distribuidor"]',
        },

        // **CAMPOS DE AUTOCOMPLETE**
        {
          condition: !formData.solicitante?.nome?.trim(),
          message: 'Por favor, selecione o Solicitante.',
          focus: null, // Não tem seletor específico para foco
        },

        // **CAMPOS DE TEXTO OBRIGATÓRIOS**
        {
          condition: !formData.dataInicial.trim(),
          message: 'Por favor, preencha a Data Inicial.',
          focus: null,
        },
        {
          condition: !formData.descricao.trim(),
          message: 'Por favor, preencha a Descrição.',
          focus: null,
        },
        {
          condition: !formData.sged.trim(),
          message: 'Por favor, preencha o SGED.',
          focus: null,
        },

        // **CAMPOS NUMÉRICOS OBRIGATÓRIOS**
        {
          condition: !formData.alvos.trim(),
          message: 'Por favor, preencha o número de Alvos.',
          focus: null,
        },
        {
          condition: !formData.identificadores.trim(),
          message: 'Por favor, preencha o número de Identificadores.',
          focus: null,
        },
      ];

      // ===== EXECUÇÃO DAS VALIDAÇÕES =====
      // Processa validações em ordem, parando na primeira que falhar
      for (const validation of validations) {
        if (validation.condition) {
          // Exibe mensagem de erro específica
          setToastMessage(validation.message);
          setToastType('warning');
          setShowToast(true);

          // Aplica foco automático se elemento for identificável
          if (validation.focus) {
            const trigger = document.querySelector(validation.focus);
            if (trigger instanceof HTMLElement) {
              trigger.focus();
            }
          }

          // Para execução na primeira validação que falhar
          return false;
        }
      }

      // ===== SUCESSO NA VALIDAÇÃO =====
      // Todas as validações passaram
      return true;
    },
    [isDateValid, setToastMessage, setToastType, setShowToast]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todas as funções de validação do formulário
   *
   * @returns Objeto com funções de validação
   */
  return {
    /** Valida o formulário completo antes da submissão */
    validateForm,

    /** Valida se uma data específica atende às regras de negócio */
    isDateValid,
  };
};
