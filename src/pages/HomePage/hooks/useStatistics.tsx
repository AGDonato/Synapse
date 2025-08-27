import { useCallback, useMemo } from 'react';
import { IoAlert, IoCheckmarkCircle, IoDocument, IoFolder, IoHourglassOutline, IoTime, IoTrendingUp } from 'react-icons/io5';
import { useDemandas } from '../../../hooks/queries/useDemandas';
import { useDocumentos } from '../../../hooks/queries/useDocumentos';
// import { useStatisticsWorker } from '../../../hooks/useStatisticsWorker'; // TODO: Implement later
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import type { Estatistica, FiltrosEstatisticas, HomePageContadores, SubCard } from '../types';

export function useStatistics(filtrosEstatisticas: FiltrosEstatisticas) {
  const { demandas } = useDemandas();
  const { documentos } = useDocumentos();

  // Cache para documentos incompletos - otimização de performance
  const documentosIncompletos = useMemo(() => {
    const cache = new Map<string, boolean>();
    
    const isIncomplete = (doc: DocumentoDemanda): boolean => {
      const cacheKey = `${doc.id}-${doc.updatedAt || doc.createdAt || ''}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }

      const { tipoDocumento, assunto } = doc;
      let incomplete = false;

      // Mídia - sempre completa
      if (tipoDocumento === 'Mídia') {
        incomplete = false;
      }
      // Relatórios e Autos - precisa data de finalização
      else if (['Autos Circunstanciados', 'Relatório Técnico', 'Relatório de Inteligência'].includes(tipoDocumento)) {
        incomplete = !doc.dataFinalizacao;
      }
      // Ofício Circular
      else if (tipoDocumento === 'Ofício Circular') {
        if (!doc.numeroAtena) {
          incomplete = true;
        } else if (assunto === 'Outros') {
          incomplete = !doc.dataEnvio;
        } else {
          incomplete = !doc.dataEnvio || 
                     !doc.destinatariosData?.length ||
                     !doc.destinatariosData.some(dest => dest.dataEnvio) ||
                     doc.destinatariosData.some(dest => 
                       (dest.dataEnvio && !dest.naopossuiRastreio && !dest.codigoRastreio) ||
                       (dest.respondido && !dest.dataResposta)
                     );
        }
      }
      // Ofício simples
      else if (tipoDocumento === 'Ofício') {
        if (!doc.numeroAtena) {
          incomplete = true;
        } else {
          const isEncaminhamento = doc.assunto?.includes('Encaminhamento') || doc.assunto === 'Outros';
          
          if (isEncaminhamento) {
            incomplete = !doc.dataEnvio;
            if (!incomplete && assunto) {
              switch (assunto) {
                case 'Encaminhamento de mídia':
                  incomplete = !doc.selectedMidias?.length;
                  break;
                case 'Encaminhamento de relatório técnico':
                  incomplete = !doc.selectedRelatoriosTecnicos?.length;
                  break;
                case 'Encaminhamento de relatório de inteligência':
                  incomplete = !doc.selectedRelatoriosInteligencia?.length;
                  break;
                case 'Encaminhamento de autos circunstanciados':
                  incomplete = !doc.selectedAutosCircunstanciados?.length;
                  break;
                case 'Encaminhamento de relatório técnico e mídia':
                  incomplete = !doc.selectedRelatoriosTecnicos?.length || !doc.selectedMidias?.length;
                  break;
              }
            }
          } else {
            incomplete = !doc.dataEnvio || 
                        (!doc.naopossuiRastreio && !doc.codigoRastreio) ||
                        (doc.respondido && !doc.dataResposta) ||
                        !doc.respondido;
          }
        }
      }

      cache.set(cacheKey, incomplete);
      return incomplete;
    };

    return documentos.reduce((acc, doc) => {
      acc.set(doc.id, isIncomplete(doc));
      return acc;
    }, new Map<string, boolean>());
  }, [documentos]);

  // Função otimizada para verificar se um documento está incompleto
  const isDocumentIncomplete = useCallback((doc: DocumentoDemanda): boolean => {
    return documentosIncompletos.get(doc.id) || false;
  }, [documentosIncompletos]);

  // Função para obter sub-cards
  const getSubCards = useCallback((
    cardId: string,
    dadosAnalise: Demanda[],
    documentosAnalise: DocumentoDemanda[]
  ): SubCard[] => {
    if (cardId === 'total-demandas') {
      return [
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
      ];
    }

    if (cardId === 'total-documentos') {
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
    }

    return [];
  }, [isDocumentIncomplete]);

  // Pre-filtros otimizados para evitar recálculos desnecessários
  const dadosFiltrados = useMemo(() => {
    // Filtrar demandas usando Set para melhor performance em lookups
    const anosSet = new Set(filtrosEstatisticas.anos);
    const analistasSet = new Set(filtrosEstatisticas.analista);
    
    const demandasFiltradas = demandas.filter((d: Demanda) => {
      // Filtro por ano
      if (anosSet.size > 0) {
        if (!d.dataInicial) {return false;}
        const ano = d.dataInicial.split('/')[2];
        if (!anosSet.has(ano)) {return false;}
      }
      
      // Filtro por analista
      if (analistasSet.size > 0) {
        if (!analistasSet.has(d.analista)) {return false;}
      }
      
      return true;
    });

    // Criar Set de IDs para lookup eficiente
    const idsDemandasFiltradas = new Set(demandasFiltradas.map(d => d.id));
    const documentosAnalise = documentos.filter((doc: DocumentoDemanda) =>
      idsDemandasFiltradas.has(doc.demandaId)
    );

    return {
      demandas: demandasFiltradas,
      documentos: documentosAnalise,
      idsDemandasSet: idsDemandasFiltradas,
    };
  }, [demandas, documentos, filtrosEstatisticas.anos, filtrosEstatisticas.analista]);

  // Cálculo das estatísticas principais - otimizado
  const estatisticas = useMemo((): Estatistica[] => {
    const { demandas: dadosAnalise, documentos: documentosAnalise } = dadosFiltrados;
    const totalDemandas = dadosAnalise.length;
    const totalDocumentos = documentosAnalise.length;

    // Pre-calcular subtítulo para evitar recálculo a cada render
    const subtituloPartes = [];
    if (filtrosEstatisticas.analista.length > 0) {
      if (filtrosEstatisticas.analista.length === 1) {
        subtituloPartes.push(`Analista: ${filtrosEstatisticas.analista[0]}`);
      } else {
        subtituloPartes.push(`Analistas: ${filtrosEstatisticas.analista.length} selecionados`);
      }
    }
    if (filtrosEstatisticas.anos.length > 0) {
      subtituloPartes.push(`Ano(s): ${filtrosEstatisticas.anos.join(', ')}`);
    }
    const subtitulo = subtituloPartes.length > 0 ? subtituloPartes.join(' | ') : 'Todas as demandas';

    return [
      {
        id: 'total-documentos',
        titulo: 'Total de Documentos',
        valor: totalDocumentos,
        subtitulo: 'Todos os tipos',
        icon: <IoDocument size={24} />,
        cor: 'roxo',
      },
      {
        id: 'total-demandas',
        titulo: 'Total de Demandas',
        valor: totalDemandas,
        subtitulo,
        icon: <IoFolder size={24} />,
        cor: 'azul',
      },
    ];
  }, [dadosFiltrados, filtrosEstatisticas.analista, filtrosEstatisticas.anos]);

  // Cálculo dos contadores para gestão rápida
  const getContadores = useCallback((filtroAnalista: string[]): HomePageContadores => {
    // Filtrar demandas base (não finalizadas + analista se selecionado)
    let demandasBase = demandas.filter((d: Demanda) => !d.dataFinal);

    if (filtroAnalista.length > 0) {
      demandasBase = demandasBase.filter((d: Demanda) =>
        filtroAnalista.includes(d.analista)
      );
    }

    // Demandas que precisam de atualização
    const demandasQuePrecisamAtualizacao = demandasBase.filter(demanda => {
      return ['Em Andamento', 'Aguardando', 'Fila de Espera'].includes(demanda.status);
    }).length;

    // Documentos das demandas base
    const demandasBaseIds = demandasBase.map(d => d.id);
    const documentosBase = documentos.filter((doc: DocumentoDemanda) =>
      demandasBaseIds.includes(doc.demandaId)
    );

    // Documentos que precisam de atualização
    const documentosQuePrecisamAtualizacao = documentosBase.filter(doc => {
      return isDocumentIncomplete(doc);
    }).length;

    return {
      documentos: documentosQuePrecisamAtualizacao,
      demandas: demandasQuePrecisamAtualizacao,
    };
  }, [demandas, documentos, isDocumentIncomplete]);

  return {
    estatisticas,
    getSubCards,
    getContadores,
    isDocumentIncomplete,
  };
}