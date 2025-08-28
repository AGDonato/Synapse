import { useCallback, useEffect, useState } from 'react';
import { logger } from '../utils/logger';

export type ViewDensity = 'compact' | 'comfortable' | 'spacious';

interface UseViewDensityOptions {
  storageKey?: string;
  defaultDensity?: ViewDensity;
}

export function useViewDensity({
  storageKey = 'app_view_density',
  defaultDensity = 'comfortable',
}: UseViewDensityOptions = {}) {
  const [density, setDensity] = useState<ViewDensity>(defaultDensity);

  // Load density from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && ['compact', 'comfortable', 'spacious'].includes(stored)) {
        setDensity(stored as ViewDensity);
      }
    } catch (error) {
      logger.error('Error loading view density from storage:', error);
    }
  }, [storageKey]);

  // Save density to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, density);
    } catch (error) {
      logger.error('Error saving view density to storage:', error);
    }
  }, [density, storageKey]);

  const setViewDensity = useCallback((newDensity: ViewDensity) => {
    setDensity(newDensity);
  }, []);

  const toggleDensity = useCallback(() => {
    const densityOrder: ViewDensity[] = ['compact', 'comfortable', 'spacious'];
    const currentIndex = densityOrder.indexOf(density);
    const nextIndex = (currentIndex + 1) % densityOrder.length;
    setDensity(densityOrder[nextIndex]);
  }, [density]);

  const getDensityConfig = useCallback(() => {
    const configs = {
      compact: {
        label: 'Compacto',
        description: 'Máximo de informações em menor espaço',
        cardPadding: '0.75rem',
        itemHeight: 36,
        fontSize: '0.875rem',
        spacing: '0.5rem',
        iconSize: 16,
        borderRadius: '6px',
        headerHeight: '2.5rem',
      },
      comfortable: {
        label: 'Confortável',
        description: 'Equilibrio entre densidade e legibilidade',
        cardPadding: '1rem',
        itemHeight: 44,
        fontSize: '0.9375rem',
        spacing: '0.75rem',
        iconSize: 18,
        borderRadius: '8px',
        headerHeight: '3rem',
      },
      spacious: {
        label: 'Espaçoso',
        description: 'Máxima legibilidade e espaçamento',
        cardPadding: '1.25rem',
        itemHeight: 52,
        fontSize: '1rem',
        spacing: '1rem',
        iconSize: 20,
        borderRadius: '10px',
        headerHeight: '3.5rem',
      },
    };

    return configs[density];
  }, [density]);

  const getCSSVariables = useCallback(() => {
    const config = getDensityConfig();
    return {
      '--density-card-padding': config.cardPadding,
      '--density-item-height': `${config.itemHeight}px`,
      '--density-font-size': config.fontSize,
      '--density-spacing': config.spacing,
      '--density-icon-size': `${config.iconSize}px`,
      '--density-border-radius': config.borderRadius,
      '--density-header-height': config.headerHeight,
    } as React.CSSProperties;
  }, [getDensityConfig]);

  const getTableRowHeight = useCallback(() => {
    switch (density) {
      case 'compact': return 36;
      case 'comfortable': return 44;
      case 'spacious': return 52;
      default: return 44;
    }
  }, [density]);

  const getCardSpacing = useCallback(() => {
    switch (density) {
      case 'compact': return '0.5rem';
      case 'comfortable': return '0.75rem';
      case 'spacious': return '1rem';
      default: return '0.75rem';
    }
  }, [density]);

  const getFontSize = useCallback((variant: 'small' | 'body' | 'title' = 'body') => {
    const sizes = {
      compact: {
        small: '0.75rem',
        body: '0.875rem',
        title: '1rem',
      },
      comfortable: {
        small: '0.8125rem',
        body: '0.9375rem',
        title: '1.125rem',
      },
      spacious: {
        small: '0.875rem',
        body: '1rem',
        title: '1.25rem',
      },
    };

    return sizes[density][variant];
  }, [density]);

  const getButtonSize = useCallback(() => {
    switch (density) {
      case 'compact': return { padding: '0.375rem 0.75rem', height: '2rem' };
      case 'comfortable': return { padding: '0.5rem 1rem', height: '2.25rem' };
      case 'spacious': return { padding: '0.625rem 1.25rem', height: '2.5rem' };
      default: return { padding: '0.5rem 1rem', height: '2.25rem' };
    }
  }, [density]);

  return {
    density,
    setViewDensity,
    toggleDensity,
    getDensityConfig,
    getCSSVariables,
    getTableRowHeight,
    getCardSpacing,
    getFontSize,
    getButtonSize,
  };
}