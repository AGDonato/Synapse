// src/pages/NovaDemandaPage/components/FormularioSecaoReferencias.tsx
import styles from '../../NovaDemandaPage.module.css';

interface FormularioSecaoReferenciasProps {
  formData: {
    sged: string;
    autosAdministrativos: string;
    pic: string;
    autosJudiciais: string;
    autosExtrajudiciais: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleNumericChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormularioSecaoReferencias = ({
  formData,
  handleChange,
  handleNumericChange,
}: FormularioSecaoReferenciasProps) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>02</span>
        <h3 className={styles.sectionTitle}>Referências</h3>
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='sged'>
            SGED <span className={styles.required}>*</span>
          </label>
          <input
            type='text'
            name='sged'
            id='sged'
            value={formData.sged}
            onChange={handleNumericChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='autosAdministrativos'>
            Autos Administrativos
          </label>
          <input
            type='text'
            name='autosAdministrativos'
            id='autosAdministrativos'
            value={formData.autosAdministrativos}
            onChange={handleChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='pic'>
            PIC
          </label>
          <input
            type='text'
            name='pic'
            id='pic'
            value={formData.pic}
            onChange={handleChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='autosJudiciais'>
            Autos Judiciais
          </label>
          <input
            type='text'
            name='autosJudiciais'
            id='autosJudiciais'
            value={formData.autosJudiciais}
            onChange={handleChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor='autosExtrajudiciais'>
            Autos Extrajudiciais
          </label>
          <input
            type='text'
            name='autosExtrajudiciais'
            id='autosExtrajudiciais'
            value={formData.autosExtrajudiciais}
            onChange={handleChange}
            className={styles.formInput}
            autoComplete='off'
          />
        </div>
      </div>
    </div>
  );
};
