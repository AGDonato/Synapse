/**
 * VALIDADORES BÁSICOS DE DADOS
 *
 * Este módulo fornece validadores simples para campos de formulário.
 * Inclui validações básicas para campos obrigatórios, emails e comprimento.
 */

/**
 * Valida se uma string não está vazia
 * @param value - Valor para validar
 * @returns true se o valor não estiver vazio
 */
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Valida formato de email
 * @param email - Email para validar
 * @returns true se o formato estiver correto
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se uma string tem o comprimento mínimo exigido
 * @param value - Valor para validar
 * @param minLength - Comprimento mínimo requerido
 * @returns true se o valor atender ao comprimento mínimo
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Valida se uma string não excede o comprimento máximo
 * @param value - Valor para validar
 * @param maxLength - Comprimento máximo permitido
 * @returns true se o valor não exceder o comprimento máximo
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Valida se um valor é um número válido
 * @param value - String a ser validada como número
 * @returns true se o valor for um número válido
 */
export const isValidNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

/**
 * Valida se uma string de data é válida
 * @param date - String de data para validar
 * @returns true se a data for válida
 */
export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Valida se uma data não está no futuro
 * @param date - String de data para validar
 * @returns true se a data não for futura
 */
export const isNotFutureDate = (date: string): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Final do dia atual
  return dateObj <= today;
};

/**
 * Valida formato SGED (AAAA.NNN)
 * @param sged - Código SGED para validar
 * @returns true se o formato estiver correto
 */
export const isValidSged = (sged: string): boolean => {
  const sgedRegex = /^\d{4}\.\d{3}$/;
  return sgedRegex.test(sged);
};

/**
 * Valida formato de telefone brasileiro
 * @param phone - Número de telefone para validar
 * @returns true se o formato estiver correto
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida formato de CEP brasileiro
 * @param cep - CEP para validar
 * @returns true se o formato estiver correto
 */
export const isValidCep = (cep: string): boolean => {
  const cepRegex = /^\d{5}-\d{3}$/;
  return cepRegex.test(cep);
};

/**
 * Cria uma função de validação que verifica múltiplas regras
 * @param rules - Array de funções de validação
 * @returns Função que valida se todas as regras são atendidas
 */
export const createValidator = (...rules: ((value: string) => boolean)[]) => {
  return (value: string): boolean => {
    return rules.every(rule => rule(value));
  };
};

/**
 * Regras de validação comuns do sistema
 * Conjunto de validadores pré-configurados para uso rápido
 */
export const validationRules = {
  required: isRequired,
  email: isValidEmail,
  minLength: (min: number) => (value: string) => hasMinLength(value, min),
  maxLength: (max: number) => (value: string) => hasMaxLength(value, max),
  number: isValidNumber,
  date: isValidDate,
  notFutureDate: isNotFutureDate,
  sged: isValidSged,
  phone: isValidPhoneNumber,
  cep: isValidCep,
};
