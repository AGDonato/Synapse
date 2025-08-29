import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ActualTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  actualTheme: ActualTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isLightMode: boolean;
  isAutoMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

// Função para detectar preferência do sistema
const getSystemTheme = (): ActualTheme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Função para obter o tema salvo no localStorage
const getSavedTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'auto';
  }
  const saved = localStorage.getItem('synapse-theme');
  return (saved as ThemeMode) || 'auto';
};

// Função para calcular o tema atual baseado no modo
const getActualTheme = (mode: ThemeMode): ActualTheme => {
  if (mode === 'auto') {
    return getSystemTheme();
  }
  return mode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultMode = 'auto' }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getSavedTheme() || defaultMode);
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => getActualTheme(mode));

  // Função para atualizar o modo e salvar no localStorage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('synapse-theme', newMode);
    setActualTheme(getActualTheme(newMode));
  };

  // Função para alternar entre light e dark (ignora auto)
  const toggleTheme = () => {
    if (mode === 'auto') {
      // Se está em auto, vai para o oposto do sistema
      const systemTheme = getSystemTheme();
      setMode(systemTheme === 'light' ? 'dark' : 'light');
    } else {
      // Alterna entre light e dark
      setMode(mode === 'light' ? 'dark' : 'light');
    }
  };

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (mode === 'auto') {
        setActualTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [mode]);

  // Aplicar o tema no documento
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;

    // Remover classes de tema anteriores
    root.classList.remove('theme-light', 'theme-dark');

    // Adicionar classe do tema atual
    root.classList.add(`theme-${actualTheme}`);

    // Atualizar atributo data-theme para CSS
    root.setAttribute('data-theme', actualTheme);

    // Atualizar meta theme-color para PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#ffffff');
    }

    // Atualizar favicon baseado no tema (se necessário)
    const favicon = document.querySelector('link[rel="icon"]')!;
    if (favicon) {
      const faviconPath = actualTheme === 'dark' ? '/favicon-dark.ico' : '/favicon.ico';
      favicon.href = faviconPath;
    }
  }, [actualTheme]);

  // Detectar mudanças no localStorage de outras abas
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'synapse-theme' && e.newValue) {
        const newMode = e.newValue as ThemeMode;
        setModeState(newMode);
        setActualTheme(getActualTheme(newMode));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value: ThemeContextValue = {
    mode,
    actualTheme,
    setMode,
    toggleTheme,
    isDarkMode: actualTheme === 'dark',
    isLightMode: actualTheme === 'light',
    isAutoMode: mode === 'auto',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook para usar o contexto de tema
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Hook para aplicar classes condicionais baseadas no tema
export const useThemeClasses = () => {
  const { actualTheme, isDarkMode, isLightMode } = useTheme();

  return {
    theme: actualTheme,
    isDark: isDarkMode,
    isLight: isLightMode,
    themeClass: `theme-${actualTheme}`,
    conditionalClass: (lightClass: string, darkClass: string) =>
      isDarkMode ? darkClass : lightClass,
  };
};

// Componente para detectar tema e aplicar classes iniciais
export const ThemeScript: React.FC = () => {
  // Script inline para evitar flash durante o carregamento
  const themeScript = `
    (function() {
      try {
        var savedTheme = localStorage.getItem('synapse-theme') || 'auto';
        var actualTheme = 'light';
        
        if (savedTheme === 'auto') {
          actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          actualTheme = savedTheme;
        }
        
        document.documentElement.classList.add('theme-' + actualTheme);
        document.documentElement.setAttribute('data-theme', actualTheme);
      } catch (e) {
        logger.warn('Erro ao aplicar tema inicial:', e);
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};
