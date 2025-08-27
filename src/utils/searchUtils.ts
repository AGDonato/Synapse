// src/utils/searchUtils.ts

/**
 * Remove acentos de uma string para facilitar a busca
 */
export const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Verifica se um item contém todas as palavras da query (busca por múltiplas palavras)
 * Ignora acentos e diferenças de caso
 * 
 * @param item - Texto onde buscar
 * @param query - Palavras a serem buscadas (separadas por espaço)
 * @returns true se o item contém todas as palavras da query
 * 
 * Exemplo:
 * - item: "11ª Promotoria de Justiça da comarca de Goiânia"
 * - query: "11 Goiânia" → retorna true
 * - query: "11 goiania" → retorna true (sem acento)
 * - query: "15 Goiânia" → retorna false (não tem "15")
 */
export const matchesAdvancedSearch = (item: string, query: string): boolean => {
  if (!query.trim()) {return true;}
  
  // Remove acentos e converte para minúsculo tanto do item quanto da query
  const normalizedItem = removeAccents(item);
  const normalizedQuery = removeAccents(query);
  
  // Divide a query em palavras (remove espaços extras)
  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  // Verifica se todas as palavras da query estão presentes no item
  return queryWords.every(word => normalizedItem.includes(word));
};

/**
 * Filtra uma lista de itens usando busca avançada
 * 
 * @param items - Lista de strings para filtrar
 * @param query - Query de busca
 * @returns Lista filtrada
 */
export const filterWithAdvancedSearch = (items: string[], query: string): string[] => {
  if (!query.trim()) {return items;}
  
  return items.filter(item => matchesAdvancedSearch(item, query));
};