/**
 * Migration hook for gradual transition from Context API to Zustand
 * Provides backward compatibility during the migration period
 */

import { useMemo } from 'react';
import { useDemandasActions, useDemandasData } from '../stores/demandasStore';
import { useDocumentosActions, useDocumentosData } from '../stores/documentosStore';
import { useGlobalStore, useNotifications } from '../stores/globalStore';
import type { Demanda, Documento } from '../services/api/schemas';
import { logger } from '../utils/logger';

/**
 * Bridge hook for DemandasContext compatibility
 * Provides the same interface as the old Context API
 */
export const useDemandasContext = () => {
  const data = useDemandasData();
  const actions = useDemandasActions();
  
  // Create context-like interface
  const contextValue = useMemo(() => ({
    // State
    demandas: data.demandas,
    selectedDemanda: data.selectedDemanda,
    isLoading: data.isLoading,
    error: data.error,
    pagination: data.pagination,
    totalCount: data.totalCount,
    
    // Actions (same interface as Context)
    fetchDemandas: actions.fetchDemandas,
    fetchDemandaById: actions.fetchDemandaById,
    createDemanda: actions.createDemanda,
    updateDemanda: actions.updateDemanda,
    deleteDemanda: actions.deleteDemanda,
    setSelectedDemanda: actions.setSelectedDemanda,
    setFilters: actions.setFilters,
    setPage: actions.setPage,
    clearError: actions.clearError,
    reset: actions.reset,
    
    // Additional Zustand-specific features
    cache: data,
    optimisticUpdate: (id: number, updates: Partial<Demanda>) => {
      // Implement optimistic updates for better UX
      const current = data.demandas.find(d => d.id === id);
      if (current) {
        actions.setSelectedDemanda({ ...current, ...updates });
      }
    },
  }), [data, actions]);
  
  return contextValue;
};

/**
 * Bridge hook for DocumentosContext compatibility
 */
export const useDocumentosContext = () => {
  const data = useDocumentosData();
  const actions = useDocumentosActions();
  
  const contextValue = useMemo(() => ({
    // State
    documentos: data.documentos,
    selectedDocumento: data.selectedDocumento,
    isLoading: data.isLoading,
    error: data.error,
    pagination: data.pagination,
    totalCount: data.totalCount,
    
    // Search state
    searchTerm: data.searchTerm,
    selectedTags: data.selectedTags,
    dateRange: data.dateRange,
    availableTags: data.availableTags,
    
    // Actions
    fetchDocumentos: actions.fetchDocumentos,
    fetchDocumentoById: actions.fetchDocumentoById,
    createDocumento: actions.createDocumento,
    updateDocumento: actions.updateDocumento,
    deleteDocumento: actions.deleteDocumento,
    setSelectedDocumento: actions.setSelectedDocumento,
    setFilters: actions.setFilters,
    setPage: actions.setPage,
    clearError: actions.clearError,
    reset: actions.reset,
    
    // File operations
    uploadFile: actions.uploadFile,
    downloadFile: actions.downloadFile,
    previewFile: actions.previewFile,
    
    // Search actions
    setSearchTerm: actions.setSearchTerm,
    setSelectedTags: actions.setSelectedTags,
    setDateRange: actions.setDateRange,
    clearFilters: actions.clearFilters,
    
    // Enhanced features
    advancedSearch: {
      byStatus: data.documentos.reduce((acc, doc) => {
        acc[doc.status] ??= [];
        acc[doc.status].push(doc);
        return acc;
      }, {} as Record<string, Documento[]>),
      
      byType: data.documentos.reduce((acc, doc) => {
        const tipo = doc.tipo_documento_id.toString();
        acc[tipo] ??= [];
        acc[tipo].push(doc);
        return acc;
      }, {} as Record<string, Documento[]>),
    },
  }), [data, actions]);
  
  return contextValue;
};

/**
 * Global app state hook - replaces multiple context hooks
 */
export const useAppState = () => {
  const globalState = useGlobalStore();
  const { addNotification, removeNotification, clearNotifications } = useNotifications();
  
  return useMemo(() => ({
    // Global state
    isLoading: globalState.isLoading,
    isOnline: globalState.isOnline,
    theme: globalState.effectiveTheme,
    preferences: globalState.preferences,
    notifications: globalState.notifications,
    sidebarOpen: globalState.sidebarOpen,
    currentRoute: globalState.currentRoute,
    features: globalState.features,
    performanceMetrics: globalState.performanceMetrics,
    
    // Actions
    setLoading: globalState.setLoading,
    setSidebarOpen: globalState.setSidebarOpen,
    setCurrentRoute: globalState.setCurrentRoute,
    setPreference: globalState.setPreference,
    setPreferences: globalState.setPreferences,
    resetPreferences: globalState.resetPreferences,
    setFeature: globalState.setFeature,
    isFeatureEnabled: globalState.isFeatureEnabled,
    
    // Notifications
    addNotification,
    removeNotification,
    clearNotifications,
    
    // Computed
    isDarkMode: globalState.isDarkMode,
    notificationCount: globalState.notificationCount,
    hasErrors: globalState.hasErrors,
  }), [globalState, addNotification, removeNotification, clearNotifications]);
};

/**
 * Performance-optimized selectors for heavy operations
 */
export const useOptimizedSelectors = () => {
  const demandas = useDemandasData();
  const documentos = useDocumentosData();
  
  // Memoized expensive computations
  const stats = useMemo(() => ({
    demandasCount: demandas.totalCount,
    documentosCount: documentos.totalCount,
    
    demandasByStatus: demandas.demandas.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    documentosByStatus: documentos.documentos.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    recentActivity: [
      ...demandas.demandas.slice(0, 5).map(d => ({
        type: 'demanda' as const,
        id: d.id,
        title: d.titulo,
        date: d.updated_at,
      })),
      ...documentos.documentos.slice(0, 5).map(d => ({
        type: 'documento' as const,
        id: d.id,
        title: d.numero,
        date: d.updated_at,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10),
    
  }), [demandas, documentos]);
  
  return stats;
};

/**
 * Migration utilities for existing components
 */
export const migrationUtils = {
  // Check if component is ready for Zustand
  isZustandReady: () => {
    try {
      useGlobalStore.getState();
      return true;
    } catch {
      return false;
    }
  },
  
  // Provide fallback for components during migration
  withFallback: <T,>(zustandValue: T, contextValue: T): T => {
    return migrationUtils.isZustandReady() ? zustandValue : contextValue;
  },
  
  // Debug migration status
  debugMigration: () => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔄 Zustand Migration Status');
      logger.info('Global Store:', !!useGlobalStore.getState());
      logger.info('Migration completed successfully');
    }
  },
};

export default {
  useDemandasContext,
  useDocumentosContext,
  useAppState,
  useOptimizedSelectors,
  migrationUtils,
};