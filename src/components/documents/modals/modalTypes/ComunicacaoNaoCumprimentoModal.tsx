import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function ComunicacaoNaoCumprimentoModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  // Filtrar ofícios e ofícios circulares de encaminhamento de decisão judicial pendentes
  const encaminhamentosPendentes = documentosDemanda.filter(doc => {
    const isCorrectSubject =
      doc.assunto === 'Encaminhamento de decisão judicial';

    if (doc.tipoDocumento === 'Ofício') {
      // Deve ter sido enviado mas não respondido
      return isCorrectSubject && !!doc.dataEnvio && !doc.respondido;
    }

    if (doc.tipoDocumento === 'Ofício Circular') {
      // Deve ter pelo menos um destinatário enviado mas não respondido
      // Usar mesma lógica da exibição: (!dest.respondido || !dest.dataResposta) && dest.dataEnvio
      return (
        isCorrectSubject &&
        doc.destinatariosData?.some(
          dest =>
            (!dest.respondido || !dest.dataResposta) &&
            dest.dataEnvio &&
            dest.dataEnvio !== ''
        )
      );
    }

    return false;
  });

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setTempStates(prev => ({
      ...prev,
      selectedDecisoes: checked
        ? [...prev.selectedDecisoes, docId]
        : prev.selectedDecisoes.filter(id => id !== docId),
    }));
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>
        Selecione os encaminhamentos de decisões judiciais não respondidos
      </label>
      <div className={styles.selectList}>
        {encaminhamentosPendentes.length > 0 ? (
          encaminhamentosPendentes.map(doc => (
            <label key={doc.id} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={tempStates.selectedDecisoes.includes(
                  doc.id.toString()
                )}
                onChange={e =>
                  handleCheckboxChange(doc.id.toString(), e.target.checked)
                }
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                {doc.numeroDocumento} - {doc.tipoDocumento}
                {doc.tipoDocumento === 'Ofício' && ` - ${doc.destinatario}`}
              </span>
            </label>
          ))
        ) : (
          <p className={styles.noData}>
            Nenhum encaminhamento de decisão judicial pendente encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
