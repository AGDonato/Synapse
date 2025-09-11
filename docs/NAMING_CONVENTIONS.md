# Naming Conventions - Synapse Project

Este documento estabelece as convenções de nomenclatura para o projeto Synapse, garantindo consistência e clareza no código.

## 🎯 Princípios Gerais

### Idiomas
- **Código**: Inglês (variáveis, funções, componentes, etc.)
- **Comentários**: Português
- **Tipos de Domínio**: Português (ex: `Demanda`, `Documento`)
- **UI/Labels**: Português
- **Mensagens de erro**: Português

### Clareza e Consistência
- Nomes descritivos e sem abreviações desnecessárias
- Consistência entre arquivos similares
- Prefixos e sufixos padronizados

## 📁 Arquivos e Diretórios

### Estrutura de Diretórios (Arquitetura Consolidada)
```
📁 Projeto Synapse (255 arquivos TypeScript/TSX)
├── docs/                    # 📚 Documentação técnica completa
├── src/
│   ├── app/                 # 🏠 Núcleo da aplicação
│   │   ├── contexts/        # React contexts (AuthContext)
│   │   ├── router/          # Configuração de rotas + lazy loading
│   │   ├── stores/          # Zustand stores com cache TTL
│   │   ├── App.tsx          # Componente raiz
│   │   └── main.tsx         # Ponto de entrada
│   ├── shared/              # 🔄 Recursos compartilhados
│   │   ├── components/      # 77 componentes reutilizáveis
│   │   │   ├── auth/       # Sistema de autenticação
│   │   │   ├── charts/     # 19 gráficos ECharts
│   │   │   ├── demands/    # Componentes de demandas
│   │   │   ├── documents/  # Componentes de documentos
│   │   │   ├── forms/      # Sistema de formulários
│   │   │   ├── layout/     # Header/Sidebar responsivos
│   │   │   └── ui/         # Elementos básicos
│   │   ├── hooks/          # Custom hooks e utilitários
│   │   ├── services/       # Serviços, APIs e integrações
│   │   ├── utils/          # Funções utilitárias
│   │   ├── types/          # 5 arquivos de definições TypeScript
│   │   ├── data/           # Mock data (16 entidades exportadas)
│   │   └── styles/         # Design system + tokens
│   ├── pages/              # 📄 Páginas por feature (45 páginas TSX)
│   │   ├── dashboard/      # Dashboard com gráficos
│   │   ├── demandas/       # Gestão de demandas
│   │   ├── documentos/     # Gestão de documentos
│   │   ├── cadastros/      # Cadastros administrativos
│   │   └── configuracoes/  # Configurações
└── .github/                # CI/CD e templates
```

### Nomes de Arquivos

#### Components
- **PascalCase**: `UserProfile.tsx`
- **Sufixos específicos**: 
  - `Modal.tsx` para modais
  - `Form.tsx` para formulários
  - `Card.tsx` para cards
  - `List.tsx` para listas

#### Hooks
- **camelCase**: `useUserData.ts`
- **Prefixo obrigatório**: `use`

#### Services
- **PascalCase**: `AuthService.ts`
- **Sufixo obrigatório**: `Service`

#### Utils
- **camelCase**: `dateHelpers.ts`
- **Sufixos descritivos**: `Helpers.ts`, `Utils.ts`

#### Types
- **camelCase**: `userTypes.ts`
- **Sufixo**: `Types.ts` ou `Interfaces.ts`

## 🔧 Code Elements

### Variáveis e Funções
```typescript
// ✅ Bom - camelCase, descritivo
const userAccountData = {...};
const fetchUserProfile = async () => {...};

// ❌ Evitar - abreviações, nomes genéricos
const usrAcctData = {...};
const getData = async () => {...};
```

### Constantes
```typescript
// ✅ Bom - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// ❌ Evitar
const apiUrl = 'https://api.example.com';
const maxRetries = 3;
```

### Componentes React
```typescript
// ✅ Bom - PascalCase, nome do arquivo
export const UserProfileCard: React.FC<Props> = () => {
  return <div>...</div>;
};

// ❌ Evitar - nome diferente do arquivo
export const ProfileComponent: React.FC<Props> = () => {
  return <div>...</div>;
};
```

### Hooks Customizados
```typescript
// ✅ Bom - prefixo 'use', camelCase
export const useUserAuthentication = () => {
  // ...
};

export const useOptimizedDataFetching = () => {
  // ...
};

// ❌ Evitar - sem prefixo 'use'
export const userAuth = () => {
  // ...
};
```

### Tipos e Interfaces
```typescript
// ✅ Bom - PascalCase, descritivo
interface UserProfile {
  id: number;
  email: string;
  displayName: string;
}

type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

// ✅ Para tipos de domínio - português OK
interface Demanda {
  id: number;
  sged: string;
  tipoDemanda: string;
}
```

### Enums
```typescript
// ✅ Bom - PascalCase para enum e valores
enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

// ✅ Para domínio - português OK
enum StatusDemanda {
  EmAndamento = 'EM_ANDAMENTO',
  Finalizada = 'FINALIZADA',
  Aguardando = 'AGUARDANDO'
}
```

## 🎨 CSS e Styling

### Classes CSS (CSS Modules)
```css
/* ✅ Bom - kebab-case */
.user-profile-card {
  padding: 1rem;
}

.form-input-error {
  border-color: red;
}

/* ❌ Evitar - camelCase em CSS */
.userProfileCard {
  padding: 1rem;
}
```

### CSS Custom Properties
```css
/* ✅ Bom - kebab-case com prefixo */
:root {
  --primary-color: #007bff;
  --text-color-primary: #333;
  --spacing-large: 2rem;
}
```

## 🗃️ Database/API Relacionado

### Campos de API
```typescript
// ✅ Backend Node.js - camelCase (Prisma)
interface ApiDemanda {
  createdAt: string;
  updatedAt: string;
  tipoDemanda: string;
}

// ✅ Frontend - camelCase (direta)
interface Demanda {
  createdAt: Date;
  updatedAt: Date;
  tipoDemanda: string;
}
```

## 🧪 Testes

### Arquivos de Teste
```
UserProfile.test.tsx
useUserData.test.ts
authService.test.ts
```

### Describe Blocks
```typescript
describe('UserProfile Component', () => {
  describe('when user is authenticated', () => {
    it('should display user information', () => {
      // test implementation
    });
  });
});
```

## 📊 Eventos e Handlers

### Event Handlers
```typescript
// ✅ Bom - prefixo 'handle'
const handleUserLogin = (credentials: LoginCredentials) => {
  // ...
};

const handleFormSubmit = (event: FormEvent) => {
  // ...
};

// ✅ Para callbacks específicos
const onUserProfileUpdate = (profile: UserProfile) => {
  // ...
};
```

### Custom Events
```typescript
// ✅ Bom - kebab-case
const USER_PROFILE_UPDATED = 'user-profile-updated';
const FORM_VALIDATION_ERROR = 'form-validation-error';
```

## 🔄 Estado e Stores

### Zustand Stores
```typescript
// ✅ Bom - sufixo 'Store'
export const useUserStore = create<UserState>(() => ({
  user: null,
  isAuthenticated: false,
  // ...
}));

export const useDemandasStore = create<DemandasState>(() => ({
  demandas: [],
  isLoading: false,
  // ...
}));
```

### State Properties
```typescript
interface AppState {
  // ✅ Bom - camelCase, descritivo
  currentUser: User | null;
  isLoading: boolean;
  errorMessage: string | null;
  
  // ✅ Arrays com sufixos plurais
  demandas: Demanda[];
  documentos: Documento[];
}
```

## 📝 Comentários e Documentação

### Comentários em Código
```typescript
// ✅ Bom - português, claro e objetivo
// Valida se o usuário tem permissão para acessar a demanda
const validateUserAccess = (user: User, demanda: Demanda): boolean => {
  // Administradores têm acesso total
  if (user.isAdmin) return true;
  
  // Verifica se é o criador da demanda
  return demanda.createdBy === user.id;
};
```

### JSDoc
```typescript
/**
 * Hook para gerenciar o estado de autenticação do usuário.
 * 
 * @returns {Object} Estado e funções de autenticação
 * @returns {User | null} returns.user - Usuário autenticado
 * @returns {boolean} returns.isAuthenticated - Status de autenticação
 * @returns {Function} returns.login - Função para fazer login
 * @returns {Function} returns.logout - Função para fazer logout
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * if (isAuthenticated) {
 *   console.log('Usuário logado:', user.name);
 * }
 */
export const useAuth = () => {
  // implementação
};
```

## ❌ Padrões a Evitar

### Nomes Genéricos
```typescript
// ❌ Evitar
const data = fetchSomething();
const info = getUserInfo();
const component = <SomeComponent />;

// ✅ Melhor
const userProfiles = fetchUserProfiles();
const authenticationInfo = getUserAuthInfo();
const userProfileModal = <UserProfileModal />;
```

### Abreviações Desnecessárias
```typescript
// ❌ Evitar
const usrMgmt = new UserManagement();
const reqData = request.data;
const btnClk = handleButtonClick;

// ✅ Melhor
const userManagement = new UserManagement();
const requestData = request.data;
const handleButtonClick = () => {};
```

### Inconsistência de Idioma
```typescript
// ❌ Evitar - mistura de idiomas
interface User {
  id: number;
  nome: string;     // português
  email: string;
  senha: string;    // português
  isActive: boolean; // inglês
}

// ✅ Melhor - consistente em inglês
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
}
```

## 🎯 Checklist de Revisão

- [ ] Nomes de arquivos seguem convenção (PascalCase para componentes, camelCase para utilities)
- [ ] Variáveis e funções em camelCase
- [ ] Constantes em SCREAMING_SNAKE_CASE
- [ ] Interfaces e tipos em PascalCase
- [ ] Hooks começam com 'use'
- [ ] Event handlers começam com 'handle' ou 'on'
- [ ] Comentários em português
- [ ] Código em inglês (exceto tipos de domínio)
- [ ] Nomes descritivos sem abreviações desnecessárias
- [ ] Consistência com arquivos similares

---

**Nota**: Essas convenções devem ser aplicadas gradualmente em refatorações e sempre em código novo. Para código legado, priorize consistência local sobre mudanças disruptivas.