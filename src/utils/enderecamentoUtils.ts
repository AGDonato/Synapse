// src/utils/enderecamentoUtils.ts

import { mockProvedores } from '../data/mockProvedores';
import { mockOrgaos } from '../data/mockOrgaos';

/**
 * Converte endereçamento de razão social para nome fantasia (provedores)
 * ou de nome completo para abreviação (órgãos)
 */
export function getEnderecamentoAbreviado(enderecamento: string): string {
  if (!enderecamento) return enderecamento;

  // Primeiro tenta encontrar como provedor (razão social -> nome fantasia)
  const provedor = mockProvedores.find((p) => p.razaoSocial === enderecamento);
  if (provedor) {
    return provedor.nomeFantasia;
  }

  // Depois tenta encontrar como órgão (nome completo -> abreviação)
  const orgao = mockOrgaos.find((o) => o.nomeCompleto === enderecamento);
  if (orgao) {
    return orgao.abreviacao;
  }

  // Se não encontrar, retorna o original
  return enderecamento;
}

/**
 * Converte endereçamento abreviado de volta para completo
 * Usado para manter compatibilidade com dados originais
 */
export function getEnderecamentoCompleto(
  enderecamentoAbreviado: string
): string {
  if (!enderecamentoAbreviado) return enderecamentoAbreviado;

  // Primeiro tenta encontrar como provedor (nome fantasia -> razão social)
  const provedor = mockProvedores.find(
    (p) => p.nomeFantasia === enderecamentoAbreviado
  );
  if (provedor) {
    return provedor.razaoSocial;
  }

  // Depois tenta encontrar como órgão (abreviação -> nome completo)
  const orgao = mockOrgaos.find((o) => o.abreviacao === enderecamentoAbreviado);
  if (orgao) {
    return orgao.nomeCompleto;
  }

  // Se não encontrar, retorna o original
  return enderecamentoAbreviado;
}
