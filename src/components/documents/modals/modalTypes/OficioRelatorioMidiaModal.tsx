import type { ModalContentProps } from '../types';
import { convertToBrazilianDate, convertToHTMLDate } from '../utils';
import styles from '../DocumentUpdateModal.module.css';

export default function OficioRelatorioMidiaModal({
  tempStates,
  setTempStates,
  documentosDemanda,
}: ModalContentProps) {
  const relatoriosTecnicos = documentosDemanda.filter(
    doc => doc.tipoDocumento === 'Relatório Técnico'
  );

  const midias = documentosDemanda.filter(doc => doc.tipoDocumento === 'Mídia');

  const handleRelatorioChange = (docId: string, checked: boolean) => {
    setTempStates(prev => ({
      ...prev,
      selectedRelatoriosTecnicos: checked
        ? [...prev.selectedRelatoriosTecnicos, docId]
        : prev.selectedRelatoriosTecnicos.filter(id => id !== docId),
    }));
  };

  const handleMidiaChange = (docId: string, checked: boolean) => {
    setTempStates(prev => ({
      ...prev,
      selectedMidias: checked
        ? [...prev.selectedMidias, docId]
        : prev.selectedMidias.filter(id => id !== docId),
    }));
  };

  const handleDataEnvioChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 3 && formatted.length <= 4) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    } else if (formatted.length >= 5) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
    }

    setTempStates(prev => ({
      ...prev,
      dataEnvioFormatted: formatted,
      dataEnvio:
        formatted.length === 10 ? convertToHTMLDate(formatted) : formatted,
    }));
  };

  const handleDataEnvioCalendarChange = (value: string) => {
    setTempStates(prev => ({
      ...prev,
      dataEnvio: value,
      dataEnvioFormatted: convertToBrazilianDate(value),
    }));
  };

  return (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="numeroAtena" className={styles.formLabel}>
          Número no Atena
        </label>
        <input
          type="text"
          id="numeroAtena"
          value={tempStates.numeroAtena}
          onChange={e =>
            setTempStates(prev => ({
              ...prev,
              numeroAtena: e.target.value,
            }))
          }
          className={styles.formInput}
          placeholder="Ex: AT12345"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="dataEnvio" className={styles.formLabel}>
          Data de Envio
        </label>
        <div className={styles.dateInputWrapper}>
          <input
            type="text"
            id="dataEnvio"
            value={tempStates.dataEnvioFormatted}
            onChange={e => handleDataEnvioChange(e.target.value)}
            className={styles.formInput}
            placeholder="dd/mm/aaaa"
            maxLength={10}
          />
          <input
            type="date"
            value={convertToHTMLDate(tempStates.dataEnvioFormatted)}
            onChange={e => handleDataEnvioCalendarChange(e.target.value)}
            className={styles.hiddenDateInput}
            tabIndex={-1}
          />
          <button
            type="button"
            className={styles.calendarButton}
            onClick={e => {
              const wrapper = e.currentTarget.parentElement;
              const dateInput = wrapper?.querySelector(
                'input[type="date"]'
              )!;
              if (dateInput?.showPicker) {
                dateInput.showPicker();
              }
            }}
            title="Abrir calendário"
            tabIndex={-1}
          >
            📅
          </button>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Selecione os Relatórios Técnicos
        </label>
        <div className={styles.selectList}>
          {relatoriosTecnicos.length > 0 ? (
            relatoriosTecnicos.map(doc => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={tempStates.selectedRelatoriosTecnicos.includes(
                    doc.id.toString()
                  )}
                  onChange={e =>
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
              Nenhum relatório técnico encontrado.
            </p>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Selecione as Mídias</label>
        <div className={styles.selectList}>
          {midias.length > 0 ? (
            midias.map(doc => (
              <label key={doc.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={tempStates.selectedMidias.includes(
                    doc.id.toString()
                  )}
                  onChange={e =>
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
