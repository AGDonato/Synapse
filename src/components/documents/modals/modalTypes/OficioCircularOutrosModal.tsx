
import type { ModalContentProps } from '../types';
import { convertToBrazilianDate, convertToHTMLDate } from '../utils';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioCircularOutrosModal({
  tempStates,
  setTempStates,
}: ModalContentProps) {
  const handleDestinatarioDataEnvioChange = (index: number, value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 3 && formatted.length <= 4) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    } else if (formatted.length >= 5) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
    }

    const newData = [...tempStates.destinatariosData];
    newData[index].dataEnvioFormatted = formatted;
    newData[index].dataEnvio =
      formatted.length === 10 ? convertToHTMLDate(formatted) : formatted;
    setTempStates((prev) => ({ ...prev, destinatariosData: newData }));
  };

  const handleDestinatarioDataEnvioCalendarChange = (
    index: number,
    value: string
  ) => {
    const newData = [...tempStates.destinatariosData];
    newData[index].dataEnvio = value;
    newData[index].dataEnvioFormatted = convertToBrazilianDate(value);
    setTempStates((prev) => ({ ...prev, destinatariosData: newData }));
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

      {tempStates.destinatariosData.map((dest, index) => (
        <div key={index} className={styles.destinatarioGroup}>
          <h4 className={styles.destinatarioHeader}>{dest.nome}</h4>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data de Envio</label>
            <div className={styles.dateInputWrapper}>
              <input
                type='text'
                value={dest.dataEnvioFormatted || ''}
                onChange={(e) =>
                  handleDestinatarioDataEnvioChange(index, e.target.value)
                }
                className={styles.formInput}
                placeholder='dd/mm/aaaa'
                maxLength={10}
              />
              <input
                type='date'
                value={convertToHTMLDate(dest.dataEnvioFormatted || '')}
                onChange={(e) =>
                  handleDestinatarioDataEnvioCalendarChange(
                    index,
                    e.target.value
                  )
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
        </div>
      ))}
    </>
  );
}
