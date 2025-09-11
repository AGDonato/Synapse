# Synapse

Sistema de gerenciamento de demandas e documentos jurídicos/administrativos construído com React, TypeScript e Vite.

## 🚀 Características Principais

- **Gerenciamento de Demandas**: Criação, edição e acompanhamento de demandas jurídicas
- **Gestão de Documentos**: Organização de ofícios, decisões judiciais, mídias e outros documentos
- **Análises Avançadas**: Dashboards com gráficos interativos para análise de performance
- **Interface Responsiva**: Layout adaptativo com sidebar colapsável
- **Sistema de Filtros**: Filtros inteligentes para análise de provedores
- **Type Safety**: Desenvolvimento com TypeScript para maior confiabilidade

## 🛠️ Tecnologias

### Core Framework
- **React 19.1** + **TypeScript 5.8** - Framework principal com type safety completa
- **Vite 7.0** - Build tool moderna com HMR otimizado

### Testes (Sistema Completo)
- **Vitest 3** - Test runner principal com cobertura de código
- **React Testing Library 16** - Testes de componentes React
- **Playwright 1.55** - Testes end-to-end automatizados
- **@testing-library/jest-dom** - Matchers customizados para DOM

### Estado e Dados
- **Zustand 5** - Gerenciamento de estado global moderno
- **TanStack React Query 5** - Cache e sincronização de dados
- **React Hook Form 7** - Gestão de formulários performática
- **Zod 4** - Validação de schemas TypeScript-first
- **Immer 10** - Manipulação imutável de estado
- **Ky 1.9** - Cliente HTTP moderno e minimalista

### UI e Visualização
- **ECharts 5.6 + echarts-for-react 3** - Gráficos interativos avançados
- **CSS Modules (55 arquivos)** - Estilização isolada e modular
- **Tailwind-merge + Class Variance Authority** - Utility CSS otimizado
- **Lucide React** - Ícones modernos e otimizados
- **Framer Motion 12** - Animações fluidas e performáticas
- **React Datepicker 8** - Seletor de datas avançado
- **Date-fns 4** - Manipulação moderna de datas
- **React Intersection Observer 9** - Lazy loading e scroll triggers

### Desenvolvimento e Qualidade
- **ESLint 9** + **TypeScript ESLint 8** - Linting avançado com regras type-aware
- **Prettier** - Formatação automática de código
- **Husky** - Git hooks para qualidade
- **lint-staged** - Linting apenas de arquivos modificados

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/AGDonato/Synapse.git

# Entre no diretório
cd Synapse

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Execute os testes para verificar se tudo está funcionando
npm run test:run
```

## 🔧 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento
npm run dev:open     # Servidor dev abrindo navegador
npm run dev:host     # Servidor dev acessível na rede
npm run build        # Build para produção
npm run preview      # Preview da build de produção
npm run lint         # Verificação de código ESLint
npm run lint:fix     # Corrige erros de lint automaticamente
npm run format       # Formata código com Prettier
npm run format:check # Verifica formatação sem alterar
npm run type-check   # Verificação de tipos TypeScript
```

### Testes
```bash
npm run test         # Testes em modo watch
npm run test:run     # Executa testes uma vez
npm run test:coverage # Testes com relatório de cobertura
npm run test:ui      # Interface gráfica dos testes (Vitest UI)
npm run test:unit    # Testes unitários (configurado)
npm run test:e2e     # Testes end-to-end (Playwright)
npm run test:fast    # Execução rápida com reporter mínimo
npm run test:ci      # Executar no CI com coverage JSON
npm run test:all     # Todos os testes (unit + e2e)
```

### Utilitários e Qualidade
```bash
npm run quality      # Verifica tipos, lint e testes
npm run quality:fix  # Corrige problemas automaticamente
npm run check-all    # Verificação completa do código
npm run fix-all      # Corrige lint e formatação
npm run clean        # Limpa build e cache
npm run reset        # Limpa e reinstala dependências
```

### Configuração de Ambiente
```bash
npm run env:setup    # Configura variáveis de ambiente
npm run env:setup:dev # Setup para desenvolvimento
npm run env:setup:staging # Setup para staging
npm run env:setup:prod # Setup para produção
npm run env:validate # Valida configurações de ambiente
```

### Monitoramento e Qualidade
- **Bundle Size Monitoring**: Limites automáticos (500KB JS, 100KB CSS, 800KB vendor)
- **Error Boundaries**: Tratamento robusto de erros em produção
- **GitHub Actions**: Dependabot configurado para atualizações automáticas
- **Git Hooks**: Husky + lint-staged para qualidade antes de commits
- **Performance**: Lazy loading, code splitting, otimizações Vite

## 🏗️ Arquitetura

### Arquitetura Consolidada (Janeiro 2025)
O projeto possui uma **estrutura de pastas organizada** com foco em manutenibilidade e clara separação de responsabilidades:

- **255 arquivos TypeScript/TSX** organizados por features (src/) + **11 arquivos backend**
- **Sistema de documentação técnica** completo em `docs/`
- **Arquitetura baseada em features** com recursos compartilhados
- **Sistema de testes** configurado

### Estrutura de Diretórios

```
📁 Raiz do Projeto
├── .github/                  # 🔧 Configurações GitHub
│   └── pull_request_template.md # Template para PRs
├── .husky/                   # 🔒 Git hooks
│   └── pre-commit           # Hook de pré-commit
├── .vscode/                  # 📝 Configurações do VS Code
│   └── extensions.json      # Extensões recomendadas
├── docs/                     # 📚 Documentação técnica completa
│   ├── CURRENT_STATUS.md    # Estado atual do projeto
│   ├── FUTURE_BACKEND.md    # Roadmap e planos futuros
│   ├── INTEGRATION_GUIDE.md # Guia de integração externa
│   ├── STYLING_GUIDE.md     # Padrões de CSS Modules
│   └── NAMING_CONVENTIONS.md # Convenções de código
├── scripts/                  # 🛠️ Scripts utilitários
│   ├── env-setup.js         # Configuração de ambiente
│   └── env-validate.js      # Validação de ambiente
├── backend/                  # 🔧 Backend Node.js/Express (IMPLEMENTADO)
│   ├── src/                 # Código fonte do servidor
│   │   ├── config/          # Configurações de ambiente
│   │   ├── middleware/      # Middlewares Express
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Serviços e lógica de negócio
│   │   └── utils/           # Utilitários do servidor
│   ├── prisma/              # Schema do banco de dados
│   ├── Dockerfile           # Containerização
│   └── package.json         # Dependências do backend
├── src/
│   ├── App.css              # Estilos globais da aplicação
│   ├── App.tsx              # Componente raiz da aplicação
│   ├── index.css            # Estilos base e reset CSS
│   ├── vite-env.d.ts       # Declarações de tipos Vite
│   ├── app/                 # 🏠 Núcleo da aplicação
│   │   ├── contexts/        # React contexts (autenticação)
│   │   ├── providers/       # Providers da aplicação (Query, Store)
│   │   ├── router/          # Configuração de rotas + lazy loading
│   │   ├── stores/          # Zustand stores (estado global)
│   │   └── main.tsx         # Ponto de entrada
│   ├── assets/              # 🎨 Recursos estáticos (SVGs, imagens)
│   ├── pages/               # 📄 Páginas por feature (43 páginas TSX)
│   │   ├── auth/            # Sistema de autenticação (LoginPage)
│   │   ├── cadastros/       # Sistema de cadastros
│   │   ├── configuracoes/   # Configurações do sistema
│   │   ├── dashboard/       # Dashboard com 19 gráficos
│   │   ├── demandas/        # Gestão completa de demandas
│   │   ├── documentos/      # Gestão completa de documentos
│   │   └── relatorios/      # Análises e relatórios (AnalyticsPage)
│   ├── schemas/             # 📋 Definições de entidades TypeScript
│   └── shared/              # 🔄 Recursos compartilhados (77 componentes reutilizáveis)
│       ├── components/      # Componentes reutilizáveis
│       │   ├── auth/        # Sistema de autenticação
│       │   ├── charts/      # 19 gráficos ECharts customizados
│       │   ├── demands/     # Componentes específicos de demandas
│       │   ├── documents/   # Componentes específicos de documentos
│       │   ├── forms/       # Sistema de formulários avançado
│       │   ├── layout/      # Header/Sidebar responsivos
│       │   ├── pages/       # Componentes de página compartilhados
│       │   └── ui/          # Elementos básicos (Button, Modal, etc.)
│       ├── data/            # Dados mock realistas (100+ entidades)
│       ├── hooks/           # Custom hooks e utilitários
│       ├── services/        # Serviços, APIs e integrações
│       ├── styles/          # Design system + tokens CSS
│       ├── types/           # Definições TypeScript organizadas
│       └── utils/           # Funções utilitárias
├── .env.development         # Variáveis de ambiente para dev
├── .env.production          # Variáveis de ambiente para prod
└── .env.staging             # Variáveis de ambiente para staging
```

### Documentação Técnica Organizada

A documentação foi **completamente reorganizada** e está disponível em `docs/`:

- 📊 **[Status Atual](docs/CURRENT_STATUS.md)** - Estado real: frontend completo, backend Node.js implementado
- 🔮 **[Roadmap Backend](docs/FUTURE_BACKEND.md)** - Fases de desenvolvimento e arquiteturas planejadas
- 🔗 **[Guia de Integração](docs/INTEGRATION_GUIDE.md)** - Integração com sistemas externos (LDAP/OAuth2/APIs)
- 🎨 **[Guia de Estilos](docs/STYLING_GUIDE.md)** - CSS Modules, design tokens e padrões visuais
- 📝 **[Convenções](docs/NAMING_CONVENTIONS.md)** - Padrões de código, nomenclatura e boas práticas

### Funcionalidades por Módulo

#### 🏠 HomePage (Dashboard)
- **Análise de Demandas**: Gráficos de demandas por ano, status e tipos
- **Análise de Documentos**: Estatísticas de documentos, decisões judiciais e mídias
- **Análise de Provedores**: Performance, tempo de resposta e taxas de resposta
- **Quick Management**: Tabelas resumidas de demandas e documentos

#### 📋 Gestão de Demandas
- Criação e edição de demandas
- Acompanhamento de status
- Vinculação com documentos
- Filtros avançados

#### 📄 Gestão de Documentos
- Suporte a múltiplos tipos (Ofício, Circular, Mídia, etc.)
- Controle de destinatários
- Acompanhamento de respostas
- Integração com demandas

#### ⚙️ Configurações e Cadastros
- Gestão de assuntos
- Cadastro de órgãos e autoridades
- Configurações de provedores
- Personalização do sistema

## 🎨 Interface e Design

### Sistema de Layout
- **Header fixo** com navegação e branding
- **Sidebar responsiva** com colapso automático
- **Grid layouts** otimizados para diferentes proporções de cards
- **Design consistente** com tokens de design padronizados

### Gráficos e Visualizações
- **ECharts integrado** com componente wrapper otimizado
- **Gráficos responsivos** com alturas padronizadas (350px)
- **Tooltips informativos** com dados detalhados
- **Legendas posicionadas** para melhor aproveitamento do espaço
- **Sistema de filtros** dinâmico para análise de dados

## 🔐 Segurança

- **Content Security Policy (CSP)** implementado
- **Validação de tipos** com TypeScript
- **Sanitização de dados** nos componentes
- **Configurações de segurança** para produção

## 📊 Performance

- **Lazy Loading** de componentes de gráficos
- **Code Splitting** automático com Vite
- **Memoização** de cálculos pesados
- **Virtual DOM** otimizado do React
- **Hot Module Replacement (HMR)** para desenvolvimento

## 🧪 Qualidade de Código

### Ferramentas de Qualidade
- **TypeScript** para type safety
- **ESLint** configurado com regras personalizadas
- **Prettier** para formatação consistente
- **CSS Modules** para isolamento de estilos
- **Hooks personalizados** para lógica reutilizável

### Ferramentas de Testes Configuradas
- **Vitest 3** como test runner (configurado, sem testes implementados)
- **React Testing Library 16** para testes de componentes
- **Playwright 1.55** para testes end-to-end
- **Jest DOM matchers** para assertions específicas do DOM
- **Infraestrutura de testes** pronta para uso


## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📈 Roadmap

### ✅ **Implementado (Janeiro 2025)**
- [x] **Ferramentas de Teste** - Vitest + React Testing Library + Playwright (configurados)
- [x] **Arquitetura Organizada** - 255 arquivos TypeScript frontend + 11 backend
- [x] **Dashboard Avançado** - 19 gráficos interativos com ECharts
- [x] **Gestão Completa** - CRUD de demandas e documentos
- [x] **Interface Responsiva** - Design adaptativo com sidebar colapsável
- [x] **Sistema de Segurança** - CSP implementado e validações
- [x] **Documentação Técnica** - 6 guias completos organizados em `docs/`

### ⚠️ **Backend Estruturado (Não Funcional)**
- [x] **Código Backend** - 11 arquivos TypeScript estruturados 
- [x] **Schema Prisma** - Banco de dados modelado (Users, Demandas, Documentos)
- [x] **Rotas Definidas** - Auth, Demandas, Documentos, Users, Upload (código pronto)
- ❌ **Dependências Não Instaladas** - npm install necessário no diretório backend
- ❌ **Banco Não Configurado** - PostgreSQL e Redis não configurados

### 🚧 **Em Desenvolvimento**
- [ ] **Backend Funcional** - Instalar dependências e configurar banco de dados
- [ ] **Sistema de Autenticação** - JWT/OAuth2/LDAP integrado
- [ ] **Testes** - Implementação de testes unitários e de integração

### 🔮 **Futuras Expansões**
- [ ] **Notificações em Tempo Real** - WebSocket para colaboração
- [ ] **Exportação de Relatórios** - PDF/Excel com dados filtrados
- [ ] **PWA Avançada** - Funcionalidade offline e push notifications
- [ ] **Integração com Sistemas Externos** - APIs de órgãos públicos

---

**Desenvolvido por**: Alan G. Donato  
**Versão**: 0.0.0  
**Última atualização**: Janeiro 2025
