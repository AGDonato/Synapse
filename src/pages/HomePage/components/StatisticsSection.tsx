import React, { memo, useCallback, useEffect, useMemo, Suspense } from 'react';
import { useDemandasData } from '../../../hooks/queries/useDemandas';
import { useDocumentosData } from '../../../hooks/queries/useDocumentos';
import { useProviderFilters } from '../../../hooks/useProviderFilters';
import { mockAnalistas } from '../../../data/mockAnalistas';
import { SectionHeader } from './SectionHeader';
import { StatCard } from './StatCard';
import { FilterDropdown } from './FilterDropdown';
import { LazyDemandsAnalysis } from './LazyDemandsAnalysis';
import { LazyDocumentsAnalysis } from './LazyDocumentsAnalysis';
import { LazyProvidersAnalysis } from './LazyProvidersAnalysis';
import { useHomePageFilters } from '../hooks/useHomePageFilters';
import { useStatistics } from '../hooks/useStatistics';
import { ErrorBoundary, Skeleton } from '../../../components/ui';
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import styles from '../styles/StatisticsSection.module.css';

export const StatisticsSection: React.FC = memo(() => {
  const { data: demandas = [] } = useDemandasData();
  const { data: documentos = [] } = useDocumentosData();
  const providerFilters = useProviderFilters();

  const {
    filtrosEstatisticas,
    dropdownAnosEstatisticasOpen,
    setDropdownAnosEstatisticasOpen,
    dropdownAnalistaEstatisticasOpen,
    setDropdownAnalistaEstatisticasOpen,
    handleAnoEstatisticasChange,
    getAnosDisplayText,
    handleAnalistaEstatisticasChange,
    getAnalistaEstatisticasDisplayText,
    setFiltrosEstatisticas,
  } = useHomePageFilters();

  const { estatisticas, getSubCards } = useStatistics(filtrosEstatisticas);

  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());

  // Função para obter anos únicos das demandas
  const anosDisponiveis = useMemo(() => {
    const anosSet = new Set<string>();
    demandas.forEach(demanda => {
      if (demanda.dataInicial) {
        const ano = demanda.dataInicial.split('/')[2];
        anosSet.add(ano);
      }
    });
    return Array.from(anosSet).sort().reverse();
  }, [demandas]);

  // Inicializar filtros automaticamente com todos os anos disponíveis
  useEffect(() => {
    if (anosDisponiveis.length > 0 && filtrosEstatisticas.anos.length === 0) {
      setFiltrosEstatisticas(prev => ({
        ...prev,
        anos: anosDisponiveis,
      }));
    }
  }, [anosDisponiveis, filtrosEstatisticas.anos.length, setFiltrosEstatisticas]);

  // Opções para os dropdowns
  const opcoesAnos = useMemo(
    () => anosDisponiveis.map(ano => ({ id: ano, nome: ano })),
    [anosDisponiveis]
  );

  const opcoesAnalistas = useMemo(
    () => mockAnalistas.map(analista => ({ id: analista.id.toString(), nome: analista.nome })),
    []
  );

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

  // Dados filtrados otimizados para análise
  const dadosAnalise = useMemo(() => {
    // Usar Sets para melhor performance em lookups
    const anosSet = new Set(filtrosEstatisticas.anos);
    const analistasSet = new Set(filtrosEstatisticas.analista);

    const demandasFiltradas = demandas.filter((d: Demanda) => {
      // Filtro por anos
      if (anosSet.size > 0) {
        if (!d.dataInicial) {
          return false;
        }
        const ano = d.dataInicial.split('/')[2];
        if (!anosSet.has(ano)) {
          return false;
        }
      }

      // Filtro por analista
      if (analistasSet.size > 0) {
        if (!analistasSet.has(d.analista)) {
          return false;
        }
      }

      return true;
    });

    return demandasFiltradas;
  }, [demandas, filtrosEstatisticas.anos, filtrosEstatisticas.analista]);

  const documentosAnalise = useMemo(() => {
    if (dadosAnalise.length === 0) {
      return [];
    }

    // Usar Set para lookup eficiente de IDs
    const idsDemandasSet = new Set(dadosAnalise.map(d => d.id));
    return documentos.filter((doc: DocumentoDemanda) => idsDemandasSet.has(doc.demandaId));
  }, [documentos, dadosAnalise]);

  // Memoize anos selecionados para os gráficos
  const selectedYearsForCharts = useMemo(() => {
    return filtrosEstatisticas.anos.length > 0 ? filtrosEstatisticas.anos : anosDisponiveis;
  }, [filtrosEstatisticas.anos, anosDisponiveis]);

  return (
    <section className={styles.statsSection}>
      <SectionHeader title='Estatísticas' />

      {/* Filtros */}
      <div className={styles.filters}>
        <FilterDropdown
          label='Ano:'
          options={opcoesAnos}
          selectedValues={filtrosEstatisticas.anos}
          onSelectionChange={handleAnoEstatisticasChange}
          isOpen={dropdownAnosEstatisticasOpen}
          onToggle={() => setDropdownAnosEstatisticasOpen(!dropdownAnosEstatisticasOpen)}
          getDisplayText={() => getAnosDisplayText(anosDisponiveis)}
        />

        <FilterDropdown
          label='Analista:'
          options={opcoesAnalistas}
          selectedValues={filtrosEstatisticas.analista}
          onSelectionChange={handleAnalistaEstatisticasChange}
          isOpen={dropdownAnalistaEstatisticasOpen}
          onToggle={() => setDropdownAnalistaEstatisticasOpen(!dropdownAnalistaEstatisticasOpen)}
          getDisplayText={getAnalistaEstatisticasDisplayText}
        />
      </div>

      {/* Grid de Cards */}
      <div className={styles.statsGrid}>
        {estatisticas.map(stat => {
          const isExpandable = stat.id === 'total-demandas' || stat.id === 'total-documentos';
          const isExpanded = expandedCards.has(stat.id);
          const subCards = isExpandable
            ? getSubCards(stat.id, dadosAnalise, documentosAnalise)
            : [];

          return (
            <StatCard
              key={stat.id}
              estatistica={stat}
              isExpandable={isExpandable}
              isExpanded={isExpanded}
              onToggleExpansion={isExpandable ? () => toggleCardExpansion(stat.id) : undefined}
              subCards={subCards}
            />
          );
        })}
      </div>

      {/* Análise de Demandas */}
      <ErrorBoundary
        title='Erro na Análise de Demandas'
        message='Não foi possível carregar os gráficos de análise de demandas.'
      >
        <Suspense
          fallback={
            <div className={styles.analysisSection}>
              <div className={styles.sectionHeaderContainer}>
                <Skeleton height='80px' />
              </div>
              <div className={styles.chartsGrid}>
                <Skeleton height='400px' />
                <Skeleton height='400px' />
              </div>
            </div>
          }
        >
          <LazyDemandsAnalysis selectedYears={selectedYearsForCharts} />
        </Suspense>
      </ErrorBoundary>

      {/* Análise de Documentos */}
      <ErrorBoundary
        title='Erro na Análise de Documentos'
        message='Não foi possível carregar os gráficos de análise de documentos.'
      >
        <Suspense
          fallback={
            <div className={styles.analysisSection}>
              <div className={styles.sectionHeaderContainer}>
                <Skeleton height='80px' />
              </div>
              <div className={styles.chartsGrid}>
                <Skeleton height='400px' />
                <Skeleton height='400px' />
              </div>
            </div>
          }
        >
          <LazyDocumentsAnalysis selectedYears={selectedYearsForCharts} />
        </Suspense>
      </ErrorBoundary>

      {/* Análise de Performance dos Provedores */}
      <ErrorBoundary
        title='Erro na Análise de Provedores'
        message='Não foi possível carregar os gráficos de análise de provedores.'
      >
        <Suspense
          fallback={
            <div className={styles.analysisSection}>
              <div className={styles.sectionHeaderContainer}>
                <Skeleton height='120px' />
              </div>
              <div className={styles.chartsGrid}>
                <Skeleton height='400px' />
                <Skeleton height='400px' />
              </div>
            </div>
          }
        >
          <LazyProvidersAnalysis providerFilters={providerFilters} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
});
