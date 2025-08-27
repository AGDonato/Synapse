import React from 'react';
import styles from '../styles/SectionHeader.module.css';

interface SectionHeaderProps {
  title: string;
  description?: string;
  emoji?: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  counters?: {
    label: string;
    value: number;
  }[];
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({
  title,
  description,
  emoji,
  isCollapsible = false,
  isCollapsed = false,
  onToggle,
  counters = [],
  children,
}) => {
  return (
    <div className={styles.sectionHeader}>
      <div
        className={`${styles.headerContent} ${isCollapsible ? styles.clickable : ''}`}
        onClick={isCollapsible ? onToggle : undefined}
      >
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            {emoji && <span className={styles.emoji}>{emoji}</span>}
            {title}
          </h2>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>

        {isCollapsible && !isCollapsed && counters.length > 0 && (
          <div className={styles.counters}>
            {counters.map((counter, index) => (
              <React.Fragment key={counter.label}>
                <span className={styles.counter}>
                  {counter.value} {counter.label}
                </span>
                {index < counters.length - 1 && (
                  <span className={styles.counterSeparator}>•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {isCollapsible && (
          <span className={styles.toggleArrow}>
            {isCollapsed ? '▼' : '▲'}
          </span>
        )}
      </div>

      {children && (
        <div className={styles.headerActions}>
          {children}
        </div>
      )}
    </div>
  );
});