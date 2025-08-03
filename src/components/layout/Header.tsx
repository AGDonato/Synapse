// src/components/layout/Header.tsx
import styles from './Header.module.css';

type Breadcrumb = {
  title: string;
  path: string;
  meta?: Record<string, unknown>;
};

type HeaderProps = {
  onMenuButtonClick: () => void;
  title?: string;
  breadcrumbs?: Breadcrumb[];
};

export default function Header({ onMenuButtonClick, title = 'Synapse', breadcrumbs = [] }: HeaderProps) {
  return (
    <header className={styles.header}>
      <button 
        className={styles.menuButton}
        onClick={onMenuButtonClick} 
        title="Abrir/Fechar menu"
        aria-label="Toggle sidebar"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      
      <h1 className={styles.title}>{title}</h1>
      
      {breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path}>
              {index > 0 && (
                <span className={styles.breadcrumbSeparator} aria-hidden="true">
                  /
                </span>
              )}
              {crumb.title}
            </span>
          ))}
        </nav>
      )}
      
      <div className={styles.spacer} />
      
      <div className={styles.userSection}>
        <span className={styles.userName}>Olá, Alan!</span>
        <button 
          className={styles.logoutButton}
          type="button"
          aria-label="Fazer logout"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
