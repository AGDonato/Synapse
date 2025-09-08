/**
 * Hook para gerenciamento centralizado do estado do formulário de Nova Demanda
 *
 * @description
 * Centraliza todo o controle de estado do formulário de criação/edição de demandas:
 * - Estado dos dados do formulário (campos e valores)
 * - Controle de abertura/fechamento de dropdowns
 * - Gerenciamento de resultados de busca
 * - Estado de navegação por teclado
 * - Handlers de mudança de campos
 * - Controle de carregamento de dados iniciais
 *
 * **Tipos de Estados Gerenciados**:
 * - **FormData**: Todos os campos do formulário de demanda
 * - **Dropdowns**: Controle de abertura/fechamento de seleções
 * - **Search**: Resultados de busca para campos com autocomplete
 * - **Navigation**: Índices selecionados para navegação por teclado
 * - **Loading**: Estado de carregamento de dados iniciais
 *
 * **Campos do Formulário**:
 * - **Identificação**: Tipo de demanda, solicitante, data inicial
 * - **Descrição**: Descrição detalhada da demanda
 * - **Protocolos**: SGED, autos administrativos, PIC
 * - **Processos**: Autos judiciais e extrajudiciais
 * - **Investigação**: Alvos e identificadores
 * - **Responsáveis**: Analista e distribuidor
 *
 * @example
 * const {
 *   formData,
 *   setFormData,
 *   handleChange,
 *   dropdownOpen,
 *   closeOtherDropdowns
 * } = useFormularioEstado();
 *
 * // Usar em input
 * <input name="descricao" onChange={handleChange} />
 *
 * // Controlar dropdown
 * if (dropdownOpen.tipoDemanda) { ... }
 *
 * @module pages/NovaDemandaPage/hooks/useFormularioEstado
 */

import { useCallback, useState } from 'react';
import type { Option } from '../../../shared/components/forms/SearchableSelect';

// ========== INTERFACES DE ESTADO ==========

/**
 * Interface principal dos dados do formulário de demanda
 *
 * Contém todos os campos necessários para criar/editar uma demanda,
 * organizados logicamente por categoria de informação.
 */
export interface FormDataState {
  /** Tipo/categoria da demanda (dropdown) */
  tipoDemanda: Option | null;
  /** Solicitante da demanda (busca com autocomplete) */
  solicitante: Option | null;
  /** Data de início da demanda (formato DD/MM/AAAA) */
  dataInicial: string;
  /** Descrição detalhada da demanda */
  descricao: string;
  /** Número do protocolo SGED */
  sged: string;
  /** Número dos autos administrativos */
  autosAdministrativos: string;
  /** Número do PIC (Procedimento Investigatório Criminal) */
  pic: string;
  /** Números dos autos judiciais */
  autosJudiciais: string;
  /** Números dos autos extrajudiciais */
  autosExtrajudiciais: string;
  /** Lista de alvos da investigação */
  alvos: string;
  /** Identificadores relevantes (CPF, CNPJ, etc.) */
  identificadores: string;
  /** Analista responsável (dropdown) */
  analista: Option | null;
  /** Distribuidor responsável (dropdown) */
  distribuidor: Option | null;
}

/**
 * Estado de abertura/fechamento dos dropdowns
 *
 * Controla quais dropdowns estão atualmente abertos.
 * Apenas um dropdown pode estar aberto por vez.
 */
export interface DropdownState {
  /** Estado do dropdown de tipo de demanda */
  tipoDemanda: boolean;
  /** Estado do dropdown de analista */
  analista: boolean;
  /** Estado do dropdown de distribuidor */
  distribuidor: boolean;
  /** Permite extensão para novos dropdowns */
  [key: string]: boolean;
}

/**
 * Estado dos resultados de busca para campos com autocomplete
 *
 * Armazena listas filtradas conforme o usuário digita.
 */
export interface SearchState {
  /** Resultados da busca de solicitantes */
  solicitante: string[];
}

/**
 * Estado de exibição de resultados de busca
 *
 * Controla quando mostrar as listas de resultados filtrados.
 */
export interface ShowResultsState {
  /** Se deve mostrar resultados da busca de solicitante */
  solicitante: boolean;
}

/**
 * Estado dos índices selecionados para navegação por teclado
 *
 * Usado para destacar itens durante navegação com setas e Enter.
 */
export interface SelectedIndexState {
  /** Índice selecionado na lista de solicitantes */
  solicitante: number;
  /** Índice selecionado na lista de tipos de demanda */
  tipoDemanda: number;
  /** Índice selecionado na lista de analistas */
  analista: number;
  /** Índice selecionado na lista de distribuidores */
  distribuidor: number;
}

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que centraliza todo o gerenciamento de estado do formulário
 *
 * @returns Objeto com estados, setters e handlers do formulário
 */
export const useFormularioEstado = () => {
  // ===== ESTADO DOS DADOS DO FORMULÁRIO =====
  /**
   * Estado principal com todos os campos do formulário
   *
   * Inicializado com valores padrão apropriados para cada tipo:
   * - null para campos de seleção (dropdowns/autocomplete)
   * - string vazia para campos de texto
   */
  const [formData, setFormData] = useState<FormDataState>({
    // Campos de identificação
    tipoDemanda: null,
    solicitante: null,
    dataInicial: '',

    // Campos de descrição e detalhamento
    descricao: '',

    // Campos de protocolos e numerações
    sged: '',
    autosAdministrativos: '',
    pic: '',
    autosJudiciais: '',
    autosExtrajudiciais: '',

    // Campos de investigação
    alvos: '',
    identificadores: '',

    // Campos de responsáveis
    analista: null,
    distribuidor: null,
  });

  // ===== ESTADO DOS DROPDOWNS =====
  /**
   * Controla abertura/fechamento dos dropdowns
   *
   * Inicializado com todos fechados (false) para não atrapalhar
   * a experiência inicial do usuário.
   */
  const [dropdownOpen, setDropdownOpen] = useState<DropdownState>({
    tipoDemanda: false,
    analista: false,
    distribuidor: false,
  });

  // ===== ESTADO DE RESULTADOS DE BUSCA =====
  /**
   * Armazena resultados filtrados das buscas com autocomplete
   *
   * Inicializado com arrays vazios, preenchidos conforme
   * o usuário digita nos campos de busca.
   */
  const [searchResults, setSearchResults] = useState<SearchState>({
    solicitante: [],
  });

  // ===== ESTADO DE EXIBIÇÃO DE RESULTADOS =====
  /**
   * Controla quando mostrar listas de resultados de busca
   *
   * Inicializado como false para não mostrar resultados
   * até que o usuário comece a digitar.
   */
  const [showResults, setShowResults] = useState<ShowResultsState>({
    solicitante: false,
  });

  // ===== ESTADO DE NAVEGAÇÃO POR TECLADO =====
  /**
   * Índices dos itens selecionados para navegação com teclado
   *
   * Inicializado com -1 (nenhum item selecionado) para todos os campos.
   * Atualizado quando usuário usa setas para navegar nas listas.
   */
  const [selectedIndex, setSelectedIndex] = useState<SelectedIndexState>({
    solicitante: -1,
    tipoDemanda: -1,
    analista: -1,
    distribuidor: -1,
  });

  // ===== ESTADO DE CARREGAMENTO =====
  /**
   * Indica se os dados iniciais foram carregados
   *
   * Usado para determinar se deve carregar dados existentes
   * (modo edição) ou manter formulário limpo (modo criação).
   */
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // ===== HANDLERS DE MUDANÇA =====
  /**
   * Handler genérico para mudanças em campos de texto e textarea
   *
   * **Funcionalidade**:
   * - Extrai name e value do evento
   * - Atualiza o estado preservando outros campos
   * - Funciona com input[type="text"], textarea, etc.
   *
   * @param e - Evento de mudança do input ou textarea
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Atualiza apenas o campo específico, preservando os demais
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  /**
   * Handler especializado para campos que devem aceitar apenas números
   *
   * **Funcionalidade**:
   * - Remove todos os caracteres não-numéricos
   * - Útil para campos como SGED, PIC, autos, etc.
   * - Evita entrada de letras ou símbolos em campos numéricos
   *
   * @param e - Evento de mudança do input numérico
   */
  const handleNumericChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Sanitização: mantém apenas dígitos
    const numericValue = value.replace(/\D/g, '');

    // Atualiza campo com valor sanitizado
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  }, []);

  // ===== UTILITÁRIOS DE CONTROLE =====
  /**
   * Fecha todos os dropdowns de uma vez
   *
   * **Uso Comum**:
   * - Quando usuário clica fora dos dropdowns
   * - Ao pressionar Escape
   * - Antes de abrir um novo dropdown
   * - Durante mudança de foco
   */
  const closeOtherDropdowns = useCallback(() => {
    setDropdownOpen({
      tipoDemanda: false,
      analista: false,
      distribuidor: false,
    });
  }, []);

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todos os estados e funções necessários para o formulário
   *
   * @returns Objeto completo com estados, setters e handlers
   */
  return {
    // ===== DADOS DO FORMULÁRIO =====
    /** Estado atual dos dados do formulário */
    formData,
    /** Função para atualizar dados do formulário */
    setFormData,

    // ===== CONTROLE DE DROPDOWNS =====
    /** Estado de abertura dos dropdowns */
    dropdownOpen,
    /** Função para controlar abertura de dropdowns */
    setDropdownOpen,

    // ===== RESULTADOS DE BUSCA =====
    /** Resultados das buscas com autocomplete */
    searchResults,
    /** Função para atualizar resultados de busca */
    setSearchResults,

    // ===== EXIBIÇÃO DE RESULTADOS =====
    /** Estado de exibição dos resultados */
    showResults,
    /** Função para controlar exibição de resultados */
    setShowResults,

    // ===== NAVEGAÇÃO POR TECLADO =====
    /** Índices selecionados para navegação */
    selectedIndex,
    /** Função para atualizar índices selecionados */
    setSelectedIndex,

    // ===== CONTROLE DE CARREGAMENTO =====
    /** Se dados iniciais foram carregados */
    hasLoadedInitialData,
    /** Função para marcar dados como carregados */
    setHasLoadedInitialData,

    // ===== HANDLERS DE EVENTOS =====
    /** Handler genérico para campos de texto */
    handleChange,
    /** Handler especializado para campos numéricos */
    handleNumericChange,
    /** Utilitário para fechar todos os dropdowns */
    closeOtherDropdowns,
  };
};
