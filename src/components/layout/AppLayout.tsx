import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';
import { PageErrorFallback } from '../ui/ErrorFallback';
import { useCurrentRoute, useBreadcrumbs } from '../../router/newHooks';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const currentRoute = useCurrentRoute();
  const breadcrumbs = useBreadcrumbs();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Atualizar title da página dinamicamente
  useEffect(() => {
    document.title = currentRoute.title ? `${currentRoute.title} - Synapse` : 'Synapse';
  }, [currentRoute.title]);

  // Fechar sidebar em telas pequenas por padrão
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Configurar estado inicial
    handleResize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.appLayout}>
      <Header 
        onMenuButtonClick={toggleSidebar} 
        title={currentRoute.title}
        breadcrumbs={breadcrumbs}
      />
      
      <div className={styles.container}>
        {isSidebarOpen && <Sidebar />}
        
        <main 
          className={styles.main}
          role="main"
          tabIndex={-1}
          aria-label="Conteúdo principal"
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