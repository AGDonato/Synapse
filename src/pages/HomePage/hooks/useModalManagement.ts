import { useCallback, useState } from 'react';
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';

export function useModalManagement() {
  // Estados dos modais
  const [selectedDocument, setSelectedDocument] = useState<DocumentoDemanda | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demanda | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);

  // Estados para o Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error');
  const [isToastVisible, setIsToastVisible] = useState(false);

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

  const handleModalError = useCallback((error: string) => {
    setToastMessage(error);
    setToastType('error');
    setIsToastVisible(true);
  }, []);

  return {
    // Estados dos modais
    selectedDocument,
    selectedDemand,
    isDocumentModalOpen,
    isDemandModalOpen,
    
    // Estados do toast
    toastMessage,
    toastType,
    isToastVisible,
    setIsToastVisible,
    
    // Handlers
    handleOpenDemandModal,
    handleOpenDocumentModal,
    handleCloseDemandModal,
    handleCloseDocumentModal,
    handleModalError,
  };
}