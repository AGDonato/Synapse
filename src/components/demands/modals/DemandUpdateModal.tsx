import { useState, useEffect, useCallback } from 'react';
import Modal from '../../ui/Modal';
import type { DemandUpdateModalProps, TempDemandStates } from './types';
import {
  getModalType,
  initializeTempStates,
  hasChanges,
  prepareUpdateData,
} from './utils';
import FinalDateModal from './modalTypes/FinalDateModal';
import ReopenDemandModal from './modalTypes/ReopenDemandModal';
import styles from './DemandUpdateModal.module.css';

export default function DemandUpdateModal({
  demanda,
  isOpen,
  onClose,
  onSave,
  onError,
}: DemandUpdateModalProps) {
  // Estados temporários para o modal
  const [tempStates, setTempStates] = useState<TempDemandStates>(() =>
    initializeTempStates(demanda)
  );

  // Estados iniciais para comparação
  const [initialStates, setInitialStates] = useState<TempDemandStates>(() =>
    initializeTempStates(demanda)
  );

  // Tipo de modal baseado na demanda
  const modalType = getModalType(demanda);

  // Reinicializar estados apenas quando o modal abrir
  useEffect(() => {
    if (isOpen && demanda) {
      const newStates = initializeTempStates(demanda);
      setTempStates(newStates);
      setInitialStates(newStates);
    }
  }, [isOpen, demanda]); // Incluído 'demanda' para resolver warning do ESLint

  // Atualizar estados quando a demanda mudar mas modal está fechado
  useEffect(() => {
    if (!isOpen && demanda) {
      const newStates = initializeTempStates(demanda);
      setTempStates(newStates);
      setInitialStates(newStates);
    }
  }, [demanda, isOpen]); // Incluído 'isOpen' para resolver warning do ESLint

  // Verificar se há mudanças
  const hasUnsavedChanges = useCallback(() => {
    const result = hasChanges(tempStates, initialStates, modalType);
    return result;
  }, [tempStates, initialStates, modalType]);

  // Lidar com fechamento do modal
  const handleClose = useCallback(() => {
    // Limpar estados temporários
    setTempStates(initializeTempStates(null));
    setInitialStates(initializeTempStates(null));
    onClose();
  }, [onClose]);

  // Lidar com salvamento
  const handleSave = useCallback(() => {
    if (!demanda) return;

    const { data, error } = prepareUpdateData(tempStates, modalType, demanda);

    if (error) {
      onError?.(error);
      return;
    }

    if (data) {
      // Salvar dados e fechar modal
      onSave(data);
      handleClose();
    }
  }, [tempStates, modalType, demanda, onSave, onError, handleClose]);

  // Renderizar conteúdo específico do modal
  const renderModalContent = () => {
    if (!demanda) return null;

    const props = {
      tempStates,
      setTempStates,
      demanda,
    };

    switch (modalType) {
      case 'final_date':
        return <FinalDateModal {...props} />;

      case 'reopen_demand':
        return <ReopenDemandModal {...props} />;

      default:
        return (
          <div className={styles.formGroup}>
            <p className={styles.noData}>
              Configuração de atualização não disponível para esta demanda.
            </p>
          </div>
        );
    }
  };

  if (!demanda) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Atualizar SGED ${demanda.sged}`}
    >
      <div className={styles.modalContent}>
        {renderModalContent()}

        <div className={styles.modalActions}>
          <button
            type='button'
            onClick={handleSave}
            disabled={!hasUnsavedChanges()}
            className={styles.submitButton}
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
