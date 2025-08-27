/**
 * Configuração de Convenções de Nomenclatura
 * Define padrões consistentes para nomes de arquivos, variáveis, funções, etc.
 */

// ============================================================================
// CONVENÇÕES DE ARQUIVOS E DIRETÓRIOS
// ============================================================================

export const fileNamingConventions = {
  // Componentes React - PascalCase
  components: {
    pattern: 'PascalCase',
    examples: ['Button.tsx', 'DataTable.tsx', 'UserProfile.tsx'],
    description: 'Componentes React devem usar PascalCase',
  },

  // Hooks customizados - camelCase começando com "use"
  hooks: {
    pattern: 'useCamelCase',
    examples: ['useAuth.ts', 'useApiData.ts', 'useLocalStorage.ts'],
    description: 'Hooks customizados devem começar com "use" seguido de camelCase',
  },

  // Utilitários e helpers - camelCase
  utilities: {
    pattern: 'camelCase',
    examples: ['dateUtils.ts', 'stringHelpers.ts', 'apiClient.ts'],
    description: 'Arquivos de utilitários devem usar camelCase',
  },

  // Stores Zustand - camelCase + "Store"
  stores: {
    pattern: 'camelCaseStore',
    examples: ['userStore.ts', 'demandasStore.ts', 'documentosStore.ts'],
    description: 'Stores devem terminar com "Store" em camelCase',
  },

  // Tipos e interfaces - camelCase
  types: {
    pattern: 'camelCase',
    examples: ['userTypes.ts', 'apiTypes.ts', 'entityTypes.ts'],
    description: 'Arquivos de tipos devem usar camelCase',
  },

  // Services - camelCase + "Service"
  services: {
    pattern: 'camelCaseService',
    examples: ['authService.ts', 'apiService.ts', 'emailService.ts'],
    description: 'Services devem terminar com "Service" em camelCase',
  },

  // Páginas - PascalCase + "Page"
  pages: {
    pattern: 'PascalCasePage',
    examples: ['HomePage.tsx', 'LoginPage.tsx', 'UserProfilePage.tsx'],
    description: 'Páginas devem terminar com "Page" em PascalCase',
  },

  // Testes - mesmo nome + ".test" ou ".spec"
  tests: {
    pattern: 'sameName.test',
    examples: ['Button.test.tsx', 'useAuth.test.ts', 'apiService.spec.ts'],
    description: 'Testes devem usar o mesmo nome do arquivo testado + .test ou .spec',
  },

  // Constantes - SCREAMING_SNAKE_CASE
  constants: {
    pattern: 'SCREAMING_SNAKE_CASE',
    examples: ['API_ENDPOINTS.ts', 'ERROR_MESSAGES.ts', 'DEFAULT_VALUES.ts'],
    description: 'Arquivos de constantes devem usar SCREAMING_SNAKE_CASE',
  },
} as const;

// ============================================================================
// CONVENÇÕES DE VARIÁVEIS E FUNÇÕES
// ============================================================================

export const variableNamingConventions = {
  // Variáveis locais - camelCase
  localVariables: {
    pattern: 'camelCase',
    examples: ['userName', 'totalCount', 'isLoading'],
    description: 'Variáveis locais devem usar camelCase',
  },

  // Constantes globais - SCREAMING_SNAKE_CASE
  globalConstants: {
    pattern: 'SCREAMING_SNAKE_CASE',
    examples: ['API_BASE_URL', 'MAX_RETRY_ATTEMPTS', 'DEFAULT_PAGE_SIZE'],
    description: 'Constantes globais devem usar SCREAMING_SNAKE_CASE',
  },

  // Funções - camelCase, verbos descritivos
  functions: {
    pattern: 'verbCamelCase',
    examples: ['getUserById', 'validateEmail', 'formatCurrency'],
    description: 'Funções devem começar com verbo em camelCase',
  },

  // Event handlers - "handle" + ação
  eventHandlers: {
    pattern: 'handleCamelCase',
    examples: ['handleSubmit', 'handleInputChange', 'handleModalClose'],
    description: 'Event handlers devem começar com "handle"',
  },

  // Boolean variables - is/has/can/should + descrição
  booleans: {
    pattern: 'isHasCanShouldCamelCase',
    examples: ['isLoading', 'hasPermission', 'canEdit', 'shouldRender'],
    description: 'Variáveis boolean devem usar prefixos descritivos',
  },

  // Componentes React props - camelCase
  props: {
    pattern: 'camelCase',
    examples: ['className', 'isDisabled', 'onSubmit', 'children'],
    description: 'Props de componentes devem usar camelCase',
  },

  // CSS classes - kebab-case
  cssClasses: {
    pattern: 'kebab-case',
    examples: ['primary-button', 'modal-content', 'form-input'],
    description: 'Classes CSS devem usar kebab-case',
  },

  // CSS modules - camelCase
  cssModules: {
    pattern: 'camelCase',
    examples: ['primaryButton', 'modalContent', 'formInput'],
    description: 'CSS modules devem usar camelCase',
  },
} as const;

// ============================================================================
// CONVENÇÕES DE TIPOS E INTERFACES
// ============================================================================

export const typeNamingConventions = {
  // Interfaces - PascalCase, sem prefixo "I"
  interfaces: {
    pattern: 'PascalCase',
    examples: ['User', 'ApiResponse', 'FormData'],
    description: 'Interfaces devem usar PascalCase sem prefixo "I"',
  },

  // Types - PascalCase
  types: {
    pattern: 'PascalCase',
    examples: ['Status', 'Theme', 'SortDirection'],
    description: 'Types devem usar PascalCase',
  },

  // Enums - PascalCase
  enums: {
    pattern: 'PascalCase',
    examples: ['UserRole', 'RequestStatus', 'SortDirection'],
    description: 'Enums devem usar PascalCase',
  },

  // Enum values - SCREAMING_SNAKE_CASE
  enumValues: {
    pattern: 'SCREAMING_SNAKE_CASE',
    examples: ['ADMIN_USER', 'PENDING_APPROVAL', 'ASCENDING_ORDER'],
    description: 'Valores de enum devem usar SCREAMING_SNAKE_CASE',
  },

  // Generic type parameters - single letter maiúscula
  generics: {
    pattern: 'T, U, V, K',
    examples: ['<T>', '<T extends User>', '<K extends keyof T>'],
    description: 'Parâmetros de tipo genérico devem usar letras maiúsculas',
  },

  // Props interfaces - ComponentName + Props
  propsInterfaces: {
    pattern: 'ComponentNameProps',
    examples: ['ButtonProps', 'ModalProps', 'FormInputProps'],
    description: 'Interfaces de props devem terminar com "Props"',
  },
} as const;

// ============================================================================
// CONVENÇÕES DE COMPONENTES REACT
// ============================================================================

export const componentNamingConventions = {
  // Componentes - PascalCase
  components: {
    pattern: 'PascalCase',
    examples: ['Button', 'UserProfile', 'DataTable'],
    description: 'Componentes React devem usar PascalCase',
  },

  // Higher-Order Components - with + ComponentName
  hoc: {
    pattern: 'withComponentName',
    examples: ['withAuth', 'withLoading', 'withErrorBoundary'],
    description: 'HOCs devem começar com "with"',
  },

  // Render props - render + Função
  renderProps: {
    pattern: 'renderFunction',
    examples: ['renderHeader', 'renderContent', 'renderError'],
    description: 'Render props devem começar com "render"',
  },

  // Context providers - ComponentName + Provider
  providers: {
    pattern: 'ComponentNameProvider',
    examples: ['AuthProvider', 'ThemeProvider', 'UserProvider'],
    description: 'Context providers devem terminar com "Provider"',
  },

  // Context hooks - use + ContextName
  contextHooks: {
    pattern: 'useContextName',
    examples: ['useAuth', 'useTheme', 'useUser'],
    description: 'Hooks de contexto devem começar com "use"',
  },
} as const;

// ============================================================================
// CONVENÇÕES DE API E BACKEND
// ============================================================================

export const apiNamingConventions = {
  // Endpoints - kebab-case
  endpoints: {
    pattern: 'kebab-case',
    examples: ['/api/users', '/api/user-profile', '/api/document-types'],
    description: 'Endpoints de API devem usar kebab-case',
  },

  // Query parameters - snake_case (padrão backend)
  queryParams: {
    pattern: 'snake_case',
    examples: ['user_id', 'page_size', 'sort_by'],
    description: 'Query parameters devem usar snake_case',
  },

  // JSON fields - snake_case (padrão backend)
  jsonFields: {
    pattern: 'snake_case',
    examples: ['user_name', 'created_at', 'is_active'],
    description: 'Campos JSON devem usar snake_case',
  },

  // HTTP methods - UPPERCASE
  httpMethods: {
    pattern: 'UPPERCASE',
    examples: ['GET', 'POST', 'PUT', 'DELETE'],
    description: 'Métodos HTTP devem usar UPPERCASE',
  },
} as const;

// ============================================================================
// CONVENÇÕES DE COMMITS E BRANCHES
// ============================================================================

export const gitNamingConventions = {
  // Commits - conventional commits
  commits: {
    pattern: 'type(scope): description',
    examples: [
      'feat(auth): add login functionality',
      'fix(ui): resolve button alignment issue',
      'docs(readme): update installation guide',
    ],
    types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    description: 'Commits devem seguir o padrão conventional commits',
  },

  // Branches - kebab-case
  branches: {
    pattern: 'type/kebab-case-description',
    examples: [
      'feature/user-authentication',
      'bugfix/modal-close-issue',
      'hotfix/security-vulnerability',
    ],
    types: ['feature', 'bugfix', 'hotfix', 'release', 'chore'],
    description: 'Branches devem usar kebab-case com prefixo de tipo',
  },
} as const;

// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

export const namingValidators = {
  // Valida se um nome segue PascalCase
  isPascalCase: (name: string): boolean => {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  },

  // Valida se um nome segue camelCase
  isCamelCase: (name: string): boolean => {
    return /^[a-z][a-zA-Z0-9]*$/.test(name);
  },

  // Valida se um nome segue kebab-case
  isKebabCase: (name: string): boolean => {
    return /^[a-z][a-z0-9-]*$/.test(name);
  },

  // Valida se um nome segue snake_case
  isSnakeCase: (name: string): boolean => {
    return /^[a-z][a-z0-9_]*$/.test(name);
  },

  // Valida se um nome segue SCREAMING_SNAKE_CASE
  isScreamingSnakeCase: (name: string): boolean => {
    return /^[A-Z][A-Z0-9_]*$/.test(name);
  },

  // Valida se é um nome de hook válido
  isValidHookName: (name: string): boolean => {
    return /^use[A-Z][a-zA-Z0-9]*$/.test(name);
  },

  // Valida se é um nome de componente válido
  isValidComponentName: (name: string): boolean => {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  },

  // Valida se é um nome de evento handler válido
  isValidEventHandler: (name: string): boolean => {
    return /^handle[A-Z][a-zA-Z0-9]*$/.test(name);
  },
} as const;

// ============================================================================
// HELPERS DE CONVERSÃO
// ============================================================================

export const namingConverters = {
  // Converte para camelCase
  toCamelCase: (str: string): string => {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[A-Z]/, char => char.toLowerCase());
  },

  // Converte para PascalCase
  toPascalCase: (str: string): string => {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[a-z]/, char => char.toUpperCase());
  },

  // Converte para kebab-case
  toKebabCase: (str: string): string => {
    return str
      .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      .replace(/^-/, '')
      .replace(/[-_\s]+/g, '-');
  },

  // Converte para snake_case
  toSnakeCase: (str: string): string => {
    return str
      .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[-_\s]+/g, '_');
  },

  // Converte para SCREAMING_SNAKE_CASE
  toScreamingSnakeCase: (str: string): string => {
    return str
      .replace(/[A-Z]/g, letter => `_${letter}`)
      .replace(/^_/, '')
      .replace(/[-_\s]+/g, '_')
      .toUpperCase();
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO CENTRAL
// ============================================================================

export const namingConventions = {
  files: fileNamingConventions,
  variables: variableNamingConventions,
  types: typeNamingConventions,
  components: componentNamingConventions,
  api: apiNamingConventions,
  git: gitNamingConventions,
  validators: namingValidators,
  converters: namingConverters,
} as const;

export default namingConventions;

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/*
// Exemplo de uso dos validadores
import { namingValidators } from './namingConventions';

const componentName = 'UserProfile';
if (!namingValidators.isValidComponentName(componentName)) {
  logger.error('Nome de componente inválido');
}

// Exemplo de uso dos conversores
import { namingConverters } from './namingConventions';

const kebabCase = namingConverters.toKebabCase('UserProfile'); // 'user-profile'
const snakeCase = namingConverters.toSnakeCase('UserProfile'); // 'user_profile'
*/