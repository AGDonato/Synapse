import React, { useEffect, useRef } from 'react';
import styles from '../styles/QuickManagement.module.css';

export interface FilterOption {
  id: string;
  nome: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  getDisplayText: () => string;
  placeholder?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = React.memo(
  ({
    label,
    options,
    selectedValues,
    onSelectionChange,
    isOpen,
    onToggle,
    getDisplayText,
    placeholder = '',
  }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Effect para fechar dropdown quando clicar fora
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          onToggle();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, onToggle]);

    return (
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>{label}</label>
        <div className={styles.multiSelectContainer} ref={dropdownRef}>
          <div className={styles.multiSelectTrigger} onClick={onToggle} tabIndex={0}>
            <span className={styles.selectedText}>{getDisplayText() || placeholder}</span>
            <span className={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</span>
          </div>
          {isOpen && (
            <div className={styles.multiSelectDropdown}>
              {options.map(option => (
                <label key={option.id} className={styles.checkboxLabel}>
                  <input
                    type='checkbox'
                    checked={selectedValues.includes(option.nome)}
                    onChange={() => onSelectionChange(option.nome)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>{option.nome}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
