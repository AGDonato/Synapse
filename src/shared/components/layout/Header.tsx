// src/components/layout/Header.tsx
import React from 'react';
import { ImExit } from 'react-icons/im';
import { NotificationCenter } from '../ui';
import { useNotifications } from '../../hooks/useNotifications';
import styles from './Header.module.css';

// App Icon Component
const AppIcon = () => (
  <div className={styles.appIcon}>
    <img src='/synapse-icon.svg' alt='Synapse' className={styles.appIconImage} />
  </div>
);

interface HeaderProps {
  onMenuButtonClick: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({ onMenuButtonClick, menuButtonRef }: HeaderProps) {
  const { showInfo } = useNotifications();

  // Example notifications for demo
  React.useEffect(() => {
    const timer = setTimeout(() => {
      showInfo('Sistema Iniciado', 'Dashboard carregado com sucesso');
    }, 2000);
    return () => clearTimeout(timer);
  }, [showInfo]);

  return (
    <header className={styles.header}>
      <button
        ref={menuButtonRef}
        className={styles.menuButton}
        onClick={onMenuButtonClick}
        title='Abrir/Fechar menu'
        aria-label='Toggle sidebar'
      >
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <line x1='3' y1='6' x2='21' y2='6' />
          <line x1='3' y1='12' x2='21' y2='12' />
          <line x1='3' y1='18' x2='21' y2='18' />
        </svg>
      </button>

      <div className={styles.appBrand}>
        <AppIcon />
        <h1 className={styles.title}>Synapse</h1>
      </div>

      <div className={styles.spacer} />

      <div className={styles.userSection}>
        <NotificationCenter className={styles.notificationCenter} />
        <span className={styles.userName}>Olá, Alan!</span>
        <button
          className={styles.logoutButton}
          type='button'
          aria-label='Fazer logout'
          tabIndex={-1}
        >
          <ImExit size={18} />
        </button>
      </div>
    </header>
  );
}
