import React from 'react';
import Button from '../../../components/ui/Button';
import { mockAssuntos } from '../../../data/mockAssuntos';
import { mockTiposDocumentos } from '../../../data/mockTiposDocumentos';
import { isAssuntoAssociadoAoDocumento } from '../../../data/documentoRegras';
import styles from '../RegrasPage.module.css';

interface AssuntosDocumentosSectionProps {
  selectedAssuntoId: number | null;
  isDirtyAssuntos: boolean;
  onAssuntoSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAssuntoDocChange: (tipoDocumentoNome: string) => void;
  onSaveChanges: () => void;
}

export const AssuntosDocumentosSection: React.FC<AssuntosDocumentosSectionProps> = ({
  selectedAssuntoId,
  isDirtyAssuntos,
  onAssuntoSelect,
  onAssuntoDocChange,
  onSaveChanges,
}) => {
  return (
    <div className={styles.tabContent}>
      <h4 className={styles.subSectionTitle}>Regras de Assunto x Tipo de Documento</h4>

      <div className={styles.formGroup}>
        <label className={styles.label}>Selecione um Assunto para configurar:</label>
        <select onChange={onAssuntoSelect} className={styles.select} defaultValue=''>
          <option value='' disabled>
            Escolha um assunto...
          </option>
          {mockAssuntos.map(assunto => (
            <option key={assunto.id} value={assunto.id}>
              {assunto.nome}
            </option>
          ))}
        </select>

        {selectedAssuntoId && (
          <div style={{ marginTop: '1rem' }}>
            <h5
              style={{
                fontSize: '0.875rem',
                marginBottom: '0.75rem',
              }}
            >
              Tipos de Documentos relacionados:
            </h5>
            <div className={styles.checkboxContainer}>
              {mockTiposDocumentos.map(tipoDoc => {
                const assuntoSelecionado = mockAssuntos.find(a => a.id === selectedAssuntoId);
                const isChecked = assuntoSelecionado
                  ? isAssuntoAssociadoAoDocumento(assuntoSelecionado.nome, tipoDoc.nome)
                  : false;
                return (
                  <label key={tipoDoc.id} className={styles.checkboxLabel}>
                    <input
                      type='checkbox'
                      checked={isChecked}
                      onChange={() => onAssuntoDocChange(tipoDoc.nome)}
                      className={styles.checkboxInput}
                    />
                    <span className={styles.checkboxText}>{tipoDoc.nome}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.buttonContainer}>
        <Button onClick={onSaveChanges} disabled={!isDirtyAssuntos} variant='primary'>
          Salvar
        </Button>
      </div>
    </div>
  );
};
