// src/pages/NovoDocumentoPage/components/sections/DocumentTypeSection.tsx

import React from 'react';
import MultiSelectDropdown from '../../../../components/forms/MultiSelectDropdown';
import type { MultiSelectOption } from '../../../../components/forms/MultiSelectDropdown';
import type { DocumentFormData } from '../../hooks/useDocumentForm';
import { mockTiposDocumentos } from '../../../../data/mockTiposDocumentos';
import { documentoAssuntoConfig } from '../../../../data/documentoRegras';
import styles from '../../NovoDocumentoPage.module.css';

interface DocumentTypeSectionProps {
  formData: DocumentFormData;
  dropdownOpen: { [key: string]: boolean };
  selectedIndex: { [key: string]: number };
  searchResults: { [key: string]: string[] };
  showResults: { [key: string]: boolean };
  destinatarios: string[];
  destinatariosOptions: MultiSelectOption[];
  enderecamentosDisponiveis: string[];
  analistas: string[];

  // Event handlers
  onInputChange: (field: keyof DocumentFormData, value: unknown) => void;
  onSearchFieldChange: (field: string, value: string) => void;
  onSearch: (
    fieldId: string,
    query: string,
    dataSource: string[],
    searchFields?: string[]
  ) => void;
  onKeyDown: (
    e: React.KeyboardEvent,
    fieldId: string,
    callback: (value: string) => void
  ) => void;
  onSelectSearchResult: (field: string, value: string) => void;
  onCloseOtherSearchResults: (currentFieldId: string) => void;

  // Dropdown handlers
  toggleDropdown: (field: string) => void;
  handleTipoDocumentoSelect: (tipo: string) => void;
  handleAssuntoSelect: (assunto: string) => void;
  handleAnoDocumentoSelect: (ano: string) => void;
  handleAnalistaSelect: (analista: string) => void;
}

const DocumentTypeSection: React.FC<DocumentTypeSectionProps> = React.memo(
  ({
    formData,
    dropdownOpen,
    selectedIndex,
    searchResults,
    showResults,
    destinatarios,
    destinatariosOptions,
    enderecamentosDisponiveis,
    analistas,
    onInputChange,
    onSearchFieldChange,
    onSearch,
    onKeyDown,
    onSelectSearchResult,
    onCloseOtherSearchResults,
    toggleDropdown,
    handleTipoDocumentoSelect,
    handleAssuntoSelect,
    handleAnoDocumentoSelect,
    handleAnalistaSelect,
  }) => {
    // Get available subjects based on document type
    const assuntosDisponiveis = formData.tipoDocumento
      ? (
          documentoAssuntoConfig as unknown as Record<
            string,
            { assuntos: string[] }
          >
        )[formData.tipoDocumento]?.assuntos || []
      : [];

    // Generate year options
    const generateYearOptions = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = currentYear; year >= currentYear - 10; year--) {
        years.push(year);
      }
      return years;
    };

    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <span className={styles.sectionIcon}>01</span>
            <h2 className={styles.sectionTitle}>Informações do Documento</h2>
          </div>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.formGrid2}>
            {/* Tipo de Documento */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Tipo de Documento <span className={styles.required}>*</span>
              </label>
              <div className={styles.customDropdownContainer}>
                <div
                  className={`${styles.customDropdownTrigger} ${
                    dropdownOpen.tipoDocumento
                      ? styles.customDropdownTriggerOpen
                      : ''
                  }`}
                  onClick={() => toggleDropdown('tipoDocumento')}
                  tabIndex={0}
                >
                  <span>{formData.tipoDocumento || 'Selecione um tipo'}</span>
                  <span className={styles.customDropdownArrow}>▼</span>
                </div>

                {dropdownOpen.tipoDocumento && (
                  <div className={styles.customDropdownMenu}>
                    <label
                      className={`${styles.checkboxLabel} ${
                        formData.tipoDocumento === ''
                          ? styles.checkboxLabelFocused
                          : ''
                      }`}
                      onClick={() => handleTipoDocumentoSelect('')}
                    >
                      <span className={styles.checkboxText}>&nbsp;</span>
                    </label>

                    {mockTiposDocumentos.map(tipo => (
                      <label
                        key={tipo.id}
                        className={`${styles.checkboxLabel} ${
                          formData.tipoDocumento === tipo.nome
                            ? styles.checkboxLabelFocused
                            : ''
                        }`}
                        onClick={() => handleTipoDocumentoSelect(tipo.nome)}
                      >
                        <span className={styles.checkboxText}>{tipo.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assunto */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Assunto <span className={styles.required}>*</span>
              </label>
              <div className={styles.customDropdownContainer}>
                <div
                  className={`${styles.customDropdownTrigger} ${
                    dropdownOpen.assunto ? styles.customDropdownTriggerOpen : ''
                  } ${!formData.tipoDocumento ? styles.customDropdownTriggerDisabled : ''}`}
                  onClick={() =>
                    formData.tipoDocumento && toggleDropdown('assunto')
                  }
                  tabIndex={0}
                >
                  <span>{formData.assunto || 'Selecione um assunto'}</span>
                  <span className={styles.customDropdownArrow}>▼</span>
                </div>

                {dropdownOpen.assunto && formData.tipoDocumento && (
                  <div className={styles.customDropdownMenu}>
                    <label
                      className={`${styles.checkboxLabel} ${
                        formData.assunto === ''
                          ? styles.checkboxLabelFocused
                          : ''
                      }`}
                      onClick={() => handleAssuntoSelect('')}
                    >
                      <span className={styles.checkboxText}>&nbsp;</span>
                    </label>

                    {assuntosDisponiveis.map((assunto: string) => (
                      <label
                        key={assunto}
                        className={`${styles.checkboxLabel} ${
                          formData.assunto === assunto
                            ? styles.checkboxLabelFocused
                            : ''
                        }`}
                        onClick={() => handleAssuntoSelect(assunto)}
                      >
                        <span className={styles.checkboxText}>{assunto}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assunto Outros - só aparece quando assunto é "Outros" */}
          {formData.assunto === 'Outros' && (
            <div className={styles.formGrid1}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Especificar Assunto <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.assuntoOutros}
                  onChange={e => onInputChange('assuntoOutros', e.target.value)}
                  placeholder="Descreva o assunto específico"
                />
              </div>
            </div>
          )}

          {/* Destinatário */}
          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Destinatário <span className={styles.required}>*</span>
              </label>

              {formData.tipoDocumento === 'Ofício Circular' ? (
                <MultiSelectDropdown
                  options={destinatariosOptions}
                  selectedValues={formData.destinatarios}
                  onChange={(options: MultiSelectOption[]) =>
                    onInputChange('destinatarios', options)
                  }
                  placeholder="Selecione os destinatários"
                  searchPlaceholder="Buscar destinatários..."
                />
              ) : (
                <div
                  className={styles.searchContainer}
                  data-field="destinatario"
                >
                  <input
                    type="text"
                    value={formData.destinatario?.nome || ''}
                    onChange={e => {
                      onSearchFieldChange('destinatario', e.target.value);
                      onSearch('destinatario', e.target.value, destinatarios, [
                        'nome',
                        'nomeFantasia',
                      ]);
                    }}
                    onKeyDown={e =>
                      onKeyDown(e, 'destinatario', value =>
                        onSelectSearchResult('destinatario', value)
                      )
                    }
                    onFocus={() => onCloseOtherSearchResults('destinatario')}
                    className={styles.formInput}
                    placeholder="Digite para pesquisar..."
                  />
                  {showResults.destinatario && (
                    <div className={styles.searchResults}>
                      {searchResults.destinatario?.map((item, index) => (
                        <div
                          key={index}
                          className={`${styles.searchResultItem} ${
                            (selectedIndex.destinatario ?? -1) === index
                              ? styles.searchResultItemSelected
                              : ''
                          }`}
                          onClick={() =>
                            onSelectSearchResult('destinatario', item)
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Endereçamento */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Endereçamento <span className={styles.required}>*</span>
              </label>

              {formData.tipoDocumento === 'Ofício Circular' ? (
                <div
                  className={styles.fieldDisabled}
                  onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                  onCopy={(e: React.ClipboardEvent) => e.preventDefault()}
                  tabIndex={-1}
                >
                  Respectivos departamentos jurídicos
                </div>
              ) : (
                <div
                  className={styles.searchContainer}
                  data-field="enderecamento"
                >
                  <input
                    type="text"
                    value={formData.enderecamento?.nome || ''}
                    onChange={e => {
                      onSearchFieldChange('enderecamento', e.target.value);
                      onSearch(
                        'enderecamento',
                        e.target.value,
                        enderecamentosDisponiveis,
                        ['nome']
                      );
                    }}
                    onKeyDown={e =>
                      onKeyDown(e, 'enderecamento', value =>
                        onSelectSearchResult('enderecamento', value)
                      )
                    }
                    onFocus={() => onCloseOtherSearchResults('enderecamento')}
                    className={styles.formInput}
                    placeholder="Digite para pesquisar..."
                    disabled={!formData.destinatario}
                  />
                  {showResults.enderecamento && (
                    <div className={styles.searchResults}>
                      {searchResults.enderecamento?.map((item, index) => (
                        <div
                          key={index}
                          className={`${styles.searchResultItem} ${
                            (selectedIndex.enderecamento ?? -1) === index
                              ? styles.searchResultItemSelected
                              : ''
                          }`}
                          onClick={() =>
                            onSelectSearchResult('enderecamento', item)
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Número e Ano do Documento */}
          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Número do Documento <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={formData.numeroDocumento}
                onChange={e => onInputChange('numeroDocumento', e.target.value)}
                placeholder="Ex: 123456"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Ano do Documento <span className={styles.required}>*</span>
              </label>
              <div className={styles.customDropdownContainer}>
                <div
                  className={`${styles.customDropdownTrigger} ${
                    dropdownOpen.anoDocumento
                      ? styles.customDropdownTriggerOpen
                      : ''
                  }`}
                  onClick={() => toggleDropdown('anoDocumento')}
                  tabIndex={0}
                >
                  <span>{formData.anoDocumento || 'Selecione o ano'}</span>
                  <span className={styles.customDropdownArrow}>▼</span>
                </div>

                {dropdownOpen.anoDocumento && (
                  <div className={styles.customDropdownMenu}>
                    <label
                      className={`${styles.checkboxLabel} ${
                        formData.anoDocumento === ''
                          ? styles.checkboxLabelFocused
                          : ''
                      }`}
                      onClick={() => handleAnoDocumentoSelect('')}
                    >
                      <span className={styles.checkboxText}>&nbsp;</span>
                    </label>

                    {generateYearOptions().map(year => (
                      <label
                        key={year}
                        className={`${styles.checkboxLabel} ${
                          formData.anoDocumento === year.toString()
                            ? styles.checkboxLabelFocused
                            : ''
                        }`}
                        onClick={() =>
                          handleAnoDocumentoSelect(year.toString())
                        }
                      >
                        <span className={styles.checkboxText}>{year}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analista */}
          <div className={styles.formGrid1}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Analista <span className={styles.required}>*</span>
              </label>
              <div className={styles.customDropdownContainer}>
                <div
                  className={`${styles.customDropdownTrigger} ${
                    dropdownOpen.analista
                      ? styles.customDropdownTriggerOpen
                      : ''
                  }`}
                  onClick={() => toggleDropdown('analista')}
                  tabIndex={0}
                >
                  <span>
                    {formData.analista?.nome || 'Selecione um analista'}
                  </span>
                  <span className={styles.customDropdownArrow}>▼</span>
                </div>

                {dropdownOpen.analista && (
                  <div className={styles.customDropdownMenu}>
                    {analistas.map(analista => (
                      <label
                        key={analista}
                        className={`${styles.checkboxLabel} ${
                          formData.analista?.nome === analista
                            ? styles.checkboxLabelFocused
                            : ''
                        }`}
                        onClick={() => handleAnalistaSelect(analista)}
                      >
                        <span className={styles.checkboxText}>{analista}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

DocumentTypeSection.displayName = 'DocumentTypeSection';

export default DocumentTypeSection;
