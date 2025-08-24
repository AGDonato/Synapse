// src/pages/NovoDocumentoPage/components/shared/DocumentFormHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../NovoDocumentoPage.module.css';

interface DocumentFormHeaderProps {
  isEditMode: boolean;
  demandaId?: string;
  demandaIdFromQuery?: string;
}

const DocumentFormHeader: React.FC<DocumentFormHeaderProps> = React.memo(
  ({ isEditMode, demandaId, demandaIdFromQuery }) => {
    const navigate = useNavigate();

    return (
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>
          {isEditMode ? 'Editar Documento' : 'Novo Documento'} - SGED{' '}
          {demandaId || demandaIdFromQuery || '23412'}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className={styles.backButton}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
          Voltar
        </button>
      </div>
    );
  }
);

DocumentFormHeader.displayName = 'DocumentFormHeader';

export default DocumentFormHeader;
