import React, { useState, useEffect } from 'react';
import styles from './StickyYearFilter.module.css';

interface StickyYearFilterProps {
  availableYears: string[];
  selectedYears: string[];
  onYearChange: (year: string) => void;
  onClearAll: () => void;
  getDisplayText: (availableYears: string[]) => string;
  isHidden?: boolean;
  isSidebarCollapsed?: boolean;
}

export const StickyYearFilter: React.FC<StickyYearFilterProps> = ({
  availableYears,
  selectedYears,
  onYearChange,
  onClearAll,
  getDisplayText,
  isHidden = false,
  isSidebarCollapsed = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Aparece após rolar 300px para baixo
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || isHidden) return null;

  return (
    <div
      className={`${styles.stickyContainer} ${!isSidebarCollapsed ? styles.sidebarExpanded : ''}`}
    >
      <div className={styles.stickyContent}>
        <div className={styles.segmentedContainer}>
          {availableYears.map(year => (
            <button
              key={year}
              className={`${styles.segmentedBtn} ${
                selectedYears.includes(year) ? styles.segmentedActive : ''
              }`}
              onClick={() => onYearChange(year)}
            >
              {year}
            </button>
          ))}
        </div>

        <div className={styles.quickActions}>
          <button
            className={`${styles.actionBtn} ${selectedYears.length > 0 ? styles.actionBtnActive : styles.actionBtnInactive}`}
            onClick={onClearAll}
            disabled={selectedYears.length === 0}
            title={selectedYears.length > 0 ? 'Limpar todos os anos' : 'Nenhum ano selecionado'}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};
