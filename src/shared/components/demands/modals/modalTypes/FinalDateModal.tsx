import type { ModalContentProps } from '../types';
import { convertToBrazilianDate, convertToHTMLDate, formatDateMask } from '../utils';
import styles from '../DemandUpdateModal.module.css';

export default function FinalDateModal({ tempStates, setTempStates, demanda }: ModalContentProps) {
  // Handler para mudança no input de texto da data final
  const handleFinalDateChange = (value: string) => {
    const formatted = formatDateMask(value);
    setTempStates(prev => ({
      ...prev,
      dataFinalFormatted: formatted,
      dataFinal: formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  // Handler para mudança no calendário da data final
  const handleFinalCalendarChange = (value: string) => {
    const formatted = convertToBrazilianDate(value);
    setTempStates(prev => ({
      ...prev,
      dataFinal: value,
      dataFinalFormatted: formatted,
    }));
  };

  // Handler para mudança no checkbox de reabertura
  const handleReaberturaChange = (checked: boolean) => {
    setTempStates(prev => ({
      ...prev,
      isReaberto: checked,
      // Preservar datas se já existirem, limpar apenas se desmarcar
      dataReabertura: checked ? prev.dataReabertura : '',
      dataReaberturaFormatted: checked ? prev.dataReaberturaFormatted : '',
      novaDataFinal: checked ? prev.novaDataFinal : '',
      novaDataFinalFormatted: checked ? prev.novaDataFinalFormatted : '',
    }));
  };

  // Handlers para data de reabertura
  const handleDataReaberturaChange = (value: string) => {
    const formatted = formatDateMask(value);
    setTempStates(prev => ({
      ...prev,
      dataReaberturaFormatted: formatted,
      dataReabertura: formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleDataReaberturaCalendarChange = (value: string) => {
    const formatted = convertToBrazilianDate(value);
    setTempStates(prev => ({
      ...prev,
      dataReabertura: value,
      dataReaberturaFormatted: formatted,
    }));
  };

  // Handlers para nova data final
  const handleNovaDataFinalChange = (value: string) => {
    const formatted = formatDateMask(value);
    setTempStates(prev => ({
      ...prev,
      novaDataFinalFormatted: formatted,
      novaDataFinal: formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleNovaDataFinalCalendarChange = (value: string) => {
    const formatted = convertToBrazilianDate(value);
    setTempStates(prev => ({
      ...prev,
      novaDataFinal: value,
      novaDataFinalFormatted: formatted,
    }));
  };

  // Verificações de estado
  // Checkbox só aparece se a demanda JÁ tem data final salva no banco (não apenas digitada)
  const hasDataFinalSaved = !!demanda?.dataFinal;

  return (
    <div className={styles.formSection}>
      {/* Campo de Data Final - sempre visível e editável quando checkbox não está marcado */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Data Final</label>
        <div className={styles.dateInputWrapper}>
          <input
            type='text'
            value={tempStates.dataFinalFormatted}
            onChange={e => handleFinalDateChange(e.target.value)}
            className={styles.formInput}
            placeholder='dd/mm/aaaa'
            maxLength={10}
            disabled={tempStates.isReaberto} // Desabilita apenas quando checkbox está marcado
          />
          <input
            type='date'
            value={convertToHTMLDate(tempStates.dataFinalFormatted)}
            onChange={e => handleFinalCalendarChange(e.target.value)}
            className={styles.hiddenDateInput}
            tabIndex={-1}
            disabled={tempStates.isReaberto}
          />
          <button
            type='button'
            className={styles.calendarButton}
            onClick={e => {
              if (!tempStates.isReaberto) {
                const wrapper = e.currentTarget.parentElement;
                const dateInput = wrapper?.querySelector(
                  'input[type="date"]'
                ) as HTMLInputElement | null;
                if (dateInput?.showPicker) {
                  dateInput.showPicker();
                }
              }
            }}
            title='Abrir calendário'
            disabled={tempStates.isReaberto}
            tabIndex={-1}
            style={{
              opacity: tempStates.isReaberto ? 0.5 : 1,
              cursor: tempStates.isReaberto ? 'not-allowed' : 'pointer',
            }}
          >
            📅
          </button>
        </div>
      </div>

      {/* Checkbox de Reabertura - só aparece se tem data final SALVA */}
      {hasDataFinalSaved && (
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type='checkbox'
              checked={tempStates.isReaberto}
              onChange={e => handleReaberturaChange(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Reaberto</span>
          </label>
        </div>
      )}

      {/* Campos de Reabertura - aparecem quando checkbox está marcado */}
      {tempStates.isReaberto && (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Reabertura</label>
            <div className={styles.dateInputWrapper}>
              <input
                type='text'
                value={tempStates.dataReaberturaFormatted}
                onChange={e => handleDataReaberturaChange(e.target.value)}
                className={styles.formInput}
                placeholder='dd/mm/aaaa'
                maxLength={10}
              />
              <input
                type='date'
                value={convertToHTMLDate(tempStates.dataReaberturaFormatted)}
                onChange={e => handleDataReaberturaCalendarChange(e.target.value)}
                className={styles.hiddenDateInput}
                tabIndex={-1}
              />
              <button
                type='button'
                className={styles.calendarButton}
                onClick={e => {
                  const wrapper = e.currentTarget.parentElement;
                  const dateInput = wrapper?.querySelector(
                    'input[type="date"]'
                  ) as HTMLInputElement | null;
                  if (dateInput?.showPicker) {
                    dateInput.showPicker();
                  }
                }}
                title='Abrir calendário'
                tabIndex={-1}
              >
                📅
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nova Data Final</label>
            <div className={styles.dateInputWrapper}>
              <input
                type='text'
                value={tempStates.novaDataFinalFormatted}
                onChange={e => handleNovaDataFinalChange(e.target.value)}
                className={styles.formInput}
                placeholder='dd/mm/aaaa'
                maxLength={10}
              />
              <input
                type='date'
                value={convertToHTMLDate(tempStates.novaDataFinalFormatted)}
                onChange={e => handleNovaDataFinalCalendarChange(e.target.value)}
                className={styles.hiddenDateInput}
                tabIndex={-1}
              />
              <button
                type='button'
                className={styles.calendarButton}
                onClick={e => {
                  const wrapper = e.currentTarget.parentElement;
                  const dateInput = wrapper?.querySelector(
                    'input[type="date"]'
                  ) as HTMLInputElement | null;
                  if (dateInput?.showPicker) {
                    dateInput.showPicker();
                  }
                }}
                title='Abrir calendário'
                tabIndex={-1}
              >
                📅
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
