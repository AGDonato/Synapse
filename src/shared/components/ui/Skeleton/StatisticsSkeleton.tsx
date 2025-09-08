import React from 'react';
import { Skeleton } from './Skeleton';
import styles from '../../../../pages/dashboard/styles/StatisticsSection.module.css';

export const StatisticsSkeleton: React.FC = () => {
  return (
    <section className={styles.statsSection}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Skeleton height='32px' borderRadius='8px' />
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton width='120px' height='40px' borderRadius='6px' />
          <Skeleton width='120px' height='40px' borderRadius='6px' />
        </div>
      </div>

      {/* Grid de Cards */}
      <div className={styles.statsGrid}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid var(--border-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Skeleton width='40px' height='40px' variant='circular' />
              <div style={{ flex: 1 }}>
                <Skeleton width='80%' height='24px' variant='text' />
                <Skeleton width='60%' height='16px' variant='text' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
