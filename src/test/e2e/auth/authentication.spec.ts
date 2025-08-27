import { test, expect, Page } from '@playwright/test';

test.describe('Fluxo de Autenticação Externa', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock do backend de autenticação
    await page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/api/auth/login') && method === 'POST') {
        const postData = route.request().postDataJSON();
        
        if (postData.username === 'testuser' && postData.password === 'password') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: {
                id: '123',
                username: 'testuser',
                displayName: 'Test User',
                email: 'test@example.com',
                permissions: ['read', 'write'],
                groups: ['users']
              },
              token: 'mock-jwt-token-123',
              refreshToken: 'mock-refresh-token-456',
              expiresIn: 3600
            })
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Credenciais inválidas'
            })
          });
        }
      }
      
      if (url.includes('/api/auth/refresh') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-refreshed-token-789',
            expiresIn: 3600
          })
        });
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('deve realizar login com credenciais válidas', async () => {
    await page.goto('/');
    
    // Verificar se página de login é exibida
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Preencher formulário de login
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    
    // Clicar em login
    await page.click('[data-testid="login-button"]');
    
    // Aguardar redirecionamento para dashboard
    await page.waitForURL('/dashboard');
    
    // Verificar elementos do dashboard logado
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
    
    // Verificar se token foi salvo no localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBe('mock-jwt-token-123');
  });

  test('deve exibir erro com credenciais inválidas', async () => {
    await page.goto('/');
    
    // Preencher com credenciais inválidas
    await page.fill('[data-testid="username-input"]', 'wronguser');
    await page.fill('[data-testid="password-input"]', 'wrongpass');
    
    // Tentar fazer login
    await page.click('[data-testid="login-button"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Credenciais inválidas');
    
    // Verificar que permaneceu na página de login
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('deve fazer logout corretamente', async () => {
    // Realizar login primeiro
    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Abrir menu do usuário
    await page.click('[data-testid="user-menu"]');
    
    // Clicar em logout
    await page.click('[data-testid="logout-button"]');
    
    // Verificar redirecionamento para login
    await page.waitForURL('/');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Verificar que token foi removido
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('deve persistir sessão após refresh da página', async () => {
    // Realizar login
    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Refresh da página
    await page.reload();
    
    // Verificar que ainda está logado
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.url()).toContain('/dashboard');
  });

  test('deve renovar token automaticamente quando expira', async () => {
    // Mock token expirado
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'expired-token');
      localStorage.setItem('refresh_token', 'mock-refresh-token-456');
    });

    await page.goto('/dashboard');
    
    // Aguardar renovação automática do token
    await page.waitForTimeout(1000);
    
    // Verificar que novo token foi salvo
    const newToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(newToken).toBe('mock-refreshed-token-789');
    
    // Verificar que usuário permanece logado
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});

test.describe('Integração com Sistema Externo (PHP Backend)', () => {
  test('deve lidar com diferentes tipos de resposta do backend PHP', async ({ page }) => {
    // Mock responses específicas do PHP
    await page.route('**/api/auth/php-login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            usuario_id: '456',
            nome_usuario: 'phpuser',
            nome_completo: 'PHP User',
            email_usuario: 'php@example.com',
            permissoes: 'read,write,admin',
            grupos: 'usuarios,administradores',
            ultimo_login: '2024-01-15 10:30:00'
          },
          token_acesso: 'php-jwt-token-abc',
          token_renovacao: 'php-refresh-token-def'
        })
      });
    });

    await page.goto('/');
    
    // Simular login via PHP
    await page.evaluate(() => {
      // Simular chamada para PHP backend
      window.dispatchEvent(new CustomEvent('php-auth-response', {
        detail: {
          status: 'success',
          user: {
            id: '456',
            username: 'phpuser',
            displayName: 'PHP User',
            permissions: ['read', 'write', 'admin']
          }
        }
      }));
    });
    
    // Verificar integração bem-sucedida
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Verificar dados específicos do PHP
    const userData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('current_user') || '{}');
    });
    
    expect(userData.username).toBe('phpuser');
    expect(userData.permissions).toContain('admin');
  });

  test('deve realizar fallback para LDAP quando PHP falha', async ({ page }) => {
    // Mock falha do PHP, sucesso do LDAP
    let phpCallCount = 0;
    
    await page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('php-login')) {
        phpCallCount++;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'PHP server unavailable'
          })
        });
      } else if (url.includes('ldap-login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            provider: 'LDAP',
            user: {
              id: '789',
              username: 'ldapuser',
              displayName: 'LDAP User',
              permissions: ['read']
            }
          })
        });
      }
    });

    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Aguardar fallback
    await page.waitForTimeout(2000);
    
    // Verificar que login foi bem-sucedido via LDAP
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Verificar que PHP foi tentado primeiro
    expect(phpCallCount).toBeGreaterThan(0);
  });
});