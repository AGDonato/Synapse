// Barrel exports for UI components

// Error handling
export { ErrorBoundary } from './ErrorBoundary';
export { default as ErrorFallback } from './ErrorFallback';

// Loading and skeleton components
export { default as Skeleton } from './Skeleton';
export { QuickManagementSkeleton } from './Skeleton/QuickManagementSkeleton';
export { StatisticsSkeleton } from './Skeleton/StatisticsSkeleton';
export { default as Loading } from './Loading';
export {
  LazyLoader,
  createLazyComponent,
  PageSkeleton,
  TableSkeleton,
  ChartSkeleton,
} from './LazyLoader';

// Form components
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as TextArea } from './TextArea';
export { default as Form } from './Form';

// Mobile-optimized components
export { MobileTable } from './MobileTable';
export {
  MobileForm,
  MobileFormGroup,
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobileButton,
  MobileButtonGroup,
} from './MobileForm';

// Table components
export { DataTable } from './DataTable';
export { default as Table } from './Table';

// Interactive components
export { DateRangePicker } from './DateRangePicker';
export { GlobalSearch } from './GlobalSearch';
export { NotificationCenter } from './NotificationCenter';
export { ServiceWorkerStatus } from './ServiceWorkerStatus';
export { SavedFiltersPanel } from './SavedFilters';
export { KeyboardShortcutsHelper } from './KeyboardShortcutsHelper';
export { StickyYearFilter } from './StickyYearFilter';

// Display components
export { default as StatusBadge } from './StatusBadge';
export { default as Icon } from './Icon';
export { default as Modal } from './Modal';
export { default as Toast } from './Toast';
export {
  SmartLink,
  DemandasLink,
  DocumentosLink,
  HomeLink,
  CadastrosLink,
  RelatoriosLink,
} from './SmartLink';

// Memoized components for performance
export {
  MemoizedDemandaRow,
  MemoizedFilterDropdown,
  MemoizedPagination,
  MemoizedSearchInput,
} from './MemoizedComponents';

// Type exports
export type * from './DataTable/types';
