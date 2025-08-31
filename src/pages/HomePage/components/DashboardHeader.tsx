import React from 'react';
import { IoStatsChart } from 'react-icons/io5';
import { GlobalSearch } from '../../../components/ui';
import styles from '../styles/DashboardHeader.module.css';

export const DashboardHeader: React.FC = () => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <div className={styles.headerTitle}>
          <IoStatsChart size={32} className={styles.headerIcon} />
          <div>
            <h1>Dashboard Executivo</h1>
            <p>Visão geral das demandas e documentos</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <GlobalSearch placeholder='Buscar demandas, documentos...' />
        </div>
      </div>
    </div>
  );
};
