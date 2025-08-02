// src/components/ui/Table.tsx
import React, { useMemo, useCallback } from 'react';
import { theme } from '../../styles/theme';

// Tipos para a tabela
export type TableColumn<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
};

export type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
};

// Estilos baseados no theme
const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: theme.colors.background.primary,
  borderRadius: theme.borderRadius.lg,
  overflow: 'hidden',
  boxShadow: theme.shadows.sm,
};

const theadStyles: React.CSSProperties = {
  backgroundColor: theme.colors.background.secondary,
};

const thStyles: React.CSSProperties = {
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  border: `1px solid ${theme.colors.border}`,
  textAlign: 'left',
  fontWeight: theme.fontWeight.semibold,
  fontSize: theme.fontSize.sm,
  color: theme.colors.text.primary,
};

const tdStyles: React.CSSProperties = {
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  border: `1px solid ${theme.colors.border}`,
  fontSize: theme.fontSize.sm,
  color: theme.colors.text.primary,
};

const actionCellStyles: React.CSSProperties = {
  ...tdStyles,
  display: 'flex',
  gap: theme.spacing.sm,
  justifyContent: 'center',
  alignItems: 'center',
};

const emptyStateStyles: React.CSSProperties = {
  ...tdStyles,
  textAlign: 'center',
  padding: `${theme.spacing['2xl']} ${theme.spacing.lg}`,
  color: theme.colors.text.secondary,
  fontStyle: 'italic',
};

// Componente principal da tabela
const Table = React.memo(function Table<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
}: TableProps<T>) {
  const hasActions = useMemo(() => onEdit || onDelete, [onEdit, onDelete]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        Carregando...
      </div>
    );
  }

  return (
    <table style={tableStyles}>
      <thead style={theadStyles}>
        <tr>
          {columns.map((column) => (
            <th
              key={String(column.key)}
              style={{
                ...thStyles,
                textAlign: column.align || 'left',
                width: column.width,
              }}
            >
              {column.label}
            </th>
          ))}
          {hasActions && (
            <th style={{ ...thStyles, textAlign: 'center' }}>Ações</th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + (hasActions ? 1 : 0)}
              style={emptyStateStyles}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <TableRow
              key={item.id}
              item={item}
              columns={columns}
              hasActions={!!hasActions}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </tbody>
    </table>
  );
}) as <T extends { id: number }>(props: TableProps<T>) => React.ReactElement;

// Componente memoizado para linha da tabela
type TableRowProps<T> = {
  item: T;
  columns: TableColumn<T>[];
  hasActions: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
};

const TableRow = React.memo(function TableRow<T>({
  item,
  columns,
  hasActions,
  onEdit,
  onDelete,
}: TableRowProps<T>) {
  return (
    <tr>
      {columns.map((column) => (
        <td
          key={String(column.key)}
          style={{
            ...tdStyles,
            textAlign: column.align || 'left',
          }}
        >
          {column.render
            ? column.render(item[column.key], item)
            : String(item[column.key] || '')}
        </td>
      ))}
      {hasActions && (
        <td style={actionCellStyles}>
          <ActionButtons
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </td>
      )}
    </tr>
  );
}) as <T>(props: TableRowProps<T>) => React.ReactElement;

// Componente separado para botões de ação
type ActionButtonsProps<T> = {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
};

const ActionButtons = React.memo(function ActionButtons<T>({ item, onEdit, onDelete }: ActionButtonsProps<T>) {
  const handleEdit = useCallback(() => {
    onEdit?.(item);
  }, [onEdit, item]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      onDelete?.(item);
    }
  }, [onDelete, item]);
  return (
    <>
      {onEdit && (
        <button
          onClick={handleEdit}
          style={{
            backgroundColor: theme.colors.primary,
            color: 'white',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.medium,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor =
              theme.colors.primaryHover;
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor =
              theme.colors.primary;
          }}
        >
          Editar
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          style={{
            backgroundColor: theme.colors.danger,
            color: 'white',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.medium,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor =
              theme.colors.dangerHover;
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor =
              theme.colors.danger;
          }}
        >
          Excluir
        </button>
      )}
    </>
  );
}) as <T>(props: ActionButtonsProps<T>) => React.ReactElement;

export default Table;
