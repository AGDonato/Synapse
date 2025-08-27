/**
 * Configuração do Pipeline de Testes Automatizados
 * Define estratégias e configurações para diferentes tipos de testes
 */

import type { TestConfig } from 'vitest';
import { createModuleLogger } from '../../utils/logger';

const testLogger = createModuleLogger('TestPipeline');

// ============================================================================
// CONFIGURAÇÕES DE TIPOS DE TESTE
// ============================================================================

export interface TestPipelineConfig {
  unit: UnitTestConfig;
  integration: IntegrationTestConfig;
  e2e: E2ETestConfig;
  performance: PerformanceTestConfig;
  visual: VisualTestConfig;
}

export interface UnitTestConfig {
  enabled: boolean;
  pattern: string[];
  coverage: {
    enabled: boolean;
    threshold: number;
    include: string[];
    exclude: string[];
  };
  timeout: number;
  retry: number;
  parallel: boolean;
}

export interface IntegrationTestConfig {
  enabled: boolean;
  pattern: string[];
  setupFiles: string[];
  database: {
    setup: boolean;
    teardown: boolean;
    fixtures: string[];
  };
  timeout: number;
  retry: number;
}

export interface E2ETestConfig {
  enabled: boolean;
  pattern: string[];
  browsers: string[];
  baseUrl: string;
  timeout: number;
  retry: number;
  video: boolean;
  screenshots: boolean;
  parallel: boolean;
}

export interface PerformanceTestConfig {
  enabled: boolean;
  pattern: string[];
  thresholds: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  budgets: {
    javascript: number;
    css: number;
    images: number;
    fonts: number;
  };
}

export interface VisualTestConfig {
  enabled: boolean;
  pattern: string[];
  threshold: number;
  updateSnapshots: boolean;
}

// ============================================================================
// CONFIGURAÇÃO PADRÃO DO PIPELINE
// ============================================================================

export const defaultTestPipelineConfig: TestPipelineConfig = {
  unit: {
    enabled: true,
    pattern: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
    ],
    coverage: {
      enabled: true,
      threshold: 80,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**/*',
        'src/**/*.stories.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
    timeout: 10000,
    retry: 2,
    parallel: true,
  },
  
  integration: {
    enabled: true,
    pattern: [
      'src/test/integration/**/*.test.{ts,tsx}',
    ],
    setupFiles: [
      'src/test/integration/setup.ts',
    ],
    database: {
      setup: true,
      teardown: true,
      fixtures: [
        'src/test/fixtures/**/*.json',
      ],
    },
    timeout: 30000,
    retry: 1,
  },
  
  e2e: {
    enabled: true,
    pattern: [
      'src/test/e2e/**/*.spec.{ts,tsx}',
    ],
    browsers: ['chromium', 'firefox', 'webkit'],
    baseUrl: 'http://localhost:5173',
    timeout: 60000,
    retry: 2,
    video: true,
    screenshots: true,
    parallel: true,
  },
  
  performance: {
    enabled: true,
    pattern: [
      'src/test/performance/**/*.test.{ts,tsx}',
    ],
    thresholds: {
      fcp: 2000,
      lcp: 4000,
      fid: 100,
      cls: 0.1,
    },
    budgets: {
      javascript: 500000, // 500KB
      css: 100000,        // 100KB
      images: 1000000,    // 1MB
      fonts: 100000,      // 100KB
    },
  },
  
  visual: {
    enabled: false, // Disabled by default
    pattern: [
      'src/test/visual/**/*.test.{ts,tsx}',
    ],
    threshold: 0.2,
    updateSnapshots: false,
  },
};

// ============================================================================
// ESTRATÉGIAS DE EXECUÇÃO
// ============================================================================

export enum TestExecutionStrategy {
  FAST = 'fast',           // Apenas unit tests
  STANDARD = 'standard',   // Unit + Integration
  FULL = 'full',          // Todos os tipos de teste
  CI = 'ci',              // Configuração para CI/CD
  LOCAL = 'local',        // Configuração para desenvolvimento local
}

export const executionStrategies: Record<TestExecutionStrategy, Partial<TestPipelineConfig>> = {
  [TestExecutionStrategy.FAST]: {
    unit: { enabled: true },
    integration: { enabled: false },
    e2e: { enabled: false },
    performance: { enabled: false },
    visual: { enabled: false },
  },
  
  [TestExecutionStrategy.STANDARD]: {
    unit: { enabled: true },
    integration: { enabled: true },
    e2e: { enabled: false },
    performance: { enabled: false },
    visual: { enabled: false },
  },
  
  [TestExecutionStrategy.FULL]: {
    unit: { enabled: true },
    integration: { enabled: true },
    e2e: { enabled: true },
    performance: { enabled: true },
    visual: { enabled: true },
  },
  
  [TestExecutionStrategy.CI]: {
    unit: { 
      enabled: true,
      parallel: true,
      retry: 0, // No retry in CI for faster feedback
    },
    integration: { 
      enabled: true,
      retry: 0,
    },
    e2e: { 
      enabled: true,
      parallel: false, // Sequential for stability in CI
      retry: 1,
      video: false, // Save space in CI
    },
    performance: { enabled: true },
    visual: { enabled: false }, // Usually disabled in CI
  },
  
  [TestExecutionStrategy.LOCAL]: {
    unit: { 
      enabled: true,
      parallel: true,
      retry: 2,
    },
    integration: { 
      enabled: true,
      retry: 2,
    },
    e2e: { 
      enabled: true,
      parallel: true,
      retry: 3,
      video: true,
      screenshots: true,
    },
    performance: { enabled: false }, // Usually disabled locally
    visual: { 
      enabled: true,
      updateSnapshots: true, // Allow updating locally
    },
  },
};

// ============================================================================
// UTILITIES DE CONFIGURAÇÃO
// ============================================================================

export class TestPipelineManager {
  private config: TestPipelineConfig;
  
  constructor(config: TestPipelineConfig = defaultTestPipelineConfig) {
    this.config = config;
  }
  
  /**
   * Aplica uma estratégia de execução
   */
  applyStrategy(strategy: TestExecutionStrategy): void {
    const strategyConfig = executionStrategies[strategy];
    this.config = this.mergeConfig(this.config, strategyConfig);
    
    testLogger.info(`Applied test strategy: ${strategy}`, {
      enabledTests: this.getEnabledTestTypes(),
    });
  }
  
  /**
   * Obtém os tipos de teste habilitados
   */
  getEnabledTestTypes(): string[] {
    const enabled: string[] = [];
    
    if (this.config.unit.enabled) enabled.push('unit');
    if (this.config.integration.enabled) enabled.push('integration');
    if (this.config.e2e.enabled) enabled.push('e2e');
    if (this.config.performance.enabled) enabled.push('performance');
    if (this.config.visual.enabled) enabled.push('visual');
    
    return enabled;
  }
  
  /**
   * Gera configuração Vitest baseada na configuração atual
   */
  generateVitestConfig(): Partial<TestConfig> {
    const config: Partial<TestConfig> = {
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [
          'src/test/setup.ts',
          ...(this.config.integration.enabled ? this.config.integration.setupFiles : []),
        ],
        include: [
          ...(this.config.unit.enabled ? this.config.unit.pattern : []),
          ...(this.config.integration.enabled ? this.config.integration.pattern : []),
        ],
        testTimeout: this.config.unit.timeout,
        hookTimeout: 10000,
        retry: this.config.unit.retry,
        coverage: this.config.unit.coverage.enabled ? {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          thresholds: {
            global: {
              branches: this.config.unit.coverage.threshold,
              functions: this.config.unit.coverage.threshold,
              lines: this.config.unit.coverage.threshold,
              statements: this.config.unit.coverage.threshold,
            },
          },
          include: this.config.unit.coverage.include,
          exclude: this.config.unit.coverage.exclude,
        } : undefined,
      },
    };
    
    return config;
  }
  
  /**
   * Gera configuração Playwright baseada na configuração atual
   */
  generatePlaywrightConfig(): Record<string, any> {
    if (!this.config.e2e.enabled) {
      return {};
    }
    
    return {
      testDir: './src/test/e2e',
      fullyParallel: this.config.e2e.parallel,
      forbidOnly: !!process.env.CI,
      retries: this.config.e2e.retry,
      workers: process.env.CI ? 1 : undefined,
      reporter: 'html',
      timeout: this.config.e2e.timeout,
      use: {
        baseURL: this.config.e2e.baseUrl,
        trace: 'on-first-retry',
        video: this.config.e2e.video ? 'retain-on-failure' : 'off',
        screenshot: this.config.e2e.screenshots ? 'only-on-failure' : 'off',
      },
      projects: this.config.e2e.browsers.map(browser => ({
        name: browser,
        use: { ...{ chromium: {}, firefox: {}, webkit: {} }[browser] },
      })),
      webServer: {
        command: 'npm run dev',
        url: this.config.e2e.baseUrl,
        reuseExistingServer: !process.env.CI,
      },
    };
  }
  
  /**
   * Executa validações na configuração
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar thresholds de coverage
    if (this.config.unit.coverage.enabled && this.config.unit.coverage.threshold > 100) {
      errors.push('Coverage threshold cannot be greater than 100%');
    }
    
    // Validar timeouts
    if (this.config.unit.timeout < 1000) {
      errors.push('Unit test timeout should be at least 1000ms');
    }
    
    if (this.config.e2e.enabled && this.config.e2e.timeout < 5000) {
      errors.push('E2E test timeout should be at least 5000ms');
    }
    
    // Validar performance budgets
    Object.entries(this.config.performance.budgets).forEach(([key, value]) => {
      if (value < 0) {
        errors.push(`Performance budget for ${key} cannot be negative`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Gera relatório de configuração
   */
  generateReport(): TestPipelineReport {
    const enabledTypes = this.getEnabledTestTypes();
    const validation = this.validate();
    
    return {
      timestamp: new Date().toISOString(),
      enabledTestTypes: enabledTypes,
      totalTestFiles: this.estimateTestFiles(),
      configuration: this.config,
      validation,
      recommendations: this.generateRecommendations(),
    };
  }
  
  private mergeConfig(base: TestPipelineConfig, override: Partial<TestPipelineConfig>): TestPipelineConfig {
    return {
      unit: { ...base.unit, ...(override.unit || {}) },
      integration: { ...base.integration, ...(override.integration || {}) },
      e2e: { ...base.e2e, ...(override.e2e || {}) },
      performance: { ...base.performance, ...(override.performance || {}) },
      visual: { ...base.visual, ...(override.visual || {}) },
    };
  }
  
  private estimateTestFiles(): number {
    // Estimate based on enabled patterns
    let estimate = 0;
    
    if (this.config.unit.enabled) estimate += 50; // Estimate 50 unit test files
    if (this.config.integration.enabled) estimate += 20; // Estimate 20 integration test files
    if (this.config.e2e.enabled) estimate += 10; // Estimate 10 E2E test files
    if (this.config.performance.enabled) estimate += 5; // Estimate 5 performance test files
    if (this.config.visual.enabled) estimate += 15; // Estimate 15 visual test files
    
    return estimate;
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Coverage recommendations
    if (this.config.unit.coverage.threshold < 80) {
      recommendations.push('Consider increasing code coverage threshold to at least 80%');
    }
    
    // Parallel execution recommendations
    if (!this.config.unit.parallel && this.config.unit.enabled) {
      recommendations.push('Enable parallel execution for unit tests to improve performance');
    }
    
    // E2E recommendations
    if (this.config.e2e.enabled && !this.config.e2e.video && !this.config.e2e.screenshots) {
      recommendations.push('Enable video or screenshots for E2E tests to aid debugging');
    }
    
    // Performance recommendations
    if (this.config.performance.budgets.javascript > 1000000) {
      recommendations.push('JavaScript bundle size is quite large, consider optimizing');
    }
    
    return recommendations;
  }
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface TestPipelineReport {
  timestamp: string;
  enabledTestTypes: string[];
  totalTestFiles: number;
  configuration: TestPipelineConfig;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  recommendations: string[];
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export const createTestPipeline = (strategy: TestExecutionStrategy = TestExecutionStrategy.STANDARD): TestPipelineManager => {
  const manager = new TestPipelineManager();
  manager.applyStrategy(strategy);
  return manager;
};

export const createCustomTestPipeline = (config: Partial<TestPipelineConfig>): TestPipelineManager => {
  const mergedConfig = {
    ...defaultTestPipelineConfig,
    ...config,
  };
  return new TestPipelineManager(mergedConfig);
};

// ============================================================================
// CONFIGURAÇÃO PARA AMBIENTE
// ============================================================================

export const getEnvironmentStrategy = (): TestExecutionStrategy => {
  if (process.env.CI) {
    return TestExecutionStrategy.CI;
  }
  
  if (process.env.NODE_ENV === 'test') {
    return TestExecutionStrategy.FULL;
  }
  
  return TestExecutionStrategy.LOCAL;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  TestPipelineManager,
  defaultConfig: defaultTestPipelineConfig,
  strategies: executionStrategies,
  createTestPipeline,
  createCustomTestPipeline,
  getEnvironmentStrategy,
};