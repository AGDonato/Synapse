
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Building, 
  FileText, 
  FolderOpen, 
  Home, 
  LogOut,
  Settings,
  Tag,
  Users,
  X
} from 'lucide-react';
import styles from './MobileNav.module.css';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size: number }>;
  category?: 'main' | 'cadastros' | 'config';
}

const navItems: NavItem[] = [
  // Main navigation
  { id: 'home', label: 'Início', href: '/', icon: Home, category: 'main' },
  { id: 'demandas', label: 'Demandas', href: '/demandas', icon: FileText, category: 'main' },
  { id: 'documentos', label: 'Documentos', href: '/documentos', icon: FolderOpen, category: 'main' },
  { id: 'relatorios', label: 'Relatórios', href: '/relatorios', icon: BarChart3, category: 'main' },
  
  // Cadastros
  { id: 'orgaos', label: 'Órgãos', href: '/cadastros/orgaos', icon: Building, category: 'cadastros' },
  { id: 'assuntos', label: 'Assuntos', href: '/cadastros/assuntos', icon: Tag, category: 'cadastros' },
  { id: 'autoridades', label: 'Autoridades', href: '/cadastros/autoridades', icon: Users, category: 'cadastros' },
  
  // Configurações
  { id: 'configuracoes', label: 'Configurações', href: '/configuracoes', icon: Settings, category: 'config' }
];

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const location = useLocation();

  // Close nav on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Close nav on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const isItemActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const mainItems = navItems.filter(item => item.category === 'main');
  const cadastroItems = navItems.filter(item => item.category === 'cadastros');
  const configItems = navItems.filter(item => item.category === 'config');

  return (
    <>
      {/* Overlay */}
      <div 
        className={`${styles.overlay} mobile-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        data-testid="mobile-nav-overlay"
      />

      {/* Navigation */}
      <nav 
        className={`${styles.mobileNav} mobile-nav ${isOpen ? 'open' : ''} safe-left`}
        aria-label="Menu principal"
        data-testid="mobile-nav"
      >
        {/* Header */}
        <div className={styles.navHeader}>
          <div className={styles.logo}>
            <img 
              src="/synapse-icon.svg" 
              alt="Synapse" 
              className={styles.logoIcon}
              width={32}
              height={32}
            />
            <span className={styles.logoText}>Synapse</span>
          </div>
          
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar menu"
            data-testid="mobile-nav-close"
          >
            <X size={24} />
          </button>
        </div>

        {/* User section */}
        {user && (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className={styles.userAvatar}
                />
              ) : (
                <div className={styles.userAvatarPlaceholder}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.userDetails}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation content */}
        <div className={styles.navContent}>
          {/* Main navigation */}
          <section className={styles.navSection}>
            <ul className={styles.navList}>
              {mainItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);
                
                return (
                  <li key={item.id} className={styles.navItem}>
                    <Link
                      to={item.href}
                      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      data-testid={`mobile-nav-${item.id}`}
                    >
                      <Icon size={20} />
                      <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Cadastros section */}
          {cadastroItems.length > 0 && (
            <section className={styles.navSection}>
              <h3 className={styles.sectionTitle}>Cadastros</h3>
              <ul className={styles.navList}>
                {cadastroItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.href);
                  
                  return (
                    <li key={item.id} className={styles.navItem}>
                      <Link
                        to={item.href}
                        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                        data-testid={`mobile-nav-${item.id}`}
                      >
                        <Icon size={20} />
                        <span className={styles.navLabel}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Config section */}
          {configItems.length > 0 && (
            <section className={styles.navSection}>
              <ul className={styles.navList}>
                {configItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.href);
                  
                  return (
                    <li key={item.id} className={styles.navItem}>
                      <Link
                        to={item.href}
                        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                        data-testid={`mobile-nav-${item.id}`}
                      >
                        <Icon size={20} />
                        <span className={styles.navLabel}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className={styles.navFooter}>
          <button
            type="button"
            className={styles.logoutButton}
            aria-label="Sair do sistema"
            data-testid="mobile-nav-logout"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
};