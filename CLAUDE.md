# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Visão Geral do Projeto

Synapse é um sistema de gestão de documentos e demandas baseado em React, construído com TypeScript e Vite. A aplicação gerencia demandas legais ou administrativas com recursos para manipulação de documentos, categorização e relatórios.

## Comandos Principais

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento com hot reload
npm run build        # Build para produção (compilação TypeScript + build Vite)
npm run lint         # Executa ESLint para verificações de qualidade do código
npm run preview      # Visualiza build de produção localmente
npm run export-tree  # Gera documentação da estrutura do projeto
```

### Verificação de Tipos
O projeto usa TypeScript com configurações separadas:
- `tsconfig.app.json` - Configuração do código da aplicação
- `tsconfig.node.json` - Configuração das ferramentas de build Node.js
- Execute `tsc -b` para verificação de tipos (incluído no comando build)

## Arquitetura

### Estrutura de Pastas Atual (Pós-Reorganização)
O projeto segue uma arquitetura baseada em features com clara separação de responsabilidades:

```
src/
├── app/                      # Núcleo da aplicação e inicialização
│   ├── contexts/            # Contextos React (AuthContext)
│   ├── router/              # Configuração de rotas e lazy loading
│   ├── stores/              # Stores Zustand (gerenciamento de estado global)
│   ├── App.tsx              # Componente raiz da aplicação
│   └── main.tsx             # Ponto de entrada da aplicação
├── shared/                   # Recursos compartilhados entre features
│   ├── components/          # Componentes reutilizáveis
│   │   ├── layout/          # Header, Sidebar, AppLayout
│   │   ├── ui/              # Componentes básicos de UI (Button, Modal, etc.)
│   │   ├── charts/          # Wrappers ECharts e componentes de gráficos
│   │   ├── forms/           # Componentes relacionados a formulários
│   │   ├── demands/         # Componentes específicos de demandas
│   │   ├── documents/       # Componentes específicos de documentos
│   │   └── auth/            # Componentes de autenticação
│   ├── hooks/               # Custom hooks e utilitários
│   ├── services/            # Serviços de API e utilitários
│   ├── utils/               # Funções auxiliares e utilitários
│   ├── types/               # Definições de tipos TypeScript
│   ├── data/                # Dados mock e dados estáticos
│   └── styles/              # Estilos compartilhados e tokens de design
└── pages/                    # Componentes de página baseados em features
    ├── dashboard/           # Dashboard/HomePage com hooks e componentes
    ├── demandas/            # Páginas de gestão de demandas
    ├── documentos/          # Páginas de gestão de documentos
    ├── cadastros/           # Páginas de registro/configuração
    └── configuracoes/       # Páginas de configurações
```

### Estrutura de Roteamento
A aplicação usa React Router com estrutura de rotas aninhadas:
- **Layout Raiz**: `App.tsx` fornece layout header/sidebar (localizado em `src/app/`)
- **Seções Principais**: Demandas, Documentos, Cadastros, Configurações, Relatórios
- **Rotas Aninhadas**: Cada seção tem páginas de detalhes e operações CRUD

### Gerenciamento de Estado
- **Zustand Stores**: Gerenciamento de estado moderno com performance otimizada
- **GlobalStore**: Estado centralizado da aplicação (tema, notificações, preferências, sidebar)
- **DemandasStore**: Gestão completa de demandas com cache e operações CRUD
- **DocumentosStore**: Operações de documentos com filtros avançados e manipulação de arquivos
- **Estado Local**: Estado a nível de componente apenas para interações de UI

### Camada de Dados
Arquivos de dados mock em `src/shared/data/` simulam respostas do backend:
- `mockDemandas.ts` - Entidades principais de demandas
- `mockAssuntos.ts`, `mockOrgaos.ts`, etc. - Dados de referência para dropdowns
- Os dados seguem interfaces TypeScript para type safety

### Organização de Componentes
- **Componentes de Layout**: `src/shared/components/layout/` - Header, Sidebar, layouts de página
- **Componentes de UI**: `src/shared/components/ui/` - Elementos reutilizáveis (Button, StatusBadge)
- **Componentes de Formulário**: `src/shared/components/forms/` - SearchableSelect e utilitários de formulário
- **Páginas**: Organizadas por área de feature (`src/pages/cadastros/`, `src/pages/configuracoes/`)
- **Componentes de Negócio**: `src/shared/components/demands/`, `src/shared/components/documents/` - Componentes específicos do domínio

### Padrões Principais
1. **Estrutura de Página**: A maioria das páginas seguem CadastroPageLayout para UI consistente
2. **Dados Mock**: Todas as fontes de dados estão atualmente mockadas - considere isso ao implementar features
3. **Type Safety**: Uso intenso de interfaces TypeScript em toda a aplicação
4. **Arquitetura de Store**: Stores Zustand com cache inteligente e seletores otimizados
5. **Navegação Sidebar**: Sidebar dinâmica com funcionalidade de menu colapsável controlada pelo GlobalStore

### Arquitetura de Store (Zustand)

#### Arquivos de Store
- **`src/app/stores/globalStore.ts`** - Estado da aplicação (tema, notificações, sidebar, preferências)
- **`src/app/stores/demandasStore.ts`** - CRUD de demandas com cache (TTL: 5min)
- **`src/app/stores/documentosStore.ts`** - Documentos com busca avançada (TTL: 3min)
- **`src/app/stores/index.ts`** - Exports centralizados e utilitários

#### Recursos Principais
- **Cache Inteligente**: Cache baseado em TTL para performance
- **Seletores Otimizados**: Previnem re-renders desnecessários
- **TypeScript Safety**: Inferência e validação de tipos completa
- **Devtools**: Utilitários de debug disponíveis em desenvolvimento
- **Persistência**: Preferências do usuário salvas no localStorage

#### Padrões de Uso
```typescript
// Estado global
const { sidebarOpen, setSidebarOpen } = useSidebar();
const { addNotification } = useNotifications();

// Gestão de demandas  
const { demandas, isLoading } = useDemandasData();
const { createDemanda, updateDemanda } = useDemandasActions();

// Documentos com busca
const { documentos, searchTerm } = useDocumentosData(); 
const { setSearchTerm, clearFilters } = useDocumentosActions();
```

### Notas de Desenvolvimento
- **Framework de Testes Completo**: Vitest + React Testing Library + Playwright configurados com 256+ arquivos TypeScript
- **Qualidade de Código**: ESLint configurado com regras type-aware habilitadas e Prettier para formatação
- **Build System**: Vite usado para builds rápidos de desenvolvimento e HMR otimizado
- **Arquitetura**: Todos os componentes são funcionais usando React hooks com TypeScript strict mode
- **Cobertura de Testes**: Sistema abrangente de testes unitários, integração e end-to-end

## Atualizações Recentes & Features

### Navegação Sidebar (Atualizada)
A sidebar agora suporta dois estados:
- **Expandida**: Mostra todos os itens de menu incluindo seções "Cadastros" e "Configurações"
- **Colapsada**: Mostra apenas ícones principais (Início, Demandas, Documentos, Relatórios) como botões clicáveis
- **Toggle**: Controlado pelo botão de menu hamburguer no cabeçalho
- **Responsiva**: Colapsa automaticamente em telas ≤768px
- **Espaçamento Consistente**: Ícones mantêm o mesmo alinhamento vertical em ambos os estados

Arquivos principais:
- `src/shared/components/layout/Sidebar.tsx` - Componente principal da sidebar com prop `isCollapsed`
- `src/shared/components/layout/Sidebar.module.css` - Estilos responsivos para estados colapsado/expandido
- `src/shared/components/layout/AppLayout.tsx` - Controla o estado da sidebar via `isSidebarCollapsed`

### Design do Header (Atualizado) 
O cabeçalho agora apresenta um design limpo e com marca:
- **Ícone da App**: Logo SVG customizado localizado em `/public/synapse-icon.svg` (32px, circular)
- **Título Fixo**: Sempre mostra "Synapse" (sem títulos de página dinâmicos)
- **Layout**: Botão Menu → Ícone + "Synapse" → Espaçador → "Olá, Alan!" + "Sair"
- **Sem Breadcrumbs**: Removidos breadcrumbs de navegação dinâmica para visual mais limpo

Arquivos principais:
- `src/shared/components/layout/Header.tsx` - Header simplificado com branding da aplicação
- `src/shared/components/layout/Header.module.css` - Estilos de ícone e branding
- `/public/synapse-icon.svg` - Arquivo do ícone da app (fornecido pelo usuário)

### Melhorias em Formulários

#### Página Novo Documento
Comportamento de autocomplete aprimorado para campos destinatário/endereçamento:
- **Lista Destinatário**: Combina `nomeFantasia` de `mockProvedores` + `nome` de `mockAutoridades`
- **Autocomplete Inteligente**: 
  - Se destinatário é de `mockProvedores` → preenche automaticamente endereçamento com `razaoSocial` correspondente
  - Se destinatário é de `mockAutoridades` → deixa endereçamento vazio
- **Lista Endereçamento Dinâmica**:
  - Quando destinatário é provedor → mostra apenas `razaoSocial` de `mockProvedores`
  - Quando destinatário é autoridade → mostra apenas `nomeCompleto` de `mockOrgaos`

#### Página Nova/Editar Demanda
Atualizações de campos do formulário:
- **"Autos Administrativos"**: Tornado opcional (removido atributo `required` e asterisco vermelho)
- **Navegação**: Corrigido botão "Voltar" para usar `navigate(-1)` ao invés de rota hardcoded

Arquivos principais:
- `src/pages/documentos/NovoDocumentoPage.tsx` - Lógica aprimorada de destinatário/endereçamento
- `src/pages/demandas/NovaDemandaPage.tsx` - Campo autos administrativos opcional

### Configuração de Segurança

#### Content Security Policy (CSP)
- **Implementação**: Sistema CSP robusto em `src/shared/services/security/csp.ts`
- **Meta Tags vs HTTP Headers**: Diretivas como `frame-ancestors` só funcionam via cabeçalhos HTTP
- **Configuração Automática**: Em desenvolvimento, instruções são exibidas no console
- **Produção**: Ver `SECURITY.md` para configuração no servidor (Apache/Nginx/PHP)

#### Progressive Web App (PWA)
- **Manifest**: Configuração completa em `/public/manifest.json` 
- **Meta Tags**: Atualizadas com padrões modernos (`mobile-web-app-capable`)
- **Compatibilidade**: Suporte para iOS, Android, Windows (browserconfig.xml)
- **Icons**: Ícone SVG otimizado para todas as plataformas

### Dashboard Layout & Charts (Janeiro 2025)

#### Grid Layout Optimization
- **Fixed Grid System**: Implementação de layouts grid fixos para pares de cards
- **Proportional Layouts**: Sistema 65/35 e 50/50 para distribuição consistente
- **Responsive Behavior**: Grids mantêm proporções em todas as breakpoints
- **Flex vs Grid**: Remoção de conflitos entre propriedades flex e display: grid

#### Chart Standardization
- **Uniform Heights**: Padronização de alturas dos gráficos em 350px
- **Legend Positioning**: Ajuste de legendas para top: 20 para melhor aproveitamento
- **Header Spacing**: Redução de margens de cabeçalho de 1.5rem para 0.5rem
- **Section Gaps**: Otimização de espaçamento entre seções (1rem padrão)

#### ECharts Integration
- **Inline Styles**: Aplicação de `style={{ height: '350px', minHeight: '350px' }}` para garantia de altura
- **Wrapper Optimization**: Melhorias no componente `EChartsWrapper` para performance
- **Size Sensor**: Polyfill para resolver problemas de dimensionamento (`src/shared/utils/sizeSensorPolyfill.ts`)
- **Skeleton Loading**: Ajuste de skeletons para corresponder às alturas finais dos gráficos

## Documentação Complementar

Para informações detalhadas sobre o projeto, consulte a documentação organizada em `docs/`:

- **[Status Atual](./docs/CURRENT_STATUS.md)** - Estado real do projeto e funcionalidades implementadas
- **[Roadmap Backend](./docs/FUTURE_BACKEND.md)** - Planos para evolução e backend
- **[Convenções de Nomenclatura](./docs/NAMING_CONVENTIONS.md)** - Padrões de código e nomenclatura
- **[Guia de Estilos](./docs/STYLING_GUIDE.md)** - Filosofia CSS Modules e design tokens
- **[Guia de Integração](./docs/INTEGRATION_GUIDE.md)** - Integração com sistemas externos
- **[Migração de Backend](./docs/BACKEND_MIGRATION.md)** - Histórico de migração PHP → Node.js

#### Arquivos Principais Atualizados (2025):
- `src/pages/dashboard/styles/HomePage.module.css` - Grid layouts fixos e classes de margem
- `src/pages/dashboard/styles/ChartContainer.module.css` - Margens de cabeçalho otimizadas
- `src/shared/components/charts/*/` - Padronização de alturas e styles inline
- `src/pages/dashboard/components/Lazy*Analysis.tsx` - Ajuste de skeletons e espaçamentos
- `vite.config.ts` - Configuração HMR e polyfill para size-sensor

### Padrões de Código & Melhores Práticas
1. **Design Responsivo**: Componentes se adaptam a estados colapsado/expandido e tamanhos de tela
2. **Lógica Inteligente de Formulário**: Comportamento dinâmico de campos baseado em seleções do usuário
3. **Navegação Consistente**: Comportamento adequado do botão voltar usando React Router
4. **TypeScript Safety**: Todas as novas features mantêm type checking rigoroso
5. **CSS Modules**: Estilização scoped com integração de tokens de design
6. **Segurança em Primeiro**: CSP implementado com separação adequada entre meta tags e cabeçalhos HTTP
7. **Segurança DOM**: Manipulação DOM null-safe com funções utilitárias (`src/shared/utils/domUtils.ts`)
8. **Consistência de Gráficos**: Alturas uniformes, estilos inline e comportamento responsivo em todos os gráficos
9. **Layouts Grid**: Grids proporcionais fixos (65/35, 50/50) com manutenção responsiva
10. **Performance**: Lazy loading, memoization e re-renders otimizados para componentes de dashboard