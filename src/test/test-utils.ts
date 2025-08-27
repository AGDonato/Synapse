/**
 * Enhanced test utilities for React components
 */

import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock data imports
import { mockDemandas } from '../data/mockDemandas';
import { mockDocumentos } from '../data/mockDocumentos';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockAssuntos } from '../data/mockAssuntos';

// Types
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
  withRouter?: boolean;
  withQueryClient?: boolean;
  mockUser?: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'readonly';
  } | null;
}

// Test providers wrapper
const AllTheProviders = ({ 
  children, 
  queryClient,
  initialRoute = '/',
  mockUser,
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
  mockUser?: CustomRenderOptions['mockUser'];
}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock authentication context if needed
  if (mockUser) {
    // This would integrate with your auth context
    // For now, just set up the mock
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
  }

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    initialRoute = '/',
    queryClient,
    withRouter = true,
    withQueryClient = true,
    mockUser = null,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (!withRouter && !withQueryClient) {
      return <>{children}</>;
    }

    return (
      <AllTheProviders
        queryClient={queryClient}
        initialRoute={initialRoute}
        mockUser={mockUser}
      >
        {children}
      </AllTheProviders>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponses = {
  demandas: {
    list: vi.fn().mockResolvedValue({
      data: mockDemandas.slice(0, 10),
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: mockDemandas.length,
      },
    }),
    getById: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(mockDemandas.find(d => d.id === id))
    ),
    create: vi.fn().mockImplementation((data) => 
      Promise.resolve({ ...data, id: Date.now() })
    ),
    update: vi.fn().mockImplementation((id: number, data) => 
      Promise.resolve({ ...mockDemandas.find(d => d.id === id), ...data })
    ),
    delete: vi.fn().mockResolvedValue(undefined),
    stats: vi.fn().mockResolvedValue({
      total: mockDemandas.length,
      abertas: 5,
      em_andamento: 3,
      concluidas: 2,
      atrasadas: 1,
    }),
  },

  documentos: {
    list: vi.fn().mockResolvedValue({
      data: mockDocumentos.slice(0, 10),
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: mockDocumentos.length,
      },
    }),
    getById: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(mockDocumentos.find(d => d.id === id))
    ),
    create: vi.fn().mockImplementation((data) => 
      Promise.resolve({ ...data, id: Date.now() })
    ),
    update: vi.fn().mockImplementation((id: number, data) => 
      Promise.resolve({ ...mockDocumentos.find(d => d.id === id), ...data })
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },

  orgaos: {
    list: vi.fn().mockResolvedValue(mockOrgaos),
    getById: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(mockOrgaos.find(o => o.id === id))
    ),
    create: vi.fn().mockImplementation((data) => 
      Promise.resolve({ ...data, id: Date.now() })
    ),
    update: vi.fn().mockImplementation((id: number, data) => 
      Promise.resolve({ ...mockOrgaos.find(o => o.id === id), ...data })
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },

  assuntos: {
    list: vi.fn().mockResolvedValue(mockAssuntos),
    getById: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(mockAssuntos.find(a => a.id === id))
    ),
    create: vi.fn().mockImplementation((data) => 
      Promise.resolve({ ...data, id: Date.now() })
    ),
    update: vi.fn().mockImplementation((id: number, data) => 
      Promise.resolve({ ...mockAssuntos.find(a => a.id === id), ...data })
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },
};

// Common test data generators
export const createTestUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  ...overrides,
});

export const createTestDemanda = (overrides = {}) => ({
  id: 1,
  numero: 'DEM-2023-001',
  titulo: 'Test Demanda',
  descricao: 'Test description',
  prioridade: 'media' as const,
  status: 'aberta' as const,
  data_abertura: new Date().toISOString(),
  data_prazo: new Date(Date.now() + 86400000).toISOString(), // +1 day
  tipo_demanda_id: 1,
  orgao_solicitante_id: 1,
  assunto_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestDocumento = (overrides = {}) => ({
  id: 1,
  numero: 'DOC-2023-001',
  assunto: 'Test Document',
  destinatario: 'Test Recipient',
  status: 'rascunho' as const,
  data_criacao: new Date().toISOString(),
  tipo_documento_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Event simulation helpers
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: 'test' },
  currentTarget: { value: 'test' },
  ...overrides,
});

export const createMockChangeEvent = (value: string) => ({
  target: { value },
  currentTarget: { value },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

export const createMockFile = (name = 'test.txt', type = 'text/plain', size = 1024) => 
  new File(['test content'], name, { type, lastModified: Date.now() });

// Async utilities
export const waitForNextUpdate = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitFor = async (condition: () => boolean, timeout = 5000) => {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

// Mock hooks
export const mockUseNavigate = vi.fn();
export const mockUseLocation = vi.fn(() => ({ pathname: '/test', search: '', hash: '' }));
export const mockUseParams = vi.fn(() => ({}));

// Mock components for testing
export const MockButton = ({ children, onClick, disabled, ...props }: any) => (
  <button onClick={onClick} disabled={disabled} {...props}>
    {children}
  </button>
);

export const MockInput = ({ value, onChange, ...props }: any) => (
  <input value={value} onChange={onChange} {...props} />
);

export const MockSelect = ({ value, onChange, children, ...props }: any) => (
  <select value={value} onChange={onChange} {...props}>
    {children}
  </select>
);

// API mocking utilities
export const mockFetch = (response: any, options: { ok?: boolean; status?: number } = {}) => {
  const mockResponse = {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(response)])),
    headers: new Map(),
    url: 'https://api.test.com',
    statusText: 'OK',
  };

  global.fetch = vi.fn().mockResolvedValue(mockResponse);
  return mockResponse;
};

// Mock storage utilities
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Setup localStorage and sessionStorage
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
  
  // Setup fetch mock
  global.fetch = vi.fn();
  
  // Setup default API mocks
  Object.values(mockApiResponses).forEach(apiMock => {
    Object.values(apiMock).forEach(method => {
      if (typeof method === 'function') {
        method.mockClear();
      }
    });
  });
};

// Component testing utilities
export const getByTestId = (container: HTMLElement, testId: string) => {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Element with data-testid="${testId}" not found`);
  }
  return element;
};

export const queryByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`);
};

// Assert utilities
export const expectElementToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToBeDisabled = (element: HTMLElement | null) => {
  expect(element).toBeDisabled();
};

export const expectElementToBeEnabled = (element: HTMLElement | null) => {
  expect(element).not.toBeDisabled();
};

// Export customRender as default render
export { customRender as render };

// Re-export everything from testing library
export * from '@testing-library/react';
export { vi } from 'vitest';