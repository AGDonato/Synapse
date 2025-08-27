import React, { Suspense, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemandasData } from '../hooks/queries/useDemandas';
import { useDocumentosData } from '../hooks/queries/useDocumentos';
import { useProviderFilters } from '../hooks/useProviderFilters';
import DemandUpdateModal from '../components/demands/modals/DemandUpdateModal';
import DocumentUpdateModal from '../components/documents/modals/DocumentUpdateModal';
import Toast from '../components/ui/Toast';
import { ErrorBoundary, QuickManagementSkeleton, Skeleton, StatisticsSkeleton } from '../components/ui';
import { PerformanceProfiler } from '../components/performance/PerformanceProfiler';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import type { Demanda } from '../types/entities';
import { 
  DashboardHeader, 
  LazyDemandsAnalysis, 
  LazyDocumentsAnalysis,
  LazyProvidersAnalysis,
  QuickManagementSection,
  StatisticsSection,
} from './HomePage/components';
import {
  useHomePageFilters,
  useModalManagement,
} from './HomePage/hooks';
import styles from './HomePage/styles/HomePage.module.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: demandas = [], updateDemanda, isLoading: isDemandasLoading } = useDemandasData();
  const { data: documentos = [], updateDocumento, getDocumentosByDemandaId, isLoading: isDocumentosLoading } = useDocumentosData();
  const providerFilters = useProviderFilters();
  const { getSelectedYears } = useHomePageFilters();
  
  // Modal management
  const {
    selectedDocument,
    selectedDemand,
    isDocumentModalOpen,
    isDemandModalOpen,
    toastMessage,
    toastType,
    isToastVisible,
    setIsToastVisible,
    handleOpenDemandModal,
    handleOpenDocumentModal,
    handleCloseDemandModal,
    handleCloseDocumentModal,
    handleModalError,
  } = useModalManagement();

  // Handler para salvar demanda
  const handleSaveDemand = useCallback(
    (updatedData: Partial<Demanda>) => {
      if (selectedDemand) {
        updateDemanda(selectedDemand.id, updatedData);
        handleCloseDemandModal();
      }
    },
    [selectedDemand, updateDemanda, handleCloseDemandModal]
  );

  // Handler para salvar documento
  const handleSaveDocument = useCallback(
    (updatedData: Partial<DocumentoDemanda>) => {
      if (selectedDocument) {
        updateDocumento(selectedDocument.id, updatedData);
        handleCloseDocumentModal();
      }
    },
    [selectedDocument, updateDocumento, handleCloseDocumentModal]
  );

  // Handler para criar documento
  const handleCreateDocument = useCallback(
    (demanda: Demanda) => {
      navigate(`/documentos/novo?sged=${demanda.sged}`);
    },
    [navigate]
  );

  // Memoize anos disponíveis para evitar recálculos - otimizado
  const availableYears = useMemo(() => {
    if (demandas.length === 0) {return [];}
    
    const yearsSet = new Set<string>();
    for (const demanda of demandas) {
      if (demanda.dataInicial) {
        const year = demanda.dataInicial.split('/')[2];
        if (year) {yearsSet.add(year);}
      }
    }
    
    return Array.from(yearsSet).sort().reverse();
  }, [demandas]);

  // Memoize anos selecionados para os gráficos
  const selectedYearsForCharts = useMemo(() => {
    return getSelectedYears(availableYears);
  }, [availableYears, getSelectedYears]);

  // Memoize handlers para evitar recriação desnecessária
  const memoizedHandlers = useMemo(() => ({
    onOpenDemandModal: handleOpenDemandModal,
    onOpenDocumentModal: handleOpenDocumentModal,
    onCreateDocument: handleCreateDocument,
  }), [handleOpenDemandModal, handleOpenDocumentModal, handleCreateDocument]);


  return (
    <PerformanceProfiler id="HomePage">
      <div className={styles.homePage}>
      {/* Header */}
      <DashboardHeader />

      {/* Seção de Gestão Rápida */}
      {isDemandasLoading || isDocumentosLoading ? (
        <QuickManagementSkeleton />
      ) : (
        <QuickManagementSection
          onOpenDemandModal={memoizedHandlers.onOpenDemandModal}
          onOpenDocumentModal={memoizedHandlers.onOpenDocumentModal}
          onCreateDocument={memoizedHandlers.onCreateDocument}
        />
      )}

      {/* Seção de Estatísticas */}
      {isDemandasLoading || isDocumentosLoading ? (
        <StatisticsSkeleton />
      ) : (
        <StatisticsSection />
      )}

      {/* Análise de Demandas - Lazy Loaded */}
      <ErrorBoundary
        title="Erro na Análise de Demandas"
        message="Não foi possível carregar os gráficos de análise de demandas."
      >
        <Suspense fallback={
          <div className={styles.analysisSection}>
            <div className={styles.sectionHeaderContainer}>
              <Skeleton height="80px" />
            </div>
            <div className={styles.chartsGrid}>
              <Skeleton height="400px" />
              <Skeleton height="400px" />
            </div>
          </div>
        }>
          <LazyDemandsAnalysis selectedYears={selectedYearsForCharts} />
        </Suspense>
      </ErrorBoundary>

      {/* Análise de Documentos - Lazy Loaded */}
      <ErrorBoundary
        title="Erro na Análise de Documentos"
        message="Não foi possível carregar os gráficos de análise de documentos."
      >
        <Suspense fallback={
          <div className={styles.analysisSection}>
            <div className={styles.sectionHeaderContainer}>
              <Skeleton height="80px" />
            </div>
            <div className={styles.chartsGrid}>
              <Skeleton height="400px" />
              <Skeleton height="400px" />
            </div>
          </div>
        }>
          <LazyDocumentsAnalysis selectedYears={selectedYearsForCharts} />
        </Suspense>
      </ErrorBoundary>

      {/* Análise de Performance dos Provedores - Lazy Loaded */}
      <ErrorBoundary
        title="Erro na Análise de Provedores"
        message="Não foi possível carregar os gráficos de análise de provedores."
      >
        <Suspense fallback={
          <div className={styles.analysisSection}>
            <div className={styles.sectionHeaderContainer}>
              <Skeleton height="120px" />
            </div>
            <div className={styles.chartsGrid}>
              <Skeleton height="400px" />
              <Skeleton height="400px" />
            </div>
          </div>
        }>
          <LazyProvidersAnalysis providerFilters={providerFilters} />
        </Suspense>
      </ErrorBoundary>

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
          documentosDemanda={getDocumentosByDemandaId(selectedDocument.demandaId)}
          isOpen={isDocumentModalOpen}
          onClose={handleCloseDocumentModal}
          onSave={handleSaveDocument}
          onError={handleModalError}
          getDocumento={id => documentos.find((d: DocumentoDemanda) => d.id === id)}
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
    </PerformanceProfiler>
  );
};

export default HomePage;