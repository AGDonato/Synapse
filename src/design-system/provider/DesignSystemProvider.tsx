// src/design-system/provider/DesignSystemProvider.tsx

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { themes } from '../tokens';

/**
 * Design System Provider
 * 
 * Manages global theme state and provides design system configuration
 * to all child components.
 */

export type Theme = 'light' | 'dark' | 'highContrast';

export interface DesignSystemConfig {
  theme: Theme;
  reducedMotion: boolean;
  fontSize: number;
  borderRadius: number;
}

interface DesignSystemContextType {
  config: DesignSystemConfig;
  setTheme: (theme: Theme) => void;
  setReducedMotion: (reduced: boolean) => void;
  setFontSize: (size: number) => void;
  setBorderRadius: (radius: number) => void;
  resetConfig: () => void;
}

const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined);

const defaultConfig: DesignSystemConfig = {
  theme: 'light',
  reducedMotion: false,
  fontSize: 16,
  borderRadius: 8,
};

const STORAGE_KEY = 'synapse-design-system-config';

export interface DesignSystemProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({
  children,
  defaultTheme = 'light',
  storageKey = STORAGE_KEY,
}) => {
  const [config, setConfig] = useState<DesignSystemConfig>({
    ...defaultConfig,
    theme: defaultTheme,
  });

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        setConfig(prev => ({ ...prev, ...parsedConfig }));
      }
    } catch (error) {
      logger.error('Failed to load design system config:', error);
    }

    // Check for system preferences
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateSystemPreferences = () => {
      setConfig(prev => ({
        ...prev,
        theme: prev.theme === 'light' && mediaQuery.matches ? 'dark' : prev.theme,
        reducedMotion: motionQuery.matches || prev.reducedMotion,
      }));
    };

    updateSystemPreferences();
    
    // Listen for system preference changes
    mediaQuery.addEventListener('change', updateSystemPreferences);
    motionQuery.addEventListener('change', updateSystemPreferences);

    return () => {
      mediaQuery.removeEventListener('change', updateSystemPreferences);
      motionQuery.removeEventListener('change', updateSystemPreferences);
    };
  }, [storageKey]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'high-contrast');
    
    // Add current theme class
    root.classList.add(config.theme === 'highContrast' ? 'high-contrast' : config.theme);
    
    // Apply CSS custom properties
    const themeColors = themes[config.theme];
    if (themeColors) {
      Object.entries(themeColors.colors).forEach(([key, value]) => {
        root.style.setProperty(`--ds-color-${key}`, value);
      });
    }
    
    // Apply font size scaling
    root.style.setProperty('--ds-font-size-scale', (config.fontSize / 16).toString());
    
    // Apply border radius scaling
    root.style.setProperty('--ds-border-radius-scale', (config.borderRadius / 8).toString());
    
    // Apply reduced motion
    root.classList.toggle('reduced-motion', config.reducedMotion);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      logger.error('Failed to save design system config:', error);
    }
  }, [config, storageKey]);

  const setTheme = (theme: Theme) => {
    setConfig(prev => ({ ...prev, theme }));
  };

  const setReducedMotion = (reducedMotion: boolean) => {
    setConfig(prev => ({ ...prev, reducedMotion }));
  };

  const setFontSize = (fontSize: number) => {
    setConfig(prev => ({ ...prev, fontSize }));
  };

  const setBorderRadius = (borderRadius: number) => {
    setConfig(prev => ({ ...prev, borderRadius }));
  };

  const resetConfig = () => {
    setConfig({ ...defaultConfig, theme: defaultTheme });
  };

  const contextValue: DesignSystemContextType = {
    config,
    setTheme,
    setReducedMotion,
    setFontSize,
    setBorderRadius,
    resetConfig,
  };

  return (
    <DesignSystemContext.Provider value={contextValue}>
      {children}
    </DesignSystemContext.Provider>
  );
};

export const useDesignSystem = () => {
  const context = useContext(DesignSystemContext);
  if (context === undefined) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
};

// Theme toggle hook for convenience
export const useTheme = () => {
  const { config, setTheme } = useDesignSystem();
  
  const toggleTheme = () => {
    const nextTheme = config.theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };
  
  return {
    theme: config.theme,
    setTheme,
    toggleTheme,
  };
};

export default DesignSystemProvider;