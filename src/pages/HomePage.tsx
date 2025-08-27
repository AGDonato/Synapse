import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  IoAlert,
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoDocument,
  IoEye,
  IoFolder,
  IoHourglassOutline,
  IoStatsChart,
  IoTime,
  IoTrendingUp,
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import DemandUpdateModal from '../components/demands/modals/DemandUpdateModal';
import DocumentUpdateModal from '../components/documents/modals/DocumentUpdateModal';
import StatusBadge from '../components/ui/StatusBadge';
import Table, { type TableColumn } from '../components/ui/Table';
import Toast from '../components/ui/Toast';
import ResponseRateChart from '../components/charts/ResponseRateChart';
import { StatusByYearChart } from '../components/charts/StatusByYearChart';
import { OpenDemandsChart } from '../components/charts/OpenDemandsChart';
import DemandTypesChart from '../components/charts/DemandTypesChart';
import DemandsYearlyChart from '../components/charts/DemandsYearlyChart';
import ResponseTimeBoxplot from '../components/charts/ResponseTimeBoxplot';
import AverageResponseTimeChart from '../components/charts/AverageResponseTimeChart';
import ProviderRanking from '../components/charts/ProviderRanking';
import ProviderStatsSummary from '../components/charts/ProviderStatsSummary';
import MediaTypesChart from '../components/charts/MediaTypesChart';
import JudicialOrgansTreemap from '../components/charts/JudicialOrgansTreemap';
import SolicitantesOrgansChart from '../components/charts/SolicitantesOrgansChart';
import { useProviderFilters } from '../hooks/useProviderFilters';
import ProviderFilters from '../components/charts/ProviderFilters';
import { mockAnalistas } from '../data/mockAnalistas';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import { useDemandas } from '../hooks/useDemandas';
import { useDocumentos } from '../hooks/useDocumentos';
import type { Demanda } from '../types/entities';
import {
  getDocumentStatus,
  getStatusColor,
  isEncaminhamentoOficio,
} from '../utils/documentStatusUtils';
import styles from './HomePage.module.css';

// Tipos para as estatísticas
interface Estatistica {
  id: string;
  titulo: string;
  valor: number | string;
  subtitulo?: string;
  icon: React.ReactElement;
  cor: 'azul' | 'verde' | 'amarelo' | 'vermelho' | 'roxo' | 'laranja';
  tendencia?: {
    valor: number;
    direcao: 'alta' | 'baixa' | 'estavel';
  };
}

interface FiltroTabelas {
  analista: string[];
  referencia: string;
  documentos: string;
}

interface FiltrosEstatisticas {
  anos: string[];
  analista: string[];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { demandas, updateDemanda } = useDemandas();
  const { documentos, updateDocumento, getDocumentosByDemandaId } =
    useDocumentos();
  const providerFilters = useProviderFilters();
  const [filtros, setFiltros] = useState<FiltroTabelas>({
    analista: [],
    referencia: '',
    documentos: '',
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownAnosEstatisticasOpen, setDropdownAnosEstatisticasOpen] =
    useState(false);
  const dropdownAnosEstatisticasRef = useRef<HTMLDivElement>(null);
  const [
    dropdownAnalistaEstatisticasOpen,
    setDropdownAnalistaEstatisticasOpen,
  ] = useState(false);
  const dropdownAnalistaEstatisticasRef = useRef<HTMLDivElement>(null);
  const [dropdownAnosDocumentosOpen, setDropdownAnosDocumentosOpen] =
    useState(false);
  const dropdownAnosDocumentosRef = useRef<HTMLDivElement>(null);
  const [isGestaoRapidaOpen, setIsGestaoRapidaOpen] = useState(true);

  // Estados para o Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<
    'error' | 'success' | 'warning' | 'info'
  >('error');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [showDefectiveMedias, setShowDefectiveMedias] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Função para manipular seleção múltipla de analistas
  const handleAnalistaChange = useCallback((analistaNome: string) => {
    setFiltros(prev => {
      const currentAnalistas = prev.analista;
      const newAnalistas = currentAnalistas.includes(analistaNome)
        ? currentAnalistas.filter(item => item !== analistaNome)
        : [...currentAnalistas, analistaNome];
      return { ...prev, analista: newAnalistas };
    });
  }, []);

  // Função para obter texto do filtro de analista
  const getAnalistaDisplayText = useCallback(() => {
    if (filtros.analista.length === 0) {
      return '';
    }
    if (filtros.analista.length === mockAnalistas.length) {
      return 'Todos';
    }
    if (filtros.analista.length === 1) {
      return filtros.analista[0];
    }
    return `${filtros.analista.length} analistas`;
  }, [filtros.analista]);

  // Estados para os filtros de estatísticas
  const [filtrosEstatisticas, setFiltrosEstatisticas] =
    useState<FiltrosEstatisticas>({
      anos: [],
      analista: [],
    });

  // Estados para os filtros da seção de documentos
  const [filtrosDocumentos, setFiltrosDocumentos] = useState<{
    anos: string[];
  }>({
    anos: [],
  });

  // Função para obter anos únicos das demandas
  const anosDisponiveis = useMemo(() => {
    const anosSet = new Set<string>();
    demandas.forEach(demanda => {
      if (demanda.dataInicial) {
        const ano = demanda.dataInicial.split('/')[2];
        anosSet.add(ano);
      }
    });
    return Array.from(anosSet).sort().reverse(); // Ordem decrescente (mais recente primeiro)
  }, [demandas]);

  // Inicializar filtros automaticamente com todos os anos disponíveis
  useEffect(() => {
    if (anosDisponiveis.length > 0 && filtrosEstatisticas.anos.length === 0) {
      setFiltrosEstatisticas(prev => ({
        ...prev,
        anos: anosDisponiveis,
      }));
    }
  }, [anosDisponiveis, filtrosEstatisticas.anos.length]);

  // Opções para o filtro de anos
  const opcoesAnos = useMemo(
    () => anosDisponiveis.map(ano => ({ id: ano, nome: ano })),
    [anosDisponiveis]
  );

  // Função para manipular seleção múltipla de anos
  const handleAnoEstatisticasChange = useCallback((ano: string) => {
    setFiltrosEstatisticas(prev => {
      const currentAnos = prev.anos;
      const newAnos = currentAnos.includes(ano)
        ? currentAnos.filter(item => item !== ano)
        : [...currentAnos, ano];
      return { ...prev, anos: newAnos };
    });
  }, []);

  // Função para obter texto do filtro de anos
  const getAnosDisplayText = useCallback(() => {
    if (filtrosEstatisticas.anos.length === 0) {
      return '';
    }
    if (filtrosEstatisticas.anos.length === anosDisponiveis.length) {
      return 'Todos os anos';
    }
    if (filtrosEstatisticas.anos.length === 1) {
      return filtrosEstatisticas.anos[0];
    }
    return `${filtrosEstatisticas.anos.length} anos`;
  }, [filtrosEstatisticas.anos, anosDisponiveis.length]);

  // Função para manipular seleção múltipla de analistas das estatísticas
  const handleAnalistaEstatisticasChange = useCallback(
    (analistaNome: string) => {
      setFiltrosEstatisticas(prev => {
        const currentAnalistas = prev.analista;
        const newAnalistas = currentAnalistas.includes(analistaNome)
          ? currentAnalistas.filter(item => item !== analistaNome)
          : [...currentAnalistas, analistaNome];
        return { ...prev, analista: newAnalistas };
      });
    },
    []
  );

  // Função para obter texto do filtro de analista das estatísticas
  const getAnalistaEstatisticasDisplayText = useCallback(() => {
    if (filtrosEstatisticas.analista.length === 0) {
      return '';
    }
    if (filtrosEstatisticas.analista.length === mockAnalistas.length) {
      return 'Todos';
    }
    if (filtrosEstatisticas.analista.length === 1) {
      return filtrosEstatisticas.analista[0];
    }
    return `${filtrosEstatisticas.analista.length} analistas`;
  }, [filtrosEstatisticas.analista]);

  // Função para manipular seleção múltipla de anos dos documentos
  const handleAnoDocumentosChange = useCallback((ano: string) => {
    setFiltrosDocumentos(prev => {
      const currentAnos = prev.anos;
      const newAnos = currentAnos.includes(ano)
        ? currentAnos.filter(item => item !== ano)
        : [...currentAnos, ano];
      return { ...prev, anos: newAnos };
    });
  }, []);

  // Função para obter texto do filtro de anos dos documentos
  const getAnosDocumentosDisplayText = useCallback(() => {
    if (filtrosDocumentos.anos.length === 0) {
      return '';
    }
    if (filtrosDocumentos.anos.length === anosDisponiveis.length) {
      return '';
    }
    if (filtrosDocumentos.anos.length === 1) {
      return filtrosDocumentos.anos[0];
    }
    return `${filtrosDocumentos.anos.length} anos`;
  }, [filtrosDocumentos.anos, anosDisponiveis.length]);

  // Função para obter anos selecionados (ou todos se vazio)
  const getSelectedYears = useCallback(() => {
    return filtrosDocumentos.anos.length > 0
      ? filtrosDocumentos.anos
      : anosDisponiveis;
  }, [filtrosDocumentos.anos, anosDisponiveis]);

  // Estados para os modais
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentoDemanda | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demanda | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);

  // Estado para expansão dos cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Função para alternar expansão dos cards
  const toggleCardExpansion = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(cardId)) {
        newExpanded.delete(cardId);
      } else {
        newExpanded.add(cardId);
      }
      return newExpanded;
    });
  }, []);

  // Dados filtrados para as tabelas - demandas não finalizadas e todos os documentos
  const demandasFiltradas = useMemo(() => {
    let resultado = [...demandas];

    // Filtrar apenas demandas que NÃO têm data de finalização (pendentes)
    resultado = resultado.filter((d: Demanda) => !d.dataFinal);

    if (filtros.analista.length > 0) {
      resultado = resultado.filter((d: Demanda) =>
        filtros.analista.includes(d.analista)
      );
    }

    // Filtro para Número de Referência
    if (filtros.referencia) {
      const termoBuscaReferencia = filtros.referencia.toLowerCase();
      resultado = resultado.filter((d: Demanda) => {
        return (
          d.sged.toLowerCase().includes(termoBuscaReferencia) ||
          (d.autosAdministrativos || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (d.autosJudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (d.autosExtrajudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (d.pic || '').toLowerCase().includes(termoBuscaReferencia)
        );
      });
    }

    // Filtro para Documentos
    if (filtros.documentos) {
      const termoBuscaDocumentos = filtros.documentos.toLowerCase();
      resultado = resultado.filter((d: Demanda) => {
        const documentosDaDemanda = getDocumentosByDemandaId(d.id);

        for (const documento of documentosDaDemanda) {
          // Buscar no código de rastreio geral
          if (
            documento.codigoRastreio
              ?.toLowerCase()
              .includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar nos códigos de rastreio individuais dos destinatários (Ofícios Circulares)
          if (
            documento.tipoDocumento === 'Ofício Circular' &&
            documento.destinatariosData
          ) {
            const hasMatchingDestinatarioRastreio =
              documento.destinatariosData.some(destinatario => {
                return (
                  destinatario.codigoRastreio &&
                  destinatario.codigoRastreio
                    .toLowerCase()
                    .includes(termoBuscaDocumentos)
                );
              });
            if (hasMatchingDestinatarioRastreio) {
              return true;
            }
          }

          // Buscar no hash da mídia
          if (
            documento.hashMidia?.toLowerCase().includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar no número ATENA
          if (
            documento.numeroAtena?.toLowerCase().includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar no número do documento
          if (
            documento.numeroDocumento
              ?.toLowerCase()
              .includes(termoBuscaDocumentos)
          ) {
            return true;
          }

          // Buscar nos identificadores das pesquisas
          for (const pesquisa of documento.pesquisas || []) {
            if (
              pesquisa.identificador
                ?.toLowerCase()
                .includes(termoBuscaDocumentos)
            ) {
              return true;
            }
          }
        }

        return false;
      });
    }

    return resultado;
  }, [demandas, filtros, getDocumentosByDemandaId]);

  // Função para verificar se um documento está incompleto (faltam campos obrigatórios)
  const isDocumentIncomplete = useCallback((doc: DocumentoDemanda): boolean => {
    const { tipoDocumento, assunto } = doc;

    // Mídia - sempre completa (não tem campos obrigatórios)
    if (tipoDocumento === 'Mídia') return false;

    // Relatórios e Autos - precisa data de finalização
    if (
      [
        'Autos Circunstanciados',
        'Relatório Técnico',
        'Relatório de Inteligência',
      ].includes(tipoDocumento)
    ) {
      return !doc.dataFinalizacao;
    }

    // Ofício Circular
    if (tipoDocumento === 'Ofício Circular') {
      if (!doc.numeroAtena) return true;

      if (assunto === 'Outros') {
        // Ofício Circular "Outros" só precisa numeroAtena e dataEnvio
        return !doc.dataEnvio;
      } else {
        // Ofício Circular normal - precisa de numeroAtena, dataEnvio e pelo menos um destinatário enviado
        if (!doc.dataEnvio) return true;

        // Deve ter destinatários configurados
        if (!doc.destinatariosData || doc.destinatariosData.length === 0)
          return true;

        // Deve ter pelo menos um destinatário enviado
        const algumDestinatarioEnviado = doc.destinatariosData.some(
          dest => dest.dataEnvio
        );
        if (!algumDestinatarioEnviado) return true;

        // Verificar campos individuais de cada destinatário
        for (const dest of doc.destinatariosData) {
          // Se foi enviado mas falta código de rastreio (e não marcou que não possui)
          if (
            dest.dataEnvio &&
            !dest.naopossuiRastreio &&
            !dest.codigoRastreio
          ) {
            return true;
          }
          // Se já respondeu mas falta data de resposta
          if (dest.respondido && !dest.dataResposta) {
            return true;
          }
          // Se foi enviado, tem código de rastreio, mas ainda não respondeu (pendente de resposta)
          if (
            dest.dataEnvio &&
            (dest.codigoRastreio || dest.naopossuiRastreio) &&
            !dest.respondido
          ) {
            return true;
          }
        }
      }
      return false;
    }

    // Ofício simples
    if (tipoDocumento === 'Ofício') {
      if (!doc.numeroAtena) return true;

      // Se é encaminhamento (incluindo "Outros")
      if (isEncaminhamentoOficio(doc)) {
        // Encaminhamentos precisam de numeroAtena e dataEnvio
        if (!doc.dataEnvio) return true;

        // Verificar se tem documentos selecionados (exceto para alguns casos)
        switch (assunto) {
          case 'Encaminhamento de mídia':
            // Precisa ter pelo menos uma mídia selecionada
            return !doc.selectedMidias || doc.selectedMidias.length === 0;

          case 'Encaminhamento de relatório técnico':
            // Precisa ter pelo menos um relatório técnico selecionado
            return (
              !doc.selectedRelatoriosTecnicos ||
              doc.selectedRelatoriosTecnicos.length === 0
            );

          case 'Encaminhamento de relatório de inteligência':
            // Precisa ter pelo menos um relatório de inteligência selecionado
            return (
              !doc.selectedRelatoriosInteligencia ||
              doc.selectedRelatoriosInteligencia.length === 0
            );

          case 'Encaminhamento de autos circunstanciados':
            // Precisa ter pelo menos um autos circunstanciados selecionado
            return (
              !doc.selectedAutosCircunstanciados ||
              doc.selectedAutosCircunstanciados.length === 0
            );

          case 'Encaminhamento de relatório técnico e mídia': {
            // Precisa ter pelo menos um relatório técnico E uma mídia selecionados
            const temRelatorio =
              doc.selectedRelatoriosTecnicos &&
              doc.selectedRelatoriosTecnicos.length > 0;
            const temMidia =
              doc.selectedMidias && doc.selectedMidias.length > 0;
            return !temRelatorio || !temMidia;
          }

          case 'Comunicação de não cumprimento de decisão judicial':
            // Não precisa de documentos selecionados (para evitar bug quando ofício for respondido)
            return false;

          case 'Outros':
            // Ofício "Outros" não precisa de documentos selecionados
            return false;

          default:
            return false;
        }
      } else {
        // Ofício de resposta/requisição
        if (!doc.dataEnvio) return true;
        if (!doc.naopossuiRastreio && !doc.codigoRastreio) return true;
        if (doc.respondido && !doc.dataResposta) return true;
        // Para ofícios de requisição/resposta que foram enviados mas ainda não respondidos
        if (!doc.respondido) return true;
      }
    }

    // Se chegou até aqui, documento está completo
    return false;
  }, []);

  // Função para obter sub-cards
  const getSubCards = useCallback(
    (
      cardId: string,
      dadosAnalise: Demanda[],
      documentosAnalise: DocumentoDemanda[]
    ) => {
      const demandasFinalizadas = dadosAnalise.filter(
        (d: Demanda) => d.status === 'Finalizada'
      ).length;
      const demandasEmAndamento = dadosAnalise.filter(
        (d: Demanda) => d.status === 'Em Andamento'
      ).length;
      const demandasAguardando = dadosAnalise.filter(
        (d: Demanda) => d.status === 'Aguardando'
      ).length;
      const demandasEmFila = dadosAnalise.filter(
        (d: Demanda) => d.status === 'Fila de Espera'
      ).length;

      const totalDocumentos = documentosAnalise.length;
      const documentosPendentes = documentosAnalise.filter(doc =>
        isDocumentIncomplete(doc)
      ).length;
      const documentosConcluidos = totalDocumentos - documentosPendentes;

      switch (cardId) {
        case 'total-demandas':
          return [
            {
              id: 'finalizadas',
              titulo: 'Finalizadas',
              valor: demandasFinalizadas,
              cor: 'verde',
              icon: <IoCheckmarkCircle size={20} />,
            },
            {
              id: 'em-andamento',
              titulo: 'Em Andamento',
              valor: demandasEmAndamento,
              cor: 'amarelo',
              icon: <IoTime size={20} />,
            },
            {
              id: 'aguardando',
              titulo: 'Aguardando',
              valor: demandasAguardando,
              cor: 'vermelho',
              icon: <IoAlert size={20} />,
            },
            {
              id: 'em-fila',
              titulo: 'Em Fila',
              valor: demandasEmFila,
              cor: 'cinza-escuro',
              icon: <IoHourglassOutline size={20} />,
            },
          ];
        case 'total-documentos':
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
        default:
          return [];
      }
    },
    [isDocumentIncomplete]
  );

  const documentosFiltrados = useMemo(() => {
    const todosDocumentos = documentos;
    let resultado = [...todosDocumentos];

    // Primeiro filtrar por demandas ativas e analista
    if (filtros.analista.length > 0) {
      // Filtrar documentos por demandas do analista (só demandas não finalizadas)
      const demandasDoAnalista = demandas
        .filter(
          (d: Demanda) => filtros.analista.includes(d.analista) && !d.dataFinal
        )
        .map((d: Demanda) => d.id);

      resultado = resultado.filter((doc: DocumentoDemanda) =>
        demandasDoAnalista.includes(doc.demandaId)
      );
    } else {
      // Se não filtrou por analista, ainda precisa filtrar por demandas não finalizadas
      const demandasAtivas = demandas
        .filter((d: Demanda) => !d.dataFinal)
        .map((d: Demanda) => d.id);

      resultado = resultado.filter((doc: DocumentoDemanda) =>
        demandasAtivas.includes(doc.demandaId)
      );
    }

    // Filtro para Número de Referência (filtra por demanda associada)
    if (filtros.referencia) {
      const termoBuscaReferencia = filtros.referencia.toLowerCase();
      resultado = resultado.filter((doc: DocumentoDemanda) => {
        const demanda = demandas.find((d: Demanda) => d.id === doc.demandaId);
        if (!demanda) return false;

        return (
          demanda.sged.toLowerCase().includes(termoBuscaReferencia) ||
          (demanda.autosAdministrativos || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (demanda.autosJudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (demanda.autosExtrajudiciais || '')
            .toLowerCase()
            .includes(termoBuscaReferencia) ||
          (demanda.pic || '').toLowerCase().includes(termoBuscaReferencia)
        );
      });
    }

    // Filtro para Documentos
    if (filtros.documentos) {
      const termoBuscaDocumentos = filtros.documentos.toLowerCase();
      resultado = resultado.filter((doc: DocumentoDemanda) => {
        // Buscar no código de rastreio geral
        if (doc.codigoRastreio?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar nos códigos de rastreio individuais dos destinatários (Ofícios Circulares)
        if (doc.tipoDocumento === 'Ofício Circular' && doc.destinatariosData) {
          const hasMatchingDestinatarioRastreio = doc.destinatariosData.some(
            destinatario => {
              return (
                destinatario.codigoRastreio &&
                destinatario.codigoRastreio
                  .toLowerCase()
                  .includes(termoBuscaDocumentos)
              );
            }
          );
          if (hasMatchingDestinatarioRastreio) {
            return true;
          }
        }

        // Buscar no hash da mídia
        if (doc.hashMidia?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar no número ATENA
        if (doc.numeroAtena?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar no número do documento
        if (doc.numeroDocumento?.toLowerCase().includes(termoBuscaDocumentos)) {
          return true;
        }

        // Buscar nos identificadores das pesquisas
        for (const pesquisa of doc.pesquisas || []) {
          if (
            pesquisa.identificador?.toLowerCase().includes(termoBuscaDocumentos)
          ) {
            return true;
          }
        }

        return false;
      });
    }

    // APLICAR FILTRO DE DOCUMENTOS INCOMPLETOS
    // Mostrar apenas documentos que precisam de atualização (campos obrigatórios não preenchidos)
    resultado = resultado.filter(doc => isDocumentIncomplete(doc));

    return resultado;
  }, [documentos, demandas, filtros, isDocumentIncomplete]);

  // Cálculo dos contadores para gestão rápida (quando recolhida)
  // Independente dos filtros de busca, considera apenas filtro de analista
  const contadores = useMemo(() => {
    // Filtrar demandas base (não finalizadas + analista se selecionado)
    let demandasBase = demandas.filter((d: Demanda) => !d.dataFinal);

    if (filtros.analista.length > 0) {
      demandasBase = demandasBase.filter((d: Demanda) =>
        filtros.analista.includes(d.analista)
      );
    }

    // Demandas que precisam de atualização
    const demandasQuePrecisamAtualizacao = demandasBase.filter(demanda => {
      return ['Em Andamento', 'Aguardando', 'Fila de Espera'].includes(
        demanda.status
      );
    }).length;

    // Documentos das demandas base
    const demandasBaseIds = demandasBase.map(d => d.id);
    const documentosBase = documentos.filter((doc: DocumentoDemanda) =>
      demandasBaseIds.includes(doc.demandaId)
    );

    // Documentos que precisam de atualização (campos incompletos)
    const documentosQuePrecisamAtualizacao = documentosBase.filter(doc => {
      return isDocumentIncomplete(doc);
    }).length;

    return {
      documentos: documentosQuePrecisamAtualizacao,
      demandas: demandasQuePrecisamAtualizacao,
    };
  }, [demandas, documentos, filtros.analista, isDocumentIncomplete]);

  // Cálculo das estatísticas
  const estatisticas = useMemo((): Estatistica[] => {
    // Filtrar demandas por anos selecionados
    let demandasFiltradas = demandas;
    if (filtrosEstatisticas.anos.length > 0) {
      demandasFiltradas = demandas.filter((d: Demanda) => {
        if (!d.dataInicial) return false;
        const ano = d.dataInicial.split('/')[2];
        return filtrosEstatisticas.anos.includes(ano);
      });
    }

    // Filtrar demandas por analistas selecionados
    let dadosAnalise = demandasFiltradas;
    if (filtrosEstatisticas.analista.length > 0) {
      dadosAnalise = demandasFiltradas.filter((d: Demanda) =>
        filtrosEstatisticas.analista.includes(d.analista)
      );
    }

    // Filtrar documentos baseado nas demandas filtradas
    const idsDemandasFiltradas = dadosAnalise.map(d => d.id);
    const documentosAnalise = documentos.filter((doc: DocumentoDemanda) =>
      idsDemandasFiltradas.includes(doc.demandaId)
    );

    const totalDemandas = dadosAnalise.length;
    const totalDocumentos = documentosAnalise.length;

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
        subtitulo: (() => {
          const partes = [];
          if (filtrosEstatisticas.analista.length > 0) {
            if (filtrosEstatisticas.analista.length === 1) {
              partes.push(`Analista: ${filtrosEstatisticas.analista[0]}`);
            } else {
              partes.push(
                `Analistas: ${filtrosEstatisticas.analista.length} selecionados`
              );
            }
          }
          if (filtrosEstatisticas.anos.length > 0) {
            partes.push(`Ano(s): ${filtrosEstatisticas.anos.join(', ')}`);
          }
          return partes.length > 0 ? partes.join(' | ') : 'Todas as demandas';
        })(),
        icon: <IoFolder size={24} />,
        cor: 'azul',
      },
    ];
  }, [demandas, documentos, filtrosEstatisticas]);

  // Mídias defeituosas filtradas por ano
  const midiasDefeituosas = useMemo(() => {
    const selectedYears = getSelectedYears();
    return documentos
      .filter(doc => {
        const demanda = demandas.find(d => d.id === doc.demandaId);
        if (!demanda?.dataInicial) return false;
        const docYear = demanda.dataInicial.split('/')[2];
        return (
          selectedYears.includes(docYear) &&
          doc.tipoDocumento === 'Mídia' &&
          doc.apresentouDefeito
        );
      })
      .map(doc => {
        const demanda = demandas.find(d => d.id === doc.demandaId);
        return {
          numeroDocumento: doc.numeroDocumento,
          tipoMidia: doc.tipoMidia || 'Não especificado',
          tamanhoMidia: doc.tamanhoMidia || 'Não informado',
          sged: demanda?.sged || '',
          assunto: demanda?.descricao || '',
        };
      });
  }, [documentos, demandas, getSelectedYears]);

  // Configuração das colunas da tabela de demandas
  const colunasDemandas: TableColumn<Demanda>[] = [
    {
      key: 'sged',
      label: 'SGED',
      width: '28.6%',
      align: 'center',
      render: (value, demanda) => (
        <span
          className={`${styles.tableNumber} ${styles.tableClickable}`}
          onClick={e => handleSgedClick(e, demanda)}
          style={{ color: '#007bff' }}
          title="Clique para ver detalhes da demanda"
        >
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '28.6%',
      align: 'center',
      render: value => (
        <StatusBadge
          status={
            value as
              | 'Em Andamento'
              | 'Finalizada'
              | 'Fila de Espera'
              | 'Aguardando'
          }
        />
      ),
    },
  ];

  // Função para obter abreviação do tipo de documento
  const getTipoDocumentoAbrev = useCallback((tipo: string): string => {
    const abreviacoes: { [key: string]: string } = {
      Ofício: 'OF',
      'Ofício Circular': 'OFC',
      'Autos Circunstanciados': 'AC',
      'Relatório Técnico': 'RT',
      'Relatório de Inteligência': 'RELINT',
      Mídia: 'MD',
    };
    return abreviacoes[tipo] || tipo.substring(0, 3).toUpperCase();
  }, []);

  // Função para renderizar o status do documento usando as cores corretas
  const renderDocumentStatus = useCallback((documento: DocumentoDemanda) => {
    const status = getDocumentStatus(documento);

    // Se não tem status, retorna vazio (sem indicador)
    if (status === 'Sem Status') {
      return null;
    }

    const backgroundColor = getStatusColor(status);

    return (
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor,
          borderRadius: '50%',
          margin: '0 auto',
        }}
        title={status}
      />
    );
  }, []);

  // Configuração das colunas da tabela de documentos
  const colunasDocumentos: TableColumn<DocumentoDemanda>[] = [
    {
      key: 'numeroDocumento',
      label: 'Número',
      width: '31.25%',
      align: 'center',
      render: (value, documento) => (
        <span
          className={`${styles.tableNumber} ${styles.tableClickable}`}
          onClick={e => handleDocumentNumberClick(e, documento)}
          style={{ color: '#007bff' }}
          title="Clique para ver detalhes do documento"
        >
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'tipoDocumento',
      label: 'Tipo',
      width: '12.5%',
      align: 'center',
      render: value => (
        <span
          className={`${styles.tableText} ${styles.tipoAbrev}`}
          title={String(value || '')}
        >
          {getTipoDocumentoAbrev(String(value || ''))}
        </span>
      ),
    },
    {
      key: 'destinatario',
      label: 'Destinatário',
      width: '31.25%',
      render: value => (
        <span
          className={`${styles.tableText} ${styles.destinatarioTruncate}`}
          title={String(value || '')}
        >
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'respondido' as keyof DocumentoDemanda,
      label: 'Status',
      width: '12.5%',
      align: 'center',
      render: (_, documento) => renderDocumentStatus(documento),
      customSort: (a, b, direction) => {
        // Ordenação especial para status com prioridade lógica
        const statusOrder = {
          'Não Enviado': 1,
          'Em Produção': 2,
          Pendente: 3,
          Encaminhado: 4,
          Respondido: 5,
          Finalizado: 6,
          'Sem Status': 7,
        };

        const aStatus = getDocumentStatus(a);
        const bStatus = getDocumentStatus(b);
        const aValue = statusOrder[aStatus as keyof typeof statusOrder] || 999;
        const bValue = statusOrder[bStatus as keyof typeof statusOrder] || 999;

        const comparison = aValue - bValue;
        return direction === 'desc' ? -comparison : comparison;
      },
    },
  ];

  // Handlers para modais
  const handleOpenDemandModal = useCallback((demanda: Demanda) => {
    setSelectedDemand(demanda);
    setIsDemandModalOpen(true);
  }, []);

  const handleOpenDocumentModal = useCallback((documento: DocumentoDemanda) => {
    setSelectedDocument(documento);
    setIsDocumentModalOpen(true);
  }, []);

  const handleCloseDemandModal = useCallback(() => {
    setIsDemandModalOpen(false);
    setSelectedDemand(null);
  }, []);

  const handleCloseDocumentModal = useCallback(() => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
  }, []);

  const handleSaveDemand = useCallback(
    (updatedData: Partial<Demanda>) => {
      if (selectedDemand) {
        updateDemanda(selectedDemand.id, updatedData);
        handleCloseDemandModal();
      }
    },
    [selectedDemand, updateDemanda, handleCloseDemandModal]
  );

  const handleSaveDocument = useCallback(
    (updatedData: Partial<DocumentoDemanda>) => {
      if (selectedDocument) {
        updateDocumento(selectedDocument.id, updatedData);
        handleCloseDocumentModal();
      }
    },
    [selectedDocument, updateDocumento, handleCloseDocumentModal]
  );

  const handleModalError = useCallback((error: string) => {
    setToastMessage(error);
    setToastType('error');
    setIsToastVisible(true);
  }, []);

  const handleCreateDocument = useCallback(
    (demanda: Demanda) => {
      // Navegar para a página de criar documento com o SGED pré-preenchido
      navigate(`/documentos/novo?sged=${demanda.sged}`);
    },
    [navigate]
  );

  // Handler para clique no SGED da demanda
  const handleSgedClick = useCallback(
    (e: React.MouseEvent, demanda: Demanda) => {
      e.stopPropagation(); // Evita que o evento de linha seja acionado
      navigate(`/demandas/${demanda.id}`);
    },
    [navigate]
  );

  // Handler para clique no número do documento
  const handleDocumentNumberClick = useCallback(
    (e: React.MouseEvent, documento: DocumentoDemanda) => {
      e.stopPropagation(); // Evita que o evento de linha seja acionado
      navigate(`/documentos/${documento.id}`);
    },
    [navigate]
  );

  // Effect para fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        dropdownAnosEstatisticasRef.current &&
        !dropdownAnosEstatisticasRef.current.contains(event.target as Node)
      ) {
        setDropdownAnosEstatisticasOpen(false);
      }
      if (
        dropdownAnalistaEstatisticasRef.current &&
        !dropdownAnalistaEstatisticasRef.current.contains(event.target as Node)
      ) {
        setDropdownAnalistaEstatisticasOpen(false);
      }
      if (
        dropdownAnosDocumentosRef.current &&
        !dropdownAnosDocumentosRef.current.contains(event.target as Node)
      ) {
        setDropdownAnosDocumentosOpen(false);
      }
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowDefectiveMedias(false);
      }
    };

    if (
      dropdownOpen ||
      dropdownAnosEstatisticasOpen ||
      dropdownAnalistaEstatisticasOpen ||
      dropdownAnosDocumentosOpen ||
      showDefectiveMedias
    ) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    dropdownOpen,
    dropdownAnosEstatisticasOpen,
    dropdownAnalistaEstatisticasOpen,
    dropdownAnosDocumentosOpen,
    showDefectiveMedias,
  ]);

  return (
    <div className={styles.homePage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <IoStatsChart size={32} className={styles.headerIcon} />
            <div>
              <h1>Dashboard Executivo</h1>
              <p>Visão geral das demandas e documentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Gestão Rápida */}
      <section className={styles.tablesSection}>
        {/* Filtros */}
        <div className={styles.filtersBar}>
          <div
            className={styles.sectionHeader}
            onClick={() => setIsGestaoRapidaOpen(!isGestaoRapidaOpen)}
          >
            <div className={styles.headerContent}>
              <h2>Gestão Rápida</h2>
              {!isGestaoRapidaOpen && (
                <div className={styles.counters}>
                  <span className={styles.counter}>
                    {contadores.documentos} documentos
                  </span>
                  <span className={styles.counterSeparator}>•</span>
                  <span className={styles.counter}>
                    {contadores.demandas} demandas
                  </span>
                </div>
              )}
            </div>
            <span className={styles.toggleArrow}>
              {isGestaoRapidaOpen ? '▲' : '▼'}
            </span>
          </div>
          {isGestaoRapidaOpen && (
            <div className={styles.filters}>
              <div
                className={`${styles.filterGroup} ${styles.filterGroupLarge}`}
              >
                <label>Número de Referência</label>
                <input
                  type="text"
                  value={filtros.referencia}
                  onChange={e =>
                    setFiltros(prev => ({
                      ...prev,
                      referencia: e.target.value,
                    }))
                  }
                  placeholder="SGED, Autos, PIC..."
                  className={styles.filterInput}
                />
              </div>
              <div
                className={`${styles.filterGroup} ${styles.filterGroupLarge}`}
              >
                <label>Documentos</label>
                <input
                  type="text"
                  value={filtros.documentos}
                  onChange={e =>
                    setFiltros(prev => ({
                      ...prev,
                      documentos: e.target.value,
                    }))
                  }
                  placeholder="Código rastreio, Identificador, Número no Atena..."
                  className={styles.filterInput}
                />
              </div>
              <div
                className={`${styles.filterGroup} ${styles.filterGroupSmall}`}
              >
                <label>Analista</label>
                <div className={styles.multiSelectContainer} ref={dropdownRef}>
                  <div
                    className={styles.multiSelectTrigger}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    tabIndex={0}
                  >
                    <span>{getAnalistaDisplayText()}</span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen && (
                    <div className={styles.multiSelectDropdown}>
                      {mockAnalistas.map(analista => (
                        <label
                          key={analista.id}
                          className={styles.checkboxLabel}
                        >
                          <input
                            type="checkbox"
                            checked={filtros.analista.includes(analista.nome)}
                            onChange={() => handleAnalistaChange(analista.nome)}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxText}>
                            {analista.nome}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabelas */}
        {isGestaoRapidaOpen && (
          <div className={styles.tablesGrid}>
            {/* Tabela de Documentos */}
            <div
              className={`${styles.tableContainer} ${styles.tableContainerLarge}`}
            >
              <div className={styles.tableHeader}>
                <div className={styles.tableTitle}>
                  <IoDocument size={20} />
                  <h3>Documentos ({documentosFiltrados.length})</h3>
                </div>
                <button
                  className={styles.viewAllButton}
                  onClick={() => navigate('/documentos')}
                >
                  <IoEye size={16} />
                </button>
              </div>
              <div className={styles.tableWrapper}>
                <div className={styles.customTableContainer}>
                  <Table
                    data={documentosFiltrados}
                    columns={colunasDocumentos}
                    onEdit={handleOpenDocumentModal}
                    emptyMessage="Nenhum documento encontrado com os filtros aplicados"
                  />
                </div>
              </div>
            </div>

            {/* Tabela de Demandas */}
            <div
              className={`${styles.tableContainer} ${styles.tableContainerSmall}`}
            >
              <div className={styles.tableHeader}>
                <div className={styles.tableTitle}>
                  <IoFolder size={20} />
                  <h3>Demandas ({demandasFiltradas.length})</h3>
                </div>
                <button
                  className={styles.viewAllButton}
                  onClick={() => navigate('/demandas')}
                >
                  <IoEye size={16} />
                </button>
              </div>
              <div className={styles.tableWrapper}>
                <div className={styles.customTableContainer}>
                  <Table
                    data={demandasFiltradas}
                    columns={colunasDemandas}
                    onEdit={handleOpenDemandModal}
                    onCreateDocument={handleCreateDocument}
                    emptyMessage="Nenhuma demanda encontrada com os filtros aplicados"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Seção de Estatísticas */}
      <section className={styles.statsSection}>
        <div className={styles.filtersBar}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerContent}>
              <h2>Estatísticas</h2>
            </div>
          </div>
          <div className={styles.filters}>
            {/* Filtro de Anos */}
            <div className={`${styles.filterGroup} ${styles.filterGroupSmall}`}>
              <label>Ano:</label>
              <div
                className={styles.multiSelectContainer}
                ref={dropdownAnosEstatisticasRef}
              >
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() =>
                    setDropdownAnosEstatisticasOpen(
                      !dropdownAnosEstatisticasOpen
                    )
                  }
                  tabIndex={0}
                >
                  <span>{getAnosDisplayText()}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownAnosEstatisticasOpen ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownAnosEstatisticasOpen && (
                  <div className={styles.multiSelectDropdown}>
                    {opcoesAnos.map(opcao => (
                      <label key={opcao.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filtrosEstatisticas.anos.includes(opcao.id)}
                          onChange={() => handleAnoEstatisticasChange(opcao.id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          {opcao.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro de Analista */}
            <div className={`${styles.filterGroup} ${styles.filterGroupSmall}`}>
              <label>Analista:</label>
              <div
                className={styles.multiSelectContainer}
                ref={dropdownAnalistaEstatisticasRef}
              >
                <div
                  className={styles.multiSelectTrigger}
                  onClick={() =>
                    setDropdownAnalistaEstatisticasOpen(
                      !dropdownAnalistaEstatisticasOpen
                    )
                  }
                  tabIndex={0}
                >
                  <span>{getAnalistaEstatisticasDisplayText()}</span>
                  <span className={styles.dropdownArrow}>
                    {dropdownAnalistaEstatisticasOpen ? '▲' : '▼'}
                  </span>
                </div>
                {dropdownAnalistaEstatisticasOpen && (
                  <div className={styles.multiSelectDropdown}>
                    {mockAnalistas.map(analista => (
                      <label key={analista.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filtrosEstatisticas.analista.includes(
                            analista.nome
                          )}
                          onChange={() =>
                            handleAnalistaEstatisticasChange(analista.nome)
                          }
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          {analista.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {estatisticas.map(stat => {
            const isExpandable =
              stat.id === 'total-demandas' || stat.id === 'total-documentos';
            const isExpanded = expandedCards.has(stat.id);
            const dadosAnalise =
              filtrosEstatisticas.anos.length > 0
                ? demandas.filter((d: Demanda) => {
                    if (!d.dataInicial) return false;
                    const ano = d.dataInicial.split('/')[2];
                    return filtrosEstatisticas.anos.includes(ano);
                  })
                : demandas;
            const documentosAnalise =
              filtrosEstatisticas.analista.length > 0
                ? documentos.filter((doc: DocumentoDemanda) => {
                    const demanda = dadosAnalise.find(
                      d => d.id === doc.demandaId
                    );
                    return (
                      demanda &&
                      filtrosEstatisticas.analista.includes(demanda.analista)
                    );
                  })
                : documentos.filter((doc: DocumentoDemanda) => {
                    return dadosAnalise.some(d => d.id === doc.demandaId);
                  });

            return (
              <div key={stat.id} className={styles.statCardContainer}>
                <div
                  className={`${styles.statCard} ${styles[stat.cor]} ${isExpandable ? styles.expandable : ''} ${isExpanded ? styles.expanded : ''}`}
                  onClick={
                    isExpandable
                      ? () => toggleCardExpansion(stat.id)
                      : undefined
                  }
                >
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{stat.valor}</div>
                    <div className={styles.statTitle}>{stat.titulo}</div>
                    {stat.subtitulo && (
                      <div className={styles.statSubtitle}>
                        {stat.subtitulo}
                      </div>
                    )}
                    {stat.tendencia && (
                      <div
                        className={`${styles.statTrend} ${styles[stat.tendencia.direcao]}`}
                      >
                        <IoTrendingUp size={14} />
                        <span>+{stat.tendencia.valor}%</span>
                      </div>
                    )}
                  </div>
                  {isExpandable && (
                    <div className={styles.expandIcon}>
                      {isExpanded ? (
                        <IoChevronUp size={20} />
                      ) : (
                        <IoChevronDown size={20} />
                      )}
                    </div>
                  )}
                </div>

                {isExpandable && isExpanded && (
                  <div
                    className={`${styles.subCardsContainer} ${isExpanded ? styles.expanded : ''}`}
                  >
                    <div className={styles.subCardsGrid}>
                      {getSubCards(
                        stat.id,
                        dadosAnalise,
                        documentosAnalise
                      ).map(subCard => (
                        <div
                          key={subCard.id}
                          className={`${styles.subCard} ${styles[subCard.cor]}`}
                        >
                          <div className={styles.subCardIcon}>
                            {subCard.icon}
                          </div>
                          <div className={styles.subCardContent}>
                            <div className={styles.subCardValue}>
                              {subCard.valor}
                            </div>
                            <div className={styles.subCardTitle}>
                              {subCard.titulo}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Análise de Demandas */}
        <div className={styles.demandsAnalysisSection}>
          {/* Header da Seção */}
          <div className={styles.demandsHeaderContainer}>
            <div className="sectionHeader">
              <h2>📈 Análise de Demandas</h2>
              <p style={{ marginBottom: '1rem' }}>
                Visão geral do status e evolução das demandas ao longo do tempo
              </p>
            </div>
          </div>

          {/* Grid de Gráficos de Demandas - Primeira linha */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* Gráfico de Demandas por Ano (movido da segunda linha) */}
            <div
              style={{
                flex: '0.65',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Demandas por Ano
                    </h3>
                  </div>
                </div>
                <div>
                  <DemandsYearlyChart
                    selectedYears={filtrosEstatisticas.anos}
                  />
                </div>
              </div>
            </div>

            {/* Gráfico de Demandas Abertas em 2025 */}
            <div
              style={{
                flex: '0.35',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Passivos anteriores
                    </h3>
                  </div>
                </div>
                <div>
                  <OpenDemandsChart />
                </div>
              </div>
            </div>
          </div>

          {/* Segunda linha - Gráficos de Tipos de Demandas e Demandas por Ano */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {/* Card Tipos de Demandas */}
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          width: '4px',
                          height: '24px',
                          background:
                            'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          borderRadius: '2px',
                          marginRight: '1rem',
                        }}
                      />
                      <h3
                        style={{
                          margin: '0',
                          color: '#1e293b',
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          letterSpacing: '-0.025em',
                        }}
                      >
                        Tipos de Demandas
                      </h3>
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                  >
                    <DemandTypesChart
                      selectedYears={filtrosEstatisticas.anos}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Status por Ano (movido da primeira linha) */}
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          width: '4px',
                          height: '24px',
                          background:
                            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '2px',
                          marginRight: '1rem',
                        }}
                      />
                      <h3
                        style={{
                          margin: '0',
                          color: '#1e293b',
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          letterSpacing: '-0.025em',
                        }}
                      >
                        Status por Ano
                      </h3>
                    </div>
                  </div>
                  <div>
                    <StatusByYearChart />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terceira linha - Órgãos Solicitantes */}
          <div
            style={{
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Órgãos Solicitantes
                    </h3>
                  </div>
                </div>
                <div>
                  <SolicitantesOrgansChart
                    selectedYears={filtrosEstatisticas.anos}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Análise de Documentos */}
        <div className={styles.documentsAnalysisSection}>
          {/* Header da Seção */}
          <div className={styles.documentsHeaderContainer}>
            <div className="sectionHeader">
              <h2>📄 Análise de Documentos</h2>
              <p style={{ marginBottom: '1rem' }}>
                Estatísticas e métricas sobre produção e tipos de documentos
              </p>
            </div>
          </div>

          {/* Filtros da Seção Documentos */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ width: '20%' }}>
              <div
                className={`${styles.filterGroup} ${styles.filterGroupSmall}`}
              >
                <label>Ano:</label>
                <div
                  className={styles.multiSelectContainer}
                  ref={dropdownAnosDocumentosRef}
                >
                  <div
                    className={styles.multiSelectTrigger}
                    onClick={() =>
                      setDropdownAnosDocumentosOpen(!dropdownAnosDocumentosOpen)
                    }
                    tabIndex={0}
                  >
                    <span>{getAnosDocumentosDisplayText()}</span>
                    <span className={styles.dropdownArrow}>
                      {dropdownAnosDocumentosOpen ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownAnosDocumentosOpen && (
                    <div className={styles.multiSelectDropdown}>
                      {opcoesAnos.map(opcao => (
                        <label key={opcao.id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={filtrosDocumentos.anos.includes(opcao.id)}
                            onChange={() => handleAnoDocumentosChange(opcao.id)}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxText}>
                            {opcao.nome}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primeira linha de Análise de Documentos */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* Tipos de Documentos */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                flex: '0.65',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Tipos de Documentos
                    </h3>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1.5rem',
                    flex: 1,
                  }}
                >
                  {/* Linha 1 */}
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background:
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {
                        documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          const selectedYears = getSelectedYears();
                          return (
                            selectedYears.includes(docYear) &&
                            doc.tipoDocumento === 'Ofício'
                          );
                        }).length
                      }
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Ofícios
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background:
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {
                        documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          const selectedYears = getSelectedYears();
                          return (
                            selectedYears.includes(docYear) &&
                            doc.tipoDocumento === 'Ofício Circular'
                          );
                        }).length
                      }
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Of. Circular
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background:
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {
                        documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          const selectedYears = getSelectedYears();
                          return (
                            selectedYears.includes(docYear) &&
                            doc.tipoDocumento === 'Mídia'
                          );
                        }).length
                      }
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Mídias
                    </div>
                  </div>
                  {/* Linha 2 */}
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background:
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {
                        documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          const selectedYears = getSelectedYears();
                          return (
                            selectedYears.includes(docYear) &&
                            doc.tipoDocumento === 'Relatório Técnico'
                          );
                        }).length
                      }
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Rel. Técnico
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background:
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {
                        documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          const selectedYears = getSelectedYears();
                          return (
                            selectedYears.includes(docYear) &&
                            doc.tipoDocumento === 'Relatório de Inteligência'
                          );
                        }).length
                      }
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Rel. Intel.
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background:
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {
                        documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          const selectedYears = getSelectedYears();
                          return (
                            selectedYears.includes(docYear) &&
                            doc.tipoDocumento === 'Autos Circunstanciados'
                          );
                        }).length
                      }
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Autos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identificadores e Alvos */}
            <div
              style={{
                flex: '0.35',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Identificadores e Alvos
                    </h3>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {(() => {
                        // Filtrar demandas válidas:
                        // - Sem dataFinal (abertas) OU dataFinal no período selecionado
                        const selectedYears = getSelectedYears();
                        const validDemands = demandas.filter(demanda => {
                          if (!demanda.dataFinal) return true; // Demandas abertas

                          const finalYear = demanda.dataFinal.split('/')[2];
                          return selectedYears.includes(finalYear); // Finalizadas no período selecionado
                        });

                        // Somar campo alvos
                        return validDemands.reduce(
                          (sum, demanda) =>
                            sum +
                            (typeof demanda.alvos === 'number'
                              ? demanda.alvos
                              : parseInt(demanda.alvos || '0', 10)),
                          0
                        );
                      })()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Total de Alvos
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {(() => {
                        // Filtrar documentos do período selecionado
                        const selectedYears = getSelectedYears();
                        const filteredDocs = documentos.filter(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          return selectedYears.includes(docYear);
                        });

                        // Coletar todos os identificadores únicos
                        const uniqueIdentifiers = new Set();
                        filteredDocs.forEach(doc => {
                          doc.pesquisas.forEach(pesquisa => {
                            uniqueIdentifiers.add(pesquisa.identificador);
                          });
                        });

                        return uniqueIdentifiers.size;
                      })()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Identificadores Únicos
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda linha de análise de documentos */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {/* Decisões Judiciais */}
            <div
              style={{
                flex: '0.5',
                height: '450px',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Decisões Judiciais
                    </h3>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    width: '100%',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {(() => {
                        const selectedYears = getSelectedYears();

                        // Filtrar documentos relevantes
                        const relevantDocs = documentos.filter(doc => {
                          // Deve ser do período selecionado
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          if (!selectedYears.includes(docYear)) return false;

                          // Deve ser Ofício ou Ofício Circular de Encaminhamento de decisão judicial
                          const isValidType =
                            doc.tipoDocumento === 'Ofício' ||
                            doc.tipoDocumento === 'Ofício Circular';
                          const isDecisaoJudicial =
                            doc.assunto ===
                            'Encaminhamento de decisão judicial';

                          // Deve ter os campos necessários para formar a chave única
                          return (
                            isValidType &&
                            isDecisaoJudicial &&
                            doc.autoridade &&
                            doc.orgaoJudicial &&
                            doc.dataAssinatura
                          );
                        });

                        // Criar Set de decisões únicas
                        const uniqueDecisions = new Set();
                        relevantDocs.forEach(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          const key = `${demanda?.sged || ''}-${doc.autoridade}-${doc.orgaoJudicial}-${doc.dataAssinatura}`;
                          uniqueDecisions.add(key);
                        });

                        return uniqueDecisions.size;
                      })()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Decisões Únicas
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '400',
                        color: '#1e293b',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {(() => {
                        const selectedYears = getSelectedYears();

                        // Filtrar documentos relevantes
                        const relevantDocs = documentos.filter(doc => {
                          // Deve ser do período selecionado
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          if (!demanda?.dataInicial) return false;
                          const docYear = demanda.dataInicial.split('/')[2];
                          if (!selectedYears.includes(docYear)) return false;

                          // Deve ser Ofício ou Ofício Circular de Encaminhamento de decisão judicial
                          const isValidType =
                            doc.tipoDocumento === 'Ofício' ||
                            doc.tipoDocumento === 'Ofício Circular';
                          const isDecisaoJudicial =
                            doc.assunto ===
                            'Encaminhamento de decisão judicial';

                          // Deve ter os campos necessários e retificações
                          return (
                            isValidType &&
                            isDecisaoJudicial &&
                            doc.autoridade &&
                            doc.orgaoJudicial &&
                            doc.dataAssinatura
                          );
                        });

                        // Criar Map de decisões únicas e suas retificações
                        const uniqueDecisions = new Map();
                        relevantDocs.forEach(doc => {
                          const demanda = demandas.find(
                            d => d.id === doc.demandaId
                          );
                          const key = `${demanda?.sged || ''}-${doc.autoridade}-${doc.orgaoJudicial}-${doc.dataAssinatura}`;

                          if (!uniqueDecisions.has(key)) {
                            uniqueDecisions.set(key, doc.retificacoes || []);
                          }
                        });

                        // Somar todas as retificações
                        let totalRetificacoes = 0;
                        uniqueDecisions.forEach(retificacoes => {
                          totalRetificacoes += retificacoes.length;
                        });

                        return totalRetificacoes;
                      })()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Decisões Retificadas
                    </div>
                  </div>
                </div>

                {/* Treemap Chart Section */}
                <div
                  style={{
                    flex: 1,
                    background: 'transparent',
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <JudicialOrgansTreemap selectedYears={getSelectedYears()} />
                </div>
              </div>
            </div>

            {/* Mídias */}
            <div
              style={{
                flex: '0.5',
                height: '450px',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '24px',
                        background:
                          'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '2px',
                        marginRight: '1rem',
                      }}
                    />
                    <h3
                      style={{
                        margin: '0',
                        color: '#1e293b',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Mídias
                    </h3>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    flex: 1,
                  }}
                >
                  {/* Estatísticas em grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      width: '100%',
                    }}
                  >
                    {/* Volume Total */}
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: '400',
                          color: '#1e293b',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {(() => {
                          const selectedYears = getSelectedYears();
                          const filteredDocs = documentos.filter(doc => {
                            const demanda = demandas.find(
                              d => d.id === doc.demandaId
                            );
                            if (!demanda?.dataInicial) return false;
                            const docYear = demanda.dataInicial.split('/')[2];
                            return (
                              selectedYears.includes(docYear) &&
                              doc.tipoDocumento === 'Mídia' &&
                              doc.tamanhoMidia
                            );
                          });

                          let totalMB = 0;
                          filteredDocs.forEach(doc => {
                            const size = doc.tamanhoMidia;
                            if (size && size.length > 0) {
                              if (size.includes('GB')) {
                                totalMB += parseFloat(size) * 1024;
                              } else if (size.includes('TB')) {
                                totalMB += parseFloat(size) * 1024 * 1024;
                              } else if (size.includes('MB')) {
                                totalMB += parseFloat(size);
                              }
                            }
                          });

                          if (totalMB >= 1024 * 1024) {
                            return `${(totalMB / (1024 * 1024)).toFixed(1)} TB`;
                          } else if (totalMB >= 1024) {
                            return `${(totalMB / 1024).toFixed(1)} GB`;
                          } else {
                            return `${totalMB.toFixed(0)} MB`;
                          }
                        })()}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Volume Total
                      </div>
                    </div>

                    {/* Mídias com Defeitos */}
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: '400',
                          color: '#1e293b',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {midiasDefeituosas.length}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Mídias c/ Defeitos
                      </div>
                    </div>
                  </div>

                  {/* Gráfico */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      flex: 1,
                      paddingTop: '0.5rem',
                      height: '400px',
                    }}
                  >
                    <div style={{ width: '100%', height: '100%' }}>
                      <MediaTypesChart selectedYears={getSelectedYears()} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Análise de Performance dos Provedores */}
        <div className={styles.providerAnalysisSection}>
          {/* Filtros Centralizados */}
          <div className={styles.providerFiltersContainer}>
            <div className="sectionHeader">
              <h2>📊 Análise de Performance dos Provedores</h2>
              <p style={{ marginBottom: '2rem' }}>
                Use os filtros abaixo para analisar diferentes tipos de
                solicitações
              </p>
            </div>
            <ProviderFilters
              filters={providerFilters.filters}
              onToggleFilter={providerFilters.toggleFilter}
              providerLimit={providerFilters.providerLimit}
              onLimitChange={providerFilters.setProviderLimit}
            />
          </div>

          {/* Barra de Estatísticas Unificada */}
          <ProviderStatsSummary filters={providerFilters} />

          {/* Grade 2/3 - 1/3 */}
          <div className={styles.chartsGrid}>
            {/* Tempo Médio - 2/3 da largura */}
            <div
              className={`${styles.chartContainer} ${styles.chartContainerLarge}`}
            >
              <AverageResponseTimeChart filters={providerFilters} />
            </div>

            {/* Taxa de Resposta - 1/3 da largura */}
            <div className={styles.chartContainer}>
              <ResponseRateChart filters={providerFilters} />
            </div>

            {/* Boxplot - 2/3 da largura */}
            <div
              className={`${styles.chartContainer} ${styles.chartContainerLarge}`}
            >
              <ResponseTimeBoxplot filters={providerFilters} />
            </div>

            {/* Ranking - 1/3 da largura */}
            <div className={styles.chartContainer}>
              <ProviderRanking filters={providerFilters} />
            </div>
          </div>
        </div>
      </section>

      {/* Modais */}
      {selectedDemand && (
        <DemandUpdateModal
          demanda={selectedDemand}
          isOpen={isDemandModalOpen}
          onClose={handleCloseDemandModal}
          onSave={handleSaveDemand}
          onError={handleModalError}
        />
      )}

      {selectedDocument && (
        <DocumentUpdateModal
          documento={selectedDocument}
          documentosDemanda={getDocumentosByDemandaId(
            selectedDocument.demandaId
          )}
          isOpen={isDocumentModalOpen}
          onClose={handleCloseDocumentModal}
          onSave={handleSaveDocument}
          onError={handleModalError}
          getDocumento={id => documentos.find(d => d.id === id)}
        />
      )}

      {/* Toast para notificações */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </div>
  );
}
