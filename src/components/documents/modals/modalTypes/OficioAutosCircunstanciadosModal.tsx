import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioAutosCircunstanciadosModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  const autosDemanda = documentosDemanda.filter(
    (doc) => doc.tipoDocumento === 'Autos Circunstanciados'
  );

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setTempStates((prev) => ({
      ...prev,
      selectedAutosCircunstanciados: checked
        ? [...prev.selectedAutosCircunstanciados, docId]
        : prev.selectedAutosCircunstanciados.filter((id) => id !== docId),
    }));
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>
        Selecione os Autos Circunstanciados
      </label>
      <div className={styles.selectList}>
        {autosDemanda.length > 0 ? (
          autosDemanda.map((doc) => (
            <label key={doc.id} className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={tempStates.selectedAutosCircunstanciados.includes(
                  doc.id.toString()
                )}
                onChange={(e) =>
                  handleCheckboxChange(doc.id.toString(), e.target.checked)
                }
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                {doc.numeroDocumento}
                {doc.dataFinalizacao ? (
                  <span
                    className={`${styles.statusBadge} ${styles.statusFinalizado}`}
                  >
                    Finalizado em {doc.dataFinalizacao}
                  </span>
                ) : (
                  <span
                    className={`${styles.statusBadge} ${styles.statusPendente}`}
                  >
                    Não finalizado
                  </span>
                )}
              </span>
            </label>
          ))
        ) : (
          <p className={styles.noData}>
            Nenhum auto circunstanciado encontrado nesta demanda.
          </p>
        )}
      </div>
    </div>
  );
}
