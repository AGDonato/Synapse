import type { ModalContentProps } from '../types';
import {
  convertToBrazilianDate,
  convertToHTMLDate,
  formatDateMask,
} from '../utils';
import styles from '../DemandUpdateModal.module.css';

export default function ReopenDemandModal({
  tempStates,
  setTempStates,
  demanda,
}: ModalContentProps) {
  // Handler para mudança no checkbox de reabertura
  const handleReaberturaChange = (checked: boolean) => {
    setTempStates((prev) => ({
      ...prev,
      isReaberto: checked,
      // Limpar datas quando desmarcar
      dataReabertura: checked ? prev.dataReabertura : '',
      dataReaberturaFormatted: checked ? prev.dataReaberturaFormatted : '',
      novaDataFinal: checked ? prev.novaDataFinal : '',
      novaDataFinalFormatted: checked ? prev.novaDataFinalFormatted : '',
    }));
  };

  // Handlers para data de reabertura
  const handleDataReaberturaChange = (value: string) => {
    const formatted = formatDateMask(value);
    setTempStates((prev) => ({
      ...prev,
      dataReaberturaFormatted: formatted,
      dataReabertura:
        formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleDataReaberturaCalendarChange = (value: string) => {
    const formatted = convertToBrazilianDate(value);
    setTempStates((prev) => ({
      ...prev,
      dataReabertura: value,
      dataReaberturaFormatted: formatted,
    }));
  };

  // Handlers para nova data final
  const handleNovaDataFinalChange = (value: string) => {
    const formatted = formatDateMask(value);
    setTempStates((prev) => ({
      ...prev,
      novaDataFinalFormatted: formatted,
      novaDataFinal:
        formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleNovaDataFinalCalendarChange = (value: string) => {
    const formatted = convertToBrazilianDate(value);
    setTempStates((prev) => ({
      ...prev,
      novaDataFinal: value,
      novaDataFinalFormatted: formatted,
    }));
  };

  // Handler para mudança na data final (quando não está reaberta)
  const handleFinalDateChange = (value: string) => {
    const formatted = formatDateMask(value);
    setTempStates((prev) => ({
      ...prev,
      dataFinalFormatted: formatted,
      dataFinal:
        formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleFinalCalendarChange = (value: string) => {
    const formatted = convertToBrazilianDate(value);
    setTempStates((prev) => ({
      ...prev,
      dataFinal: value,
      dataFinalFormatted: formatted,
    }));
  };

  const hasDataFinal = !!demanda?.dataFinal;
  const isAlreadyReopened = !!demanda?.dataReabertura; // Verifica se já foi reaberta

  // Se já foi reaberta, mostrar apenas campos para editar nova data final
  if (isAlreadyReopened) {
    return (
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nova Data Final</label>
          <div className={styles.dateInputWrapper}>
            <input
              type='text'
              value={tempStates.novaDataFinalFormatted}
              onChange={(e) => handleNovaDataFinalChange(e.target.value)}
              className={styles.formInput}
              placeholder='dd/mm/aaaa'
              maxLength={10}
            />
            <input
              type='date'
              value={convertToHTMLDate(tempStates.novaDataFinalFormatted)}
              onChange={(e) =>
                handleNovaDataFinalCalendarChange(e.target.value)
              }
              className={styles.hiddenDateInput}
              tabIndex={-1}
            />
            <button
              type='button'
              className={styles.calendarButton}
              onClick={(e) => {
                const wrapper = e.currentTarget.parentElement;
                const dateInput = wrapper?.querySelector(
                  'input[type="date"]'
                )!;
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

        {/* Informação sobre a reabertura */}
        <div className={styles.formGroup}>
          <div
            style={{
              backgroundColor: '#f0f9ff',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#0369a1',
            }}
          >
            <strong>Demanda Reaberta</strong>
            <br />
            Data de Reabertura:{' '}
            {tempStates.dataReaberturaFormatted || 'Não informada'}
          </div>
        </div>
      </div>
    );
  }

  // Comportamento original para demandas não reabertas
  return (
    <div className={styles.formSection}>
      {/* Campo de Data Final - sempre visível */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Data Final</label>
        <div className={styles.dateInputWrapper}>
          <input
            type='text'
            value={tempStates.dataFinalFormatted}
            onChange={(e) => handleFinalDateChange(e.target.value)}
            className={styles.formInput}
            placeholder='dd/mm/aaaa'
            maxLength={10}
          />
          <input
            type='date'
            value={convertToHTMLDate(tempStates.dataFinalFormatted)}
            onChange={(e) => handleFinalCalendarChange(e.target.value)}
            className={styles.hiddenDateInput}
            tabIndex={-1}
          />
          <button
            type='button'
            className={styles.calendarButton}
            onClick={(e) => {
              const wrapper = e.currentTarget.parentElement;
              const dateInput = wrapper?.querySelector(
                'input[type="date"]'
              )!;
              if (dateInput?.showPicker) {
                dateInput.showPicker();
              }
            }}
            title='Abrir calendário'
          >
            📅
          </button>
        </div>
      </div>

      {/* Checkbox de Reabertura - só aparece se já tem data final */}
      {hasDataFinal && (
        <div className={styles.formGroup}>
          <label
            className={styles.checkboxLabel}
            style={{
              flexDirection: 'row',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              type='checkbox'
              checked={tempStates.isReaberto}
              onChange={(e) => handleReaberturaChange(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Reaberto</span>
          </label>
        </div>
      )}

      {/* Campos de Reabertura - só aparecem se marcado como reaberto */}
      {tempStates.isReaberto && (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Reabertura</label>
            <div className={styles.dateInputWrapper}>
              <input
                type='text'
                value={tempStates.dataReaberturaFormatted}
                onChange={(e) => handleDataReaberturaChange(e.target.value)}
                className={styles.formInput}
                placeholder='dd/mm/aaaa'
                maxLength={10}
              />
              <input
                type='date'
                value={convertToHTMLDate(tempStates.dataReaberturaFormatted)}
                onChange={(e) =>
                  handleDataReaberturaCalendarChange(e.target.value)
                }
                className={styles.hiddenDateInput}
                tabIndex={-1}
              />
              <button
                type='button'
                className={styles.calendarButton}
                onClick={(e) => {
                  const wrapper = e.currentTarget.parentElement;
                  const dateInput = wrapper?.querySelector(
                    'input[type="date"]'
                  )!;
                  if (dateInput?.showPicker) {
                    dateInput.showPicker();
                  }
                }}
                title='Abrir calendário'
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
                onChange={(e) => handleNovaDataFinalChange(e.target.value)}
                className={styles.formInput}
                placeholder='dd/mm/aaaa'
                maxLength={10}
              />
              <input
                type='date'
                value={convertToHTMLDate(tempStates.novaDataFinalFormatted)}
                onChange={(e) =>
                  handleNovaDataFinalCalendarChange(e.target.value)
                }
                className={styles.hiddenDateInput}
                tabIndex={-1}
              />
              <button
                type='button'
                className={styles.calendarButton}
                onClick={(e) => {
                  const wrapper = e.currentTarget.parentElement;
                  const dateInput = wrapper?.querySelector(
                    'input[type="date"]'
                  )!;
                  if (dateInput?.showPicker) {
                    dateInput.showPicker();
                  }
                }}
                title='Abrir calendário'
              >
                📅
              </button>
            </div>
          </div>
        </>
      )}

      {/* Aviso sobre reabertura */}
      {tempStates.isReaberto && (
        <div className={styles.warningText}>
          <strong>Atenção:</strong> A reabertura da demanda mudará o status para
          "Em Andamento" até que uma nova data final seja definida.
        </div>
      )}
    </div>
  );
}
