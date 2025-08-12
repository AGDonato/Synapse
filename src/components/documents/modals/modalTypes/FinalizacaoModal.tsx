import type { ModalContentProps } from '../types';
import { convertToHTMLDate, convertToBrazilianDate } from '../utils';
import styles from '../DocumentUpdateModal.module.css';

export default function FinalizacaoModal({
  tempStates,
  setTempStates,
}: ModalContentProps) {
  const handleDataFinalizacaoChange = (value: string) => {
    // Formatar entrada do usuário (DD/MM/YYYY)
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 3 && formatted.length <= 4) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    } else if (formatted.length >= 5) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
    }

    setTempStates((prev) => ({
      ...prev,
      dataFinalizacaoFormatted: formatted,
      dataFinalizacao:
        formatted.length === 10 ? convertToHTMLDate(formatted) : '',
    }));
  };

  const handleDataFinalizacaoCalendarChange = (value: string) => {
    setTempStates((prev) => ({
      ...prev,
      dataFinalizacao: value,
      dataFinalizacaoFormatted: convertToBrazilianDate(value),
    }));
  };

  return (
    <div className={styles.formGroup}>
      <label htmlFor='dataFinalizacao' className={styles.formLabel}>
        Data de Finalização
      </label>
      <div className={styles.dateInputWrapper}>
        <input
          type='text'
          id='dataFinalizacao'
          value={tempStates.dataFinalizacaoFormatted}
          onChange={(e) => handleDataFinalizacaoChange(e.target.value)}
          className={styles.formInput}
          placeholder='dd/mm/aaaa'
          maxLength={10}
        />
        <input
          type='date'
          value={convertToHTMLDate(tempStates.dataFinalizacaoFormatted)}
          onChange={(e) => handleDataFinalizacaoCalendarChange(e.target.value)}
          className={styles.formInput}
        />
      </div>
    </div>
  );
}
