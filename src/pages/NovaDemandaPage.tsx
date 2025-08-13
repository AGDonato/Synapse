// src/pages/NovaDemandaPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { type Option } from '../components/forms/SearchableSelect';
import { useDemandas } from '../hooks/useDemandas';
import styles from './NovaDemandaPage.module.css';

// Importando dados para os selects
import { mockTiposDemandas } from '../data/mockTiposDemandas';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockDistribuidores } from '../data/mockDistribuidores';
import { mockAnalistas } from '../data/mockAnalistas';

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
  }>({
    solicitante: -1,
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
          descricao: demanda.assunto || '',
          sged: demanda.sged || '',
          autosAdministrativos: demanda.autosAdministrativos || '',
          pic: demanda.pic || '',
          autosJudiciais: demanda.autosJudiciais || '',
          autosExtrajudiciais: demanda.autosExtrajudiciais || '',
          alvos: demanda.alvos ? String(demanda.alvos) : '',
          identificadores: demanda.identificadores
            ? String(demanda.identificadores)
            : '',
          analista: analistaEncontrado || null,
          distribuidor: distribuidorEncontrado || null,
        });
      }
    }
  }, [isEditMode, demandaId, demandas.length]);

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
    setDropdownOpen(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleTipoDemandaSelect = (tipo: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, tipoDemanda: tipo }));
    setDropdownOpen(prev => ({ ...prev, tipoDemanda: false }));
  };

  const handleAnalistaSelect = (analista: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, analista: analista }));
    setDropdownOpen(prev => ({ ...prev, analista: false }));
  };

  const handleDistribuidorSelect = (distribuidor: {
    id: number;
    nome: string;
  }) => {
    setFormData(prev => ({ ...prev, distribuidor: distribuidor }));
    setDropdownOpen(prev => ({ ...prev, distribuidor: false }));
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

  // Função para navegação por teclado
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

  const selectSolicitanteResult = (value: string) => {
    setFormData(prev => ({ ...prev, solicitante: { id: 0, nome: value } }));
    setShowResults(prev => ({ ...prev, solicitante: false }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        assunto:
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
        assunto:
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
            {isEditMode ? 'Editar Demanda' : 'Nova Demanda'}
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
          <form onSubmit={handleSubmit}>
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
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown('tipoDemanda');
                          }
                        }}
                      >
                        <span>{formData.tipoDemanda?.nome || ''}</span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.tipoDemanda ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.tipoDemanda && (
                        <div className={styles.multiSelectDropdown}>
                          {mockTiposDemandas.map(tipo => (
                            <label
                              key={tipo.id}
                              className={styles.checkboxLabel}
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
                        className={styles.formInput}
                        placeholder=""
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
                      onChange={handleChange}
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
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown('analista');
                          }
                        }}
                      >
                        <span>{formData.analista?.nome || ''}</span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.analista ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.analista && (
                        <div className={styles.multiSelectDropdown}>
                          {mockAnalistas.map(analista => (
                            <label
                              key={analista.id}
                              className={styles.checkboxLabel}
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
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown('distribuidor');
                          }
                        }}
                      >
                        <span>{formData.distribuidor?.nome || ''}</span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.distribuidor ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.distribuidor && (
                        <div className={styles.multiSelectDropdown}>
                          {mockDistribuidores.map(distribuidor => (
                            <label
                              key={distribuidor.id}
                              className={styles.checkboxLabel}
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
    </div>
  );
}
