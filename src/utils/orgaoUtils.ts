// src/utils/orgaoUtils.ts

import { mockOrgaos } from '../data/mockOrgaos';

/**
 * Obter abreviação do órgão baseado no nome completo
 * @param nomeCompleto Nome completo do órgão
 * @returns Abreviação do órgão ou nome completo se não encontrado
 */
export function getOrgaoAbreviacao(nomeCompleto: string): string {
  const orgao = mockOrgaos.find((o) => o.nomeCompleto === nomeCompleto);
  return orgao?.abreviacao ?? nomeCompleto;
}

/**
 * Obter nome completo do órgão baseado na abreviação
 * @param abreviacao Abreviação do órgão
 * @returns Nome completo do órgão ou abreviação se não encontrado
 */
export function getOrgaoNomeCompleto(abreviacao: string): string {
  const orgao = mockOrgaos.find((o) => o.abreviacao === abreviacao);
  return orgao?.nomeCompleto ?? abreviacao;
}

/**
 * Verificar se um texto corresponde a um órgão (por nome completo ou abreviação)
 * @param texto Texto a ser verificado
 * @returns true se corresponder a um órgão
 */
export function isOrgaoValido(texto: string): boolean {
  return mockOrgaos.some(
    (o) => o.nomeCompleto === texto || o.abreviacao === texto
  );
}
