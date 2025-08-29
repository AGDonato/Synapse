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

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Testes**: Vitest + React Testing Library + Playwright
- **Gráficos**: ECharts (echarts-for-react)
- **Styling**: CSS Modules
- **Roteamento**: React Router
- **Estado**: Context API + Hooks
- **Linting**: ESLint
- **Formatação**: Prettier

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

### Estrutura de Diretórios

```
src/
├── components/          # Componentes reutilizáveis
│   ├── charts/         # Gráficos e visualizações
│   ├── forms/          # Componentes de formulário
│   ├── layout/         # Layout e navegação
│   └── ui/             # Elementos de interface
├── data/               # Dados mock e interfaces
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
├── services/           # Serviços e utilitários
├── styles/             # Estilos globais
├── test/               # Infraestrutura de testes
│   ├── components/     # Testes de componentes
│   ├── hooks/          # Testes de hooks
│   ├── services/       # Testes de serviços
│   ├── setup.ts        # Configuração inicial
│   └── utils.tsx       # Utilitários de teste
└── utils/              # Funções utilitárias
```

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

- [x] Testes automatizados (Vitest + React Testing Library + Playwright)
- [ ] Integração com backend/API
- [ ] Sistema de autenticação
- [ ] Notificações em tempo real
- [ ] Exportação de relatórios
- [ ] PWA (Progressive Web App)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- Desenvolvido com ❤️ para otimização de processos jurídicos/administrativos
- Assistido por Claude Code para desenvolvimento ágil e qualidade de código

---

**Desenvolvido por**: Alan G. Donato  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025