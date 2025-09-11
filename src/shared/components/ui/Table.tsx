// src/components/ui/Table.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { IoDocumentTextOutline, IoTrashOutline } from 'react-icons/io5';
import { RefreshCw } from 'lucide-react';
import { LiaEdit } from 'react-icons/lia';
import styles from './Table.module.css';

// Tipos para a tabela
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  customSort?: (a: T, b: T, direction: 'asc' | 'desc') => number;
}

export type SortConfig<T> = {
  key: keyof T;
  direction: 'asc' | 'desc';
} | null;

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreateDocument?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  editIcon?: 'refresh' | 'edit';
}

// Estilos baseados no theme
const tableStyles: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#ffffff',
  borderCollapse: 'separate',
  borderSpacing: 0,
  margin: 0, // Remove margem para encaixar perfeitamente no container
};

const theadStyles: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
};

const thStyles: React.CSSProperties = {
  padding: `${'0.75rem'} ${'1rem'}`,
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  border: 'none',
};

const tdStyles: React.CSSProperties = {
  padding: `${'0.75rem'} ${'1rem'}`,
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  borderBottom: `1px solid var(--color-neutral-200)`,
};

const actionCellStyles: React.CSSProperties = {
  ...tdStyles,
  textAlign: 'center',
  verticalAlign: 'middle',
  width: '1%',
  whiteSpace: 'nowrap',
};

const emptyStateStyles: React.CSSProperties = {
  ...tdStyles,
  textAlign: 'center',
  padding: `${'1.5rem'} ${'1rem'}`,
  color: 'var(--text-secondary)',
  fontStyle: 'italic',
};

// Componente principal da tabela
const Table = React.memo(function Table<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  onCreateDocument,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  editIcon = 'refresh',
}: TableProps<T>) {
  const hasActions = useMemo(
    () => onEdit || onDelete || onCreateDocument,
    [onEdit, onDelete, onCreateDocument]
  );
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);

  // Função para ordenar os dados
  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }

    const column = columns.find(col => col.key === sortConfig.key);

    return [...data].sort((a, b) => {
      // Use custom sort if available
      if (column?.customSort) {
        return column.customSort(a, b, sortConfig.direction);
      }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) {
        return 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      let comparison = 0;

      // Comparação para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      // Comparação para strings (case insensitive)
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      }
      // Comparação genérica
      else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sortConfig, columns]);

  // Função para lidar com clique no cabeçalho
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Remove ordenação
        }
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Função para renderizar ícone de ordenação
  const getSortIcon = useCallback(
    (key: keyof T) => {
      if (!sortConfig || sortConfig.key !== key) {
        return (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='12'
            height='12'
            fill='currentColor'
            viewBox='0 0 16 16'
            style={{ opacity: 0.3, marginLeft: '4px' }}
          >
            <path d='M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z' />
            <path d='M8 15a.5.5 0 0 1-.5-.5V2.707L4.354 5.854a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L8.5 2.707V14.5A.5.5 0 0 1 8 15z' />
          </svg>
        );
      }

      return sortConfig.direction === 'asc' ? (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          fill='currentColor'
          viewBox='0 0 16 16'
          style={{ marginLeft: '4px' }}
        >
          <path d='m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z' />
        </svg>
      ) : (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          fill='currentColor'
          viewBox='0 0 16 16'
          style={{ marginLeft: '4px' }}
        >
          <path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z' />
        </svg>
      );
    },
    [sortConfig]
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>;
  }

  return (
    <table
      style={{
        ...tableStyles,
        width: '100%',
        position: 'relative',
      }}
    >
      <thead
        style={{
          ...theadStyles,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <tr>
          {columns.map(column => (
            <th
              key={String(column.key)}
              style={{
                ...thStyles,
                textAlign: column.align || 'left',
                width: column.width,
                backgroundColor: 'var(--bg-secondary)',
                cursor: column.sortable !== false ? 'pointer' : 'default',
                userSelect: 'none',
                transition: 'background-color 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onClick={() => column.sortable !== false && handleSort(column.key)}
              onMouseOver={e => {
                if (column.sortable !== false) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)';
                }
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-secondary)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    column.align === 'center'
                      ? 'center'
                      : column.align === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                }}
              >
                {column.label}
                {column.sortable !== false && getSortIcon(column.key)}
              </div>
            </th>
          ))}
          {hasActions && (
            <th
              style={{
                ...thStyles,
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: 'var(--shadow-sm)',
                width: '1%',
                whiteSpace: 'nowrap',
              }}
            >
              Ações
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {sortedData.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (hasActions ? 1 : 0)} style={emptyStateStyles}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          sortedData.map(item => (
            <TableRow
              key={item.id}
              item={item}
              columns={columns}
              hasActions={!!hasActions}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateDocument={onCreateDocument}
              editIcon={editIcon}
            />
          ))
        )}
      </tbody>
    </table>
  );
}) as <T extends { id: number }>(props: TableProps<T>) => React.ReactElement;

// Componente memoizado para linha da tabela
interface TableRowProps<T> {
  item: T;
  columns: TableColumn<T>[];
  hasActions: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreateDocument?: (item: T) => void;
  editIcon?: 'refresh' | 'edit';
}

const TableRow = React.memo(function TableRow<T>({
  item,
  columns,
  hasActions,
  onEdit,
  onDelete,
  onCreateDocument,
  editIcon,
}: TableRowProps<T>) {
  return (
    <tr>
      {columns.map(column => (
        <td
          key={String(column.key)}
          style={{
            ...tdStyles,
            textAlign: column.align || 'left',
          }}
        >
          {column.render ? column.render(item[column.key], item) : String(item[column.key] || '')}
        </td>
      ))}
      {hasActions && (
        <td style={actionCellStyles}>
          <ActionButtons
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateDocument={onCreateDocument}
            editIcon={editIcon}
          />
        </td>
      )}
    </tr>
  );
}) as <T>(props: TableRowProps<T>) => React.ReactElement;

// Componente separado para botões de ação
interface ActionButtonsProps<T> {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreateDocument?: (item: T) => void;
  editIcon?: 'refresh' | 'edit';
}

const ActionButtons = React.memo(function ActionButtons<T>({
  item,
  onEdit,
  onDelete,
  onCreateDocument,
  editIcon = 'refresh',
}: ActionButtonsProps<T>) {
  const handleEdit = useCallback(() => {
    onEdit?.(item);
  }, [onEdit, item]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      onDelete?.(item);
    }
  }, [onDelete, item]);

  const handleCreateDocument = useCallback(() => {
    onCreateDocument?.(item);
  }, [onCreateDocument, item]);
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '0.5rem',
        alignItems: 'center',
      }}
    >
      {onCreateDocument && (
        <button
          onClick={handleCreateDocument}
          title='Criar Documento'
          tabIndex={-1}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '36px',
            height: '36px',
            color: 'var(--interactive-primary)',
          }}
          onMouseOver={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'var(--color-brand-100)';
            btn.style.color = 'var(--interactive-primary-hover)';
            btn.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'none';
            btn.style.color = 'var(--interactive-primary)';
            btn.style.transform = 'none';
          }}
        >
          <IoDocumentTextOutline size={20} />
        </button>
      )}
      {onEdit && (
        <button
          onClick={handleEdit}
          title={editIcon === 'edit' ? 'Editar' : 'Atualizar'}
          tabIndex={-1}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '36px',
            height: '36px',
            color: editIcon === 'edit' ? 'var(--color-warning-500)' : 'var(--color-success-600)',
          }}
          onMouseOver={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            if (editIcon === 'edit') {
              btn.style.background = 'var(--color-warning-50)';
              btn.style.color = 'var(--color-warning-600)';
            } else {
              btn.style.background = 'var(--color-success-50)';
              btn.style.color = 'var(--color-success-700)';
            }
            btn.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'none';
            btn.style.color =
              editIcon === 'edit' ? 'var(--color-warning-500)' : 'var(--color-success-600)';
            btn.style.transform = 'none';
          }}
        >
          {editIcon === 'edit' ? <LiaEdit size={20} /> : <RefreshCw size={20} />}
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          title='Excluir'
          tabIndex={-1}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '36px',
            height: '36px',
            color: 'var(--color-error-600)',
          }}
          onMouseOver={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'var(--color-error-50)';
            btn.style.color = 'var(--color-error-600)';
            btn.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'none';
            btn.style.color = 'var(--color-error-600)';
            btn.style.transform = 'none';
          }}
        >
          <IoTrashOutline size={20} />
        </button>
      )}
    </div>
  );
}) as <T>(props: ActionButtonsProps<T>) => React.ReactElement;

export default Table;
