// Types for the advanced DataTable component
export interface Column<T = unknown> {
  key: keyof T;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export type FilterConfig = Record<string, string | string[]>;

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface DataTableProps<T = unknown> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCreateDocument?: (row: T) => void;

  // Advanced features
  sortable?: boolean;
  filterable?: boolean;
  pagination?: PaginationConfig;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (config: SortConfig) => void;
  onFilter?: (filters: FilterConfig) => void;

  // Selection
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;

  // Styling
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
  hoverable?: boolean;
}
