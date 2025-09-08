import React from 'react';
import { MdSearchOff } from 'react-icons/md';
import Button from '../../../shared/components/ui/Button';
import { mockOrgaos } from '../../../shared/data/mockOrgaos';
import { type RegraOrgao } from '../../../shared/data/mockRegrasOrgaos';
import styles from '../RegrasPage.module.css';

interface OrgaosSectionProps {
  regrasOrgaos: RegraOrgao[];
  isDirtyOrgaos: boolean;
  searchTermOrgaos: string;
  onSearchChange: (value: string) => void;
  onRuleChange: (
    orgaoId: number,
    field: 'isSolicitante' | 'isOrgaoJudicial',
    value: boolean
  ) => void;
  onSaveChanges: () => void;
}

export const OrgaosSection: React.FC<OrgaosSectionProps> = ({
  regrasOrgaos,
  isDirtyOrgaos,
  searchTermOrgaos,
  onSearchChange,
  onRuleChange,
  onSaveChanges,
}) => {
  const filteredOrgaos = mockOrgaos.filter(o =>
    o.nomeCompleto.toLowerCase().includes(searchTermOrgaos.toLowerCase())
  );

  return (
    <div className={styles.sectionContent}>
      <div className={styles.searchContainer}>
        <input
          type='text'
          placeholder='Buscar órgãos...'
          value={searchTermOrgaos}
          onChange={e => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Nome do Órgão</th>
              <th className={styles.tableHeader} style={{ textAlign: 'center', width: '20%' }}>
                É Solicitante?
              </th>
              <th className={styles.tableHeader} style={{ textAlign: 'center', width: '20%' }}>
                É Órgão Judicial?
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrgaos.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className={styles.noResults}
                  style={{
                    textAlign: 'center',
                    padding: `${'1.5rem'} ${'1rem'}`,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <MdSearchOff size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <br />
                  Nenhum órgão encontrado.
                </td>
              </tr>
            ) : (
              filteredOrgaos.map(orgao => {
                const regraAtual = regrasOrgaos.find(r => r.orgaoId === orgao.id);

                return (
                  <tr key={orgao.id}>
                    <td className={styles.tableCell}>{orgao.nomeCompleto}</td>
                    <td className={styles.tableCell} style={{ textAlign: 'center', width: '20%' }}>
                      <input
                        type='checkbox'
                        checked={regraAtual?.isSolicitante ?? false}
                        onChange={e => onRuleChange(orgao.id, 'isSolicitante', e.target.checked)}
                        className={styles.checkboxInput}
                      />
                    </td>
                    <td className={styles.tableCell} style={{ textAlign: 'center', width: '20%' }}>
                      <input
                        type='checkbox'
                        checked={regraAtual?.isOrgaoJudicial ?? false}
                        onChange={e => onRuleChange(orgao.id, 'isOrgaoJudicial', e.target.checked)}
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
        <Button onClick={onSaveChanges} disabled={!isDirtyOrgaos} variant='primary'>
          Salvar
        </Button>
      </div>
    </div>
  );
};
