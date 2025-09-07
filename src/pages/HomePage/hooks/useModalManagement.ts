/**
 * Hook para gerenciamento de modais da página inicial
 *
 * @description
 * Centraliza o controle de estado dos modais de demandas e documentos:
 * - Abertura e fechamento de modais de demandas e documentos
 * - Seleção e limpeza de entidades para visualização
 * - Sistema de notificações (toast) para feedback ao usuário
 * - Tratamento centralizado de erros
 *
 * @example
 * const {
 *   selectedDemand,
 *   isDemandModalOpen,
 *   handleOpenDemandModal,
 *   handleCloseDemandModal
 * } = useModalManagement();
 *
 * // Abrir modal de demanda
 * handleOpenDemandModal(demanda);
 *
 * @module pages/HomePage/hooks/useModalManagement
 */

import { useCallback, useState } from 'react';
import type { Demanda } from '../../../types/entities';
import type { DocumentoDemanda } from '../../../data/mockDocumentos';

// ========== HOOK PRINCIPAL ==========
// Gerencia estado e ações dos modais da HomePage

export function useModalManagement() {
  // ===== ESTADOS DOS MODAIS =====
  // Controla quais modais estão abertos e que entidades estão selecionadas
  const [selectedDocument, setSelectedDocument] = useState<DocumentoDemanda | null>(null); // Documento selecionado para visualização
  const [selectedDemand, setSelectedDemand] = useState<Demanda | null>(null); // Demanda selecionada para visualização
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false); // Controla visibilidade do modal de documento
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false); // Controla visibilidade do modal de demanda

  // ===== SISTEMA DE NOTIFICAÇÕES =====
  // Estados para feedback visual (toast) ao usuário
  const [toastMessage, setToastMessage] = useState(''); // Mensagem a ser exibida no toast
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error'); // Tipo do toast (define cor/ícone)
  const [isToastVisible, setIsToastVisible] = useState(false); // Controla visibilidade do toast

  // ===== MANIPULADORES DE MODAIS =====
  // Funções para abrir/fechar modais e gerenciar entidades selecionadas

  // Abre modal de demanda com entidade específica selecionada
  const handleOpenDemandModal = useCallback((demanda: Demanda) => {
    setSelectedDemand(demanda);
    setIsDemandModalOpen(true);
  }, []);

  // Abre modal de documento com entidade específica selecionada
  const handleOpenDocumentModal = useCallback((documento: DocumentoDemanda) => {
    setSelectedDocument(documento);
    setIsDocumentModalOpen(true);
  }, []);

  // Fecha modal de demanda e limpa seleção
  const handleCloseDemandModal = useCallback(() => {
    setIsDemandModalOpen(false);
    setSelectedDemand(null);
  }, []);

  // Fecha modal de documento e limpa seleção
  const handleCloseDocumentModal = useCallback(() => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
  }, []);

  // Exibe notificação de erro via toast
  const handleModalError = useCallback((error: string) => {
    setToastMessage(error);
    setToastType('error');
    setIsToastVisible(true);
  }, []);

  // ===== INTERFACE PÚBLICA =====
  return {
    // Estados dos modais e entidades selecionadas
    selectedDocument, // Documento atualmente selecionado
    selectedDemand, // Demanda atualmente selecionada
    isDocumentModalOpen, // Status do modal de documento
    isDemandModalOpen, // Status do modal de demanda

    // Sistema de notificações
    toastMessage, // Mensagem do toast
    toastType, // Tipo do toast (error, success, etc.)
    isToastVisible, // Visibilidade do toast
    setIsToastVisible, // Controle manual do toast

    // Ações de modais
    handleOpenDemandModal, // Abrir modal de demanda
    handleOpenDocumentModal, // Abrir modal de documento
    handleCloseDemandModal, // Fechar modal de demanda
    handleCloseDocumentModal, // Fechar modal de documento
    handleModalError, // Exibir erro via toast
  };
}
