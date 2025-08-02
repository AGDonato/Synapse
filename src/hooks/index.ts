// src/hooks/index.ts

// Base hooks
export { useCrud, type UseCrudConfig, type UseCrudReturn } from './useCrud';
export { useValidatedCrud, type UseValidatedCrudConfig, type UseValidatedCrudReturn } from './useValidatedCrud';
export { useFormValidation, type UseFormValidationReturn } from './useFormValidation';
export { useErrorHandler, type UseErrorHandlerReturn, AppError, ValidationError, NetworkError, NotFoundError } from './useErrorHandler';

// Performance hooks
export { useDebounce } from './useDebounce';
export { useVirtualization, type VirtualizationOptions, type VirtualizationResult } from './useVirtualization';

// Service layer hooks
export { useService, type UseServiceConfig, type UseServiceReturn } from './useService';
export { useAssuntos, type UseAssuntosReturn } from './useAssuntos';
export { useOrgaos, type UseOrgaosReturn } from './useOrgaos';

// Storage hooks
export { useLocalStorage } from './useLocalStorage';
export { useEntityCache, type UseEntityCacheOptions, type UseEntityCacheReturn } from './useEntityCache';
export { useOfflineSync, type UseOfflineSyncReturn, type OfflineOperation } from './useOfflineSync';
export { useUserPreferences } from './useUserPreferences';