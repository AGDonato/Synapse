import type { ModalContentProps } from '../types';
import styles from '../DocumentUpdateModal.module.css';

export default function MidiaModal({ tempStates, setTempStates }: ModalContentProps) {
  // Função para formatar o valor do tamanho da mídia
  const formatTamanhoMidia = (value: string): string => {
    // Remove todos os caracteres não numéricos e vírgulas/pontos
    let cleaned = value.replace(/[^\d.,]/g, '');

    // Substitui vírgula por ponto
    cleaned = cleaned.replace(',', '.');

    // Se houver múltiplos pontos, mantém apenas o primeiro
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    return cleaned;
  };

  const handleTamanhoMidiaChange = (value: string) => {
    const formatted = formatTamanhoMidia(value);
    setTempStates(prev => ({
      ...prev,
      tamanhoMidia: formatted,
    }));
  };

  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Tamanho (MB)</label>
        <input
          type='text'
          value={tempStates.tamanhoMidia || ''}
          onChange={e => handleTamanhoMidiaChange(e.target.value)}
          className={styles.formInput}
          placeholder='Ex: 2048.50'
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Hash</label>
        <input
          type='text'
          value={tempStates.hashMidia || ''}
          onChange={e =>
            setTempStates(prev => ({
              ...prev,
              hashMidia: e.target.value,
            }))
          }
          className={styles.formInput}
          placeholder='Ex: a1b2c3d4e5...'
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabelNoBorder}>
          <input
            type='checkbox'
            checked={tempStates.apresentouDefeito}
            onChange={e =>
              setTempStates(prev => ({
                ...prev,
                apresentouDefeito: e.target.checked,
              }))
            }
            className={styles.checkbox}
          />
          <span className={styles.checkboxText}>Apresentou Defeito</span>
        </label>
      </div>
    </>
  );
}
