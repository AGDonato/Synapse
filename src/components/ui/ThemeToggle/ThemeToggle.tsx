import { useState } from 'react';
import { IoMoon, IoPhonePortrait, IoSunny } from 'react-icons/io5';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme, type ThemeMode } from '../../../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabels = false,
  className = '',
}) => {
  const { mode, setMode, actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: {
    mode: ThemeMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }[] = [
    {
      mode: 'light',
      label: 'Claro',
      icon: IoSunny,
      description: 'Tema claro',
    },
    {
      mode: 'dark',
      label: 'Escuro',
      icon: IoMoon,
      description: 'Tema escuro',
    },
    {
      mode: 'auto',
      label: 'Sistema',
      icon: IoPhonePortrait,
      description: 'Seguir sistema',
    },
  ];

  const currentOption = themeOptions.find(option => option.mode === mode) || themeOptions[2];

  // Variante botão simples (toggle light/dark)
  if (variant === 'button') {
    return (
      <motion.button
        className={`${styles.toggleButton} ${styles[`size-${size}`]} ${className}`}
        onClick={() => setMode(actualTheme === 'light' ? 'dark' : 'light')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Alternar para tema ${actualTheme === 'light' ? 'escuro' : 'claro'}`}
        type="button"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={actualTheme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.iconContainer}
          >
            {actualTheme === 'light' ? (
              <IoMoon className={styles.icon} />
            ) : (
              <IoSunny className={styles.icon} />
            )}
          </motion.div>
        </AnimatePresence>
        {showLabels && (
          <span className={styles.label}>
            {actualTheme === 'light' ? 'Escuro' : 'Claro'}
          </span>
        )}
      </motion.button>
    );
  }

  // Variante switch
  if (variant === 'switch') {
    const isDark = actualTheme === 'dark';
    
    return (
      <div className={`${styles.switchContainer} ${styles[`size-${size}`]} ${className}`}>
        {showLabels && (
          <div className={styles.switchLabels}>
            <IoSunny className={`${styles.switchIcon} ${!isDark ? styles.active : ''}`} />
            <IoMoon className={`${styles.switchIcon} ${isDark ? styles.active : ''}`} />
          </div>
        )}
        <motion.button
          className={styles.switch}
          onClick={() => setMode(isDark ? 'light' : 'dark')}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          <motion.div
            className={styles.switchThumb}
            animate={{
              x: isDark ? '100%' : '0%',
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
          <div className={styles.switchTrack} />
        </motion.button>
      </div>
    );
  }

  // Variante dropdown (padrão)
  return (
    <div className={`${styles.dropdown} ${styles[`size-${size}`]} ${className}`}>
      <motion.button
        className={styles.dropdownTrigger}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
      >
        <currentOption.icon className={styles.icon} />
        {showLabels && <span className={styles.label}>{currentOption.label}</span>}
        <motion.div
          className={styles.chevron}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdownMenu}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {themeOptions.map((option) => (
              <motion.button
                key={option.mode}
                className={`${styles.dropdownItem} ${
                  mode === option.mode ? styles.active : ''
                }`}
                onClick={() => {
                  setMode(option.mode);
                  setIsOpen(false);
                }}
                whileHover={{ backgroundColor: 'var(--color-background-tertiary)' }}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                <option.icon className={styles.optionIcon} />
                <div className={styles.optionContent}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.optionDescription}>
                    {option.description}
                  </span>
                </div>
                {mode === option.mode && (
                  <motion.div
                    className={styles.checkmark}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para fechar dropdown */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};