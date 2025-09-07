// src/hooks/index.ts

// Base hooks
export { useCrud, type UseCrudConfig, type UseCrudReturn } from './useCrud';
export {
  useValidatedCrud,
  type UseValidatedCrudConfig,
  type UseValidatedCrudReturn,
} from './useValidatedCrud';
export { useFormValidation, type UseFormValidationReturn } from './useFormValidation';
export {
  useErrorHandler,
  type UseErrorHandlerReturn,
  AppError,
  ValidationError,
  NetworkError,
  NotFoundError,
} from './useErrorHandler';

// Performance hooks
export { useDebounce } from './useDebounce';

// Service layer hooks
// Removed useService and useOrgaos - missing repository dependencies

// Storage hooks
export { useLocalStorage } from './useLocalStorage';
export {
  useEntityCache,
  type UseEntityCacheOptions,
  type UseEntityCacheReturn,
} from './useEntityCache';
export { useUserPreferences } from './useUserPreferences';
