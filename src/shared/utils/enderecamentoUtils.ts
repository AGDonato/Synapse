/**
 * UTILITÁRIOS DE PROCESSAMENTO DE ENDEREÇAMENTOS
 *
 * Este módulo gerencia a lógica de conversão e abreviação de endereçamentos.
 * Funcionalidades incluem conversão automática entre formatos longos e abreviados
 * para provedores (razão social ↔ nome fantasia) e órgãos (nome completo ↔ abreviação).
 */

import { mockProvedores } from '../../shared/data/mockProvedores';
import { mockOrgaos } from '../../shared/data/mockOrgaos';

/**
 * Converte endereçamento de razão social para nome fantasia (provedores)
 * ou de nome completo para abreviação (órgãos)
 * @param enderecamento - Endereçamento completo para abreviar
 * @returns Versão abreviada do endereçamento
 */
export function getEnderecamentoAbreviado(enderecamento: string): string {
  if (!enderecamento) {
    return enderecamento;
  }

  // Primeiro tenta encontrar como provedor (razão social -> nome fantasia)
  const provedor = mockProvedores.find(p => p.razaoSocial === enderecamento);
  if (provedor) {
    return provedor.nomeFantasia;
  }

  // Depois tenta encontrar como órgão (nome completo -> abreviação)
  const orgao = mockOrgaos.find(o => o.nomeCompleto === enderecamento);
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
export function getEnderecamentoCompleto(enderecamentoAbreviado: string): string {
  if (!enderecamentoAbreviado) {
    return enderecamentoAbreviado;
  }

  // Primeiro tenta encontrar como provedor (nome fantasia -> razão social)
  const provedor = mockProvedores.find(p => p.nomeFantasia === enderecamentoAbreviado);
  if (provedor) {
    return provedor.razaoSocial;
  }

  // Depois tenta encontrar como órgão (abreviação -> nome completo)
  const orgao = mockOrgaos.find(o => o.abreviacao === enderecamentoAbreviado);
  if (orgao) {
    return orgao.nomeCompleto;
  }

  // Se não encontrar, retorna o original
  return enderecamentoAbreviado;
}
