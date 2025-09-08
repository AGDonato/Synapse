import React from 'react';
import { IoChevronDown, IoChevronUp, IoTrendingUp } from 'react-icons/io5';
import type { Estatistica, SubCard } from '../types';
import styles from '../styles/StatCard.module.css';

interface StatCardProps {
  estatistica: Estatistica;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggleExpansion?: () => void;
  subCards?: SubCard[];
}

export const StatCard: React.FC<StatCardProps> = React.memo(
  ({ estatistica, isExpandable = false, isExpanded = false, onToggleExpansion, subCards = [] }) => {
    return (
      <div className={styles.statCardContainer}>
        <div
          className={`
          ${styles.statCard} 
          ${styles[estatistica.cor]} 
          ${isExpandable ? styles.expandable : ''} 
          ${isExpanded ? styles.expanded : ''}
        `}
          onClick={isExpandable ? onToggleExpansion : undefined}
        >
          <div className={styles.statIcon}>{estatistica.icon}</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{estatistica.valor}</div>
            <div className={styles.statTitle}>{estatistica.titulo}</div>
            {estatistica.subtitulo && (
              <div className={styles.statSubtitle}>{estatistica.subtitulo}</div>
            )}
            {estatistica.tendencia && (
              <div className={`${styles.statTrend} ${styles[estatistica.tendencia.direcao]}`}>
                <IoTrendingUp size={14} />
                <span>+{estatistica.tendencia.valor}%</span>
              </div>
            )}
          </div>
          {isExpandable && (
            <div className={styles.expandIcon}>
              {isExpanded ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
            </div>
          )}
        </div>

        {isExpandable && isExpanded && subCards.length > 0 && (
          <div className={`${styles.subCardsContainer} ${isExpanded ? styles.expanded : ''}`}>
            <div className={styles.subCardsGrid}>
              {subCards.map(subCard => (
                <div key={subCard.id} className={`${styles.subCard} ${styles[subCard.cor]}`}>
                  <div className={styles.subCardIcon}>{subCard.icon}</div>
                  <div className={styles.subCardContent}>
                    <div className={styles.subCardValue}>{subCard.valor}</div>
                    <div className={styles.subCardTitle}>{subCard.titulo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);
