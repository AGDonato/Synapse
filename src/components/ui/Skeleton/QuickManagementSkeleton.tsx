import React from 'react';
import { Skeleton } from './Skeleton';
import styles from '../../../pages/HomePage/styles/QuickManagement.module.css';

export const QuickManagementSkeleton: React.FC = () => {
  return (
    <section className={styles.tablesSection}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Skeleton height="40px" borderRadius="8px" />
      </div>

      {/* Filtros Skeleton */}
      <div className={styles.filters}>
        <div className={styles.filterGroupLarge}>
          <Skeleton width="120px" height="16px" variant="text" />
          <Skeleton height="40px" borderRadius="6px" />
        </div>
        <div className={styles.filterGroupLarge}>
          <Skeleton width="80px" height="16px" variant="text" />
          <Skeleton height="40px" borderRadius="6px" />
        </div>
        <div className={styles.filterGroupLarge}>
          <Skeleton width="60px" height="16px" variant="text" />
          <Skeleton height="40px" borderRadius="6px" />
        </div>
      </div>

      {/* Tabelas Skeleton */}
      <div className={styles.tablesGrid}>
        {/* Documentos Table */}
        <div className={`${styles.tableContainer} ${styles.tableContainerLarge}`}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>
              <Skeleton width="24px" height="24px" variant="circular" />
              <Skeleton width="150px" height="20px" variant="text" />
            </div>
            <Skeleton width="32px" height="32px" variant="circular" />
          </div>
          <div className={styles.tableWrapper}>
            <div style={{ padding: '1rem' }}>
              {/* Table Header */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Skeleton width="25%" height="16px" variant="text" />
                <Skeleton width="15%" height="16px" variant="text" />
                <Skeleton width="40%" height="16px" variant="text" />
                <Skeleton width="20%" height="16px" variant="text" />
              </div>
              {/* Table Rows */}
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <Skeleton width="25%" height="14px" variant="text" />
                  <Skeleton width="15%" height="14px" variant="text" />
                  <Skeleton width="40%" height="14px" variant="text" />
                  <Skeleton width="20%" height="14px" variant="text" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demandas Table */}
        <div className={`${styles.tableContainer} ${styles.tableContainerSmall}`}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>
              <Skeleton width="24px" height="24px" variant="circular" />
              <Skeleton width="120px" height="20px" variant="text" />
            </div>
            <Skeleton width="32px" height="32px" variant="circular" />
          </div>
          <div className={styles.tableWrapper}>
            <div style={{ padding: '1rem' }}>
              {/* Table Header */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Skeleton width="50%" height="16px" variant="text" />
                <Skeleton width="50%" height="16px" variant="text" />
              </div>
              {/* Table Rows */}
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <Skeleton width="50%" height="14px" variant="text" />
                  <Skeleton width="50%" height="14px" variant="text" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};