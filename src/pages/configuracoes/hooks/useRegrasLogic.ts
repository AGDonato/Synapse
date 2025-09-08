/**
 * Hook para gerenciamento da lógica de regras das Configurações
 *
 * @description
 * Centraliza toda a lógica de negócio para configuração de regras no sistema:
 * - Gerenciamento de regras específicas por órgão (solicitante, judicial)
 * - Configuração de regras por autoridade (judicial)
 * - Controle de associações entre assuntos e tipos de documento
 * - Configurações de visibilidade por seção de documento
 * - Detecção de mudanças (dirty state) para controle de salvamento
 * - Comparação com estados originais para verificar alterações
 *
 * **Arquitetura do Hook**:
 * - **Estados Originais**: Valores de referência para comparação
 * - **Estados Atuais**: Valores em edição pelo usuário
 * - **Estados Dirty**: Flags indicando se há mudanças não salvas
 * - **Handlers Especializados**: Funções otimizadas para cada tipo de regra
 * - **Detecção Inteligente**: Comparação JSON para identificar mudanças
 *
 * **Seções de Regras**:
 * - **Órgãos**: isSolicitante (pode ser solicitante), isOrgaoJudicial (órgão do judiciário)
 * - **Autoridades**: isAutoridadeJudicial (autoridade do poder judiciário)
 * - **Assuntos**: Associação de assuntos com tipos específicos de documento
 * - **Documentos**: Visibilidade por seções (section2, section3, section4)
 *
 * **Funcionalidades**:
 * - CRUD completo para regras específicas por entidade
 * - Validação automática de mudanças com estados dirty
 * - Handlers otimizados com useCallback para performance
 * - Estrutura de dados consistente e tipada
 * - Integração com sistema de dados mockados
 *
 * **Padrões de Estado**:
 * - original*: Estado inicial para comparação
 * - current*: Estado atual em edição
 * - isDirty*: Flag de mudanças não salvas
 * - handle*Change: Modificadores de estado
 * - handleSaveChanges*: Confirmadores de salvamento
 *
 * @example
 * const {
 *   regrasOrgaos,
 *   isDirtyOrgaos,
 *   handleRuleChangeOrgaos,
 *   handleSaveChangesOrgaos
 * } = useRegrasLogic();
 *
 * // Modificar regra de órgão
 * handleRuleChangeOrgaos(123, 'isSolicitante', true);
 *
 * // Verificar se há mudanças
 * if (isDirtyOrgaos) {
 *   // Mostrar botão salvar
 * }
 *
 * // Salvar alterações
 * handleSaveChangesOrgaos();
 *
 * @module pages/configuracoes/hooks/useRegrasLogic
 */

import { useState, useCallback } from 'react';
import { type RegraOrgao, mockRegrasOrgaos } from '../../../shared/data/mockRegrasOrgaos';
import {
  type RegraAutoridade,
  mockRegrasAutoridades,
} from '../../../shared/data/mockRegrasAutoridades';
import { toggleDocumentoAssunto, updateSecaoConfig } from '../../../shared/data/documentoRegras';
import { mockAssuntos } from '../../../shared/data/mockAssuntos';

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que centraliza toda a lógica de regras de configuração
 *
 * @returns Objeto com estados, flags dirty e handlers para todas as seções de regras
 */
export const useRegrasLogic = () => {
  // ===== ESTADOS DE REFERÊNCIA (ORIGINAIS) =====
  /**
   * Estado original das regras de órgãos para comparação
   *
   * Mantém os valores iniciais carregados do mock para detectar
   * mudanças através de comparação JSON. Usado como baseline
   * para determinar se o usuário fez alterações não salvas.
   */
  const [originalRegrasOrgaos] = useState<RegraOrgao[]>(mockRegrasOrgaos);

  /**
   * Estado original das regras de autoridades para comparação
   *
   * Mantém os valores iniciais carregados do mock para detectar
   * mudanças através de comparação JSON. Usado como baseline
   * para determinar se o usuário fez alterações não salvas.
   */
  const [originalRegrasAutoridades] = useState<RegraAutoridade[]>(mockRegrasAutoridades);

  // ===== ESTADOS ATUAIS (EM EDIÇÃO) =====
  /**
   * Estado atual das regras de órgãos em edição
   *
   * **Estrutura da Regra**:
   * - orgaoId: ID único do órgão
   * - isSolicitante: Se o órgão pode ser solicitante de demandas
   * - isOrgaoJudicial: Se o órgão pertence ao poder judiciário
   *
   * **Comportamento**: Atualizado a cada modificação do usuário
   */
  const [regrasOrgaos, setRegrasOrgaos] = useState<RegraOrgao[]>(mockRegrasOrgaos);

  /**
   * Estado atual das regras de autoridades em edição
   *
   * **Estrutura da Regra**:
   * - autoridadeId: ID único da autoridade
   * - isAutoridadeJudicial: Se a autoridade pertence ao poder judiciário
   *
   * **Comportamento**: Atualizado a cada modificação do usuário
   */
  const [regrasAutoridades, setRegrasAutoridades] =
    useState<RegraAutoridade[]>(mockRegrasAutoridades);

  // ===== ESTADOS DE CONTROLE DIRTY =====
  /**
   * Flag indicando se há mudanças não salvas nas regras de órgãos
   *
   * Ativado quando regras são modificadas, desativado após salvamento.
   * Usado para mostrar indicadores visuais e habilitar botão salvar.
   */
  const [isDirtyOrgaos, setIsDirtyOrgaos] = useState(false);

  /**
   * Flag indicando se há mudanças não salvas nas regras de autoridades
   *
   * Ativado quando regras são modificadas, desativado após salvamento.
   * Usado para mostrar indicadores visuais e habilitar botão salvar.
   */
  const [isDirtyAutoridades, setIsDirtyAutoridades] = useState(false);

  /**
   * Flag indicando se há mudanças não salvas nas regras de assuntos
   *
   * Ativado quando associações assunto-documento são modificadas,
   * desativado após salvamento. Controla botão salvar da seção assuntos.
   */
  const [isDirtyAssuntos, setIsDirtyAssuntos] = useState(false);

  /**
   * Flag indicando se há mudanças não salvas nas configurações de documento
   *
   * Ativado quando configurações de visibilidade são modificadas,
   * desativado após salvamento. Controla botão salvar da seção documentos.
   */
  const [isDirtyDocumento, setIsDirtyDocumento] = useState(false);

  // ===== ESTADOS DE SELEÇÃO =====
  /**
   * ID do assunto selecionado para configuração
   *
   * Usado na seção de assuntos para determinar qual assunto
   * terá suas associações de documento configuradas. null
   * indica que nenhum assunto está selecionado.
   */
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<number | null>(null);

  // ===== FUNÇÕES DE DETECÇÃO DE MUDANÇAS =====
  /**
   * Verifica se as regras de órgãos foram modificadas
   *
   * @param newRegras - Novas regras para comparação
   * @returns true se houve mudanças, false caso contrário
   *
   * **Algoritmo**:
   * 1. Serializa ambos os arrays (original vs novo) para JSON
   * 2. Compara strings JSON para detectar diferenças
   * 3. Atualiza flag dirty correspondente
   * 4. Retorna resultado da comparação
   *
   * **Uso**: Chamado após cada modificação para atualizar estado dirty
   */
  const checkIfDirtyOrgaos = useCallback(
    (newRegras: RegraOrgao[]) => {
      const isDifferent = JSON.stringify(newRegras) !== JSON.stringify(originalRegrasOrgaos);
      setIsDirtyOrgaos(isDifferent);
      return isDifferent;
    },
    [originalRegrasOrgaos]
  );

  /**
   * Verifica se as regras de autoridades foram modificadas
   *
   * @param newRegras - Novas regras para comparação
   * @returns true se houve mudanças, false caso contrário
   *
   * **Algoritmo**:
   * 1. Serializa ambos os arrays (original vs novo) para JSON
   * 2. Compara strings JSON para detectar diferenças
   * 3. Atualiza flag dirty correspondente
   * 4. Retorna resultado da comparação
   *
   * **Uso**: Chamado após cada modificação para atualizar estado dirty
   */
  const checkIfDirtyAutoridades = useCallback(
    (newRegras: RegraAutoridade[]) => {
      const isDifferent = JSON.stringify(newRegras) !== JSON.stringify(originalRegrasAutoridades);
      setIsDirtyAutoridades(isDifferent);
      return isDifferent;
    },
    [originalRegrasAutoridades]
  );

  // ===== HANDLERS PARA SEÇÃO DE ÓRGÃOS =====
  /**
   * Modifica uma regra específica de um órgão
   *
   * @param orgaoId - ID único do órgão a ser modificado
   * @param ruleName - Nome da regra ('isSolicitante' | 'isOrgaoJudicial')
   * @param value - Novo valor booleano da regra
   *
   * **Lógica de Atualização**:
   * 1. Busca regra existente para o órgão
   * 2. Se existe: atualiza apenas a propriedade específica
   * 3. Se não existe: cria nova regra com valores padrão
   * 4. Atualiza estado e verifica mudanças (dirty)
   *
   * **Comportamento Inteligente**:
   * - Mantém outras propriedades inalteradas ao atualizar
   * - Cria regras sob demanda para órgãos não configurados
   * - Otimização com useCallback para evitar re-renders
   */
  const handleRuleChangeOrgaos = useCallback(
    (orgaoId: number, ruleName: 'isSolicitante' | 'isOrgaoJudicial', value: boolean) => {
      const regraExistente = regrasOrgaos.find(r => r.orgaoId === orgaoId);
      let newRegras: RegraOrgao[];

      if (regraExistente) {
        // Atualiza regra existente mantendo outras propriedades
        newRegras = regrasOrgaos.map(r =>
          r.orgaoId === orgaoId ? { ...r, [ruleName]: value } : r
        );
      } else {
        // Cria nova regra com valores padrão
        const novaRegra: RegraOrgao = {
          orgaoId,
          isSolicitante: ruleName === 'isSolicitante' ? value : false,
          isOrgaoJudicial: ruleName === 'isOrgaoJudicial' ? value : false,
        };
        newRegras = [...regrasOrgaos, novaRegra];
      }

      setRegrasOrgaos(newRegras);
      checkIfDirtyOrgaos(newRegras);
    },
    [regrasOrgaos, checkIfDirtyOrgaos]
  );

  /**
   * Confirma salvamento das alterações de regras de órgãos
   *
   * **Ação**:
   * - Remove flag dirty, indicando que mudanças foram persistidas
   * - Usado após operações de salvamento bem-sucedidas
   * - Desabilita indicadores visuais de mudanças pendentes
   *
   * **Uso**: Chamado após confirmação de salvamento no backend
   */
  const handleSaveChangesOrgaos = useCallback(() => {
    setIsDirtyOrgaos(false);
  }, []);

  // ===== HANDLERS PARA SEÇÃO DE AUTORIDADES =====
  /**
   * Modifica a regra judicial de uma autoridade específica
   *
   * @param autoridadeId - ID único da autoridade a ser modificada
   * @param value - Novo valor booleano para isAutoridadeJudicial
   *
   * **Lógica de Atualização**:
   * 1. Busca regra existente para a autoridade
   * 2. Se existe: atualiza propriedade isAutoridadeJudicial
   * 3. Se não existe: cria nova regra com o valor especificado
   * 4. Atualiza estado e verifica mudanças (dirty)
   *
   * **Comportamento Específico**:
   * - Autoridades têm apenas uma regra: isAutoridadeJudicial
   * - Criação automática de regras para autoridades não configuradas
   * - Atualização imediata do estado dirty para feedback visual
   */
  const handleRuleChangeAutoridades = useCallback(
    (autoridadeId: number, value: boolean) => {
      const regraExistente = regrasAutoridades.find(r => r.autoridadeId === autoridadeId);
      let newRegras: RegraAutoridade[];

      if (regraExistente) {
        // Atualiza regra existente
        newRegras = regrasAutoridades.map(r =>
          r.autoridadeId === autoridadeId ? { ...r, isAutoridadeJudicial: value } : r
        );
      } else {
        // Cria nova regra para a autoridade
        const novaRegra: RegraAutoridade = {
          autoridadeId,
          isAutoridadeJudicial: value,
        };
        newRegras = [...regrasAutoridades, novaRegra];
      }

      setRegrasAutoridades(newRegras);
      checkIfDirtyAutoridades(newRegras);
    },
    [regrasAutoridades, checkIfDirtyAutoridades]
  );

  /**
   * Confirma salvamento das alterações de regras de autoridades
   *
   * **Ação**:
   * - Remove flag dirty, indicando que mudanças foram persistidas
   * - Usado após operações de salvamento bem-sucedidas
   * - Desabilita indicadores visuais de mudanças pendentes
   *
   * **Uso**: Chamado após confirmação de salvamento no backend
   */
  const handleSaveChangesAutoridades = useCallback(() => {
    setIsDirtyAutoridades(false);
  }, []);

  // ===== HANDLERS PARA SEÇÃO DE ASSUNTOS =====
  /**
   * Controla seleção de assunto para configuração de documentos
   *
   * @param e - Evento de mudança do elemento select
   *
   * **Funcionalidade**:
   * - Converte valor string do select para number
   * - Atualiza selectedAssuntoId com o ID selecionado
   * - Define null se valor inválido ou vazio
   * - Permite configurar associações documento-assunto
   *
   * **Comportamento**:
   * - Usado em dropdown de seleção de assuntos
   * - Base para operações de configuração de documentos
   * - Validação automática de valores numéricos
   */
  const handleAssuntoSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedAssuntoId(id || null);
  }, []);

  /**
   * Alterna associação entre assunto e tipo de documento
   *
   * @param tipoDocumentoNome - Nome do tipo de documento a ser associado/desassociado
   *
   * **Pré-requisitos**:
   * - selectedAssuntoId deve estar definido
   * - Assunto deve existir no mockAssuntos
   *
   * **Lógica de Negócio**:
   * 1. Valida se há assunto selecionado
   * 2. Busca dados completos do assunto selecionado
   * 3. Chama função external para alternar associação
   * 4. Marca seção como dirty para habilitar salvamento
   *
   * **Integração**: Usa função toggleDocumentoAssunto do módulo documentoRegras
   */
  const handleAssuntoDocChange = useCallback(
    (tipoDocumentoNome: string) => {
      if (!selectedAssuntoId) return;

      const assuntoSelecionado = mockAssuntos.find(a => a.id === selectedAssuntoId);
      if (!assuntoSelecionado) return;

      toggleDocumentoAssunto(assuntoSelecionado.nome, tipoDocumentoNome);
      setIsDirtyAssuntos(true);
    },
    [selectedAssuntoId]
  );

  /**
   * Confirma salvamento das alterações de regras de assuntos
   *
   * **Ação**:
   * - Remove flag dirty, indicando que mudanças foram persistidas
   * - Usado após operações de salvamento bem-sucedidas
   * - Desabilita indicadores visuais de mudanças pendentes
   *
   * **Uso**: Chamado após confirmação de salvamento no backend
   */
  const handleSaveChangesAssuntos = useCallback(() => {
    setIsDirtyAssuntos(false);
  }, []);

  // ===== HANDLERS PARA REGRAS DE DOCUMENTO =====
  /**
   * Controla alterações de visibilidade por seção do documento
   *
   * @param key - Chave identificadora da configuração
   * @param section - Seção específica ('section2' | 'section3' | 'section4')
   * @param checked - Novo estado de visibilidade (true/false)
   *
   * **Funcionalidade**:
   * - Atualiza configurações de visibilidade específicas por seção
   * - Integra com sistema de configuração external (updateSecaoConfig)
   * - Marca alterações para controle de salvamento
   *
   * **Seções Disponíveis**:
   * - section2: Segunda seção do documento
   * - section3: Terceira seção do documento
   * - section4: Quarta seção do documento
   *
   * **Integração**: Usa função updateSecaoConfig do módulo documentoRegras
   */
  const handleVisibilityChange = useCallback(
    (key: string, section: 'section2' | 'section3' | 'section4', checked: boolean) => {
      updateSecaoConfig(key, { [section]: checked });
      setIsDirtyDocumento(true);
    },
    []
  );

  /**
   * Confirma salvamento das alterações de configurações de documento
   *
   * **Ação**:
   * - Remove flag dirty, indicando que mudanças foram persistidas
   * - Usado após operações de salvamento bem-sucedidas
   * - Desabilita indicadores visuais de mudanças pendentes
   *
   * **Uso**: Chamado após confirmação de salvamento no backend
   */
  const handleSaveChangesDocumento = useCallback(() => {
    setIsDirtyDocumento(false);
  }, []);

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna todos os estados e funções necessários para gerenciamento de regras
   *
   * @returns Objeto organizador com estados, flags e handlers de todas as seções
   */
  return {
    // ===== ESTADOS DE DADOS =====
    /** Array atual das regras de órgãos em edição */
    regrasOrgaos,
    /** Array atual das regras de autoridades em edição */
    regrasAutoridades,
    /** ID do assunto selecionado para configuração (ou null) */
    selectedAssuntoId,

    // ===== FLAGS DE MUDANÇAS (DIRTY STATE) =====
    /** Se há mudanças não salvas nas regras de órgãos */
    isDirtyOrgaos,
    /** Se há mudanças não salvas nas regras de autoridades */
    isDirtyAutoridades,
    /** Se há mudanças não salvas nas regras de assuntos */
    isDirtyAssuntos,
    /** Se há mudanças não salvas nas configurações de documento */
    isDirtyDocumento,

    // ===== HANDLERS DE ÓRGÃOS =====
    /** Modifica regra específica de um órgão (solicitante/judicial) */
    handleRuleChangeOrgaos,
    /** Confirma salvamento das alterações de regras de órgãos */
    handleSaveChangesOrgaos,

    // ===== HANDLERS DE AUTORIDADES =====
    /** Modifica regra judicial de uma autoridade específica */
    handleRuleChangeAutoridades,
    /** Confirma salvamento das alterações de regras de autoridades */
    handleSaveChangesAutoridades,

    // ===== HANDLERS DE ASSUNTOS =====
    /** Seleciona assunto para configuração de documentos */
    handleAssuntoSelect,
    /** Alterna associação entre assunto e tipo de documento */
    handleAssuntoDocChange,
    /** Confirma salvamento das alterações de regras de assuntos */
    handleSaveChangesAssuntos,

    // ===== HANDLERS DE DOCUMENTO =====
    /** Controla visibilidade por seção do documento */
    handleVisibilityChange,
    /** Confirma salvamento das configurações de documento */
    handleSaveChangesDocumento,
  };
};
