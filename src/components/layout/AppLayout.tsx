import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';
import { PageErrorFallback } from '../ui/ErrorFallback';
import { useCurrentRoute } from '../../router/newHooks';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
  const currentRoute = useCurrentRoute();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Ativa controle global de navegação por Tab
  useTabNavigation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Atualizar title da página dinamicamente
  useEffect(() => {
    document.title = currentRoute.title
      ? `${currentRoute.title} - Synapse`
      : 'Synapse';
  }, [currentRoute.title]);

  // Retrair sidebar em telas pequenas automaticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
      // Removido o else - não expande automaticamente em telas grandes
    };

    // Configurar estado inicial apenas para telas pequenas
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }

    // Adicionar listener
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.appLayout}>
      <Header onMenuButtonClick={toggleSidebar} menuButtonRef={menuButtonRef} />

      <div className={styles.container}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          menuButtonRef={menuButtonRef}
        />

        <main
          className={styles.main}
          role='main'
          tabIndex={-1}
          aria-label='Conteúdo principal'
        >
          <div className={styles.content}>
            <ErrorBoundary fallback={<PageErrorFallback />}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
