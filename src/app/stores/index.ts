/**
 * CENTRAL DE STORES - EXPORTS E UTILITÁRIOS
 *
 * Este arquivo serve como ponto central para todos os stores do sistema.
 * Implementa:
 * - Export de todos os hooks de stores (Global, Demandas, Documentos)
 * - Seletores otimizados para performance
 * - Utilitários para reset e debug de stores
 * - Ferramentas de desenvolvimento para inspeção de estado
 * - Unificação da API dos stores para facilitar uso
 *
 * Padrão de uso:
 * - Importe hooks específicos: import { useDemandasData } from './stores'
 * - Use seletores para performance: import { globalSelectors } from './stores'
 * - Utilize devtools em desenvolvimento para debug
 *
 * Stores disponíveis:
 * - globalStore: Tema, notificações, preferências, feature flags
 * - demandasStore: Gerenciamento completo de demandas e CRUD
 * - documentosStore: Operações de documentos e arquivos
 */

import { createModuleLogger } from '../../shared/utils/logger';

/** Logger específico para operações de stores */
const storesLogger = createModuleLogger('Stores');

/**
 * Imports dos stores principais
 * Carrega todos os hooks e funcionalidades disponíveis
 */
import {
  useGlobalStore,
  useNotifications,
  usePreferences,
  useFeatureFlags,
  useAppStatus,
  useSidebar,
} from './globalStore';
import {
  useDemandasStore,
  useDemandasActions,
  useDemandasData,
  useDemandasByStatus,
} from './demandasStore';
import {
  useDocumentosStore,
  useDocumentosActions,
  useDocumentosData,
  useDocumentosSearch,
  useDocumentosByStatus,
  useDocumentosByType,
} from './documentosStore';

/**
 * Re-export de todos os hooks dos stores
 * Permite import unificado: import { useGlobalStore, useDemandasData } from './stores'
 */
export {
  useGlobalStore,
  useNotifications,
  usePreferences,
  useFeatureFlags,
  useAppStatus,
  useSidebar,
  useDemandasStore,
  useDemandasActions,
  useDemandasData,
  useDemandasByStatus,
  useDocumentosStore,
  useDocumentosActions,
  useDocumentosData,
  useDocumentosSearch,
  useDocumentosByStatus,
  useDocumentosByType,
};

/**
 * Provider do store - exportado condicionalmente quando disponível
 * Futuro: StoreProvider, useStoreHydration, StoreDevtools
 */
// export { StoreProvider, useStoreHydration, StoreDevtools } from '../providers/StoreProvider';

/**
 * Seletores dos stores para otimização de performance
 * Evitam re-renders desnecessários ao acessar partes específicas do estado
 */
export { globalSelectors } from './globalStore';
export { demandasSelectors } from './demandasStore';
export { documentosSelectors } from './documentosStore';

/**
 * Tipos dos stores são internos - use seletores para acesso type-safe
 * Evita acoplamento direto com estrutura interna dos stores
 */

/**
 * Utilitários dos stores
 */

/**
 * Reseta todos os stores para estado inicial
 * - Limpa preferências do store global
 * - Reseta dados de demandas e documentos
 * - Usado em logout ou mudança de contexto
 */
export const resetAllStores = () => {
  useGlobalStore.getState().resetPreferences();
  useDemandasStore.getState().reset();
  useDocumentosStore.getState().reset();
};

/**
 * Obtém estado atual de todos os stores
 * @returns Objeto com estado completo de todos os stores
 * - Útil para debug e persistência de estado
 * - Não deve ser usado para rendering (use hooks específicos)
 */
export const getStoreState = () => ({
  global: useGlobalStore.getState(),
  demandas: useDemandasStore.getState(),
  documentos: useDocumentosStore.getState(),
});

/**
 * Utilitários de desenvolvimento
 * Disponíveis apenas em modo de desenvolvimento
 */
export const devtools = {
  /**
   * Loga estado atual de todos os stores no console
   * - Apenas em desenvolvimento
   * - Útil para debug de problemas de estado
   */
  logState: () => {
    if (process.env.NODE_ENV === 'development') {
      storesLogger.debug('Store State Debug', {
        global: useGlobalStore.getState(),
        demandas: useDemandasStore.getState(),
        documentos: useDocumentosStore.getState(),
      });
    }
  },

  /** Alias para resetAllStores */
  resetStores: resetAllStores,

  /**
   * Exporta estado atual como arquivo JSON
   * - Apenas em desenvolvimento
   * - Gera download automático do estado
   * - Nome do arquivo inclui timestamp
   */
  exportState: () => {
    if (process.env.NODE_ENV === 'development') {
      const state = getStoreState();
      const dataStr = JSON.stringify(state, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `synapse-state-${new Date().toISOString().slice(0, 19)}.json`;
      link.click();

      URL.revokeObjectURL(url);
    }
  },
};

/**
 * Listener global para debug em desenvolvimento
 * Adiciona utilitários de debug ao objeto window
 */
if (process.env.NODE_ENV === 'development') {
  /**
   * Adiciona utilitários globais de debug
   * Acessível via window.SynapseStores no DevTools
   */
  (window as any).SynapseStores = {
    global: useGlobalStore,
    demandas: useDemandasStore,
    documentos: useDocumentosStore,
    devtools,
  };
}

/**
 * Export padrão com principais funcionalidades
 * Permite import como: import stores from './stores'
 */
export default {
  useGlobalStore,
  useDemandasStore,
  useDocumentosStore,
  resetAllStores,
  getStoreState,
  devtools,
};
