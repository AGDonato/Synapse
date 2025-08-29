/**
 * UTILITÁRIOS DE DESTINATÁRIO E ENDEREÇAMENTO
 *
 * Este módulo gerencia a lógica de processamento de destinatários e endereçamentos de documentos.
 * Inclui funcionalidades para:
 * - Parsing e processamento de destinatários de documentos
 * - Diferenciação entre provedores, autoridades e órgãos
 * - Tratamento de ofícios circulares (múltiplos destinatários)
 * - Agrupamento de autoridades por endereçamento/órgão
 * - Geração de listas únicas para filtros e seleção
 * - Verificação de correspondência de documentos com filtros
 */

import { mockProvedores } from '../data/mockProvedores';
import { getEnderecamentoAbreviado } from './enderecamentoUtils';
import type { DocumentoDemanda } from '../data/mockDocumentos';

export interface DestinatarioEndereçamentoItem {
  id: string;
  nome: string;
  tipo: 'provedor' | 'autoridade' | 'orgao'; // 'orgao' para endereçamentos agrupados
  autoridades?: string[]; // Lista de autoridades quando tipo='orgao'
}

/**
 * Extrai e processa destinatários de um documento, tratando ofícios circulares
 * Diferencia automaticamente entre provedores e autoridades baseado nos dados mock
 * @param documento - Documento contendo destinatários para processar
 * @returns Array com itens estruturados de destinatário/endereçamento
 */
export function parseDestinatariosDocumento(
  documento: DocumentoDemanda
): DestinatarioEndereçamentoItem[] {
  if (!documento.destinatario) {
    return [];
  }

  // Dividir destinatários (para ofícios circulares)
  const destinatarios = documento.destinatario.split(', ').map(d => d.trim());
  const resultado: DestinatarioEndereçamentoItem[] = [];

  destinatarios.forEach(dest => {
    if (!dest) {
      return;
    }

    // Verificar se é provedor (busca por nomeFantasia)
    const provedor = mockProvedores.find(p => p.nomeFantasia === dest);
    if (provedor) {
      resultado.push({
        id: dest, // Nome fantasia como ID
        nome: provedor.nomeFantasia, // Exibir nome fantasia
        tipo: 'provedor',
      });
      return;
    }

    // Se não é provedor, então é autoridade
    // Usar função existente para converter endereçamento para abreviado
    const nomeExibicao = getEnderecamentoAbreviado(documento.enderecamento);

    resultado.push({
      id: `${dest}|${documento.enderecamento}`, // ID único combinando autoridade + órgão
      nome: nomeExibicao, // Exibir abreviação do órgão
      tipo: 'autoridade',
    });
  });

  return resultado;
}

/**
 * Agrupa autoridades pelo mesmo endereçamento para evitar duplicação
 * Função auxiliar interna para otimizar exibição de filtros
 * @param items - Array de itens para agrupar
 * @returns Array com autoridades agrupadas por endereçamento
 */
function agruparPorEndereçamento(
  items: DestinatarioEndereçamentoItem[]
): DestinatarioEndereçamentoItem[] {
  const resultado: DestinatarioEndereçamentoItem[] = [];
  const endereçamentoMap = new Map<string, string[]>();

  items.forEach(item => {
    if (item.tipo === 'provedor') {
      // Provedores não são agrupados
      resultado.push(item);
    } else if (item.tipo === 'autoridade') {
      // Extrair endereçamento do ID (formato: "autoridade|endereçamento")
      const [autoridade] = item.id.split('|');

      if (!endereçamentoMap.has(item.nome)) {
        endereçamentoMap.set(item.nome, []);
      }
      endereçamentoMap.get(item.nome)!.push(autoridade);
    }
  });

  // Criar items agrupados para cada endereçamento
  endereçamentoMap.forEach((autoridades, nomeEndereçamento) => {
    resultado.push({
      id: nomeEndereçamento, // Usar apenas o nome do endereçamento como ID
      nome: nomeEndereçamento,
      tipo: 'orgao',
      autoridades: autoridades,
    });
  });

  return resultado;
}

/**
 * Gera lista única de todos os destinatários/endereçamentos de uma coleção de documentos
 * Processa todos os documentos e remove duplicatas para filtros
 * @param documentos - Array de documentos para processar
 * @returns Lista ordenada e agrupada de destinatários/endereçamentos únicos
 */
export function gerarListaDestinatarioEndereçamento(
  documentos: DocumentoDemanda[]
): DestinatarioEndereçamentoItem[] {
  const todosItems: DestinatarioEndereçamentoItem[] = [];

  documentos.forEach(doc => {
    const itemsDocumento = parseDestinatariosDocumento(doc);
    todosItems.push(...itemsDocumento);
  });

  // Remover duplicatas baseado no ID
  const itemsUnicos = todosItems.filter(
    (item, index, array) => array.findIndex(other => other.id === item.id) === index
  );

  // Agrupar autoridades por endereçamento
  const itemsAgrupados = agruparPorEndereçamento(itemsUnicos);

  // Ordenar por nome para facilitar busca
  return itemsAgrupados.sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Verifica se um documento corresponde a um filtro de destinatário/endereçamento
 * Suporta filtragem por provedores, autoridades individuais ou órgãos agrupados
 * @param documento - Documento a ser verificado
 * @param filtroId - ID do filtro (provedor, autoridade|endereçamento, ou órgão)
 * @returns true se o documento corresponde ao filtro
 */
export function documentoCorrespondeAoFiltro(
  documento: DocumentoDemanda,
  filtroId: string
): boolean {
  if (!filtroId) {
    return true;
  }

  // Se o filtro é um endereçamento de órgão (sem pipe)
  if (!filtroId.includes('|')) {
    // Verificar se é um provedor
    const provedor = mockProvedores.find(p => p.nomeFantasia === filtroId);
    if (provedor) {
      // É um provedor, verificar se o documento tem esse destinatário
      return documento.destinatario?.includes(filtroId) || false;
    }

    // É um órgão agrupado, verificar pelo endereçamento abreviado
    const endereçamentoAbreviado = getEnderecamentoAbreviado(documento.enderecamento);
    return endereçamentoAbreviado === filtroId;
  }

  // Filtro no formato antigo (autoridade|endereçamento)
  const destinatariosDoc = parseDestinatariosDocumento(documento);
  return destinatariosDoc.some(dest => dest.id === filtroId);
}
