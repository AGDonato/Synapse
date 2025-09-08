import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemandasData } from '../../shared/hooks/queries/useDemandas';
import { useDocumentosData } from '../../shared/hooks/queries/useDocumentos';
import DemandUpdateModal from '../../shared/components/demands/modals/DemandUpdateModal';
import DocumentUpdateModal from '../../shared/components/documents/modals/DocumentUpdateModal';
import Toast from '../../shared/components/ui/Toast';
import { QuickManagementSkeleton, StatisticsSkeleton } from '../../shared/components/ui';
// import { // PerformanceProfiler } from '../../shared/components/performance/// PerformanceProfiler'; // Moved to _trash
import type { DocumentoDemanda } from '../../shared/data/mockDocumentos';
import type { Demanda } from '../types/entities';
import { DashboardHeader, QuickManagementSection, StatisticsSection } from './components';
import { useHomePageFilters, useModalManagement } from './hooks';
import styles from './styles/HomePage.module.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: demandas = [], updateDemanda, isLoading: isDemandasLoading } = useDemandasData();
  const {
    data: documentos = [],
    updateDocumento,
    getDocumentosByDemandaId,
    isLoading: isDocumentosLoading,
  } = useDocumentosData();

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

  // Memoize handlers para evitar recriação desnecessária
  const memoizedHandlers = useMemo(
    () => ({
      onOpenDemandModal: handleOpenDemandModal,
      onOpenDocumentModal: handleOpenDocumentModal,
      onCreateDocument: handleCreateDocument,
    }),
    [handleOpenDemandModal, handleOpenDocumentModal, handleCreateDocument]
  );

  return (
    <div>
      {/* PerformanceProfiler disabled (moved to _trash) */}
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

        {/* Seção de Estatísticas (agora inclui todas as análises) */}
        {isDemandasLoading || isDocumentosLoading ? <StatisticsSkeleton /> : <StatisticsSection />}

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
    </div>
  );
};

export default HomePage;
