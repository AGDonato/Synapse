import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function MidiaModal({
  tempStates,
  setTempStates,
}: ModalContentProps) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.checkboxLabelNoBorder}>
        <input
          type='checkbox'
          checked={tempStates.apresentouDefeito}
          onChange={(e) =>
            setTempStates((prev) => ({
              ...prev,
              apresentouDefeito: e.target.checked,
            }))
          }
          className={styles.checkbox}
        />
        <span className={styles.checkboxText}>Apresentou Defeito</span>
      </label>
    </div>
  );
}
