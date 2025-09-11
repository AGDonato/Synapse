/**
 * UTILITÁRIOS DE MANIPULAÇÃO DE ÓRGÃOS
 *
 * Este módulo fornece funções para trabalhar com dados de órgãos públicos.
 * Inclui funcionalidades para:
 * - Conversão entre nomes completos e abreviações de órgãos
 * - Validação de órgãos existentes no sistema
 * - Normalização de nomenclatura para consistência
 * - Busca e identificação de órgãos por diferentes critérios
 */

import { mockOrgaos } from '../../shared/data/mockOrgaos';

/**
 * Obtém abreviação do órgão baseado no nome completo
 * @param nomeCompleto - Nome completo do órgão
 * @returns Abreviação do órgão ou nome completo se não encontrado
 */
export function getOrgaoAbreviacao(nomeCompleto: string): string {
  const orgao = mockOrgaos.find(o => o.nomeCompleto === nomeCompleto);
  return orgao?.abreviacao ?? nomeCompleto;
}

/**
 * Obtém nome completo do órgão baseado na abreviação
 * @param abreviacao - Abreviação do órgão
 * @returns Nome completo do órgão ou abreviação se não encontrado
 */
export function getOrgaoNomeCompleto(abreviacao: string): string {
  const orgao = mockOrgaos.find(o => o.abreviacao === abreviacao);
  return orgao?.nomeCompleto ?? abreviacao;
}

/**
 * Verifica se um texto corresponde a um órgão (por nome completo ou abreviação)
 * @param texto - Texto a ser verificado
 * @returns true se corresponder a um órgão
 */
export function isOrgaoValido(texto: string): boolean {
  return mockOrgaos.some(o => o.nomeCompleto === texto || o.abreviacao === texto);
}
