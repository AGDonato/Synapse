// src/utils/formatters.ts

/**
 * Formats a date string to a readable format
 */
export const formatDate = (date: string | Date, locale = 'pt-BR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Formats a date string to datetime format
 */
export const formatDateTime = (
  date: string | Date,
  locale = 'pt-BR'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates text to a specific length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Formats a file size in bytes to a human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Removes accents from a string for better search
 */
export const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Formats a SGED number with proper formatting
 */
export const formatSged = (sged: string): string => {
  if (!sged) return '';
  // Assuming SGED format is YYYY.NNN
  const parts = sged.split('.');
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].padStart(3, '0')}`;
  }
  return sged;
};

/**
 * Generates a unique ID for temporary use
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
