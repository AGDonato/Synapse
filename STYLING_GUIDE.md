# Guia de Estilos - Synapse

## Filosofia de Estilização

Este projeto segue a abordagem de **CSS Modules** para manter os estilos organizados, modulares e reutilizáveis.

## Estrutura de Arquivos

### CSS Modules Compartilhados
- `src/styles/shared.module.css` - Estilos comuns reutilizáveis
- `src/styles/base.css` - Estilos globais da aplicação
- `src/styles/tokens.css` - Tokens de design (cores, espaçamentos, etc.)

### CSS Modules de Componentes
- `src/components/[component]/[Component].module.css` - Estilos específicos de componentes
- `src/pages/[Page].module.css` - Estilos específicos de páginas (apenas quando necessário)

## Regras de Boas Práticas

### ✅ O que FAZER

1. **Use CSS Modules sempre**
   ```tsx
   import styles from './Component.module.css';
   <div className={styles.container}>...</div>
   ```

2. **Prefira estilos compartilhados**
   ```tsx
   import sharedStyles from '../styles/shared.module.css';
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
   import styles from '../styles/shared.module.css';
   ```

## Classes Compartilhadas Disponíveis

### Formulários
- `.formGroup` - Container para label + input
- `.formLabel` - Estilo padrão para labels
- `.formInput` - Estilo padrão para inputs
- `.formSelect` - Estilo padrão para selects

### Tabelas
- `.table` - Container da tabela
- `.tableHeader` - Células do cabeçalho
- `.tableCell` - Células do corpo
- `.tableRow` - Linhas da tabela

### Cards
- `.card` - Card básico
- `.cardLink` - Card clicável
- `.cardTitle` - Título do card
- `.cardDescription` - Descrição do card

### Botões
- `.button` - Botão base
- `.buttonPrimary` - Botão primário (azul)
- `.buttonSecondary` - Botão secundário (cinza)

### Layout
- `.pageHeader` - Cabeçalho da página
- `.container` - Container genérico
- `.filterContainer` - Container para filtros
- `.filterGrid` - Grid para filtros

### Paginação
- `.pagination` - Container da paginação
- `.paginationInfo` - Informações da página
- `.paginationControls` - Controles de navegação
- `.pageButton` - Botões de página

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
import styles from '../styles/shared.module.css';

<div className={styles.card}>...</div>
```

## Benefícios desta Abordagem

1. **Reutilização**: Estilos compartilhados evitam duplicação
2. **Manutenção**: Mudanças centralizadas nos estilos compartilhados
3. **Performance**: CSS Modules geram classes únicas (evita conflitos)
4. **Developer Experience**: Autocompletar e type safety
5. **Bundle Size**: Remoção automática de CSS não utilizado
6. **Consistência**: Garantia de design system coerente

## Tokens de Design

Use sempre os tokens definidos em `tokens.css`:

```css
/* Cores */
--color-primary: #007bff;
--color-secondary: #6c757d;
--color-success: #28a745;
--color-danger: #dc3545;

/* Espaçamentos */
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Raios de borda */
--border-radius-sm: 4px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
```

Esta abordagem garante que o projeto seja escalável, manutenível e consistente! 🎨