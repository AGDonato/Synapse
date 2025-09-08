// src/pages/NovaDemandaPage/components/FormularioSecaoEstatisticas.tsx
import styles from '../NovaDemandaPage.module.css';

interface FormularioSecaoEstatisticasProps {
  formData: {
    alvos: string;
    identificadores: string;
  };
  handleNumericChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormularioSecaoEstatisticas = ({
  formData,
  handleNumericChange,
}: FormularioSecaoEstatisticasProps) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>03</span>
        <h3 className={styles.sectionTitle}>Estatísticas Iniciais</h3>
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='alvos'>
            Alvos <span className={styles.required}>*</span>
          </label>
          <input
            type='text'
            name='alvos'
            id='alvos'
            value={formData.alvos}
            onChange={handleNumericChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='identificadores'>
            Identificadores <span className={styles.required}>*</span>
          </label>
          <input
            type='text'
            name='identificadores'
            id='identificadores'
            value={formData.identificadores}
            onChange={handleNumericChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>
      </div>
    </div>
  );
};
