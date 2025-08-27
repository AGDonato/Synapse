// src/components/accessibility/AccessibilityProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

// Accessibility preferences interface
export interface AccessibilityState {
  // Visual preferences
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  
  // Keyboard navigation
  showFocusOutlines: boolean;
  keyboardOnlyNavigation: boolean;
  
  // Screen reader preferences
  announceChanges: boolean;
  verboseDescriptions: boolean;
  
  // Motor disabilities
  increaseClickTargets: boolean;
  stickyKeys: boolean;
  
  // Cognitive disabilities
  simplifiedUI: boolean;
  reduceDistraction: boolean;
}

// Accessibility actions
export type AccessibilityAction =
  | { type: 'TOGGLE_HIGH_CONTRAST' }
  | { type: 'TOGGLE_REDUCED_MOTION' }
  | { type: 'SET_FONT_SIZE'; payload: AccessibilityState['fontSize'] }
  | { type: 'TOGGLE_FOCUS_OUTLINES' }
  | { type: 'TOGGLE_KEYBOARD_NAVIGATION' }
  | { type: 'TOGGLE_ANNOUNCE_CHANGES' }
  | { type: 'TOGGLE_VERBOSE_DESCRIPTIONS' }
  | { type: 'TOGGLE_INCREASE_CLICK_TARGETS' }
  | { type: 'TOGGLE_STICKY_KEYS' }
  | { type: 'TOGGLE_SIMPLIFIED_UI' }
  | { type: 'TOGGLE_REDUCE_DISTRACTION' }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'LOAD_PREFERENCES'; payload: Partial<AccessibilityState> };

// Initial accessibility state
const initialAccessibilityState: AccessibilityState = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  showFocusOutlines: true,
  keyboardOnlyNavigation: false,
  announceChanges: true,
  verboseDescriptions: false,
  increaseClickTargets: false,
  stickyKeys: false,
  simplifiedUI: false,
  reduceDistraction: false,
};

// Accessibility reducer
function accessibilityReducer(
  state: AccessibilityState,
  action: AccessibilityAction
): AccessibilityState {
  switch (action.type) {
    case 'TOGGLE_HIGH_CONTRAST':
      return { ...state, highContrast: !state.highContrast };
      
    case 'TOGGLE_REDUCED_MOTION':
      return { ...state, reducedMotion: !state.reducedMotion };
      
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
      
    case 'TOGGLE_FOCUS_OUTLINES':
      return { ...state, showFocusOutlines: !state.showFocusOutlines };
      
    case 'TOGGLE_KEYBOARD_NAVIGATION':
      return { ...state, keyboardOnlyNavigation: !state.keyboardOnlyNavigation };
      
    case 'TOGGLE_ANNOUNCE_CHANGES':
      return { ...state, announceChanges: !state.announceChanges };
      
    case 'TOGGLE_VERBOSE_DESCRIPTIONS':
      return { ...state, verboseDescriptions: !state.verboseDescriptions };
      
    case 'TOGGLE_INCREASE_CLICK_TARGETS':
      return { ...state, increaseClickTargets: !state.increaseClickTargets };
      
    case 'TOGGLE_STICKY_KEYS':
      return { ...state, stickyKeys: !state.stickyKeys };
      
    case 'TOGGLE_SIMPLIFIED_UI':
      return { ...state, simplifiedUI: !state.simplifiedUI };
      
    case 'TOGGLE_REDUCE_DISTRACTION':
      return { ...state, reduceDistraction: !state.reduceDistraction };
      
    case 'RESET_PREFERENCES':
      return { ...initialAccessibilityState };
      
    case 'LOAD_PREFERENCES':
      return { ...state, ...action.payload };
      
    default:
      return state;
  }
}

// Accessibility context interface
interface AccessibilityContextType extends AccessibilityState {
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: AccessibilityState['fontSize']) => void;
  toggleFocusOutlines: () => void;
  toggleKeyboardNavigation: () => void;
  toggleAnnounceChanges: () => void;
  toggleVerboseDescriptions: () => void;
  toggleIncreaseClickTargets: () => void;
  toggleStickyKeys: () => void;
  toggleSimplifiedUI: () => void;
  toggleReduceDistraction: () => void;
  resetPreferences: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

// Create accessibility context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Accessibility provider component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(accessibilityReducer, initialAccessibilityState);

  // Announce function for screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!state.announceChanges) {return;}

    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Screen reader only class
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [state.announceChanges]);

  // Action creators
  const toggleHighContrast = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });
    announce(state.highContrast ? 'Alto contraste desativado' : 'Alto contraste ativado');
  }, [announce, state.highContrast]);

  const toggleReducedMotion = useCallback(() => {
    dispatch({ type: 'TOGGLE_REDUCED_MOTION' });
    announce(state.reducedMotion ? 'Movimento reduzido desativado' : 'Movimento reduzido ativado');
  }, [announce, state.reducedMotion]);

  const setFontSize = useCallback((size: AccessibilityState['fontSize']) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: size });
    const sizeLabels = {
      'small': 'pequeno',
      'medium': 'médio',
      'large': 'grande',
      'extra-large': 'extra grande'
    };
    announce(`Tamanho da fonte alterado para ${sizeLabels[size]}`);
  }, [announce]);

  const toggleFocusOutlines = useCallback(() => {
    dispatch({ type: 'TOGGLE_FOCUS_OUTLINES' });
    announce(state.showFocusOutlines ? 'Indicadores de foco desativados' : 'Indicadores de foco ativados');
  }, [announce, state.showFocusOutlines]);

  const toggleKeyboardNavigation = useCallback(() => {
    dispatch({ type: 'TOGGLE_KEYBOARD_NAVIGATION' });
    announce(state.keyboardOnlyNavigation ? 'Navegação por teclado desativada' : 'Navegação por teclado ativada');
  }, [announce, state.keyboardOnlyNavigation]);

  const toggleAnnounceChanges = useCallback(() => {
    dispatch({ type: 'TOGGLE_ANNOUNCE_CHANGES' });
  }, []);

  const toggleVerboseDescriptions = useCallback(() => {
    dispatch({ type: 'TOGGLE_VERBOSE_DESCRIPTIONS' });
    announce(state.verboseDescriptions ? 'Descrições detalhadas desativadas' : 'Descrições detalhadas ativadas');
  }, [announce, state.verboseDescriptions]);

  const toggleIncreaseClickTargets = useCallback(() => {
    dispatch({ type: 'TOGGLE_INCREASE_CLICK_TARGETS' });
    announce(state.increaseClickTargets ? 'Áreas de clique reduzidas' : 'Áreas de clique aumentadas');
  }, [announce, state.increaseClickTargets]);

  const toggleStickyKeys = useCallback(() => {
    dispatch({ type: 'TOGGLE_STICKY_KEYS' });
    announce(state.stickyKeys ? 'Teclas aderentes desativadas' : 'Teclas aderentes ativadas');
  }, [announce, state.stickyKeys]);

  const toggleSimplifiedUI = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIMPLIFIED_UI' });
    announce(state.simplifiedUI ? 'Interface padrão ativada' : 'Interface simplificada ativada');
  }, [announce, state.simplifiedUI]);

  const toggleReduceDistraction = useCallback(() => {
    dispatch({ type: 'TOGGLE_REDUCE_DISTRACTION' });
    announce(state.reduceDistraction ? 'Modo padrão ativado' : 'Modo sem distrações ativado');
  }, [announce, state.reduceDistraction]);

  const resetPreferences = useCallback(() => {
    dispatch({ type: 'RESET_PREFERENCES' });
    announce('Preferências de acessibilidade redefinidas');
  }, [announce]);

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    root.classList.toggle('high-contrast', state.highContrast);
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${state.fontSize}`);
    
    // Reduced motion
    root.classList.toggle('reduced-motion', state.reducedMotion);
    
    // Focus outlines
    root.classList.toggle('no-focus-outlines', !state.showFocusOutlines);
    
    // Increased click targets
    root.classList.toggle('large-click-targets', state.increaseClickTargets);
    
    // Simplified UI
    root.classList.toggle('simplified-ui', state.simplifiedUI);
    
    // Reduced distraction
    root.classList.toggle('reduced-distraction', state.reduceDistraction);
    
  }, [state]);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('accessibility-preferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'LOAD_PREFERENCES', payload: preferences });
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving accessibility preferences:', error);
    }
  }, [state]);

  // Detect system preferences
  useEffect(() => {
    // Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      dispatch({ type: 'TOGGLE_REDUCED_MOTION' });
    };

    if (mediaQuery.matches && !state.reducedMotion) {
      dispatch({ type: 'TOGGLE_REDUCED_MOTION' });
    }

    mediaQuery.addEventListener('change', handleMotionChange);

    // Detect prefers-contrast
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e: MediaQueryListEvent) => {
      dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });
    };

    if (contrastQuery.matches && !state.highContrast) {
      dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });
    }

    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, [state.reducedMotion, state.highContrast]);

  // Context value
  const contextValue: AccessibilityContextType = {
    ...state,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleFocusOutlines,
    toggleKeyboardNavigation,
    toggleAnnounceChanges,
    toggleVerboseDescriptions,
    toggleIncreaseClickTargets,
    toggleStickyKeys,
    toggleSimplifiedUI,
    toggleReduceDistraction,
    resetPreferences,
    announce,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};