/**
 * Hook para processamento de estatísticas e contadores da HomePage
 *
 * @description
 * Centraliza toda a lógica de análise de dados para a página inicial:
 * - Cálculo de contadores de gestão (demandas e documentos pendentes)
 * - Análise de completude de documentos por tipo específico
 * - Processamento de estatísticas filtradas por analista
 * - Verificação de regras de negócio complexas (ex: ofícios que esperam resposta)
 * - Otimização de performance com memoização
 *
 * Tipos de documentos analisados:
 * - **Mídia**: Verifica tamanho e hash
 * - **Relatórios**: Verifica data de finalização
 * - **Ofícios Circulares**: Lógica complexa (envio + resposta + rastreamento)
 * - **Ofícios Simples**: Verificação de envio, rastreio e respostas
 *
 * @example
 * const {
 *   getContadores,
 *   isDocumentIncomplete
 * } = useStatistics(filtrosEstatisticas);
 *
 * // Obter contadores filtrados por analista
 * const contadores = getContadores(['João Silva']);
 *
 * // Verificar documento específico
 * const incompleto = isDocumentIncomplete(documento);
 *
 * @module pages/HomePage/hooks/useStatistics
 */

import { useCallback, useMemo } from 'react';
import { useDemandasData } from '../../../hooks/queries/useDemandas';
import { useDocumentosData } from '../../../hooks/queries/useDocumentos';
// import { useStatisticsWorker } from '../../../hooks/useStatisticsWorker'; // TODO: Implement later
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import type { Estatistica, FiltrosEstatisticas, HomePageContadores, SubCard } from '../types';

// ========== FUNÇÕES DE ANÁLISE ESPECIALIZADA ==========
// Verificações específicas por tipo de documento

/**
 * Verifica se Ofício Circular está incompleto (lógica mais complexa)
 *
 * Aplica 3 verificações sequenciais:
 * 1. Status Geral: Se foi enviado
 * 2. Pendência de Resposta: Se espera resposta e foi respondido
 * 3. Campos Obrigatórios: Número ATENA e códigos de rastreio
 */
const checkOficioCircularIncomplete = (doc: DocumentoDemanda, assunto: string): boolean => {
  // ===== 1ª VERIFICAÇÃO: STATUS GERAL =====
  // Qualquer documento sem data de envio está incompleto
  if (!doc.dataEnvio) {
    return true; // Status geral: Não Enviado
  }

  // ===== 2ª VERIFICAÇÃO: PENDÊNCIA DE RESPOSTA =====
  // Alguns assuntos NÃO esperam resposta (encaminhamentos e comunicações)
  // Outros assuntos ESPERAM resposta e ficam pendentes até recebê-la
  // Lista de assuntos que são apenas informativos (não aguardam retorno)
  const assuntosQueNaoEsperamResposta = [
    'Encaminhamento de mídia', // Apenas envia anexo
    'Encaminhamento de relatório técnico', // Apenas envia relatório
    'Encaminhamento de relatório de inteligência', // Apenas envia relatório
    'Encaminhamento de relatório técnico e mídia', // Apenas envia anexos
    'Encaminhamento de autos circunstanciados', // Apenas envia processo
    'Comunicação de não cumprimento de decisão judicial', // Apenas informa
    'Outros', // Caso genérico
  ];

  const esperaResposta = !assuntosQueNaoEsperamResposta.includes(assunto);

  // Se espera resposta mas não foi respondido, fica pendente
  if (esperaResposta && !doc.dataResposta) {
    return true; // Status: Pendente de Resposta
  }

  // ===== 3ª VERIFICAÇÃO: CAMPOS OBRIGATÓRIOS =====
  // Mesmo enviado/respondido, precisa de dados administrativos completos

  // Número ATENA é sempre obrigatório para rastreamento interno
  if (!doc.numeroAtena) {
    return true;
  }

  // Códigos de rastreio individuais por destinatário (exceto se explicitamente não possui)
  // Assunto "Outros" tem regras mais flexíveis
  // Verifica se algum destinatário enviado não tem código (e deveria ter)
  const faltaCodigoRastreio =
    assunto !== 'Outros' &&
    doc.destinatariosData?.some(
      dest =>
        dest.dataEnvio && // Foi enviado para este destinatário
        !dest.naopossuiRastreio && // Não foi marcado como "sem rastreio"
        !dest.codigoRastreio // Mas não tem o código
    );

  if (faltaCodigoRastreio) {
    return true;
  }

  // ===== RESULTADO =====
  // Se passou por todas as verificações, o documento está completo
  return false;
};

/**
 * Verifica encaminhamentos específicos (anexos obrigatórios)
 *
 * Cada tipo de encaminhamento deve ter os anexos correspondentes selecionados.
 */
const checkEncaminhamentoIncomplete = (doc: DocumentoDemanda, assunto: string): boolean => {
  // Todo encaminhamento deve ter sido enviado
  if (!doc.dataEnvio) return true;
  if (!assunto) return false; // Sem assunto definido, considera completo

  // Verifica anexos específicos por tipo de encaminhamento
  switch (assunto) {
    case 'Encaminhamento de mídia':
      return !doc.selectedMidias?.length; // Deve ter pelo menos uma mídia
    case 'Encaminhamento de relatório técnico':
      return !doc.selectedRelatoriosTecnicos?.length; // Deve ter pelo menos um relatório
    case 'Encaminhamento de relatório de inteligência':
      return !doc.selectedRelatoriosInteligencia?.length; // Deve ter pelo menos um relatório
    case 'Encaminhamento de autos circunstanciados':
      return !doc.selectedAutosCircunstanciados?.length; // Deve ter pelo menos um auto
    case 'Encaminhamento de relatório técnico e mídia':
      return !doc.selectedRelatoriosTecnicos?.length || !doc.selectedMidias?.length; // Deve ter ambos
    default:
      return false;
  }
};

/**
 * Verifica Ofícios simples (não circulares)
 *
 * Lógica mais simples que ofícios circulares, mas ainda considera
 * tipo de assunto para determinar obrigatoriedade de resposta.
 */
const checkOficioSimpleIncomplete = (doc: DocumentoDemanda, assunto: string): boolean => {
  // Número ATENA sempre obrigatório
  if (!doc.numeroAtena) return true;

  // Se é encaminhamento, usa lógica especializada
  const isEncaminhamento = doc.assunto?.includes('Encaminhamento') || doc.assunto === 'Outros';
  if (isEncaminhamento) {
    return checkEncaminhamentoIncomplete(doc, assunto);
  }

  // Comunicação de não cumprimento é apenas informativa
  if (assunto === 'Comunicação de não cumprimento de decisão judicial') {
    return (
      !doc.dataEnvio || // Deve ter sido enviado
      (!doc.naopossuiRastreio && !doc.codigoRastreio)
    ); // E ter rastreio (se aplicável)
  }

  // Verificações gerais para ofícios que esperam resposta
  return (
    !doc.dataEnvio || // Deve ter sido enviado
    (!doc.naopossuiRastreio && !doc.codigoRastreio) || // Deve ter rastreio (se aplicável)
    (doc.respondido && !doc.dataResposta) || // Se marcado como respondido, deve ter data
    !doc.respondido // Deve ter sido respondido
  );
};

/**
 * Hook principal para processamento de estatísticas da HomePage
 *
 * @param filtrosEstatisticas - Filtros aplicados para cálculo das estatísticas
 * @returns Interface com funções para análise de dados e contadores
 */
export function useStatistics(filtrosEstatisticas: FiltrosEstatisticas) {
  // ===== DADOS BASE =====
  // Obtém dados centralizados de demandas e documentos via React Query
  const { data: demandas = [] } = useDemandasData();
  const { data: documentos = [] } = useDocumentosData();

  // ===== VERIFICAÇÃO DE COMPLETUDE DE DOCUMENTOS =====
  /**
   * Função principal para verificar se um documento está incompleto
   *
   * Aplica regras específicas por tipo de documento:
   * - **Mídia**: Verifica tamanho e hash obrigatórios
   * - **Relatórios/Autos**: Verifica data de finalização
   * - **Ofício Circular**: Aplica lógica complexa (envio + resposta + rastreamento)
   * - **Ofício Simples**: Verificação básica de envio e respostas
   *
   * @param doc - Documento a ser analisado
   * @returns true se o documento está incompleto, false se está completo
   */
  const isDocumentIncomplete = useCallback(
    (doc: DocumentoDemanda): boolean => {
      const { tipoDocumento, assunto } = doc;

      // **MÍDIA**: Campos técnicos obrigatórios
      if (tipoDocumento === 'Mídia') {
        // Mídia sem tamanho ou hash está incompleta (dados técnicos essenciais)
        return !doc.tamanhoMidia || !doc.hashMidia;
      }

      // **RELATÓRIOS E AUTOS**: Data de finalização obrigatória
      else if (
        ['Autos Circunstanciados', 'Relatório Técnico', 'Relatório de Inteligência'].includes(
          tipoDocumento
        )
      ) {
        // Sem data de finalização = trabalho ainda em andamento
        return !doc.dataFinalizacao;
      }

      // **OFÍCIO CIRCULAR**: Lógica complexa de negócio
      else if (tipoDocumento === 'Ofício Circular') {
        return checkOficioCircularIncomplete(doc, assunto);
      }

      // **OFÍCIO SIMPLES**: Lógica padrão de envio/resposta
      else if (tipoDocumento === 'Ofício') {
        return checkOficioSimpleIncomplete(doc, assunto);
      }

      // **OUTROS TIPOS**: Considera sempre completos por padrão
      return false;
    },
    [documentos] // Recalcula quando a lista de documentos muda
  );

  // ===== GERAÇÃO DE SUB-CARDS =====
  /**
   * Função para gerar sub-cards de análise detalhada
   *
   * @param cardId - Identificador do card principal
   * @param dadosAnalise - Dados de demandas para análise
   * @param documentosAnalise - Dados de documentos para análise
   * @returns Array de sub-cards com estatísticas específicas
   *
   * @todo Implementar lógica de geração de sub-cards baseada no cardId
   */
  const getSubCards = useCallback(
    (cardId: string, dadosAnalise: Demanda[], documentosAnalise: DocumentoDemanda[]): SubCard[] => {
      // Placeholder - implementação futura baseada no tipo de card solicitado
      return [];
    },
    []
  );

  // ===== CÁLCULO DE ESTATÍSTICAS PRINCIPAIS =====
  /**
   * Estatísticas consolidadas para exibição em cards da HomePage
   *
   * Processa e agrupa dados para gerar métricas de:
   * - Performance por analista
   * - Distribuição por status
   * - Tendências temporais
   * - Indicadores de qualidade
   *
   * @todo Implementar cálculos estatísticos baseados nos filtros aplicados
   */
  const estatisticas = useMemo((): Estatistica[] => {
    // Placeholder - implementação futura do processamento estatístico
    return [];
  }, []);

  // ===== CONTADORES PARA GESTÃO RÁPIDA =====
  /**
   * Calcula contadores essenciais para gestão da HomePage
   *
   * **Estratégia de Contagem**:
   * - **Demandas**: Apenas as ativas (não finalizadas) que precisam atenção
   * - **Documentos**: TODOS os incompletos (incluindo de demandas finalizadas)
   *
   * **Filtro por Analista**:
   * - Se filtro vazio = conta tudo
   * - Se filtro preenchido = conta apenas do analista selecionado
   *
   * @param filtroAnalista - Array de analistas para filtrar (vazio = todos)
   * @returns Objeto com contadores de demandas e documentos pendentes
   */
  const getContadores = useCallback(
    (filtroAnalista: string[]): HomePageContadores => {
      // ===== FILTRO BASE POR ANALISTA =====
      const demandasParaContagem = demandas.filter(
        (d: Demanda) => filtroAnalista.length === 0 || filtroAnalista.includes(d.analista)
      );

      // ===== CONTAGEM DE DEMANDAS ATIVAS =====
      // Apenas demandas não finalizadas que precisam de ação
      const demandasQuePrecisamAtualizacao = demandasParaContagem.filter(
        d => !d.dataFinal && ['Em Andamento', 'Aguardando', 'Fila de Espera'].includes(d.status)
      ).length;

      // ===== CONTAGEM DE DOCUMENTOS INCOMPLETOS =====
      // Inclui documentos de TODAS as demandas (finalizadas e ativas)
      // Justificativa: documentos podem precisar correção mesmo após demanda finalizada
      const documentosBase = documentos.filter(doc => {
        if (filtroAnalista.length === 0) return true;
        const demandaDoDoc = demandas.find(d => d.id === doc.demandaId);
        return demandaDoDoc && filtroAnalista.includes(demandaDoDoc.analista);
      });

      const documentosQuePrecisamAtualizacao = documentosBase.filter(doc =>
        isDocumentIncomplete(doc)
      ).length;

      // ===== RESULTADO FINAL =====
      return {
        documentos: documentosQuePrecisamAtualizacao,
        demandas: demandasQuePrecisamAtualizacao,
      };
    },
    [demandas, documentos, isDocumentIncomplete]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todas as funcionalidades do hook de estatísticas
   *
   * @returns Objeto com:
   * - estatisticas: Array de estatísticas consolidadas para cards
   * - getSubCards: Função para gerar sub-cards de análise detalhada
   * - getContadores: Função para calcular contadores de gestão
   * - isDocumentIncomplete: Função para verificar completude de documentos
   */
  return {
    /** Estatísticas consolidadas para exibição em cards */
    estatisticas,

    /** Função para gerar sub-cards de análise específica */
    getSubCards,

    /** Função para calcular contadores essenciais (demandas e documentos pendentes) */
    getContadores,

    /** Função para verificar se um documento específico está incompleto */
    isDocumentIncomplete,
  };
}
