import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioMidiaModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  const midiasDemanda = documentosDemanda.filter(
    (doc) => doc.tipoDocumento === 'Mídia'
  );

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setTempStates((prev) => ({
      ...prev,
      selectedMidias: checked
        ? [...prev.selectedMidias, docId]
        : prev.selectedMidias.filter((id) => id !== docId),
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

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Selecione as Mídias</label>
        <div className={styles.selectList}>
          {midiasDemanda.length > 0 ? (
            midiasDemanda.map((doc) => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={tempStates.selectedMidias.includes(
                    doc.id.toString()
                  )}
                  onChange={(e) =>
                    handleCheckboxChange(doc.id.toString(), e.target.checked)
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  {doc.numeroDocumento}
                  {doc.apresentouDefeito && ' (Com defeito)'}
                </span>
              </label>
            ))
          ) : (
            <p className={styles.noData}>
              Nenhuma mídia encontrada nesta demanda.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
