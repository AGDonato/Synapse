// src/pages/NovaDemandaPage/components/FormularioCompleto.tsx
import { FormularioSecaoBasica } from './FormularioSecaoBasica';
import { FormularioSecaoReferencias } from './FormularioSecaoReferencias';
import { FormularioSecaoEstatisticas } from './FormularioSecaoEstatisticas';
import { FormularioSecaoResponsaveis } from './FormularioSecaoResponsaveis';
import styles from '../../NovaDemandaPage.module.css';
import type {
  FormDataState,
  DropdownState,
  SelectedIndexState,
  SearchState as SearchResultsState,
  ShowResultsState,
} from '../hooks/useFormularioEstado';
import { mockAnalistas } from '../../../data/mockAnalistas';
import { mockDistribuidores } from '../../../data/mockDistribuidores';
import { mockTiposDemandas } from '../../../data/mockTiposDemandas';

interface FormularioCompletoProps {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  dropdownOpen: DropdownState;
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>;
  selectedIndex: SelectedIndexState;
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>;
  searchResults: SearchResultsState;
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
  handleNumericChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleDropdown: (field: 'tipoDemanda' | 'analista' | 'distribuidor') => void;
  handleTipoDemandaSelect: (tipo: { id: number; nome: string }) => void;
  handleAnalistaSelect: (analista: { id: number; nome: string }) => void;
  handleDistribuidorSelect: (distribuidor: { id: number; nome: string }) => void;
  handleDropdownKeyDown: (
    e: React.KeyboardEvent,
    field: 'tipoDemanda' | 'analista' | 'distribuidor',
    options: { id: number; nome: string }[],
    selectCallback: (option: { id: number; nome: string }) => void
  ) => void;
  handleFormKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isEditMode: boolean;
}

export const FormularioCompleto = ({
  formData,
  setFormData,
  dropdownOpen,
  setDropdownOpen,
  selectedIndex,
  setSelectedIndex,
  searchResults,
  showResults,
  setShowResults,
  handleSolicitanteSearch,
  handleKeyDown,
  selectSolicitanteResult,
  closeOtherDropdowns,
  handleDateChange,
  handleCalendarChange,
  convertToHTMLDate,
  handleChange,
  handleNumericChange,
  toggleDropdown,
  handleTipoDemandaSelect,
  handleAnalistaSelect,
  handleDistribuidorSelect,
  handleDropdownKeyDown,
  handleFormKeyDown,
  handleSubmit,
  isEditMode,
}: FormularioCompletoProps) => {
  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
      <div className={styles.sectionsGrid}>
        <FormularioSecaoBasica
          formData={{
            tipoDemanda: formData.tipoDemanda,
            solicitante: formData.solicitante,
            dataInicial: formData.dataInicial,
            descricao: formData.descricao,
          }}
          setFormData={setFormData}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          searchResults={searchResults}
          showResults={showResults}
          setShowResults={setShowResults}
          handleSolicitanteSearch={handleSolicitanteSearch}
          handleKeyDown={(e, callback) => handleKeyDown(e, callback)}
          selectSolicitanteResult={selectSolicitanteResult}
          closeOtherDropdowns={closeOtherDropdowns}
          handleDateChange={handleDateChange}
          handleCalendarChange={handleCalendarChange}
          convertToHTMLDate={convertToHTMLDate}
          handleChange={handleChange}
          toggleDropdown={toggleDropdown}
          handleTipoDemandaSelect={handleTipoDemandaSelect}
          handleDropdownKeyDown={handleDropdownKeyDown}
          mockTiposDemandas={mockTiposDemandas}
        />

        <FormularioSecaoReferencias
          formData={{
            sged: formData.sged,
            autosAdministrativos: formData.autosAdministrativos,
            pic: formData.pic,
            autosJudiciais: formData.autosJudiciais,
            autosExtrajudiciais: formData.autosExtrajudiciais,
          }}
          handleChange={handleChange}
          handleNumericChange={handleNumericChange}
        />
      </div>

      <div className={styles.sectionsGrid}>
        <FormularioSecaoEstatisticas
          formData={{
            alvos: formData.alvos,
            identificadores: formData.identificadores,
          }}
          handleNumericChange={handleNumericChange}
        />

        <FormularioSecaoResponsaveis
          formData={{
            analista: formData.analista,
            distribuidor: formData.distribuidor,
          }}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          toggleDropdown={toggleDropdown}
          handleAnalistaSelect={handleAnalistaSelect}
          handleDistribuidorSelect={handleDistribuidorSelect}
          handleDropdownKeyDown={handleDropdownKeyDown}
          mockAnalistas={mockAnalistas}
          mockDistribuidores={mockDistribuidores}
        />
      </div>

      <div className={styles.submitSection}>
        <button type='submit' className={styles.submitButton}>
          {isEditMode ? 'Atualizar Demanda' : 'Cadastrar Demanda'}
        </button>
      </div>
    </form>
  );
};
