import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioRelatorioMidiaModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  const relatoriosTecnicos = documentosDemanda.filter(
    (doc) => doc.tipoDocumento === 'Relatório Técnico'
  );

  const midias = documentosDemanda.filter(
    (doc) => doc.tipoDocumento === 'Mídia'
  );

  const handleRelatorioChange = (docId: string, checked: boolean) => {
    setTempStates((prev) => ({
      ...prev,
      selectedRelatoriosTecnicos: checked
        ? [...prev.selectedRelatoriosTecnicos, docId]
        : prev.selectedRelatoriosTecnicos.filter((id) => id !== docId),
    }));
  };

  const handleMidiaChange = (docId: string, checked: boolean) => {
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
        <label className={styles.formLabel}>
          Selecione os Relatórios Técnicos
        </label>
        <div className={styles.selectList}>
          {relatoriosTecnicos.length > 0 ? (
            relatoriosTecnicos.map((doc) => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={tempStates.selectedRelatoriosTecnicos.includes(
                    doc.id.toString()
                  )}
                  onChange={(e) =>
                    handleRelatorioChange(doc.id.toString(), e.target.checked)
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  {doc.numeroDocumento}
                  {doc.dataFinalizacao ? (
                    <span
                      className={`${styles.statusBadge} ${styles.statusFinalizado}`}
                    >
                      Finalizado
                    </span>
                  ) : (
                    <span
                      className={`${styles.statusBadge} ${styles.statusPendente}`}
                    >
                      Pendente
                    </span>
                  )}
                </span>
              </label>
            ))
          ) : (
            <p className={styles.noData}>
              Nenhum relatório técnico encontrado.
            </p>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Selecione as Mídias</label>
        <div className={styles.selectList}>
          {midias.length > 0 ? (
            midias.map((doc) => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={tempStates.selectedMidias.includes(
                    doc.id.toString()
                  )}
                  onChange={(e) =>
                    handleMidiaChange(doc.id.toString(), e.target.checked)
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
            <p className={styles.noData}>Nenhuma mídia encontrada.</p>
          )}
        </div>
      </div>
    </>
  );
}
