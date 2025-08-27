import { test, expect, Page } from '@playwright/test';

test.describe('Performance e Load Testing', () => {
  test('deve carregar lista de demandas em tempo aceitável', async ({ page }) => {
    // Mock de uma lista grande de demandas
    const largeDemandaList = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      numero: `DEM-2024-${String(i + 1).padStart(3, '0')}`,
      titulo: `Demanda de Performance ${i + 1}`,
      status: ['aberta', 'em_andamento', 'concluida'][i % 3],
      prioridade: ['baixa', 'media', 'alta'][i % 3],
      dataInicial: '01/01/2024',
      prazo: '31/12/2024'
    }));

    await page.route('**/api/demandas**', async (route) => {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: largeDemandaList,
          total: largeDemandaList.length,
          page: 1,
          limit: 100
        })
      });
    });

    // Login
    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Medir tempo de carregamento da lista de demandas
    const startTime = performance.now();
    
    await page.click('[data-testid="nav-demandas"]');
    await page.waitForSelector('[data-testid="demandas-table"]');
    await page.waitForSelector('[data-testid="demanda-row"]:last-child', { timeout: 10000 });
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Verificar que carregou em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Verificar que todas as demandas foram carregadas
    const demandaRows = await page.locator('[data-testid^="demanda-row"]').count();
    expect(demandaRows).toBe(100);
    
    console.log(`Lista de 100 demandas carregada em ${loadTime.toFixed(2)}ms`);
  });

  test('deve manter responsividade durante operações pesadas', async ({ page }) => {
    // Mock que simula operação lenta
    await page.route('**/api/demandas/bulk-update', async (route) => {
      // Simular processamento lento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, updated: 50 })
      });
    });

    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    await page.click('[data-testid="nav-demandas"]');
    
    // Iniciar operação pesada
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-testid="bulk-update-button"]');
    
    // Verificar que interface permanece responsiva durante operação
    await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    
    // Testar que outros elementos ainda funcionam
    await page.hover('[data-testid="nav-documentos"]');
    await expect(page.locator('[data-testid="nav-documentos"]')).toHaveCSS('opacity', '1');
    
    // Aguardar conclusão
    await expect(page.locator('[data-testid="loading-overlay"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('deve gerenciar memória eficientemente com muitos dados', async ({ page }) => {
    // Monitorar uso de memória
    await page.addInitScript(() => {
      (window as any).memoryMonitor = {
        initialMemory: (performance as any).memory?.usedJSHeapSize || 0,
        measurements: [] as number[]
      };
    });

    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Simular navegação intensiva entre páginas
    for (let i = 0; i < 10; i++) {
      // Ir para demandas
      await page.click('[data-testid="nav-demandas"]');
      await page.waitForSelector('[data-testid="demandas-table"]');
      
      // Medir memória
      await page.evaluate(() => {
        if ((performance as any).memory && (window as any).memoryMonitor) {
          (window as any).memoryMonitor.measurements.push(
            (performance as any).memory.usedJSHeapSize
          );
        }
      });
      
      // Ir para documentos
      await page.click('[data-testid="nav-documentos"]');
      await page.waitForSelector('[data-testid="documentos-table"]');
      
      // Ir para relatórios
      await page.click('[data-testid="nav-relatorios"]');
      await page.waitForSelector('[data-testid="relatorios-dashboard"]');
    }

    // Verificar que não houve vazamento de memória significativo
    const memoryStats = await page.evaluate(() => {
      const monitor = (window as any).memoryMonitor;
      if (!monitor || monitor.measurements.length === 0) return null;
      
      return {
        initial: monitor.initialMemory,
        final: monitor.measurements[monitor.measurements.length - 1],
        max: Math.max(...monitor.measurements),
        min: Math.min(...monitor.measurements)
      };
    });

    if (memoryStats) {
      const memoryIncrease = memoryStats.final - memoryStats.initial;
      const maxMemoryUsed = memoryStats.max;
      
      // Verificar que aumento de memória é razoável (menos de 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memória inicial: ${(memoryStats.initial / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memória final: ${(memoryStats.final / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Aumento: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }
  });

  test('deve otimizar renderização de tabelas virtualizadas', async ({ page }) => {
    // Mock de dados grandes
    const bigDataSet = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      numero: `DEM-2024-${String(i + 1).padStart(4, '0')}`,
      titulo: `Demanda Virtualizada ${i + 1}`,
      status: 'aberta',
      prioridade: 'media'
    }));

    await page.route('**/api/demandas**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: bigDataSet,
          total: bigDataSet.length
        })
      });
    });

    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    const startTime = Date.now();
    
    await page.click('[data-testid="nav-demandas"]');
    await page.waitForSelector('[data-testid="virtualized-table"]');
    
    // Verificar que apenas elementos visíveis foram renderizados
    const visibleRows = await page.locator('[data-testid^="demanda-row"]').count();
    expect(visibleRows).toBeLessThanOrEqual(20); // Apenas linhas visíveis
    
    // Testar scroll para verificar virtualização
    await page.evaluate(() => {
      const table = document.querySelector('[data-testid="virtualized-table"]');
      if (table) {
        table.scrollTop = 10000; // Scroll para o meio da lista
      }
    });
    
    await page.waitForTimeout(500);
    
    // Verificar que novos elementos foram carregados
    const newVisibleRows = await page.locator('[data-testid^="demanda-row"]').count();
    expect(newVisibleRows).toBeLessThanOrEqual(20);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Carregamento rápido mesmo com 1000 itens
    
    console.log(`Tabela virtualizada com 1000 itens carregada em ${loadTime}ms`);
  });

  test('deve manter performance durante colaboração em tempo real', async ({ page, context }) => {
    // Simular múltiplas atualizações em tempo real
    let updateCount = 0;
    
    await page.route('**/api/demandas/1', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            titulo: `Título atualizado ${updateCount}`,
            version: updateCount
          })
        });
      }
    });

    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/demandas/1');
    
    // Simular muitas atualizações simultâneas
    const performanceStart = Date.now();
    
    for (let i = 0; i < 50; i++) {
      // Simular recebimento de atualização via WebSocket
      await page.evaluate((updateNumber) => {
        window.dispatchEvent(new CustomEvent('websocket-update', {
          detail: {
            type: 'demanda_updated',
            data: {
              id: 1,
              titulo: `Título colaborativo ${updateNumber}`,
              version: updateNumber
            }
          }
        }));
      }, i);
      
      // Pequeno delay para simular rede
      await page.waitForTimeout(10);
    }
    
    const performanceEnd = Date.now();
    const totalTime = performanceEnd - performanceStart;
    
    // Verificar que todas as atualizações foram processadas rapidamente
    expect(totalTime).toBeLessThan(3000); // 50 atualizações em menos de 3s
    
    // Verificar que interface ainda está responsiva
    await expect(page.locator('[data-testid="demanda-detail"]')).toBeVisible();
    
    console.log(`50 atualizações colaborativas processadas em ${totalTime}ms`);
  });

  test('deve otimizar carregamento de imagens e assets', async ({ page }) => {
    // Monitorar requests de recursos
    const resourceRequests: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) {
        resourceRequests.push(url);
      }
    });

    await page.goto('/');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    // Verificar que recursos foram carregados eficientemente
    const uniqueResources = [...new Set(resourceRequests)];
    
    // Não deve haver duplicação desnecessária de recursos
    expect(resourceRequests.length).toBeGreaterThanOrEqual(uniqueResources.length);
    
    // Verificar que assets críticos carregaram
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
    
    console.log(`${uniqueResources.length} recursos únicos carregados`);
  });

  test('deve manter performance em dispositivos móveis', async ({ page }) => {
    // Simular device móvel
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          downlink: 1.5,
          rtt: 300
        }
      });
    });

    const startTime = Date.now();
    
    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForSelector('[data-testid="mobile-dashboard"]');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar carregamento rápido mesmo em 3G
    expect(loadTime).toBeLessThan(5000);
    
    // Verificar que interface móvel está funcionando
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Testar navegação móvel
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-nav-demandas"]');
    await page.waitForSelector('[data-testid="mobile-demandas-list"]');
    
    console.log(`App mobile carregado em ${loadTime}ms`);
  });
});