// src/pages/NovaDemandaPage.tsx
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Toast from '../components/ui/Toast';
import { useDemandasData } from '../hooks/queries/useDemandas';
import styles from './NovaDemandaPage.module.css';

// Componente do formulário completo
import { FormularioCompleto } from './NovaDemandaPage/components/FormularioCompleto';

// Hooks customizados
import { useFormularioEstado } from './NovaDemandaPage/hooks/useFormularioEstado';
import { useFormularioValidacao } from './NovaDemandaPage/hooks/useFormularioValidacao';
import { useNavegacaoTeclado } from './NovaDemandaPage/hooks/useNavegacaoTeclado';
import { useDropdownHandlers } from './NovaDemandaPage/hooks/useDropdownHandlers';
import { useDateHandlers } from './NovaDemandaPage/hooks/useDateHandlers';
import { useLoadDemandaData } from './NovaDemandaPage/hooks/useLoadDemandaData';
import { useSearchAndSaveHandlers } from './NovaDemandaPage/hooks/useSearchAndSaveHandlers';
import { useFormEffectsAndHandlers } from './NovaDemandaPage/hooks/useFormEffectsAndHandlers';

// Dados mockados
import { mockOrgaos } from '../data/mockOrgaos';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';

export default function NovaDemandaPage() {
  const { data: demandas = [], createDemanda, updateDemanda } = useDemandasData();
  const navigate = useNavigate();
  const { demandaId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(demandaId);
  const returnTo = searchParams.get('returnTo');

  // Estados do formulário usando hook customizado
  const {
    formData,
    setFormData,
    dropdownOpen,
    setDropdownOpen,
    searchResults,
    setSearchResults,
    showResults,
    setShowResults,
    selectedIndex,
    setSelectedIndex,
    hasLoadedInitialData,
    setHasLoadedInitialData,
    handleChange,
    handleNumericChange,
    closeOtherDropdowns,
  } = useFormularioEstado();

  // Prepare dados dos órgãos solicitantes - memoizado para evitar recriação
  const orgaosSolicitantes = useMemo(() => {
    const idsDosSolicitantes = mockRegrasOrgaos
      .filter(regra => regra.isSolicitante)
      .map(regra => regra.orgaoId);
    return mockOrgaos.filter(orgao => idsDosSolicitantes.includes(orgao.id));
  }, []);

  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning'>('error');

  // Hooks de validação e navegação
  const { validateForm } = useFormularioValidacao(setToastMessage, setToastType, setShowToast);
  const { handleKeyDown, handleDropdownKeyDown } = useNavegacaoTeclado(
    searchResults,
    showResults,
    selectedIndex,
    setSelectedIndex,
    setShowResults
  );

  // Hooks para manipulação de dropdowns e datas
  const {
    toggleDropdown,
    handleTipoDemandaSelect,
    handleAnalistaSelect,
    handleDistribuidorSelect,
  } = useDropdownHandlers(
    setFormData,
    setDropdownOpen,
    setSelectedIndex,
    setShowResults,
    dropdownOpen
  );

  const { convertToHTMLDate, handleDateChange, handleCalendarChange } =
    useDateHandlers(setFormData);

  // Hook para carregar dados da demanda
  const { loadDemandaData } = useLoadDemandaData(
    isEditMode,
    demandaId,
    demandas,
    hasLoadedInitialData,
    orgaosSolicitantes,
    setFormData,
    setHasLoadedInitialData
  );

  // Hook para funções de busca e salvamento
  const {
    handleSolicitanteSearch,
    selectSolicitanteResult,
    prepararDadosComuns,
    showSuccessToast,
  } = useSearchAndSaveHandlers(
    orgaosSolicitantes,
    formData,
    { setSearchResults, setShowResults, setSelectedIndex, setFormData },
    { setToastMessage, setToastType, setShowToast }
  );

  // Hook para effects e handlers do formulário
  const { handleFormKeyDown, handleSubmit } = useFormEffectsAndHandlers(
    { setDropdownOpen, setShowResults },
    { updateDemanda, createDemanda, prepararDadosComuns, showSuccessToast },
    { isEditMode, demandaId, demandas, returnTo },
    { loadDemandaData, validateForm },
    formData
  );

  // Função wrapper para handleDropdownKeyDown
  const handleDropdownKeyDownWrapper = (
    e: React.KeyboardEvent,
    field: 'tipoDemanda' | 'analista' | 'distribuidor',
    options: { id: number; nome: string }[],
    selectCallback: (option: { id: number; nome: string }) => void
  ) => {
    handleDropdownKeyDown(e, field, options, selectCallback, dropdownOpen, setDropdownOpen);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <header className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditMode ? `Editar Demanda - SGED ${formData.sged ?? demandaId}` : 'Nova Demanda'}
          </h2>
          <button type='button' onClick={() => navigate(-1)} className={styles.backButton}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path
                fillRule='evenodd'
                d='M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z'
              />
            </svg>
            Voltar
          </button>
        </header>

        <div className={styles.formContent}>
          <FormularioCompleto
            formData={formData}
            setFormData={setFormData}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            searchResults={searchResults}
            showResults={showResults}
            setShowResults={setShowResults}
            handleSolicitanteSearch={handleSolicitanteSearch}
            handleKeyDown={handleKeyDown}
            selectSolicitanteResult={selectSolicitanteResult}
            closeOtherDropdowns={closeOtherDropdowns}
            handleDateChange={handleDateChange}
            handleCalendarChange={handleCalendarChange}
            convertToHTMLDate={convertToHTMLDate}
            handleChange={handleChange}
            handleNumericChange={handleNumericChange}
            toggleDropdown={toggleDropdown}
            handleTipoDemandaSelect={handleTipoDemandaSelect}
            handleAnalistaSelect={handleAnalistaSelect}
            handleDistribuidorSelect={handleDistribuidorSelect}
            handleDropdownKeyDown={handleDropdownKeyDownWrapper}
            handleFormKeyDown={handleFormKeyDown}
            handleSubmit={handleSubmit}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Toast para exibir mensagens de erro/sucesso */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  );
}
