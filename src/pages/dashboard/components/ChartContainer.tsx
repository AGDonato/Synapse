import React from 'react';
import styles from '../styles/ChartContainer.module.css';

interface ChartContainerProps {
  title: string;
  titleIndicatorColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'blue2';
  variant?: 'default' | 'large' | 'small' | 'half' | 'tall' | 'fullHeight';
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = React.memo(
  ({ title, titleIndicatorColor = 'blue', variant = 'default', children, className }) => {
    const containerClasses = [
      styles.chartContainer,
      styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const indicatorClasses = [
      styles.titleIndicator,
      styles[
        `titleIndicator${titleIndicatorColor.charAt(0).toUpperCase() + titleIndicatorColor.slice(1)}`
      ],
    ].join(' ');

    return (
      <div className={containerClasses}>
        <div className={styles.chartContent}>
          <div className={styles.chartHeader}>
            <div className={styles.titleContainer}>
              <div className={indicatorClasses} />
              <h3 className={styles.chartTitle}>{title}</h3>
            </div>
          </div>
          <div className={styles.chartBody}>{children}</div>
        </div>
      </div>
    );
  }
);
