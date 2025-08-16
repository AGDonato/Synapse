// src/pages/NovaDemandaPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { type Option } from '../components/forms/SearchableSelect';
import Toast from '../components/ui/Toast';
import { useDemandas } from '../hooks/useDemandas';
import styles from './NovaDemandaPage.module.css';

// Importando dados para os selects
import { mockAnalistas } from '../data/mockAnalistas';
import { mockDistribuidores } from '../data/mockDistribuidores';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockTiposDemandas } from '../data/mockTiposDemandas';

// Importando utilitários de busca
import { filterWithAdvancedSearch } from '../utils/searchUtils';

// Tipo do formulário
type FormDataState = {
  tipoDemanda: Option | null;
  solicitante: Option | null;
  dataInicial: string;
  descricao: string;
  sged: string;
  autosAdministrativos: string;
  pic: string;
  autosJudiciais: string;
  autosExtrajudiciais: string;
  alvos: string;
  identificadores: string;
  analista: Option | null;
  distribuidor: Option | null;
};

export default function NovaDemandaPage() {
  const { demandas, addDemanda, updateDemanda } = useDemandas();
  const navigate = useNavigate();
  const { demandaId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(demandaId);
  const returnTo = searchParams.get('returnTo');

  const [dropdownOpen, setDropdownOpen] = useState({
    tipoDemanda: false,
    analista: false,
    distribuidor: false,
  });

  // Estado para campos de busca
  const [searchResults, setSearchResults] = useState<{
    solicitante: string[];
  }>({
    solicitante: [],
  });

  const [showResults, setShowResults] = useState<{
    solicitante: boolean;
  }>({
    solicitante: false,
  });

  // Estado para navegação por teclado
  const [selectedIndex, setSelectedIndex] = useState<{
    solicitante: number;
    tipoDemanda: number;
    analista: number;
    distribuidor: number;
  }>({
    solicitante: -1,
    tipoDemanda: -1,
    analista: -1,
    distribuidor: -1,
  });

  // Prepare dados dos órgãos solicitantes
  const idsDosSolicitantes = mockRegrasOrgaos
    .filter(regra => regra.isSolicitante)
    .map(regra => regra.orgaoId);
  const orgaosSolicitantes = mockOrgaos.filter(orgao =>
    idsDosSolicitantes.includes(orgao.id)
  );

  // Lista de nomes dos solicitantes para busca (apenas nomes dos órgãos)
  const solicitantesDisponiveis = orgaosSolicitantes
    .map(orgao => orgao.nomeCompleto)
    .sort();

  // Mapa de órgãos para facilitar busca por abreviação
  const orgaosMap = new Map(
    orgaosSolicitantes.map(orgao => [orgao.nomeCompleto, orgao])
  );

  const [formData, setFormData] = useState<FormDataState>({
    tipoDemanda: null,
    solicitante: null,
    dataInicial: '',
    descricao: '',
    sged: '',
    autosAdministrativos: '',
    pic: '',
    autosJudiciais: '',
    autosExtrajudiciais: '',
    alvos: '',
    identificadores: '',
    analista: null,
    distribuidor: null,
  });

  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  // Carregar dados da demanda quando estiver em modo de edição
  useEffect(() => {
    if (isEditMode && demandaId && demandas.length > 0) {
      const demanda = demandas.find(d => d.id === parseInt(demandaId));
      if (demanda) {
        const tipoEncontrado = mockTiposDemandas.find(
          t => t.nome === demanda.tipoDemanda
        );
        const solicitanteEncontrado = orgaosSolicitantes.find(
          o =>
            o.nomeCompleto === demanda.orgao || o.abreviacao === demanda.orgao
        );
        const analistaEncontrado = mockAnalistas.find(
          a => a.nome === demanda.analista
        );
        const distribuidorEncontrado = mockDistribuidores.find(
          d => d.nome === demanda.distribuidor
        );

        setFormData({
          tipoDemanda: tipoEncontrado || null,
          solicitante: solicitanteEncontrado
            ? { id: 0, nome: demanda.orgao }
            : null,
          dataInicial: demanda.dataInicial || '',
          descricao: demanda.descricao || '',
          sged: demanda.sged || '',
          autosAdministrativos: demanda.autosAdministrativos || '',
          pic: demanda.pic || '',
          autosJudiciais: demanda.autosJudiciais || '',
          autosExtrajudiciais: demanda.autosExtrajudiciais || '',
          alvos:
            demanda.alvos !== undefined && demanda.alvos !== null
              ? String(demanda.alvos)
              : '',
          identificadores:
            demanda.identificadores !== undefined &&
            demanda.identificadores !== null
              ? String(demanda.identificadores)
              : '',
          analista: analistaEncontrado || null,
          distribuidor: distribuidorEncontrado || null,
        });
      }
    }
  }, [isEditMode, demandaId, demandas, orgaosSolicitantes]);

  // Event listener para fechar dropdown e resultados de busca quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Fechar dropdowns
      if (!target.closest(`[class*='multiSelectContainer']`)) {
        setDropdownOpen({
          tipoDemanda: false,
          analista: false,
          distribuidor: false,
        });
      }

      // Fechar resultados de busca
      if (!target.closest(`[class*='searchContainer']`)) {
        setShowResults({
          solicitante: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função para fechar outros dropdowns quando campo de busca recebe foco
  const closeOtherDropdowns = () => {
    setDropdownOpen({
      tipoDemanda: false,
      analista: false,
      distribuidor: false,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: numericValue,
    }));
  };

  const toggleDropdown = (
    field: 'tipoDemanda' | 'analista' | 'distribuidor'
  ) => {
    const isCurrentlyOpen = dropdownOpen[field];

    // Fechar todos os dropdowns primeiro
    setDropdownOpen({
      tipoDemanda: false,
      analista: false,
      distribuidor: false,
    });

    // Fechar também listas de busca quando abrir dropdown
    setShowResults({ solicitante: false });
    setSelectedIndex(prev => ({ ...prev, solicitante: -1 }));

    // Se o dropdown atual estava fechado, abri-lo
    if (!isCurrentlyOpen) {
      setDropdownOpen(prev => ({ ...prev, [field]: true }));
      setSelectedIndex(prev => ({ ...prev, [field]: -1 }));

      // Foca no dropdown após abrir
      setTimeout(() => {
        const dropdown = document.querySelector(
          `[data-dropdown="${field}"]`
        ) as HTMLElement;
        if (dropdown) {
          dropdown.focus();
        }
      }, 0);
    }
  };

  const handleTipoDemandaSelect = (tipo: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, tipoDemanda: tipo }));
    setDropdownOpen(prev => ({ ...prev, tipoDemanda: false }));
    setSelectedIndex(prev => ({ ...prev, tipoDemanda: -1 }));
    // Retornar foco para o trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="tipoDemanda"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleAnalistaSelect = (analista: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, analista: analista }));
    setDropdownOpen(prev => ({ ...prev, analista: false }));
    setSelectedIndex(prev => ({ ...prev, analista: -1 }));
    // Retornar foco para o trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="analista"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleDistribuidorSelect = (distribuidor: {
    id: number;
    nome: string;
  }) => {
    setFormData(prev => ({ ...prev, distribuidor: distribuidor }));
    setDropdownOpen(prev => ({ ...prev, distribuidor: false }));
    setSelectedIndex(prev => ({ ...prev, distribuidor: -1 }));
    // Retornar foco para o trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="distribuidor"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  // Função para formatar data com máscara DD/MM/YYYY
  const formatDateMask = (value: string): string => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara progressivamente
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Função para converter data DD/MM/YYYY para YYYY-MM-DD (formato HTML date)
  const convertToHTMLDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length < 10) return '';

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Função para converter data YYYY-MM-DD para DD/MM/YYYY
  const convertFromHTMLDate = (dateStr: string): string => {
    if (!dateStr) return '';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return '';
  };

  // Função para tratar mudança no campo de data com máscara
  const handleDateChange = (value: string) => {
    const formatted = formatDateMask(value);
    setFormData(prev => ({ ...prev, dataInicial: formatted }));
  };

  // Função para tratar mudança no campo de data via calendário
  const handleCalendarChange = (value: string) => {
    const formatted = convertFromHTMLDate(value);
    setFormData(prev => ({ ...prev, dataInicial: formatted }));
  };

  // Busca filtrada para solicitante com busca avançada
  const handleSolicitanteSearch = (query: string) => {
    // Busca tanto por nome completo quanto por abreviação
    const queryLower = query.toLowerCase().trim();

    const filtered = solicitantesDisponiveis.filter(nomeCompleto => {
      const orgao = orgaosMap.get(nomeCompleto);
      if (!orgao) return false;

      // Verifica se a query corresponde ao nome completo ou à abreviação
      const matchesNome = nomeCompleto.toLowerCase().includes(queryLower);
      const matchesAbreviacao = orgao.abreviacao
        .toLowerCase()
        .includes(queryLower);

      // Também suporta busca avançada no nome completo
      const matchesAdvanced =
        filterWithAdvancedSearch([nomeCompleto], query).length > 0;

      return matchesNome || matchesAbreviacao || matchesAdvanced;
    });

    setSearchResults(prev => ({ ...prev, solicitante: filtered }));
    setShowResults(prev => ({
      ...prev,
      solicitante: query.length > 0 && filtered.length > 0,
    }));
    setSelectedIndex(prev => ({ ...prev, solicitante: -1 })); // Reset seleção
  };

  // Função para scroll automático do item selecionado
  const scrollToSelectedItem = (index: number) => {
    setTimeout(() => {
      // Busca o container de resultados do solicitante
      const searchContainer = document.querySelector(
        `[data-field="solicitante"]`
      );
      const resultsContainer = searchContainer?.querySelector(
        '.searchResults, [class*="searchResults"]'
      );

      if (!resultsContainer) return;

      const selectedItem = resultsContainer.children[index] as HTMLElement;

      if (selectedItem && resultsContainer) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 0);
  };

  // Função para navegação por teclado - solicitante
  const handleKeyDown = (
    e: React.KeyboardEvent,
    callback: (value: string) => void
  ) => {
    const results = searchResults.solicitante;
    if (results.length === 0) return;

    const currentIndex = selectedIndex.solicitante;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex =
          currentIndex < results.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedIndex(prev => ({ ...prev, solicitante: nextIndex }));
        scrollToSelectedItem(nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        setSelectedIndex(prev => ({ ...prev, solicitante: prevIndex }));
        scrollToSelectedItem(prevIndex);
        break;
      }

      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex >= 0 && currentIndex < results.length) {
          const selectedValue = results[currentIndex];
          callback(selectedValue);
          setShowResults(prev => ({ ...prev, solicitante: false }));
          setSelectedIndex(prev => ({ ...prev, solicitante: -1 }));
        }
        break;

      case 'Escape':
        setShowResults(prev => ({ ...prev, solicitante: false }));
        setSelectedIndex(prev => ({ ...prev, solicitante: -1 }));
        break;
    }
  };

  // Função para navegação por teclado nos dropdowns
  const handleDropdownKeyDown = (
    e: React.KeyboardEvent,
    field: 'tipoDemanda' | 'analista' | 'distribuidor',
    options: Array<{ id: number; nome: string }>,
    selectCallback: (option: { id: number; nome: string }) => void
  ) => {
    if (!dropdownOpen[field] || options.length === 0) return;

    const currentIndex = selectedIndex[field];

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex =
          currentIndex === -1
            ? 0
            : currentIndex < options.length - 1
              ? currentIndex + 1
              : currentIndex; // Para no último item em vez de fazer loop
        setSelectedIndex(prev => ({ ...prev, [field]: nextIndex }));

        // Fazer scroll do item selecionado
        setTimeout(() => {
          const dropdown = document.querySelector(
            `[data-dropdown="${field}"][class*="multiSelectDropdown"]`
          );
          if (dropdown) {
            const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
            const focusedItem = items[nextIndex] as HTMLElement;
            if (focusedItem) {
              focusedItem.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
          }
        }, 0);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex =
          currentIndex === -1
            ? 0
            : currentIndex > 0
              ? currentIndex - 1
              : currentIndex; // Para no primeiro item em vez de fazer loop
        setSelectedIndex(prev => ({ ...prev, [field]: prevIndex }));

        // Fazer scroll do item selecionado
        setTimeout(() => {
          const dropdown = document.querySelector(
            `[data-dropdown="${field}"][class*="multiSelectDropdown"]`
          );
          if (dropdown) {
            const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
            const focusedItem = items[prevIndex] as HTMLElement;
            if (focusedItem) {
              focusedItem.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
          }
        }, 0);
        break;
      }

      case 'Tab':
        // Fechar dropdown quando navegar com Tab
        setDropdownOpen(prev => ({ ...prev, [field]: false }));
        setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
        break;

      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex >= 0 && currentIndex < options.length) {
          selectCallback(options[currentIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setDropdownOpen(prev => ({ ...prev, [field]: false }));
        setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
        break;
    }
  };

  const selectSolicitanteResult = (value: string) => {
    setFormData(prev => ({ ...prev, solicitante: { id: 0, nome: value } }));
    setShowResults(prev => ({ ...prev, solicitante: false }));
  };

  // Função para validar se a data não é maior que hoje
  const isDateValid = (dateString: string): boolean => {
    if (!dateString || dateString.length < 10) return true; // Data vazia é válida (campo obrigatório será validado pelo HTML)

    try {
      const [day, month, year] = dateString.split('/');
      const inputDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Final do dia atual

      return inputDate <= today;
    } catch {
      return false; // Data inválida
    }
  };

  // Prevenir submissão do formulário com Enter (exceto no botão submit e dropdowns)
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Se pressionar Enter e NÃO estiver no botão de submit
    if (e.key === 'Enter' && (e.target as HTMLElement).type !== 'submit') {
      // Não bloquear Enter se estiver dentro de um dropdown
      const target = e.target as HTMLElement;
      const isInDropdown =
        target.closest('[data-dropdown]') ||
        target.closest('.multiSelectDropdown') ||
        target.hasAttribute('data-dropdown');

      if (!isInDropdown) {
        e.preventDefault();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar data inicial
    if (!isDateValid(formData.dataInicial)) {
      setToastMessage('Data inicial não pode ser posterior à data atual.');
      setToastType('error');
      setShowToast(true);
      return; // Para a execução, não salva
    }
    if (isEditMode && demandaId) {
      // Em modo de edição, preservamos status e dataFinal existentes
      const demandaExistente = demandas.find(d => d.id === parseInt(demandaId));
      const dadosParaSalvar = {
        sged: formData.sged,
        tipoDemanda: formData.tipoDemanda?.nome || 'Não especificado',
        autosAdministrativos: formData.autosAdministrativos,
        pic: formData.pic,
        autosJudiciais: formData.autosJudiciais,
        autosExtrajudiciais: formData.autosExtrajudiciais,
        alvos: formData.alvos ? parseInt(formData.alvos) : 0,
        identificadores: formData.identificadores
          ? parseInt(formData.identificadores)
          : 0,
        distribuidor: formData.distribuidor?.nome || '',
        descricao:
          formData.descricao.substring(0, 50) +
          (formData.descricao.length > 50 ? '...' : ''),
        orgao: formData.solicitante?.nome || 'Não especificado',
        status: demandaExistente?.status || ('Fila de Espera' as const),
        analista: formData.analista?.nome || 'Não atribuído',
        dataInicial: formData.dataInicial,
        dataFinal: demandaExistente?.dataFinal || null,
      };
      updateDemanda(parseInt(demandaId), dadosParaSalvar);
      alert('Demanda atualizada com sucesso!');
    } else {
      // Em modo de criação, usamos valores padrão
      const dadosParaSalvar = {
        sged: formData.sged,
        tipoDemanda: formData.tipoDemanda?.nome || 'Não especificado',
        autosAdministrativos: formData.autosAdministrativos,
        pic: formData.pic,
        autosJudiciais: formData.autosJudiciais,
        autosExtrajudiciais: formData.autosExtrajudiciais,
        alvos: formData.alvos ? parseInt(formData.alvos) : 0,
        identificadores: formData.identificadores
          ? parseInt(formData.identificadores)
          : 0,
        distribuidor: formData.distribuidor?.nome || '',
        descricao:
          formData.descricao.substring(0, 50) +
          (formData.descricao.length > 50 ? '...' : ''),
        orgao: formData.solicitante?.nome || 'Não especificado',
        status: 'Fila de Espera' as const,
        analista: formData.analista?.nome || 'Não atribuído',
        dataInicial: formData.dataInicial,
        dataFinal: null,
      };
      addDemanda(dadosParaSalvar);
      alert('Nova demanda adicionada com sucesso!');
    }

    // Navegar para a página correta dependendo de onde veio
    if (isEditMode && returnTo === 'detail') {
      navigate(`/demandas/${demandaId}`);
    } else {
      navigate('/demandas');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <header className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditMode
              ? `Editar Demanda - SGED ${formData.sged || demandaId}`
              : 'Nova Demanda'}
          </h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.backButton}
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
        </header>

        <div className={styles.formContent}>
          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
            <div className={styles.sectionsGrid}>
              {/* Seção 01 - Informações Básicas */}
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
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              selectedIndex.tipoDemanda <
                              mockTiposDemandas.length
                            ) {
                              handleTipoDemandaSelect(
                                mockTiposDemandas[selectedIndex.tipoDemanda]
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            if (!dropdownOpen.tipoDemanda) {
                              e.stopPropagation();
                            }
                            toggleDropdown('tipoDemanda');
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao navegar com Tab do trigger
                            setDropdownOpen(prev => ({
                              ...prev,
                              tipoDemanda: false,
                            }));
                            setSelectedIndex(prev => ({
                              ...prev,
                              tipoDemanda: -1,
                            }));
                          } else if (
                            dropdownOpen.tipoDemanda &&
                            (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                          ) {
                            // Se dropdown está aberto e é navegação por setas, processar diretamente
                            handleDropdownKeyDown(
                              e,
                              'tipoDemanda',
                              mockTiposDemandas,
                              handleTipoDemandaSelect
                            );
                          } else {
                            handleDropdownKeyDown(
                              e,
                              'tipoDemanda',
                              mockTiposDemandas,
                              handleTipoDemandaSelect
                            );
                          }
                        }}
                      >
                        <span>{formData.tipoDemanda?.nome || ''}</span>
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
                            handleDropdownKeyDown(
                              e,
                              'tipoDemanda',
                              mockTiposDemandas,
                              handleTipoDemandaSelect
                            )
                          }
                        >
                          {mockTiposDemandas.map((tipo, index) => (
                            <label
                              key={tipo.id}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.tipoDemanda === index
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() => handleTipoDemandaSelect(tipo)}
                            >
                              <span className={styles.checkboxText}>
                                {tipo.nome}
                              </span>
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
                    <div
                      className={styles.searchContainer}
                      data-field="solicitante"
                    >
                      <input
                        type="text"
                        value={formData.solicitante?.nome || ''}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            solicitante: { id: 0, nome: e.target.value },
                          }));
                          handleSolicitanteSearch(e.target.value);
                        }}
                        onKeyDown={e =>
                          handleKeyDown(e, value =>
                            selectSolicitanteResult(value)
                          )
                        }
                        onFocus={() => {
                          // Fechar outros dropdowns quando campo de busca recebe foco
                          closeOtherDropdowns();
                        }}
                        className={styles.formInput}
                        placeholder=""
                        autoComplete="off"
                        required
                      />
                      {showResults.solicitante && (
                        <div className={styles.searchResults}>
                          {searchResults.solicitante.map((item, index) => (
                            <div
                              key={index}
                              className={`${styles.searchResultItem} ${
                                selectedIndex.solicitante === index
                                  ? styles.searchResultItemSelected
                                  : ''
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
                        required
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
                          const dateInput = wrapper?.querySelector(
                            'input[type="date"]'
                          ) as HTMLInputElement;
                          if (dateInput && dateInput.showPicker) {
                            dateInput.showPicker();
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
                      required
                      maxLength={240}
                    ></textarea>
                    <div className={styles.characterCount}>
                      {formData.descricao.length}/240
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 02 - Referências */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>02</span>
                  <h3 className={styles.sectionTitle}>Referências</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="sged">
                      SGED <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="sged"
                      id="sged"
                      value={formData.sged}
                      onChange={handleNumericChange}
                      className={styles.formInput}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor="autosAdministrativos"
                    >
                      Autos Administrativos
                    </label>
                    <input
                      type="text"
                      name="autosAdministrativos"
                      id="autosAdministrativos"
                      value={formData.autosAdministrativos}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="pic">
                      PIC
                    </label>
                    <input
                      type="text"
                      name="pic"
                      id="pic"
                      value={formData.pic}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor="autosJudiciais"
                    >
                      Autos Judiciais
                    </label>
                    <input
                      type="text"
                      name="autosJudiciais"
                      id="autosJudiciais"
                      value={formData.autosJudiciais}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor="autosExtrajudiciais"
                    >
                      Autos Extrajudiciais
                    </label>
                    <input
                      type="text"
                      name="autosExtrajudiciais"
                      id="autosExtrajudiciais"
                      value={formData.autosExtrajudiciais}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sectionsGrid}>
              {/* Seção 03 - Estatísticas Iniciais */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>03</span>
                  <h3 className={styles.sectionTitle}>Estatísticas Iniciais</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="alvos">
                      Alvos <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="alvos"
                      id="alvos"
                      value={formData.alvos}
                      onChange={handleNumericChange}
                      className={styles.formInput}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor="identificadores"
                    >
                      Identificadores <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="identificadores"
                      id="identificadores"
                      value={formData.identificadores}
                      onChange={handleNumericChange}
                      className={styles.formInput}
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Seção 04 - Responsáveis */}
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
                        data-dropdown="analista"
                        onKeyDown={e => {
                          if (
                            dropdownOpen.analista &&
                            e.key === 'Enter' &&
                            selectedIndex.analista >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedIndex.analista < mockAnalistas.length) {
                              handleAnalistaSelect(
                                mockAnalistas[selectedIndex.analista]
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            if (!dropdownOpen.analista) {
                              e.stopPropagation();
                            }
                            toggleDropdown('analista');
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao navegar com Tab do trigger
                            setDropdownOpen(prev => ({
                              ...prev,
                              analista: false,
                            }));
                            setSelectedIndex(prev => ({
                              ...prev,
                              analista: -1,
                            }));
                          } else if (
                            dropdownOpen.analista &&
                            (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                          ) {
                            // Se dropdown está aberto e é navegação por setas, processar diretamente
                            handleDropdownKeyDown(
                              e,
                              'analista',
                              mockAnalistas,
                              handleAnalistaSelect
                            );
                          } else {
                            handleDropdownKeyDown(
                              e,
                              'analista',
                              mockAnalistas,
                              handleAnalistaSelect
                            );
                          }
                        }}
                      >
                        <span>{formData.analista?.nome || ''}</span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.analista ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.analista && (
                        <div
                          className={styles.multiSelectDropdown}
                          tabIndex={0}
                          data-dropdown="analista"
                          onKeyDown={e =>
                            handleDropdownKeyDown(
                              e,
                              'analista',
                              mockAnalistas,
                              handleAnalistaSelect
                            )
                          }
                        >
                          {mockAnalistas.map((analista, index) => (
                            <label
                              key={analista.id}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.analista === index
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() => handleAnalistaSelect(analista)}
                            >
                              <span className={styles.checkboxText}>
                                {analista.nome}
                              </span>
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
                        data-dropdown="distribuidor"
                        onKeyDown={e => {
                          if (
                            dropdownOpen.distribuidor &&
                            e.key === 'Enter' &&
                            selectedIndex.distribuidor >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              selectedIndex.distribuidor <
                              mockDistribuidores.length
                            ) {
                              handleDistribuidorSelect(
                                mockDistribuidores[selectedIndex.distribuidor]
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            if (!dropdownOpen.distribuidor) {
                              e.stopPropagation();
                            }
                            toggleDropdown('distribuidor');
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao navegar com Tab do trigger
                            setDropdownOpen(prev => ({
                              ...prev,
                              distribuidor: false,
                            }));
                            setSelectedIndex(prev => ({
                              ...prev,
                              distribuidor: -1,
                            }));
                          } else if (
                            dropdownOpen.distribuidor &&
                            (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                          ) {
                            // Se dropdown está aberto e é navegação por setas, processar diretamente
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
                        <span>{formData.distribuidor?.nome || ''}</span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.distribuidor ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.distribuidor && (
                        <div
                          className={styles.multiSelectDropdown}
                          tabIndex={0}
                          data-dropdown="distribuidor"
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
                                selectedIndex.distribuidor === index
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() =>
                                handleDistribuidorSelect(distribuidor)
                              }
                            >
                              <span className={styles.checkboxText}>
                                {distribuidor.nome}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.submitSection}>
              <button type="submit" className={styles.submitButton}>
                {isEditMode ? 'Atualizar Demanda' : 'Cadastrar Demanda'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast para exibir mensagens de erro/sucesso */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
