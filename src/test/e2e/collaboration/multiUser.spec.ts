import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('Colaboração Multi-Usuário', () => {
  let browser1: Browser;
  let browser2: Browser;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let user1Page: Page;
  let user2Page: Page;

  test.beforeEach(async ({ browser }) => {
    // Criar duas instâncias de browser para simular usuários diferentes
    browser1 = browser;
    browser2 = await browser1.browserType().launch();
    
    context1 = await browser1.newContext();
    context2 = await browser2.newContext();
    
    user1Page = await context1.newPage();
    user2Page = await context2.newPage();

    // Mock WebSocket para colaboração em tempo real
    const mockWebSocketServer = (page: Page, userId: string) => {
      return page.addInitScript((userId) => {
        // Mock WebSocket
        class MockWebSocket {
          static instances: MockWebSocket[] = [];
          
          readyState = 1; // OPEN
          onopen: any = null;
          onmessage: any = null;
          onclose: any = null;
          onerror: any = null;
          
          constructor(public url: string) {
            MockWebSocket.instances.push(this);
            setTimeout(() => {
              if (this.onopen) this.onopen(new Event('open'));
            }, 100);
          }
          
          send(data: string) {
            const message = JSON.parse(data);
            message.userId = userId;
            message.timestamp = Date.now();
            
            // Broadcast para outras instâncias
            MockWebSocket.instances.forEach(instance => {
              if (instance !== this && instance.onmessage) {
                setTimeout(() => {
                  instance.onmessage(new MessageEvent('message', {
                    data: JSON.stringify({
                      ...message,
                      type: message.type + '_broadcast'
                    })
                  }));
                }, 50);
              }
            });
          }
          
          close() {
            const index = MockWebSocket.instances.indexOf(this);
            if (index > -1) {
              MockWebSocket.instances.splice(index, 1);
            }
          }
        }
        
        (window as any).WebSocket = MockWebSocket;
        (window as any).__userId = userId;
      }, userId);
    };

    await mockWebSocketServer(user1Page, 'user1');
    await mockWebSocketServer(user2Page, 'user2');

    // Mock API responses
    const mockApiResponses = async (page: Page) => {
      await page.route('**/api/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();
        
        if (url.includes('/demandas') && method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [{
                id: 1,
                numero: 'DEM-2024-001',
                titulo: 'Demanda Colaborativa',
                status: 'aberta',
                version: 1
              }],
              total: 1
            })
          });
        }
        
        if (url.includes('/demandas/1') && method === 'PUT') {
          const updateData = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...updateData,
              id: 1,
              version: (updateData.version || 1) + 1
            })
          });
        }
      });
    };

    await mockApiResponses(user1Page);
    await mockApiResponses(user2Page);

    // Login dos usuários
    await user1Page.goto('/');
    await user1Page.fill('[data-testid="username-input"]', 'user1');
    await user1Page.fill('[data-testid="password-input"]', 'password1');
    await user1Page.click('[data-testid="login-button"]');
    await user1Page.waitForURL('/dashboard');

    await user2Page.goto('/');
    await user2Page.fill('[data-testid="username-input"]', 'user2');
    await user2Page.fill('[data-testid="password-input"]', 'password2');
    await user2Page.click('[data-testid="login-button"]');
    await user2Page.waitForURL('/dashboard');
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
    await browser2.close();
  });

  test('deve mostrar usuários ativos em uma demanda', async () => {
    // User1 abre demanda
    await user1Page.goto('/demandas/1');
    await user1Page.waitForSelector('[data-testid="demanda-detail"]');
    
    // User2 abre a mesma demanda
    await user2Page.goto('/demandas/1');
    await user2Page.waitForSelector('[data-testid="demanda-detail"]');
    
    // Verificar indicadores de presença
    await expect(user1Page.locator('[data-testid="active-users"]')).toBeVisible();
    await expect(user2Page.locator('[data-testid="active-users"]')).toBeVisible();
    
    // User1 deve ver User2 como ativo
    await expect(user1Page.locator('[data-testid="user-avatar-user2"]')).toBeVisible();
    
    // User2 deve ver User1 como ativo
    await expect(user2Page.locator('[data-testid="user-avatar-user1"]')).toBeVisible();
  });

  test('deve gerenciar bloqueios de campo durante edição simultânea', async () => {
    // Ambos usuários acessam a mesma demanda
    await user1Page.goto('/demandas/1');
    await user2Page.goto('/demandas/1');
    
    await user1Page.waitForSelector('[data-testid="demanda-detail"]');
    await user2Page.waitForSelector('[data-testid="demanda-detail"]');
    
    // User1 clica para editar título
    await user1Page.click('[data-testid="edit-titulo-button"]');
    
    // Campo deve estar bloqueado para edição
    await expect(user1Page.locator('[data-testid="titulo-input"]')).not.toBeDisabled();
    await expect(user1Page.locator('[data-testid="field-lock-indicator"]')).toBeVisible();
    
    // User2 tenta editar o mesmo campo
    await user2Page.click('[data-testid="edit-titulo-button"]');
    
    // User2 deve ver que campo está bloqueado
    await expect(user2Page.locator('[data-testid="field-locked-message"]')).toBeVisible();
    await expect(user2Page.locator('[data-testid="field-locked-message"]'))
      .toContainText('Campo sendo editado por user1');
    
    // User2 pode editar outro campo
    await user2Page.click('[data-testid="edit-descricao-button"]');
    await expect(user2Page.locator('[data-testid="descricao-input"]')).not.toBeDisabled();
    
    // User1 salva alteração no título
    await user1Page.fill('[data-testid="titulo-input"]', 'Título editado por User1');
    await user1Page.click('[data-testid="save-titulo-button"]');
    
    // Aguardar sincronização
    await user1Page.waitForTimeout(500);
    
    // User2 deve ver a alteração em tempo real
    await expect(user2Page.locator('[data-testid="titulo-display"]'))
      .toContainText('Título editado por User1');
    
    // Campo deve estar desbloqueado para User2
    await expect(user2Page.locator('[data-testid="field-locked-message"]')).not.toBeVisible();
  });

  test('deve sincronizar alterações em tempo real', async () => {
    await user1Page.goto('/demandas/1');
    await user2Page.goto('/demandas/1');
    
    // User1 faz uma alteração
    await user1Page.click('[data-testid="edit-status-button"]');
    await user1Page.selectOption('[data-testid="status-select"]', 'em_andamento');
    await user1Page.click('[data-testid="save-status-button"]');
    
    // User2 deve ver a alteração instantaneamente
    await expect(user2Page.locator('[data-testid="status-badge"]'))
      .toContainText('Em Andamento');
    
    // Verificar notificação de mudança
    await expect(user2Page.locator('[data-testid="change-notification"]')).toBeVisible();
    await expect(user2Page.locator('[data-testid="change-notification"]'))
      .toContainText('user1 atualizou o status');
  });

  test('deve resolver conflitos de edição concurrent', async () => {
    // Simular edição offline/concorrente
    await user1Page.goto('/demandas/1');
    await user2Page.goto('/demandas/1');
    
    // Desabilitar WebSocket temporariamente para simular offline
    await user1Page.evaluate(() => {
      (window as any).__websocketEnabled = false;
    });
    
    await user2Page.evaluate(() => {
      (window as any).__websocketEnabled = false;
    });
    
    // User1 edita título offline
    await user1Page.click('[data-testid="edit-titulo-button"]');
    await user1Page.fill('[data-testid="titulo-input"]', 'Editado por User1 offline');
    await user1Page.click('[data-testid="save-titulo-button"]');
    
    // User2 edita o mesmo campo offline
    await user2Page.click('[data-testid="edit-titulo-button"]');
    await user2Page.fill('[data-testid="titulo-input"]', 'Editado por User2 offline');
    await user2Page.click('[data-testid="save-titulo-button"]');
    
    // Reabilitar WebSocket (volta online)
    await user1Page.evaluate(() => {
      (window as any).__websocketEnabled = true;
    });
    
    await user2Page.evaluate(() => {
      (window as any).__websocketEnabled = true;
    });
    
    // Aguardar sincronização e resolução de conflito
    await user1Page.waitForTimeout(1000);
    await user2Page.waitForTimeout(1000);
    
    // Sistema deve mostrar diálogo de conflito
    await expect(user1Page.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible();
    await expect(user2Page.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible();
    
    // User1 escolhe manter sua versão
    await user1Page.click('[data-testid="keep-my-changes-button"]');
    
    // User2 escolhe aceitar versão do User1
    await user2Page.click('[data-testid="accept-other-changes-button"]');
    
    // Verificar resolução
    await expect(user1Page.locator('[data-testid="titulo-display"]'))
      .toContainText('Editado por User1 offline');
    
    await expect(user2Page.locator('[data-testid="titulo-display"]'))
      .toContainText('Editado por User1 offline');
  });

  test('deve manter histórico de colaboração', async () => {
    await user1Page.goto('/demandas/1');
    await user2Page.goto('/demandas/1');
    
    // Fazer várias alterações colaborativas
    await user1Page.click('[data-testid="edit-titulo-button"]');
    await user1Page.fill('[data-testid="titulo-input"]', 'Primeira alteração');
    await user1Page.click('[data-testid="save-titulo-button"]');
    
    await user1Page.waitForTimeout(500);
    
    await user2Page.click('[data-testid="edit-status-button"]');
    await user2Page.selectOption('[data-testid="status-select"]', 'em_andamento');
    await user2Page.click('[data-testid="save-status-button"]');
    
    await user2Page.waitForTimeout(500);
    
    await user1Page.click('[data-testid="edit-prioridade-button"]');
    await user1Page.selectOption('[data-testid="prioridade-select"]', 'alta');
    await user1Page.click('[data-testid="save-prioridade-button"]');
    
    // Abrir histórico de atividades
    await user1Page.click('[data-testid="activity-history-button"]');
    
    // Verificar todas as alterações no histórico
    await expect(user1Page.locator('[data-testid="activity-item"]')).toHaveCount(3);
    
    // Verificar detalhes das atividades
    await expect(user1Page.locator('[data-testid="activity-item"]').first())
      .toContainText('user1 alterou prioridade para alta');
    
    await expect(user1Page.locator('[data-testid="activity-item"]').nth(1))
      .toContainText('user2 alterou status para em_andamento');
    
    await expect(user1Page.locator('[data-testid="activity-item"]').nth(2))
      .toContainText('user1 alterou título para Primeira alteração');
  });

  test('deve lidar com desconexão e reconexão de usuários', async () => {
    await user1Page.goto('/demandas/1');
    await user2Page.goto('/demandas/1');
    
    // Verificar que ambos estão ativos
    await expect(user1Page.locator('[data-testid="user-avatar-user2"]')).toBeVisible();
    await expect(user2Page.locator('[data-testid="user-avatar-user1"]')).toBeVisible();
    
    // User2 simula perda de conexão
    await user2Page.evaluate(() => {
      // Simular desconexão
      const mockInstances = (window as any).WebSocket.instances;
      if (mockInstances && mockInstances.length > 0) {
        const ws = mockInstances.find((instance: any) => instance.userId === 'user2');
        if (ws && ws.onclose) {
          ws.onclose(new CloseEvent('close', { code: 1006, reason: 'Network error' }));
        }
      }
    });
    
    // User1 deve ver que User2 se desconectou
    await expect(user1Page.locator('[data-testid="user-avatar-user2"]')).not.toBeVisible();
    await expect(user1Page.locator('[data-testid="user-disconnected-user2"]')).toBeVisible();
    
    // User2 reconecta
    await user2Page.evaluate(() => {
      // Simular reconexão
      location.reload();
    });
    
    await user2Page.waitForLoadState('networkidle');
    await user2Page.goto('/demandas/1');
    
    // Verificar que reconexão foi bem-sucedida
    await expect(user1Page.locator('[data-testid="user-avatar-user2"]')).toBeVisible();
    await expect(user2Page.locator('[data-testid="user-avatar-user1"]')).toBeVisible();
    
    // Verificar notificação de reconexão
    await expect(user1Page.locator('[data-testid="user-reconnected-notification"]'))
      .toContainText('user2 reconectado');
  });
});