import React from 'react';
import { MdSearchOff } from 'react-icons/md';
import Button from '../../../shared/components/ui/Button';
import { mockAutoridades } from '../../../shared/data/mockAutoridades';
import { type RegraAutoridade } from '../../../shared/data/mockRegrasAutoridades';
import styles from '../RegrasPage.module.css';

interface AutoridadesSectionProps {
  regrasAutoridades: RegraAutoridade[];
  isDirtyAutoridades: boolean;
  searchTermAutoridades: string;
  onSearchChange: (value: string) => void;
  onRuleChange: (autoridadeId: number, value: boolean) => void;
  onSaveChanges: () => void;
}

export const AutoridadesSection: React.FC<AutoridadesSectionProps> = ({
  regrasAutoridades,
  isDirtyAutoridades,
  searchTermAutoridades,
  onSearchChange,
  onRuleChange,
  onSaveChanges,
}) => {
  const filteredAutoridades = mockAutoridades.filter(aut =>
    aut.nome.toLowerCase().includes(searchTermAutoridades.toLowerCase())
  );

  return (
    <div className={styles.sectionContent}>
      <div className={styles.searchContainer}>
        <input
          type='text'
          placeholder='Buscar autoridades...'
          value={searchTermAutoridades}
          onChange={e => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Nome da Autoridade</th>
              <th className={styles.tableHeader} style={{ textAlign: 'center', width: '30%' }}>
                É Autoridade Judicial?
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAutoridades.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className={styles.noResults}
                  style={{
                    textAlign: 'center',
                    padding: `${'1.5rem'} ${'1rem'}`,
                    color: '#64748b',
                  }}
                >
                  <MdSearchOff size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <br />
                  Nenhuma autoridade encontrada.
                </td>
              </tr>
            ) : (
              filteredAutoridades.map(autoridade => {
                const regraAtual = regrasAutoridades.find(r => r.autoridadeId === autoridade.id);

                return (
                  <tr key={autoridade.id}>
                    <td className={styles.tableCell}>{autoridade.nome}</td>
                    <td className={styles.tableCell} style={{ textAlign: 'center', width: '30%' }}>
                      <input
                        type='checkbox'
                        checked={regraAtual?.isAutoridadeJudicial ?? false}
                        onChange={e => onRuleChange(autoridade.id, e.target.checked)}
                        className={styles.checkboxInput}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.buttonContainer}>
        <Button onClick={onSaveChanges} disabled={!isDirtyAutoridades} variant='primary'>
          Salvar
        </Button>
      </div>
    </div>
  );
};
