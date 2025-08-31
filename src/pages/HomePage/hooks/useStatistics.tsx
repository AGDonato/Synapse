import { useCallback, useMemo } from 'react';
import {
  IoAlert,
  IoCheckmarkCircle,
  IoDocument,
  IoFolder,
  IoHourglassOutline,
  IoTime,
  IoTrendingUp,
} from 'react-icons/io5';
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
  const faltaCodigoRastreio = doc.destinatariosData?.some(
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

  // Cache para documentos incompletos - otimização de performance
  const documentosIncompletos = useMemo(() => {
    const cache = new Map<string, boolean>();

    const isIncomplete = (doc: DocumentoDemanda): boolean => {
      // Cache key inclui todos os campos relevantes para determinar completude
      const cacheKey = `${doc.id}-${doc.dataEnvio ?? ''}-${doc.dataResposta ?? ''}-${doc.numeroAtena ?? ''}-${doc.dataFinalizacao ?? ''}-${doc.respondido}-${JSON.stringify(doc.destinatariosData)}`;
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (cached !== undefined) return cached;
      }

      const { tipoDocumento, assunto } = doc;
      let incomplete = false;

      if (tipoDocumento === 'Mídia') {
        incomplete = false;
      } else if (
        ['Autos Circunstanciados', 'Relatório Técnico', 'Relatório de Inteligência'].includes(
          tipoDocumento
        )
      ) {
        incomplete = !doc.dataFinalizacao;
      } else if (tipoDocumento === 'Ofício Circular') {
        incomplete = checkOficioCircularIncomplete(doc, assunto);
      } else if (tipoDocumento === 'Ofício') {
        incomplete = checkOficioSimpleIncomplete(doc, assunto);
      }

      cache.set(cacheKey, incomplete);
      return incomplete;
    };

    return documentos.reduce((acc, doc) => {
      acc.set(String(doc.id), isIncomplete(doc));
      return acc;
    }, new Map<string, boolean>());
  }, [documentos]);

  // Função otimizada para verificar se um documento está incompleto
  const isDocumentIncomplete = useCallback(
    (doc: DocumentoDemanda): boolean => {
      return documentosIncompletos.get(String(doc.id)) ?? false;
    },
    [documentosIncompletos]
  );

  // Função para obter sub-cards de demandas
  const getDemandasSubCards = useCallback(
    (dadosAnalise: Demanda[]): SubCard[] => [
      {
        id: 'finalizadas',
        titulo: 'Finalizadas',
        valor: dadosAnalise.filter(d => d.status === 'Finalizada').length,
        cor: 'verde',
        icon: <IoCheckmarkCircle size={20} />,
      },
      {
        id: 'em-andamento',
        titulo: 'Em Andamento',
        valor: dadosAnalise.filter(d => d.status === 'Em Andamento').length,
        cor: 'amarelo',
        icon: <IoTime size={20} />,
      },
      {
        id: 'aguardando',
        titulo: 'Aguardando',
        valor: dadosAnalise.filter(d => d.status === 'Aguardando').length,
        cor: 'vermelho',
        icon: <IoAlert size={20} />,
      },
      {
        id: 'em-fila',
        titulo: 'Em Fila',
        valor: dadosAnalise.filter(d => d.status === 'Fila de Espera').length,
        cor: 'cinza-escuro',
        icon: <IoHourglassOutline size={20} />,
      },
    ],
    []
  );

  // Função para obter sub-cards de documentos
  const getDocumentosSubCards = useCallback(
    (documentosAnalise: DocumentoDemanda[]): SubCard[] => {
      const documentosPendentes = documentosAnalise.filter(doc => isDocumentIncomplete(doc)).length;
      const documentosConcluidos = documentosAnalise.length - documentosPendentes;

      return [
        {
          id: 'precisam-atualizacao',
          titulo: 'Precisam Atualização',
          valor: documentosPendentes,
          cor: 'laranja',
          icon: <IoTrendingUp size={20} />,
        },
        {
          id: 'concluidos',
          titulo: 'Concluídos',
          valor: documentosConcluidos,
          cor: 'azul-escuro',
          icon: <IoCheckmarkCircle size={20} />,
        },
      ];
    },
    [isDocumentIncomplete]
  );

  // Função para obter sub-cards
  const getSubCards = useCallback(
    (cardId: string, dadosAnalise: Demanda[], documentosAnalise: DocumentoDemanda[]): SubCard[] => {
      if (cardId === 'total-demandas') return getDemandasSubCards(dadosAnalise);
      if (cardId === 'total-documentos') return getDocumentosSubCards(documentosAnalise);
      return [];
    },
    [getDemandasSubCards, getDocumentosSubCards]
  );

  // Função para filtrar dados
  const filtrarDados = useCallback(
    (filtros: FiltrosEstatisticas) => {
      const anosSet = new Set(filtros.anos);
      const analistasSet = new Set(filtros.analista);

      const demandasFiltradas = demandas.filter((d: Demanda) => {
        if (anosSet.size > 0 && (!d.dataInicial || !anosSet.has(d.dataInicial.split('/')[2])))
          return false;
        if (analistasSet.size > 0 && !analistasSet.has(d.analista)) return false;
        return true;
      });

      const idsSet = new Set(demandasFiltradas.map(d => d.id));
      const documentosAnalise = documentos.filter((doc: DocumentoDemanda) =>
        idsSet.has(doc.demandaId)
      );

      return { demandas: demandasFiltradas, documentos: documentosAnalise, idsDemandasSet: idsSet };
    },
    [demandas, documentos]
  );

  // Pre-filtros otimizados para evitar recálculos desnecessários
  const dadosFiltrados = useMemo(
    () => filtrarDados(filtrosEstatisticas),
    [filtrarDados, filtrosEstatisticas]
  );

  // Função para gerar subtítulo das estatísticas
  const gerarSubtitulo = useCallback((filtros: FiltrosEstatisticas): string => {
    const partes = [];
    if (filtros.analista.length > 0) {
      if (filtros.analista.length === 1) {
        partes.push(`Analista: ${filtros.analista[0]}`);
      } else {
        partes.push(`Analistas: ${filtros.analista.length} selecionados`);
      }
    }
    if (filtros.anos.length > 0) {
      partes.push(`Ano(s): ${filtros.anos.join(', ')}`);
    }
    return partes.length > 0 ? partes.join(' | ') : 'Todas as demandas';
  }, []);

  // Cálculo das estatísticas principais - otimizado
  const estatisticas = useMemo((): Estatistica[] => {
    const { demandas: dadosAnalise, documentos: documentosAnalise } = dadosFiltrados;
    const subtitulo = gerarSubtitulo(filtrosEstatisticas);

    return [
      {
        id: 'total-documentos',
        titulo: 'Total de Documentos',
        valor: documentosAnalise.length,
        subtitulo: 'Todos os tipos',
        icon: <IoDocument size={24} />,
        cor: 'roxo',
      },
      {
        id: 'total-demandas',
        titulo: 'Total de Demandas',
        valor: dadosAnalise.length,
        subtitulo,
        icon: <IoFolder size={24} />,
        cor: 'azul',
      },
    ];
  }, [dadosFiltrados, filtrosEstatisticas, gerarSubtitulo]);

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
