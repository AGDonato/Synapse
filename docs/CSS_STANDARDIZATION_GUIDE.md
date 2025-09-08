# 🎨 Guia de Padronização CSS - Projeto Synapse

## 📋 Status Atual

### ✅ **Implementado**
- **Design Tokens Expandidos**: +40 novos tokens semânticos em `design-tokens.css`
- **shared.module.css Migrado**: 100% dos hardcoded colors substituídos por tokens
- **Conflito Resolvido**: #007BFF vs #3b82f6 - mantido #3b82f6 como brand primary
- **Script de Validação**: `npm run validate-colors` detecta cores hardcoded automaticamente

### 🔄 **Em Progresso**
- **89 arquivos** ainda contêm cores hardcoded (de 311 analisados)
- **Top 5 cores** para migração: #007bff (96x), red (71x), #64748b (53x), #6b7280 (51x), #374151 (51x)

## 🎯 **Estratégia de Migração**

### **Mapeamento de Cores Legacy → Tokens**

#### **Cores Bootstrap → Design Tokens**
```css
/* Antes */                    /* Depois */
#007bff                   →   var(--interactive-primary)
#0056b3                   →   var(--interactive-primary-hover) 
#6c757d                   →   var(--color-neutral-500)
#f8f9fa                   →   var(--bg-secondary)
#dee2e6                   →   var(--border-primary)
#495057                   →   var(--color-neutral-600)
#ccc                      →   var(--form-border)
```

#### **Tailwind Colors → Design Tokens**
```css
/* Antes */                    /* Depois */
#374151                   →   var(--color-neutral-700)
#6b7280                   →   var(--color-neutral-500)
#e5e7eb                   →   var(--color-neutral-200)
#f3f4f6                   →   var(--color-neutral-100)
#64748b                   →   var(--text-secondary)
```

#### **Cores de Status**
```css
/* Antes */                    /* Depois */
#28a745                   →   var(--color-success-600)
#dc3545                   →   var(--color-error-600)
#ffc107                   →   var(--color-warning-500)
#6f42c1                   →   var(--color-purple-600)
```

### **Named Colors → Semantic Tokens**
```css
/* Antes */                    /* Depois */
red                       →   var(--color-error-600)
green                     →   var(--color-success-600)
blue                      →   var(--color-brand-600)
yellow                    →   var(--color-warning-500)
```

## 🛠️ **Novos Design Tokens Disponíveis**

### **Form Components**
```css
--form-border: var(--color-neutral-300);
--form-border-focus: var(--color-brand-500);
--form-bg: var(--color-neutral-0);
--form-text: var(--color-neutral-700);
--form-placeholder: var(--color-neutral-500);
```

### **Table Components**
```css
--table-bg: var(--color-neutral-0);
--table-header-bg: var(--color-neutral-50);
--table-border: var(--color-neutral-200);
--table-hover-bg: var(--color-neutral-50);
--table-text: var(--color-neutral-800);
--table-header-text: var(--color-neutral-600);
```

### **Card Components**
```css
--card-bg: var(--color-neutral-0);
--card-border: var(--color-neutral-200);
--card-title: var(--color-neutral-900);
--card-description: var(--color-neutral-600);
--card-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### **Button Components**
```css
--button-primary-bg: var(--color-brand-600);
--button-primary-hover: var(--color-brand-700);
--button-primary-text: var(--color-neutral-0);
--button-secondary-bg: var(--color-neutral-500);
--button-secondary-hover: var(--color-neutral-600);
--button-secondary-text: var(--color-neutral-0);
```

### **Status Components**
```css
--status-success-bg: var(--color-success-50);
--status-success-text: var(--color-success-700);
--status-success-border: var(--color-success-200);
--status-error-bg: var(--color-error-50);
--status-error-text: var(--color-error-700);
--status-error-border: var(--color-error-200);
```

## 📊 **Prioridades de Migração**

### **Fase 1 - Crítica (Impacto Alto)**
1. **NovoDocumentoPage.module.css** - 49 cores hardcoded
2. **DetalheDocumentoPage.module.css** - 41 cores hardcoded  
3. **DocumentosPage.module.css** - 28 cores hardcoded
4. **DetalheDemandaPage.module.css** - 25 cores hardcoded

### **Fase 2 - Importante (Componentes Reutilizáveis)**
1. **DataTable.module.css** - 13 cores hardcoded
2. **NotificationCenter.module.css** - 27 cores hardcoded
3. **SavedFiltersPanel.module.css** - 20 cores hardcoded
4. **GlobalSearch.module.css** - 14 cores hardcoded

### **Fase 3 - Utilitários**
1. **statusUtils.ts** - 7 cores hardcoded
2. **documentStatusUtils.ts** - 8 cores hardcoded
3. **logger.ts** - 6 cores hardcoded

## 🔧 **Processo de Migração**

### **1. Identificar Cores**
```bash
npm run validate-colors
# Foco nos Top 10 mais usados
```

### **2. Mapear para Tokens**
```css
/* Exemplo de migração */
.oldClass {
  /* ❌ Antes */
  color: #6c757d;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  
  /* ✅ Depois */
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}
```

### **3. Testar Dark Mode**
```css
/* Verificar se funciona em ambos os temas */
[data-theme='light'] .component { /* ... */ }
[data-theme='dark'] .component { /* ... */ }
```

### **4. Validar Resultado**
```bash
npm run validate-colors
# Verificar redução de cores hardcoded
```

## 🎨 **Casos Especiais**

### **Transparências e Shadows**
```css
/* ✅ Permitidas - funcionalidade específica */
rgba(0, 0, 0, 0.1)     → Shadow overlays
rgba(59, 130, 246, 0.25) → Focus rings
transparent             → Backgrounds especiais
```

### **Chart Colors**
```css
/* ✅ Excluídas do audit - mantém cores funcionais */
#3b82f6, #10b981, #f59e0b, #ef4444, #8b5cf6
```

### **CSS-in-JS**
```typescript
// Para arquivos .ts/.tsx com cores inline
const statusColors = {
  // ❌ Antes
  success: '#28a745',
  error: '#dc3545',
  
  // ✅ Depois - usar CSS variables
  success: 'var(--color-success-600)',
  error: 'var(--color-error-600)',
}
```

## 📈 **Métricas de Sucesso**

### **Antes da Migração**
- 311 arquivos analisados
- 89 arquivos com problemas (28.6%)
- 309 cores hardcoded únicas
- #007BFF usado 100x (conflito com brand)

### **Meta Pós-Migração**
- < 20 arquivos com problemas (6.4%)
- < 50 cores hardcoded únicas (redução 84%)
- 0 conflitos de brand color
- 100% cobertura dark mode

### **Fase 1 Completa (shared.module.css)**
- ✅ 37 cores hardcoded → 0 cores hardcoded
- ✅ Conflito #007BFF resolvido
- ✅ Dark mode compatível
- ✅ 25+ novos tokens semânticos

## 🚀 **Comandos Úteis**

```bash
# Análise completa de cores
npm run analyze-colors

# Validação rápida
npm run validate-colors  

# Teste desenvolvimento
npm run dev

# Verificação de tipos
npm run type-check

# Build production
npm run build
```

## 📚 **Recursos Adicionais**

- **Design Tokens**: `src/shared/styles/design-tokens.css`
- **Audit Reports**: `docs/COLOR_AUDIT_REPORT.md`
- **Chart Guidelines**: `docs/CHART_COLORS_GUIDE.md`
- **Validation Script**: `scripts/validate-colors.js`

## 🎯 **Próximos Passos**

1. **Migrar Páginas Críticas**: NovoDocumento, DetalheDocumento
2. **Componentes Reutilizáveis**: DataTable, NotificationCenter  
3. **Utilitários de Status**: statusUtils, documentStatusUtils
4. **Validação Final**: Meta < 20 arquivos com problemas
5. **Documentação**: Update styling guide com novos padrões

---

**🎨 Objetivo Final**: Sistema CSS unificado, manutenível e com suporte completo a dark mode através de design tokens padronizados.