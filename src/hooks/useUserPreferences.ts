// src/hooks/useUserPreferences.ts

import { useLocalStorage } from './useLocalStorage';
import { CacheKeys, CacheConfig } from '../utils/storage';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US';
  itemsPerPage: 10 | 20 | 50 | 100;
  sidebarCollapsed: boolean;
  autoSave: boolean;
  offlineSync: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '24h' | '12h';
  timezone: string;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'pt-BR',
  itemsPerPage: 20,
  sidebarCollapsed: false,
  autoSave: true,
  offlineSync: true,
  notifications: {
    enabled: true,
    sound: false,
    desktop: false,
  },
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timezone: 'America/Sao_Paulo',
};

export function useUserPreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage(
    CacheKeys.USER_PREFERENCES,
    defaultPreferences,
    {
      ttl: CacheConfig.VERY_LONG_TTL,
      version: '1.0',
    }
  );

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateNotificationPreference = <K extends keyof UserPreferences['notifications']>(
    key: K,
    value: UserPreferences['notifications'][K]
  ): void => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const resetToDefaults = (): void => {
    setPreferences(defaultPreferences);
  };

  const exportPreferences = (): string => {
    return JSON.stringify(preferences, null, 2);
  };

  const importPreferences = (jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString) as UserPreferences;
      // Validate the imported preferences
      const merged = { ...defaultPreferences, ...imported };
      setPreferences(merged);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  };

  return {
    preferences,
    updatePreference,
    updateNotificationPreference,
    resetToDefaults,
    exportPreferences,
    importPreferences,
    clearPreferences,
  };
}