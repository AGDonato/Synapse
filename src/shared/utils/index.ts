/**
 * ÍNDICE CENTRAL DE UTILITÁRIOS
 *
 * Este arquivo centraliza e exporta todos os utilitários disponíveis no sistema.
 * Organizado por categorias funcionais para facilitar importação e uso.
 */

// Utilitários de data e formatação
export * from './dateUtils';
export * from './orgaoUtils';
export * from './statusUtils';
export * from './documentStatusUtils';

// Validação e verificação de tipos
export * from './validation';

// Funções auxiliares
export * from './documentoHelpers';
export * from './enderecamentoUtils';
export * from './destinatarioEndereçamentoUtils';

// Busca e filtragem
export * from './providerDemandUtils';

// [Arquivos de cache removidos - não utilizados]

// Performance e otimização
export * from './lazyLoading';

// Utilitários DOM
export * from './domUtils';

// [Arquivo de documentação removido - não utilizado]

// Sistema de logging
export * from './logger';

// Exports explícitos para resolver conflitos
// Formatadores
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

// Utilitários de busca
export {
  removeAccents as searchRemoveAccents,
  matchesAdvancedSearch,
  filterWithAdvancedSearch,
} from './searchUtils';

// Validadores (consolidados em validation.ts)
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
} from './validation';

// Guardas de tipo
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

// Auxiliares
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

// Utilitários de qualidade de código
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
