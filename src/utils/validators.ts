// src/utils/validators.ts

/**
 * Validates if a string is not empty
 */
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a string has minimum length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Validates if a string has maximum length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Validates if a value is a valid number
 */
export const isValidNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

/**
 * Validates if a date string is valid
 */
export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validates if a date is not in the future
 */
export const isNotFutureDate = (date: string): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return dateObj <= today;
};

/**
 * Validates SGED format (YYYY.NNN)
 */
export const isValidSged = (sged: string): boolean => {
  const sgedRegex = /^\d{4}\.\d{3}$/;
  return sgedRegex.test(sged);
};

/**
 * Validates Brazilian phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates Brazilian CEP format
 */
export const isValidCep = (cep: string): boolean => {
  const cepRegex = /^\d{5}-\d{3}$/;
  return cepRegex.test(cep);
};

/**
 * Creates a validation function that checks multiple rules
 */
export const createValidator = (
  ...rules: ((value: string) => boolean)[]
) => {
  return (value: string): boolean => {
    return rules.every((rule) => rule(value));
  };
};

/**
 * Common validation rules
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
