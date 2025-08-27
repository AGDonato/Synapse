import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Configurar estado inicial se necessário
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Aguardar aplicação estar pronta
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:5173');
    
    // Verificar se aplicação carregou corretamente
    await page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });
    
    console.log('✅ Application is ready for testing');
    
    // Preparar dados de teste se necessário
    await page.evaluate(() => {
      // Limpar localStorage/sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Configurar dados iniciais para testes
      localStorage.setItem('e2e-test-mode', 'true');
    });
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✅ E2E test setup completed');
}

export default globalSetup;