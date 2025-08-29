import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/test/e2e',
  /* Executa testes em arquivos paralelamente */
  fullyParallel: true,
  /* Falha o build na CI se acidentalmente deixou test.only no código fonte. */
  forbidOnly: !!process.env.CI,
  /* Retry apenas na CI */
  retries: process.env.CI ? 2 : 0,
  /* Desabilita testes paralelos na CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter a ser usado. Veja https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
  ],
  /* Configurações compartilhadas para todos os projetos abaixo. Veja https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* URL base para usar em ações como `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Coleta trace ao repetir teste falhado. Veja https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Captura screenshot em falhas */
    screenshot: 'only-on-failure',

    /* Grava vídeo em falhas */
    video: 'retain-on-failure',
  },

  /* Configura projetos para principais navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Testa contra viewports mobile. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Testa contra navegadores com marca. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Executa servidor de desenvolvimento local antes de iniciar os testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos
  },

  /* Setup e teardown globais */
  globalSetup: require.resolve('./src/test/e2e/setup/global-setup.ts'),
  globalTeardown: require.resolve('./src/test/e2e/setup/global-teardown.ts'),

  /* Timeout dos testes */
  timeout: 30 * 1000, // 30 segundos
  expect: {
    timeout: 5 * 1000, // 5 segundos
  },
});
