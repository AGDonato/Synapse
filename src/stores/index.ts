/**
 * Central store exports and utilities
 */

import { createModuleLogger } from '../utils/logger';

const storesLogger = createModuleLogger('Stores');

// Store exports
export { useGlobalStore, useTheme, useNotifications, usePreferences, useFeatureFlags, useAppStatus, useSidebar } from './globalStore';
export { useDemandasStore, useDemandasActions, useDemandasData, useDemandasByStatus } from './demandasStore';
export { useDocumentosStore, useDocumentosActions, useDocumentosData, useDocumentosSearch, useDocumentosByStatus, useDocumentosByType } from './documentosStore';

// Store provider
export { StoreProvider, useStoreHydration, StoreDevtools } from '../providers/StoreProvider';

// Store selectors (for performance optimization)
export { globalSelectors } from './globalStore';
export { demandasSelectors } from './demandasStore';
export { documentosSelectors } from './documentosStore';

// Store types
export type { GlobalState } from './globalStore';
export type { DemandasState } from './demandasStore';
export type { DocumentosState } from './documentosStore';

// Store utilities
export const resetAllStores = () => {
  useGlobalStore.getState().resetPreferences();
  useDemandasStore.getState().reset();
  useDocumentosStore.getState().reset();
};

export const getStoreState = () => ({
  global: useGlobalStore.getState(),
  demandas: useDemandasStore.getState(),
  documentos: useDocumentosStore.getState(),
});

// Development utilities
export const devtools = {
  logState: () => {
    if (process.env.NODE_ENV === 'development') {
      storesLogger.debug('Store State Debug', {
        global: useGlobalStore.getState(),
        demandas: useDemandasStore.getState(),
        documentos: useDocumentosStore.getState()
      });
    }
  },
  
  resetStores: resetAllStores,
  
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

// Global store state listener for debugging
if (process.env.NODE_ENV === 'development') {
  // Add global debug utilities
  (window as any).SynapseStores = {
    global: useGlobalStore,
    demandas: useDemandasStore,
    documentos: useDocumentosStore,
    devtools,
  };
}

export default {
  useGlobalStore,
  useDemandasStore,
  useDocumentosStore,
  resetAllStores,
  getStoreState,
  devtools,
};