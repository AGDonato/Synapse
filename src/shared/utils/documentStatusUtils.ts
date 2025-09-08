/**
 * UTILITÁRIOS DE STATUS DE DOCUMENTOS
 *
 * Este módulo gerencia a lógica complexa de status de documentos no sistema.
 * Inclui funcionalidades para:
 * - Classificação automática por tipo de documento (comunicação, produção, sem status)
 * - Cálculo de status baseado em regras específicas por tipo
 * - Tratamento especial para ofícios de encaminhamento e circulares
 * - Gerenciamento de status individuais em destinatários múltiplos
 * - Cores e filtros dinâmicos baseados no status
 * - Validação de disponibilidade de status por tipo de documento
 */

import type { DocumentoDemanda } from '../../shared/data/mockDocumentos';

export type DocumentStatus =
  | 'Não Enviado'
  | 'Pendente'
  | 'Respondido'
  | 'Encaminhado'
  | 'Em Produção'
  | 'Finalizado'
  | 'Sem Status';

export type DocumentStatusType = 'comunicacao' | 'producao' | 'sem-status';

/**
 * Determina o tipo de documento baseado no tipoDocumento
 * Classifica entre comunicação, produção ou sem status para lógica de status
 * @param tipoDocumento - Tipo do documento a ser classificado
 * @returns Categoria do documento para determinação de status
 */
export const getDocumentType = (tipoDocumento: string): DocumentStatusType => {
  const tipoLowerCase = tipoDocumento.toLowerCase();

  // Documentos de comunicação (envio/resposta)
  if (tipoLowerCase.includes('ofício')) {
    return 'comunicacao';
  }

  // Documentos de produção (finalização)
  if (tipoLowerCase.includes('relatório') || tipoLowerCase.includes('autos circunstanciados')) {
    return 'producao';
  }

  // Documentos sem status
  if (tipoLowerCase.includes('mídia')) {
    return 'sem-status';
  }

  // Fallback para comunicação (caso apareça um tipo novo)
  return 'comunicacao';
};

/**
 * Verifica se o documento é um ofício de encaminhamento (sem resposta esperada)
 */
export const isEncaminhamentoOficio = (documento: DocumentoDemanda): boolean => {
  if (!documento.tipoDocumento.includes('Ofício')) {
    return false;
  }

  const assunto = documento.assunto;

  // Assuntos que são apenas encaminhamentos (sem resposta esperada)
  const assuntosEncaminhamento = [
    'Encaminhamento de mídia',
    'Encaminhamento de relatório técnico',
    'Encaminhamento de relatório de inteligência',
    'Encaminhamento de relatório técnico e mídia',
    'Encaminhamento de autos circunstanciados',
    'Comunicação de não cumprimento de decisão judicial',
  ];

  // Ofícios "Outros" são sempre encaminhamento
  if (assunto === 'Outros') {
    return true;
  }

  return assuntosEncaminhamento.includes(assunto);
};

/**
 * Calcula o status do documento baseado no tipo e nas datas
 * Lógica central que determina status conforme regras específicas por tipo
 * @param documento - Documento para calcular o status
 * @returns Status atual do documento
 */
export const getDocumentStatus = (documento: DocumentoDemanda): DocumentStatus => {
  const type = getDocumentType(documento.tipoDocumento);

  switch (type) {
    case 'comunicacao':
      // Para ofícios: verificar se é encaminhamento primeiro
      if (!documento.dataEnvio) {
        return 'Não Enviado'; // Não foi enviado ainda
      }

      // Se é ofício de encaminhamento, nunca pode ser "Respondido"
      if (isEncaminhamentoOficio(documento)) {
        return 'Encaminhado'; // Enviado mas sem resposta esperada
      }

      // Ofícios normais com resposta esperada
      // Para Ofícios Circulares, verificar destinatários individuais
      if (
        documento.tipoDocumento === 'Ofício Circular' &&
        documento.destinatariosData &&
        documento.destinatariosData.length > 0
      ) {
        // Verificar se TODOS os destinatários responderam
        const todosResponderam = documento.destinatariosData.every(
          destinatario => destinatario.respondido
        );
        return todosResponderam ? 'Respondido' : 'Pendente';
      }

      // Para Ofícios simples, usar campo geral
      return documento.respondido ? 'Respondido' : 'Pendente';

    case 'producao':
      // Para relatórios e autos: baseado em dataFinalizacao
      return documento.dataFinalizacao ? 'Finalizado' : 'Em Produção';

    case 'sem-status':
      // Para mídia: sempre sem status
      return 'Sem Status';

    default:
      return 'Sem Status';
  }
};

/**
 * Obtém a cor do indicador de status
 * Retorna cores padronizadas para cada tipo de status
 * @param status - Status do documento
 * @returns Código hexadecimal da cor
 */
export const getStatusColor = (status: DocumentStatus): string => {
  switch (status) {
    case 'Não Enviado':
      return '#6C757D'; // Cinza
    case 'Pendente':
      return '#FF6B35'; // Laranja escuro
    case 'Respondido':
      return '#007BFF'; // Azul
    case 'Encaminhado':
      return '#007BFF'; // Azul (igual ao Respondido)
    case 'Em Produção':
      return '#6C757D'; // Cinza (era amarelo)
    case 'Finalizado':
      return '#007BFF'; // Azul (era verde)
    case 'Sem Status':
      return '#6C757D'; // Cinza
    default:
      return '#6C757D'; // Cinza padrão
  }
};

/**
 * Verifica se um documento deve aparecer em filtros de status
 * Exclui documentos do tipo "Sem Status" dos filtros
 * @param documento - Documento a ser verificado
 * @returns true se deve aparecer nos filtros
 */
export const hasStatus = (documento: DocumentoDemanda): boolean => {
  const status = getDocumentStatus(documento);
  return status !== 'Sem Status';
};

/**
 * Obtém todos os status possíveis para filtros
 */
export const getAllPossibleStatuses = (): DocumentStatus[] => {
  return ['Não Enviado', 'Pendente', 'Respondido', 'Encaminhado', 'Em Produção', 'Finalizado'];
};

/**
 * Obtém status disponíveis baseado no tipo de documento selecionado
 */
export const getAvailableStatusesByDocumentType = (tipoDocumento?: string): DocumentStatus[] => {
  // Se não há tipo selecionado, retorna todos
  if (!tipoDocumento || tipoDocumento === '') {
    return getAllPossibleStatuses();
  }

  switch (tipoDocumento) {
    case 'Ofício':
    case 'Ofício Circular':
      // Documentos de comunicação
      return ['Não Enviado', 'Pendente', 'Respondido', 'Encaminhado'];

    case 'Autos Circunstanciados':
    case 'Relatório Técnico':
    case 'Relatório de Inteligência':
      // Documentos de produção
      return ['Em Produção', 'Finalizado'];

    case 'Mídia':
      // Mídia não tem status filtráveis
      return [];

    default:
      // Para tipos não mapeados, retorna todos
      return getAllPossibleStatuses();
  }
};

/**
 * Verifica se o filtro de status deve estar habilitado baseado no tipo de documento
 */
export const shouldEnableStatusFilter = (tipoDocumento?: string): boolean => {
  // Se Mídia está selecionada, desabilitar o filtro
  if (tipoDocumento === 'Mídia') {
    return false;
  }
  return true;
};

/**
 * Calcula o status de um destinatário individual em Ofícios Circulares
 */
export const getIndividualRecipientStatus = (destinatario: {
  dataEnvio: string | null;
  respondido: boolean;
}): DocumentStatus => {
  // Se não foi enviado
  if (!destinatario.dataEnvio) {
    return 'Não Enviado';
  }

  // Se foi enviado e respondido
  if (destinatario.respondido) {
    return 'Respondido';
  }

  // Se foi enviado mas não respondido
  return 'Pendente';
};
