import { useState, useEffect, useCallback } from 'react';
import Modal from '../../ui/Modal';
import type { DocumentUpdateModalProps, TempModalStates } from './types';
import {
  getModalType,
  initializeTempStates,
  hasChanges,
  prepareUpdateData,
} from './utils';
import FinalizacaoModal from './modalTypes/FinalizacaoModal';
import MidiaModal from './modalTypes/MidiaModal';
import OficioModal from './modalTypes/OficioModal';
import OficioCircularModal from './modalTypes/OficioCircularModal';
import OficioCircularOutrosModal from './modalTypes/OficioCircularOutrosModal';
import ComunicacaoNaoCumprimentoModal from './modalTypes/ComunicacaoNaoCumprimentoModal';
import EncaminhamentoDecisaoJudicialModal from './modalTypes/EncaminhamentoDecisaoJudicialModal';
import OficioMidiaModal from './modalTypes/OficioMidiaModal';
import OficioRelatorioTecnicoModal from './modalTypes/OficioRelatorioTecnicoModal';
import OficioRelatorioInteligenciaModal from './modalTypes/OficioRelatorioInteligenciaModal';
import OficioRelatorioMidiaModal from './modalTypes/OficioRelatorioMidiaModal';
import OficioAutosCircunstanciadosModal from './modalTypes/OficioAutosCircunstanciadosModal';
import styles from './DocumentUpdateModal.module.css';

export default function DocumentUpdateModal({
  documento,
  documentosDemanda,
  isOpen,
  onClose,
  onSave,
  getDocumento,
}: DocumentUpdateModalProps) {
  // Estados temporários para o modal
  const [tempStates, setTempStates] = useState<TempModalStates>(() =>
    initializeTempStates(documento, documento?.destinatario)
  );

  // Estados iniciais para comparação
  const [initialStates, setInitialStates] = useState<TempModalStates>(() =>
    initializeTempStates(documento, documento?.destinatario)
  );

  // Estado para mensagens de erro
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tipo de modal baseado no documento
  const modalType = getModalType(documento);

  // Reinicializar estados quando o modal abrir com novo documento
  useEffect(() => {
    if (isOpen && documento) {
      const destinatarios =
        documento.tipoDocumento === 'Ofício Circular'
          ? documento.destinatario
          : undefined;

      const newStates = initializeTempStates(documento, destinatarios);
      setTempStates(newStates);
      setInitialStates(newStates);
      setErrorMessage(null);
    }
  }, [isOpen, documento]);

  // Verificar se há mudanças
  const hasUnsavedChanges = useCallback(() => {
    return hasChanges(tempStates, initialStates, modalType);
  }, [tempStates, initialStates, modalType]);

  // Lidar com fechamento do modal
  const handleClose = useCallback(() => {
    // Limpar estados temporários
    setTempStates(initializeTempStates(null));
    setInitialStates(initializeTempStates(null));
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  // Lidar com salvamento
  const handleSave = useCallback(() => {
    if (!documento) return;

    const { data, error } = prepareUpdateData(
      tempStates,
      modalType,
      documentosDemanda,
      getDocumento
    );

    if (error) {
      setErrorMessage(error);
      return;
    }

    if (data) {
      // Copiar estados temporários para finais antes de salvar
      onSave(data);

      // Fechar modal após salvar com sucesso
      handleClose();
    }
  }, [
    tempStates,
    modalType,
    documentosDemanda,
    getDocumento,
    documento,
    onSave,
    handleClose,
  ]);

  // Renderizar conteúdo específico do modal
  const renderModalContent = () => {
    if (!documento) return null;

    const props = {
      tempStates,
      setTempStates,
      documento,
      documentosDemanda,
      getDocumento,
    };

    switch (modalType) {
      case 'finalizacao':
        return <FinalizacaoModal {...props} />;

      case 'midia':
        return <MidiaModal {...props} />;

      case 'oficio':
        return <OficioModal {...props} />;

      case 'oficio_circular':
        return <OficioCircularModal {...props} />;

      case 'oficio_circular_outros':
        return <OficioCircularOutrosModal {...props} />;

      case 'comunicacao_nao_cumprimento':
        return <ComunicacaoNaoCumprimentoModal {...props} />;

      case 'encaminhamento_decisao_judicial':
        return <EncaminhamentoDecisaoJudicialModal {...props} />;

      case 'oficio_midia':
        return <OficioMidiaModal {...props} />;

      case 'oficio_relatorio_tecnico':
        return <OficioRelatorioTecnicoModal {...props} />;

      case 'oficio_relatorio_inteligencia':
        return <OficioRelatorioInteligenciaModal {...props} />;

      case 'oficio_relatorio_midia':
        return <OficioRelatorioMidiaModal {...props} />;

      case 'oficio_autos_circunstanciados':
        return <OficioAutosCircunstanciadosModal {...props} />;

      default:
        return (
          <div className={styles.formGroup}>
            <p className={styles.noData}>
              Configuração de atualização não disponível para este tipo de
              documento.
            </p>
          </div>
        );
    }
  };

  if (!documento) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Atualizar ${documento.tipoDocumento || 'Documento'}`}
    >
      <div className={styles.modalContent}>
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        {renderModalContent()}

        <div className={styles.modalActions}>
          <button
            type='button'
            onClick={handleSave}
            disabled={!hasUnsavedChanges()}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
