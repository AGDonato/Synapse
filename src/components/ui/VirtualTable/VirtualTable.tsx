import React, { useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './VirtualTable.module.css';

export interface VirtualTableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  itemHeight?: number;
  height?: number;
  onRowClick?: (item: T, index: number) => void;
  onEdit?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function VirtualTable<T extends { id: string | number }>({
  data,
  columns,
  itemHeight = 50,
  height = 400,
  onRowClick,
  onEdit,
  emptyMessage = 'Nenhum item encontrado',
  className,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const handleRowClick = useCallback(
    (item: T, index: number, event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest('[data-action]')) {
        return; // Don't trigger row click if clicking on action buttons
      }
      onRowClick?.(item, index);
    },
    [onRowClick]
  );

  const renderCell = useCallback(
    (column: VirtualTableColumn<T>, item: T, index: number) => {
      const value = item[column.key];
      
      if (column.render) {
        return column.render(value, item, index);
      }
      
      return String(value || '');
    },
    []
  );

  const totalHeight = useMemo(() => virtualizer.getTotalSize(), [virtualizer]);
  const virtualItems = useMemo(() => virtualizer.getVirtualItems(), [virtualizer]);

  if (data.length === 0) {
    return (
      <div className={`${styles.virtualTable} ${className || ''}`}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            {columns.map((column) => (
              <div
                key={String(column.key)}
                className={`${styles.tableHeaderCell} ${styles[`align-${column.align || 'left'}`]}`}
                style={{ width: column.width }}
              >
                {column.label}
              </div>
            ))}
            <div className={styles.tableHeaderCell} style={{ width: '60px' }}>
              Ações
            </div>
          </div>
        </div>
        <div className={styles.emptyState} style={{ height }}>
          <div className={styles.emptyMessage}>{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.virtualTable} ${className || ''}`}>
      {/* Header */}
      <div className={styles.tableHeader}>
        <div className={styles.tableRow}>
          {columns.map((column) => (
            <div
              key={String(column.key)}
              className={`${styles.tableHeaderCell} ${styles[`align-${column.align || 'left'}`]}`}
              style={{ width: column.width }}
            >
              {column.label}
            </div>
          ))}
          {onEdit && (
            <div className={styles.tableHeaderCell} style={{ width: '60px' }}>
              Ações
            </div>
          )}
        </div>
      </div>

      {/* Virtual Body */}
      <div
        ref={parentRef}
        className={styles.tableBody}
        style={{ height, overflow: 'auto' }}
      >
        <div
          style={{
            height: totalHeight,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = data[virtualItem.index];
            
            return (
              <div
                key={`${item.id}-${virtualItem.index}`}
                className={`${styles.tableRow} ${styles.virtualRow}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={(e) => handleRowClick(item, virtualItem.index, e)}
              >
                {columns.map((column) => (
                  <div
                    key={String(column.key)}
                    className={`${styles.tableCell} ${styles[`align-${column.align || 'left'}`]}`}
                    style={{ width: column.width }}
                  >
                    {renderCell(column, item, virtualItem.index)}
                  </div>
                ))}
                {onEdit && (
                  <div className={styles.tableCell} style={{ width: '60px' }}>
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      data-action="edit"
                      title="Editar"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualTable;