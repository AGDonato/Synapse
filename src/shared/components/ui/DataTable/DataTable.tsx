import { useCallback, useMemo, useState } from 'react';
import { IoChevronDown, IoChevronUp, IoEllipsisVertical, IoSearch } from 'react-icons/io5';
import type { DataTableProps, FilterConfig, SortConfig } from './types';
import Skeleton from '../Skeleton';
import styles from './DataTable.module.css';

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  onEdit,
  onDelete,
  onCreateDocument,
  sortable = true,
  filterable = true,
  pagination,
  onPageChange,
  onSort,
  onFilter,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  className,
  size = 'md',
  striped = true,
  hoverable = true,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<SortConfig | null>(null);
  const [localFilters, setLocalFilters] = useState<FilterConfig>({});
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});

  // Handle sorting
  const handleSort = useCallback(
    (key: string) => {
      if (!sortable) {
        return;
      }

      const newSort: SortConfig = {
        key,
        direction: localSort?.key === key && localSort.direction === 'asc' ? 'desc' : 'asc',
      };

      setLocalSort(newSort);
      onSort?.(newSort);
    },
    [localSort, sortable, onSort]
  );

  // Handle filtering
  const handleFilter = useCallback(
    (key: string, value: string) => {
      const newFilters = { ...localFilters, [key]: value };
      setLocalFilters(newFilters);
      setFilterInputs(prev => ({ ...prev, [key]: value }));
      onFilter?.(newFilters);
    },
    [localFilters, onFilter]
  );

  // Process data locally if no external handlers
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply local filtering
    if (!onFilter && Object.keys(localFilters).length > 0) {
      result = result.filter(row => {
        return Object.entries(localFilters).every(([key, filterValue]) => {
          if (!filterValue) {
            return true;
          }
          const cellValue = String(row[key] || '').toLowerCase();
          return cellValue.includes(String(filterValue).toLowerCase());
        });
      });
    }

    // Apply local sorting
    if (!onSort && localSort) {
      result.sort((a, b) => {
        const aVal = a[localSort.key];
        const bVal = b[localSort.key];

        if (aVal === bVal) {
          return 0;
        }

        const comparison = String(aVal) < String(bVal) ? -1 : 1;
        return localSort.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, localFilters, localSort, onFilter, onSort]);

  // Handle row selection
  const handleRowSelection = useCallback(
    (row: T) => {
      if (!selectable || !onSelectionChange) {
        return;
      }

      const isSelected = selectedRows.some(r => r === row);
      const newSelection = isSelected
        ? selectedRows.filter(r => r !== row)
        : [...selectedRows, row];

      onSelectionChange(newSelection);
    },
    [selectable, selectedRows, onSelectionChange]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!selectable || !onSelectionChange) {
      return;
    }

    const allSelected = selectedRows.length === processedData.length;
    onSelectionChange(allSelected ? [] : processedData);
  }, [selectable, selectedRows, processedData, onSelectionChange]);

  const tableClasses = [
    styles.table,
    styles[`size-${size}`],
    striped && styles.striped,
    hoverable && styles.hoverable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.container}>
      {/* Filtros */}
      {filterable && (
        <div className={styles.filtersRow}>
          {columns.map(column => {
            if (!column.filterable) {
              return null;
            }
            return (
              <div key={String(column.key)} className={styles.filterGroup}>
                <div className={styles.filterInputContainer}>
                  <IoSearch className={styles.filterIcon} />
                  <input
                    type='text'
                    placeholder={`Filtrar ${column.label}...`}
                    value={filterInputs[String(column.key)] || ''}
                    onChange={e => handleFilter(String(column.key), e.target.value)}
                    className={styles.filterInput}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={tableClasses}>
          <thead className={styles.thead}>
            <tr>
              {selectable && (
                <th className={styles.th}>
                  <input
                    type='checkbox'
                    checked={
                      selectedRows.length === processedData.length && processedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className={styles.checkbox}
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={`${styles.th} ${column.align ? styles[`align-${column.align}`] : ''}`}
                  style={{ width: column.width }}
                >
                  <div className={styles.headerContent}>
                    {column.headerRender ? column.headerRender() : column.label}
                    {sortable && column.sortable !== false && (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className={styles.sortButton}
                        type='button'
                      >
                        {localSort?.key === column.key ? (
                          localSort.direction === 'asc' ? (
                            <IoChevronUp className={styles.sortIcon} />
                          ) : (
                            <IoChevronDown className={styles.sortIcon} />
                          )
                        ) : (
                          <div className={styles.sortIconPlaceholder} />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onCreateDocument) && (
                <th className={`${styles.th} ${styles.actionsHeader}`}>Ações</th>
              )}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className={styles.tr}>
                  {selectable && (
                    <td className={styles.td}>
                      <Skeleton width='16px' height='16px' />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={String(column.key)} className={styles.td}>
                      <Skeleton height='20px' />
                    </td>
                  ))}
                  {(onEdit || onDelete || onCreateDocument) && (
                    <td className={styles.td}>
                      <Skeleton width='24px' height='24px' />
                    </td>
                  )}
                </tr>
              ))
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (onEdit || onDelete || onCreateDocument ? 1 : 0)
                  }
                  className={styles.emptyCell}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => (
                <tr
                  key={index}
                  className={`${styles.tr} ${selectedRows.includes(row) ? styles.selected : ''}`}
                  onClick={selectable ? () => handleRowSelection(row) : undefined}
                >
                  {selectable && (
                    <td className={styles.td}>
                      <input
                        type='checkbox'
                        checked={selectedRows.includes(row)}
                        onChange={() => handleRowSelection(row)}
                        className={styles.checkbox}
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      className={`${styles.td} ${column.align ? styles[`align-${column.align}`] : ''}`}
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : String(row[column.key] || '')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onCreateDocument) && (
                    <td className={styles.td}>
                      <div className={styles.actionsMenu}>
                        <button className={styles.actionsButton} type='button'>
                          <IoEllipsisVertical />
                        </button>
                        <div className={styles.actionsDropdown}>
                          {onEdit && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onEdit(row);
                              }}
                              className={styles.actionItem}
                              type='button'
                            >
                              Editar
                            </button>
                          )}
                          {onCreateDocument && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onCreateDocument(row);
                              }}
                              className={styles.actionItem}
                              type='button'
                            >
                              Criar Documento
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onDelete(row);
                              }}
                              className={`${styles.actionItem} ${styles.actionItemDanger}`}
                              type='button'
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagination && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total} itens
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={styles.paginationButton}
              type='button'
            >
              Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className={styles.paginationButton}
              type='button'
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
