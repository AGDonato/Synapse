# 🧪 Guia de Testes do Synapse

Esta pasta contém toda a infraestrutura e implementações de testes para o projeto Synapse. O sistema utiliza **Vitest** + **React Testing Library** para garantir qualidade de código e prevenir regressões.

## 📁 Estrutura da Pasta

```
src/test/
├── README.md              # Este guia completo
├── setup.ts              # Configuração inicial dos testes  
├── utils.tsx             # TestWrapper e utilitários React
├── components/           # Testes de componentes UI
│   └── Button.test.tsx   # Exemplo: testes do componente Button
├── hooks/               # Testes de hooks customizados
│   └── useAssuntos.test.ts # Exemplo: testes do hook useAssuntos
└── services/            # Testes de serviços e lógica de negócio
    └── AssuntosService.test.ts # Exemplo: testes do serviço

```

## 🚀 Comandos de Teste Disponíveis

### Execução Básica
```bash
npm run test              # Executa testes no modo watch
npm run test:run          # Executa testes uma vez
npm run test:coverage     # Executa com relatório de cobertura
npm run test:ui           # Interface gráfica dos testes (Vitest UI)
```

### Execução Específica  
```bash
npm run test:unit         # Apenas testes unitários
npm run test:integration  # Apenas testes de integração
npm run test:e2e          # Testes end-to-end (Playwright)
npm run test:fast         # Execução rápida com reporter mínimo
```

### Qualidade e CI/CD
```bash
npm run quality           # Testes + lint + type-check
npm run test:ci           # Executar no CI com coverage JSON
npm run check-all         # Verificação completa do projeto
```

## 🏗️ Configuração dos Testes

### setup.ts
Arquivo de configuração inicial que:
- Estende o objeto `expect` com matchers do `jest-dom`
- Configura limpeza automática do DOM após cada teste
- Garante isolamento entre testes

### utils.tsx  
Utilitários para testes de componentes React:
- **TestWrapper**: Provê QueryClient e Router para testes
- **customRender**: Função de renderização que aplica providers automaticamente
- Re-exporta todas as utilities do React Testing Library

## 📝 Escrevendo Testes

### 1. Testes de Componentes

```typescript
import { render, screen, fireEvent } from '../utils';
import MinhaComponente from '../../components/MinhaComponente';

describe('MinhaComponente', () => {
  it('renderiza corretamente', () => {
    render(<MinhaComponente titulo="Teste" />);
    expect(screen.getByText('Teste')).toBeInTheDocument();
  });

  it('executa callback ao clicar', () => {
    const mockClick = vi.fn();
    render(<MinhaComponente onClick={mockClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Testes de Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMeuHook } from '../../hooks/useMeuHook';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMeuHook', () => {
  it('carrega dados corretamente', async () => {
    const { result } = renderHook(() => useMeuHook(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeTruthy();
  });
});
```

### 3. Testes de Serviços

```typescript
import { vi } from 'vitest';
import { MeuService } from '../../services/MeuService';

// Mock do repository
vi.mock('../../repositories/MeuRepository', () => ({
  meuRepository: {
    findAll: vi.fn(),
    create: vi.fn(),
    // ... outros métodos
  }
}));

describe('MeuService', () => {
  let service;
  
  beforeEach(() => {
    service = new MeuService();
    vi.clearAllMocks();
  });

  it('cria item com dados válidos', async () => {
    const dadosValidos = { nome: 'Teste' };
    mockRepository.create.mockResolvedValue({ id: 1, ...dadosValidos });

    const result = await service.create(dadosValidos);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, ...dadosValidos });
  });
});
```

## 🎯 Convenções de Nomenclatura

### Arquivos de Teste
- **Componentes**: `NomeComponente.test.tsx`
- **Hooks**: `useNomeHook.test.ts`  
- **Serviços**: `NomeService.test.ts`
- **Utilitários**: `nomeUtil.test.ts`

### Estrutura dos Describes
```typescript
describe('NomeDoArquivo/Funcionalidade', () => {
  describe('Categoria de Testes', () => {
    it('deve fazer algo específico', () => {
      // teste aqui
    });
  });
});
```

### Nomes dos Testes
- Use português para descrições (`it('renderiza corretamente')`)
- Seja específico sobre o comportamento esperado
- Use verbos de ação: renderiza, executa, valida, rejeita, etc.

## 🔧 Mocks e Dados de Teste

### Mock de Módulos
```typescript
// Mock completo de um módulo
vi.mock('../../services/ApiService', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

// Mock parcial mantendo implementação original
vi.mock('../../utils/helpers', async () => {
  const actual = await vi.importActual('../../utils/helpers');
  return {
    ...actual,
    funcaoMockada: vi.fn(),
  };
});
```

### Dados de Teste
```typescript
// Crie dados consistentes para reutilizar
const mockAssuntos = [
  { id: 1, nome: 'Fraude Bancária', descricao: 'Teste' },
  { id: 2, nome: 'Lavagem de Dinheiro', descricao: 'Teste' },
];

// Use factories para dados dinâmicos
const createMockAssunto = (overrides = {}) => ({
  id: Math.random(),
  nome: 'Assunto Teste',
  descricao: 'Descrição teste',
  ...overrides,
});
```

## 📊 Cobertura de Código

### Metas de Cobertura
- **Global**: 75% (branches, functions), 80% (lines, statements)
- **Services**: 80-85% para todas as métricas
- **Utils**: 85-90% para todas as métricas  
- **Hooks**: 80-85% para todas as métricas
- **Components UI**: 70-75% para todas as métricas

### Relatórios
```bash
npm run test:coverage     # Gera relatório completo
open coverage/index.html  # Visualiza relatório no navegador
```

## 🚨 Troubleshooting

### Problemas Comuns

**Teste não encontra elemento**
```typescript
// ❌ Elemento pode não estar renderizado ainda
expect(screen.getByText('Loading')).toBeInTheDocument();

// ✅ Use waitFor para aguardar
await waitFor(() => {
  expect(screen.getByText('Carregado')).toBeInTheDocument();
});
```

**Mock não funciona**
```typescript
// ❌ Mock após o import
import { service } from './service';
vi.mock('./service');

// ✅ Mock antes do import
vi.mock('./service');
import { service } from './service';
```

**Teste de hook sem provider**
```typescript
// ❌ Hook que usa QueryClient sem wrapper
const { result } = renderHook(() => useMeuHook());

// ✅ Sempre use wrapper para hooks com dependências
const { result } = renderHook(() => useMeuHook(), {
  wrapper: TestWrapper
});
```

## 🔄 Executando Testes Durante Desenvolvimento

### Modo Watch
```bash
npm run test  # Executa automaticamente quando arquivos mudam
```

### Filtragem de Testes
```bash
# Apenas testes que contêm "Button"
npm run test -- Button

# Apenas um arquivo específico  
npm run test -- Button.test.tsx

# Apenas testes com describe específico
npm run test -- --grep "CRUD Operations"
```

## 🎪 Exemplos Práticos

Veja os arquivos de exemplo na pasta para implementações completas:

- **Button.test.tsx**: Teste de componente com diferentes props e eventos
- **useAssuntos.test.ts**: Teste de hook com mocks de serviço e estados
- **AssuntosService.test.ts**: Teste de serviço com validações e casos extremos

## 📚 Recursos Úteis

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)  
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom#custom-matchers)
- [Playwright E2E](https://playwright.dev/)

---

**💡 Lembre-se**: Testes são documentação executável. Escreva-os pensando em quem irá ler e manter o código no futuro!