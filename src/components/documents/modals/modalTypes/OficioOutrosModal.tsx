import type { ModalContentProps } from '../types';
import { convertToHTMLDate } from '../utils';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioOutrosModal({
  tempStates,
  setTempStates,
}: ModalContentProps) {
  const handleDateChange = (value: string, isFormatted: boolean = true) => {
    if (isFormatted) {
      // Input formatado (DD/MM/YYYY)
      const numericValue = value.replace(/\D/g, '');
      let formattedValue = '';

      if (numericValue.length <= 2) {
        formattedValue = numericValue;
      } else if (numericValue.length <= 4) {
        formattedValue = `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
      } else {
        formattedValue = `${numericValue.slice(0, 2)}/${numericValue.slice(
          2,
          4
        )}/${numericValue.slice(4, 8)}`;
      }

      setTempStates((prev) => ({
        ...prev,
        dataEnvioFormatted: formattedValue,
        dataEnvio:
          formattedValue.length === 10
            ? convertToHTMLDate(formattedValue)
            : formattedValue,
      }));
    } else {
      // Input HTML5 date
      setTempStates((prev) => ({
        ...prev,
        dataEnvio: value,
        dataEnvioFormatted: value
          ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
          : '',
      }));
    }
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
          placeholder='Digite o número no Atena'
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor='dataEnvio' className={styles.formLabel}>
          Data de Envio
        </label>
        <input
          type='text'
          id='dataEnvio'
          value={tempStates.dataEnvioFormatted}
          onChange={(e) => handleDateChange(e.target.value)}
          className={styles.formInput}
          placeholder='DD/MM/AAAA'
          maxLength={10}
        />
      </div>
    </>
  );
}
