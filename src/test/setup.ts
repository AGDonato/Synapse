/**
 * Test setup configuration for Vitest + React Testing Library
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:3000/api',
    DEV: true,
    PROD: false,
    MODE: 'test',
  },
  writable: true,
});

// Mock global window methods
global.confirm = vi.fn(() => true);
global.alert = vi.fn();
global.prompt = vi.fn(() => 'test-input');

// Mock console methods to reduce noise in tests (but allow errors)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: originalConsole.error, // Keep real errors visible
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock DOM APIs
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px') ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    randomUUID: vi.fn().mockReturnValue('test-uuid-1234-5678-9012'),
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock URL constructor for testing
global.URL = class MockURL {
  constructor(public href: string, base?: string) {
    this.href = href;
    this.protocol = 'https:';
    this.hostname = 'localhost';
    this.pathname = '/test';
    this.search = '';
    this.hash = '';
  }
  
  protocol = 'https:';
  hostname = 'localhost';
  pathname = '/test';
  search = '';
  hash = '';
  
  toString() {
    return this.href;
  }
} as any;

// Mock File API
global.File = class MockFile {
  constructor(
    public chunks: BlobPart[],
    public name: string,
    public options: FilePropertyBag = {}
  ) {
    this.size = chunks.reduce((acc, chunk) => acc + (typeof chunk === 'string' ? chunk.length : chunk.size || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
  
  size: number;
  type: string;
  lastModified: number;
  
  stream() {
    return new ReadableStream();
  }
  
  async text() {
    return this.chunks.join('');
  }
  
  async arrayBuffer() {
    return new ArrayBuffer(this.size);
  }
  
  slice() {
    return new MockFile([], 'slice');
  }
} as any;

// Mock Blob
global.Blob = class MockBlob {
  constructor(public parts: BlobPart[] = [], public options: BlobPropertyBag = {}) {
    this.size = parts.reduce((acc, part) => acc + (typeof part === 'string' ? part.length : part.size || 0), 0);
    this.type = options.type || '';
  }
  
  size: number;
  type: string;
  
  async text() {
    return this.parts.join('');
  }
  
  async arrayBuffer() {
    return new ArrayBuffer(this.size);
  }
  
  slice() {
    return new MockBlob();
  }
  
  stream() {
    return new ReadableStream();
  }
} as any;

// Mock FormData
global.FormData = class MockFormData {
  private data: Map<string, string | File> = new Map();
  
  append(name: string, value: string | File) {
    this.data.set(name, value);
  }
  
  get(name: string) {
    return this.data.get(name) || null;
  }
  
  has(name: string) {
    return this.data.has(name);
  }
  
  delete(name: string) {
    this.data.delete(name);
  }
  
  entries() {
    return this.data.entries();
  }
  
  keys() {
    return this.data.keys();
  }
  
  values() {
    return this.data.values();
  }
  
  forEach(callback: (value: string | File, key: string) => void) {
    this.data.forEach(callback);
  }
} as any;

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock ECharts for chart tests
vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getOption: vi.fn(() => ({})),
  })),
  registerTheme: vi.fn(),
  graphic: {
    LinearGradient: vi.fn(),
  },
}));

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: ({ option, ...props }: any) => {
    return React.createElement('div', {
      'data-testid': 'echarts-mock',
      'data-option': JSON.stringify(option),
      ...props,
    });
  },
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/test', search: '', hash: '' }),
  useParams: () => ({}),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}));

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});