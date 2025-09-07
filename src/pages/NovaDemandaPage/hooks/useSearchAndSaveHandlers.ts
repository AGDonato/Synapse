/**
 * Hook para gerenciamento de busca e salvamento de dados na Nova Demanda
 *
 * @description
 * Centraliza a lógica de busca com autocomplete e preparação de dados para salvamento:
 * - Busca inteligente de solicitantes com múltiplos critérios
 * - Filtragem avançada por nome completo e abreviação
 * - Seleção de resultados com atualização do formulário
 * - Preparação de dados formatados para persistência
 * - Integração com sistema de notificações
 * - Otimização com memoização de listas
 *
 * **Funcionalidades de Busca**:
 * - **Busca por Nome**: Correspondência parcial no nome completo do órgão
 * - **Busca por Abreviação**: Busca nas siglas dos órgãos (ex: "DPF", "PRF")
 * - **Busca Avançada**: Algoritmo inteligente de correspondência
 * - **Filtragem em Tempo Real**: Resultados atualizados conforme digitação
 * - **Case Insensitive**: Não diferencia maiúsculas/minúsculas
 *
 * **Preparação de Dados**:
 * - Conversão de tipos (string para number quando necessário)
 * - Formatação de campos (truncamento de descrição)
 * - Extração de valores de objetos Option
 * - Tratamento de campos opcionais/nulos
 * - Padronização para persistência
 *
 * @example
 * const {
 *   handleSolicitanteSearch,
 *   selectSolicitanteResult,
 *   prepararDadosComuns
 * } = useSearchAndSaveHandlers(
 *   orgaosSolicitantes,
 *   formData,
 *   stateSetters,
 *   toastHandlers
 * );
 *
 * // Buscar solicitantes
 * handleSolicitanteSearch("delegacia");
 *
 * // Selecionar resultado
 * selectSolicitanteResult("Delegacia de Polícia Federal");
 *
 * // Preparar dados para salvar
 * const dadosParaSalvar = prepararDadosComuns();
 *
 * @module pages/NovaDemandaPage/hooks/useSearchAndSaveHandlers
 */

import { useCallback, useMemo } from 'react';
import type { FormDataState } from './useFormularioEstado';
import type { Orgao } from '../../../types/entities';
import { filterWithAdvancedSearch } from '../../../utils/searchUtils';

// ========== INTERFACES ==========

/**
 * Interface para funções de atualização de estado
 * Agrupa setters para evitar prop drilling excessivo
 */
interface StateSetters {
  /** Atualiza resultados das buscas */
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResultsState>>;
  /** Controla exibição de listas de resultados */
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>;
  /** Controla índices selecionados para navegação */
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>;
  /** Atualiza dados do formulário */
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
}

/**
 * Interface para handlers de notificações toast
 * Centraliza controle de mensagens de feedback
 */
interface ToastHandlers {
  /** Define mensagem do toast */
  setToastMessage: React.Dispatch<React.SetStateAction<string>>;
  /** Define tipo do toast (error, success, warning) */
  setToastType: React.Dispatch<React.SetStateAction<'error' | 'success' | 'warning'>>;
  /** Controla exibição do toast */
  setShowToast: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Estado dos resultados de busca por campo
 * Armazena listas filtradas para autocomplete
 */
interface SearchResultsState {
  /** Resultados filtrados da busca de solicitantes */
  solicitante: string[];
}

/**
 * Estado de exibição das listas de resultados
 * Controla quando mostrar dropdowns de autocomplete
 */
interface ShowResultsState {
  /** Se deve mostrar lista de solicitantes */
  solicitante: boolean;
}

/**
 * Estado dos índices selecionados para navegação por teclado
 * Usado para destacar itens durante navegação
 */
interface SelectedIndexState {
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
 * Hook que gerencia busca e preparação de dados para salvamento
 *
 * @param orgaosSolicitantes - Lista de órgãos disponíveis para busca
 * @param formData - Dados atuais do formulário
 * @param stateSetters - Funções para atualizar estados do formulário
 * @param toastHandlers - Funções para controlar notificações toast
 * @returns Objeto com funções de busca e preparação de dados
 */
export const useSearchAndSaveHandlers = (
  orgaosSolicitantes: Orgao[],
  formData: FormDataState,
  stateSetters: StateSetters,
  toastHandlers: ToastHandlers
) => {
  // ===== DESTRUCTURING DE HANDLERS =====
  const { setSearchResults, setShowResults, setSelectedIndex, setFormData } = stateSetters;
  const { setToastMessage, setToastType, setShowToast } = toastHandlers;

  // ===== LISTAS OTIMIZADAS COM MEMOIZAÇÃO =====
  /**
   * Lista ordenada de solicitantes disponíveis para busca
   *
   * **Otimizações**:
   * - Memoizada para evitar recriação desnecessária
   * - Ordenada alfabeticamente para melhor UX
   * - Extrai apenas nomes completos (campo de busca principal)
   */
  const solicitantesDisponiveis = useMemo(
    () => orgaosSolicitantes.map(orgao => orgao.nomeCompleto).sort(),
    [orgaosSolicitantes]
  );

  /**
   * Mapa de órgãos para acesso rápido durante filtragem
   *
   * **Performance**:
   * - Map oferece acesso O(1) vs Array.find O(n)
   * - Facilita busca por abreviações
   * - Memoizado para evitar reconstrução
   */
  const orgaosMap = useMemo(
    () => new Map(orgaosSolicitantes.map(orgao => [orgao.nomeCompleto, orgao])),
    [orgaosSolicitantes]
  );

  // ===== FUNCIONALIDADES DE BUSCA =====
  /**
   * Executa busca inteligente de solicitantes com múltiplos critérios
   *
   * **Algoritmo de Busca**:
   * 1. **Normalização**: Converte query para lowercase e remove espaços
   * 2. **Filtragem Múltipla**: Testa 3 critérios de correspondência
   * 3. **Atualização de Estados**: Sincroniza resultados e controles de UI
   *
   * **Critérios de Correspondência**:
   * - **Nome Completo**: Busca parcial no nome do órgão
   * - **Abreviação**: Busca na sigla do órgão (ex: DPF, PRF)
   * - **Busca Avançada**: Algoritmo fuzzy para correspondência inteligente
   *
   * **Controle de Exibição**:
   * - Só mostra resultados se query não vazia E há resultados
   * - Reset do índice selecionado a cada nova busca
   * - Atualização em tempo real conforme digitação
   *
   * @param query - Termo de busca digitado pelo usuário
   */
  const handleSolicitanteSearch = useCallback(
    (query: string) => {
      // Normalização da query para busca case-insensitive
      const queryLower = query.toLowerCase().trim();

      // ===== FILTRAGEM COM MÚLTIPLOS CRITÉRIOS =====
      const filtered = solicitantesDisponiveis.filter(nomeCompleto => {
        // Busca dados completos do órgão
        const orgao = orgaosMap.get(nomeCompleto);
        if (!orgao) return false; // Segurança: órgão deve existir no mapa

        // **CRITÉRIO 1**: Correspondência parcial no nome completo
        const matchesNome = nomeCompleto.toLowerCase().includes(queryLower);

        // **CRITÉRIO 2**: Correspondência parcial na abreviação/sigla
        const matchesAbreviacao = orgao.abreviacao.toLowerCase().includes(queryLower);

        // **CRITÉRIO 3**: Busca avançada com algoritmo fuzzy
        const matchesAdvanced = filterWithAdvancedSearch([nomeCompleto], query).length > 0;

        // Qualquer critério que coincida = incluir nos resultados
        return matchesNome || matchesAbreviacao || matchesAdvanced;
      });

      // ===== ATUALIZAÇÃO DOS ESTADOS =====
      // Atualiza lista de resultados filtrados
      setSearchResults((prev: SearchResultsState) => ({ ...prev, solicitante: filtered }));

      // Controla exibição da lista (só mostra se há query e resultados)
      setShowResults((prev: ShowResultsState) => ({
        ...prev,
        solicitante: query.length > 0 && filtered.length > 0,
      }));

      // Reset índice selecionado para nova busca
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));
    },
    [solicitantesDisponiveis, orgaosMap, setSearchResults, setShowResults, setSelectedIndex]
  );

  // ===== SELEÇÃO DE RESULTADOS =====
  /**
   * Processa seleção de um resultado da busca de solicitante
   *
   * **Ações Executadas**:
   * 1. Atualiza formulário com valor selecionado
   * 2. Esconde lista de resultados
   * 3. Cria objeto Option compatível com interface
   *
   * **Compatibilidade**:
   * - ID genérico (0) pois é baseado em string, não entidade real
   * - Nome mantém valor original selecionado pelo usuário
   *
   * @param value - Nome completo do órgão selecionado
   */
  const selectSolicitanteResult = useCallback(
    (value: string) => {
      // Atualiza campo solicitante no formulário
      setFormData(prev => ({ ...prev, solicitante: { id: 0, nome: value } }));

      // Esconde lista de resultados após seleção
      setShowResults((prev: ShowResultsState) => ({ ...prev, solicitante: false }));
    },
    [setFormData, setShowResults]
  );

  // ===== PREPARAÇÃO DE DADOS PARA PERSISTÊNCIA =====
  /**
   * Prepara e formata dados do formulário para salvamento
   *
   * **Transformações Aplicadas**:
   * - **Objetos Option**: Extrai apenas o nome (.nome)
   * - **Strings Numéricas**: Converte para number com fallback 0
   * - **Descrição**: Trunca para 50 caracteres + "..." se necessário
   * - **Campos Nulos**: Usa operador ?? para strings vazias
   *
   * **Mapeamento de Campos**:
   * - tipoDemanda.nome → tipoDemanda (string)
   * - alvos/identificadores → números inteiros
   * - descrição → versão truncada para preview
   * - solicitante.nome → orgao (compatibilidade com backend)
   *
   * @returns Objeto formatado pronto para persistência
   */
  const prepararDadosComuns = useCallback(
    () => ({
      // ===== CAMPOS DIRETOS (SEM TRANSFORMAÇÃO) =====
      sged: formData.sged,
      autosAdministrativos: formData.autosAdministrativos,
      pic: formData.pic,
      autosJudiciais: formData.autosJudiciais,
      autosExtrajudiciais: formData.autosExtrajudiciais,
      dataInicial: formData.dataInicial,

      // ===== CAMPOS COM EXTRAÇÃO DE NOMES =====
      tipoDemanda: formData.tipoDemanda?.nome ?? '',
      distribuidor: formData.distribuidor?.nome ?? '',
      analista: formData.analista?.nome ?? '',
      // Mapeamento: solicitante.nome → orgao (compatibilidade backend)
      orgao: formData.solicitante?.nome ?? '',

      // ===== CAMPOS COM CONVERSÃO NUMÉRICA =====
      // Converte strings para números, fallback 0 se inválido
      alvos: formData.alvos ? parseInt(formData.alvos) : 0,
      identificadores: formData.identificadores ? parseInt(formData.identificadores) : 0,

      // ===== CAMPOS COM FORMATAÇÃO ESPECIAL =====
      // Descrição truncada para preview/listagem (otimização de espaço)
      descricao:
        formData.descricao.substring(0, 50) + (formData.descricao.length > 50 ? '...' : ''),
    }),
    [formData]
  );

  // ===== UTILITÁRIOS DE NOTIFICAÇÃO =====
  /**
   * Exibe notificação toast de sucesso
   *
   * Utilitário para padronizar exibição de mensagens de sucesso
   * após operações de salvamento bem-sucedidas.
   *
   * @param message - Mensagem de sucesso a ser exibida
   */
  const showSuccessToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setToastType('success');
      setShowToast(true);
    },
    [setToastMessage, setToastType, setShowToast]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todas as funções de busca e preparação de dados
   *
   * @returns Objeto com funcionalidades de busca e salvamento
   */
  return {
    /** Executa busca inteligente de solicitantes */
    handleSolicitanteSearch,

    /** Seleciona resultado da busca e atualiza formulário */
    selectSolicitanteResult,

    /** Prepara dados do formulário para persistência */
    prepararDadosComuns,

    /** Utilitário para exibir toast de sucesso */
    showSuccessToast,
  };
};
