# Guia de Estilos - Synapse

## Filosofia de Estilização

Este projeto segue a abordagem de **CSS Modules** para manter os estilos organizados, modulares e reutilizáveis.

## 🏗️ Estrutura de Arquivos CSS Modules

### **Estilos Compartilhados (Arquitetura Consolidada)**
```
src/shared/styles/
├── shared.module.css    # Classes reutilizáveis (50+ componentes)
├── base.css            # Reset CSS e estilos globais
└── tokens.css          # Design tokens (cores, espaçamentos, tipografia)
```

### **Estilos por Componente (256+ Arquivos TypeScript)**
```
src/shared/components/
├── layout/             # Header, Sidebar, AppLayout
│   └── [Component].module.css
├── ui/                 # Button, Modal, StatusBadge, etc.
│   └── [Component].module.css
├── charts/             # 15+ gráficos ECharts customizados
│   └── [Chart].module.css
└── forms/              # SearchableSelect, FormGroup, etc.
    └── [Form].module.css
```

### **Estilos por Página (Quando Necessário)**
```
src/pages/
├── dashboard/          # Dashboard com gráficos - HomePage.module.css
├── demandas/           # Sistema de gestão - componentes específicos
├── documentos/         # Gestão de documentos - modais específicos
└── configuracoes/      # Configurações - seções específicas
```

## Regras de Boas Práticas

### ✅ O que FAZER

1. **Use CSS Modules sempre**
   ```tsx
   import styles from './Component.module.css';
   <div className={styles.container}>...</div>
   ```

2. **Prefira estilos compartilhados**
   ```tsx
   import sharedStyles from '../../../shared/styles/shared.module.css';
   <button className={sharedStyles.buttonPrimary}>Salvar</button>
   ```

3. **Use nomes de classes descritivos**
   ```css
   .pageHeader { /* ✅ Bom */ }
   .cardLink { /* ✅ Bom */ }
   .formGroup { /* ✅ Bom */ }
   ```

4. **Organize por responsabilidade**
   ```css
   /* Layout */
   .container { }
   .pageHeader { }
   
   /* Components */
   .card { }
   .button { }
   
   /* States */
   .isActive { }
   .isDisabled { }
   ```

### ❌ O que NÃO fazer

1. **Nunca use estilos inline**
   ```tsx
   // ❌ Evitar
   <div style={{ margin: '1rem', padding: '0.5rem' }}>
   
   // ✅ Usar
   <div className={styles.container}>
   ```

2. **Evite CSS global desnecessário**
   ```css
   /* ❌ Evitar em arquivos .module.css */
   div { margin: 0; }
   
   /* ✅ Use estilos específicos */
   .content { margin: 0; }
   ```

3. **Não crie arquivos CSS específicos para páginas simples**
   ```tsx
   // ❌ Se a página é simples
   import styles from './SimplePage.module.css';
   
   // ✅ Use estilos compartilhados
   import styles from '../../../shared/styles/shared.module.css';
   ```

## 🎨 Classes Compartilhadas Disponíveis (Sistema Consolidado)

### **Formulários**
- `.formGroup` - Container para label + input (usado em 25+ páginas)
- `.formLabel` - Estilo padrão para labels
- `.formInput` - Estilo padrão para inputs com validação
- `.formSelect` - Estilo padrão para selects
- `.searchableSelect` - SearchableSelect component customizado

### **Tabelas e Listagens**
- `.table` - Container da tabela responsivo
- `.tableHeader` - Células do cabeçalho com sorting
- `.tableCell` - Células do corpo
- `.tableRow` - Linhas da tabela com hover
- `.tablePagination` - Controles de paginação integrados

### **Cards e Layouts**
- `.card` - Card básico (usado em 50+ componentes)
- `.cardLink` - Card clicável com transições
- `.cardTitle` - Título do card padronizado
- `.cardDescription` - Descrição do card
- `.statCard` - Cards específicos para dashboard (métricas)

### **Sistema de Botões**
- `.button` - Botão base com states (hover, disabled)
- `.buttonPrimary` - Botão primário (azul #007bff)
- `.buttonSecondary` - Botão secundário (cinza #6c757d)
- `.buttonSuccess` - Botão de sucesso (#28a745)
- `.buttonDanger` - Botão de perigo (#dc3545)

### **Layout e Containers**
- `.pageHeader` - Cabeçalho padrão das páginas
- `.container` - Container genérico responsivo
- `.filterContainer` - Container para seção de filtros
- `.filterGrid` - Grid responsivo para filtros
- `.sectionHeader` - Cabeçalho de seções (usado no dashboard)

### **Navegação e Paginação**
- `.pagination` - Container da paginação
- `.paginationInfo` - Informações da página atual
- `.paginationControls` - Controles de navegação
- `.pageButton` - Botões de página com estados ativo/inativo

### **Estados e Indicadores**
- `.statusBadge` - Badge para status de demandas/documentos
- `.loading` - Estado de carregamento
- `.error` - Estado de erro
- `.empty` - Estado vazio (sem dados)

## Migração de Estilos Inline

### Antes (❌)
```tsx
const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1.5rem',
  marginBottom: '1rem',
};

<div style={cardStyle}>...</div>
```

### Depois (✅)
```tsx
import styles from '../../../shared/styles/shared.module.css';

<div className={styles.card}>...</div>
```

## 🚀 Benefícios desta Abordagem (Sistema Maduro)

1. **Reutilização**: Estilos compartilhados usados em 50+ componentes evitam duplicação
2. **Manutenção**: Mudanças centralizadas nos estilos compartilhados (256+ arquivos)
3. **Performance**: CSS Modules com classes únicas + tree shaking automático
4. **Developer Experience**: Autocompletar TypeScript + IntelliSense para classes CSS
5. **Bundle Size**: Otimização automática com Vite + remoção de CSS não utilizado
6. **Consistência**: Design system coerente em 25+ páginas e 15+ gráficos
7. **Escalabilidade**: Arquitetura preparada para crescimento do projeto
8. **Type Safety**: CSS Modules integrados com TypeScript para type checking

## 🎨 Sistema de Design Tokens

Use sempre os tokens definidos em `src/shared/styles/tokens.css`:

```css
/* === CORES DO SISTEMA === */
--color-primary: #007bff;      /* Azul principal */
--color-secondary: #6c757d;    /* Cinza secundário */
--color-success: #28a745;      /* Verde sucesso */
--color-danger: #dc3545;       /* Vermelho erro/perigo */
--color-warning: #ffc107;      /* Amarelo aviso */
--color-info: #17a2b8;         /* Azul informação */

/* === TIPOGRAFIA === */
--font-size-sm: 0.875rem;      /* 14px */
--font-size-base: 1rem;        /* 16px */
--font-size-lg: 1.125rem;      /* 18px */
--font-size-xl: 1.25rem;       /* 20px */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* === ESPAÇAMENTOS === */
--spacing-xs: 0.25rem;         /* 4px */
--spacing-sm: 0.5rem;          /* 8px */
--spacing-md: 1rem;            /* 16px */
--spacing-lg: 1.5rem;          /* 24px */
--spacing-xl: 2rem;            /* 32px */
--spacing-2xl: 3rem;           /* 48px */

/* === BORDAS E SOMBRAS === */
--border-radius-sm: 4px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
--border-radius-xl: 16px;
--box-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--box-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--box-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

/* === BREAKPOINTS RESPONSIVOS === */
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
```

## ✅ Checklist de Migração para CSS Modules

- [ ] Remover todos os estilos inline (`style={{ ... }}`)
- [ ] Converter classes globais para CSS Modules
- [ ] Usar tokens de design em vez de valores hard-coded
- [ ] Agrupar estilos relacionados em arquivos `.module.css`
- [ ] Testar responsividade em diferentes breakpoints
- [ ] Verificar acessibilidade (contraste, focus states)
- [ ] Validar performance (bundle size, lazy loading)

---

**Esta abordagem garante que o projeto Synapse (256+ arquivos TypeScript) seja escalável, manutenível e consistente em todas as 25+ páginas e 50+ componentes!** 🎨✨