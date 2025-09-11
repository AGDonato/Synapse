/**
 * Hook para carregamento de dados de demanda existente na Nova Demanda
 *
 * @description
 * Gerencia o carregamento e mapeamento de dados quando o formulário está em modo edição:
 * - Busca demanda específica por ID
 * - Mapeia dados da demanda para estrutura do formulário
 * - Resolve referências (tipos, órgãos, analistas, distribuidores)
 * - Converte formatos de dados conforme necessário
 * - Controla carregamento único para evitar sobrescrição
 * - Trata campos opcionais e valores nulos/undefined
 *
 * **Processo de Carregamento**:
 * 1. **Validação**: Verifica se é modo edição e se tem ID válido
 * 2. **Busca**: Encontra demanda nos dados mockados
 * 3. **Resolução**: Busca entidades relacionadas (tipo, órgão, pessoas)
 * 4. **Mapeamento**: Converte dados da demanda para estrutura do formulário
 * 5. **Aplicação**: Atualiza estado do formulário com dados carregados
 * 6. **Controle**: Marca como carregado para evitar recarregamentos
 *
 * **Entidades Resolvidas**:
 * - **Tipo de Demanda**: Busca em mockTiposDemandas por nome
 * - **Órgão Solicitante**: Busca em orgaosSolicitantes por nome/abreviação
 * - **Analista**: Busca em mockAnalistas por nome
 * - **Distribuidor**: Busca em mockDistribuidores por nome
 *
 * @example
 * const { loadDemandaData } = useLoadDemandaData(
 *   true, // modo edição
 *   "123", // ID da demanda
 *   demandas,
 *   hasLoadedInitialData,
 *   orgaosSolicitantes,
 *   setFormData,
 *   setHasLoadedInitialData
 * );
 *
 * // Carregar dados
 * useEffect(() => {
 *   loadDemandaData();
 * }, [loadDemandaData]);
 *
 * @module pages/NovaDemandaPage/hooks/useLoadDemandaData
 */

import { useCallback } from 'react';
import type { FormDataState } from './useFormularioEstado';
import type { Demanda, Orgao } from '../../../shared/types/entities';
import { mockAnalistas } from '../../../shared/data/mockAnalistas';
import { mockDistribuidores } from '../../../shared/data/mockDistribuidores';
import { mockTiposDemandas } from '../../../shared/data/mockTiposDemandas';

// ========== INTERFACES ==========

/**
 * Interface para entidades relacionadas encontradas durante o mapeamento
 *
 * Armazena as entidades resolvidas a partir dos dados string da demanda,
 * permitindo verificação se cada referência foi encontrada com sucesso.
 */
interface DemandaEntities {
  /** Tipo de demanda encontrado na lista de tipos disponíveis */
  tipoEncontrado: { id: number; nome: string } | undefined;
  /** Órgão solicitante encontrado na lista de órgãos */
  solicitanteEncontrado: Orgao | undefined;
  /** Analista encontrado na lista de analistas disponíveis */
  analistaEncontrado: { id: number; nome: string } | undefined;
  /** Distribuidor encontrado na lista de distribuidores disponíveis */
  distribuidorEncontrado: { id: number; nome: string } | undefined;
}

// ========== HOOK PRINCIPAL ==========

/**
 * Hook que gerencia carregamento de dados de demanda existente
 *
 * @param isEditMode - Se o formulário está em modo de edição
 * @param demandaId - ID da demanda a ser carregada (string)
 * @param demandas - Lista de demandas disponíveis
 * @param hasLoadedInitialData - Se dados iniciais já foram carregados
 * @param orgaosSolicitantes - Lista de órgãos solicitantes disponíveis
 * @param setFormData - Função para atualizar dados do formulário
 * @param setHasLoadedInitialData - Função para marcar carregamento como concluído
 * @returns Objeto com função de carregamento de dados
 */
export const useLoadDemandaData = (
  isEditMode: boolean,
  demandaId: string | undefined,
  demandas: Demanda[],
  hasLoadedInitialData: boolean,
  orgaosSolicitantes: Orgao[],
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
  setHasLoadedInitialData: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // ===== RESOLUÇÃO DE ENTIDADES =====
  /**
   * Busca e resolve todas as entidades relacionadas à demanda
   *
   * **Processo de Resolução**:
   * 1. **Tipo**: Busca por nome exato em mockTiposDemandas
   * 2. **Solicitante**: Busca por nome completo OU abreviação
   * 3. **Analista**: Busca por nome exato em mockAnalistas
   * 4. **Distribuidor**: Busca por nome exato em mockDistribuidores
   *
   * **Tratamento de Falhas**:
   * - Se entidade não for encontrada, retorna undefined
   * - Formulário deve lidar com referências não resolvidas
   * - Log de avisos pode ser adicionado para debug
   *
   * @param demanda - Demanda com dados string a serem resolvidos
   * @returns Objeto com entidades encontradas ou undefined
   */
  const findDemandaEntities = useCallback(
    (demanda: Demanda): DemandaEntities => {
      // Busca tipo de demanda por nome exato
      const tipoEncontrado = mockTiposDemandas.find(t => t.nome === demanda.tipoDemanda);

      // Busca órgão solicitante por nome completo OU abreviação (flexibilidade)
      const solicitanteEncontrado = orgaosSolicitantes.find(
        o => o.nomeCompleto === demanda.orgao || o.abreviacao === demanda.orgao
      );

      // Busca analista por nome exato
      const analistaEncontrado = mockAnalistas.find(a => a.nome === demanda.analista);

      // Busca distribuidor por nome exato
      const distribuidorEncontrado = mockDistribuidores.find(d => d.nome === demanda.distribuidor);

      return {
        tipoEncontrado,
        solicitanteEncontrado,
        analistaEncontrado,
        distribuidorEncontrado,
      };
    },
    [orgaosSolicitantes]
  );

  // ===== MAPEAMENTO DE DADOS =====
  /**
   * Constrói objeto FormDataState a partir dos dados da demanda e entidades resolvidas
   *
   * **Estratégias de Mapeamento**:
   * - **Entidades**: Usa entidades resolvidas ou null se não encontradas
   * - **Strings**: Usa nullish coalescing (??) para valores padrão
   * - **Conversões**: Força conversão para string em campos específicos
   * - **Solicitante**: Cria objeto compatível mesmo se órgão não foi totalmente resolvido
   *
   * **Tratamento Especial**:
   * - **alvos/identificadores**: Podem ser number, string ou null - força conversão para string
   * - **solicitante**: Mantém nome original mesmo se órgão não foi encontrado completamente
   * - **datas**: Mantém formato DD/MM/AAAA original
   *
   * @param demanda - Demanda original com dados a serem mapeados
   * @param entities - Entidades relacionadas já resolvidas
   * @returns Objeto FormDataState pronto para uso no formulário
   */
  const buildFormDataFromDemanda = useCallback(
    (demanda: Demanda, entities: DemandaEntities): FormDataState => ({
      // ===== CAMPOS DE SELEÇÃO =====
      tipoDemanda: entities.tipoEncontrado ?? null,
      // Solicitante: se encontrou órgão, cria objeto Option; senão, cria com nome original
      solicitante: entities.solicitanteEncontrado ? { id: 0, nome: demanda.orgao } : null,
      analista: entities.analistaEncontrado ?? null,
      distribuidor: entities.distribuidorEncontrado ?? null,

      // ===== CAMPOS DE TEXTO SIMPLES =====
      dataInicial: demanda.dataInicial ?? '',
      descricao: demanda.descricao ?? '',

      // ===== CAMPOS NUMÉRICOS/PROTOCOLOS =====
      sged: demanda.sged ?? '',
      autosAdministrativos: demanda.autosAdministrativos ?? '',
      pic: demanda.pic ?? '',
      autosJudiciais: demanda.autosJudiciais ?? '',
      autosExtrajudiciais: demanda.autosExtrajudiciais ?? '',

      // ===== CAMPOS COM CONVERSÃO ESPECIAL =====
      // alvos e identificadores podem ser number, string, null ou undefined
      // Força conversão para string para compatibilidade com formulário
      alvos: demanda.alvos !== undefined && demanda.alvos !== null ? String(demanda.alvos) : '',
      identificadores:
        demanda.identificadores !== undefined && demanda.identificadores !== null
          ? String(demanda.identificadores)
          : '',
    }),
    []
  );

  // ===== FUNÇÃO PRINCIPAL DE CARREGAMENTO =====
  /**
   * Executa o carregamento completo dos dados da demanda
   *
   * **Validações de Segurança**:
   * 1. **Modo**: Só executa se estiver em modo edição
   * 2. **ID**: Só executa se tiver ID válido da demanda
   * 3. **Dados**: Só executa se houver demandas carregadas
   * 4. **Estado**: Só executa se ainda não carregou (evita sobrescrição)
   *
   * **Fluxo de Execução**:
   * 1. Validações de pré-condição
   * 2. Busca demanda específica por ID (convertido para number)
   * 3. Resolve todas as entidades relacionadas
   * 4. Mapeia dados para estrutura do formulário
   * 5. Atualiza estado do formulário
   * 6. Marca como carregado para evitar reexecução
   *
   * **Tratamento de Erros**:
   * - Se demanda não for encontrada, retorna silenciosamente
   * - Se conversão de ID falhar, parseInt retorna NaN e find não encontra
   * - Referências não resolvidas ficam como null no formulário
   */
  const loadDemandaData = useCallback(() => {
    // ===== VALIDAÇÕES DE PRÉ-CONDIÇÃO =====
    // Só executa se estiver em modo edição
    if (!isEditMode) return;

    // Só executa se tiver ID da demanda
    if (!demandaId) return;

    // Só executa se houver demandas carregadas
    if (demandas.length === 0) return;

    // Só executa se ainda não carregou (evita sobrescrição acidental)
    if (hasLoadedInitialData) return;

    // ===== BUSCA DA DEMANDA =====
    // Converte ID string para number e busca demanda específica
    const demanda = demandas.find(d => d.id === parseInt(demandaId));
    if (!demanda) {
      // Demanda não encontrada - pode ser ID inválido ou demanda removida
      return;
    }

    // ===== PROCESSAMENTO DOS DADOS =====
    // Resolve todas as entidades relacionadas (tipos, órgãos, pessoas)
    const entities = findDemandaEntities(demanda);

    // Mapeia dados da demanda para estrutura compatível com formulário
    const formData = buildFormDataFromDemanda(demanda, entities);

    // ===== APLICAÇÃO DOS DADOS =====
    // Atualiza estado do formulário com dados carregados
    setFormData(formData);

    // Marca como carregado para evitar recarregamentos desnecessários
    setHasLoadedInitialData(true);
  }, [
    isEditMode,
    demandaId,
    demandas,
    hasLoadedInitialData,
    findDemandaEntities,
    buildFormDataFromDemanda,
    setFormData,
    setHasLoadedInitialData,
  ]);

  // ===== INTERFACE DE RETORNO =====
  /**
   * Retorna função de carregamento para uso no componente
   *
   * @returns Objeto com função loadDemandaData
   */
  return {
    /** Função que executa carregamento completo dos dados */
    loadDemandaData,
  };
};
