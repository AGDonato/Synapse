// src/pages/NovaDemandaPage/components/FormularioSecaoResponsaveis.tsx
import type { Option } from '../../../components/forms/SearchableSelect';
import type { DropdownState, SelectedIndexState } from '../hooks/useFormularioEstado';
import styles from '../../NovaDemandaPage.module.css';

interface FormularioSecaoResponsaveisProps {
  formData: {
    analista: Option | null;
    distribuidor: Option | null;
  };
  dropdownOpen: DropdownState;
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>;
  selectedIndex: SelectedIndexState;
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>;
  toggleDropdown: (field: 'tipoDemanda' | 'analista' | 'distribuidor') => void;
  handleAnalistaSelect: (analista: { id: number; nome: string }) => void;
  handleDistribuidorSelect: (distribuidor: { id: number; nome: string }) => void;
  handleDropdownKeyDown: (
    e: React.KeyboardEvent,
    field: 'tipoDemanda' | 'analista' | 'distribuidor',
    options: { id: number; nome: string }[],
    selectCallback: (option: { id: number; nome: string }) => void
  ) => void;
  mockAnalistas: { id: number; nome: string }[];
  mockDistribuidores: { id: number; nome: string }[];
}

export const FormularioSecaoResponsaveis = ({
  formData,
  dropdownOpen,
  setDropdownOpen,
  selectedIndex,
  setSelectedIndex,
  toggleDropdown,
  handleAnalistaSelect,
  handleDistribuidorSelect,
  handleDropdownKeyDown,
  mockAnalistas,
  mockDistribuidores,
}: FormularioSecaoResponsaveisProps) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>04</span>
        <h3 className={styles.sectionTitle}>Responsáveis</h3>
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Analista <span className={styles.required}>*</span>
          </label>
          <div className={styles.multiSelectContainer}>
            <div
              className={styles.multiSelectTrigger}
              onClick={() => toggleDropdown('analista')}
              tabIndex={0}
              data-dropdown='analista'
              onKeyDown={e => {
                if (dropdownOpen.analista && e.key === 'Enter' && selectedIndex.analista >= 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectedIndex.analista < mockAnalistas.length) {
                    handleAnalistaSelect(mockAnalistas[selectedIndex.analista]);
                  }
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!dropdownOpen.analista) {
                    e.stopPropagation();
                  }
                  toggleDropdown('analista');
                } else if (e.key === 'Tab') {
                  setDropdownOpen((prev: DropdownState) => ({ ...prev, analista: false }));
                  setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, analista: -1 }));
                } else if (
                  dropdownOpen.analista &&
                  (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                ) {
                  handleDropdownKeyDown(e, 'analista', mockAnalistas, handleAnalistaSelect);
                } else {
                  handleDropdownKeyDown(e, 'analista', mockAnalistas, handleAnalistaSelect);
                }
              }}
            >
              <span>{formData.analista?.nome ?? ''}</span>
              <span className={styles.dropdownArrow}>{dropdownOpen.analista ? '▲' : '▼'}</span>
            </div>
            {dropdownOpen.analista && (
              <div
                className={styles.multiSelectDropdown}
                tabIndex={0}
                data-dropdown='analista'
                onKeyDown={e =>
                  handleDropdownKeyDown(e, 'analista', mockAnalistas, handleAnalistaSelect)
                }
              >
                {mockAnalistas.map((analista, index) => (
                  <label
                    key={analista.id}
                    className={`${styles.checkboxLabel} ${
                      selectedIndex.analista === index ? styles.checkboxLabelFocused : ''
                    }`}
                    onClick={() => handleAnalistaSelect(analista)}
                  >
                    <span className={styles.checkboxText}>{analista.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Distribuidor <span className={styles.required}>*</span>
          </label>
          <div className={styles.multiSelectContainer}>
            <div
              className={styles.multiSelectTrigger}
              onClick={() => toggleDropdown('distribuidor')}
              tabIndex={0}
              data-dropdown='distribuidor'
              onKeyDown={e => {
                if (
                  dropdownOpen.distribuidor &&
                  e.key === 'Enter' &&
                  selectedIndex.distribuidor >= 0
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectedIndex.distribuidor < mockDistribuidores.length) {
                    handleDistribuidorSelect(mockDistribuidores[selectedIndex.distribuidor]);
                  }
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!dropdownOpen.distribuidor) {
                    e.stopPropagation();
                  }
                  toggleDropdown('distribuidor');
                } else if (e.key === 'Tab') {
                  setDropdownOpen((prev: DropdownState) => ({ ...prev, distribuidor: false }));
                  setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, distribuidor: -1 }));
                } else if (
                  dropdownOpen.distribuidor &&
                  (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                ) {
                  handleDropdownKeyDown(
                    e,
                    'distribuidor',
                    mockDistribuidores,
                    handleDistribuidorSelect
                  );
                } else {
                  handleDropdownKeyDown(
                    e,
                    'distribuidor',
                    mockDistribuidores,
                    handleDistribuidorSelect
                  );
                }
              }}
            >
              <span>{formData.distribuidor?.nome ?? ''}</span>
              <span className={styles.dropdownArrow}>{dropdownOpen.distribuidor ? '▲' : '▼'}</span>
            </div>
            {dropdownOpen.distribuidor && (
              <div
                className={styles.multiSelectDropdown}
                tabIndex={0}
                data-dropdown='distribuidor'
                onKeyDown={e =>
                  handleDropdownKeyDown(
                    e,
                    'distribuidor',
                    mockDistribuidores,
                    handleDistribuidorSelect
                  )
                }
              >
                {mockDistribuidores.map((distribuidor, index) => (
                  <label
                    key={distribuidor.id}
                    className={`${styles.checkboxLabel} ${
                      selectedIndex.distribuidor === index ? styles.checkboxLabelFocused : ''
                    }`}
                    onClick={() => handleDistribuidorSelect(distribuidor)}
                  >
                    <span className={styles.checkboxText}>{distribuidor.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
