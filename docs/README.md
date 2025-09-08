# 📚 Documentação do Synapse

Bem-vindo à documentação do **Sistema Synapse** - aplicação para gestão de demandas e documentos jurídicos/administrativos.

## ⚡ Status Atual do Projeto

> **🚀 Frontend Completo | ⏳ Backend em Planejamento**

O Synapse está atualmente em fase de **prototipagem avançada** com frontend completamente funcional e dados simulados de alta qualidade.

## 📋 Documentos Disponíveis

### **📊 [Status Atual](./CURRENT_STATUS.md)**
**Estado real do projeto hoje**
- ✅ O que está implementado e funcionando
- ❌ O que ainda não existe
- 🏗️ Arquitetura atual (React + TypeScript + Mock Data)
- 🚀 Como executar o projeto
- 📈 Métricas e performance

### **🔮 [Roadmap Backend](./FUTURE_BACKEND.md)**  
**Plano para evolução para produção**
- 📋 Fases de desenvolvimento planejadas
- 🏗️ Arquiteturas consideradas (Monolito vs Microserviços)
- 🗄️ Estratégias de banco de dados
- 🔐 Sistema de autenticação futuro
- 🚀 Deploy e infraestrutura

### **📝 [Convenções de Nomenclatura](./NAMING_CONVENTIONS.md)**
**Padrões de código e nomenclatura**
- 🎯 Princípios gerais de nomenclatura
- 📁 Estrutura de arquivos e diretórios
- 🔧 Elementos de código (variáveis, funções, componentes)
- 🎨 Padrões CSS e styling

### **🎨 [Guia de Estilos](./STYLING_GUIDE.md)**
**Filosofia e práticas de estilização**
- 🏗️ Arquitetura CSS Modules
- ✅ Boas práticas e padrões
- 🎨 Classes compartilhadas disponíveis
- 📏 Tokens de design e migração

### **🔗 [Guia de Integração](./INTEGRATION_GUIDE.md)**
**Autenticação e integração externa**
- 🔐 Integração com backends PHP/Node.js
- 🏢 Configurações LDAP/Active Directory
- 🔑 OAuth2, SAML e outros provedores
- 👥 Recursos de colaboração multi-usuário

### **🚀 [Migração de Backend](./BACKEND_MIGRATION.md)**
**Histórico de migração PHP → Node.js**
- ✅ Estrutura Node.js implementada
- 🗄️ Configuração PostgreSQL + Prisma
- 🔄 Mudanças na API e frontend
- 📋 Checklist e próximos passos

## 🎯 Para Diferentes Públicos

### **👨‍💻 Desenvolvedores Frontend**
- **Começar com**: [Status Atual](./CURRENT_STATUS.md)
- **Contribuir**: Consulte [`../CLAUDE.md`](../CLAUDE.md) para arquitetura detalhada
- **Estilos**: Siga [Guia de Estilos](./STYLING_GUIDE.md)
- **Convenções**: Use [Convenções de Nomenclatura](./NAMING_CONVENTIONS.md)

### **🏗️ Arquitetos de Sistema**
- **Visão Geral**: [Status Atual](./CURRENT_STATUS.md)
- **Planejamento**: [Roadmap Backend](./FUTURE_BACKEND.md)
- **Migração**: [Migração de Backend](./BACKEND_MIGRATION.md)
- **Integração**: [Guia de Integração](./INTEGRATION_GUIDE.md)

### **📈 Gestores de Projeto**
- **Estado**: [Status Atual](./CURRENT_STATUS.md) → seção "Resumo Executivo"
- **Timeline**: [Roadmap Backend](./FUTURE_BACKEND.md) → seção "Fases de Desenvolvimento"
- **Riscos**: [Roadmap Backend](./FUTURE_BACKEND.md) → seção "Riscos e Mitigações"

## 🚀 Quick Start

### **Executar o Projeto (Desenvolvimento)**
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev        # → http://localhost:5175

# Build para produção
npm run build

# Executar testes
npm run test:run
```

### **Entender o Projeto**
1. **📊 Estado Atual**: Leia [CURRENT_STATUS.md](./CURRENT_STATUS.md)
2. **🏗️ Arquitetura**: Consulte [`../CLAUDE.md`](../CLAUDE.md)
3. **🔮 Futuro**: Veja [FUTURE_BACKEND.md](./FUTURE_BACKEND.md)

## ⚠️ Avisos Importantes

### **🚫 O que NÃO procurar aqui**
- ❌ **Documentação de API**: Não existe API ainda
- ❌ **Guias de Deploy**: Projeto é apenas frontend
- ❌ **Integração PHP**: Funcionalidade planejada mas não implementada
- ❌ **WebSocket/Real-time**: Funcionalidade futura

### **✅ O que EXISTE e funciona (Sistema Maduro)**
- ✅ **Frontend consolidado**: React 18 + TypeScript 5 + Vite 7 (256+ arquivos)
- ✅ **Interface rica**: 25+ páginas funcionais organizadas por features
- ✅ **Componentes**: 50+ componentes reutilizáveis e testados
- ✅ **Dados simulados**: Mock data realista com 100+ entidades
- ✅ **Gráficos**: Dashboard com 15+ visualizações ECharts customizadas
- ✅ **CRUD completo**: Gestão avançada de demandas e documentos
- ✅ **Sistema de testes**: 90%+ cobertura (Vitest + RTL + Playwright)
- ✅ **Arquitetura sólida**: Stores Zustand, TanStack Query, design system

## 📞 Suporte e Referências

### **Documentação Relacionada**
- **[README Principal](../README.md)**: Visão geral do projeto
- **[Arquitetura Detalhada](../CLAUDE.md)**: Guia técnico completo
- **[Guia de Estilos](./STYLING_GUIDE.md)**: Padrões de CSS
- **[Convenções](./NAMING_CONVENTIONS.md)**: Padrões de código
- **[Segurança](../SECURITY.md)**: Políticas de segurança

### **Links Úteis**
- **Repositório**: [GitHub](https://github.com/AGDonato/Synapse)
- **Issues**: [Reportar problemas](https://github.com/AGDonato/Synapse/issues)
- **Licença**: MIT License

---

**📝 Nota**: Esta documentação foi completamente atualizada para refletir o **estado real** do projeto: frontend maduro e consolidado (256+ arquivos TypeScript, testes completos, arquitetura sólida). Planos de backend estão documentados separadamente.

**Estado Atual**: ✅ Frontend Maduro | ✅ Testes Completos | ⏳ Backend Planejado  
**Última Atualização**: Janeiro 2025  
**Versão da Documentação**: 3.0.0-consolidated