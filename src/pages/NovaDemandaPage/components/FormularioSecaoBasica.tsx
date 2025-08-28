// src/pages/NovaDemandaPage/components/FormularioSecaoBasica.tsx
import type { Option } from '../../../components/forms/SearchableSelect';
import type { FormDataState } from '../hooks/useFormularioEstado';
import styles from '../../NovaDemandaPage.module.css';

interface DropdownState {
  tipoDemanda: boolean;
  analista: boolean;
  distribuidor: boolean;
}

interface SearchState {
  solicitante: string[];
}

interface ShowResultsState {
  solicitante: boolean;
}

interface SelectedIndexState {
  solicitante: number;
  tipoDemanda: number;
  analista: number;
  distribuidor: number;
}

interface FormularioSecaoBasicaProps {
  formData: {
    tipoDemanda: Option | null;
    solicitante: Option | null;
    dataInicial: string;
    descricao: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  dropdownOpen: DropdownState;
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>;
  selectedIndex: SelectedIndexState;
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>;
  searchResults: SearchState;
  showResults: ShowResultsState;
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>;
  handleSolicitanteSearch: (query: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, callback: (value: string) => void) => void;
  selectSolicitanteResult: (value: string) => void;
  closeOtherDropdowns: () => void;
  handleDateChange: (value: string) => void;
  handleCalendarChange: (value: string) => void;
  convertToHTMLDate: (dateStr: string) => string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  toggleDropdown: (field: 'tipoDemanda' | 'analista' | 'distribuidor') => void;
  handleTipoDemandaSelect: (tipo: { id: number; nome: string }) => void;
  handleDropdownKeyDown: (
    e: React.KeyboardEvent,
    field: 'tipoDemanda' | 'analista' | 'distribuidor',
    options: { id: number; nome: string }[],
    selectCallback: (option: { id: number; nome: string }) => void
  ) => void;
  mockTiposDemandas: { id: number; nome: string }[];
}

export const FormularioSecaoBasica = ({
  formData,
  setFormData,
  dropdownOpen,
  setDropdownOpen,
  selectedIndex,
  setSelectedIndex,
  searchResults,
  showResults,
  handleSolicitanteSearch,
  handleKeyDown,
  selectSolicitanteResult,
  closeOtherDropdowns,
  handleDateChange,
  handleCalendarChange,
  convertToHTMLDate,
  handleChange,
  toggleDropdown,
  handleTipoDemandaSelect,
  handleDropdownKeyDown,
  mockTiposDemandas,
}: FormularioSecaoBasicaProps) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>01</span>
        <h3 className={styles.sectionTitle}>Informações Básicas</h3>
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Tipo de Demanda <span className={styles.required}>*</span>
          </label>
          <div className={styles.multiSelectContainer}>
            <div
              className={styles.multiSelectTrigger}
              onClick={() => toggleDropdown('tipoDemanda')}
              tabIndex={0}
              data-dropdown="tipoDemanda"
              onKeyDown={e => {
                if (
                  dropdownOpen.tipoDemanda &&
                  e.key === 'Enter' &&
                  selectedIndex.tipoDemanda >= 0
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectedIndex.tipoDemanda < mockTiposDemandas.length) {
                    handleTipoDemandaSelect(mockTiposDemandas[selectedIndex.tipoDemanda]);
                  }
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!dropdownOpen.tipoDemanda) {
                    e.stopPropagation();
                  }
                  toggleDropdown('tipoDemanda');
                } else if (e.key === 'Tab') {
                  setDropdownOpen((prev: DropdownState) => ({ ...prev, tipoDemanda: false }));
                  setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, tipoDemanda: -1 }));
                } else if (
                  dropdownOpen.tipoDemanda &&
                  (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                ) {
                  handleDropdownKeyDown(e, 'tipoDemanda', mockTiposDemandas, handleTipoDemandaSelect);
                } else {
                  handleDropdownKeyDown(e, 'tipoDemanda', mockTiposDemandas, handleTipoDemandaSelect);
                }
              }}
            >
              <span>{formData.tipoDemanda?.nome ?? ''}</span>
              <span className={styles.dropdownArrow}>
                {dropdownOpen.tipoDemanda ? '▲' : '▼'}
              </span>
            </div>
            {dropdownOpen.tipoDemanda && (
              <div
                className={styles.multiSelectDropdown}
                tabIndex={0}
                data-dropdown="tipoDemanda"
                onKeyDown={e =>
                  handleDropdownKeyDown(e, 'tipoDemanda', mockTiposDemandas, handleTipoDemandaSelect)
                }
              >
                {mockTiposDemandas.map((tipo, index) => (
                  <label
                    key={tipo.id}
                    className={`${styles.checkboxLabel} ${
                      selectedIndex.tipoDemanda === index ? styles.checkboxLabelFocused : ''
                    }`}
                    onClick={() => handleTipoDemandaSelect(tipo)}
                  >
                    <span className={styles.checkboxText}>{tipo.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Solicitante <span className={styles.required}>*</span>
          </label>
          <div className={styles.searchContainer} data-field="solicitante">
            <input
              type="text"
              value={formData.solicitante?.nome ?? ''}
              onChange={e => {
                const valor = e.target.value;
                setFormData((prev: FormDataState) => ({
                  ...prev,
                  solicitante: valor.trim() ? { id: 0, nome: valor } : null,
                }));
                handleSolicitanteSearch(valor);
              }}
              onKeyDown={e => handleKeyDown(e, value => selectSolicitanteResult(value))}
              onFocus={() => {
                closeOtherDropdowns();
              }}
              className={styles.formInput}
              placeholder=""
              autoComplete="off"
            />
            {showResults.solicitante && (
              <div className={styles.searchResults}>
                {searchResults.solicitante.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.searchResultItem} ${
                      selectedIndex.solicitante === index ? styles.searchResultItemSelected : ''
                    }`}
                    onClick={() => selectSolicitanteResult(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Data Inicial <span className={styles.required}>*</span>
          </label>
          <div className={styles.dateInputWrapper}>
            <input
              type="text"
              value={formData.dataInicial}
              onChange={e => handleDateChange(e.target.value)}
              className={styles.formInput}
              placeholder="dd/mm/aaaa"
              maxLength={10}
              autoComplete="off"
            />
            <input
              type="date"
              value={convertToHTMLDate(formData.dataInicial)}
              onChange={e => handleCalendarChange(e.target.value)}
              className={styles.hiddenDateInput}
              tabIndex={-1}
            />
            <button
              type="button"
              className={styles.calendarButton}
              tabIndex={-1}
              onClick={e => {
                const wrapper = e.currentTarget.parentElement;
                const dateInput = wrapper?.querySelector('input[type="date"]') as HTMLInputElement;
                if (dateInput && 'showPicker' in dateInput) {
                  (dateInput as any).showPicker();
                }
              }}
              title="Abrir calendário"
            >
              📅
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="descricao">
            Descrição <span className={styles.required}>*</span>
          </label>
          <textarea
            name="descricao"
            id="descricao"
            value={formData.descricao}
            onChange={handleChange}
            className={styles.formTextarea}
            autoComplete="off"
            maxLength={240}
          />
          <div className={styles.characterCount}>{formData.descricao.length}/240</div>
        </div>
      </div>
    </div>
  );
};