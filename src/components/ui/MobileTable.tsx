import React from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './MobileTable.module.css';

interface MobileTableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  primary?: boolean;
  secondary?: boolean;
  mobile?: {
    label?: string;
    show?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
  };
}

interface MobileTableProps<T = any> {
  data: T[];
  columns: MobileTableColumn<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string | number;
  className?: string;
}

export function MobileTable<T = any>({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = 'Nenhum item encontrado',
  keyExtractor,
  className
}: MobileTableProps<T>) {
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const primaryColumn = columns.find(col => col.primary);
  const secondaryColumn = columns.find(col => col.secondary);
  const visibleColumns = columns.filter(col => 
    col.mobile?.show !== false && !col.primary && !col.secondary
  );

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Desktop Table */}
      <div className={`${styles.desktopTable} table-desktop`}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={styles.th}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                onClick={() => onRowClick?.(item)}
                data-testid={`table-row-${keyExtractor(item)}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={styles.td}>
                    {column.render 
                      ? column.render(item[column.key], item)
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={`${styles.mobileCards} table-card-mobile`}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className={`${styles.card} ${onRowClick ? styles.clickable : ''}`}
            onClick={() => onRowClick?.(item)}
            data-testid={`mobile-card-${keyExtractor(item)}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardMain}>
                {primaryColumn && (
                  <div className={styles.primaryText}>
                    {primaryColumn.mobile?.render
                      ? primaryColumn.mobile.render(item[primaryColumn.key], item)
                      : primaryColumn.render
                      ? primaryColumn.render(item[primaryColumn.key], item)
                      : item[primaryColumn.key]
                    }
                  </div>
                )}
                
                {secondaryColumn && (
                  <div className={styles.secondaryText}>
                    {secondaryColumn.mobile?.render
                      ? secondaryColumn.mobile.render(item[secondaryColumn.key], item)
                      : secondaryColumn.render
                      ? secondaryColumn.render(item[secondaryColumn.key], item)
                      : item[secondaryColumn.key]
                    }
                  </div>
                )}
              </div>
              
              {onRowClick && (
                <div className={styles.cardAction}>
                  <ChevronRight size={20} />
                </div>
              )}
            </div>

            {visibleColumns.length > 0 && (
              <div className={styles.cardBody}>
                {visibleColumns.map((column) => (
                  <div key={column.key} className={styles.cardField}>
                    <span className={styles.fieldLabel}>
                      {column.mobile?.label || column.label}:
                    </span>
                    <span className={styles.fieldValue}>
                      {column.mobile?.render
                        ? column.mobile.render(item[column.key], item)
                        : column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}