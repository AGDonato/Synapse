import { test, expect, Page } from '@playwright/test';

test.describe('CRUD de Demandas - Fluxo Completo', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock APIs
    let demandas: any[] = [
      {
        id: 1,
        numero: 'DEM-2024-001',
        titulo: 'Demanda Existente',
        descricao: 'Demanda para testes',
        status: 'aberta',
        prioridade: 'media',
        dataInicial: '01/01/2024',
        prazo: '31/12/2024',
        orgaoId: 1,
        assuntoId: 1,
        tipoId: 1
      }
    ];

    await page.route('**/api/demandas**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (method === 'GET' && !url.includes('/api/demandas/')) {
        // Lista de demandas
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: demandas,
            total: demandas.length,
            page: 1,
            limit: 10
          })
        });
      } else if (method === 'GET' && url.match(/\/api\/demandas\/\d+$/)) {
        // Demanda específica
        const id = parseInt(url.split('/').pop() || '0');
        const demanda = demandas.find(d => d.id === id);
        
        if (demanda) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(demanda)
          });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else if (method === 'POST') {
        // Criar demanda
        const newDemanda = route.request().postDataJSON();
        const demanda = {
          ...newDemanda,
          id: demandas.length + 1,
          numero: `DEM-2024-${String(demandas.length + 1).padStart(3, '0')}`
        };
        demandas.push(demanda);
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(demanda)
        });
      } else if (method === 'PUT') {
        // Atualizar demanda
        const id = parseInt(url.split('/').pop() || '0');
        const updateData = route.request().postDataJSON();
        const index = demandas.findIndex(d => d.id === id);
        
        if (index !== -1) {
          demandas[index] = { ...demandas[index], ...updateData };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(demandas[index])
          });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else if (method === 'DELETE') {
        // Deletar demanda
        const id = parseInt(url.split('/').pop() || '0');
        const index = demandas.findIndex(d => d.id === id);
        
        if (index !== -1) {
          demandas.splice(index, 1);
          await route.fulfill({ status: 204 });
        } else {
          await route.fulfill({ status: 404 });
        }
      }
    });

    // Mock dados de referência
    await page.route('**/api/orgaos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 1, nome: 'Tribunal de Justiça', sigla: 'TJ' },
            { id: 2, nome: 'Ministério Público', sigla: 'MP' }
          ]
        })
      });
    });

    await page.route('**/api/assuntos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 1, nome: 'Processo Civil', codigo: 'PROC_CIVIL' },
            { id: 2, nome: 'Processo Penal', codigo: 'PROC_PENAL' }
          ]
        })
      });
    });

    await page.route('**/api/tipos-demandas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 1, nome: 'Ofício', codigo: 'OFICIO' },
            { id: 2, nome: 'Solicitação', codigo: 'SOLICITACAO' }
          ]
        })
      });
    });

    // Login
    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('deve listar demandas existentes', async () => {
    // Navegar para lista de demandas
    await page.click('[data-testid="nav-demandas"]');
    await page.waitForURL('/demandas');
    
    // Verificar que lista carregou
    await expect(page.locator('[data-testid="demandas-table"]')).toBeVisible();
    
    // Verificar demanda existente
    await expect(page.locator('[data-testid="demanda-row-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="demanda-numero-1"]')).toContainText('DEM-2024-001');
    await expect(page.locator('[data-testid="demanda-titulo-1"]')).toContainText('Demanda Existente');
    await expect(page.locator('[data-testid="demanda-status-1"]')).toContainText('Aberta');
  });

  test('deve criar nova demanda com sucesso', async () => {
    // Navegar para formulário de nova demanda
    await page.click('[data-testid="nav-demandas"]');
    await page.waitForURL('/demandas');
    await page.click('[data-testid="nova-demanda-button"]');
    await page.waitForURL('/demandas/nova');
    
    // Preencher formulário
    await page.fill('[data-testid="titulo-input"]', 'Nova Demanda E2E');
    await page.fill('[data-testid="descricao-textarea"]', 'Descrição da nova demanda criada via E2E');
    
    // Selecionar dropdowns
    await page.selectOption('[data-testid="orgao-select"]', '1');
    await page.selectOption('[data-testid="assunto-select"]', '1');
    await page.selectOption('[data-testid="tipo-select"]', '1');
    await page.selectOption('[data-testid="prioridade-select"]', 'alta');
    
    // Preencher datas
    await page.fill('[data-testid="data-inicial-input"]', '01/02/2024');
    await page.fill('[data-testid="prazo-input"]', '28/02/2024');
    
    // Salvar
    await page.click('[data-testid="salvar-button"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Demanda criada com sucesso');
    
    // Verificar redirecionamento para lista
    await page.waitForURL('/demandas');
    
    // Verificar nova demanda na lista
    await expect(page.locator('[data-testid="demanda-row-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="demanda-titulo-2"]')).toContainText('Nova Demanda E2E');
  });

  test('deve validar campos obrigatórios no formulário', async () => {
    await page.click('[data-testid="nav-demandas"]');
    await page.click('[data-testid="nova-demanda-button"]');
    
    // Tentar salvar sem preencher campos obrigatórios
    await page.click('[data-testid="salvar-button"]');
    
    // Verificar mensagens de validação
    await expect(page.locator('[data-testid="titulo-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="titulo-error"]')).toContainText('Título é obrigatório');
    
    await expect(page.locator('[data-testid="orgao-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="assunto-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="tipo-error"]')).toBeVisible();
    
    // Preencher apenas título
    await page.fill('[data-testid="titulo-input"]', 'Teste Validação');
    
    // Verificar que erro do título desapareceu
    await expect(page.locator('[data-testid="titulo-error"]')).not.toBeVisible();
    
    // Mas outros erros persistem
    await page.click('[data-testid="salvar-button"]');
    await expect(page.locator('[data-testid="orgao-error"]')).toBeVisible();
  });

  test('deve visualizar detalhes de uma demanda', async () => {
    await page.click('[data-testid="nav-demandas"]');
    
    // Clicar na demanda existente
    await page.click('[data-testid="demanda-row-1"]');
    await page.waitForURL('/demandas/1');
    
    // Verificar carregamento dos detalhes
    await expect(page.locator('[data-testid="demanda-detail"]')).toBeVisible();
    
    // Verificar informações básicas
    await expect(page.locator('[data-testid="demanda-numero"]')).toContainText('DEM-2024-001');
    await expect(page.locator('[data-testid="demanda-titulo"]')).toContainText('Demanda Existente');
    await expect(page.locator('[data-testid="demanda-status"]')).toContainText('Aberta');
    
    // Verificar abas disponíveis
    await expect(page.locator('[data-testid="tab-informacoes"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-documentos"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-historico"]')).toBeVisible();
  });

  test('deve editar demanda existente', async () => {
    await page.click('[data-testid="nav-demandas"]');
    await page.click('[data-testid="demanda-row-1"]');
    
    // Clicar em editar
    await page.click('[data-testid="editar-button"]');
    await page.waitForURL('/demandas/1/editar');
    
    // Verificar que formulário está preenchido
    await expect(page.locator('[data-testid="titulo-input"]')).toHaveValue('Demanda Existente');
    
    // Fazer alterações
    await page.fill('[data-testid="titulo-input"]', 'Demanda Editada E2E');
    await page.selectOption('[data-testid="status-select"]', 'em_andamento');
    await page.selectOption('[data-testid="prioridade-select"]', 'alta');
    
    // Adicionar observações
    await page.fill('[data-testid="observacoes-textarea"]', 'Demanda atualizada via teste E2E');
    
    // Salvar alterações
    await page.click('[data-testid="salvar-button"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Demanda atualizada com sucesso');
    
    // Verificar redirecionamento para detalhes
    await page.waitForURL('/demandas/1');
    
    // Verificar alterações aplicadas
    await expect(page.locator('[data-testid="demanda-titulo"]')).toContainText('Demanda Editada E2E');
    await expect(page.locator('[data-testid="demanda-status"]')).toContainText('Em Andamento');
    await expect(page.locator('[data-testid="demanda-prioridade"]')).toContainText('Alta');
  });

  test('deve filtrar demandas por status', async () => {
    await page.click('[data-testid="nav-demandas"]');
    
    // Aplicar filtro por status
    await page.click('[data-testid="filtros-button"]');
    await page.selectOption('[data-testid="filter-status-select"]', 'aberta');
    await page.click('[data-testid="aplicar-filtros-button"]');
    
    // Verificar que apenas demandas abertas são exibidas
    await expect(page.locator('[data-testid="demanda-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="demanda-status-1"]')).toContainText('Aberta');
    
    // Limpar filtros
    await page.click('[data-testid="limpar-filtros-button"]');
    
    // Verificar que todas as demandas voltaram
    await expect(page.locator('[data-testid="demanda-row"]')).toHaveCount(1); // Apenas 1 na nossa base mock
  });

  test('deve pesquisar demandas por texto', async () => {
    await page.click('[data-testid="nav-demandas"]');
    
    // Usar campo de busca
    await page.fill('[data-testid="search-input"]', 'Existente');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verificar resultado da busca
    await expect(page.locator('[data-testid="demanda-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="demanda-titulo-1"]')).toContainText('Demanda Existente');
    
    // Buscar por termo que não existe
    await page.fill('[data-testid="search-input"]', 'Inexistente');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verificar que nenhum resultado foi encontrado
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results-message"]')).toContainText('Nenhuma demanda encontrada');
    
    // Limpar busca
    await page.fill('[data-testid="search-input"]', '');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verificar que resultados voltaram
    await expect(page.locator('[data-testid="demanda-row"]')).toHaveCount(1);
  });

  test('deve excluir demanda com confirmação', async () => {
    await page.click('[data-testid="nav-demandas"]');
    await page.click('[data-testid="demanda-row-1"]');
    
    // Clicar em excluir
    await page.click('[data-testid="excluir-button"]');
    
    // Verificar modal de confirmação
    await expect(page.locator('[data-testid="confirm-delete-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-delete-message"]'))
      .toContainText('Tem certeza que deseja excluir a demanda "Demanda Existente"?');
    
    // Cancelar exclusão
    await page.click('[data-testid="cancel-delete-button"]');
    await expect(page.locator('[data-testid="confirm-delete-modal"]')).not.toBeVisible();
    
    // Tentar excluir novamente
    await page.click('[data-testid="excluir-button"]');
    
    // Confirmar exclusão
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Demanda excluída com sucesso');
    
    // Verificar redirecionamento para lista
    await page.waitForURL('/demandas');
    
    // Verificar que demanda não está mais na lista
    await expect(page.locator('[data-testid="demanda-row-1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
  });

  test('deve navegar entre páginas da lista', async () => {
    // Primeiro, criar mais demandas para testar paginação
    for (let i = 2; i <= 15; i++) {
      await page.click('[data-testid="nav-demandas"]');
      await page.click('[data-testid="nova-demanda-button"]');
      
      await page.fill('[data-testid="titulo-input"]', `Demanda ${i}`);
      await page.selectOption('[data-testid="orgao-select"]', '1');
      await page.selectOption('[data-testid="assunto-select"]', '1');
      await page.selectOption('[data-testid="tipo-select"]', '1');
      
      await page.click('[data-testid="salvar-button"]');
      await page.waitForURL('/demandas');
    }
    
    // Verificar controles de paginação
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-info"]')).toContainText('1-10 de 15');
    
    // Ir para próxima página
    await page.click('[data-testid="next-page-button"]');
    
    // Verificar que está na página 2
    await expect(page.locator('[data-testid="page-info"]')).toContainText('11-15 de 15');
    await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    
    // Voltar para página anterior
    await page.click('[data-testid="prev-page-button"]');
    
    // Verificar que voltou para página 1
    await expect(page.locator('[data-testid="page-info"]')).toContainText('1-10 de 15');
    await expect(page.locator('[data-testid="current-page"]')).toContainText('1');
  });
});