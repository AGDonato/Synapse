
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, User, X } from 'lucide-react';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  notifications?: number;
  user?: {
    name: string;
    avatar?: string;
  };
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isMenuOpen,
  onMenuToggle,
  title = 'Synapse',
  showBackButton = false,
  onBackClick,
  notifications = 0,
  user
}) => {
  return (
    <header className={`${styles.mobileHeader} mobile-header safe-top`} data-testid="mobile-header">
      <div className={styles.headerContent}>
        {/* Left Section - Menu/Back Button */}
        <div className={styles.leftSection}>
          {showBackButton ? (
            <button
              type="button"
              className={`${styles.backButton} touch-target`}
              onClick={onBackClick}
              aria-label="Voltar"
              data-testid="back-button"
            >
              <X size={24} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.menuButton} touch-target`}
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMenuOpen}
              data-testid="mobile-menu-toggle"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Center Section - Title/Logo */}
        <div className={styles.centerSection}>
          <Link to="/" className={styles.logo} data-testid="mobile-logo">
            <img 
              src="/synapse-icon.svg" 
              alt="Synapse" 
              className={styles.logoIcon}
              width={32}
              height={32}
            />
            <span className={styles.logoText}>{title}</span>
          </Link>
        </div>

        {/* Right Section - Actions */}
        <div className={styles.rightSection}>
          {/* Notifications */}
          <button
            type="button"
            className={`${styles.notificationButton} touch-target`}
            aria-label={`${notifications} notificações`}
            data-testid="notifications-button"
          >
            <div className={styles.notificationIcon}>
              <Bell size={20} />
              {notifications > 0 && (
                <span className={styles.notificationBadge} data-testid="notification-count">
                  {notifications > 99 ? '99+' : notifications}
                </span>
              )}
            </div>
          </button>

          {/* User Menu */}
          {user && (
            <div className={styles.userSection}>
              <button
                type="button"
                className={`${styles.userButton} touch-target`}
                aria-label={`Menu do usuário ${user.name}`}
                data-testid="user-menu-button"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className={styles.userAvatar}
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className={styles.userAvatarPlaceholder}>
                    <User size={18} />
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for loading states */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} />
      </div>
    </header>
  );
};