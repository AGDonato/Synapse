import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Retrair sidebar em telas pequenas automaticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };

    // Configurar estado inicial para telas ≤1024px
    if (window.innerWidth <= 1024) {
      setSidebarCollapsed(true);
    }

    // Adicionar listener
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
