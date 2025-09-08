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
- **React 18** + **TypeScript 5** - Framework principal com type safety completa
- **Vite 7** - Build tool moderna com HMR otimizado

### Testes (Sistema Completo)
- **Vitest 3** - Test runner principal com cobertura de código
- **React Testing Library 16** - Testes de componentes React
- **Playwright 1.55** - Testes end-to-end automatizados
- **@testing-library/jest-dom** - Matchers customizados para DOM

### Estado e Dados
- **Zustand** - Gerenciamento de estado global moderno
- **TanStack React Query 5** - Cache e sincronização de dados
- **React Hook Form** - Gestão de formulários performática
- **Zod** - Validação de schemas TypeScript-first

### UI e Visualização
- **ECharts + echarts-for-react** - Gráficos interativos avançados
- **CSS Modules** - Estilização isolada e modular
- **Tailwind-merge + Class Variance Authority** - Utility CSS otimizado
- **Lucide React** - Ícones modernos e otimizados

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
npm run build        # Build para produção
npm run lint         # Verificação de código
npm run preview      # Preview da build
npm run export-tree  # Gera documentação da estrutura
```

### Testes
```bash
npm run test         # Testes em modo watch
npm run test:run     # Executa testes uma vez
npm run test:coverage # Testes com relatório de cobertura
npm run test:ui      # Interface gráfica dos testes (Vitest UI)
npm run test:unit    # Apenas testes unitários
npm run test:e2e     # Testes end-to-end (Playwright)
npm run test:fast    # Execução rápida com reporter mínimo
npm run test:ci      # Executar no CI com coverage JSON
```

## 🏗️ Arquitetura

### Arquitetura Consolidada (2025)
O projeto passou por uma **reorganização completa da estrutura de pastas** com foco em manutenibilidade e clara separação de responsabilidades:

- **256+ arquivos TypeScript/TSX** organizados por features
- **Sistema de documentação técnica** completo em `docs/`
- **Arquitetura baseada em features** com recursos compartilhados
- **Testes integrados** em toda a estrutura

### Estrutura de Diretórios

```
📁 Raiz do Projeto
├── docs/                     # 📚 Documentação técnica completa
│   ├── CURRENT_STATUS.md    # Estado atual do projeto
│   ├── FUTURE_BACKEND.md    # Roadmap e planos futuros
│   ├── INTEGRATION_GUIDE.md # Guia de integração externa
│   ├── STYLING_GUIDE.md     # Padrões de CSS Modules
│   └── NAMING_CONVENTIONS.md # Convenções de código
├── src/
│   ├── app/                 # 🏠 Núcleo da aplicação
│   │   ├── contexts/        # React contexts (autenticação)
│   │   ├── router/          # Configuração de rotas + lazy loading
│   │   ├── stores/          # Zustand stores (estado global)
│   │   ├── App.tsx          # Componente raiz
│   │   └── main.tsx         # Ponto de entrada
│   ├── shared/              # 🔄 Recursos compartilhados (50+ componentes)
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   ├── auth/       # Sistema de autenticação
│   │   │   ├── charts/     # 15+ gráficos ECharts customizados
│   │   │   ├── demands/    # Componentes específicos de demandas
│   │   │   ├── documents/  # Componentes específicos de documentos
│   │   │   ├── forms/      # Sistema de formulários avançado
│   │   │   ├── layout/     # Header/Sidebar responsivos
│   │   │   └── ui/         # Elementos básicos (Button, Modal, etc.)
│   │   ├── data/           # Dados mock realistas (100+ entidades)
│   │   ├── hooks/          # Custom hooks e utilitários
│   │   ├── services/       # Serviços, APIs e integrações
│   │   ├── styles/         # Design system + tokens CSS
│   │   ├── types/          # 50+ definições TypeScript
│   │   └── utils/          # Funções utilitárias
│   ├── pages/              # 📄 Páginas por feature (25+ páginas)
│   │   ├── cadastros/      # Sistema de cadastros
│   │   ├── configuracoes/  # Configurações do sistema
│   │   ├── dashboard/      # Dashboard com 15+ gráficos
│   │   ├── demandas/       # Gestão completa de demandas
│   │   └── documentos/     # Gestão completa de documentos
│   └── test/               # 🧪 Infraestrutura de testes
│       ├── components/     # Testes de componentes React
│       ├── hooks/          # Testes de hooks customizados
│       ├── services/       # Testes de lógica de negócio
│       ├── setup.ts        # Configuração global Vitest
│       └── utils.tsx       # Utilitários de teste + TestWrapper
└── .github/                 # 🔧 Configurações CI/CD
    └── pull_request_template.md
```

### Documentação Técnica Organizada

A documentação foi **completamente reorganizada** e está disponível em `docs/`:

- 📊 **[Status Atual](docs/CURRENT_STATUS.md)** - Estado real: frontend completo, backend planejado
- 🔮 **[Roadmap Backend](docs/FUTURE_BACKEND.md)** - Fases de desenvolvimento e arquiteturas
- 🔗 **[Guia de Integração](docs/INTEGRATION_GUIDE.md)** - Integração com PHP/Node.js/LDAP/OAuth2
- 🎨 **[Guia de Estilos](docs/STYLING_GUIDE.md)** - CSS Modules e design tokens
- 📝 **[Convenções](docs/NAMING_CONVENTIONS.md)** - Padrões de código e nomenclatura
- 🚀 **[Migração Backend](docs/BACKEND_MIGRATION.md)** - Histórico PHP → Node.js

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

### Melhorias Recentes
- ✅ Layout grid fixo para pares de cards (65/35 e 50/50)
- ✅ Altura uniforme de gráficos (350px) na análise de provedores
- ✅ Espaçamento otimizado entre seções (1rem padrão)
- ✅ Legendas posicionadas em top: 20 para melhor aproveitamento
- ✅ Margens de cabeçalho reduzidas (0.5rem) para mais conteúdo
- ✅ Estatísticas integradas no card Decisões Judiciais

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

### Sistema de Testes
- **Vitest** como test runner principal
- **React Testing Library** para testes de componentes
- **Playwright** para testes end-to-end
- **Jest DOM matchers** para assertions específicas do DOM
- **Cobertura de código** automatizada
- **Test fixtures** e mocks organizados
- **Testes unitários** para hooks, services e utilitários
- **Testes de integração** para fluxos complexos

### Estrutura de Testes
```
src/test/
├── components/     # Testes de componentes UI
├── hooks/          # Testes de hooks customizados  
├── services/       # Testes de lógica de negócio
├── setup.ts        # Configuração global dos testes
└── utils.tsx       # TestWrapper e utilitários
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📈 Roadmap

### ✅ **Implementado (2024-2025)**
- [x] **Sistema de Testes Completo** - Vitest + React Testing Library + Playwright
- [x] **Arquitetura Consolidada** - 256+ arquivos TypeScript organizados
- [x] **Dashboard Avançado** - 15+ gráficos interativos com ECharts
- [x] **Gestão Completa** - CRUD de demandas e documentos
- [x] **Interface Responsiva** - Design adaptativo com sidebar colapsável
- [x] **Sistema de Segurança** - CSP implementado e validações
- [x] **Documentação Técnica** - Guias completos organizados em `docs/`

### 🚧 **Em Desenvolvimento**
- [ ] **Integração com Backend/API** - Migração de dados mock para API real
- [ ] **Sistema de Autenticação** - JWT/OAuth2/LDAP integrado
- [ ] **Upload de Arquivos** - Gestão de documentos com storage

### 🔮 **Futuras Expansões**
- [ ] **Notificações em Tempo Real** - WebSocket para colaboração
- [ ] **Exportação de Relatórios** - PDF/Excel com dados filtrados
- [ ] **PWA Avançada** - Funcionalidade offline e push notifications
- [ ] **Integração com Sistemas Externos** - APIs de órgãos públicos

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- Desenvolvido com ❤️ para otimização de processos jurídicos/administrativos
- Assistido por Claude Code para desenvolvimento ágil e qualidade de código

---

**Desenvolvido por**: Alan G. Donato  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025