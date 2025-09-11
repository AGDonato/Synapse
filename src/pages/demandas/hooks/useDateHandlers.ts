/**
 * Hook para gerenciamento de manipulação de datas na Nova Demanda
 *
 * @description
 * Centraliza toda a lógica de tratamento de datas do formulário de nova demanda:
 * - Formatação de máscaras de entrada (DD/MM/AAAA)
 * - Conversão entre formatos brasileiro e HTML5
 * - Validação de entrada de dados
 * - Sincronização entre input text e date picker
 * - Tratamento de caracteres inválidos
 *
 * **Formatos Suportados**:
 * - **Brasileiro**: DD/MM/AAAA (exibição e entrada manual)
 * - **HTML5 Date**: AAAA-MM-DD (compatibilidade com input[type="date"])
 *
 * **Funcionalidades**:
 * - Máscara automática durante digitação
 * - Conversão bidirecional de formatos
 * - Sanitização de entrada (remove não-dígitos)
 * - Padding automático para mês/dia
 * - Tratamento de datas incompletas
 *
 * @example
 * const {
 *   formatDateMask,
 *   handleDateChange,
 *   handleCalendarChange
 * } = useDateHandlers(setFormData);
 *
 * // Input manual: "12102024" -> "12/10/2024"
 * handleDateChange("12102024");
 *
 * // Date picker: "2024-10-12" -> "12/10/2024"
 * handleCalendarChange("2024-10-12");
 *
 * @module pages/NovaDemandaPage/hooks/useDateHandlers
 */

import { useCallback } from 'react';
import type { FormDataState } from './useFormularioEstado';

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que gerencia todas as funcionalidades de manipulação de datas
 *
 * @param setFormData - Função para atualizar dados do formulário
 * @returns Objeto com funções de formatação e conversão de datas
 */
export const useDateHandlers = (
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>
) => {
  // ===== FORMATAÇÃO DE MÁSCARAS =====
  /**
   * Aplica máscara DD/MM/AAAA durante a digitação
   *
   * **Processo de Formatação**:
   * 1. Remove todos os caracteres não-numéricos
   * 2. Aplica separadores "/" conforme o número de dígitos
   * 3. Limita a 8 dígitos máximos (DDMMAAAA)
   *
   * **Exemplos**:
   * - "12" -> "12"
   * - "1210" -> "12/10"
   * - "12102024" -> "12/10/2024"
   *
   * @param value - Valor digitado pelo usuário
   * @returns Data formatada com máscara DD/MM/AAAA
   */
  const formatDateMask = useCallback((value: string): string => {
    // Remove todos os caracteres que não sejam dígitos
    const numbers = value.replace(/\D/g, '');

    // Aplica formatação progressiva conforme número de dígitos
    if (numbers.length <= 2) return numbers; // "DD"
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`; // "DD/MM"
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`; // "DD/MM/AAAA"
  }, []);

  // ===== CONVERSÕES DE FORMATO =====
  /**
   * Converte data brasileira (DD/MM/AAAA) para formato HTML5 (AAAA-MM-DD)
   *
   * Necessário para compatibilidade com input[type="date"] que requer
   * formato ISO padrão para funcionar corretamente em todos os navegadores.
   *
   * @param dateStr - Data no formato DD/MM/AAAA
   * @returns Data no formato AAAA-MM-DD ou string vazia se inválida
   */
  const convertToHTMLDate = useCallback((dateStr: string): string => {
    // Validação básica de entrada
    if (!dateStr || dateStr.length < 10) return '';

    // Divide a data em partes
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Reordena para formato ISO com padding se necessário
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  }, []);

  /**
   * Converte data HTML5 (AAAA-MM-DD) para formato brasileiro (DD/MM/AAAA)
   *
   * Usado quando usuário seleciona data via date picker, convertendo
   * o valor retornado para o formato de exibição padrão brasileiro.
   *
   * @param dateStr - Data no formato AAAA-MM-DD
   * @returns Data no formato DD/MM/AAAA ou string vazia se inválida
   */
  const convertFromHTMLDate = useCallback((dateStr: string): string => {
    // Validação de entrada
    if (!dateStr) return '';

    // Divide a data ISO em partes
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      // Reordena para formato brasileiro
      return `${day}/${month}/${year}`;
    }
    return '';
  }, []);

  // ===== HANDLERS DE EVENTOS =====
  /**
   * Manipula alterações no campo de data via digitação manual
   *
   * **Fluxo de Processamento**:
   * 1. Aplica formatação automática com máscara
   * 2. Atualiza o estado do formulário
   * 3. Mantém cursor na posição correta
   *
   * Usado em input[type="text"] com máscara brasileira para
   * melhor experiência de digitação manual de datas.
   *
   * @param value - Valor digitado pelo usuário
   */
  const handleDateChange = useCallback(
    (value: string) => {
      // Aplica máscara DD/MM/AAAA automaticamente
      const formatted = formatDateMask(value);

      // Atualiza data inicial no formulário
      setFormData(prev => ({ ...prev, dataInicial: formatted }));
    },
    [formatDateMask, setFormData]
  );

  /**
   * Manipula alterações no campo de data via date picker (calendário)
   *
   * **Fluxo de Processamento**:
   * 1. Converte formato HTML5 (AAAA-MM-DD) para brasileiro (DD/MM/AAAA)
   * 2. Atualiza o estado do formulário
   * 3. Sincroniza com o campo de entrada manual
   *
   * Usado em input[type="date"] que fornece interface de calendário
   * nativa do navegador para seleção de datas.
   *
   * @param value - Data selecionada no formato HTML5 (AAAA-MM-DD)
   */
  const handleCalendarChange = useCallback(
    (value: string) => {
      // Converte de formato HTML5 para brasileiro
      const formatted = convertFromHTMLDate(value);

      // Atualiza data inicial no formulário
      setFormData(prev => ({ ...prev, dataInicial: formatted }));
    },
    [convertFromHTMLDate, setFormData]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todas as funções de manipulação de datas
   *
   * @returns Objeto com funções de formatação, conversão e handlers
   */
  return {
    /** Aplica máscara DD/MM/AAAA durante digitação */
    formatDateMask,

    /** Converte data brasileira para formato HTML5 */
    convertToHTMLDate,

    /** Converte data HTML5 para formato brasileiro */
    convertFromHTMLDate,

    /** Handler para entrada manual de data */
    handleDateChange,

    /** Handler para seleção via date picker */
    handleCalendarChange,
  };
};
