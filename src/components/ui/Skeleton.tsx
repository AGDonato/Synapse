import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente Skeleton para estados de carregamento
 *
 * Oferece diferentes variantes para simular diferentes tipos de conteúdo
 * durante o carregamento, melhorando a percepção de performance.
 *
 * @example
 * // Texto
 * <Skeleton variant="text" width="60%" />
 *
 * // Avatar circular
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * // Card retangular
 * <Skeleton variant="rectangular" width="100%" height={200} />
 */
export default function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = '',
  style,
}: SkeletonProps) {
  const skeletonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  const classNames = [
    styles.skeleton,
    styles[variant],
    styles[animation],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={skeletonStyle}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// Skeleton para cards de estatística
export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.skeletonStatCard} ${className}`}>
      <div className={styles.skeletonStatIcon}>
        <Skeleton variant="circular" width={64} height={64} />
      </div>
      <div className={styles.skeletonStatContent}>
        <Skeleton variant="text" width="80%" height="2.25rem" />
        <Skeleton variant="text" width="60%" height="0.875rem" />
        <Skeleton variant="text" width="90%" height="0.75rem" />
      </div>
    </div>
  );
}

// Skeleton para gráficos
export function SkeletonChart({
  height = '300px',
  className = '',
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div className={`${styles.skeletonChart} ${className}`} style={{ height }}>
      <div className={styles.skeletonChartHeader}>
        <Skeleton variant="text" width="40%" height="1.25rem" />
        <Skeleton variant="text" width="60%" height="0.875rem" />
      </div>
      <div className={styles.skeletonChartContent}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
    </div>
  );
}

// Skeleton para tabelas
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`${styles.skeletonTable} ${className}`}>
      {/* Header */}
      <div className={styles.skeletonTableHeader}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} variant="text" width="80%" height="1rem" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonTableRow}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width="70%"
              height="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton para lista de itens
export function SkeletonList({
  items = 3,
  showAvatar = false,
  className = '',
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={`${styles.skeletonList} ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className={styles.skeletonListItem}>
          {showAvatar && <Skeleton variant="circular" width={48} height={48} />}
          <div className={styles.skeletonListContent}>
            <Skeleton variant="text" width="60%" height="1rem" />
            <Skeleton variant="text" width="40%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
