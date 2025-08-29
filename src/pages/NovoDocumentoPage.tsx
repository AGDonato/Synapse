// src/pages/NovoDocumentoPage.tsx

// React imports
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// UI Components
import MultiSelectDropdown, {
  type MultiSelectOption,
} from '../components/forms/MultiSelectDropdown';
import Toast from '../components/ui/Toast';

// Contexts & Hooks
import { useDocumentosData } from '../hooks/queries/useDocumentos';
import { useDemandasData } from '../hooks/queries/useDemandas';
import { useNovoDocumentoValidation } from '../hooks/useNovoDocumentoValidation';
import { useSearchHandlers } from '../hooks/useSearchHandlers';
import { useDocumentSections } from '../hooks/useDocumentSections';
import { useDocumentSubmission } from '../hooks/useDocumentSubmission';
import { useDocumentHandlers } from '../hooks/useDocumentHandlers';
import { useRetificacoes } from '../hooks/useRetificacoes';
import { usePesquisas } from '../hooks/usePesquisas';

// Mock Data
import { mockAnalistas } from '../data/mockAnalistas';
import { mockAutoridades } from '../data/mockAutoridades';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockProvedores } from '../data/mockProvedores';
import { mockRegrasAutoridades } from '../data/mockRegrasAutoridades';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockTiposDocumentos } from '../data/mockTiposDocumentos';
import { mockTiposIdentificadores } from '../data/mockTiposIdentificadores';
import { mockTiposMidias } from '../data/mockTiposMidias';

// Business Logic & Rules
import { documentoAssuntoConfig } from '../data/documentoRegras';

// Utilities
import { getEnderecamentos } from '../utils/documentoHelpers';

// Styles
import styles from './NovoDocumentoPage.module.css';

// Tipos para campos de busca (preparação para backend)
interface SearchableField {
  id: number;
  nome: string;
}

interface DestinatarioField extends SearchableField {
  // Para provedores: nomeFantasia no nome
  // Para autoridades: nome no nome
  razaoSocial?: string; // Apenas para provedores
}

type EnderecamentoField = SearchableField;
// Para provedores: razaoSocial no nome
// Para órgãos: nomeCompleto no nome

type AnalistaField = SearchableField;
// nome do analista

type AutoridadeField = SearchableField;
// nome da autoridade

type OrgaoField = SearchableField;
// nomeCompleto do órgão no nome

// Tipos
interface FormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: DestinatarioField | null;
  destinatarios: MultiSelectOption[]; // Para multi-seleção em Ofício Circular
  enderecamento: EnderecamentoField | null;
  numeroDocumento: string;
  anoDocumento: string;
  analista: AnalistaField | null;
  // Seção 2 - Dados da Decisão Judicial
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
  // Seção 3 - Dados da Mídia
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  // Seção 4 - Dados da Pesquisa
  pesquisas: PesquisaItem[];
}

// PesquisaItem agora é exportado de usePesquisas
import type { PesquisaItem } from '../hooks/usePesquisas';

// =============================================================================
// CONSTANTS & DATA PREPARATION
// =============================================================================

// Dados para busca combinando provedores e autoridades
const destinatarios = [
  ...mockProvedores.map(provedor => provedor.nomeFantasia),
  ...mockAutoridades.map(autoridade => autoridade.nome),
].sort();

// Opções para multi-seleção (Ofício Circular)
const destinatariosOptions: MultiSelectOption[] = [
  ...mockProvedores.map(provedor => ({
    id: `provedor-${provedor.id}`,
    nome: provedor.nomeFantasia,
  })),
  ...mockAutoridades.map(autoridade => ({
    id: `autoridade-${autoridade.id}`,
    nome: autoridade.nome,
  })),
].sort((a, b) => a.nome.localeCompare(b.nome));

// Autoridades judiciais baseadas nas regras
const idsAutoridadesJudiciais = mockRegrasAutoridades
  .filter(regra => regra.isAutoridadeJudicial)
  .map(regra => regra.autoridadeId);

const autoridades = mockAutoridades
  .filter(autoridade => idsAutoridadesJudiciais.includes(autoridade.id))
  .map(autoridade => `${autoridade.nome} - ${autoridade.cargo}`)
  .sort();

// Órgãos judiciais baseados nas regras
const idsOrgaosJudiciais = mockRegrasOrgaos
  .filter(regra => regra.isOrgaoJudicial)
  .map(regra => regra.orgaoId);

const orgaosJudiciais = mockOrgaos
  .filter(orgao => idsOrgaosJudiciais.includes(orgao.id))
  .map(orgao => orgao.nomeCompleto)
  .sort();

// Analistas vindos do mock
const analistas = mockAnalistas.map(analista => analista.nome).sort();

// Tipos de pesquisa vindos do mock
const tiposPesquisa = [
  { value: '', label: '\u00A0' }, // Opção vazia no início com espaço não-quebrável
  ...mockTiposIdentificadores
    .map(tipo => ({ value: tipo.nome.toLowerCase(), label: tipo.nome }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NovoDocumentoPage() {
  // -------------------------------------------------------------------------
  // HOOKS & ROUTER STATE
  // -------------------------------------------------------------------------
  const navigate = useNavigate();
  const { demandaId, documentoId } = useParams();
  const [searchParams] = useSearchParams();
  const demandaIdFromQuery = searchParams.get('demandaId');
  const sgedFromQuery = searchParams.get('sged');
  const { data: documentos = [] } = useDocumentosData();
  const { data: demandas = [] } = useDemandasData();

  const getDocumento = (id: number) => documentos.find(doc => doc.id === id);

  // -------------------------------------------------------------------------
  // COMPONENT STATE
  // -------------------------------------------------------------------------

  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning'>('error');

  // Detectar se está em modo de edição
  const isEditMode = Boolean(documentoId);

  // Buscar documento para edição se necessário
  const documentoToEdit = isEditMode && documentoId ? getDocumento(parseInt(documentoId)) : null;
  const tipoDocumentoRef = useRef<HTMLSelectElement>(null);

  // -------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------------------

  // Função para dividir string de destinatários (tratando formato com "e")
  const parseDestinatarios = (destinatarioString: string): string[] => {
    if (!destinatarioString) {
      return [];
    }

    // Se contém " e ", tratar o formato "A, B e C"
    if (destinatarioString.includes(' e ')) {
      const parts = destinatarioString.split(' e ');
      const ultimoNome = parts.pop()?.trim();
      const primeirosNomes = parts
        .join(' e ')
        .split(', ')
        .map(nome => nome.trim());

      if (ultimoNome) {
        return [...primeirosNomes, ultimoNome];
      }
      return primeirosNomes;
    }

    // Formato simples com apenas vírgulas "A, B, C"
    return destinatarioString
      .split(',')
      .map(nome => nome.trim())
      .filter(nome => nome.length > 0);
  };

  // Função para criar dados iniciais do formulário
  const createInitialFormData = (): FormData => {
    if (isEditMode && documentoToEdit) {
      // Converter dados do documento para o formato do formulário
      return {
        tipoDocumento: documentoToEdit.tipoDocumento,
        assunto: documentoToEdit.assunto || '',
        assuntoOutros: documentoToEdit.assuntoOutros || '',
        destinatario: documentoToEdit.destinatario
          ? { id: 0, nome: documentoToEdit.destinatario }
          : null,
        destinatarios:
          documentoToEdit.tipoDocumento === 'Ofício Circular'
            ? documentoToEdit.destinatario
              ? (() => {
                  const nomesDestinatarios = parseDestinatarios(documentoToEdit.destinatario);

                  return nomesDestinatarios.map((nome, index) => {
                    const opcaoEncontrada = destinatariosOptions.find(opt => opt.nome === nome);

                    return (
                      opcaoEncontrada || {
                        id: `dest_${index}`,
                        nome: nome,
                      }
                    );
                  });
                })()
              : []
            : [],
        enderecamento: documentoToEdit.enderecamento
          ? { id: 0, nome: documentoToEdit.enderecamento }
          : null,
        numeroDocumento: documentoToEdit.numeroDocumento,
        anoDocumento: documentoToEdit.anoDocumento || '',
        analista: documentoToEdit.analista ? { id: 0, nome: documentoToEdit.analista } : null,
        autoridade: documentoToEdit.autoridade ? { id: 0, nome: documentoToEdit.autoridade } : null,
        orgaoJudicial: documentoToEdit.orgaoJudicial
          ? { id: 0, nome: documentoToEdit.orgaoJudicial }
          : null,
        dataAssinatura: documentoToEdit.dataAssinatura || '',
        retificada: documentoToEdit.retificada || false,
        tipoMidia: documentoToEdit.tipoMidia || '',
        tamanhoMidia: documentoToEdit.tamanhoMidia || '',
        hashMidia: documentoToEdit.hashMidia || '',
        senhaMidia: documentoToEdit.senhaMidia || '',
        pesquisas:
          documentoToEdit.pesquisas && documentoToEdit.pesquisas.length > 0
            ? documentoToEdit.pesquisas
            : [{ tipo: '', identificador: '' }],
      };
    } else {
      // Dados padrão para novo documento
      return {
        tipoDocumento: '',
        assunto: '',
        assuntoOutros: '',
        destinatario: null,
        destinatarios: [],
        enderecamento: null,
        numeroDocumento: '',
        anoDocumento: '',
        analista: null,
        autoridade: null,
        orgaoJudicial: null,
        dataAssinatura: '',
        retificada: false,
        tipoMidia: '',
        tamanhoMidia: '',
        hashMidia: '',
        senhaMidia: '',
        pesquisas: [{ tipo: '', identificador: '' }],
      };
    }
  };

  const [formData, setFormData] = useState<FormData>(createInitialFormData());

  // Função helper para mostrar Toast
  const showToastMsg = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // -------------------------------------------------------------------------
  // HOOKS CUSTOMIZADOS
  // -------------------------------------------------------------------------
  const {
    searchResults,
    showResults,
    selectedIndex,
    dropdownOpen,
    handleSearch,
    handleSearchInput,
    handleKeyDown,
    closeOtherSearchResults,
    setShowResults,
    setSelectedIndex,
    setDropdownOpen,
  } = useSearchHandlers({
    initialFields: ['destinatario', 'enderecamento', 'autoridade', 'orgaoJudicial'],
  });

  // Hook para retificações
  const {
    retificacoes,
    setRetificacoes,
    addRetificacao,
    updateRetificacaoSearchField,
    handleRetificacaoCheckboxChange,
    handleRetificacaoDateChange,
    handleRetificacaoCalendarChange,
    selectRetificacaoSearchResult,
  } = useRetificacoes({
    isEditMode,
    documentoToEdit,
  });

  // Handlers de foco para pesquisas
  const focusNewPesquisaRow = useCallback((index: number) => {
    const tipoPesquisaElement = document.querySelector(`[data-dropdown="tipoPesquisa_${index}"]`);
    if (tipoPesquisaElement) {
      (tipoPesquisaElement as HTMLElement).focus();
    }
  }, []);

  const focusNewPesquisaColumn = useCallback((index: number) => {
    const complementarElement = document.querySelector(`input[data-field="complementar_${index}"]`);
    if (complementarElement) {
      (complementarElement as HTMLInputElement).focus();
    }
  }, []);

  // Hook para pesquisas
  const {
    addPesquisa,
    removePesquisa,
    updatePesquisa,
    togglePesquisaComplementar,
    handleTipoPesquisaSelect,
  } = usePesquisas({
    pesquisas: formData.pesquisas,
    setPesquisas: pesquisas => setFormData(prev => ({ ...prev, pesquisas })),
    onShowToast: showToastMsg,
    onFocusNewRow: focusNewPesquisaRow,
    onFocusNewColumn: focusNewPesquisaColumn,
  });

  // Hook para handlers de documentos
  const {
    handleInputChange,
    handleSearchFieldChange,
    handleDateChange,
    handleCalendarChange,
    handleTamanhoMidiaChange,
    handlePasteMultipleValues,
    toggleDropdown,
    handleDropdownSelect,
    selectSearchResult,
    scrollToDropdownItem,
    convertToHTMLDate,
    formatTamanhoMidia,
  } = useDocumentHandlers({
    formData,
    setFormData,
    dropdownOpen,
    setDropdownOpen,
    selectedIndex,
    setSelectedIndex,
    setShowResults,
    onShowToast: showToastMsg,
  });

  // -------------------------------------------------------------------------
  // DOCUMENT SECTIONS HOOK
  // -------------------------------------------------------------------------
  const { sectionVisibility } = useDocumentSections({
    tipoDocumento: formData.tipoDocumento,
    assunto: formData.assunto,
    isEditMode,
    onFieldsClear: clearedFields => {
      // Aplicar campos limpos ao formData
      setFormData(prev => ({ ...prev, ...clearedFields }));
      // Limpar retificações se seção 2 foi ocultada
      if (clearedFields.autoridade === null) {
        setRetificacoes([]);
      }
    },
  });

  // -------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------------------

  // Função auxiliar para determinar o ID da demanda atual
  const getCurrentDemandaId = (): string | undefined => {
    // Primeiro, tenta pelos parâmetros diretos
    const currentId = demandaId ?? demandaIdFromQuery;
    if (currentId) {
      return currentId;
    }

    // Se veio da HomePage com SGED, busca o ID correspondente
    if (sgedFromQuery) {
      const demanda = demandas.find(d => d.sged === sgedFromQuery);
      return demanda ? demanda.id.toString() : undefined;
    }

    return undefined;
  };

  // -------------------------------------------------------------------------
  // VALIDATION HOOK
  // -------------------------------------------------------------------------
  const { validateForm: validateFormWithHook } = useNovoDocumentoValidation({
    formData,
    retificacoes,
    sectionVisibility,
    onShowToast: showToastMsg,
  });

  // -------------------------------------------------------------------------
  // DOCUMENT SUBMISSION HOOK
  // -------------------------------------------------------------------------
  const { handleSubmit } = useDocumentSubmission({
    formData,
    retificacoes,
    validateForm: validateFormWithHook,
    onShowToast: showToastMsg,
    isEditMode,
    documentId: documentoId || undefined,
    demandaId,
    demandaIdFromQuery: getCurrentDemandaId(),
  });

  // -------------------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // -------------------------------------------------------------------------

  // Lista de endereçamentos baseada no destinatário atual
  const enderecamentosDisponiveis = useMemo(() => {
    return getEnderecamentos(formData.destinatario?.nome || '');
  }, [formData.destinatario?.nome]);

  // -------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------

  // Foco automático no primeiro campo ao carregar
  useEffect(() => {
    if (tipoDocumentoRef.current) {
      tipoDocumentoRef.current.focus();
    }
  }, []);

  // Validação: Verificar se a demanda está finalizada
  useEffect(() => {
    const currentDemandaId = demandaId || demandaIdFromQuery;
    let demanda;

    if (currentDemandaId && !isEditMode) {
      // Buscar por ID
      demanda = demandas.find(d => d.id === parseInt(currentDemandaId));
    } else if (sgedFromQuery && !isEditMode) {
      // Buscar por SGED quando vier da HomePage
      demanda = demandas.find(d => d.sged === sgedFromQuery);
    }

    if (demanda?.status === 'Finalizada') {
      setToastMessage('Não é possível criar documentos em demandas finalizadas.');
      setToastType('error');
      setShowToast(true);

      // Navegar de volta após 2 segundos
      const timeoutId = setTimeout(() => {
        navigate(`/demandas/${demanda.id}`);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [demandaId, demandaIdFromQuery, sgedFromQuery, isEditMode, demandas, navigate]);

  // -------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------------------

  // Gerar anos para select
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  // Determinar SGED para exibição no cabeçalho
  const getDisplaySged = () => {
    // Se está editando, buscar o SGED da demanda pelo ID
    if (isEditMode && demandaId) {
      const demanda = demandas.find(d => d.id === parseInt(demandaId));
      return demanda?.sged || demandaId;
    }

    // Se veio da página de detalhes da demanda, buscar o SGED pelo ID
    if (demandaIdFromQuery) {
      const demanda = demandas.find(d => d.id === parseInt(demandaIdFromQuery));
      return demanda?.sged || demandaIdFromQuery;
    }

    // Se veio da HomePage com SGED direto, usar sgedFromQuery
    if (sgedFromQuery) {
      return sgedFromQuery;
    }

    // Se não há parâmetros, não mostrar SGED
    return null;
  };

  const displaySged = getDisplaySged();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        {/* Header */}
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>
            {isEditMode ? 'Editar Documento' : 'Novo Documento'}
            {displaySged && ` - SGED ${displaySged}`}
          </h1>
          <button onClick={() => navigate(-1)} className={styles.backButton} type='button'>
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
        </div>

        <div className={styles.formContent}>
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            onKeyDown={e => {
              // Prevenir submit do formulário com Enter, exceto se estiver no botão de submit
              if (e.key === 'Enter' && e.target instanceof HTMLElement) {
                // Permitir Enter apenas em textareas e no botão de submit
                const tagName = e.target.tagName.toLowerCase();
                const isSubmitButton = e.target.getAttribute('type') === 'submit';

                if (tagName !== 'textarea' && !isSubmitButton) {
                  e.preventDefault();
                }
              }
            }}
          >
            {/* Seção 1 - Informações do Documento */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.sectionIcon}>01</span>
                  <h2 className={styles.sectionTitle}>Informações do Documento</h2>
                </div>
              </div>

              <div className={styles.sectionContent}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Tipo de Documento <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.customDropdownContainer}>
                      <div
                        className={`${styles.customDropdownTrigger} ${dropdownOpen.tipoDocumento ? styles.customDropdownTriggerOpen : ''}`}
                        tabIndex={0}
                        data-dropdown='tipoDocumento'
                        onKeyDown={e => {
                          if (
                            dropdownOpen.tipoDocumento &&
                            e.key === 'Enter' &&
                            selectedIndex.tipoDocumento >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            const options = ['', ...mockTiposDocumentos.map(t => t.nome)];
                            if (selectedIndex.tipoDocumento < options.length) {
                              handleDropdownSelect(
                                'tipoDocumento',
                                options[selectedIndex.tipoDocumento],
                                '[data-dropdown="tipoDocumento"]'
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            e.stopPropagation();
                            toggleDropdown('tipoDocumento');
                          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                            // Navegação por setas - abre dropdown se fechado, navega se aberto
                            e.preventDefault();
                            if (!dropdownOpen.tipoDocumento) {
                              // Se dropdown fechado, abrir e ir para primeiro item
                              toggleDropdown('tipoDocumento');
                              setSelectedIndex(prev => ({
                                ...prev,
                                tipoDocumento: 0,
                              }));
                            } else {
                              // Se dropdown aberto, navegar
                              const currentIndex = selectedIndex.tipoDocumento ?? -1;
                              const options = ['', ...mockTiposDocumentos.map(t => t.nome)];
                              let nextIndex;

                              if (e.key === 'ArrowDown') {
                                nextIndex =
                                  currentIndex < options.length - 1
                                    ? currentIndex + 1
                                    : currentIndex;
                              } else {
                                nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
                              }

                              setSelectedIndex(prev => ({
                                ...prev,
                                tipoDocumento: nextIndex,
                              }));
                              scrollToDropdownItem('tipoDocumento', nextIndex);
                            }
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao pressionar Tab
                            setDropdownOpen(prev => ({
                              ...prev,
                              tipoDocumento: false,
                            }));
                          }
                        }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDropdown('tipoDocumento');
                        }}
                      >
                        <span className={styles.customDropdownValue}>
                          {formData.tipoDocumento || ''}
                        </span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.tipoDocumento ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.tipoDocumento && (
                        <div className={styles.multiSelectDropdown}>
                          {/* Primeira opção em branco */}
                          <label
                            key='empty'
                            className={`${styles.checkboxLabel} ${
                              selectedIndex.tipoDocumento === 0 ? styles.checkboxLabelFocused : ''
                            }`}
                            onClick={() =>
                              handleDropdownSelect(
                                'tipoDocumento',
                                '',
                                '[data-dropdown="tipoDocumento"]'
                              )
                            }
                          >
                            <span className={styles.checkboxText}>&nbsp;</span>
                          </label>
                          {mockTiposDocumentos.map((tipo, index) => (
                            <label
                              key={tipo.id}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.tipoDocumento === index + 1
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() =>
                                handleDropdownSelect(
                                  'tipoDocumento',
                                  tipo.nome,
                                  '[data-dropdown="tipoDocumento"]'
                                )
                              }
                            >
                              <span className={styles.checkboxText}>{tipo.nome}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.tipoDocumento !== 'Mídia' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Assunto <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.assuntoWrapper}>
                        <div className={styles.customDropdownContainer}>
                          <div
                            className={`${styles.customDropdownTrigger} ${dropdownOpen.assunto ? styles.customDropdownTriggerOpen : ''} ${!formData.tipoDocumento ? styles.customDropdownDisabled : ''}`}
                            tabIndex={formData.tipoDocumento ? 0 : -1}
                            data-dropdown='assunto'
                            onKeyDown={e => {
                              if (!formData.tipoDocumento) {
                                return;
                              }

                              if (
                                dropdownOpen.assunto &&
                                e.key === 'Enter' &&
                                selectedIndex.assunto >= 0
                              ) {
                                // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                                e.preventDefault();
                                e.stopPropagation();
                                const options = [
                                  '',
                                  ...(documentoAssuntoConfig[formData.tipoDocumento] || []),
                                ];
                                if (selectedIndex.assunto < options.length) {
                                  handleDropdownSelect(
                                    'assunto',
                                    options[selectedIndex.assunto],
                                    '[data-dropdown="assunto"]'
                                  );
                                }
                              } else if (e.key === 'Enter' || e.key === ' ') {
                                // Caso contrário, abrir/fechar dropdown
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDropdown('assunto');
                              } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                // Navegação por setas - abre dropdown se fechado, navega se aberto
                                e.preventDefault();
                                if (!dropdownOpen.assunto) {
                                  // Se dropdown fechado, abrir e ir para primeiro item
                                  toggleDropdown('assunto');
                                  setSelectedIndex(prev => ({
                                    ...prev,
                                    assunto: 0,
                                  }));
                                } else {
                                  // Se dropdown aberto, navegar
                                  const currentIndex = selectedIndex.assunto ?? -1;
                                  const options = [
                                    '',
                                    ...(documentoAssuntoConfig[formData.tipoDocumento] || []),
                                  ];
                                  let nextIndex;

                                  if (e.key === 'ArrowDown') {
                                    nextIndex =
                                      currentIndex < options.length - 1
                                        ? currentIndex + 1
                                        : currentIndex;
                                  } else {
                                    nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
                                  }

                                  setSelectedIndex(prev => ({
                                    ...prev,
                                    assunto: nextIndex,
                                  }));
                                  scrollToDropdownItem('assunto', nextIndex);
                                }
                              } else if (e.key === 'Tab') {
                                // Fechar dropdown ao pressionar Tab
                                setDropdownOpen(prev => ({
                                  ...prev,
                                  assunto: false,
                                }));
                              }
                            }}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (formData.tipoDocumento) {
                                toggleDropdown('assunto');
                              }
                            }}
                          >
                            <span className={styles.customDropdownValue}>
                              {formData.assunto ||
                                (formData.tipoDocumento
                                  ? ''
                                  : 'Selecione primeiro o tipo de documento')}
                            </span>
                            <span className={styles.dropdownArrow}>
                              {dropdownOpen.assunto ? '▲' : '▼'}
                            </span>
                          </div>
                          {dropdownOpen.assunto && formData.tipoDocumento && (
                            <div className={styles.multiSelectDropdown}>
                              {/* Primeira opção em branco */}
                              <label
                                key='empty'
                                className={`${styles.checkboxLabel} ${
                                  selectedIndex.assunto === 0 ? styles.checkboxLabelFocused : ''
                                }`}
                                onClick={() =>
                                  handleDropdownSelect('assunto', '', '[data-dropdown="assunto"]')
                                }
                              >
                                <span className={styles.checkboxText}>&nbsp;</span>
                              </label>
                              {(documentoAssuntoConfig[formData.tipoDocumento] || []).map(
                                (assunto, index) => (
                                  <label
                                    key={assunto}
                                    className={`${styles.checkboxLabel} ${
                                      selectedIndex.assunto === index + 1
                                        ? styles.checkboxLabelFocused
                                        : ''
                                    }`}
                                    onClick={() =>
                                      handleDropdownSelect(
                                        'assunto',
                                        assunto,
                                        '[data-dropdown="assunto"]'
                                      )
                                    }
                                  >
                                    <span className={styles.checkboxText}>{assunto}</span>
                                  </label>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {formData.assunto === 'Outros' && (
                          <input
                            type='text'
                            value={formData.assuntoOutros}
                            onChange={e => handleInputChange('assuntoOutros', e.target.value)}
                            className={styles.formInput}
                            placeholder='Especifique o assunto'
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGrid1}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Destinatário <span className={styles.required}>*</span>
                    </label>

                    {/* Renderização condicional baseada no tipo de documento */}
                    {formData.tipoDocumento === 'Ofício Circular' ? (
                      // Multi-seleção para Ofício Circular
                      <MultiSelectDropdown
                        options={destinatariosOptions}
                        selectedValues={formData.destinatarios}
                        onChange={selected => handleInputChange('destinatarios', selected)}
                        placeholder='Selecione os destinatários...'
                        searchPlaceholder='Filtrar destinatários...'
                      />
                    ) : (
                      // Input normal para outros tipos de documento
                      <div className={styles.searchContainer} data-field='destinatario'>
                        <input
                          type='text'
                          value={formData.destinatario?.nome || ''}
                          onChange={e => {
                            handleSearchFieldChange('destinatario', e.target.value);
                            handleSearch('destinatario', e.target.value, destinatarios, [
                              'nome',
                              'nomeFantasia',
                            ]);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'destinatario', value =>
                              selectSearchResult('destinatario', value)
                            )
                          }
                          onFocus={() => closeOtherSearchResults('destinatario')}
                          className={styles.formInput}
                          placeholder='Digite para pesquisar...'
                        />
                        {showResults.destinatario && (
                          <div className={styles.searchResults}>
                            {searchResults.destinatario.map((item, index) => (
                              <div
                                key={index}
                                className={`${styles.searchResultItem} ${
                                  (selectedIndex.destinatario ?? -1) === index
                                    ? styles.searchResultItemSelected
                                    : ''
                                }`}
                                onClick={() => selectSearchResult('destinatario', item)}
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

                <div className={styles.formGrid1}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Endereçamento <span className={styles.required}>*</span>
                    </label>

                    {/* Para Ofício Circular, campo pré-preenchido e desabilitado */}
                    {formData.tipoDocumento === 'Ofício Circular' ? (
                      <div
                        className={styles.fieldDisabled}
                        onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                        onCopy={(e: React.ClipboardEvent) => e.preventDefault()}
                        tabIndex={-1}
                      >
                        <span>Respectivos departamentos jurídicos</span>
                      </div>
                    ) : (
                      // Campo normal para outros tipos de documento
                      <div className={styles.searchContainer} data-field='enderecamento'>
                        <input
                          type='text'
                          value={formData.enderecamento?.nome || ''}
                          onChange={e => {
                            handleSearchFieldChange('enderecamento', e.target.value);
                            handleSearch(
                              'enderecamento',
                              e.target.value,
                              enderecamentosDisponiveis,
                              ['nome']
                            );
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'enderecamento', value =>
                              selectSearchResult('enderecamento', value)
                            )
                          }
                          onFocus={() => closeOtherSearchResults('enderecamento')}
                          className={styles.formInput}
                          placeholder={
                            formData.destinatario
                              ? 'Digite para pesquisar...'
                              : 'Selecione primeiro um destinatário'
                          }
                          disabled={!formData.destinatario}
                        />
                        {showResults.enderecamento && (
                          <div className={styles.searchResults}>
                            {searchResults.enderecamento.map((item, index) => (
                              <div
                                key={index}
                                className={`${styles.searchResultItem} ${
                                  (selectedIndex.enderecamento ?? -1) === index
                                    ? styles.searchResultItemSelected
                                    : ''
                                }`}
                                onClick={() => selectSearchResult('enderecamento', item)}
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

                <div className={styles.formGridCustom}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Número do Documento <span className={styles.required}>*</span>
                    </label>
                    <input
                      type='text'
                      value={formData.numeroDocumento}
                      onChange={e => handleInputChange('numeroDocumento', e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Ano <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.customDropdownContainer}>
                      <div
                        className={`${styles.customDropdownTrigger} ${dropdownOpen.anoDocumento ? styles.customDropdownTriggerOpen : ''}`}
                        tabIndex={0}
                        data-dropdown='anoDocumento'
                        onKeyDown={e => {
                          if (
                            dropdownOpen.anoDocumento &&
                            e.key === 'Enter' &&
                            selectedIndex.anoDocumento >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            const options = ['', ...generateYears().map(y => y.toString())];
                            if (selectedIndex.anoDocumento < options.length) {
                              handleDropdownSelect(
                                'anoDocumento',
                                options[selectedIndex.anoDocumento],
                                '[data-dropdown="anoDocumento"]'
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            e.stopPropagation();
                            toggleDropdown('anoDocumento');
                          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                            // Navegação por setas - abre dropdown se fechado, navega se aberto
                            e.preventDefault();
                            if (!dropdownOpen.anoDocumento) {
                              // Se dropdown fechado, abrir e ir para primeiro item
                              toggleDropdown('anoDocumento');
                              setSelectedIndex(prev => ({
                                ...prev,
                                anoDocumento: 0,
                              }));
                            } else {
                              // Se dropdown aberto, navegar
                              const currentIndex = selectedIndex.anoDocumento ?? -1;
                              const options = ['', ...generateYears().map(y => y.toString())];
                              let nextIndex;

                              if (e.key === 'ArrowDown') {
                                nextIndex =
                                  currentIndex < options.length - 1
                                    ? currentIndex + 1
                                    : currentIndex;
                              } else {
                                nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
                              }

                              setSelectedIndex(prev => ({
                                ...prev,
                                anoDocumento: nextIndex,
                              }));
                              scrollToDropdownItem('anoDocumento', nextIndex);
                            }
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao pressionar Tab
                            setDropdownOpen(prev => ({
                              ...prev,
                              anoDocumento: false,
                            }));
                          }
                        }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDropdown('anoDocumento');
                        }}
                      >
                        <span className={styles.customDropdownValue}>
                          {formData.anoDocumento || ''}
                        </span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.anoDocumento ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.anoDocumento && (
                        <div className={styles.multiSelectDropdown}>
                          {/* Primeira opção em branco */}
                          <label
                            key='empty'
                            className={`${styles.checkboxLabel} ${
                              selectedIndex.anoDocumento === 0 ? styles.checkboxLabelFocused : ''
                            }`}
                            onClick={() =>
                              handleDropdownSelect(
                                'anoDocumento',
                                '',
                                '[data-dropdown="anoDocumento"]'
                              )
                            }
                          >
                            <span className={styles.checkboxText}>&nbsp;</span>
                          </label>
                          {generateYears().map((year, index) => (
                            <label
                              key={year}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.anoDocumento === index + 1
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() =>
                                handleDropdownSelect(
                                  'anoDocumento',
                                  year.toString(),
                                  '[data-dropdown="anoDocumento"]'
                                )
                              }
                            >
                              <span className={styles.checkboxText}>{year}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Analista <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.customDropdownContainer}>
                      <div
                        className={`${styles.customDropdownTrigger} ${dropdownOpen.analista ? styles.customDropdownTriggerOpen : ''}`}
                        onClick={() => toggleDropdown('analista')}
                        tabIndex={0}
                        data-dropdown='analista'
                        onKeyDown={e => {
                          if (
                            dropdownOpen.analista &&
                            e.key === 'Enter' &&
                            selectedIndex.analista >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedIndex.analista < analistas.length) {
                              handleDropdownSelect(
                                'analista',
                                analistas[selectedIndex.analista],
                                '[data-dropdown="analista"]'
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            if (!dropdownOpen.analista) {
                              e.stopPropagation();
                            }
                            toggleDropdown('analista');
                          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                            // Navegação por setas - abre dropdown se fechado, navega se aberto
                            e.preventDefault();
                            if (!dropdownOpen.analista) {
                              // Se dropdown fechado, abrir e ir para primeiro item
                              toggleDropdown('analista');
                              setSelectedIndex(prev => ({
                                ...prev,
                                analista: 0,
                              }));
                            } else {
                              // Se dropdown aberto, navegar
                              const currentIndex = selectedIndex.analista ?? -1;
                              let nextIndex;

                              if (e.key === 'ArrowDown') {
                                nextIndex =
                                  currentIndex < analistas.length - 1
                                    ? currentIndex + 1
                                    : currentIndex;
                              } else {
                                nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
                              }

                              setSelectedIndex(prev => ({
                                ...prev,
                                analista: nextIndex,
                              }));
                              scrollToDropdownItem('analista', nextIndex);
                            }
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao pressionar Tab
                            setDropdownOpen(prev => ({
                              ...prev,
                              analista: false,
                            }));
                          }
                        }}
                      >
                        <span className={styles.customDropdownValue}>
                          {formData.analista?.nome || ''}
                        </span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.analista ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.analista && (
                        <div className={styles.multiSelectDropdown}>
                          {analistas.map((analista, index) => (
                            <label
                              key={analista}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.analista === index ? styles.checkboxLabelFocused : ''
                              }`}
                              onClick={() =>
                                handleDropdownSelect(
                                  'analista',
                                  analista,
                                  '[data-dropdown="analista"]'
                                )
                              }
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

            {/* Seção 2 - Dados da Decisão Judicial */}
            {sectionVisibility.section2 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <span className={styles.sectionIcon}>02</span>
                    <h2 className={styles.sectionTitle}>Dados da Decisão Judicial</h2>
                  </div>
                </div>

                <div className={styles.sectionContent}>
                  <div className={styles.formGrid1}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Autoridade{' '}
                        {sectionVisibility.section2 && <span className={styles.required}>*</span>}
                      </label>
                      <div className={styles.searchContainer} data-field='autoridade'>
                        <input
                          type='text'
                          value={formData.autoridade?.nome || ''}
                          onChange={e => {
                            handleSearchFieldChange('autoridade', e.target.value);
                            handleSearch('autoridade', e.target.value, autoridades, ['nome']);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'autoridade', value =>
                              selectSearchResult('autoridade', value)
                            )
                          }
                          onFocus={() => closeOtherSearchResults('autoridade')}
                          className={styles.formInput}
                          placeholder='Digite para pesquisar...'
                        />
                        {showResults.autoridade && (
                          <div className={styles.searchResults}>
                            {searchResults.autoridade.map((item, index) => (
                              <div
                                key={index}
                                className={`${styles.searchResultItem} ${
                                  (selectedIndex.autoridade ?? -1) === index
                                    ? styles.searchResultItemSelected
                                    : ''
                                }`}
                                onClick={() => selectSearchResult('autoridade', item)}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid1}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Órgão Judicial{' '}
                        {sectionVisibility.section2 && <span className={styles.required}>*</span>}
                      </label>
                      <div className={styles.searchContainer} data-field='orgaoJudicial'>
                        <input
                          type='text'
                          value={formData.orgaoJudicial?.nome || ''}
                          onChange={e => {
                            handleSearchFieldChange('orgaoJudicial', e.target.value);
                            handleSearch('orgaoJudicial', e.target.value, orgaosJudiciais, [
                              'nome',
                            ]);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'orgaoJudicial', value =>
                              selectSearchResult('orgaoJudicial', value)
                            )
                          }
                          onFocus={() => closeOtherSearchResults('orgaoJudicial')}
                          className={styles.formInput}
                          placeholder='Digite para pesquisar...'
                        />
                        {showResults.orgaoJudicial && (
                          <div className={styles.searchResults}>
                            {searchResults.orgaoJudicial.map((item, index) => (
                              <div
                                key={index}
                                className={`${styles.searchResultItem} ${
                                  (selectedIndex.orgaoJudicial ?? -1) === index
                                    ? styles.searchResultItemSelected
                                    : ''
                                }`}
                                onClick={() => selectSearchResult('orgaoJudicial', item)}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Data da Assinatura{' '}
                        {sectionVisibility.section2 && <span className={styles.required}>*</span>}
                      </label>
                      <div className={styles.dateInputWrapper}>
                        <input
                          type='text'
                          value={formData.dataAssinatura}
                          onChange={e => handleDateChange('dataAssinatura', e.target.value)}
                          className={styles.formInput}
                          placeholder='dd/mm/aaaa'
                          maxLength={10}
                        />
                        <input
                          type='date'
                          value={convertToHTMLDate(formData.dataAssinatura)}
                          onChange={e => handleCalendarChange('dataAssinatura', e.target.value)}
                          className={styles.hiddenDateInput}
                          tabIndex={-1}
                        />
                        <button
                          type='button'
                          className={styles.calendarButton}
                          tabIndex={-1}
                          onClick={e => {
                            const wrapper = e.currentTarget.parentElement;
                            const dateInput = wrapper?.querySelector(
                              'input[type="date"]'
                            ) as HTMLInputElement | null;
                            if (dateInput && 'showPicker' in dateInput) {
                              (dateInput as { showPicker(): void }).showPicker();
                            }
                          }}
                          title='Abrir calendário'
                        >
                          📅
                        </button>
                      </div>
                    </div>

                    <div className={`${styles.formGroup} ${styles.flexCenter}`}>
                      <div className={styles.checkboxGroup}>
                        <input
                          type='checkbox'
                          id='retificada'
                          checked={formData.retificada}
                          onChange={e => {
                            handleInputChange('retificada', e.target.checked);
                            if (e.target.checked && retificacoes.length === 0) {
                              addRetificacao();
                            } else if (!e.target.checked) {
                              setRetificacoes([]);
                            }
                          }}
                          className={styles.checkboxInput}
                        />
                        <label className={styles.retificadaLabel}>Retificada</label>
                      </div>
                    </div>
                  </div>

                  {/* Seções de Retificação */}
                  {retificacoes.map((retificacao, index) => (
                    <div key={retificacao.id} className={styles.retificacaoSection}>
                      <div className={styles.retificacaoHeader}>
                        <span>{index + 1}ª Decisão Retificadora</span>
                      </div>

                      <div className={styles.sectionContent}>
                        <div className={styles.formGrid1}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Autoridade{' '}
                              {formData.retificada && <span className={styles.required}>*</span>}
                            </label>
                            <div
                              className={styles.searchContainer}
                              data-field={`ret-autoridade-${retificacao.id}`}
                            >
                              <input
                                type='text'
                                value={retificacao.autoridade?.nome || ''}
                                onChange={e => {
                                  updateRetificacaoSearchField(
                                    retificacao.id,
                                    'autoridade',
                                    e.target.value
                                  );
                                  handleSearchInput(
                                    `ret-autoridade-${retificacao.id}`,
                                    e.target.value,
                                    autoridades
                                  );
                                }}
                                onKeyDown={e =>
                                  handleKeyDown(e, `ret-autoridade-${retificacao.id}`, value =>
                                    selectRetificacaoSearchResult(
                                      retificacao.id,
                                      'autoridade',
                                      value,
                                      setShowResults,
                                      setSelectedIndex
                                    )
                                  )
                                }
                                onFocus={() =>
                                  closeOtherSearchResults(`ret-autoridade-${retificacao.id}`)
                                }
                                className={styles.formInput}
                                placeholder='Digite para pesquisar...'
                                autoComplete='off'
                              />
                              {showResults[`ret-autoridade-${retificacao.id}`] && (
                                <div className={styles.searchResults}>
                                  {searchResults[`ret-autoridade-${retificacao.id}`]?.map(
                                    (item, idx) => (
                                      <div
                                        key={idx}
                                        className={`${styles.searchResultItem} ${
                                          (selectedIndex[`ret-autoridade-${retificacao.id}`] ??
                                            -1) === idx
                                            ? styles.searchResultItemSelected
                                            : ''
                                        }`}
                                        onClick={() => {
                                          selectRetificacaoSearchResult(
                                            retificacao.id,
                                            'autoridade',
                                            item,
                                            setShowResults,
                                            setSelectedIndex
                                          );
                                        }}
                                      >
                                        {item}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.formGrid1}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Órgão Judicial{' '}
                              {formData.retificada && <span className={styles.required}>*</span>}
                            </label>
                            <div
                              className={styles.searchContainer}
                              data-field={`ret-orgao-${retificacao.id}`}
                            >
                              <input
                                type='text'
                                value={retificacao.orgaoJudicial?.nome || ''}
                                onChange={e => {
                                  updateRetificacaoSearchField(
                                    retificacao.id,
                                    'orgaoJudicial',
                                    e.target.value
                                  );
                                  handleSearchInput(
                                    `ret-orgao-${retificacao.id}`,
                                    e.target.value,
                                    orgaosJudiciais
                                  );
                                }}
                                onKeyDown={e =>
                                  handleKeyDown(e, `ret-orgao-${retificacao.id}`, value =>
                                    selectRetificacaoSearchResult(
                                      retificacao.id,
                                      'orgaoJudicial',
                                      value,
                                      setShowResults,
                                      setSelectedIndex
                                    )
                                  )
                                }
                                onFocus={() =>
                                  closeOtherSearchResults(`ret-orgao-${retificacao.id}`)
                                }
                                className={styles.formInput}
                                placeholder='Digite para pesquisar...'
                                autoComplete='off'
                              />
                              {showResults[`ret-orgao-${retificacao.id}`] && (
                                <div className={styles.searchResults}>
                                  {searchResults[`ret-orgao-${retificacao.id}`]?.map(
                                    (item, idx) => (
                                      <div
                                        key={idx}
                                        className={`${styles.searchResultItem} ${
                                          (selectedIndex[`ret-orgao-${retificacao.id}`] ?? -1) ===
                                          idx
                                            ? styles.searchResultItemSelected
                                            : ''
                                        }`}
                                        onClick={() => {
                                          selectRetificacaoSearchResult(
                                            retificacao.id,
                                            'orgaoJudicial',
                                            item,
                                            setShowResults,
                                            setSelectedIndex
                                          );
                                        }}
                                      >
                                        {item}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.formGrid2}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Data da Assinatura{' '}
                              {formData.retificada && <span className={styles.required}>*</span>}
                            </label>
                            <div className={styles.dateInputWrapper}>
                              <input
                                type='text'
                                value={retificacao.dataAssinatura}
                                onChange={e =>
                                  handleRetificacaoDateChange(retificacao.id, e.target.value)
                                }
                                className={styles.formInput}
                                placeholder='dd/mm/aaaa'
                                maxLength={10}
                              />
                              <input
                                type='date'
                                value={convertToHTMLDate(retificacao.dataAssinatura)}
                                onChange={e =>
                                  handleRetificacaoCalendarChange(retificacao.id, e.target.value)
                                }
                                className={styles.hiddenDateInput}
                                tabIndex={-1}
                              />
                              <button
                                type='button'
                                className={styles.calendarButton}
                                tabIndex={-1}
                                onClick={e => {
                                  const wrapper = e.currentTarget.parentElement;
                                  const dateInput = wrapper?.querySelector(
                                    'input[type="date"]'
                                  ) as HTMLInputElement | null;
                                  if (dateInput && 'showPicker' in dateInput) {
                                    (dateInput as { showPicker(): void }).showPicker();
                                  }
                                }}
                                title='Abrir calendário'
                              >
                                📅
                              </button>
                            </div>
                          </div>

                          <div className={`${styles.formGroup} ${styles.flexCenter}`}>
                            <div className={styles.checkboxGroup}>
                              <input
                                type='checkbox'
                                id={`retificada-${retificacao.id}`}
                                checked={retificacao.retificada}
                                onChange={e =>
                                  handleRetificacaoCheckboxChange(retificacao.id, e.target.checked)
                                }
                                className={styles.checkboxInput}
                              />
                              <label className={styles.retificadaLabel}>Retificada</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Seção 3 - Dados da Mídia */}
            {sectionVisibility.section3 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <span className={styles.sectionIcon}>03</span>
                    <h2 className={styles.sectionTitle}>Dados da Mídia</h2>
                  </div>
                </div>

                <div className={styles.sectionContent}>
                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Tipo de Mídia{' '}
                        {sectionVisibility.section3 && <span className={styles.required}>*</span>}
                      </label>
                      <div className={styles.customDropdownContainer}>
                        <div
                          className={`${styles.customDropdownTrigger} ${dropdownOpen.tipoMidia ? styles.customDropdownTriggerOpen : ''}`}
                          onClick={() => toggleDropdown('tipoMidia')}
                          tabIndex={0}
                          data-dropdown='tipoMidia'
                          onKeyDown={e => {
                            if (
                              dropdownOpen.tipoMidia &&
                              e.key === 'Enter' &&
                              selectedIndex.tipoMidia >= 0
                            ) {
                              // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                              e.preventDefault();
                              e.stopPropagation();
                              if (selectedIndex.tipoMidia === 0) {
                                // Selecionou a opção vazia
                                handleDropdownSelect(
                                  'tipoMidia',
                                  '',
                                  '[data-dropdown="tipoMidia"]'
                                );
                              } else if (selectedIndex.tipoMidia <= mockTiposMidias.length) {
                                handleDropdownSelect(
                                  'tipoMidia',
                                  mockTiposMidias[selectedIndex.tipoMidia - 1].nome,
                                  '[data-dropdown="tipoMidia"]'
                                );
                              }
                            } else if (e.key === 'Enter' || e.key === ' ') {
                              // Caso contrário, abrir/fechar dropdown
                              e.preventDefault();
                              if (!dropdownOpen.tipoMidia) {
                                e.stopPropagation();
                              }
                              toggleDropdown('tipoMidia');
                            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                              // Navegação por setas - abre dropdown se fechado, navega se aberto
                              e.preventDefault();
                              if (!dropdownOpen.tipoMidia) {
                                // Se dropdown fechado, abrir e ir para primeiro item
                                toggleDropdown('tipoMidia');
                                setSelectedIndex(prev => ({
                                  ...prev,
                                  tipoMidia: 0,
                                }));
                              } else {
                                // Se dropdown aberto, navegar
                                const currentIndex = selectedIndex.tipoMidia ?? -1;
                                const options = ['', ...mockTiposMidias.map(t => t.nome)];
                                let nextIndex;

                                if (e.key === 'ArrowDown') {
                                  nextIndex =
                                    currentIndex < options.length - 1
                                      ? currentIndex + 1
                                      : currentIndex;
                                } else {
                                  nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
                                }

                                setSelectedIndex(prev => ({
                                  ...prev,
                                  tipoMidia: nextIndex,
                                }));
                                scrollToDropdownItem('tipoMidia', nextIndex);
                              }
                            } else if (e.key === 'Tab') {
                              // Fechar dropdown ao pressionar Tab
                              setDropdownOpen(prev => ({
                                ...prev,
                                tipoMidia: false,
                              }));
                            }
                          }}
                        >
                          <span className={styles.customDropdownValue}>
                            {formData.tipoMidia || ''}
                          </span>
                          <span className={styles.dropdownArrow}>
                            {dropdownOpen.tipoMidia ? '▲' : '▼'}
                          </span>
                        </div>
                        {dropdownOpen.tipoMidia && (
                          <div className={styles.multiSelectDropdown}>
                            {/* Opção vazia no início */}
                            <label
                              key='empty'
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.tipoMidia === 0 ? styles.checkboxLabelFocused : ''
                              }`}
                              onClick={() =>
                                handleDropdownSelect('tipoMidia', '', '[data-dropdown="tipoMidia"]')
                              }
                            >
                              <span className={styles.checkboxText}>{'\u00A0'}</span>
                            </label>
                            {mockTiposMidias.map((tipo, index) => (
                              <label
                                key={tipo.id}
                                className={`${styles.checkboxLabel} ${
                                  selectedIndex.tipoMidia === index + 1
                                    ? styles.checkboxLabelFocused
                                    : ''
                                }`}
                                onClick={() =>
                                  handleDropdownSelect(
                                    'tipoMidia',
                                    tipo.nome,
                                    '[data-dropdown="tipoMidia"]'
                                  )
                                }
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
                        Tamanho (MB){' '}
                        {sectionVisibility.section3 && <span className={styles.required}>*</span>}
                      </label>
                      <input
                        type='text'
                        value={formatTamanhoMidia(formData.tamanhoMidia)}
                        onChange={e => handleTamanhoMidiaChange(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Hash{' '}
                        {sectionVisibility.section3 && <span className={styles.required}>*</span>}
                      </label>
                      <input
                        type='text'
                        value={formData.hashMidia}
                        onChange={e => handleInputChange('hashMidia', e.target.value)}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Senha de Acesso{' '}
                        {sectionVisibility.section3 && <span className={styles.required}>*</span>}
                      </label>
                      <input
                        type='text'
                        value={formData.senhaMidia}
                        onChange={e => handleInputChange('senhaMidia', e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 4 - Dados da Pesquisa */}
            {sectionVisibility.section4 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <span className={styles.sectionIcon}>04</span>
                    <h2 className={styles.sectionTitle}>Dados da Pesquisa</h2>
                  </div>
                </div>

                <div className={styles.sectionContent}>
                  <div className={styles.pesquisaList}>
                    {formData.pesquisas.map((pesquisa, index) => (
                      <div
                        key={index}
                        className={`${styles.pesquisaGrid} ${pesquisa.complementar !== undefined ? styles.expanded : ''}`}
                      >
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            Tipo{' '}
                            {sectionVisibility.section4 && (
                              <span className={styles.required}>*</span>
                            )}
                          </label>
                          <div className={styles.customDropdownContainer}>
                            <div
                              className={`${styles.customDropdownTrigger} ${dropdownOpen[`tipoPesquisa_${index}`] ? styles.customDropdownTriggerOpen : ''}`}
                              onClick={() => toggleDropdown(`tipoPesquisa_${index}`)}
                              tabIndex={0}
                              data-dropdown={`tipoPesquisa_${index}`}
                              onKeyDown={e => {
                                const fieldKey = `tipoPesquisa_${index}`;
                                if (
                                  dropdownOpen[fieldKey] &&
                                  e.key === 'Enter' &&
                                  (selectedIndex[fieldKey] ?? -1) >= 0
                                ) {
                                  // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const selectedIdx = selectedIndex[fieldKey] ?? -1;
                                  if (selectedIdx < tiposPesquisa.length) {
                                    handleTipoPesquisaSelect(
                                      index,
                                      tiposPesquisa[selectedIdx].value,
                                      setDropdownOpen,
                                      setSelectedIndex
                                    );
                                  }
                                } else if (e.key === 'Enter' || e.key === ' ') {
                                  // Caso contrário, abrir/fechar dropdown
                                  e.preventDefault();
                                  if (!dropdownOpen[fieldKey]) {
                                    e.stopPropagation();
                                  }
                                  toggleDropdown(fieldKey);
                                } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                  // Navegação por setas - abre dropdown se fechado, navega se aberto
                                  e.preventDefault();
                                  if (!dropdownOpen[fieldKey]) {
                                    // Se dropdown fechado, abrir e ir para primeiro item
                                    toggleDropdown(fieldKey);
                                    setSelectedIndex(prev => ({
                                      ...prev,
                                      [fieldKey]: 0,
                                    }));
                                  } else {
                                    // Se dropdown aberto, navegar
                                    const currentIndex = selectedIndex[fieldKey] ?? -1;
                                    let nextIndex;

                                    if (e.key === 'ArrowDown') {
                                      nextIndex =
                                        currentIndex < tiposPesquisa.length - 1
                                          ? currentIndex + 1
                                          : currentIndex;
                                    } else {
                                      nextIndex =
                                        currentIndex > 0 ? currentIndex - 1 : currentIndex;
                                    }

                                    setSelectedIndex(prev => ({
                                      ...prev,
                                      [fieldKey]: nextIndex,
                                    }));
                                    scrollToDropdownItem(fieldKey, nextIndex);
                                  }
                                } else if (e.key === 'Tab') {
                                  // Fechar dropdown ao pressionar Tab
                                  setDropdownOpen(prev => ({
                                    ...prev,
                                    [fieldKey]: false,
                                  }));
                                }
                              }}
                            >
                              <span className={styles.customDropdownValue}>
                                {tiposPesquisa.find(t => t.value === pesquisa.tipo)?.label || ''}
                              </span>
                              <span className={styles.dropdownArrow}>
                                {dropdownOpen[`tipoPesquisa_${index}`] ? '▲' : '▼'}
                              </span>
                            </div>
                            {dropdownOpen[`tipoPesquisa_${index}`] && (
                              <div className={styles.multiSelectDropdown}>
                                {tiposPesquisa.map((tipo, tipoIndex) => (
                                  <label
                                    key={tipo.value}
                                    className={`${styles.checkboxLabel} ${
                                      selectedIndex[`tipoPesquisa_${index}`] === tipoIndex
                                        ? styles.checkboxLabelFocused
                                        : ''
                                    }`}
                                    onClick={() =>
                                      handleTipoPesquisaSelect(
                                        index,
                                        tipo.value,
                                        setDropdownOpen,
                                        setSelectedIndex
                                      )
                                    }
                                  >
                                    <span className={styles.checkboxText}>{tipo.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            Identificador{' '}
                            {sectionVisibility.section4 && (
                              <span className={styles.required}>*</span>
                            )}
                          </label>
                          <input
                            type='text'
                            value={pesquisa.identificador}
                            onChange={e => updatePesquisa(index, 'identificador', e.target.value)}
                            onPaste={e => handlePasteMultipleValues(e, index)}
                            className={styles.formInput}
                          />
                        </div>

                        {pesquisa.complementar !== undefined && (
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Complementar{' '}
                              {sectionVisibility.section2 && (
                                <span className={styles.required}>*</span>
                              )}
                            </label>
                            <input
                              type='text'
                              value={pesquisa.complementar}
                              onChange={e => updatePesquisa(index, 'complementar', e.target.value)}
                              className={styles.formInput}
                              data-field={`complementar_${index}`}
                            />
                          </div>
                        )}

                        <div className={styles.pesquisaControls}>
                          <button
                            type='button'
                            onClick={() => togglePesquisaComplementar(index)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                togglePesquisaComplementar(index);
                              }
                            }}
                            className={styles.btnExpand}
                            title={
                              pesquisa.complementar !== undefined
                                ? 'Remover coluna'
                                : 'Adicionar coluna'
                            }
                          >
                            {pesquisa.complementar !== undefined ? '⊖' : '⊕'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.pesquisaAddControls}>
                    <button
                      type='button'
                      onClick={removePesquisa}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          removePesquisa();
                        }
                      }}
                      className={styles.btnRemove}
                      title='Remover última linha'
                    >
                      −
                    </button>
                    <button
                      type='button'
                      onClick={addPesquisa}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          addPesquisa();
                        }
                      }}
                      className={styles.btnAdd}
                      title='Adicionar linha'
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Footer - Botões de Ação */}
            <footer className={styles.formActions}>
              <button type='submit' className={styles.btnSubmit}>
                {isEditMode ? 'Salvar Alterações' : 'Criar Documento'}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Toast de Validação */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
