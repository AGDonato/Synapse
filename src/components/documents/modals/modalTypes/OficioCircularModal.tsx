
import type { ModalContentProps } from '../types';
import { convertToBrazilianDate, convertToHTMLDate } from '../utils';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioCircularModal({
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

  const handleDestinatarioDataRespostaChange = (
    index: number,
    value: string
  ) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 3 && formatted.length <= 4) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    } else if (formatted.length >= 5) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
    }

    const newData = [...tempStates.destinatariosData];
    newData[index].dataRespostaFormatted = formatted;
    newData[index].dataResposta =
      formatted.length === 10 ? convertToHTMLDate(formatted) : formatted;
    setTempStates((prev) => ({ ...prev, destinatariosData: newData }));
  };

  const handleDestinatarioDataRespostaCalendarChange = (
    index: number,
    value: string
  ) => {
    const newData = [...tempStates.destinatariosData];
    newData[index].dataResposta = value;
    newData[index].dataRespostaFormatted = convertToBrazilianDate(value);
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

          <div className={styles.twoColumnGrid}>
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

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Data de Resposta</label>
              <div className={styles.dateInputWrapper}>
                <input
                  type='text'
                  value={dest.dataRespostaFormatted || ''}
                  onChange={(e) =>
                    handleDestinatarioDataRespostaChange(index, e.target.value)
                  }
                  className={styles.formInput}
                  placeholder='dd/mm/aaaa'
                  maxLength={10}
                />
                <input
                  type='date'
                  value={convertToHTMLDate(dest.dataRespostaFormatted || '')}
                  onChange={(e) =>
                    handleDestinatarioDataRespostaCalendarChange(
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Código de Rastreio</label>
            <div className={styles.inputWithCheckbox}>
              <input
                type='text'
                value={dest.codigoRastreio}
                onChange={(e) => {
                  const newData = [...tempStates.destinatariosData];
                  newData[index].codigoRastreio = e.target.value;
                  setTempStates((prev) => ({
                    ...prev,
                    destinatariosData: newData,
                  }));
                }}
                className={styles.formInput}
                placeholder='Ex: AA123456789BR'
                disabled={dest.naopossuiRastreio}
              />
              <label className={styles.inlineCheckboxLabel}>
                <input
                  type='checkbox'
                  checked={dest.naopossuiRastreio}
                  onChange={(e) => {
                    const newData = [...tempStates.destinatariosData];
                    newData[index].naopossuiRastreio = e.target.checked;
                    if (e.target.checked) {
                      newData[index].codigoRastreio = '';
                    }
                    setTempStates((prev) => ({
                      ...prev,
                      destinatariosData: newData,
                    }));
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>Não possui rastreio</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
