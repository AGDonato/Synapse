import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function EncaminhamentoDecisaoJudicialModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  // Filtrar documentos de Decisão Judicial da demanda
  const decisoesDemanda = documentosDemanda.filter(
    (doc) =>
      doc.tipoDocumento === 'Decisão Judicial' ||
      (doc.tipoDocumento === 'Ofício' && doc.assunto === 'Decisão judicial')
  );

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setTempStates((prev) => ({
      ...prev,
      selectedDecisoes: checked
        ? [...prev.selectedDecisoes, docId]
        : prev.selectedDecisoes.filter((id) => id !== docId),
    }));
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>
        Selecione as Decisões Judiciais para Encaminhamento
      </label>
      <div className={styles.selectList}>
        {decisoesDemanda.length > 0 ? (
          decisoesDemanda.map((doc) => (
            <label key={doc.id} className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={tempStates.selectedDecisoes.includes(
                  doc.id.toString()
                )}
                onChange={(e) =>
                  handleCheckboxChange(doc.id.toString(), e.target.checked)
                }
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                {doc.numeroDocumento} - {doc.tipoDocumento}
                {doc.dataEnvio && ` (${doc.dataEnvio})`}
              </span>
            </label>
          ))
        ) : (
          <p className={styles.noData}>
            Nenhuma decisão judicial encontrada nesta demanda.
          </p>
        )}
      </div>
    </div>
  );
}
