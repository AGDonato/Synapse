import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');

  // Limpar recursos se necessário
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:5173');
    
    // Limpar dados de teste
    await page.evaluate(() => {
      // Limpar todos os dados relacionados a testes
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar IndexedDB se existir
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('synapse-cache');
        indexedDB.deleteDatabase('synapse-offline');
      }
    });
    
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.warn('⚠️ Warning during teardown:', error);
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✅ E2E test teardown completed');
}

export default globalTeardown;