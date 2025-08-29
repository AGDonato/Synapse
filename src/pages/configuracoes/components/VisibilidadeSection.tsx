import React from 'react';
import Button from '../../../components/ui/Button';
import { getAllSecaoConfigs } from '../../../data/documentoRegras';
import { theme } from '../../../styles/theme';
import styles from '../RegrasPage.module.css';

interface VisibilidadeSectionProps {
  isDirtyDocumento: boolean;
  onVisibilityChange: (
    key: string,
    section: 'section2' | 'section3' | 'section4',
    checked: boolean
  ) => void;
  onSaveChanges: () => void;
}

export const VisibilidadeSection: React.FC<VisibilidadeSectionProps> = ({
  isDirtyDocumento,
  onVisibilityChange,
  onSaveChanges,
}) => {
  return (
    <div className={styles.tabContent}>
      <h4 className={styles.subSectionTitle}>Configurar Visibilidade de Seções</h4>
      <p
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.text.secondary,
          margin: 0,
          lineHeight: '1.4',
          marginBottom: theme.spacing.lg,
        }}
      >
        Defina quais seções devem aparecer para cada combinação Documento → Assunto
      </p>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader} style={{ width: '25%' }}>
                Tipo de Documento
              </th>
              <th className={styles.tableHeader} style={{ width: '35%' }}>
                Assunto
              </th>
              <th className={styles.tableHeader} style={{ width: '13%', textAlign: 'center' }}>
                Seção 2
              </th>
              <th className={styles.tableHeader} style={{ width: '13%', textAlign: 'center' }}>
                Seção 3
              </th>
              <th className={styles.tableHeader} style={{ width: '14%', textAlign: 'center' }}>
                Seção 4
              </th>
            </tr>
          </thead>
          <tbody>
            {getAllSecaoConfigs().map(config => (
              <tr key={config.key}>
                <td
                  className={styles.tableCell}
                  style={{
                    width: '25%',
                    fontWeight: theme.fontWeight.semibold,
                  }}
                >
                  {config.tipoDocumento}
                </td>
                <td className={styles.tableCell} style={{ width: '35%' }}>
                  {config.assunto || 'SEM_ASSUNTO'}
                </td>
                <td className={styles.tableCell} style={{ width: '13%', textAlign: 'center' }}>
                  <input
                    type='checkbox'
                    checked={config.visibility.section2}
                    onChange={e => onVisibilityChange(config.key, 'section2', e.target.checked)}
                    className={styles.checkboxInput}
                  />
                </td>
                <td className={styles.tableCell} style={{ width: '13%', textAlign: 'center' }}>
                  <input
                    type='checkbox'
                    checked={config.visibility.section3}
                    onChange={e => onVisibilityChange(config.key, 'section3', e.target.checked)}
                    className={styles.checkboxInput}
                  />
                </td>
                <td className={styles.tableCell} style={{ width: '14%', textAlign: 'center' }}>
                  <input
                    type='checkbox'
                    checked={config.visibility.section4}
                    onChange={e => onVisibilityChange(config.key, 'section4', e.target.checked)}
                    className={styles.checkboxInput}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.buttonContainer}>
        <Button onClick={onSaveChanges} disabled={!isDirtyDocumento} variant='primary'>
          Salvar
        </Button>
      </div>
    </div>
  );
};
