/**
 * Hook para efeitos e handlers de interação do formulário de Nova Demanda
 *
 * @description
 * Gerencia efeitos colaterais e handlers de eventos do formulário:
 * - Event listeners para cliques fora de elementos
 * - Carregamento de dados em modo edição
 * - Controle de submissão do formulário
 * - Navegação por teclado e atalhos
 * - Integração com operações CRUD de demandas
 * - Redirecionamento após operações
 *
 * **Funcionalidades Principais**:
 * - **Click Outside**: Fecha dropdowns e listas quando usuário clica fora
 * - **Auto Load**: Carrega dados automaticamente em modo edição
 * - **Keyboard Navigation**: Controla comportamento do Enter no formulário
 * - **Form Submission**: Gerencia validação e salvamento
 * - **Navigation**: Redireciona usuário após operações
 *
 * **Estados Gerenciados**:
 * - Fechamento automático de UI elements
 * - Carregamento de dados iniciais
 * - Validação antes de submissão
 * - Navegação contextual (criar vs editar)
 *
 * **Integração com CRUD**:
 * - Criação de novas demandas
 * - Atualização de demandas existentes
 * - Preservação de dados não editáveis (status, dataFinal)
 * - Mensagens de feedback apropriadas
 *
 * @example
 * const {
 *   handleFormKeyDown,
 *   handleSubmit
 * } = useFormEffectsAndHandlers(
 *   stateSetters,
 *   demandaHandlers,
 *   editModeData,
 *   formHandlers,
 *   formData
 * );
 *
 * // Usar nos elementos do formulário
 * <form onKeyDown={handleFormKeyDown} onSubmit={handleSubmit}>
 *   // campos do formulário
 * </form>
 *
 * @module pages/NovaDemandaPage/hooks/useFormEffectsAndHandlers
 */

import { useCallback, useEffect } from 'react';
import type { FormDataState, DropdownState } from './useFormularioEstado';
import type { Demanda } from '../../../types/entities';
import { useNavigate } from 'react-router-dom';

// ========== INTERFACES ==========

/**
 * Estado de exibição de resultados de busca
 */
interface ShowResultsState {
  /** Se deve mostrar lista de solicitantes */
  solicitante: boolean;
}

/**
 * Estrutura completa de dados de uma demanda para persistência
 * Inclui campos do formulário + campos de controle do sistema
 */
interface DemandaData {
  /** Status atual da demanda (Fila de Espera, Em Andamento, etc.) */
  status: string;
  /** Data de finalização da demanda (null se ainda ativa) */
  dataFinal: string | null;
  /** Tipo/categoria da demanda */
  tipoDemanda: string;
  /** Órgão solicitante */
  orgao: string;
  /** Analista responsável */
  analista: string;
  /** Distribuidor responsável */
  distribuidor: string;
  /** Data de início da demanda */
  dataInicial: string;
  /** Descrição da demanda */
  descricao: string;
  /** Número do protocolo SGED */
  sged: string;
  /** Autos administrativos */
  autosAdministrativos: string;
  /** Número do PIC */
  pic: string;
  /** Autos judiciais */
  autosJudiciais: string;
  /** Autos extrajudiciais */
  autosExtrajudiciais: string;
  /** Número de alvos */
  alvos: number;
  /** Número de identificadores */
  identificadores: number;
}

/**
 * Funções para controlar estados de UI
 */
interface StateSetters {
  /** Controla abertura de dropdowns */
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>;
  /** Controla exibição de resultados de busca */
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>;
}

/**
 * Handlers para operações CRUD de demandas
 */
interface DemandaHandlers {
  /** Atualiza demanda existente */
  updateDemanda: (id: number, data: Partial<any>) => Promise<void>;
  /** Cria nova demanda */
  createDemanda: (data: Partial<any>) => Promise<any>;
  /** Prepara dados do formulário para salvamento */
  prepararDadosComuns: () => any;
  /** Exibe toast de sucesso */
  showSuccessToast: (message: string) => void;
}

/**
 * Dados do modo de edição
 */
interface EditModeData {
  /** Se está em modo edição (true) ou criação (false) */
  isEditMode: boolean;
  /** ID da demanda sendo editada */
  demandaId: string | undefined;
  /** Lista de demandas disponíveis */
  demandas: Demanda[];
  /** Página de origem para redirecionamento */
  returnTo: string | null;
}

/**
 * Handlers do formulário
 */
interface FormHandlers {
  /** Carrega dados da demanda para edição */
  loadDemandaData: () => void;
  /** Valida dados do formulário */
  validateForm: (formData: FormDataState) => boolean;
}

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que gerencia efeitos e handlers do formulário de demanda
 *
 * @param stateSetters - Funções para controlar estados de UI
 * @param demandaHandlers - Handlers para operações CRUD
 * @param editModeData - Dados do modo de edição
 * @param formHandlers - Handlers específicos do formulário
 * @param formData - Dados atuais do formulário
 * @returns Objeto com handlers de eventos
 */
export const useFormEffectsAndHandlers = (
  stateSetters: StateSetters,
  demandaHandlers: DemandaHandlers,
  editModeData: EditModeData,
  formHandlers: FormHandlers,
  formData: FormDataState
) => {
  const navigate = useNavigate();

  // ===== EFEITO: CLICK OUTSIDE DETECTION =====
  /**
   * Configura event listener para fechar elementos de UI quando usuário clica fora
   *
   * **Elementos Detectados**:
   * - **Dropdowns**: Fecha dropdowns de seleção (tipo, analista, distribuidor)
   * - **Search Results**: Esconde listas de resultados de busca
   *
   * **Seletores de Detecção**:
   * - multiSelectContainer: Container dos dropdowns
   * - searchContainer: Container dos resultados de busca
   *
   * **Cleanup**: Remove event listener na desmontagem do componente
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // ===== CONTROLE DE DROPDOWNS =====
      // Se clique não foi dentro de um container de dropdown, fecha todos
      if (!target.closest(`[class*='multiSelectContainer']`)) {
        stateSetters.setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
      }

      // ===== CONTROLE DE RESULTADOS DE BUSCA =====
      // Se clique não foi dentro de um container de busca, esconde resultados
      if (!target.closest(`[class*='searchContainer']`)) {
        stateSetters.setShowResults({ solicitante: false });
      }
    };

    // Adiciona listener no documento (captura todos os cliques)
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup: remove listener na desmontagem
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [stateSetters]);

  // ===== EFEITO: AUTO-CARREGAMENTO DE DADOS =====
  /**
   * Carrega dados da demanda automaticamente em modo edição
   *
   * **Execução**:
   * - Roda na montagem do componente
   * - Re-executa se formHandlers mudar
   * - loadDemandaData tem suas próprias validações internas
   *
   * **Segurança**:
   * - Função loadDemandaData é resistente a múltiplas chamadas
   * - Só carrega se estiver em modo edição E ainda não carregou
   */
  useEffect(() => {
    formHandlers.loadDemandaData();
  }, [formHandlers]);

  // ===== HANDLER: NAVEGAÇÃO POR TECLADO =====
  /**
   * Controla comportamento da tecla Enter no formulário
   *
   * **Problema Resolvido**:
   * Por padrão, Enter em qualquer input submete o formulário,
   * mas isso interfere com navegação em dropdowns e listas.
   *
   * **Comportamento Implementado**:
   * - **Enter em Botão Submit**: Permite submissão normal
   * - **Enter em Dropdown/Lista**: Permite navegação/seleção
   * - **Enter em Outros Campos**: Previne submissão prematura
   *
   * **Detecção de Contexto**:
   * - Botão submit: type="submit"
   * - Dropdown: data-dropdown attribute ou classe específica
   * - Outros: previne submissão
   *
   * @param e - Evento de teclado do formulário
   */
  const handleFormKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;

    // Verifica se o alvo é um botão de submit
    const isSubmitButton = (target as HTMLInputElement | HTMLButtonElement).type === 'submit';

    // Só processa tecla Enter
    if (e.key === 'Enter' && !isSubmitButton) {
      // ===== DETECÇÃO DE CONTEXTO DE DROPDOWN =====
      // Verifica se o alvo está dentro de um dropdown ou lista
      const isInDropdown =
        target.closest('[data-dropdown]') ?? // Seletor de dropdown
        target.closest('.multiSelectDropdown') ?? // Classe de dropdown
        target.hasAttribute('data-dropdown'); // Atributo direto

      // ===== CONTROLE DE SUBMISSÃO =====
      // Se não está em dropdown, previne submissão prematura
      if (!isInDropdown) {
        e.preventDefault();
      }
      // Se está em dropdown, permite comportamento padrão (navegar/selecionar)
    }
    // Se não é Enter ou é botão submit, permite comportamento padrão
  }, []);

  // ===== OPERAÇÕES CRUD =====
  /**
   * Executa salvamento da demanda (criar ou atualizar)
   *
   * **Fluxo de Decisão**:
   * 1. **Modo Edição**: Atualiza demanda existente preservando dados do sistema
   * 2. **Modo Criação**: Cria nova demanda com status inicial
   *
   * **Dados Preservados em Edição**:
   * - **status**: Mantém status atual (Em Andamento, Finalizada, etc.)
   * - **dataFinal**: Preserva data de finalização se existir
   *
   * **Dados Padrão em Criação**:
   * - **status**: "Fila de Espera" (status inicial padrão)
   * - **dataFinal**: null (demanda ainda não finalizada)
   *
   * **Navegação Pós-Salvamento**:
   * - **Edição + returnTo='detail'**: Volta para página de detalhes da demanda
   * - **Outros casos**: Volta para lista de demandas
   */
  const salvarDemanda = useCallback(() => {
    // Obtém dados formatados do formulário
    const dadosComuns = demandaHandlers.prepararDadosComuns();

    // ===== FLUXO: MODO EDIÇÃO =====
    if (editModeData.isEditMode && editModeData.demandaId) {
      const demandaId = editModeData.demandaId;

      // Busca demanda existente para preservar dados do sistema
      const demandaExistente = editModeData.demandas.find(d => d.id === parseInt(demandaId));

      // Monta dados preservando informações de controle
      const dadosParaSalvar: DemandaData = {
        ...dadosComuns,
        // Preserva status atual (pode estar Em Andamento, Finalizada, etc.)
        status: demandaExistente?.status ?? 'Fila de Espera',
        // Preserva data de finalização se demanda já foi finalizada
        dataFinal: demandaExistente?.dataFinal ?? null,
      };

      // Executa atualização
      demandaHandlers.updateDemanda(parseInt(demandaId), dadosParaSalvar);
      demandaHandlers.showSuccessToast('Demanda atualizada com sucesso!');
    }

    // ===== FLUXO: MODO CRIAÇÃO =====
    else {
      // Monta dados com valores padrão para nova demanda
      const dadosParaSalvar: DemandaData = {
        ...dadosComuns,
        // Nova demanda sempre inicia na fila de espera
        status: 'Fila de Espera',
        // Nova demanda ainda não tem data de finalização
        dataFinal: null,
      };

      // Executa criação
      demandaHandlers.createDemanda(dadosParaSalvar);
      demandaHandlers.showSuccessToast('Nova demanda adicionada com sucesso!');
    }

    // ===== NAVEGAÇÃO PÓS-SALVAMENTO =====
    // Decide para onde redirecionar baseado no contexto
    navigate(
      editModeData.isEditMode && editModeData.returnTo === 'detail'
        ? `/demandas/${editModeData.demandaId}` // Volta para detalhes da demanda
        : '/demandas' // Volta para lista de demandas
    );
  }, [demandaHandlers, editModeData, navigate]);

  // ===== HANDLER: SUBMISSÃO DO FORMULÁRIO =====
  /**
   * Handler principal para submissão do formulário
   *
   * **Fluxo de Submissão**:
   * 1. **Prevenção**: Impede submissão padrão do browser
   * 2. **Validação**: Executa validação completa do formulário
   * 3. **Salvamento**: Se válido, executa operação CRUD apropriada
   *
   * **Validação como Gatekeeper**:
   * - Se validação falhar, para execução e exibe erro
   * - Se validação passar, prossegue com salvamento
   * - Validação inclui campos obrigatórios e regras de negócio
   *
   * **Integração**:
   * - Usa validateForm para verificação completa
   * - Usa salvarDemanda para persistência
   * - Ambos têm suas próprias responsabilidades bem definidas
   *
   * @param e - Evento de submissão do formulário
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      // Impede comportamento padrão de submissão do browser
      e.preventDefault();

      // ===== VALIDAÇÃO OBRIGATÓRIA =====
      // Se validação falhar, para execução e exibe mensagens de erro
      if (!formHandlers.validateForm(formData)) {
        return; // Para aqui, não executa salvamento
      }

      // ===== SALVAMENTO =====
      // Se validação passou, executa operação CRUD
      salvarDemanda();
    },
    [formHandlers, formData, salvarDemanda]
  );

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna handlers para uso no componente de formulário
   *
   * @returns Objeto com handlers de eventos do formulário
   */
  return {
    /** Handler para controle de navegação por teclado */
    handleFormKeyDown,

    /** Handler para submissão do formulário com validação */
    handleSubmit,
  };
};
