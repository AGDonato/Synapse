// src/pages/NovaDemandaPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Toast from '../components/ui/Toast';
import { useDemandasData } from '../hooks/queries/useDemandas';
import styles from './NovaDemandaPage.module.css';

// Componentes das seções
import { FormularioSecaoBasica } from './NovaDemandaPage/components/FormularioSecaoBasica';
import { FormularioSecaoReferencias } from './NovaDemandaPage/components/FormularioSecaoReferencias';
import { FormularioSecaoEstatisticas } from './NovaDemandaPage/components/FormularioSecaoEstatisticas';
import { FormularioSecaoResponsaveis } from './NovaDemandaPage/components/FormularioSecaoResponsaveis';

// Hooks customizados
import { useFormularioEstado } from './NovaDemandaPage/hooks/useFormularioEstado';
import { useFormularioValidacao } from './NovaDemandaPage/hooks/useFormularioValidacao';
import { useNavegacaoTeclado } from './NovaDemandaPage/hooks/useNavegacaoTeclado';

// Dados mockados
import { mockAnalistas } from '../data/mockAnalistas';
import { mockDistribuidores } from '../data/mockDistribuidores';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockTiposDemandas } from '../data/mockTiposDemandas';

// Utilitários de busca
import { filterWithAdvancedSearch } from '../utils/searchUtils';

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
    return mockOrgaos.filter(orgao =>
      idsDosSolicitantes.includes(orgao.id)
    );
  }, []);

  // Lista de nomes dos solicitantes para busca (apenas nomes dos órgãos)
  const solicitantesDisponiveis = useMemo(() => 
    orgaosSolicitantes
      .map(orgao => orgao.nomeCompleto)
      .sort()
  , [orgaosSolicitantes]);

  // Mapa de órgãos para facilitar busca por abreviação
  const orgaosMap = useMemo(() => 
    new Map(
      orgaosSolicitantes.map(orgao => [orgao.nomeCompleto, orgao])
    )
  , [orgaosSolicitantes]);

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

  // Função auxiliar para carregar dados da demanda
  const loadDemandaData = useCallback(() => {
    if (!isEditMode || !demandaId || demandas.length === 0 || hasLoadedInitialData) return;

    const demanda = demandas.find(d => d.id === parseInt(demandaId));
    if (!demanda) return;

    const tipoEncontrado = mockTiposDemandas.find(t => t.nome === demanda.tipoDemanda);
    const solicitanteEncontrado = orgaosSolicitantes.find(o => 
      o.nomeCompleto === demanda.orgao || o.abreviacao === demanda.orgao
    );
    const analistaEncontrado = mockAnalistas.find(a => a.nome === demanda.analista);
    const distribuidorEncontrado = mockDistribuidores.find(d => d.nome === demanda.distribuidor);

    setFormData({
      tipoDemanda: tipoEncontrado ?? null,
      solicitante: solicitanteEncontrado ? { id: 0, nome: demanda.orgao } : null,
      dataInicial: demanda.dataInicial ?? '',
      descricao: demanda.descricao ?? '',
      sged: demanda.sged ?? '',
      autosAdministrativos: demanda.autosAdministrativos ?? '',
      pic: demanda.pic ?? '',
      autosJudiciais: demanda.autosJudiciais ?? '',
      autosExtrajudiciais: demanda.autosExtrajudiciais ?? '',
      alvos: (demanda.alvos !== undefined && demanda.alvos !== null) ? String(demanda.alvos) : '',
      identificadores: (demanda.identificadores !== undefined && demanda.identificadores !== null) 
        ? String(demanda.identificadores) : '',
      analista: analistaEncontrado ?? null,
      distribuidor: distribuidorEncontrado ?? null,
    });
    
    setHasLoadedInitialData(true);
  }, [isEditMode, demandaId, demandas, hasLoadedInitialData, orgaosSolicitantes, setFormData, setHasLoadedInitialData]);

  // Carregar dados da demanda quando estiver em modo de edição
  useEffect(() => {
    loadDemandaData();
  }, [loadDemandaData]);

  // Event listener para fechar dropdown e resultados de busca quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(`[class*='multiSelectContainer']`)) {
        setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
      }

      if (!target.closest(`[class*='searchContainer']`)) {
        setShowResults({ solicitante: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setDropdownOpen, setShowResults]);

  // Funções auxiliares para busca de solicitante
  function handleSolicitanteSearch(query: string) {
    const queryLower = query.toLowerCase().trim();

    const filtered = solicitantesDisponiveis.filter(nomeCompleto => {
      const orgao = orgaosMap.get(nomeCompleto);
      if (!orgao) return false;

      const matchesNome = nomeCompleto.toLowerCase().includes(queryLower);
      const matchesAbreviacao = orgao.abreviacao.toLowerCase().includes(queryLower);
      const matchesAdvanced = filterWithAdvancedSearch([nomeCompleto], query).length > 0;

      return matchesNome || matchesAbreviacao || matchesAdvanced;
    });

    setSearchResults(prev => ({ ...prev, solicitante: filtered }));
    setShowResults(prev => ({ ...prev, solicitante: query.length > 0 && filtered.length > 0 }));
    setSelectedIndex(prev => ({ ...prev, solicitante: -1 }));
  }

  const selectSolicitanteResult = (value: string) => {
    setFormData(prev => ({ ...prev, solicitante: { id: 0, nome: value } }));
    setShowResults(prev => ({ ...prev, solicitante: false }));
  };

  const toggleDropdown = (field: 'tipoDemanda' | 'analista' | 'distribuidor') => {
    const isCurrentlyOpen = dropdownOpen[field];

    setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
    setShowResults({ solicitante: false });
    setSelectedIndex(prev => ({ ...prev, solicitante: -1 }));

    if (!isCurrentlyOpen) {
      setDropdownOpen(prev => ({ ...prev, [field]: true }));
      setSelectedIndex(prev => ({ ...prev, [field]: -1 }));

      setTimeout(() => {
        const dropdown = document.querySelector(`[data-dropdown="${field}"]`) as HTMLElement | null;
        dropdown?.focus();
      }, 0);
    }
  };

  const handleTipoDemandaSelect = (tipo: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, tipoDemanda: tipo }));
    setDropdownOpen(prev => ({ ...prev, tipoDemanda: false }));
    setSelectedIndex(prev => ({ ...prev, tipoDemanda: -1 }));
    setTimeout(() => {
      const trigger = document.querySelector('[data-dropdown="tipoDemanda"]');
      (trigger as HTMLElement)?.focus();
    }, 0);
  };

  const handleAnalistaSelect = (analista: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, analista: analista }));
    setDropdownOpen(prev => ({ ...prev, analista: false }));
    setSelectedIndex(prev => ({ ...prev, analista: -1 }));
    setTimeout(() => {
      const trigger = document.querySelector('[data-dropdown="analista"]');
      (trigger as HTMLElement)?.focus();
    }, 0);
  };

  const handleDistribuidorSelect = (distribuidor: { id: number; nome: string }) => {
    setFormData(prev => ({ ...prev, distribuidor: distribuidor }));
    setDropdownOpen(prev => ({ ...prev, distribuidor: false }));
    setSelectedIndex(prev => ({ ...prev, distribuidor: -1 }));
    setTimeout(() => {
      const trigger = document.querySelector('[data-dropdown="distribuidor"]');
      (trigger as HTMLElement)?.focus();
    }, 0);
  };

  const formatDateMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const convertToHTMLDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length < 10) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  const convertFromHTMLDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return '';
  };

  const handleDateChange = (value: string) => {
    const formatted = formatDateMask(value);
    setFormData(prev => ({ ...prev, dataInicial: formatted }));
  };

  const handleCalendarChange = (value: string) => {
    const formatted = convertFromHTMLDate(value);
    setFormData(prev => ({ ...prev, dataInicial: formatted }));
  };





  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    const isSubmitButton = (target as HTMLInputElement | HTMLButtonElement).type === 'submit';
    
    if (e.key === 'Enter' && !isSubmitButton) {
      const isInDropdown = target.closest('[data-dropdown]') ??
        target.closest('.multiSelectDropdown') ??
        target.hasAttribute('data-dropdown');

      if (!isInDropdown) {
        e.preventDefault();
      }
    }
  };


  // Preparar dados comuns para salvar
  const prepararDadosComuns = useCallback(() => ({
    sged: formData.sged,
    tipoDemanda: formData.tipoDemanda?.nome ?? '',
    autosAdministrativos: formData.autosAdministrativos,
    pic: formData.pic,
    autosJudiciais: formData.autosJudiciais,
    autosExtrajudiciais: formData.autosExtrajudiciais,
    alvos: formData.alvos ? parseInt(formData.alvos) : 0,
    identificadores: formData.identificadores ? parseInt(formData.identificadores) : 0,
    distribuidor: formData.distribuidor?.nome ?? '',
    descricao: formData.descricao.substring(0, 50) + (formData.descricao.length > 50 ? '...' : ''),
    orgao: formData.solicitante?.nome ?? '',
    analista: formData.analista?.nome ?? '',
    dataInicial: formData.dataInicial,
  }), [formData]);

  // Função para mostrar toast de sucesso
  const showSuccessToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
  }, [setToastMessage, setToastType, setShowToast]);

  // Função para salvar demanda
  const salvarDemanda = useCallback(() => {
    const dadosComuns = prepararDadosComuns();

    if (isEditMode && demandaId) {
      const demandaExistente = demandas.find(d => d.id === parseInt(demandaId));
      const dadosParaSalvar = {
        ...dadosComuns,
        status: demandaExistente?.status ?? ('Fila de Espera' as const),
        dataFinal: demandaExistente?.dataFinal ?? null,
      };
      updateDemanda(parseInt(demandaId), dadosParaSalvar);
      showSuccessToast('Demanda atualizada com sucesso!');
    } else {
      const dadosParaSalvar = {
        ...dadosComuns,
        status: 'Fila de Espera' as const,
        dataFinal: null,
      };
      createDemanda(dadosParaSalvar);
      showSuccessToast('Nova demanda adicionada com sucesso!');
    }

    navigate(isEditMode && returnTo === 'detail' ? `/demandas/${demandaId}` : '/demandas');
  }, [prepararDadosComuns, isEditMode, demandaId, demandas, updateDemanda, showSuccessToast, createDemanda, navigate, returnTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;
    salvarDemanda();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <header className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditMode
              ? `Editar Demanda - SGED ${formData.sged ?? demandaId}`
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
                handleKeyDown={(e, callback) => handleKeyDown(e, callback, handleSolicitanteSearch)}
                selectSolicitanteResult={selectSolicitanteResult}
                closeOtherDropdowns={closeOtherDropdowns}
                handleDateChange={handleDateChange}
                handleCalendarChange={handleCalendarChange}
                convertToHTMLDate={convertToHTMLDate}
                handleChange={handleChange}
                toggleDropdown={toggleDropdown}
                handleTipoDemandaSelect={handleTipoDemandaSelect}
                handleDropdownKeyDown={(e, field, options, selectCallback) => 
                  handleDropdownKeyDown(e, field, options, selectCallback, dropdownOpen, setDropdownOpen)
                }
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
                handleDropdownKeyDown={(e, field, options, selectCallback) => 
                  handleDropdownKeyDown(e, field, options, selectCallback, dropdownOpen, setDropdownOpen)
                }
                mockAnalistas={mockAnalistas}
                mockDistribuidores={mockDistribuidores}
              />
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
        duration={3000}
      />
    </div>
  );
}
