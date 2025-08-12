import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function ComunicacaoNaoCumprimentoModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  // Filtrar ofícios de encaminhamento de decisão judicial pendentes
  const decisoesPendentes = documentosDemanda.filter(
    (doc) =>
      doc.tipoDocumento === 'Ofício' &&
      doc.assunto === 'Encaminhamento de decisão judicial' &&
      !doc.respondido
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
        Selecione os ofícios de encaminhamento de decisão judicial
      </label>
      <div className={styles.selectList}>
        {decisoesPendentes.length > 0 ? (
          decisoesPendentes.map((doc) => (
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
                {doc.numeroDocumento} - {doc.destinatario}
                {doc.dataEnvio && ` (Enviado: ${doc.dataEnvio})`}
              </span>
            </label>
          ))
        ) : (
          <p className={styles.noData}>
            Nenhum ofício de encaminhamento de decisão judicial pendente
            encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
