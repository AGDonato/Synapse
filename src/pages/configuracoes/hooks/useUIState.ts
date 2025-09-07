/**
 * Hook para gerenciamento do estado da interface das Configurações
 *
 * @description
 * Centraliza todo o controle de estado da UI da página de configurações:
 * - Controle de seções expansíveis/retráteis (accordion)
 * - Gerenciamento de abas internas por seção
 * - Estados de hover para melhor UX visual
 * - Termos de busca para filtros de dados
 * - Handlers para interações do usuário
 * - Organização hierarchica de estados complexos
 *
 * **Estrutura da Página**:
 * - **Cadastros**: Seção expansível com abas Autoridades e Órgãos
 * - **Documentos**: Seção expansível com abas Assunto/Tipo e Visibilidade
 * - **Busca**: Filtros independentes por seção/aba
 * - **Visual**: Estados de hover para feedback visual
 *
 * **Funcionalidades**:
 * - Expansão/colapsamento de seções via accordion
 * - Navegação entre abas dentro de cada seção
 * - Controle de efeitos visuais (hover)
 * - Filtragem independente por contexto
 * - Estados iniciais padronizados
 *
 * **Padrões de Nomenclatura**:
 * - isSectionOpen: Estados booleanos de expansão
 * - sectionActiveTab: Tab ativa de cada seção
 * - handleToggleSection: Handlers de alternância
 * - searchTermContext: Termos de busca específicos
 *
 * @example
 * const {
 *   isCadastrosOpen,
 *   cadastrosActiveTab,
 *   handleToggleCadastros,
 *   setCadastrosActiveTab
 * } = useUIState();
 *
 * // Controlar seção
 * <button onClick={handleToggleCadastros}>
 *   {isCadastrosOpen ? 'Fechar' : 'Abrir'} Cadastros
 * </button>
 *
 * // Controlar aba
 * <TabButton
 *   active={cadastrosActiveTab === 'autoridades'}
 *   onClick={() => setCadastrosActiveTab('autoridades')}
 * >
 *
 * @module pages/configuracoes/hooks/useUIState
 */

import { useState } from 'react';

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que centraliza todo o estado da interface de configurações
 *
 * @returns Objeto com estados, setters e handlers da UI
 */
export const useUIState = () => {
  // ===== ESTADOS DE SEÇÕES EXPANSÍVEIS =====
  /**
   * Controla se a seção de cadastros está expandida
   *
   * **Seção Cadastros inclui**:
   * - Aba Autoridades: Gerenciamento de pessoas e cargos
   * - Aba Órgãos: Gerenciamento de instituições
   */
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);

  /**
   * Controla se a seção de documentos está expandida
   *
   * **Seção Documentos inclui**:
   * - Aba Assunto/Tipo: Configurações de categorização
   * - Aba Visibilidade: Configurações de acesso
   */
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);

  // ===== ESTADOS DE ABAS INTERNAS =====
  /**
   * Controla qual aba está ativa na seção de cadastros
   *
   * **Opções**:
   * - 'autoridades': Gerenciamento de pessoas (padrão)
   * - 'orgaos': Gerenciamento de instituições
   */
  const [cadastrosActiveTab, setCadastrosActiveTab] = useState<'autoridades' | 'orgaos'>(
    'autoridades'
  );

  /**
   * Controla qual aba está ativa na seção de documentos
   *
   * **Opções**:
   * - 'assunto-tipo': Configurações de assunto e tipo (padrão)
   * - 'visibilidade': Configurações de permissões
   */
  const [documentosActiveTab, setDocumentosActiveTab] = useState<'assunto-tipo' | 'visibilidade'>(
    'assunto-tipo'
  );

  // ===== ESTADOS VISUAIS =====
  /**
   * Controla qual cabeçalho de seção está com hover
   *
   * Usado para aplicar efeitos visuais (destaque, ícones, etc.)
   * durante interação do mouse com cabeçalhos das seções.
   */
  const [hoveredSectionHeader, setHoveredSectionHeader] = useState<string | null>(null);

  // ===== ESTADOS DE BUSCA/FILTRO =====
  /**
   * Termo de busca para filtrar órgãos
   *
   * Aplicado na aba 'orgaos' da seção cadastros para filtrar
   * lista de instituições por nome, sigla ou outros critérios.
   */
  const [searchTermOrgaos, setSearchTermOrgaos] = useState('');

  /**
   * Termo de busca para filtrar autoridades
   *
   * Aplicado na aba 'autoridades' da seção cadastros para filtrar
   * lista de pessoas por nome, cargo ou outros critérios.
   */
  const [searchTermAutoridades, setSearchTermAutoridades] = useState('');

  // ===== HANDLERS DE INTERAÇÃO =====
  /**
   * Alterna estado de expansão da seção cadastros
   *
   * Implementa lógica de accordion: expande se fechado, fecha se aberto.
   * Mantém estado de abas internas inalterado.
   */
  const handleToggleCadastros = () => setIsCadastrosOpen(!isCadastrosOpen);

  /**
   * Alterna estado de expansão da seção documentos
   *
   * Implementa lógica de accordion: expande se fechado, fecha se aberto.
   * Mantém estado de abas internas inalterado.
   */
  const handleToggleDocumentos = () => setIsDocumentosOpen(!isDocumentosOpen);

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todos os estados e funções necessários para a UI
   *
   * @returns Objeto organizador com estados, setters e handlers
   */
  return {
    // ===== ESTADOS DE EXPANSÃO =====
    /** Se a seção de cadastros está expandida */
    isCadastrosOpen,
    /** Se a seção de documentos está expandida */
    isDocumentosOpen,

    // ===== ESTADOS DE NAVEGAÇÃO =====
    /** Aba ativa na seção cadastros (autoridades | orgaos) */
    cadastrosActiveTab,
    /** Aba ativa na seção documentos (assunto-tipo | visibilidade) */
    documentosActiveTab,

    // ===== ESTADOS VISUAIS =====
    /** Cabeçalho de seção atualmente com hover (ou null) */
    hoveredSectionHeader,

    // ===== ESTADOS DE BUSCA =====
    /** Termo de busca para filtrar órgãos */
    searchTermOrgaos,
    /** Termo de busca para filtrar autoridades */
    searchTermAutoridades,

    // ===== SETTERS DE NAVEGAÇÃO =====
    /** Define qual aba está ativa na seção cadastros */
    setCadastrosActiveTab,
    /** Define qual aba está ativa na seção documentos */
    setDocumentosActiveTab,

    // ===== SETTERS VISUAIS =====
    /** Define qual cabeçalho tem efeito hover */
    setHoveredSectionHeader,

    // ===== SETTERS DE BUSCA =====
    /** Define termo de busca para órgãos */
    setSearchTermOrgaos,
    /** Define termo de busca para autoridades */
    setSearchTermAutoridades,

    // ===== HANDLERS DE INTERAÇÃO =====
    /** Alterna expansão da seção cadastros */
    handleToggleCadastros,
    /** Alterna expansão da seção documentos */
    handleToggleDocumentos,
  };
};
