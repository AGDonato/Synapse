import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioRelatorioTecnicoModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  const relatoriosDemanda = documentosDemanda.filter(
    (doc) => doc.tipoDocumento === 'Relatório Técnico'
  );

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setTempStates((prev) => ({
      ...prev,
      selectedRelatoriosTecnicos: checked
        ? [...prev.selectedRelatoriosTecnicos, docId]
        : prev.selectedRelatoriosTecnicos.filter((id) => id !== docId),
    }));
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>
        Selecione os Relatórios Técnicos
      </label>
      <div className={styles.selectList}>
        {relatoriosDemanda.length > 0 ? (
          relatoriosDemanda.map((doc) => (
            <label key={doc.id} className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={tempStates.selectedRelatoriosTecnicos.includes(
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
            Nenhum relatório técnico encontrado nesta demanda.
          </p>
        )}
      </div>
    </div>
  );
}
