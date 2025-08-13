import { useState, useEffect, useCallback } from 'react';
import Modal from '../../ui/Modal';
import type { DocumentUpdateModalProps, TempModalStates } from './types';
import {
  getModalType,
  initializeTempStates,
  hasChanges,
  prepareUpdateData,
  validateDateNotFuture,
} from './utils';
import FinalizacaoModal from './modalTypes/FinalizacaoModal';
import MidiaModal from './modalTypes/MidiaModal';
import OficioModal from './modalTypes/OficioModal';
import OficioCircularModal from './modalTypes/OficioCircularModal';
import OficioCircularOutrosModal from './modalTypes/OficioCircularOutrosModal';
import ComunicacaoNaoCumprimentoModal from './modalTypes/ComunicacaoNaoCumprimentoModal';
import OficioOutrosModal from './modalTypes/OficioOutrosModal';
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
  onError,
  getDocumento,
}: DocumentUpdateModalProps) {
  // Estados temporários para o modal
  const [tempStates, setTempStates] = useState<TempModalStates>(() => {
    const destinatarios = documento?.tipoDocumento === 'Ofício Circular' 
      ? documento?.destinatario 
      : undefined;
    return initializeTempStates(documento, destinatarios);
  });

  // Estados iniciais para comparação
  const [initialStates, setInitialStates] = useState<TempModalStates>(() => {
    const destinatarios = documento?.tipoDocumento === 'Ofício Circular' 
      ? documento?.destinatario 
      : undefined;
    const states = initializeTempStates(documento, destinatarios);
    // Criar cópia profunda para evitar referência compartilhada
    return JSON.parse(JSON.stringify(states));
  });

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
      // Criar uma cópia profunda para evitar referência compartilhada
      const newInitialStates = JSON.parse(JSON.stringify(newStates));
      
      setTempStates(newStates);
      setInitialStates(newInitialStates);
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
    onClose();
  }, [onClose]);

  // Validar datas antes do salvamento
  const validateDates = useCallback(() => {
    const errors: string[] = [];

    // Validar diferentes tipos de campos de data baseado no modalType
    switch (modalType) {
      case 'finalizacao':
        if (tempStates.dataFinalizacaoFormatted) {
          const validation = validateDateNotFuture(
            tempStates.dataFinalizacaoFormatted
          );
          if (!validation.isValid) {
            errors.push(
              validation.errorMessage || 'Data de finalização inválida'
            );
          }
        }
        break;

      case 'oficio':
        if (tempStates.dataEnvioFormatted) {
          const validation = validateDateNotFuture(
            tempStates.dataEnvioFormatted
          );
          if (!validation.isValid) {
            errors.push('Data de envio não pode ser maior que a data atual');
          }
        }
        if (tempStates.dataRespostaFormatted) {
          const validation = validateDateNotFuture(
            tempStates.dataRespostaFormatted
          );
          if (!validation.isValid) {
            errors.push('Data de resposta não pode ser maior que a data atual');
          }
        }
        break;

      case 'oficio_outros':
        if (tempStates.dataEnvioFormatted) {
          const validation = validateDateNotFuture(
            tempStates.dataEnvioFormatted
          );
          if (!validation.isValid) {
            errors.push('Data de envio não pode ser maior que a data atual');
          }
        }
        break;

      case 'oficio_circular':
      case 'oficio_circular_outros':
        tempStates.destinatariosData.forEach((dest, index) => {
          if (dest.dataEnvioFormatted) {
            const validation = validateDateNotFuture(dest.dataEnvioFormatted);
            if (!validation.isValid) {
              errors.push(
                `Data de envio do destinatário ${index + 1} não pode ser maior que a data atual`
              );
            }
          }
          if (dest.dataRespostaFormatted) {
            const validation = validateDateNotFuture(
              dest.dataRespostaFormatted
            );
            if (!validation.isValid) {
              errors.push(
                `Data de resposta do destinatário ${index + 1} não pode ser maior que a data atual`
              );
            }
          }
        });
        break;
    }

    return errors;
  }, [tempStates, modalType]);

  // Lidar com salvamento
  const handleSave = useCallback(() => {
    if (!documento) return;

    // Validar datas primeiro
    const dateErrors = validateDates();
    if (dateErrors.length > 0) {
      onError?.(dateErrors[0]); // Mostrar primeiro erro encontrado via toast
      return;
    }

    const { data, error } = prepareUpdateData(
      tempStates,
      modalType,
      documentosDemanda,
      getDocumento
    );

    if (error) {
      onError?.(error);
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
    onError,
    handleClose,
    validateDates,
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

      case 'oficio_outros':
        return <OficioOutrosModal {...props} />;

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
              Necessária definição de modal para esse documento.
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
        <div className={styles.formSection}>{renderModalContent()}</div>

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
