/**
 * STORE GLOBAL DA APLICAÇÃO USANDO ZUSTAND
 *
 * Este módulo implementa o gerenciamento de estado global da aplicação.
 * Inclui funcionalidades para:
 * - Gerenciamento de temas (light, dark, system) com detecção automática
 * - Sistema completo de notificações com timeout e persistência
 * - Preferências do usuário (densidade, idioma, sidebar, acessibilidade)
 * - Monitoramento de performance e métricas de aplicação
 * - Feature flags para controle de funcionalidades experimentais
 * - Status online/offline com notificações automáticas
 * - Persistência no localStorage com middleware Zustand
 * - Listeners de sistema para mudanças de tema e conexão
 * - Devtools para debugging em desenvolvimento
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

/**
 * Tipos para configuração de tema da aplicação
 * - light: Tema claro fixo
 * - dark: Tema escuro fixo
 * - system: Segue preferência do sistema operacional
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * Idiomas suportados pela aplicação
 * - pt-BR: Português brasileiro (padrão)
 * - en-US: Inglês americano
 */
type Language = 'pt-BR' | 'en-US';

/**
 * Interface para notificações do sistema
 * Representa uma notificação exibida para o usuário
 */
interface Notification {
  /** Identificador único da notificação */
  id: string;
  /** Tipo da notificação que determina cor e ícone */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Título principal da notificação */
  title: string;
  /** Mensagem detalhada da notificação */
  message: string;
  /** Timestamp de criação da notificação */
  timestamp: number;
  /** Duração em millisegundos (padrão: 5000) */
  duration?: number;
  /** Se true, notificação não é removida automaticamente */
  persistent?: boolean;
  /** Ações disponíveis na notificação (botões) */
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

/**
 * Preferências personalizáveis do usuário
 * Salvas no localStorage e sincronizadas entre sessões
 */
interface UserPreferences {
  theme: Theme;
  language: Language;
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  fontSize: number;
  autoSave: boolean;
  pageSize: number;
}

/**
 * Interface principal do estado global da aplicação
 * Contém todos os dados e ações do store global
 */
interface GlobalState {
  // App metadata
  appVersion: string;
  buildNumber: string;
  lastUpdated: number;
  isOnline: boolean;

  // User preferences
  preferences: UserPreferences;

  // UI state
  isLoading: boolean;
  loadingMessage: string;
  notifications: Notification[];
  sidebarOpen: boolean;
  currentRoute: string;

  // Performance monitoring
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    errorCount: number;
  };

  // Feature flags
  features: {
    analytics: boolean;
    advancedSearch: boolean;
    exportFeatures: boolean;
    realtimeUpdates: boolean;
    experimentalUI: boolean;
  };

  // Actions
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // UI actions
  setLoading: (loading: boolean, message?: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentRoute: (route: string) => void;
  setOnlineStatus: (online: boolean) => void;

  // Performance
  updatePerformanceMetrics: (metrics: Partial<GlobalState['performanceMetrics']>) => void;

  // Feature flags
  setFeature: (feature: keyof GlobalState['features'], enabled: boolean) => void;
  isFeatureEnabled: (feature: keyof GlobalState['features']) => boolean;

  // Computed
  isDarkMode: boolean;
  effectiveTheme: Theme;
  notificationCount: number;
  hasErrors: boolean;
}

/**
 * Preferências padrão aplicadas na primeira execução
 * Valores conservadores e acessíveis para todos os usuários
 */
const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'pt-BR',
  sidebarCollapsed: false,
  animationsEnabled: true,
  soundEnabled: false,
  highContrast: false,
  fontSize: 14,
  autoSave: true,
  pageSize: 10,
};

/**
 * Métricas de performance iniciais
 * Resetadas a cada inicialização da aplicação
 */
const defaultMetrics = {
  loadTime: 0,
  renderTime: 0,
  memoryUsage: 0,
  cacheHitRate: 0,
  errorCount: 0,
};

/**
 * Feature flags padrão da aplicação
 * Controla quais funcionalidades estão ativas por padrão
 */
const defaultFeatures = {
  analytics: true,
  advancedSearch: true,
  exportFeatures: true,
  realtimeUpdates: false,
  experimentalUI: false,
};

// Estado inicial
const initialState = {
  appVersion: '1.0.0',
  buildNumber: process.env.NODE_ENV === 'production' ? '1000' : 'dev',
  lastUpdated: Date.now(),
  isOnline: navigator.onLine,
  preferences: defaultPreferences,
  isLoading: false,
  loadingMessage: '',
  notifications: [],
  sidebarOpen: true,
  currentRoute: '/',
  performanceMetrics: defaultMetrics,
  features: defaultFeatures,
};

// Implementação do store
const createGlobalStore: StateCreator<
  GlobalState,
  [
    ['zustand/subscribeWithSelector', never],
    ['zustand/immer', never],
    ['zustand/persist', unknown],
  ],
  [],
  GlobalState
> = (set, get) => ({
  ...initialState,

  /**
   * Atualiza uma preferência específica do usuário
   * @param key - Chave da preferência a ser alterada
   * @param value - Novo valor para a preferência
   */
  setPreference: (key, value) => {
    set(state => {
      state.preferences[key] = value;
    });
  },

  /**
   * Atualiza múltiplas preferências de uma vez
   * @param newPreferences - Objeto com preferências a serem atualizadas
   */
  setPreferences: newPreferences => {
    set(state => {
      state.preferences = { ...state.preferences, ...newPreferences };
    });
  },

  /**
   * Restaura todas as preferências para os valores padrão
   * Útil para resetar configurações problemáticas
   */
  resetPreferences: () => {
    set(state => {
      state.preferences = defaultPreferences;
    });
  },

  /**
   * Adiciona uma nova notificação ao sistema
   * Auto-remove notificações não-persistentes após o timeout
   * @param notification - Dados da notificação (ID e timestamp são gerados automaticamente)
   */
  addNotification: notification => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000,
    };

    set(state => {
      state.notifications.push(newNotification);
    });

    // Auto-remove notificações não-persistentes
    if (!newNotification.persistent) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  /**
   * Remove uma notificação específica pelo ID
   * @param id - Identificador único da notificação
   */
  removeNotification: id => {
    set(state => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },

  /**
   * Remove todas as notificações do sistema
   * Útil para limpeza em massa
   */
  clearNotifications: () => {
    set(state => {
      state.notifications = [];
    });
  },

  /**
   * Controla o estado de carregamento global da aplicação
   * @param loading - Se a aplicação está carregando
   * @param message - Mensagem opcional para exibir durante carregamento
   */
  setLoading: (loading, message = '') => {
    set(state => {
      state.isLoading = loading;
      state.loadingMessage = message;
    });
  },

  /**
   * Controla visibilidade da sidebar principal
   * Também atualiza a preferência do usuário
   * @param open - Se a sidebar deve estar aberta
   */
  setSidebarOpen: open => {
    set(state => {
      state.sidebarOpen = open;
      state.preferences.sidebarCollapsed = !open;
    });
  },

  setCurrentRoute: route => {
    set(state => {
      state.currentRoute = route;
    });
  },

  /**
   * Atualiza status de conexão online/offline
   * Automaticamente exibe notificações para mudanças de status
   * @param online - Se a aplicação está online
   */
  setOnlineStatus: online => {
    set(state => {
      state.isOnline = online;
    });

    // Add notification for status change
    if (!online) {
      get().addNotification({
        type: 'warning',
        title: 'Modo Offline',
        message: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
        persistent: true,
      });
    } else {
      get().addNotification({
        type: 'success',
        title: 'Conexão Restaurada',
        message: 'Você está online novamente.',
        duration: 3000,
      });
    }
  },

  // Ações de performance
  updatePerformanceMetrics: metrics => {
    set(state => {
      state.performanceMetrics = { ...state.performanceMetrics, ...metrics };
    });
  },

  /**
   * Ativa ou desativa uma feature flag específica
   * @param feature - Nome da feature a ser controlada
   * @param enabled - Se a feature deve estar ativa
   */
  setFeature: (feature, enabled) => {
    set(state => {
      state.features[feature] = enabled;
    });
  },

  /**
   * Verifica se uma feature flag está ativa
   * @param feature - Nome da feature a verificar
   * @returns true se a feature estiver ativa
   */
  isFeatureEnabled: feature => {
    return get().features[feature];
  },

  // Propriedades computadas
  get isDarkMode() {
    const { theme } = get().preferences;
    if (theme === 'dark') {
      return true;
    }
    if (theme === 'light') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  get effectiveTheme() {
    const { theme } = get().preferences;
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  },

  get notificationCount() {
    return get().notifications.length;
  },

  get hasErrors() {
    return get().performanceMetrics.errorCount > 0;
  },
});

// Cria store com middlewares
export const useGlobalStore = create<GlobalState>()(
  subscribeWithSelector(
    immer(
      persist(createGlobalStore, {
        name: 'global-store',
        storage: createJSONStorage(() => localStorage),
        partialize: state => ({
          preferences: state.preferences,
          features: state.features,
        }),
      })
    )
  )
);

// Configura listeners do sistema
if (typeof window !== 'undefined') {
  // Status online/offline
  window.addEventListener('online', () => {
    useGlobalStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useGlobalStore.getState().setOnlineStatus(false);
  });

  // Mudanças de preferência de tema
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (useGlobalStore.getState().preferences.theme === 'system') {
      // Força re-render atualizando o store
      useGlobalStore.getState().setPreference('theme', 'system');
    }
  });

  // Monitoramento de performance
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory;
      useGlobalStore.getState().updatePerformanceMetrics({
        memoryUsage: memory.usedJSHeapSize,
      });
    }, 30000); // A cada 30 segundos
  }
}

// Seletores
export const globalSelectors = {
  preferences: (state: GlobalState) => state.preferences,
  notifications: (state: GlobalState) => state.notifications,
  isLoading: (state: GlobalState) => state.isLoading,
  sidebarOpen: (state: GlobalState) => state.sidebarOpen,
  isOnline: (state: GlobalState) => state.isOnline,
  features: (state: GlobalState) => state.features,
  performanceMetrics: (state: GlobalState) => state.performanceMetrics,
};

/**
 * Hook para gerenciamento do sistema de notificações
 * Fornece acesso à lista de notificações e funções de controle
 * @returns Objeto com notificações, funções de adição/remoção e contador
 */
export const useNotifications = () => {
  const notifications = useGlobalStore(state => state.notifications);
  const addNotification = useGlobalStore(state => state.addNotification);
  const removeNotification = useGlobalStore(state => state.removeNotification);
  const clearNotifications = useGlobalStore(state => state.clearNotifications);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    count: notifications.length,
  };
};

/**
 * Hook para acesso e modificação das preferências do usuário
 * Permite alteração individual ou em lote das configurações
 * @returns Objeto com preferências atuais e funções de alteração
 */
export const usePreferences = () => {
  const preferences = useGlobalStore(state => state.preferences);
  const setPreference = useGlobalStore(state => state.setPreference);
  const setPreferences = useGlobalStore(state => state.setPreferences);
  const resetPreferences = useGlobalStore(state => state.resetPreferences);

  return {
    preferences,
    setPreference,
    setPreferences,
    resetPreferences,
  };
};

/**
 * Hook para gerenciamento de feature flags
 * Permite ativar/desativar funcionalidades experimentais
 * @returns Objeto com flags atuais e funções de controle
 */
export const useFeatureFlags = () => {
  const features = useGlobalStore(state => state.features);
  const setFeature = useGlobalStore(state => state.setFeature);
  const isFeatureEnabled = useGlobalStore(state => state.isFeatureEnabled);

  return {
    features,
    setFeature,
    isFeatureEnabled,
  };
};

/**
 * Hook para monitoramento do status geral da aplicação
 * Fornece informações sobre conexão, carregamento, erros e performance
 * @returns Objeto com status online, carregamento, erros e métricas
 */
export const useAppStatus = () => {
  const isOnline = useGlobalStore(state => state.isOnline);
  const isLoading = useGlobalStore(state => state.isLoading);
  const loadingMessage = useGlobalStore(state => state.loadingMessage);
  const hasErrors = useGlobalStore(state => state.hasErrors);
  const performanceMetrics = useGlobalStore(state => state.performanceMetrics);

  return {
    isOnline,
    isLoading,
    loadingMessage,
    hasErrors,
    performanceMetrics,
  };
};

/**
 * Hook para controle da sidebar principal
 * Gerencia estado de abertura/fechamento da navegação lateral
 * @returns Objeto com estado atual e funções de controle
 */
export const useSidebar = () => {
  const sidebarOpen = useGlobalStore(state => state.sidebarOpen);
  const setSidebarOpen = useGlobalStore(state => state.setSidebarOpen);

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
  };
};

export default useGlobalStore;
