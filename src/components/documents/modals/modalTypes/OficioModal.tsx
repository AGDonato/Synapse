import type { ModalContentProps } from '../types';
import { convertToBrazilianDate, convertToHTMLDate } from '../utils';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioModal({
  tempStates,
  setTempStates,
}: ModalContentProps) {
  const handleDataEnvioChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 3 && formatted.length <= 4) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    } else if (formatted.length >= 5) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
    }

    setTempStates((prev) => ({
      ...prev,
      dataEnvioFormatted: formatted,
      dataEnvio:
        formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleDataEnvioCalendarChange = (value: string) => {
    setTempStates((prev) => ({
      ...prev,
      dataEnvio: value,
      dataEnvioFormatted: convertToBrazilianDate(value),
    }));
  };

  const handleDataRespostaChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 3 && formatted.length <= 4) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    } else if (formatted.length >= 5) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
    }

    setTempStates((prev) => ({
      ...prev,
      dataRespostaFormatted: formatted,
      dataResposta:
        formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleDataRespostaCalendarChange = (value: string) => {
    setTempStates((prev) => ({
      ...prev,
      dataResposta: value,
      dataRespostaFormatted: convertToBrazilianDate(value),
    }));
  };

  return (
    <>
      <div className={styles.formGroup}>
        <label htmlFor='numeroAtena' className={styles.formLabel}>
          Número no Atena
        </label>
        <input
          type='text'
          id='numeroAtena'
          value={tempStates.numeroAtena}
          onChange={(e) =>
            setTempStates((prev) => ({
              ...prev,
              numeroAtena: e.target.value,
            }))
          }
          className={styles.formInput}
          placeholder='Ex: AT12345'
        />
      </div>

      <div className={styles.twoColumnGrid}>
        <div className={styles.formGroup}>
          <label htmlFor='dataEnvio' className={styles.formLabel}>
            Data de Envio
          </label>
          <div className={styles.dateInputWrapper}>
            <input
              type='text'
              id='dataEnvio'
              value={tempStates.dataEnvioFormatted}
              onChange={(e) => handleDataEnvioChange(e.target.value)}
              className={styles.formInput}
              placeholder='dd/mm/aaaa'
              maxLength={10}
            />
            <input
              type='date'
              value={convertToHTMLDate(tempStates.dataEnvioFormatted)}
              onChange={(e) => handleDataEnvioCalendarChange(e.target.value)}
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

        <div className={styles.formGroup}>
          <label htmlFor='dataResposta' className={styles.formLabel}>
            Data de Resposta
          </label>
          <div className={styles.dateInputWrapper}>
            <input
              type='text'
              id='dataResposta'
              value={tempStates.dataRespostaFormatted}
              onChange={(e) => handleDataRespostaChange(e.target.value)}
              className={styles.formInput}
              placeholder='dd/mm/aaaa'
              maxLength={10}
            />
            <input
              type='date'
              value={convertToHTMLDate(tempStates.dataRespostaFormatted)}
              onChange={(e) => handleDataRespostaCalendarChange(e.target.value)}
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
      </div>

      <div className={styles.formGroup}>
        <label htmlFor='codigoRastreio' className={styles.formLabel}>
          Código de Rastreio
        </label>
        <div className={styles.inputWithCheckbox}>
          <input
            type='text'
            id='codigoRastreio'
            value={tempStates.codigoRastreio}
            onChange={(e) =>
              setTempStates((prev) => ({
                ...prev,
                codigoRastreio: e.target.value,
              }))
            }
            className={styles.formInput}
            placeholder='Ex: BR123456789BR'
            disabled={tempStates.naopossuiRastreio}
          />
          <label className={styles.inlineCheckboxLabel}>
            <input
              type='checkbox'
              checked={tempStates.naopossuiRastreio}
              onChange={(e) =>
                setTempStates((prev) => ({
                  ...prev,
                  naopossuiRastreio: e.target.checked,
                  codigoRastreio: e.target.checked ? '' : prev.codigoRastreio,
                }))
              }
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>Não possui rastreio</span>
          </label>
        </div>
      </div>
    </>
  );
}
