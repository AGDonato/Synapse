/**
 * UTILITÁRIOS DE FORMATAÇÃO DE DADOS
 *
 * Este módulo contém funções para formatar e transformar dados para exibição.
 * Inclui funcionalidades para:
 * - Formatação de datas e horários
 * - Manipulação de strings (capitalização, truncamento, remoção de acentos)
 * - Formatação de tamanhos de arquivo
 * - Geração de identificadores temporários
 * - Formatação de números SGED específicos do sistema
 */

/**
 * Formata uma data para exibição legível
 * @param date - Data como string ou objeto Date
 * @param locale - Localização para formatação (padrão: 'pt-BR')
 * @returns String formatada da data no formato DD/MM/AAAA
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
 * Formata uma data com horário para exibição
 * @param date - Data como string ou objeto Date
 * @param locale - Localização para formatação (padrão: 'pt-BR')
 * @returns String formatada com data e horário no formato DD/MM/AAAA HH:MM
 */
export const formatDateTime = (date: string | Date, locale = 'pt-BR'): string => {
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
 * Capitaliza a primeira letra de uma string
 * Converte o primeiro caractere para maiúscula e o restante para minúscula
 * @param str - String a ser capitalizada
 * @returns String com primeira letra maiúscula
 */
export const capitalize = (str: string): string => {
  if (!str) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Trunca um texto para um tamanho específico adicionando reticências
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo permitido
 * @returns Texto truncado com "..." se necessário
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Formata um tamanho de arquivo em bytes para formato legível
 * Converte bytes para unidades maiores (KB, MB, GB) conforme necessário
 * @param bytes - Tamanho do arquivo em bytes
 * @returns String formatada com tamanho e unidade (ex: "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Remove acentos de uma string para facilitar buscas
 * Útil para comparações de texto ignorando acentuação
 * @param str - String com possíveis acentos
 * @returns String sem acentos
 */
export const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Formata um número SGED com padronização adequada
 * Aplica formatação específica do sistema SGED (AAAA.NNN)
 * @param sged - Número SGED como string
 * @returns Número SGED formatado com zeros à esquerda quando necessário
 */
export const formatSged = (sged: string): string => {
  if (!sged) {
    return '';
  }
  // Formato SGED assumido: AAAA.NNN
  const parts = sged.split('.');
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].padStart(3, '0')}`;
  }
  return sged;
};

/**
 * Gera um identificador único para uso temporário
 * Combina timestamp atual com string aleatória para garantir unicidade
 * @returns String com identificador único temporário
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
