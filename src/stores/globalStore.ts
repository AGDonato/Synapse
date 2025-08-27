/**
 * Global application store using Zustand
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

// Theme types
type Theme = 'light' | 'dark' | 'system';
type Density = 'compact' | 'comfortable' | 'spacious';
type Language = 'pt-BR' | 'en-US';

// Notification type
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  persistent?: boolean;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

// User preferences
interface UserPreferences {
  theme: Theme;
  density: Density;
  language: Language;
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  fontSize: number;
  autoSave: boolean;
  pageSize: number;
}

// Global state interface
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
  effectiveTheme: 'light' | 'dark';
  notificationCount: number;
  hasErrors: boolean;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  density: 'comfortable',
  language: 'pt-BR',
  sidebarCollapsed: false,
  animationsEnabled: true,
  soundEnabled: false,
  highContrast: false,
  fontSize: 14,
  autoSave: true,
  pageSize: 10,
};

// Default performance metrics
const defaultMetrics = {
  loadTime: 0,
  renderTime: 0,
  memoryUsage: 0,
  cacheHitRate: 0,
  errorCount: 0,
};

// Default features
const defaultFeatures = {
  analytics: true,
  advancedSearch: true,
  exportFeatures: true,
  realtimeUpdates: false,
  experimentalUI: false,
};

// Initial state
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

// Store implementation
const createGlobalStore: StateCreator<
  GlobalState,
  [["zustand/subscribeWithSelector", never], ["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  GlobalState
> = (set, get) => ({
  ...initialState,

  // Preferences actions
  setPreference: (key, value) => {
    set((state) => {
      state.preferences[key] = value;
    });
  },

  setPreferences: (newPreferences) => {
    set((state) => {
      state.preferences = { ...state.preferences, ...newPreferences };
    });
  },

  resetPreferences: () => {
    set((state) => {
      state.preferences = defaultPreferences;
    });
  },

  // Notification actions
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000,
    };

    set((state) => {
      state.notifications.push(newNotification);
    });

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = [];
    });
  },

  // UI actions
  setLoading: (loading, message = '') => {
    set((state) => {
      state.isLoading = loading;
      state.loadingMessage = message;
    });
  },

  setSidebarOpen: (open) => {
    set((state) => {
      state.sidebarOpen = open;
      state.preferences.sidebarCollapsed = !open;
    });
  },

  setCurrentRoute: (route) => {
    set((state) => {
      state.currentRoute = route;
    });
  },

  setOnlineStatus: (online) => {
    set((state) => {
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

  // Performance actions
  updatePerformanceMetrics: (metrics) => {
    set((state) => {
      state.performanceMetrics = { ...state.performanceMetrics, ...metrics };
    });
  },

  // Feature flags
  setFeature: (feature, enabled) => {
    set((state) => {
      state.features[feature] = enabled;
    });
  },

  isFeatureEnabled: (feature) => {
    return get().features[feature];
  },

  // Computed properties
  get isDarkMode() {
    const { theme } = get().preferences;
    if (theme === 'dark') {return true;}
    if (theme === 'light') {return false;}
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  get effectiveTheme() {
    return get().isDarkMode ? 'dark' : 'light';
  },

  get notificationCount() {
    return get().notifications.length;
  },

  get hasErrors() {
    return get().performanceMetrics.errorCount > 0;
  },
});

// Create store with middleware
export const useGlobalStore = create<GlobalState>()(
  subscribeWithSelector(
    immer(
      persist(
        createGlobalStore,
        {
          name: 'global-store',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({
            preferences: state.preferences,
            features: state.features,
          }),
        }
      )
    )
  )
);

// Set up system listeners
if (typeof window !== 'undefined') {
  // Online/offline status
  window.addEventListener('online', () => {
    useGlobalStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useGlobalStore.getState().setOnlineStatus(false);
  });

  // Theme preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (useGlobalStore.getState().preferences.theme === 'system') {
      // Force a re-render by updating the store
      useGlobalStore.getState().setPreference('theme', 'system');
    }
  });

  // Performance monitoring
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory;
      useGlobalStore.getState().updatePerformanceMetrics({
        memoryUsage: memory.usedJSHeapSize,
      });
    }, 30000); // Every 30 seconds
  }
}

// Selectors
export const globalSelectors = {
  preferences: (state: GlobalState) => state.preferences,
  theme: (state: GlobalState) => state.effectiveTheme,
  notifications: (state: GlobalState) => state.notifications,
  isLoading: (state: GlobalState) => state.isLoading,
  sidebarOpen: (state: GlobalState) => state.sidebarOpen,
  isOnline: (state: GlobalState) => state.isOnline,
  features: (state: GlobalState) => state.features,
  performanceMetrics: (state: GlobalState) => state.performanceMetrics,
};

// Hooks for specific use cases
export const useTheme = () => {
  const theme = useGlobalStore((state) => state.effectiveTheme);
  const setTheme = useGlobalStore((state) => state.setPreference);
  const isDarkMode = useGlobalStore((state) => state.isDarkMode);
  
  return {
    theme,
    isDarkMode,
    setTheme: (newTheme: Theme) => setTheme('theme', newTheme),
    toggleTheme: () => setTheme('theme', isDarkMode ? 'light' : 'dark'),
  };
};

export const useNotifications = () => {
  const notifications = useGlobalStore((state) => state.notifications);
  const addNotification = useGlobalStore((state) => state.addNotification);
  const removeNotification = useGlobalStore((state) => state.removeNotification);
  const clearNotifications = useGlobalStore((state) => state.clearNotifications);
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    count: notifications.length,
  };
};

export const usePreferences = () => {
  const preferences = useGlobalStore((state) => state.preferences);
  const setPreference = useGlobalStore((state) => state.setPreference);
  const setPreferences = useGlobalStore((state) => state.setPreferences);
  const resetPreferences = useGlobalStore((state) => state.resetPreferences);
  
  return {
    preferences,
    setPreference,
    setPreferences,
    resetPreferences,
  };
};

export const useFeatureFlags = () => {
  const features = useGlobalStore((state) => state.features);
  const setFeature = useGlobalStore((state) => state.setFeature);
  const isFeatureEnabled = useGlobalStore((state) => state.isFeatureEnabled);
  
  return {
    features,
    setFeature,
    isFeatureEnabled,
  };
};

export const useAppStatus = () => {
  const isOnline = useGlobalStore((state) => state.isOnline);
  const isLoading = useGlobalStore((state) => state.isLoading);
  const loadingMessage = useGlobalStore((state) => state.loadingMessage);
  const hasErrors = useGlobalStore((state) => state.hasErrors);
  const performanceMetrics = useGlobalStore((state) => state.performanceMetrics);
  
  return {
    isOnline,
    isLoading,
    loadingMessage,
    hasErrors,
    performanceMetrics,
  };
};

export const useSidebar = () => {
  const sidebarOpen = useGlobalStore((state) => state.sidebarOpen);
  const setSidebarOpen = useGlobalStore((state) => state.setSidebarOpen);
  
  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
  };
};

export default useGlobalStore;