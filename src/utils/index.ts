// src/utils/index.ts

// Date and formatting utilities
export * from './dateUtils';
export * from './orgaoUtils';
export * from './statusUtils';
export * from './documentStatusUtils';

// Validation and type checking
export * from './validation';

// Helper functions
export * from './documentoHelpers';
export * from './enderecamentoUtils';
export * from './destinatarioEndereçamentoUtils';

// Search and filtering
export * from './providerDemandUtils';

// Storage and caching
export * from './storage';
export * from './cache';

// Performance and optimization
export * from './lazyLoading';

// DOM utilities
export * from './domUtils';

// Development and quality
export * from './documentation';

// Logging system
export * from './logger';

// Explicit exports to resolve conflicts
// Formatters
export {
  removeAccents as formatRemoveAccents,
  formatDate,
  formatDateTime,
  capitalize,
  truncateText,
  formatFileSize as formattersFormatFileSize,
  formatSged,
  generateTempId,
} from './formatters';

// Search utilities
export {
  removeAccents as searchRemoveAccents,
  matchesAdvancedSearch,
  filterWithAdvancedSearch,
} from './searchUtils';

// Validators
export {
  hasMinLength as validatorHasMinLength,
  hasMaxLength as validatorHasMaxLength,
  isRequired,
  isValidEmail,
  isValidNumber,
  isValidDate,
  isNotFutureDate,
  isValidSged,
  isValidPhoneNumber,
  isValidCep,
  createValidator,
  validationRules,
} from './validators';

// Type guards
export {
  isArray as typeGuardIsArray,
  hasMinLength as typeGuardHasMinLength,
  hasMaxLength as typeGuardHasMaxLength,
  isString as typeGuardIsString,
  isNumber as typeGuardIsNumber,
  isBoolean as typeGuardIsBoolean,
  isObject as typeGuardIsObject,
  isFunction as typeGuardIsFunction,
  isDate as typeGuardIsDate,
  isPromise,
  isDefined as typeGuardIsDefined,
  isNotNull as typeGuardIsNotNull,
  isNotNullish,
  isNonEmptyString,
  isEmail as typeGuardIsEmail,
  isCNPJ,
  isPhoneNumber as typeGuardIsPhoneNumber,
  isUrl as typeGuardIsUrl,
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  isInRange,
  isNonEmptyArray,
  hasLength,
  hasProperty,
  hasPropertyOfType,
  isValidId,
  isValidStatus,
  isValidPriority,
  isValidDateString,
  isDateInFuture,
  isDateInPast,
  isFile,
  hasFileExtension,
  isFileSizeValid,
  isFormValid,
  isApiResponse,
  isPaginatedResponse,
  createZodGuard,
  isError as typeGuardIsError,
  isApiError,
  isReactElement,
  isComponent,
  typeGuards,
} from './typeGuards';

// Helpers
export {
  debounce as helperDebounce,
  generateId as helperGenerateId,
  searchItems,
  sortItems,
  deepClone,
  isEmpty,
  safeGet,
  delay,
  retry,
} from './helpers';

// Code quality utilities
export {
  AppError,
  success,
  failure,
  safeAsync,
  isNotNull,
  isNotUndefined,
  isDefined as codeQualityIsDefined,
  isString as codeQualityIsString,
  isNumber as codeQualityIsNumber,
  isBoolean as codeQualityIsBoolean,
  isArray as codeQualityIsArray,
  isObject as codeQualityIsObject,
  assertNever,
  updateObject,
  updateArray,
  removeFromArray,
  pipe,
  compose,
  debounce as codeQualityDebounce,
  throttle,
  retryWithBackoff,
  memoize,
  deepEqual,
  generateId as codeQualityGenerateId,
  createSlug,
  formatFileSize as codeQualityFormatFileSize,
  formatRelativeTime,
  isDevelopment,
  isProduction,
  isTest,
  devLog,
  devWarn,
  devError,
  measurePerformance,
} from './codeQuality';
