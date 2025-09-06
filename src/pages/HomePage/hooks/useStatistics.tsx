import { useCallback, useMemo } from 'react';
import { useDemandasData } from '../../../hooks/queries/useDemandas';
import { useDocumentosData } from '../../../hooks/queries/useDocumentos';
// import { useStatisticsWorker } from '../../../hooks/useStatisticsWorker'; // TODO: Implement later
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import type { Estatistica, FiltrosEstatisticas, HomePageContadores, SubCard } from '../types';

// Função auxiliar para verificar documentos incompletos baseados no tipo
const checkOficioCircularIncomplete = (doc: DocumentoDemanda, assunto: string): boolean => {
  // 1ª VERIFICAÇÃO: Status Geral
  // Incompleto se status geral for não enviado
  if (!doc.dataEnvio) {
    return true; // Status geral: Não Enviado
  }

  // 2ª VERIFICAÇÃO: Pendente de Resposta
  // Para ofícios que esperam resposta: verificar se não foi respondido
  // Ofícios de encaminhamento e "Outros" não esperam resposta
  const assuntosQueNaoEsperamResposta = [
    'Encaminhamento de mídia',
    'Encaminhamento de relatório técnico',
    'Encaminhamento de relatório de inteligência',
    'Encaminhamento de relatório técnico e mídia',
    'Encaminhamento de autos circunstanciados',
    'Comunicação de não cumprimento de decisão judicial',
    'Outros',
  ];

  const esperaResposta = !assuntosQueNaoEsperamResposta.includes(assunto);

  // Se espera resposta e não tem dataResposta geral, está incompleto
  if (esperaResposta && !doc.dataResposta) {
    return true; // Status geral: Pendente
  }

  // 3ª VERIFICAÇÃO: Campos obrigatórios
  // Mesmo com status Respondido ou Encaminhado, é incompleto se:

  // a) Não tem número ATENA
  if (!doc.numeroAtena) {
    return true;
  }

  // b) Algum destinatário individual não tem código de rastreio
  // (exceto se marcado como "não possui rastreio")
  // Para assunto "Outros", é mais flexível - apenas precisa ter data de envio
  const faltaCodigoRastreio =
    assunto !== 'Outros' &&
    doc.destinatariosData?.some(
      dest => dest.dataEnvio && !dest.naopossuiRastreio && !dest.codigoRastreio
    );

  if (faltaCodigoRastreio) {
    return true;
  }

  // Se passou todas as verificações, está completo
  return false;
};

// Função auxiliar para verificar encaminhamentos
const checkEncaminhamentoIncomplete = (doc: DocumentoDemanda, assunto: string): boolean => {
  if (!doc.dataEnvio) return true;
  if (!assunto) return false;

  switch (assunto) {
    case 'Encaminhamento de mídia':
      return !doc.selectedMidias?.length;
    case 'Encaminhamento de relatório técnico':
      return !doc.selectedRelatoriosTecnicos?.length;
    case 'Encaminhamento de relatório de inteligência':
      return !doc.selectedRelatoriosInteligencia?.length;
    case 'Encaminhamento de autos circunstanciados':
      return !doc.selectedAutosCircunstanciados?.length;
    case 'Encaminhamento de relatório técnico e mídia':
      return !doc.selectedRelatoriosTecnicos?.length || !doc.selectedMidias?.length;
    default:
      return false;
  }
};

// Função auxiliar para verificar ofícios simples
const checkOficioSimpleIncomplete = (doc: DocumentoDemanda, assunto: string): boolean => {
  if (!doc.numeroAtena) return true;

  const isEncaminhamento = doc.assunto?.includes('Encaminhamento') || doc.assunto === 'Outros';

  if (isEncaminhamento) {
    return checkEncaminhamentoIncomplete(doc, assunto);
  }

  // Caso especial: "Comunicação de não cumprimento de decisão judicial" não espera resposta
  if (assunto === 'Comunicação de não cumprimento de decisão judicial') {
    return !doc.dataEnvio || (!doc.naopossuiRastreio && !doc.codigoRastreio);
  }

  return (
    !doc.dataEnvio ||
    (!doc.naopossuiRastreio && !doc.codigoRastreio) ||
    (doc.respondido && !doc.dataResposta) ||
    !doc.respondido
  );
};

export function useStatistics(filtrosEstatisticas: FiltrosEstatisticas) {
  const { data: demandas = [] } = useDemandasData();
  const { data: documentos = [] } = useDocumentosData();

  // Função direta para verificar se um documento está incompleto (sem cache complexo)
  const isDocumentIncomplete = useCallback(
    (doc: DocumentoDemanda): boolean => {
      const { tipoDocumento, assunto } = doc;

      if (tipoDocumento === 'Mídia') {
        // Mídia é considerada incompleta se não tiver tamanho ou hash
        return !doc.tamanhoMidia || !doc.hashMidia;
      } else if (
        ['Autos Circunstanciados', 'Relatório Técnico', 'Relatório de Inteligência'].includes(
          tipoDocumento
        )
      ) {
        return !doc.dataFinalizacao;
      } else if (tipoDocumento === 'Ofício Circular') {
        return checkOficioCircularIncomplete(doc, assunto);
      } else if (tipoDocumento === 'Ofício') {
        return checkOficioSimpleIncomplete(doc, assunto);
      }

      return false;
    },
    [documentos] // Depende diretamente do array de documentos
  );

  // Função para obter sub-cards
  const getSubCards = useCallback(
    (cardId: string, dadosAnalise: Demanda[], documentosAnalise: DocumentoDemanda[]): SubCard[] => {
      return [];
    },
    []
  );

  // Cálculo das estatísticas principais - otimizado
  const estatisticas = useMemo((): Estatistica[] => {
    return [];
  }, []);

  // Cálculo dos contadores para gestão rápida
  const getContadores = useCallback(
    (filtroAnalista: string[]): HomePageContadores => {
      // CORRIGIDO: Removido filtro !d.dataFinal - demandas finalizadas podem ter documentos pendentes
      const demandasParaContagem = demandas.filter(
        (d: Demanda) => filtroAnalista.length === 0 || filtroAnalista.includes(d.analista)
      );

      // Para contagem de demandas, manter apenas as não finalizadas
      const demandasQuePrecisamAtualizacao = demandasParaContagem.filter(
        d => !d.dataFinal && ['Em Andamento', 'Aguardando', 'Fila de Espera'].includes(d.status)
      ).length;

      // Para documentos, incluir TODOS (de demandas finalizadas e ativas)
      const documentosBase = documentos.filter(doc => {
        if (filtroAnalista.length === 0) return true;
        const demandaDoDoc = demandas.find(d => d.id === doc.demandaId);
        return demandaDoDoc && filtroAnalista.includes(demandaDoDoc.analista);
      });

      const documentosQuePrecisamAtualizacao = documentosBase.filter(doc =>
        isDocumentIncomplete(doc)
      ).length;

      return {
        documentos: documentosQuePrecisamAtualizacao,
        demandas: demandasQuePrecisamAtualizacao,
      };
    },
    [demandas, documentos, isDocumentIncomplete]
  );

  return {
    estatisticas,
    getSubCards,
    getContadores,
    isDocumentIncomplete,
  };
}
