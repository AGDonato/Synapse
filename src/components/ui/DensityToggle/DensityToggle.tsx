import React, { useState } from 'react';
import { 
  IoApps, 
  IoCheckmark, 
  IoChevronDown,
  IoGrid,
  IoGridOutline
} from 'react-icons/io5';
import { type ViewDensity, useViewDensity } from '../../../hooks/useViewDensity';
import styles from './DensityToggle.module.css';

interface DensityToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const densityIcons = {
  compact: <IoGridOutline size={16} />,
  comfortable: <IoGrid size={16} />,
  spacious: <IoApps size={16} />,
};

const densityLabels = {
  compact: 'Compacto',
  comfortable: 'Confortável', 
  spacious: 'Espaçoso',
};

const densityDescriptions = {
  compact: 'Máximo de informações em menor espaço',
  comfortable: 'Equilibrio entre densidade e legibilidade',
  spacious: 'Máxima legibilidade e espaçamento',
};

export const DensityToggle: React.FC<DensityToggleProps> = ({
  className,
  showLabel = false,
  size = 'medium',
}) => {
  const { density, setViewDensity, getDensityConfig } = useViewDensity();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = getDensityConfig();

  const densityOptions: ViewDensity[] = ['compact', 'comfortable', 'spacious'];

  const handleDensityChange = (newDensity: ViewDensity) => {
    setViewDensity(newDensity);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.densityToggle} ${className || ''}`}>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${styles[size]}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Densidade atual: ${currentConfig.label}`}
      >
        <div className={styles.buttonContent}>
          <div className={styles.buttonIcon}>
            {densityIcons[density]}
          </div>
          {showLabel && (
            <span className={styles.buttonLabel}>
              {currentConfig.label}
            </span>
          )}
          <IoChevronDown 
            size={14} 
            className={`${styles.chevron} ${isOpen ? styles.open : ''}`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className={styles.overlay} 
            onClick={() => setIsOpen(false)} 
          />
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span>Densidade da Interface</span>
            </div>
            <div className={styles.optionsList}>
              {densityOptions.map((option) => (
                <button
                  key={option}
                  className={`${styles.option} ${
                    density === option ? styles.active : ''
                  }`}
                  onClick={() => handleDensityChange(option)}
                >
                  <div className={styles.optionIcon}>
                    {densityIcons[option]}
                  </div>
                  <div className={styles.optionContent}>
                    <div className={styles.optionTitle}>
                      {densityLabels[option]}
                    </div>
                    <div className={styles.optionDescription}>
                      {densityDescriptions[option]}
                    </div>
                  </div>
                  <div className={styles.optionCheck}>
                    {density === option && (
                      <IoCheckmark size={16} />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.dropdownFooter}>
              <div className={styles.footerNote}>
                A configuração é salva automaticamente
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};